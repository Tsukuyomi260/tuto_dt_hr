/**
 * Découpe d'un énoncé d'épreuve en prose et en tableaux.
 *
 * Partagée entre la carte affichée dans le fil et l'export PDF/image : les
 * deux doivent reconnaître les mêmes tableaux, sinon le fichier téléchargé
 * aplatirait des colonnes que l'écran montrait intactes.
 *
 * L'énoncé mêle deux natures de contenu : de la prose, et des tableaux dont
 * l'alignement en colonnes porte l'information (un room rate sans ses colonnes
 * ne veut plus rien dire). La prose se replie sur la largeur disponible, le
 * tableau garde sa chasse fixe.
 */
import type { BlocDoc, DocExport } from "./export";
import type { EpreuveJointe } from "./db";

export type BlocEnonce = { type: "prose" | "tableau"; lignes: string[] };

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

export function segmenter(enonce: string): BlocEnonce[] {
  const blocs: BlocEnonce[] = [];
  for (const ligne of enonce.split("\n")) {
    const dernier = blocs.at(-1);
    const indentee = /^ {2,}\S/.test(ligne);

    // Une ligne indentée sans colonnes prolonge un tableau déjà ouvert —
    // c'est le second niveau d'un en-tête — mais n'en ouvre jamais un.
    const type: BlocEnonce["type"] = aDesColonnes(ligne)
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
export function deIndenter(lignes: string[]): string {
  return lignes
    .map((l) => l.trimStart())
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
}

/** L'épreuve telle qu'elle part en PDF ou en image : même découpe qu'à l'écran. */
export function epreuveEnDocument(epreuve: EpreuveJointe): DocExport {
  const blocs: BlocDoc[] = segmenter(epreuve.enonce).map((b) =>
    b.type === "tableau"
      ? { t: "pre", v: b.lignes.join("\n") }
      : { t: "p", v: deIndenter(b.lignes) },
  );
  return {
    titre: `Épreuve DT HR ${epreuve.annee}`,
    sousTitre: "Technologie Hôtelière — sujet officiel, sans le corrigé",
    blocs: blocs.filter((b) => b.v.trim() !== ""),
    fichier: `epreuve-dt-hr-${epreuve.annee}`,
  };
}
