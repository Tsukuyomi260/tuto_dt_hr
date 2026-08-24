"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ActionCard } from "@/components/ActionCard";
import { Bubble } from "@/components/Bubble";
import { CarteEpreuve } from "@/components/CarteEpreuve";
import { CarteFlashcard } from "@/components/CarteFlashcard";
import { Composer } from "@/components/Composer";
import { PanneauFils } from "@/components/PanneauFils";
import { Thinking } from "@/components/Thinking";
import { db, type EpreuveJointe, type FlashcardJointe, type Message } from "@/lib/db";
import type { Trame } from "@/lib/flux";
import { useReglages } from "@/lib/store";

const IcoQuestion = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />
  </svg>
);
const IcoEpreuve = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
  </svg>
);
const IcoReviser = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M8 5v14" />
  </svg>
);

function salutation() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function Chat() {
  const niveau = useReglages((e) => e.niveau);
  const filCourant = useReglages((e) => e.filCourant);
  const nouveauFil = useReglages((e) => e.nouveauFil);

  // Seuls les messages de la discussion ouverte. `filCourant` est dans les
  // dépendances : sans lui, changer de fil ne relancerait pas la requête et
  // l'écran resterait sur l'ancienne conversation.
  const messages = useLiveQuery(
    () => db.messages.where("fil").equals(filCourant).sortBy("createdAt"),
    [filCourant],
  );

  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);
  /** Épreuve reçue pendant le flux, avant son enregistrement local. */
  const [epreuveEnCours, setEpreuveEnCours] = useState<EpreuveJointe | null>(null);
  /** Numéro de tentative reçu pendant le flux, avant enregistrement local. */
  const [relanceEnCours, setRelanceEnCours] = useState<number | null>(null);
  /** Paquet de fiches reçu pendant le flux, avant enregistrement local. */
  const [fichesEnCours, setFichesEnCours] = useState<FlashcardJointe[] | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [horsLigne, setHorsLigne] = useState(false);
  const fil = useRef<HTMLDivElement>(null);
  const barre = useRef<HTMLElement>(null);
  const barreBasse = useRef<HTMLDivElement>(null);
  /**
   * Hauteur réelle du composer. Elle varie : le champ grandit avec le texte,
   * et la zone sûre diffère d'un téléphone à l'autre. Une réserve fixe est
   * donc soit trop courte — le dernier message passe sous la barre — soit
   * trop grande. On la mesure.
   */
  const [hauteurBasse, setHauteurBasse] = useState(112);
  const colleAuBas = useRef(true);
  const premierJeton = useRef(true);

  useEffect(() => {
    const maj = () => setHorsLigne(!navigator.onLine);
    maj();
    window.addEventListener("online", maj);
    window.addEventListener("offline", maj);
    return () => {
      window.removeEventListener("online", maj);
      window.removeEventListener("offline", maj);
    };
  }, []);

  useEffect(() => {
    const el = barreBasse.current;
    if (!el) return;
    const obs = new ResizeObserver(() =>
      setHauteurBasse(el.getBoundingClientRect().height),
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function surDefilement() {
    const el = fil.current;
    if (!el) return;
    colleAuBas.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    // Écrit dans une variable CSS via la ref : un état React re-rendrait tout
    // le fil à chaque événement de défilement.
    barre.current?.style.setProperty("--p", Math.min(1, el.scrollTop / 24).toFixed(3));
  }

  useEffect(() => {
    if (!colleAuBas.current) return;
    const el = fil.current;
    if (el) el.scrollTop = el.scrollHeight;
    // `hauteurBasse` est dans les dépendances : quand le composer grandit, le
    // fil doit se recoller au bas, sinon le dernier message remonte hors vue.
  }, [messages, enCours, epreuveEnCours, hauteurBasse]);

  async function demander(historique: Message[]) {
    setOccupe(true);
    setEnCours("");
    setEpreuveEnCours(null);
    setRelanceEnCours(null);
    setFichesEnCours(null);
    premierJeton.current = true;
    try {
      const reponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // `relance` repart avec l'historique : c'est lui qui permet au
          // serveur de compter les tentatives sans se fier au modèle.
          // Les photos repartent avec l'historique : le tuteur doit pouvoir
          // relire l'énoncé au tour suivant. Elles sont en aval du point de
          // cache, donc elles n'invalident pas le préfixe de l'annale.
          messages: historique.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.relance ? { relance: m.relance } : {}),
            ...(m.image ? { image: m.image } : {}),
          })),
          niveau,
        }),
      });
      if (!reponse.ok || !reponse.body) throw new Error(await reponse.text());

      const lecteur = reponse.body.getReader();
      const decodeur = new TextDecoder();
      let tampon = "";
      let accumule = "";
      let epreuve: EpreuveJointe | undefined;
      let relance: number | undefined;
      let flashcards: FlashcardJointe[] | undefined;
      /**
       * Panne annoncée par le serveur dans le flux. Elle n'est jamais
       * enregistrée comme un message du tuteur : elle repartirait ensuite
       * dans l'historique, et le modèle relirait « Trop de demandes en ce
       * moment » comme s'il l'avait dit lui-même.
       */
      let panne: string | undefined;

      // Flux NDJSON : une trame par ligne. Le texte du tuteur et l'énoncé
      // d'une épreuve arrivent par des canaux distincts — l'énoncé n'est
      // jamais reconstruit à partir du texte du modèle.
      const traiter = (ligne: string) => {
        if (!ligne.trim()) return;
        let trame: Trame;
        try {
          trame = JSON.parse(ligne);
        } catch {
          return; // trame tronquée par une coupure réseau : on l'ignore
        }
        if (trame.t === "txt") {
          accumule += trame.v;
          setEnCours(accumule);
        } else if (trame.t === "epr") {
          epreuve = trame.v;
          setEpreuveEnCours(trame.v);
        } else if (trame.t === "rel") {
          relance = trame.v;
          setRelanceEnCours(trame.v);
        } else if (trame.t === "fic") {
          flashcards = trame.v;
          setFichesEnCours(trame.v);
        } else if (trame.t === "err") {
          panne = trame.v;
        }
      };

      for (;;) {
        const { done, value } = await lecteur.read();
        if (done) break;
        tampon += decodeur.decode(value, { stream: true });
        const lignes = tampon.split("\n");
        // La dernière tranche est peut-être incomplète : elle attend la suite.
        tampon = lignes.pop() ?? "";
        for (const ligne of lignes) traiter(ligne);
      }
      traiter(tampon);

      // Ce que le tuteur a réellement produit avant la panne est conservé :
      // une épreuve déjà affichée ou une relance à moitié écrite valent mieux
      // qu'un tour effacé. Seule la panne elle-même n'entre pas dans le fil.
      if (accumule.trim() || epreuve || flashcards) {
        await db.messages.add({
          fil: filCourant,
          role: "assistant",
          content: accumule,
          createdAt: Date.now(),
          ...(epreuve ? { epreuve } : {}),
          ...(relance ? { relance } : {}),
          ...(flashcards ? { flashcards } : {}),
        });
      }

      if (panne) {
        toast.error(panne);
        // Le message du candidat reste marqué : c'est lui qui porte le bouton
        // « Réessayer », et c'est bien sa question qui n'a pas abouti.
        const dernier = historique.at(-1);
        if (dernier?.id) await db.messages.update(dernier.id, { echec: true });
      }
    } catch (erreur) {
      // Échec avant le flux : la route a répondu par un code et un texte.
      // On l'affiche plutôt que de le perdre — c'est là qu'atterrissent la
      // clé absente, le 429 et le 503 quand ils précèdent le streaming.
      const texte = erreur instanceof Error ? erreur.message.trim() : "";
      toast.error(texte || "Le tuteur n'a pas pu répondre.");
      const dernier = historique.at(-1);
      if (dernier?.id) await db.messages.update(dernier.id, { echec: true });
    } finally {
      setEnCours(null);
      // L'épreuve et la relance sont désormais lues depuis le stockage local,
      // avec leur message.
      setEpreuveEnCours(null);
      setRelanceEnCours(null);
      setFichesEnCours(null);
      setOccupe(false);
    }
  }

  /** L'historique envoyé au tuteur est celui du fil ouvert, et lui seul. */
  const filComplet = () =>
    db.messages.where("fil").equals(filCourant).sortBy("createdAt");

  async function envoyer(texte: string, image?: string) {
    await db.messages.add({
      fil: filCourant,
      role: "user",
      content: texte,
      createdAt: Date.now(),
      ...(image ? { image } : {}),
    });
    await demander(await filComplet());
  }

  async function reessayer(msg: Message) {
    if (!msg.id) return;
    await db.messages.update(msg.id, { echec: false });
    await demander(await filComplet());
  }

  const vide = messages !== undefined && messages.length === 0 && enCours === null;

  /**
   * Ouvrir un fil déjà vierge n'accomplirait rien et laisserait une
   * discussion vide de plus dans la liste. Le bouton est donc désactivé
   * quand l'écran est déjà celui d'une conversation neuve.
   */
  function demarrerDiscussion() {
    if (vide || occupe) return;
    nouveauFil();
  }

  return (
    <main className="relative flex h-full flex-col">
      <header
        ref={barre}
        style={{ ["--p" as string]: 0 }}
        className="material absolute inset-x-0 top-0 z-10 flex h-[56px] items-center gap-2.5 px-3"
      >
        <div className="jeton ml-1 grid size-8 shrink-0 place-items-center rounded-[10px] text-[11px] font-semibold text-accent">
          TH
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate t-caption leading-tight font-semibold">
            Tuteur DT&nbsp;HR
          </div>
          <div className="truncate text-[11px] leading-tight text-ink-2">
            Technologie Hôtelière
          </div>
        </div>

        {/* Les deux sorties du fil. Elles sont dans l'en-tête et non derrière
            un menu : une conversation dont on ne peut pas sortir en un geste
            est une conversation dont on ne sort pas. */}
        <button
          type="button"
          onClick={demarrerDiscussion}
          disabled={vide || occupe}
          aria-label="Nouvelle discussion"
          title="Nouvelle discussion"
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-2 transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.92] disabled:opacity-35 disabled:active:scale-100"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
            <path d="M18.4 2.6a2 2 0 0 1 2.8 2.8L12 14.6l-3.5.9.9-3.5z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setPanneauOuvert(true)}
          aria-label="Mes discussions"
          aria-haspopup="dialog"
          aria-expanded={panneauOuvert}
          title="Mes discussions"
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-2 transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.92]"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </button>

        <span className="absolute inset-x-0 bottom-0 h-px bg-line opacity-[var(--p)]" aria-hidden />
      </header>

      <div
        ref={fil}
        onScroll={surDefilement}
        // La réserve basse suit la hauteur mesurée du composer, plus une
        // respiration : sinon le dernier message se glisse dessous.
        style={{ paddingBottom: hauteurBasse + 12 }}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pt-[68px]"
      >
        {horsLigne && (
          <div className="animate-emerge flex items-center gap-2 self-center rounded-full bg-stop-soft px-3.5 py-1.5 t-caption text-stop">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 3l20 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 3.5-2.3M19 13a10 10 0 0 0-6-2.9" />
              <circle cx="12" cy="20" r=".6" fill="currentColor" />
            </svg>
            Hors ligne — l&apos;envoi reprendra tout seul
          </div>
        )}

        {vide && (
          <div className="flex flex-1 flex-col justify-end gap-6 pb-1">
            {/* L'accueil est un moment, pas un vide. Le tuteur se présente,
                puis les trois usages du brief sont là, à portée de pouce. */}
            <div className="animate-materialize flex flex-col items-start">
              <div className="jeton mb-4 grid size-14 place-items-center rounded-[18px] text-[17px] font-semibold text-accent">
                TH
              </div>
              <h1 className="t-display text-balance">{salutation()}.</h1>
              <p className="mt-2.5 max-w-[26ch] t-body text-ink-2">
                Pose ta question comme elle te vient — même mal formulée, on la
                démêlera ensemble.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <ActionCard
                icone={IcoQuestion}
                titre="Poser une question"
                detail="Je te guide, tentative par tentative"
                delai={90}
                onClick={() => document.querySelector("textarea")?.focus()}
              />
              <ActionCard
                icone={IcoEpreuve}
                titre="Obtenir une épreuve"
                detail="Annales réelles, sans le corrigé"
                teinte="calme"
                delai={145}
                onClick={() =>
                  envoyer("Donne-moi une ancienne épreuve de Technologie Hôtelière.")
                }
              />
              <ActionCard
                icone={IcoReviser}
                titre="Réviser"
                detail="Flashcards, fiches et emploi du temps"
                teinte="accent"
                delai={200}
                onClick={() => envoyer("Prépare-moi des flashcards pour réviser.")}
              />
            </div>
          </div>
        )}

        {messages?.map((m) => (
          <div key={m.id} className="contents">
            {/* L'épreuve précède le message : le candidat lit le sujet avant
                que le tuteur ne lui pose sa première question. */}
            {m.epreuve && <CarteEpreuve epreuve={m.epreuve} />}
            {m.flashcards && <CarteFlashcard fiches={m.flashcards} />}
            {(m.content.trim() !== "" || m.image) && (
              <Bubble
                role={m.role}
                relance={m.relance}
                horodatage={m.createdAt}
                image={m.image}
                anime={m.role === "user" ? "rise" : false}
              >
                {m.content}
              </Bubble>
            )}
            {m.echec && (
              <div className="flex items-center justify-end gap-2 t-caption text-stop">
                <span>Non délivré</span>
                <button
                  type="button"
                  onClick={() => reessayer(m)}
                  className="font-semibold underline underline-offset-2"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        ))}

        {epreuveEnCours && <CarteEpreuve epreuve={epreuveEnCours} />}
        {fichesEnCours && <CarteFlashcard fiches={fichesEnCours} />}

        {enCours !== null &&
          (enCours === "" ? (
            <Thinking />
          ) : (
            // Le flou de `emerge` masque le remplacement de l'indicateur par
            // le texte : sans lui, on voit les deux objets se croiser.
            <Bubble role="assistant" relance={relanceEnCours ?? undefined} anime="emerge">
              {enCours}
            </Bubble>
          ))}
      </div>

      {/* Plus de filet supérieur : la carte du composer porte elle-même son
          contour, un second trait pleine largeur la doublerait. */}
      <div ref={barreBasse} className="material absolute inset-x-0 bottom-0 z-10">
        <Composer onEnvoi={envoyer} occupe={occupe} />
      </div>

      <PanneauFils
        ouvert={panneauOuvert}
        onFermer={() => setPanneauOuvert(false)}
      />
    </main>
  );
}
