/**
 * Identité d'une discussion.
 *
 * Le module ne contient qu'une constante et un générateur, sans aucune
 * dépendance : `db.ts` (qui tire Dexie) et `store.ts` (qui tire Zustand) en
 * ont besoin tous les deux, et les faire s'importer l'un l'autre ferait
 * entrer Dexie dans le paquet de l'écran d'accueil, qui n'ouvre pas la base.
 */

/**
 * Le fil des candidats déjà installés. Leurs messages ont été écrits avant
 * que les discussions existent : la migration v5 de la base les rattache
 * tous ici, sinon leur historique deviendrait introuvable — présent en base
 * mais rattaché à aucun fil, donc jamais affiché.
 */
export const FIL_INITIAL = "fil-1";

/**
 * L'horodatage seul ne suffit pas : deux appuis dans la même milliseconde
 * produiraient deux fils du même nom, qui se mélangeraient à l'affichage.
 */
export function nouvelIdentifiantFil(): string {
  return `fil-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
