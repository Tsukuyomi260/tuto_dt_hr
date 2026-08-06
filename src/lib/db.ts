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

export async function effacerConversations() {
  await db.messages.clear();
}
