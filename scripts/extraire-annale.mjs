#!/usr/bin/env node
/**
 * Extrait le texte d'une annale PDF vers un corpus markdown exploitable.
 *
 * Le corpus est *dérivé* : il se régénère depuis le PDF source. Ne le corrigez
 * pas à la main, corrigez le nettoyage ici — sinon la prochaine extraction
 * écrase vos retouches.
 *
 *   npm run corpus
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const SOURCE = "data/annales/technologie-hoteliere-daassi-2025.pdf";
const SORTIE = "data/corpus/technologie-hoteliere.md";

/** Pieds de page et en-têtes répétés à chaque page du document. */
const BRUIT = [
  /^\s*Romaric\s+DAASSI\s+Enseignant\s*\/\s*Formateur/i,
  /^\s*Restauration\s*&\s*Tourisme\s*$/i,
  /^\s*T[ée]l\s*:\s*\+?\s*229/i,
  /^\s*Email\s*:/i,
  /^\s*ANNALES\s+DE\s+REVISION\s+EDITION\s+2025\s*$/i,
  /^\s*\d{1,3}\s*$/, // numéros de page isolés
  /^\s*[*=_-]{3,}\s*$/, // filets décoratifs
];

function extraire(pdf) {
  try {
    return execFileSync("pdftotext", ["-enc", "UTF-8", "-nopgbrk", pdf, "-"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    if (e.code === "ENOENT") {
      console.error(
        "pdftotext est introuvable. Installe-le :\n" +
          "  Debian/Ubuntu : sudo apt install poppler-utils\n" +
          "  macOS         : brew install poppler",
      );
      process.exit(1);
    }
    throw e;
  }
}

function nettoyer(brut) {
  const lignes = brut
    .split("\n")
    .map((l) => l.replace(/\s+$/, "").replace(/ /g, " "))
    .filter((l) => !BRUIT.some((r) => r.test(l)));

  const sortie = [];
  for (const ligne of lignes) {
    const t = ligne.trim();
    // Un titre est une ligne courte tout en majuscules : on la promeut en
    // titre markdown pour que le modèle voie la structure du cours.
    const estTitre =
      t.length > 6 &&
      t.length < 90 &&
      t === t.toUpperCase() &&
      /[A-ZÉÈÊÀÔÎÇ]/.test(t) &&
      !/[.;:]$/.test(t);

    if (estTitre) {
      if (sortie.at(-1) !== "") sortie.push("");
      sortie.push(`## ${t}`);
      sortie.push("");
      continue;
    }
    // Une seule ligne vide consécutive.
    if (t === "" && sortie.at(-1) === "") continue;
    sortie.push(t);
  }
  return sortie.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

mkdirSync("data/corpus", { recursive: true });

const brut = extraire(SOURCE);
const propre = nettoyer(brut);

const entete = `<!-- Corpus dérivé de ${basename(SOURCE)} — régénéré par \`npm run corpus\`.
     Ne pas éditer à la main : la prochaine extraction écraserait les retouches. -->

# Annales de révision — Technologie Hôtelière (DT HR)
`;

writeFileSync(SORTIE, `${entete}\n${propre}\n`, "utf8");

const mots = propre.split(/\s+/).length;
console.log(`Corpus écrit : ${SORTIE}`);
console.log(`  ${propre.length.toLocaleString("fr-FR")} caractères`);
console.log(`  ${mots.toLocaleString("fr-FR")} mots`);
console.log(`  ~${Math.round(propre.length / 3.4).toLocaleString("fr-FR")} jetons (estimation)`);
console.log(`  ${(propre.match(/^## /gm) ?? []).length} sections détectées`);
