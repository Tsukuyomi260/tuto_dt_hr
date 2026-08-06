import Dexie, { type EntityTable } from "dexie";

/**
 * Stockage local d'abord : tout fonctionne hors ligne, et le compte n'est
 * qu'une fonction de récupération (§9 du brief). Rien ici ne dépend du réseau.
 */
export interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  /** Un message du candidat qui n'a pas pu partir : affiché « non délivré ». */
  echec?: boolean;
}

export const db = new Dexie("tuto-dt-hr") as Dexie & {
  messages: EntityTable<Message, "id">;
};

db.version(1).stores({
  messages: "++id, createdAt",
});

export async function effacerConversations() {
  await db.messages.clear();
}
