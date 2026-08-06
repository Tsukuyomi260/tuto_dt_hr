import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
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

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";
const EFFORT = (process.env.ANTHROPIC_EFFORT ?? "medium") as
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

type Entrant = { role: "user" | "assistant"; content: string };

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

  try {
    const flux = getClient().messages.stream({
      model: MODEL,
      max_tokens: 6000,
      // Le prompt maïeutique est stable : on le met en cache. Les lectures
      // coûtent ~0,1× — c'est le principal levier de coût du projet.
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      // La réflexion est active par défaut sur Opus 5 ; `medium` garde la
      // latence acceptable sur un réseau lent sans perdre en qualité.
      thinking: { type: "adaptive" },
      output_config: { effort: EFFORT },
      messages,
    });

    const encodeur = new TextEncoder();
    const corpsFlux = new ReadableStream<Uint8Array>({
      async start(controleur) {
        try {
          for await (const evenement of flux) {
            if (
              evenement.type === "content_block_delta" &&
              evenement.delta.type === "text_delta"
            ) {
              controleur.enqueue(encodeur.encode(evenement.delta.text));
            }
          }

          const final = await flux.finalMessage();

          // Opus 5 peut décliner une requête (HTTP 200, stop_reason refusal).
          // Sans ce garde-fou, le candidat verrait une bulle vide.
          if (final.stop_reason === "refusal") {
            controleur.enqueue(
              encodeur.encode(
                "Je ne peux pas traiter cette demande. Reformule-la, ou revenons au programme de Technologie Hôtelière.",
              ),
            );
          }
          controleur.close();
        } catch (erreur) {
          controleur.error(erreur);
        }
      },
    });

    return new Response(corpsFlux, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
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
