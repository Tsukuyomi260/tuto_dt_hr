"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useReglages } from "@/lib/store";

/**
 * Écran 1 — Accueil.
 *
 * Le centrage vertical d'origine faisait un écran de démarrage : un logo, un
 * titre, un bouton, et rien qui dise ce que l'application fait. Ici la
 * salutation ancre en haut à gauche et trois cartes annoncent les trois
 * usages — le candidat sait ce qu'il achète avant d'appuyer.
 *
 * La ligne de transparence sur les données reste sous le bouton : une phrase
 * et un lien, jamais un interstitiel bloquant (§9 du brief).
 */

/** Le même signe que le bandeau « À toi de jouer » des relances. */
const IcoRelance = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v6m0 6v6M3 12h6m6 0h6" />
  </svg>
);
const IcoAnnales = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);
const IcoFiches = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="6" width="14" height="12" rx="2" />
    <path d="M7 3h11a3 3 0 0 1 3 3v9" />
  </svg>
);

export default function Accueil() {
  const router = useRouter();
  const onboardingFait = useReglages((e) => e.onboardingFait);

  useEffect(() => {
    // Le candidat qui a déjà commencé retombe directement dans la conversation
    // — sauf s'il vient de demander l'accueil depuis la feuille des
    // discussions. Sans cette échappatoire, la redirection rendait l'écran
    // littéralement inatteignable une fois l'onboarding passé.
    //
    // Le paramètre est lu sur `window` et non par `useSearchParams`, qui
    // imposerait d'envelopper la page dans un <Suspense> pour rester
    // pré-rendue. On est déjà dans un effet, donc côté navigateur.
    const demandeExplicite = new URLSearchParams(window.location.search).has(
      "retour",
    );
    if (onboardingFait && !demandeExplicite) router.replace("/chat");
  }, [onboardingFait, router]);

  return (
    <main className="flex h-full flex-col overflow-y-auto px-5 pt-[max(18px,env(safe-area-inset-top))] pb-[max(18px,env(safe-area-inset-bottom))]">
      {/* Ligne de marque — la pastille descend en haut à gauche et cesse
          d'être un logo d'écran de chargement. */}
      <div className="animate-rise flex shrink-0 items-center gap-2.5">
        {/* Le monogramme en Palesun sur le bleu de marque : c'est le couple
            de la planche, et le seul endroit où le jaune fait du texte. */}
        <div className="jeton grid size-9 shrink-0 place-items-center rounded-[12px] text-[12px] font-semibold text-accent">
          TH
        </div>
        <span className="t-label text-ink-3">Technologie Hôtelière</span>
      </div>

      {/* Salutation sur deux lignes : la civilité en gris, le nom en gras. */}
      <div className="mt-7 shrink-0">
        <p
          className="animate-rise t-body text-ink-2"
          style={{ animationDelay: "70ms" }}
        >
          Bonjour,
        </p>
        <h1
          className="animate-rise t-display mt-0.5 text-balance"
          style={{ animationDelay: "130ms" }}
        >
          Tuto DT&nbsp;HR
        </h1>
        <p
          className="animate-rise mt-3 max-w-[32ch] t-sub text-ink-2"
          style={{ animationDelay: "190ms" }}
        >
          Ton tuteur de révision pour le Diplôme de Technicien, option
          Hôtellerie-Restauration.
        </p>
      </div>

      {/* Les trois usages. La carte pleine porte la signature du produit ;
          les deux autres, blanches, portent ce qu'il contient. */}
      <div className="mt-7 grid shrink-0 grid-cols-2 gap-3">
        <article
          className="animate-rise col-span-2 flex items-start gap-3.5 rounded-[var(--radius-card)] bg-[linear-gradient(150deg,var(--primary)_0%,var(--primary-deep)_100%)] p-4 text-primary-ink shadow-[var(--shadow-2)]"
          style={{ animationDelay: "250ms" }}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-accent text-accent-on">
            {IcoRelance}
          </span>
          <div className="min-w-0">
            <h2 className="t-sub font-semibold">Il ne te donne pas la réponse</h2>
            <p className="mt-1 text-[13px] leading-snug opacity-80">
              Deux tentatives d&apos;abord. C&apos;est comme ça que ça rentre.
            </p>
          </div>
        </article>

        <article
          className="animate-rise rounded-[var(--radius-card)] border border-line bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
          style={{ animationDelay: "310ms" }}
        >
          <span className="grid size-10 place-items-center rounded-[13px] bg-primary text-accent">
            {IcoAnnales}
          </span>
          <h2 className="mt-3 t-sub font-semibold">12 annales</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-2">
            2012 à 2025, texte officiel
          </p>
        </article>

        <article
          className="animate-rise rounded-[var(--radius-card)] border border-line bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
          style={{ animationDelay: "360ms" }}
        >
          <span className="grid size-10 place-items-center rounded-[13px] bg-primary-soft text-primary">
            {IcoFiches}
          </span>
          <h2 className="mt-3 t-sub font-semibold">Fiches</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-2">
            Le vocabulaire, recto verso
          </p>
        </article>
      </div>

      {/* Pousse le bouton en bas quand l'écran est haut, sans jamais forcer
          un défilement sur les petits. */}
      <div className="min-h-6 flex-1" />

      <div
        className="animate-rise shrink-0 pt-2"
        style={{ animationDelay: "420ms" }}
      >
        <button
          type="button"
          // Le candidat déjà calibré arrive ici par la feuille des discussions :
          // le renvoyer dans le calibrage lui referait répondre à une question
          // qu'il a déjà tranchée.
          onClick={() => router.push(onboardingFait ? "/chat" : "/calibrage")}
          // Aplat de Palesun plein, encre bleue dessus : 13,74:1, et c'est le
          // seul objet jaune de l'écran — donc le seul endroit où l'œil va.
          className="w-full rounded-full bg-accent px-5 py-4 t-body font-semibold text-accent-on shadow-[var(--shadow-2)] transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.975]"
        >
          {onboardingFait ? "Reprendre" : "Commencer"}
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
