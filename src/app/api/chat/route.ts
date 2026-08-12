import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { CORPUS, CORPUS_DISPONIBLE } from "@/lib/corpus";
import { ANNEES, trouverEpreuve } from "@/lib/epreuves";
import { TERMES, fichesParTermes, tirerFlashcards } from "@/lib/flashcards";
import type { Trame } from "@/lib/flux";
import { MODELE, reglagesModele } from "@/lib/modele";
import { SYSTEM_PROMPT, consigneNiveau, type Niveau } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

// Construction paresseuse : `new Anthropic()` lève si la clé est absente.
// Au niveau module, cela ferait planter l'import de la route et court-circuiterait
// la gestion d'erreur ci-dessous — le candidat verrait une trace, pas un message.
let clientMemo: Anthropic | null = null;
function getClient() {
  if (!clientMemo) clientMemo = new Anthropic();
  return clientMemo;
}

// Le modèle et ses paramètres de réflexion sont résolus ensemble : Haiku 4.5
// rejette `thinking: adaptive` et `output_config.effort` (voir lib/modele.ts).

type Entrant = {
  role: "user" | "assistant";
  content: string;
  /** Renvoyé par le client pour les messages déjà marqués comme relances. */
  relance?: number;
};

/**
 * Numéro de la tentative en cours.
 *
 * Le modèle sait dire *si* son message est une relance ; il compte mal
 * *combien* il en a déjà faites — testé, il annonce « 1 » à la deuxième. On
 * ne lui laisse donc que la décision binaire et on remonte l'historique :
 * chaque relance consécutive du tuteur compte pour une tentative, jusqu'à un
 * message qui n'en était pas une (une correction remet le compteur à zéro).
 */
function tentativeCourante(entrants: Entrant[]): number {
  let n = 0;
  for (let i = entrants.length - 1; i >= 0; i--) {
    const m = entrants[i];
    if (m.role !== "assistant") continue;
    if (!m.relance) break;
    n++;
  }
  return n + 1;
}

const OUTIL_EPREUVE = "fournir_epreuve";
const OUTIL_FICHES = "fournir_flashcards";

/**
 * Marqueur que le modèle place en tête d'une relance maïeutique. Il est
 * retiré du texte avant affichage : le candidat ne doit jamais le voir.
 */
const MARQUEUR_RELANCE = /^\s*\[relance\s*:\s*([1-9])\s*\]\s*/i;

/**
 * Demande explicite d'épreuve.
 *
 * Le modèle a l'annale entière dans son contexte : rien ne l'empêche
 * d'annoncer une épreuve et d'en poser la première question sans appeler
 * l'outil — le candidat voit alors le tuteur parler d'un sujet qui n'est
 * affiché nulle part. Le prompt le demande, mais une consigne n'est pas une
 * garantie. Quand l'intention est explicite, on force l'appel.
 */
// `\b` de JavaScript ne connaît que [A-Za-z0-9_] : « épreuve » ne franchit
// jamais une limite de mot, et une regex en `\b` échoue silencieusement sur
// l'orthographe accentuée — c'est-à-dire sur presque toutes les demandes
// réelles. D'où les délimiteurs en `\p{L}`.
const MOT_EPREUVE =
  /(?<!\p{L})([ée]preuves?|sujets?|annales?|ancien(?:ne)?s?\s+examens?)(?!\p{L})/iu;

// Le mot seul ne suffit pas : le candidat qui commente l'épreuve affichée
// (« dans l'épreuve, je crois que… ») ne demande pas à en recevoir une autre.
// Il faut une intention de demande, ou un message assez court pour n'être
// qu'une demande (« épreuve 2021 stp »).
const INTENTION_DEMANDE =
  /(?<!\p{L})(donnes?|montres?|envoies?|proposes?|affiches?|sors|veux|voudrais|aimerais|besoin|obtenir|avoir|passer|cherche|pr[ée]sente|autre)(?!\p{L})/iu;

function demandeEpreuve(message: string): boolean {
  if (!MOT_EPREUVE.test(message)) return false;
  // Une année nommée qui n'existe pas dans le recueil : ne pas forcer. L'outil
  // n'accepte que des années valides, le modèle en choisirait donc une autre
  // et servirait 2012 à qui demande 2013, sans le dire.
  const annee = message.match(/(?<!\d)(19|20)\d{2}(?!\d)/)?.[0];
  if (annee && !ANNEES.includes(annee)) return false;

  return (
    INTENTION_DEMANDE.test(message) || message.trim().split(/\s+/).length <= 5
  );
}

