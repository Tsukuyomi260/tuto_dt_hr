"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { NIVEAUX, type Niveau } from "@/lib/prompt";
import { useReglages } from "@/lib/store";

/**
 * Écran 2 — L'unique question de calibrage.
 *
 * La date de session n'est pas demandée : le DT HR est une session nationale
 * unique. Duolingo pose huit questions parce qu'il enseigne quarante langues ;
 * nous en couvrons une.
 */
export default function Calibrage() {
  const router = useRouter();
  const { niveau, setNiveau, terminerOnboarding } = useReglages();

  function continuer() {
    terminerOnboarding();
    router.replace("/chat");
  }

  return (
    <main className="flex h-full flex-col">
      <div className="shrink-0 px-5 pt-4">
        <div className="h-1 overflow-hidden rounded-full bg-line">
          <div className="h-full w-1/2 bg-accent" />
        </div>
      </div>

      <div className="flex-1 px-5 pt-8">
        <h1 className="text-[21px] leading-tight font-semibold tracking-[-0.015em]">
          Où en es-tu en Technologie Hôtelière&nbsp;?
        </h1>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-2">
          Aucune mauvaise réponse — ça m&apos;aide juste à ajuster mes relances.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {(Object.keys(NIVEAUX) as Niveau[]).map((cle, i) => {
            const choisi = niveau === cle;
            return (
              <button
                key={cle}
                type="button"
                onClick={() => setNiveau(cle)}
                aria-pressed={choisi}
                className={`flex w-full items-center gap-3 rounded-[var(--radius-card)] border bg-surface px-3.5 py-3.5 text-left transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.985] ${
                  choisi ? "border-accent" : "border-line"
                }`}
              >
                <span className="grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-[13px] font-semibold text-accent-ink">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-[14px] leading-tight font-semibold">
                    {NIVEAUX[cle].titre}
                  </span>
                  <span className="mt-0.5 block text-[11.8px] leading-snug text-ink-2">
                    {NIVEAUX[cle].sousTitre}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* « Passer » est visible et sans conséquence — un mur souple qu'on ne
          peut pas franchir n'est plus un mur souple. */}
      <div className="flex shrink-0 items-center gap-3 px-5 pb-6">
        <Button variante="ghost" onClick={continuer}>
          Passer
        </Button>
        <Button className="flex-1 py-3.5" onClick={continuer}>
          Continuer
        </Button>
      </div>
    </main>
  );
}
