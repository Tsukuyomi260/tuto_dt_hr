import type { EpreuveJointe, FlashcardJointe } from "./db";

/**
 * Trames du flux NDJSON entre la route et le navigateur.
 *
 * Le flux transporte deux natures de contenu : le texte du tuteur, produit
 * par le modèle, et l'énoncé d'une épreuve, extrait littéralement du corpus.
 * Les séparer est le point de tout le dispositif — l'énoncé traverse le
 * système sans jamais passer par le modèle, donc sans risque de reformulation.
 *
 * Ce module ne contient que des types : il est importé des deux côtés, et ne
 * doit rien tirer du serveur (le corpus lit le disque).
 */
export type Trame =
  | { t: "txt"; v: string }
  | { t: "epr"; v: EpreuveJointe }
  /** Numéro de tentative : ce message est une relance, pas une correction. */
  | { t: "rel"; v: number }
  /** Paquet de flashcards, extrait littéralement de l'annale. */
  | { t: "fic"; v: FlashcardJointe[] };