// Même garantie pour les fiches : sans forçage, le modèle répond parfois par
// une question au lieu d'afficher le paquet, et le candidat repart les mains
// vides après avoir appuyé sur « Réviser ».
const MOT_FICHES =
  /(?<!\p{L})(flash\s?cards?|fiches?|cartes?\s+de\s+r[ée]vision|vocabulaire)(?!\p{L})/iu;

function demandeFiches(message: string): boolean {
  if (!MOT_FICHES.test(message)) return false;
  return (
    INTENTION_DEMANDE.test(message) ||
    /(?<!\p{L})(pr[ée]pares?|r[ée]vise[rz]?|entra[iî]ne)(?!\p{L})/iu.test(message) ||
    message.trim().split(/\s+/).length <= 5
  );
}

/**
 * L'outil ne *produit* pas l'épreuve : il demande au serveur d'en afficher
 * une, prise littéralement dans le corpus. Le modèle choisit laquelle, jamais
 * son contenu — c'est ce qui rend la fidélité vérifiable.
 */
const OUTILS: Anthropic.Tool[] = [
  {
    name: OUTIL_EPREUVE,
    description:
      "Affiche au candidat le texte intégral d'une ancienne épreuve du DT HR, " +
      "tel qu'il figure dans le recueil officiel. Utilise cet outil dès que le " +
      "candidat demande une épreuve, un sujet, une annale ou un ancien examen. " +
      "N'écris jamais un énoncé toi-même : il serait approximatif et le " +
      "candidat réviserait sur un faux sujet.",
    input_schema: {
      type: "object",
      properties: {
        annee: {
          type: "string",
          description: `Année de la session souhaitée. Années disponibles : ${ANNEES.join(", ")}. Omets ce paramètre pour la plus récente.`,
          enum: ANNEES,
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: OUTIL_FICHES,
    description:
      "Affiche au candidat un paquet de flashcards recto/verso (terme au recto, " +
      "définition au verso), tirées mot pour mot du vocabulaire de l'annale. " +
      "Utilise cet outil dès qu'il demande des flashcards, des fiches, ou de " +
      "quoi réviser le vocabulaire. N'invente jamais de définition toi-même.",
    input_schema: {
      type: "object",
      properties: {
        termes: {
          type: "array",
          items: { type: "string", enum: TERMES },
          description:
            "Termes à réviser, choisis par toi dans la liste. Six font un bon " +
            "paquet. Si le candidat demande un thème (le paiement, la " +
            "réservation, l'accueil…), sélectionne les termes qui en relèvent : " +
            "toi seul sais les rapprocher, une recherche par mot-clé échouerait. " +
            "Sans thème précis, prends un éventail couvrant tout le programme.",
        },
      },
      required: ["termes"],
      additionalProperties: false,
    },
  },
];

export async function POST(req: NextRequest) {
  // Le SDK ne résout les identifiants qu'au moment de la requête, c'est-à-dire
  // après l'envoi des en-têtes du flux : une clé manquante coupe alors la
  // connexion au lieu de renvoyer un code. On vérifie donc en amont.
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error(
      "ANTHROPIC_API_KEY absente — copie .env.example vers .env.local et renseigne la clé.",
    );
    return new Response("Configuration du serveur incomplète.", { status: 500 });
  }

  let corps: { messages?: Entrant[]; niveau?: Niveau | null };
  try {
    corps = await req.json();
  } catch {
    return new Response("Requête illisible.", { status: 400 });
  }

  const entrants = corps.messages;
  if (!Array.isArray(entrants) || entrants.length === 0) {
    return new Response("Aucun message.", { status: 400 });
  }

  const messages: Anthropic.MessageParam[] = entrants
    .filter((m) => typeof m.content === "string" && m.content.trim() !== "")
    .map((m) => ({ role: m.role, content: m.content }));

  if (messages.length === 0 || messages[0].role !== "user") {
    return new Response("Le fil doit commencer par un message du candidat.", {
      status: 400,
    });
  }

  // Le niveau est spécifique au candidat : il reste hors du prompt système,
  // sinon chaque candidat aurait son propre préfixe et le cache ne servirait
  // plus à rien. Il est préfixé au premier message du fil.
  const consigne = consigneNiveau(corps.niveau ?? null);
  if (consigne) {
    const premier = messages[0];
    messages[0] = {
      role: "user",
      content: `[Contexte pour toi, pas pour le candidat : ${consigne}]\n\n${premier.content}`,
    };
  }

  // Le dernier message du candidat décide : lui seul exprime l'intention du
  // tour en cours. Sans épreuve chargée, on ne force rien — l'outil ne
  // pourrait que répondre en erreur.
  const dernierDuCandidat = entrants.filter((m) => m.role === "user").at(-1);
  const tentative = tentativeCourante(entrants);
  const dit = typeof dernierDuCandidat?.content === "string" ? dernierDuCandidat.content : "";
  const forcerEpreuve = ANNEES.length > 0 && demandeEpreuve(dit);
  // Un seul outil peut être imposé : l'épreuve prime, elle est plus explicite.
  const forcerFiches = !forcerEpreuve && TERMES.length > 0 && demandeFiches(dit);

  // Le point de cache est sur le dernier bloc système : il couvre le prompt
  // et l'annale. Le préfixe est identique pour tous les candidats, donc le
  // cache est partagé — on l'écrit une fois, tout le monde le lit. TTL 1 h :
  // le trafic d'une app de révision est irrégulier, 5 minutes manqueraient
  // la plupart des lectures.
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: SYSTEM_PROMPT },
    ...(CORPUS_DISPONIBLE
      ? [
          {
            type: "text" as const,
            text: `DOCUMENTATION PRIVÉE — LE CANDIDAT NE LA VOIT PAS.

Ce qui suit est l'annale de référence, fournie à toi seul. Elle n'est affichée nulle part dans l'application et ne fait pas partie de votre conversation : le candidat n'y a aucun accès et ne peut rien y chercher.

Ne dis donc jamais « je t'ai fourni », « regarde plus haut », « dans le document ci-dessus », « cherche dans le résumé de cours ». Ces phrases envoient le candidat chercher quelque chose qui n'existe pas pour lui. Quand tu as besoin d'un passage, d'une liste ou d'une définition, écris-le toi-même dans ton message.

La seule chose de ce document que le candidat voit un jour, c'est une épreuve, et seulement quand tu l'affiches avec l'outil \`fournir_epreuve\`.

Appuie-toi dessus en priorité : c'est le programme réellement enseigné et évalué au Bénin. Si une question en sort, dis-le plutôt que d'extrapoler.

${CORPUS}`,
            cache_control: { type: "ephemeral" as const, ttl: "1h" as const },
          },
        ]
      : []),
  ];

  try {
    const encodeur = new TextEncoder();
    const corpsFlux = new ReadableStream<Uint8Array>({
      async start(controleur) {
        // Flux en JSON par lignes : il transporte à la fois le texte du
        // tuteur et l'énoncé d'une épreuve, que le candidat doit recevoir
        // littéralement et non reformulé par le modèle.
        const envoyer = (trame: Trame) =>
          controleur.enqueue(encodeur.encode(`${JSON.stringify(trame)}\n`));

        try {
          // Les deux tours alimentent la même bulle côté candidat : sans
          // séparateur, la phrase d'annonce du premier se colle au texte du
          // second (« Laquelle veux-tu réviser ?Voici l'épreuve… »).
          let dejaEcrit = false;

          // Deux tours au plus : le premier peut demander une épreuve, le
          // second enchaîne sur la première question posée au candidat.
          for (let tour = 0; tour < 2; tour++) {
            const flux = getClient().messages.stream({
              model: MODELE,
              system,
              tools: OUTILS,
              // Au premier tour seulement : une demande explicite d'épreuve
              // impose l'outil. Ensuite `auto`, sinon le tuteur ré-afficherait
              // l'épreuve au lieu d'enchaîner sur la question suivante.
              tool_choice:
                tour === 0 && forcerEpreuve
                  ? { type: "tool", name: OUTIL_EPREUVE }
                  : tour === 0 && forcerFiches
                    ? { type: "tool", name: OUTIL_FICHES }
                    : { type: "auto" },
              ...reglagesModele(),
              messages,
            });

            // Le marqueur de relance arrive en tête de message. Tant qu'on ne
            // peut pas trancher, on retient le texte : sinon « [relance:2] »
            // s'afficherait à l'écran avant d'être reconnu et retiré.
            let tete = "";
            let tranche = false;

            const libere = (texte: string) => {
              envoyer({ t: "txt", v: texte });
              dejaEcrit = dejaEcrit || texte.trim() !== "";
            };

            const pousser = (texte: string) => {
              if (tranche) return libere(texte);

              tete += texte;
              const m = tete.match(MARQUEUR_RELANCE);
              if (m) {
                // Le numéro écrit par le modèle est ignoré : seul compte le
                // fait qu'il ait marqué le message.
                envoyer({ t: "rel", v: tentative });
                tranche = true;
                const reste = tete.slice(m[0].length);
                if (reste) libere(reste);
                return;
              }
              // Assez de texte pour être certain que ce n'en est pas un.
              if (tete.length >= 20 || tete.includes("\n")) {
                tranche = true;
                libere(tete);
              }
            };

            for await (const evenement of flux) {
              if (
                evenement.type === "content_block_delta" &&
                evenement.delta.type === "text_delta"
              ) {
                pousser(evenement.delta.text);
              }
            }

            // Message plus court que le seuil : il n'a jamais été libéré.
            if (!tranche && tete) libere(tete);

            const final = await flux.finalMessage();

            // Le modèle peut décliner une requête (HTTP 200, stop_reason
            // refusal). Sans ce garde-fou, le candidat verrait une bulle vide.
            if (final.stop_reason === "refusal") {
              envoyer({
                t: "txt",
                v: "Je ne peux pas traiter cette demande. Reformule-la, ou revenons au programme de Technologie Hôtelière.",
              });
              break;
            }

            if (final.stop_reason !== "tool_use") break;

            const resultats: Anthropic.ToolResultBlockParam[] = [];
            for (const bloc of final.content) {
              if (bloc.type !== "tool_use") continue;

              if (bloc.name === OUTIL_FICHES) {
                const entree = bloc.input as
                  | { termes?: string[]; sujet?: string; nombre?: number }
                  | null;
                // Les termes choisis par le modèle priment ; le tirage par
                // mot-clé n'est qu'un repli.
                const choisis = Array.isArray(entree?.termes)
                  ? fichesParTermes(entree.termes)
                  : [];
                const paquet =
                  choisis.length > 0
                    ? choisis
                    : tirerFlashcards(entree?.sujet, entree?.nombre ?? 6);

                if (paquet.length === 0) {
                  resultats.push({
                    type: "tool_result",
                    tool_use_id: bloc.id,
                    is_error: true,
                    content: "Aucune fiche disponible : le vocabulaire de l'annale n'a pas pu être chargé.",
                  });
                  continue;
                }

                envoyer({ t: "fic", v: paquet });
                resultats.push({
                  type: "tool_result",
                  tool_use_id: bloc.id,
                  content: `${paquet.length} fiches viennent d'être affichées au candidat : ${paquet
                    .map((f) => f.terme)
                    .join(", ")}. Ne les recopie pas. Dis-lui en une phrase comment s'en servir, puis laisse-le travailler.`,
                });
                continue;
              }

              if (bloc.name !== OUTIL_EPREUVE) continue;

              const annee = (bloc.input as { annee?: string } | null)?.annee;
              const epreuve = trouverEpreuve(annee);

              if (!epreuve) {
                resultats.push({
                  type: "tool_result",
                  tool_use_id: bloc.id,
                  is_error: true,
                  content: `Aucune épreuve pour cette année. Années disponibles : ${ANNEES.join(", ")}.`,
                });
                continue;
              }

              // L'énoncé part vers l'écran du candidat, pas vers le modèle :
              // c'est ce qui garantit qu'il le lit mot pour mot.
              envoyer({ t: "epr", v: epreuve });

              // Le modèle, lui, ne reçoit qu'un accusé. L'énoncé est déjà
              // dans l'annale de son contexte : le lui renvoyer ici doublerait
              // le coût et l'inciterait à le recopier dans sa réponse.
              resultats.push({
                type: "tool_result",
                tool_use_id: bloc.id,
                content: `L'épreuve DT HR ${epreuve.annee} vient d'être affichée en entier au candidat. Ne la recopie pas. Annonce-la en une phrase, puis pose la toute première question de l'énoncé, seule.`,
              });
            }

            if (resultats.length === 0) break;

            if (dejaEcrit) envoyer({ t: "txt", v: "\n\n" });

            messages.push({ role: "assistant", content: final.content });
            messages.push({ role: "user", content: resultats });
          }

          controleur.close();
        } catch (erreur) {
          controleur.error(erreur);
        }
      },
    });

    return new Response(corpsFlux, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        // Évite la mise en tampon par les proxys : le premier mot doit partir vite.
        "X-Accel-Buffering": "no",
      },
    });
  } catch (erreur) {
    // Clé absente (levée par le constructeur) ou refusée par l'API.
    if (
      erreur instanceof Anthropic.AuthenticationError ||
      (erreur instanceof Error && /ANTHROPIC_API_KEY/.test(erreur.message))
    ) {
      console.error("ANTHROPIC_API_KEY absente ou invalide.");
      return new Response("Configuration du serveur incomplète.", {
        status: 500,
      });
    }
    if (erreur instanceof Anthropic.RateLimitError) {
      return new Response("Trop de demandes en ce moment. Réessaie dans un instant.", {
        status: 429,
      });
    }
    if (erreur instanceof Anthropic.APIConnectionError) {
      return new Response("Le tuteur est injoignable. Vérifie ta connexion.", {
        status: 503,
      });
    }
    console.error("Échec de l'appel au modèle :", erreur);
    return new Response("Le tuteur n'a pas pu répondre.", { status: 500 });
  }
}
