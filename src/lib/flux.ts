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
  | { t: "fic"; v: FlashcardJointe[] }
  /**
   * Panne côté serveur, formulée pour le candidat.
   *
   * Elle voyage dans le flux et non par un code HTTP parce qu'elle survient
   * presque toujours trop tard : un `messages.stream()` ne révèle son erreur
   * qu'à l'itération, c'est-à-dire une fois la `Response` déjà rendue et son
   * statut figé. Le seul canal encore ouvert, à ce moment, est le flux.
   *
   * Le client ne l'enregistre jamais comme un message du tuteur : elle
   * décrit l'application, pas le cours.
   */
  | { t: "err"; v: string };
