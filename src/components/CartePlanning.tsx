"use client";

import { useState } from "react";
import { BoutonsExport } from "@/components/BoutonsExport";
import type { PlanningJoint } from "@/lib/db";
import type { DocExport } from "@/lib/export";

/** Jours visibles avant « Voir tout » : un planning de quatre semaines ne tient pas d'un coup d'œil. */
const APERCU = 5;

function enDocument(p: PlanningJoint): DocExport {
  return {
    titre: p.titre,
    sousTitre: p.examen ? `Examen : ${p.examen}` : "Emploi du temps de révision",
    blocs: [
      ...p.jours.flatMap((j) => [
        { t: "h" as const, v: j.libelle },
        ...j.seances.map((s) => ({
          t: "li" as const,
          v: `${s.duree ? `${s.duree} — ` : ""}${s.sujet} : ${s.activite}`,
        })),
      ]),
      ...(p.conseils.length > 0
        ? [
            { t: "h" as const, v: "Conseils de méthode" },
            ...p.conseils.map((c) => ({ t: "li" as const, v: c })),
          ]
        : []),
    ],
    fichier: "emploi-du-temps-revision",
  };
}

/**
 * Emploi du temps de révision, jour par jour.
 *
 * Il se télécharge comme une épreuve : un planning qu'on ne peut pas afficher
 * au mur ni retrouver sans ouvrir l'application est un planning qu'on oublie.
 */
export function CartePlanning({ planning }: { planning: PlanningJoint }) {
  const [tout, setTout] = useState(false);
  const jours = tout ? planning.jours : planning.jours.slice(0, APERCU);

  return (
    <article
      className="animate-emerge w-full shrink-0 self-start overflow-hidden rounded-[var(--radius-card)] border border-line bg-[var(--surface)] shadow-[var(--shadow-1)]"
      aria-label={planning.titre}
    >
      <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="jeton grid size-8 shrink-0 place-items-center rounded-[10px] text-accent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate t-caption leading-tight font-semibold">{planning.titre}</h2>
          <p className="truncate text-[11px] leading-tight text-ink-2">
            {planning.examen ? `Examen : ${planning.examen}` : "Emploi du temps de révision"}
          </p>
        </div>
        <span className="shrink-0 t-caption tabular-nums text-ink-2">
          {planning.jours.length} j.
        </span>
      </header>

      <ol className="flex flex-col divide-y divide-[var(--line)] px-4">
        {jours.map((j, i) => (
          <li key={i} className="py-2.5">
            <p className="t-label text-accent-ink">{j.libelle}</p>
            <ul className="mt-1 flex flex-col gap-1">
              {j.seances.map((s, k) => (
                <li key={k} className="flex gap-2 t-sub">
                  {s.duree && (
                    <span className="w-[4.2rem] shrink-0 tabular-nums text-ink-2">{s.duree}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{s.sujet}</span> — {s.activite}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {planning.jours.length > APERCU && (
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={() => setTout((t) => !t)}
            className="w-full rounded-full border border-line px-3 py-2 t-caption font-semibold text-ink-2 transition-colors duration-200 active:bg-accent-soft"
          >
            {tout ? "Réduire" : `Voir les ${planning.jours.length} jours`}
          </button>
        </div>
      )}

      {planning.conseils.length > 0 && (
        <div className="mx-4 mb-3 rounded-[12px] bg-primary-soft px-3 py-2.5">
          <p className="t-label text-ink-2">Conseils de méthode</p>
          <ul className="mt-1 flex flex-col gap-1">
            {planning.conseils.map((c, i) => (
              <li key={i} className="t-sub">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="flex items-center gap-2 border-t border-line px-4 py-2.5">
        <span className="min-w-0 flex-1 truncate t-caption text-ink-2">Garder ce planning</span>
        <BoutonsExport doc={() => enDocument(planning)} />
      </footer>
    </article>
  );
}
