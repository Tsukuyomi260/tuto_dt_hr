/**
 * Découpe le recueil d'anciennes épreuves contenu dans le corpus.
 *
 * Rien ici ne passe par le modèle : l'énoncé servi au candidat est un extrait
 * **littéral** du corpus, lui-même dérivé du PDF. C'est la seule façon de
 * garantir qu'il révise sur le vrai sujet — un modèle à qui l'on demande de
 * « redonner » une épreuve la reformule, et la reformulation d'un sujet
 * d'examen est un sujet différent.
 *
 * Le recueil a la forme :
 *
 *   ## EPREUVE 1 : DT HR 2012
 *   SUJET
 *   …énoncé…
 *   ## EPREUVE 2 : DT HR 2014
 *   …
 *   ## CORRECTION DES EPREUVES     ← frontière
 *   ## EPREUVE 1 : DT HR 2012      ← les mêmes titres, côté corrigé
 *
 * Les titres se répètent des deux côtés : la frontière est donc obligatoire
 * pour ne pas servir un corrigé à la place d'un sujet.
 */
import { CORPUS } from "./corpus";

export type Epreuve = {
  /** Identifiant stable, utilisé par l'outil et par l'interface. */
  id: string;
  numero: number;
  annee: string;
  /** Énoncé littéral, sans la ligne « SUJET ». */
  enonce: string;
};

const TITRE = /^##\s*EPREUVE\s+(\d+)\s*:\s*DT\s+HR\s+(\d{4})\s*$/i;
const FRONTIERE = /^##\s*CORRECTION\s+DES\s+EPREUVES/i;

function decouper(): Epreuve[] {
  const lignes = CORPUS.split("\n");

  // Au-delà de cette ligne, les mêmes titres désignent les corrigés.
  const frontiere = lignes.findIndex((l) => FRONTIERE.test(l));
  const fin = frontiere === -1 ? lignes.length : frontiere;

  const debuts: { i: number; numero: number; annee: string }[] = [];
  for (let i = 0; i < fin; i++) {
    const m = lignes[i].match(TITRE);
    if (m) debuts.push({ i, numero: Number(m[1]), annee: m[2] });
  }

  return debuts.map((d, k) => {
    const stop = k + 1 < debuts.length ? debuts[k + 1].i : fin;
    const corps = lignes
      .slice(d.i + 1, stop)
      // « SUJET » et « TEXTE » sont des intitulés de mise en page du recueil,
      // pas du contenu : l'interface a déjà son propre en-tête.
      .filter((l, j) => !(j < 3 && /^\s*(SUJET|TEXTE)\s*$/i.test(l)));

    return {
      id: `dt-hr-${d.annee}`,
      numero: d.numero,
      annee: d.annee,
      enonce: corps.join("\n").trim(),
    };
  });
}

export const EPREUVES: Epreuve[] = CORPUS ? decouper() : [];

/** Années disponibles, de la plus récente à la plus ancienne. */
export const ANNEES = EPREUVES.map((e) => e.annee).sort().reverse();

/**
 * Retrouve une épreuve par année. Sans année, renvoie la plus récente —
 * c'est celle qui ressemble le plus à l'épreuve que le candidat passera.
 */
export function trouverEpreuve(annee?: string | null): Epreuve | null {
  if (EPREUVES.length === 0) return null;
  if (!annee) return recente();

  const exacte = EPREUVES.find((e) => e.annee === String(annee).trim());
  return exacte ?? null;
}

function recente(): Epreuve {
  return EPREUVES.reduce((a, b) => (a.annee >= b.annee ? a : b));
}
