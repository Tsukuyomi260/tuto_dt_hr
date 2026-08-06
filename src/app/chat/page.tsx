"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { ActionCard } from "@/components/ActionCard";
import { Bubble } from "@/components/Bubble";
import { Composer } from "@/components/Composer";
import { Thinking } from "@/components/Thinking";
import { db, type Message } from "@/lib/db";
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
  const messages = useLiveQuery(() => db.messages.orderBy("createdAt").toArray(), []);
  const niveau = useReglages((e) => e.niveau);

  const [enCours, setEnCours] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [horsLigne, setHorsLigne] = useState(false);
  const fil = useRef<HTMLDivElement>(null);
  const barre = useRef<HTMLElement>(null);
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
  }, [messages, enCours]);

  async function demander(historique: Message[]) {
    setOccupe(true);
    setEnCours("");
    premierJeton.current = true;
    try {
      const reponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historique.map((m) => ({ role: m.role, content: m.content })),
          niveau,
        }),
      });
      if (!reponse.ok || !reponse.body) throw new Error(await reponse.text());

      const lecteur = reponse.body.getReader();
      const decodeur = new TextDecoder();
      let accumule = "";
      for (;;) {
        const { done, value } = await lecteur.read();
        if (done) break;
        accumule += decodeur.decode(value, { stream: true });
        setEnCours(accumule);
      }
      if (accumule.trim()) {
        await db.messages.add({
          role: "assistant",
          content: accumule,
          createdAt: Date.now(),
        });
      }
    } catch {
      const dernier = historique.at(-1);
      if (dernier?.id) await db.messages.update(dernier.id, { echec: true });
    } finally {
      setEnCours(null);
      setOccupe(false);
    }
  }

  async function envoyer(texte: string) {
    await db.messages.add({ role: "user", content: texte, createdAt: Date.now() });
    await demander(await db.messages.orderBy("createdAt").toArray());
  }

  async function reessayer(msg: Message) {
    if (!msg.id) return;
    await db.messages.update(msg.id, { echec: false });
    await demander(await db.messages.orderBy("createdAt").toArray());
  }

  const vide = messages !== undefined && messages.length === 0 && enCours === null;

  return (
    <main className="relative flex h-full flex-col">
      <header
        ref={barre}
        style={{ ["--p" as string]: 0 }}
        className="material absolute inset-x-0 top-0 z-10 flex h-[56px] items-center gap-2.5 px-4"
      >
        <div className="jeton grid size-8 shrink-0 place-items-center rounded-[10px] text-[11px] font-semibold text-primary-ink">
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
        <span className="absolute inset-x-0 bottom-0 h-px bg-line opacity-[var(--p)]" aria-hidden />
      </header>

      <div
        ref={fil}
        onScroll={surDefilement}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pt-[68px] pb-[96px]"
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
              <div className="jeton mb-4 grid size-14 place-items-center rounded-[18px] text-[17px] font-semibold text-primary-ink">
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
            <Bubble
              role={m.role}
              horodatage={m.createdAt}
              anime={m.role === "user" ? "rise" : false}
            >
              {m.content}
            </Bubble>
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

        {enCours !== null &&
          (enCours === "" ? (
            <Thinking />
          ) : (
            // Le flou de `emerge` masque le remplacement de l'indicateur par
            // le texte : sans lui, on voit les deux objets se croiser.
            <Bubble role="assistant" anime="emerge">
              {enCours}
            </Bubble>
          ))}
      </div>

      <div className="material absolute inset-x-0 bottom-0 z-10 border-t border-line">
        <Composer onEnvoi={envoyer} occupe={occupe} />
      </div>
    </main>
  );
}
