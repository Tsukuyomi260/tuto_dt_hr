"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { FlashcardJointe } from "@/lib/db";

/**
 * Paquet de fiches recto/verso (§6.6 du brief).
 *
 * Une seule fiche à l'écran : recto le terme, verso la définition, un appui
 * pour retourner, puis la suivante. Le contenu vient mot pour mot de l'annale
 * — le tuteur choisit le paquet, jamais ce qu'il y a dessus.
 *
 * Les deux faces occupent la même cellule de grille : la carte prend donc la
 * hauteur de la plus haute des deux et ne saute pas au retournement.
 */
export function CarteFlashcard({ fiches }: { fiches: FlashcardJointe[] }) {
  const [index, setIndex] = useState(0);
  const [retournee, setRetournee] = useState(false);

  if (fiches.length === 0) return null;
  const fiche = fiches[Math.min(index, fiches.length - 1)];
  const derniere = index >= fiches.length - 1;

  function suivante() {
    setRetournee(false);
    setIndex((i) => (i + 1) % fiches.length);
  }

  return (
    <section
      // `shrink-0` : le fil est un conteneur flex en colonne, et tout enfant
      // dont l'`overflow` n'est pas `visible` peut y être écrasé à zéro.
      className="animate-emerge w-full shrink-0 self-start overflow-hidden rounded-[16px] border border-line bg-[var(--surface)] shadow-[var(--shadow-1)]"
      aria-label="Fiches de révision"
    >
      <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="jeton grid size-8 shrink-0 place-items-center rounded-[10px] text-primary-ink">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="6" width="14" height="12" rx="2" />
            <path d="M7 3h11a3 3 0 0 1 3 3v9" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate t-caption leading-tight font-semibold">
            Fiches de révision
          </h2>
          <p className="truncate text-[11px] leading-tight text-ink-2">
            Vocabulaire de l&apos;annale — appuie pour retourner
          </p>
        </div>
        <span className="shrink-0 t-caption tabular-nums text-ink-2">
          {index + 1} / {fiches.length}
        </span>
      </header>

      <div className="px-4 py-4">
        <button
          type="button"
          onClick={() => setRetournee((r) => !r)}
          aria-label={retournee ? "Revoir le terme" : "Voir la définition"}
          className="block w-full text-left [perspective:1200px]"
        >
          <div
            className={cn(
              "grid transition-transform duration-[460ms] ease-[var(--ease-in-out)] [transform-style:preserve-3d]",
              retournee && "[transform:rotateY(180deg)]",
            )}
          >
            {/* Recto — le terme à retrouver. */}
            <div className="col-start-1 row-start-1 grid min-h-[112px] place-items-center rounded-[12px] bg-accent-soft px-4 py-5 [backface-visibility:hidden]">
              <span className="t-body text-center font-semibold text-balance">
                {fiche.terme}
              </span>
            </div>

            {/* Verso — la définition, retournée pour se lire à l'endroit. */}
            <div className="col-start-1 row-start-1 grid min-h-[112px] items-center rounded-[12px] border border-line bg-[var(--raised)] px-4 py-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <span className="t-sub">{fiche.definition}</span>
            </div>
          </div>
        </button>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRetournee((r) => !r)}
            className="flex-1 rounded-[12px] border border-line px-3 py-2.5 t-caption font-semibold text-ink-2 transition-colors duration-200 active:bg-accent-soft"
          >
            {retournee ? "Revoir le terme" : "Voir la réponse"}
          </button>
          <button
            type="button"
            onClick={suivante}
            className="jeton flex-1 rounded-[12px] px-3 py-2.5 t-caption font-semibold text-primary-ink transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.97]"
          >
            {derniere ? "Recommencer" : "Carte suivante"}
          </button>
        </div>
      </div>
    </section>
  );
}
