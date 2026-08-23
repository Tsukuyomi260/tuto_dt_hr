"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { resumeFils } from "@/lib/db";
import { useReglages } from "@/lib/store";

/**
 * Feuille des discussions.
 *
 * Le tuteur n'avait qu'un seul fil, sans fin : une question sur les annales
 * de 2021 restait collée derrière trois semaines de vocabulaire. Ouvrir une
 * discussion ne supprime donc rien — le candidat révise pour un examen, son
 * historique est son travail.
 *
 * Feuille par le bas plutôt que tiroir latéral : c'est le bord de l'écran
 * qu'un pouce atteint sans changer de prise sur le téléphone.
 */

const IcoFermer = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
const IcoNouvelle = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IcoAccueil = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V20h13V9.5" />
  </svg>
);
const IcoDonnees = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
  </svg>
);

/** Aujourd'hui : l'heure suffit. Au-delà : la date, qui situe vraiment. */
function quand(ts: number) {
  const d = new Date(ts);
  const memeJour = new Date().toDateString() === d.toDateString();
  return memeJour
    ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

type Props = { ouvert: boolean; onFermer: () => void };

export function PanneauFils({ ouvert, onFermer }: Props) {
  const router = useRouter();
  const filCourant = useReglages((e) => e.filCourant);
  const nouveauFil = useReglages((e) => e.nouveauFil);
  const ouvrirFil = useReglages((e) => e.ouvrirFil);

  // La liste n'est relue que feuille ouverte : sans ce garde-fou, chaque
  // jeton reçu en streaming déclencherait une relecture de toute la table.
  const fils = useLiveQuery(
    () => (ouvert ? resumeFils() : Promise.resolve([])),
    [ouvert],
  );

  useEffect(() => {
    if (!ouvert) return;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", auClavier);
    return () => window.removeEventListener("keydown", auClavier);
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  function demarrer() {
    nouveauFil();
    onFermer();
  }

  function ouvrir(fil: string) {
    ouvrirFil(fil);
    onFermer();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onFermer}
        className="animate-voile absolute inset-0 bg-[rgba(10,26,37,0.55)]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Discussions"
        className="animate-feuille relative flex max-h-[76dvh] w-full max-w-lg flex-col rounded-t-[24px] border-t border-line bg-[var(--surface)] shadow-[var(--shadow-3)]"
      >
        {/* Poignée : elle dit « ça se tire vers le bas » avant tout texte. */}
        <div className="flex shrink-0 justify-center pt-2.5">
          <span className="h-1 w-9 rounded-full bg-line-2" aria-hidden />
        </div>

        <header className="flex shrink-0 items-center gap-3 px-5 pt-3 pb-3">
          <h2 className="flex-1 t-title">Discussions</h2>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-2 transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.92]"
          >
            {IcoFermer}
          </button>
        </header>

        <div className="shrink-0 px-5 pb-3">
          <button
            type="button"
            onClick={demarrer}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 t-sub font-semibold text-accent-on shadow-[var(--shadow-1)] transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.975]"
          >
            {IcoNouvelle}
            Nouvelle discussion
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {fils?.length === 0 && (
            <p className="py-6 text-center t-caption text-ink-3">
              Aucune discussion enregistrée pour l&apos;instant.
            </p>
          )}

          <ul className="flex flex-col gap-2 pb-2">
            {fils?.map((f) => {
              const courant = f.fil === filCourant;
              return (
                <li key={f.fil}>
                  <button
                    type="button"
                    onClick={() => ouvrir(f.fil)}
                    aria-current={courant ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-[var(--radius-card)] border px-3.5 py-3 text-left",
                      "transition-[transform,border-color] duration-[160ms] ease-[var(--ease-out)] active:scale-[0.985]",
                      courant
                        ? "border-accent-ink bg-accent-soft"
                        : "border-line bg-[var(--raised)]",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block t-sub font-semibold">
                        {f.titre}
                      </span>
                      <span className="mt-0.5 block t-caption text-ink-2">
                        {quand(f.dernier)} · {f.nombre} message
                        {f.nombre > 1 ? "s" : ""}
                        {courant && " · en cours"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-line px-5 pt-3 pb-[max(14px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => router.push("/?retour=1")}
            className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-line px-3 py-2.5 t-caption font-semibold text-ink-2 transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.97]"
          >
            {IcoAccueil}
            Accueil
          </button>
          <button
            type="button"
            onClick={() => router.push("/confidentialite")}
            className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-line px-3 py-2.5 t-caption font-semibold text-ink-2 transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.97]"
          >
            {IcoDonnees}
            Mes données
          </button>
        </div>
      </div>
    </div>
  );
}
