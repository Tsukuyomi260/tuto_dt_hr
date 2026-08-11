import type { EpreuveJointe } from "@/lib/db";

/**
 * Affiche l'énoncé d'une ancienne épreuve, mot pour mot.
 *
 * L'énoncé mêle deux natures de contenu : de la prose, et des tableaux dont
 * l'alignement en colonnes porte l'information (un room rate sans ses colonnes
 * ne veut plus rien dire). On les rend différemment — la prose se replie sur
 * la largeur de l'écran, le tableau garde sa chasse fixe et défile
 * horizontalement dans son propre cadre, sans jamais faire défiler la page.
 */

type Bloc = { type: "prose" | "tableau"; lignes: string[] };

/**
 * Seul un écart *interne* entre colonnes signale un tableau. L'indentation
 * seule n'en est pas un : `pdftotext -layout` reproduit aussi les marges de
 * la page, si bien que des énoncés entièrement rédigés arrivent indentés
 * (l'épreuve 2024 par exemple). Les classer en tableau enfermerait leur
 * prose dans un cadre monospace à défilement horizontal.
 */
function aDesColonnes(ligne: string): boolean {
  return /\S {2,}\S/.test(ligne);
}

function segmenter(enonce: string): Bloc[] {
  const blocs: Bloc[] = [];
  for (const ligne of enonce.split("\n")) {
    const dernier = blocs.at(-1);
    const indentee = /^ {2,}\S/.test(ligne);

    // Une ligne indentée sans colonnes prolonge un tableau déjà ouvert —
    // c'est le second niveau d'un en-tête — mais n'en ouvre jamais un.
    const type: Bloc["type"] = aDesColonnes(ligne)
      ? "tableau"
      : indentee && dernier?.type === "tableau"
        ? "tableau"
        : "prose";

    // Une ligne vide prolonge le bloc courant plutôt que d'en ouvrir un autre :
    // sans ça, un tableau aéré serait coupé en morceaux.
    if (dernier && (dernier.type === type || ligne.trim() === "")) {
      dernier.lignes.push(ligne);
    } else {
      blocs.push({ type, lignes: [ligne] });
    }
  }
  return blocs;
}

/** L'indentation de la prose vient de la mise en page du PDF : elle ne porte
 *  rien et gênerait la lecture sur un écran étroit. */
function deIndenter(lignes: string[]): string {
  return lignes
    .map((l) => l.trimStart())
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
}

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
      className="animate-emerge w-full shrink-0 self-start overflow-hidden rounded-[16px] border border-line bg-[var(--surface)] shadow-[var(--shadow-1)]"
      aria-label={`Épreuve DT HR ${epreuve.annee}`}
    >
      <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="jeton grid size-8 shrink-0 place-items-center rounded-[10px] text-[11px] font-semibold text-primary-ink">
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
              <pre className="w-max min-w-full rounded-[10px] bg-accent-soft px-3 py-2.5 font-mono text-[12.5px] leading-relaxed">
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
    </article>
  );
}
