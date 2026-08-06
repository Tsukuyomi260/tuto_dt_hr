import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * L'annale entière tient dans le contexte (~29 000 jetons), donc elle y va
 * en entier : pas de découpage, pas de base vectorielle, pas de recherche.
 *
 * Un système de récupération se trompe de passage ; un modèle qui voit tout
 * le cours ne peut pas rater le bon chapitre. Et comme le texte est identique
 * pour tous les candidats, le cache de prompt est partagé : on l'écrit une
 * fois, tout le monde le lit à ~0,1× du prix.
 *
 * Lu une seule fois au démarrage du serveur.
 */
function charger(): string {
  try {
    return readFileSync(
      join(process.cwd(), "data/corpus/technologie-hoteliere.md"),
      "utf8",
    );
  } catch {
    console.warn(
      "Corpus absent — le tuteur répondra de mémoire, sans l'annale.\n" +
        "Lance `npm run corpus` pour l'extraire depuis data/annales/.",
    );
    return "";
  }
}

export const CORPUS = charger();
export const CORPUS_DISPONIBLE = CORPUS.length > 0;
