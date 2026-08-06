"use client";

import { cn } from "@/lib/cn";

type Props = {
  icone: React.ReactNode;
  titre: string;
  detail: string;
  onClick: () => void;
  teinte?: "primaire" | "accent";
  delai?: number;
};

/**
 * Les trois usages du brief (§6) vivent ici, dans la conversation — pas dans
 * un écran d'aiguillage. Le produit est un agent conversationnel : on ne met
 * pas de vestibule devant la porte.
 */
export function ActionCard({
  icone,
  titre,
  detail,
  onClick,
  teinte = "primaire",
  delai = 0,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delai}ms` }}
      className={cn(
        "animate-rise group flex w-full items-center gap-3.5 rounded-[var(--radius-card)]",
        "border border-line bg-[var(--raised)] px-4 py-3.5 text-left",
        "shadow-[var(--shadow-1)]",
        // Retour à l'appui, jamais au relâchement — et une durée courte,
        // sinon le bouton semble ne pas avoir entendu.
        "transition-[transform,box-shadow,border-color] duration-[180ms] ease-[var(--ease-out)]",
        "active:scale-[0.975] active:shadow-none",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-[13px]",
          teinte === "accent"
            ? "bg-accent-soft text-accent-ink"
            : "jeton text-primary-ink",
        )}
      >
        {icone}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block t-sub font-semibold">{titre}</span>
        <span className="mt-0.5 block t-caption text-ink-2">{detail}</span>
      </span>

      <svg
        className="shrink-0 text-ink-3 transition-transform duration-[180ms] ease-[var(--ease-out)] group-active:translate-x-0.5"
        width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
