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
          <div className="h-full w-1/2 rounded-full bg-primary" />
        </div>
      </div>

      <div className="flex-1 px-5 pt-8">
        <h1 className="t-display text-balance">
          Où en es-tu en Technologie Hôtelière&nbsp;?
        </h1>
        <p className="mt-3 t-body text-ink-2">
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
                style={{ animationDelay: `${120 + i * 60}ms` }}
                className={`animate-rise flex w-full items-center gap-3.5 rounded-[var(--radius-card)] border bg-[var(--raised)] px-4 py-4 text-left shadow-[var(--shadow-1)] transition-[transform,border-color,background-color] duration-[180ms] ease-[var(--ease-out)] active:scale-[0.975] ${
                  choisi
                    ? "border-accent-ink bg-accent-soft"
                    : "border-line"
                }`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-[12px] text-[13px] font-semibold transition-colors duration-[180ms] ${
                    choisi
                      ? "jeton text-primary-ink"
                      : "bg-accent-soft text-accent-ink"
                  }`}
                >
                  {i + 1}
                </span>
                <span>
                  <span className="block t-sub font-semibold">
                    {NIVEAUX[cle].titre}
                  </span>
                  <span className="mt-0.5 block t-caption text-ink-2">
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
