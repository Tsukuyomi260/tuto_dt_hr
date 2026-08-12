import Dexie, { type EntityTable } from "dexie";

/**
 * Stockage local d'abord : tout fonctionne hors ligne, et le compte n'est
 * qu'une fonction de récupération (§9 du brief). Rien ici ne dépend du réseau.
 */
/** Énoncé littéral d'une ancienne épreuve, tel qu'extrait du recueil. */
export interface EpreuveJointe {
  id: string;
  annee: string;
  numero: number;
  enonce: string;
}

/** Fiche recto/verso, extraite littéralement de l'annale. */
export interface FlashcardJointe {
  id: string;
  terme: string;
  definition: string;
}

export interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  /** Un message du candidat qui n'a pas pu partir : affiché « non délivré ». */
  echec?: boolean;
  /**
   * Épreuve affichée avec ce message. Stockée telle quelle : le candidat doit
   * pouvoir la relire hors ligne, et son contenu ne doit jamais être régénéré.
   */
  epreuve?: EpreuveJointe;
  /**
   * Numéro de tentative quand le message est une relance maïeutique. Absent
   * sur une correction, une explication ou un accueil.
   */
  relance?: number;
  /** Paquet de fiches affiché avec ce message, stocké pour la révision hors ligne. */
  flashcards?: FlashcardJointe[];
}

export const db = new Dexie("tuto-dt-hr") as Dexie & {
  messages: EntityTable<Message, "id">;
};

db.version(1).stores({
  messages: "++id, createdAt",
});

// v2 ajoute `epreuve`. Champ non indexé : le schéma est inchangé, mais la
// version doit être incrémentée pour que Dexie ouvre la base existante des
// candidats déjà installés sans la recréer — ils garderaient sinon un
// historique vide au prochain lancement.
db.version(2).stores({
  messages: "++id, createdAt",
});

// v3 ajoute `relance`. Champ non indexé, même raison qu'en v2 : incrémenter
// la version est ce qui laisse Dexie ouvrir la base des candidats déjà
// installés sans la recréer.
db.version(3).stores({
  messages: "++id, createdAt",
});

// v4 ajoute `flashcards`. Champ non indexé, même raison qu'aux versions
// précédentes : c'est l'incrément qui laisse Dexie rouvrir la base existante.
db.version(4).stores({
  messages: "++id, createdAt",
});

export async function effacerConversations() {
  await db.messages.clear();
}
