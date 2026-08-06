"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/* L'API Web Speech n'est pas typée dans la lib DOM standard. */
type Reconnaissance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => Reconnaissance;
    webkitSpeechRecognition?: new () => Reconnaissance;
  }
}

type Props = {
  onEnvoi: (texte: string) => void;
  occupe: boolean;
};

export function Composer({ onEnvoi, occupe }: Props) {
  const [texte, setTexte] = useState("");
  const [dicte, setDicte] = useState(false);
  const [dictaDispo, setDictaDispo] = useState(false);
  const reco = useRef<Reconnaissance | null>(null);
  const champ = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;
    setDictaDispo(true);
    // Dictée locale au téléphone : zéro octet téléversé, zéro coût, réponse
    // immédiate. Le repli serveur n'existe que si l'API est absente.
    const r = new Ctor();
    r.lang = "fr-FR";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      const dernier = e.results[e.results.length - 1];
      setTexte(dernier[0].transcript);
    };
    r.onend = () => setDicte(false);
    r.onerror = () => setDicte(false);
    reco.current = r;
    return () => r.stop();
  }, []);

  function basculerDictee() {
    if (!reco.current) return;
    if (dicte) {
      reco.current.stop();
      setDicte(false);
    } else {
      setTexte("");
      reco.current.start();
      setDicte(true);
    }
  }

  function envoyer() {
    const t = texte.trim();
    if (!t || occupe) return;
    onEnvoi(t);
    setTexte("");
    champ.current?.focus();
  }

  return (
    <div className="flex shrink-0 items-end gap-2 border-t border-line bg-surface px-3 py-2.5">
      {/* Photo et micro sont à gauche, au même rang que le texte — le brief en
          fait trois entrées égales, l'interface doit le dire. */}
      <button
        type="button"
        aria-label="Prendre une photo (bientôt)"
        title="Entrée par photo — bientôt"
        disabled
        className="grid size-9 shrink-0 place-items-center rounded-[11px] text-ink-2 opacity-40"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8a2 2 0 0 1 2-2h2.2l1.3-2h7l1.3 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <circle cx="12" cy="12.5" r="3.3" />
        </svg>
      </button>

      <button
        type="button"
        onClick={basculerDictee}
        disabled={!dictaDispo || occupe}
        aria-label={dicte ? "Arrêter la dictée" : "Dicter"}
        title={dictaDispo ? "Dicter" : "Dictée indisponible sur ce navigateur"}
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-[11px]",
          "transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.94]",
          dicte ? "bg-accent-soft text-accent-ink" : "text-ink-2",
          !dictaDispo && "opacity-40",
        )}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2.5" width="6" height="11.5" rx="3" />
          <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5" />
        </svg>
      </button>

      <textarea
        ref={champ}
        rows={1}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            envoyer();
          }
        }}
        placeholder={dicte ? "Je t'écoute…" : "Écris ta question…"}
        className="max-h-32 min-w-0 flex-1 resize-none rounded-[var(--radius-field)] border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-3 focus:outline-none"
      />

      <button
        type="button"
        onClick={envoyer}
        disabled={!texte.trim() || occupe}
        aria-label="Envoyer"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-ink transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.94] disabled:opacity-40 disabled:active:scale-100"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12h15M13 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}
