"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { QuizJoint } from "@/lib/db";

type Props = {
  quiz: QuizJoint;
  /** Réponses déjà données, relues depuis le stockage local. */
  reponses?: (number | null)[];
  /** Enregistre les réponses à chaque choix, pour retrouver le score plus tard. */
  onRepondre?: (reponses: (number | null)[]) => void;
  /** Renvoie le bilan au tuteur pour reprendre les erreurs avec lui. */
  onRevoir?: (bilan: string) => void;
};

/**
 * Quiz d'auto-évaluation : une question à la fois, corrigée sur place.
 *
 * Une mauvaise réponse n'est jamais en rouge — le rouge est réservé au
 * message non délivré (§4 et §8 du brief). La bonne proposition s'allume en
 * vert, celle du candidat reste simplement marquée, et l'explication suit.
 * Le score de fin est un point de départ, pas un verdict : il mène droit au
 * tuteur pour reprendre les erreurs une à une.
 */
export function CarteQuiz({ quiz, reponses: initiales, onRepondre, onRevoir }: Props) {
  const total = quiz.questions.length;
  const [reponses, setReponses] = useState<(number | null)[]>(
    () => initiales ?? Array(total).fill(null),
  );
  // On reprend à la première question sans réponse.
  const [index, setIndex] = useState(() => {
    const i = (initiales ?? []).findIndex((r) => r === null);
    return i === -1 ? (initiales?.length === total ? total : 0) : i;
  });

  const fini = index >= total;
  const score = reponses.filter((r, i) => r === quiz.questions[i]?.bonne).length;

  function choisir(choix: number) {
    if (reponses[index] !== null) return;
    const suivantes = reponses.map((r, i) => (i === index ? choix : r));
    setReponses(suivantes);
    onRepondre?.(suivantes);
  }

  function recommencer() {
    const vides = Array(total).fill(null);
    setReponses(vides);
    setIndex(0);
    onRepondre?.(vides);
  }

  function revoir() {
    const erreurs = quiz.questions
      .map((q, i) => ({ q, r: reponses[i] }))
      .filter(({ q, r }) => r !== q.bonne)
      .map(({ q, r }) => `« ${q.question} » — j'avais répondu « ${r === null ? "rien" : q.choix[r]} »`);
    onRevoir?.(
      `J'ai fini le quiz « ${quiz.titre} » : ${score}/${total}.` +
        (erreurs.length > 0
          ? ` Aide-moi à comprendre mes erreurs :\n${erreurs.map((e) => `- ${e}`).join("\n")}`
          : " Tout est juste ! Qu'est-ce que je révise ensuite ?"),
    );
  }

  const q = quiz.questions[Math.min(index, total - 1)];
  const choisi = fini ? null : reponses[index];

  return (
    <section
      className="animate-emerge w-full shrink-0 self-start overflow-hidden rounded-[var(--radius-card)] border border-line bg-[var(--surface)] shadow-[var(--shadow-1)]"
      aria-label={`Quiz : ${quiz.titre}`}
    >
      <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="jeton grid size-8 shrink-0 place-items-center rounded-[10px] text-accent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2.1-2.4 3.6M12 17h.01" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate t-caption leading-tight font-semibold">{quiz.titre}</h2>
          <p className="truncate text-[11px] leading-tight text-ink-2">
            Quiz d&apos;auto-évaluation — choisis une réponse
          </p>
        </div>
        <span className="shrink-0 t-caption tabular-nums text-ink-2">
          {fini ? `${score} / ${total}` : `${index + 1} / ${total}`}
        </span>
      </header>

      {/* Barre de progression : une case par question. */}
      <div className="flex gap-1 px-4 pt-3" aria-hidden>
        {quiz.questions.map((qq, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              reponses[i] === null
                ? i === index
                  ? "bg-[var(--line-2)]"
                  : "bg-[var(--line)]"
                : reponses[i] === qq.bonne
                  ? "bg-ok"
                  : "bg-[var(--ink-3)]",
            )}
          />
        ))}
      </div>

      {fini ? (
        <div className="px-4 py-4">
          <p className="t-title tabular-nums">
            {score} / {total}
          </p>
          <p className="mt-1 t-sub text-ink-2">
            {score === total
              ? "Sans faute. Tu peux passer à un autre chapitre."
              : score >= total / 2
                ? "Bonne base. Reprenons ensemble ce qui a coincé."
                : "C'est en se trompant maintenant qu'on réussit le jour J. On reprend les erreurs ensemble ?"}
          </p>
          <div className="mt-3.5 flex items-center gap-2">
            <button
              type="button"
              onClick={recommencer}
              className="flex-1 rounded-full border border-line px-3 py-2.5 t-caption font-semibold text-ink-2 transition-colors duration-200 active:bg-accent-soft"
            >
              Recommencer
            </button>
            {onRevoir && (
              <button
                type="button"
                onClick={revoir}
                className="flex-1 rounded-full bg-accent px-3 py-2.5 t-caption font-semibold text-accent-on transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.97]"
              >
                {score === total ? "La suite ?" : "Revoir mes erreurs"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 py-3.5">
          <p className="t-body font-semibold">{q.question}</p>

          <div className="mt-3 flex flex-col gap-2" role="group" aria-label="Propositions">
            {q.choix.map((c, i) => {
              const repondu = choisi !== null;
              const bonne = i === q.bonne;
              const sien = i === choisi;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choisir(i)}
                  disabled={repondu}
                  aria-pressed={sien}
                  className={cn(
                    "flex items-start gap-2.5 rounded-[14px] border px-3.5 py-2.5 text-left t-sub",
                    "transition-[transform,background-color,border-color] duration-[180ms] ease-[var(--ease-out)]",
                    !repondu && "border-line bg-[var(--raised)] active:scale-[0.985] active:bg-accent-soft",
                    repondu && bonne && "border-ok bg-ok-soft",
                    repondu && sien && !bonne && "border-line-2 bg-primary-soft",
                    repondu && !bonne && !sien && "border-line opacity-60",
                  )}
                >
                  <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full border border-current text-[11px] font-semibold opacity-70">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{c}</span>
                </button>
              );
            })}
          </div>

          {choisi !== null && (
            <div className="animate-emerge mt-3">
              <p className="t-sub">
                <span className="font-semibold">
                  {choisi === q.bonne ? "Exactement. " : `La bonne réponse : ${String.fromCharCode(65 + q.bonne)}. `}
                </span>
                {q.explication}
              </p>
              <button
                type="button"
                onClick={() => setIndex((i) => i + 1)}
                className="jeton mt-3 w-full rounded-full px-3 py-2.5 t-caption font-semibold text-accent transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.97]"
              >
                {index + 1 >= total ? "Voir mon score" : "Question suivante"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
