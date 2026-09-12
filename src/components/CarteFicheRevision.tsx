"use client";

import { BoutonsExport } from "@/components/BoutonsExport";
import type { FicheRevision } from "@/lib/db";
import type { DocExport } from "@/lib/export";

/**
 * Fiche de révision d'un chapitre, rédigée par le tuteur d'après l'annale.
 *
 * Contrairement à l'épreuve, son contenu vient du modèle : l'en-tête le dit,
 * et un bandeau signale quand une partie dépasse l'annale — le candidat doit
 * savoir ce qu'il peut réciter tel quel le jour de l'examen.
 */
function enDocument(fiche: FicheRevision): DocExport {
  return {
    titre: fiche.titre,
    sousTitre: "Fiche de révision — Technologie Hôtelière",
    blocs: [
      ...fiche.sections.flatMap((s) => [
        { t: "h" as const, v: s.titre },
        ...s.points.map((p) => ({ t: "li" as const, v: p })),
      ]),
      ...(fiche.piege ? [{ t: "note" as const, v: `Piège de l'examen — ${fiche.piege}` }] : []),
      ...(fiche.horsAnnale
        ? [{ t: "p" as const, v: "Une partie de cette fiche complète l'annale avec les usages du métier." }]
        : []),
    ],
    fichier: `fiche-${fiche.titre
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40)}`,
  };
}

export function CarteFicheRevision({ fiche }: { fiche: FicheRevision }) {
  return (
    <article
      // `shrink-0` : sans lui, la carte s'aplatit dans le fil en colonne flex
      // dès que la conversation dépasse la hauteur de l'écran (voir CarteEpreuve).
      className="animate-emerge w-full shrink-0 self-start overflow-hidden rounded-[var(--radius-card)] border border-line bg-[var(--surface)] shadow-[var(--shadow-1)]"
      aria-label={`Fiche de révision : ${fiche.titre}`}
    >
      <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="jeton grid size-8 shrink-0 place-items-center rounded-[10px] text-accent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 3h9l4 4v14H6z" />
            <path d="M9 11h7M9 15h7M9 7h3" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate t-caption leading-tight font-semibold">{fiche.titre}</h2>
          <p className="truncate text-[11px] leading-tight text-ink-2">
            Fiche de révision — rédigée d&apos;après ton annale
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-3.5 px-4 py-3.5">
        {fiche.sections.map((s, i) => (
          <section key={i}>
            <h3 className="t-label text-accent-ink">{s.titre}</h3>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {s.points.map((p, j) => (
                <li key={j} className="flex gap-2 t-sub">
                  <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-[var(--ink-3)]" aria-hidden />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {fiche.piege && (
          <p className="rounded-[12px] border-l-[3px] border-accent-ink bg-accent-soft px-3 py-2.5 t-sub">
            <span className="font-semibold">Piège de l&apos;examen — </span>
            {fiche.piege}
          </p>
        )}

        {fiche.horsAnnale && (
          <p className="t-caption text-ink-2">
            Une partie de cette fiche complète ton annale avec les usages du métier.
          </p>
        )}
      </div>

      <footer className="flex items-center gap-2 border-t border-line px-4 py-2.5">
        <span className="min-w-0 flex-1 truncate t-caption text-ink-2">Garder cette fiche</span>
        <BoutonsExport doc={() => enDocument(fiche)} />
      </footer>
    </article>
  );
}
