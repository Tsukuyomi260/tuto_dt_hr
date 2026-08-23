import Dexie, { type EntityTable } from "dexie";
import { FIL_INITIAL } from "./fils";

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
  /**
   * Discussion à laquelle le message appartient. Indexé : c'est la clé de
   * lecture du fil affiché, et l'index évite de relire toute la table à
   * chaque nouveau jeton reçu en streaming.
   */
  fil: string;
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

// v5 découpe l'historique en discussions. C'est la première version qui
// ajoute un *index* et non un simple champ : elle a donc besoin d'une
// migration réelle. Les messages écrits avant existent sans `fil` ; or une
// propriété absente n'entre pas dans un index IndexedDB, si bien qu'une
// requête par fil ne les retrouverait jamais. On les rattache au fil initial :
// le candidat qui met à jour retrouve sa conversation là où il l'a laissée.
db.version(5)
  .stores({
    messages: "++id, createdAt, fil",
  })
  .upgrade((tx) =>
    tx
      .table<Message>("messages")
      .toCollection()
      .modify((m) => {
        m.fil ??= FIL_INITIAL;
      }),
  );

/** Une discussion telle qu'elle apparaît dans la liste. */
export type ResumeFil = {
  fil: string;
  /** Première question du candidat — ce qui rend le fil reconnaissable. */
  titre: string;
  /** Date du dernier message, qui décide de l'ordre de la liste. */
  dernier: number;
  nombre: number;
};

/**
 * Les discussions, de la plus récemment active à la plus ancienne.
 *
 * La table est relue en entier : une application de révision se compte en
 * centaines de messages, pas en millions, et regrouper en mémoire coûte
 * moins qu'un aller-retour d'index par fil.
 */
export async function resumeFils(): Promise<ResumeFil[]> {
  const tous = await db.messages.orderBy("createdAt").toArray();

  const par = new Map<string, Message[]>();
  for (const m of tous) {
    const cle = m.fil ?? FIL_INITIAL;
    const liste = par.get(cle);
    if (liste) liste.push(m);
    else par.set(cle, [m]);
  }

  const resumes: ResumeFil[] = [];
  for (const [fil, liste] of par) {
    const premiereQuestion = liste.find((m) => m.role === "user");
    resumes.push({
      fil,
      titre: premiereQuestion?.content.trim() || "Discussion sans question",
      dernier: liste[liste.length - 1]?.createdAt ?? 0,
      nombre: liste.length,
    });
  }

  return resumes.sort((a, b) => b.dernier - a.dernier);
}

export async function effacerConversations() {
  await db.messages.clear();
}
