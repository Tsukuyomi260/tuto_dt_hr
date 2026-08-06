"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useReglages } from "@/lib/store";

/**
 * Écran 1 — Accueil. Un seul écran, sans défilement, un seul bouton.
 * La ligne de transparence sur les données est ici, sous le bouton :
 * une phrase et un lien, jamais un interstitiel bloquant (§9 du brief).
 */
export default function Accueil() {
  const router = useRouter();
  const onboardingFait = useReglages((e) => e.onboardingFait);

  useEffect(() => {
    // Le candidat qui a déjà commencé retombe directement dans la conversation.
    if (onboardingFait) router.replace("/chat");
  }, [onboardingFait, router]);

  return (
    <main className="flex h-full flex-col px-7">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div
          className="jeton animate-materialize mb-7 grid size-20 place-items-center rounded-[26px] text-[26px] font-semibold text-primary-ink"
          style={{ animationDelay: "40ms" }}
        >
          TH
        </div>

        <h1
          className="animate-rise t-display text-balance"
          style={{ animationDelay: "170ms" }}
        >
          Tuto DT&nbsp;HR
        </h1>

        <p
          className="animate-rise mt-3.5 max-w-[27ch] t-body text-ink-2"
          style={{ animationDelay: "240ms" }}
        >
          Ton tuteur de révision en Technologie Hôtelière.
        </p>
      </div>

      <div className="animate-rise shrink-0 pb-8" style={{ animationDelay: "310ms" }}>
        <button
          type="button"
          onClick={() => router.push("/calibrage")}
          className="w-full rounded-[var(--radius-btn)] bg-[linear-gradient(160deg,var(--primary)_0%,var(--primary-deep)_100%)] px-5 py-4 t-body font-semibold text-primary-ink shadow-[var(--shadow-2)] transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.975]"
        >
          Commencer
        </button>
        <p className="mt-3.5 text-center text-[11.5px] leading-snug text-ink-3">
          Tes conversations restent sur ton téléphone.{" "}
          <a
            href="/confidentialite"
            className="font-semibold text-accent-ink underline underline-offset-2"
          >
            En savoir plus
          </a>
        </p>
      </div>
    </main>
  );
}
