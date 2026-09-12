/**
 * Outils de révision rédigés par le tuteur : fiche de révision, quiz,
 * emploi du temps, et flashcards complémentaires.
 *
 * Contrairement aux épreuves, leur contenu *est* produit par le modèle — il
 * n'existe nulle part ailleurs. Le contrat change donc : on ne garantit plus
 * la littéralité, on garantit la forme. Ce que le modèle remplit dans l'appel
 * d'outil est une entrée non fiable, relayée telle quelle à l'écran du
 * candidat : chaque champ est vérifié, borné et nettoyé ici, et un objet qui
 * ne ressemble pas à ce que l'interface sait afficher est refusé — l'outil
 * répond alors en erreur et le modèle peut corriger son appel.
 *
 * La fidélité au cours, elle, est confiée au prompt et aux descriptions
 * d'outil : rédiger d'après l'annale, signaler ce qui la dépasse.
 */
import type Anthropic from "@anthropic-ai/sdk";
import type {
  FicheRevision,
  FlashcardJointe,
  PlanningJoint,
  QuizJoint,
} from "./db";

export const OUTIL_FICHE_REVISION = "creer_fiche_revision";
export const OUTIL_QUIZ = "lancer_quiz";
export const OUTIL_PLANNING = "proposer_planning";

/** Chaîne nettoyée et bornée, ou `null` si vide. */
function texte(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  // Le texte s'affiche tel quel : les astérisques de mise en gras du modèle
  // resteraient visibles à l'écran.
  const t = v.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function liste<T>(v: unknown, max: number, f: (x: unknown) => T | null): T[] {
  if (!Array.isArray(v)) return [];
  const sortie: T[] = [];
  for (const x of v) {
    // Le plafond se vérifie avant d'ajouter : avec `max` à zéro (paquet déjà
    // plein de fiches de l'annale), un élément passait quand même.
    if (sortie.length >= max) break;
    const y = f(x);
    if (y !== null) sortie.push(y);
  }
  return sortie;
}

function objet(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/** Identifiant local : il ne sert qu'à distinguer deux objets du même fil. */
function ident(prefixe: string): string {
  return `${prefixe}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function nettoyerFiche(entree: unknown): FicheRevision | null {
  const e = objet(entree);
  if (!e) return null;
  const titre = texte(e.titre, 90);
  const sections = liste(e.sections, 8, (s) => {
    const o = objet(s);
    if (!o) return null;
    const t = texte(o.titre, 70);
    const points = liste(o.points, 8, (p) => texte(p, 320));
    return t && points.length > 0 ? { titre: t, points } : null;
  });
  if (!titre || sections.length === 0) return null;
  const piege = texte(e.piege, 320);
  return {
    id: ident("fr"),
    titre,
    sections,
    ...(piege ? { piege } : {}),
    ...(e.hors_annale === true ? { horsAnnale: true } : {}),
  };
}

export function nettoyerQuiz(entree: unknown): QuizJoint | null {
  const e = objet(entree);
  if (!e) return null;
  const titre = texte(e.titre, 90) ?? "Quiz d'auto-évaluation";
  const questions = liste(e.questions, 10, (q) => {
    const o = objet(q);
    if (!o) return null;
    const question = texte(o.question, 300);
    const choix = liste(o.choix, 4, (c) => texte(c, 160));
    const bonne = typeof o.bonne === "number" ? Math.trunc(o.bonne) : -1;
    const explication = texte(o.explication, 400);
    // Une question dont la bonne réponse ne désigne aucun choix serait
    // incorrigeable : le candidat aurait toujours tort.
    if (!question || choix.length < 2 || bonne < 0 || bonne >= choix.length) return null;
    if (new Set(choix.map((c) => c.toLowerCase())).size !== choix.length) return null;
    return { question, choix, bonne, explication: explication ?? "" };
  });
  if (questions.length === 0) return null;
  return { id: ident("qz"), titre, questions };
}

export function nettoyerPlanning(entree: unknown): PlanningJoint | null {
  const e = objet(entree);
  if (!e) return null;
  const titre = texte(e.titre, 90) ?? "Mon emploi du temps de révision";
  const jours = liste(e.jours, 42, (j) => {
    const o = objet(j);
    if (!o) return null;
    const libelle = texte(o.libelle, 60);
    const seances = liste(o.seances, 4, (s) => {
      const so = objet(s);
      if (!so) return null;
      const sujet = texte(so.sujet, 120);
      const activite = texte(so.activite, 200);
      const duree = texte(so.duree, 20);
      return sujet && activite ? { sujet, activite, ...(duree ? { duree } : {}) } : null;
    });
    return libelle && seances.length > 0 ? { libelle, seances } : null;
  });
  if (jours.length === 0) return null;
  const examen = texte(e.date_examen, 60);
  return {
    id: ident("pl"),
    titre,
    ...(examen ? { examen } : {}),
    jours,
    conseils: liste(e.conseils, 5, (c) => texte(c, 240)),
  };
}

/**
 * Flashcards rédigées par le tuteur, en complément des fiches de l'annale :
 * les listes « Terme : définition » ne couvrent ni les calculs, ni les
 * procédures, ni les chapitres rédigés en prose.
 */
export function nettoyerCartes(entree: unknown, max: number): FlashcardJointe[] {
  return liste(entree, max, (c) => {
    const o = objet(c);
    if (!o) return null;
    const terme = texte(o.recto, 90);
    const definition = texte(o.verso, 420);
    return terme && definition ? { id: "", terme, definition, origine: "tuteur" as const } : null;
  }).map((f, i) => ({ ...f, id: `fc-t-${Date.now().toString(36)}-${i}` }));
}

export const OUTILS_REVISION: Anthropic.Tool[] = [
  {
    name: OUTIL_FICHE_REVISION,
    description:
      "Affiche au candidat une fiche de révision structurée sur un chapitre ou " +
      "une notion du programme de Technologie Hôtelière. Utilise-la quand il " +
      "demande une fiche de révision, une fiche de synthèse ou l'essentiel d'un " +
      "chapitre. Rédige-la d'après l'annale : ses définitions, ses listes, ses " +
      "formules, au niveau de détail de ses corrigés. N'ajoute rien que tu ne " +
      "puisses tirer de l'annale ou des connaissances établies du métier, et " +
      "mets hors_annale à true si une partie dépasse l'annale.",
    input_schema: {
      type: "object",
      properties: {
        titre: { type: "string", description: "Titre court : le chapitre ou la notion." },
        sections: {
          type: "array",
          description:
            "Trois à cinq sections, par exemple « Définitions », « Les étapes », " +
            "« Formules », « À retenir ». Chaque point tient en une ou deux phrases.",
          items: {
            type: "object",
            properties: {
              titre: { type: "string" },
              points: { type: "array", items: { type: "string" } },
            },
            required: ["titre", "points"],
          },
        },
        piege: {
          type: "string",
          description: "Le piège ou la confusion classique de l'examen sur ce chapitre.",
        },
        hors_annale: {
          type: "boolean",
          description: "Vrai si une partie du contenu ne vient pas de l'annale.",
        },
      },
      required: ["titre", "sections"],
    },
  },
  {
    name: OUTIL_QUIZ,
    description:
      "Affiche au candidat un quiz d'auto-évaluation à choix multiples, qu'il " +
      "remplit seul : l'application corrige chaque réponse et donne le score. " +
      "Utilise-le quand il demande un quiz, un QCM, de s'auto-évaluer ou d'être " +
      "testé. Les questions et les réponses doivent venir de l'annale (cours et " +
      "corrigés types). Une seule bonne réponse par question, des distracteurs " +
      "plausibles — les confusions réelles des candidats, pas des absurdités.",
    input_schema: {
      type: "object",
      properties: {
        titre: { type: "string", description: "Le thème du quiz." },
        questions: {
          type: "array",
          description: "Cinq questions par défaut, dix au plus.",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              choix: {
                type: "array",
                items: { type: "string" },
                description: "Trois ou quatre propositions.",
              },
              bonne: {
                type: "integer",
                description: "Index (à partir de 0) de la bonne proposition dans choix.",
              },
              explication: {
                type: "string",
                description: "Une ou deux phrases qui justifient la bonne réponse.",
              },
            },
            required: ["question", "choix", "bonne", "explication"],
          },
        },
      },
      required: ["titre", "questions"],
    },
  },
  {
    name: OUTIL_PLANNING,
    description:
      "Affiche au candidat un emploi du temps de révision jour par jour. " +
      "Utilise-le quand il demande un planning, un programme ou un emploi du " +
      "temps de révision. Répartis tout le programme de l'annale jusqu'à " +
      "l'examen, en alternant cours, flashcards, quiz et annales, et en " +
      "revenant sur chaque chapitre à intervalles croissants. Garde les " +
      "dernières séances pour des épreuves en conditions réelles.",
    input_schema: {
      type: "object",
      properties: {
        titre: { type: "string" },
        date_examen: {
          type: "string",
          description: "Date de l'examen, telle que le candidat l'a donnée.",
        },
        jours: {
          type: "array",
          description:
            "Un élément par jour de révision, quatorze au plus en détail ; au-delà, " +
            "regroupe par semaine (« Semaine 3 »).",
          items: {
            type: "object",
            properties: {
              libelle: { type: "string", description: "« Lundi 13 octobre », « Semaine 3 »…" },
              seances: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sujet: { type: "string", description: "Le chapitre travaillé." },
                    activite: { type: "string", description: "Ce qu'il fait concrètement." },
                    duree: { type: "string", description: "« 45 min », « 1 h »…" },
                  },
                  required: ["sujet", "activite"],
                },
              },
            },
            required: ["libelle", "seances"],
          },
        },
        conseils: {
          type: "array",
          items: { type: "string" },
          description: "Deux ou trois conseils de méthode adaptés à sa situation.",
        },
      },
      required: ["jours"],
    },
  },
];
