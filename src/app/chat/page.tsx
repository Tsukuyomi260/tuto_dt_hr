"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { Bubble } from "@/components/Bubble";
import { Button } from "@/components/Button";
import { Composer } from "@/components/Composer";
import { Thinking } from "@/components/Thinking";
import { db, type Message } from "@/lib/db";
import { useReglages } from "@/lib/store";

const AMORCES = [
  "C'est quoi la mise en place ?",
  "Explique-moi la brigade de cuisine",
  "Les trois services de base en salle ?",
];

export default function Chat() {
  const messages = useLiveQuery(() => db.messages.orderBy("createdAt").toArray(), []);
  const niveau = useReglages((e) => e.niveau);

  const [enCours, setEnCours] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [horsLigne, setHorsLigne] = useState(false);
  const bas = useRef<HTMLDivElement>(null);

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
    bas.current?.scrollIntoView({ block: "end" });
  }, [messages, enCours]);

  async function demander(historique: Message[]) {
    setOccupe(true);
    setEnCours("");
    try {
      const reponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historique.map((m) => ({ role: m.role, content: m.content })),
          niveau,
        }),
      });

      if (!reponse.ok || !reponse.body) {
        throw new Error(await reponse.text());
      }

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
      // Le dernier message du candidat n'a pas abouti : on le marque plutôt
      // que de laisser croire qu'il est parti.
      const dernier = historique.at(-1);
      if (dernier?.id) await db.messages.update(dernier.id, { echec: true });
    } finally {
      setEnCours(null);
      setOccupe(false);
    }
  }

  async function envoyer(texte: string) {
    const id = await db.messages.add({
      role: "user",
      content: texte,
      createdAt: Date.now(),
    });
    const historique = await db.messages.orderBy("createdAt").toArray();
    await demander(historique.map((m) => (m.id === id ? { ...m, echec: false } : m)));
  }

  async function reessayer(msg: Message) {
    if (!msg.id) return;
    await db.messages.update(msg.id, { echec: false });
    const historique = await db.messages.orderBy("createdAt").toArray();
    await demander(historique);
  }

  const vide = messages !== undefined && messages.length === 0;

  return (
    <main className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-2.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-primary text-[13px] font-semibold text-primary-ink">
          TH
        </div>
        <div>
          <div className="text-[14.5px] leading-tight font-semibold">Tuteur DT HR</div>
          <div className="text-[11.5px] leading-snug text-ink-2">
            Technologie Hôtelière
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 py-4">
        {horsLigne && (
          <div className="flex items-center gap-2 rounded-[10px] bg-stop-soft px-3 py-2 text-[12.5px] text-stop">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 3l20 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 3.5-2.3M19 13a10 10 0 0 0-6-2.9" />
              <circle cx="12" cy="20" r=".6" fill="currentColor" />
            </svg>
            Hors ligne — tes réponses partiront dès le retour du réseau
          </div>
        )}

        {vide && (
          <>
            <Bubble role="assistant">
              Bonsoir&nbsp;! Sur quoi veux-tu travailler aujourd&apos;hui&nbsp;?
            </Bubble>
            {/* Un état vide est une barrière sur un clavier de téléphone
                d'entrée de gamme : on propose des amorces tapables. */}
            <div className="mt-1 flex flex-col items-start gap-2">
              {AMORCES.map((a) => (
                <Button key={a} variante="sec" taille="sm" onClick={() => envoyer(a)}>
                  {a}
                </Button>
              ))}
            </div>
          </>
        )}

        {messages?.map((m) => (
          <div key={m.id} className="contents">
            <Bubble role={m.role} horodatage={m.createdAt}>
              {m.content}
            </Bubble>
            {m.echec && (
              <div className="flex items-center justify-end gap-2 text-[11.5px] text-stop">
                <span>Non délivré</span>
                <Button
                  variante="ghost"
                  taille="sm"
                  className="text-stop"
                  onClick={() => reessayer(m)}
                >
                  Réessayer
                </Button>
              </div>
            )}
          </div>
        ))}

        {enCours !== null &&
          (enCours === "" ? <Thinking /> : <Bubble role="assistant">{enCours}</Bubble>)}

        <div ref={bas} />
      </div>

      <Composer onEnvoi={envoyer} occupe={occupe} />
    </main>
  );
}
