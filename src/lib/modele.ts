/**
 * Choix du modèle et de ses paramètres de réflexion.
 *
 * Deux générations coexistent et n'acceptent pas les mêmes options :
 *
 * - 4.6 et suivants (Opus 5, Sonnet 5, Haiku à venir) : réflexion adaptative
 *   (`thinking: {type:"adaptive"}`) et `output_config.effort`.
 * - 4.5 et antérieurs (Haiku 4.5) : ni l'un ni l'autre. Vérifié contre l'API,
 *   les deux renvoient un 400 — « adaptive thinking is not supported on this
 *   model » et « This model does not support the effort parameter. » Seul le
 *   budget de réflexion historique est accepté.
 *
 * Envoyer les mauvais paramètres coupe la conversation d'un bout à l'autre :
 * la sélection ci-dessous est donc faite à partir du modèle, pas d'une
 * constante figée.
 */
import type Anthropic from "@anthropic-ai/sdk";

export const MODELE = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

/** Modèles acceptant `thinking: adaptive` et `output_config.effort`. */
const ADAPTATIFS = [
  "claude-opus-5",
  "claude-opus-4-6",
  "claude-opus-4-7",
  "claude-opus-4-8",
  "claude-sonnet-5",
  "claude-sonnet-4-6",
  "claude-fable-5",
  "claude-mythos-5",
];

export const EST_ADAPTATIF = ADAPTATIFS.some((p) => MODELE.startsWith(p));

const EFFORT = (process.env.ANTHROPIC_EFFORT ?? "medium") as
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

/**
 * Réflexion sur les modèles antérieurs à 4.6, en jetons. Absente ou nulle,
 * la réflexion est désactivée — c'est le réglage par défaut sur Haiku, dont
 * l'intérêt est justement la latence et le coût. Le minimum imposé par l'API
 * est de 1024 jetons.
 */
const BUDGET = Number(process.env.ANTHROPIC_THINKING_BUDGET ?? 0);

/** Plafond de sortie. Sur les modèles adaptatifs il couvre réflexion + texte. */
export const MAX_JETONS = EST_ADAPTATIF ? 12000 : 6000;

type Reglages = Pick<
  Anthropic.MessageCreateParams,
  "thinking" | "output_config" | "max_tokens"
>;

/**
 * Paramètres de réflexion adaptés au modèle courant, à étaler dans l'appel.
 */
export function reglagesModele(): Reglages {
  if (EST_ADAPTATIF) {
    return {
      max_tokens: MAX_JETONS,
      thinking: { type: "adaptive" },
      output_config: { effort: EFFORT },
    };
  }

  // `budget_tokens` doit rester strictement inférieur à `max_tokens`.
  if (BUDGET >= 1024 && BUDGET < MAX_JETONS) {
    return {
      max_tokens: MAX_JETONS,
      thinking: { type: "enabled", budget_tokens: BUDGET },
    };
  }

  return { max_tokens: MAX_JETONS };
}
