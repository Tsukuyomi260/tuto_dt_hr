import { BoutonsExport } from "@/components/BoutonsExport";
import type { EpreuveJointe } from "@/lib/db";
import { deIndenter, epreuveEnDocument, segmenter } from "@/lib/enonce";

/**
 * Affiche l'énoncé d'une ancienne épreuve, mot pour mot.
 *
 * L'énoncé mêle deux natures de contenu : de la prose, et des tableaux dont
 * l'alignement en colonnes porte l'information (un room rate sans ses colonnes
 * ne veut plus rien dire). On les rend différemment — la prose se replie sur
 * la largeur de l'écran, le tableau garde sa chasse fixe et défile
 * horizontalement dans son propre cadre, sans jamais faire défiler la page.
 * La découpe vit dans lib/enonce.ts, partagée avec l'export PDF/image.
 */

export function CarteEpreuve({ epreuve }: { epreuve: EpreuveJointe }) {
  const blocs = segmenter(epreuve.enonce);

  return (
    <article
      // `shrink-0` est indispensable, pas décoratif : le fil est un conteneur
      // flex en colonne, et `overflow-hidden` (nécessaire pour découper les
      // coins arrondis) ramène la taille minimale automatique de l'élément à
      // zéro. Sans ce garde-fou, la carte est le seul enfant rétractable du
      // fil : dès que la conversation dépasse la hauteur de l'écran, elle
      // absorbe tout le dépassement et s'aplatit à l'épaisseur de sa bordure.
      className="animate-emerge w-full shrink-0 self-start overflow-hidden rounded-[var(--radius-card)] border border-line bg-[var(--surface)] shadow-[var(--shadow-1)]"
      aria-label={`Épreuve DT HR ${epreuve.annee}`}
    >
      <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="jeton grid size-8 shrink-0 place-items-center rounded-[10px] text-[11px] font-semibold text-accent">
          {epreuve.annee.slice(2)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate t-caption leading-tight font-semibold">
            Épreuve DT&nbsp;HR&nbsp;{epreuve.annee}
          </h2>
          <p className="truncate text-[11px] leading-tight text-ink-2">
            Technologie Hôtelière — sujet officiel, sans le corrigé
          </p>
        </div>
      </header>

      <div className="px-4 py-3.5">
        {blocs.map((bloc, i) =>
          bloc.type === "tableau" ? (
            <div key={i} className="-mx-1 my-2 overflow-x-auto">
              <pre className="w-max min-w-full rounded-[10px] bg-primary-soft px-3 py-2.5 font-mono text-[12.5px] leading-relaxed">
                {bloc.lignes.join("\n").replace(/^\n+|\n+$/g, "")}
              </pre>
            </div>
          ) : (
            <p key={i} className="t-body whitespace-pre-wrap">
              {deIndenter(bloc.lignes)}
            </p>
          ),
        )}
      </div>

      {/* Le sujet se garde : PDF pour l'imprimer, image pour le partager. Le
          rapport des premiers testeurs le demandait explicitement. */}
      <footer className="flex items-center gap-2 border-t border-line px-4 py-2.5">
        <span className="min-w-0 flex-1 truncate t-caption text-ink-2">Garder ce sujet</span>
        <BoutonsExport doc={() => epreuveEnDocument(epreuve)} />
      </footer>
    </article>
  );
}
