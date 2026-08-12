/**
 * Fabrique les flashcards à partir du corpus.
 *
 * Même principe que les épreuves : le contenu n'est jamais rédigé par le
 * modèle. Une définition inventée serait invérifiable, et un candidat qui
 * apprend par cœur une définition fausse est plus mal loti qu'un candidat qui
 * n'a rien appris. Chaque fiche est donc un extrait littéral de l'annale.
 *
 * Deux gisements dans le cours :
 *   A. les listes « -Terme : définition » (vocabulaire, abréviations,
 *      check-in/check-out, recouche…), de loin les plus nombreuses ;
 *   B. les sections courtes dont le titre est lui-même un terme (ACOMPTE,
 *      ALLOTEMENT, DEPOSIT…), suivies d'un paragraphe de définition.
 *
 * Le recueil d'épreuves est exclu : ses listes sont des consignes d'examen,
 * elles produiraient des fiches absurdes.
 */
import { CORPUS } from "./corpus";

export type Flashcard = {
  id: string;
  /** Recto. */
  terme: string;
  /** Verso. */
  definition: string;
};

/** Un titre de chapitre, pas un terme : « LES POSTES A L'HÔTEL ». */
const TITRE_CHAPITRE = /^(les?|la|un|une|des|comment|pourquoi)\b/i;

function normaliser(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function cle(terme: string): string {
  return (
    normaliser(terme)
      .toLowerCase()
      .replace(/^(le|la|les|l’|l'|un|une|des)\s+/, "")
      // « Acompte ou Avance » et la section « ACOMPTE » sont la même notion :
      // on ne garde que le premier libellé pour ne pas servir deux fois la
      // même fiche dans un paquet.
      .replace(/\s+ou\s+.*$/, "")
      .trim()
  );
}

function construire(): Flashcard[] {
  const lignes = CORPUS.split("\n");
  const fin = lignes.findIndex((l) => /^RECUEIL D’ANCIENNES EPREUVES/i.test(l));
  const cours = lignes.slice(0, fin === -1 ? lignes.length : fin);

  const fiches: Flashcard[] = [];
  const vus = new Set<string>();

  const ajouter = (terme: string, definition: string) => {
    const t = normaliser(terme).replace(/^[«"']|[»"']$/g, "");
    const d = normaliser(definition);
    const k = cle(t);
    // Bornes de longueur : en dessous ce n'est pas une définition, au-dessus
    // ce n'est plus une fiche mais un paragraphe de cours.
    if (!k || vus.has(k) || t.length < 2 || t.length > 48) return;
    if (d.length < 25 || d.length > 420) return;
    vus.add(k);
    fiches.push({ id: `fc-${fiches.length + 1}`, terme: t, definition: d });
  };

  // A — listes à tirets, définition parfois repliée sur plusieurs lignes.
  let courante: string | null = null;
  const vider = () => {
    if (!courante) return;
    const m = courante.match(/^(.{2,48}?)\s*:\s*(.+)$/s);
    if (m) ajouter(m[1], m[2]);
    courante = null;
  };
  for (const ligne of cours) {
    const t = ligne.trim();
    if (/^[-–]\s*\S/.test(t)) {
      vider();
      courante = t.replace(/^[-–]\s*/, "");
    } else if (courante && t && !t.startsWith("#")) {
      courante += " " + t;
    } else {
      vider();
    }
  }
  vider();

  // B — sections dont le titre est un terme.
  for (let i = 0; i < cours.length; i++) {
    const m = cours[i].match(/^##\s+(.{2,44})$/);
    if (!m) continue;
    const titre = m[1].trim();
    if (TITRE_CHAPITRE.test(titre) || titre.split(/\s+/).length > 3) continue;

    const corps: string[] = [];
    for (let j = i + 1; j < cours.length && !/^##\s/.test(cours[j]); j++) {
      corps.push(cours[j]);
    }
    // Déjà couvert par A : ne pas transformer la section entière en fiche.
    if (corps.some((l) => /^[-–]\s*\S/.test(l.trim()))) continue;
    ajouter(titre.replace(/\s*&\s*/g, " et "), corps.join(" "));
  }

  return fiches;
}

export const FLASHCARDS: Flashcard[] = CORPUS ? construire() : [];

/** Termes disponibles, proposés au modèle pour qu'il compose un paquet. */
export const TERMES: string[] = FLASHCARDS.map((f) => f.terme);

/**
 * Paquet composé par le modèle, terme par terme.
 *
 * Une recherche littérale sur un thème échoue trop souvent : « paiement » ne
 * figure dans aucune définition, alors que l'annale traite l'acompte, les
 * arrhes et le deposit. Le modèle sait faire ce rapprochement, pas une
 * comparaison de chaînes — on lui donne donc la liste des termes et il choisit.
 * Le contenu des fiches, lui, reste hors de sa portée.
 */
export function fichesParTermes(termes: string[]): Flashcard[] {
  const index = new Map(FLASHCARDS.map((f) => [cle(f.terme), f]));
  const paquet: Flashcard[] = [];
  for (const t of termes) {
    const f = index.get(cle(t));
    if (f && !paquet.includes(f)) paquet.push(f);
    if (paquet.length >= 10) break;
  }
  return paquet;
}

function sansAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Sélectionne un paquet. Avec un sujet, on garde les fiches qui le
 * mentionnent ; sinon on prend un échantillon réparti sur tout le programme
 * plutôt que les premières, qui traitent toutes du même chapitre.
 */
export function tirerFlashcards(sujet?: string | null, nombre = 6): Flashcard[] {
  if (FLASHCARDS.length === 0) return [];
  const n = Math.max(1, Math.min(10, Math.round(nombre) || 6));

  const q = sansAccents(sujet ?? "").trim();
  if (q) {
    const mots = q.split(/\s+/).filter((m) => m.length > 2);
    const trouvees = FLASHCARDS.filter((f) => {
      const foin = sansAccents(`${f.terme} ${f.definition}`);
      return mots.some((m) => foin.includes(m));
    });
    if (trouvees.length > 0) return trouvees.slice(0, n);
    // Aucun résultat : mieux vaut un paquet général qu'un paquet vide.
  }

  const pas = Math.max(1, Math.floor(FLASHCARDS.length / n));
  const paquet: Flashcard[] = [];
  for (let i = 0; i < FLASHCARDS.length && paquet.length < n; i += pas) {
    paquet.push(FLASHCARDS[i]);
  }
  return paquet;
}
