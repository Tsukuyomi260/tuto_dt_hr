"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/Button";
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
        <div className="mb-6 grid size-14 place-items-center rounded-[17px] bg-primary text-[19px] font-semibold text-primary-ink">
          TH
        </div>
        <h1 className="text-[25px] leading-tight font-semibold tracking-[-0.02em]">
          Tuto DT HR
        </h1>
        <p className="mt-2.5 max-w-[30ch] text-[14.5px] leading-relaxed text-ink-2">
          Ton tuteur de révision en Technologie Hôtelière. Il te guide, il ne te
          donne pas la réponse tout de suite.
        </p>
        <span className="mt-6 rounded-full bg-accent-soft px-3.5 py-2 text-[12.5px] font-semibold text-accent-ink">
          Pas besoin de compte
        </span>
      </div>

      <div className="shrink-0 pb-6">
        <Button taille="lg" onClick={() => router.push("/calibrage")}>
          Commencer
        </Button>
        <p className="mt-3 text-center text-[11px] leading-snug text-ink-3">
          Tes conversations restent sur ton téléphone.{" "}
          <a href="/confidentialite" className="font-semibold text-accent-ink">
            En savoir plus
          </a>
        </p>
      </div>
    </main>
  );
}
