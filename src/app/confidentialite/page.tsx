"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { effacerConversations } from "@/lib/db";
import { useReglages } from "@/lib/store";

/**
 * Obligations du Code du numérique béninois (loi n° 2017-20, autorité APDP) :
 * finalité explicite, et droits d'accès, de rectification et d'effacement.
 * Le bouton d'effacement doit fonctionner réellement, pas décorer la page.
 *
 * Les quatre engagements sont des cartes et non un bloc de prose : sur un
 * téléphone, quatre paragraphes d'affilée se lisent comme des conditions
 * générales, c'est-à-dire pas du tout.
 */

const IcoTelephone = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </svg>
);
const IcoEnvoi = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);
const IcoAnonyme = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);
const IcoEffacer = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
  </svg>
);

const ENGAGEMENTS = [
  {
    icone: IcoTelephone,
    titre: "Ce qui reste sur ton téléphone",
    texte:
      "Tes conversations, tes flashcards et tes fiches sont enregistrées dans la mémoire de ton navigateur. Elles ne partent nulle part et fonctionnent sans connexion.",
  },
  {
    icone: IcoEnvoi,
    titre: "Ce qui est envoyé",
    texte:
      "Quand tu poses une question, son texte est transmis au modèle qui rédige la réponse, le temps de te répondre. Rien d'autre n'est transmis : ni ton nom, ni ton numéro, ni ta position.",
  },
  {
    icone: IcoAnonyme,
    titre: "Aucun compte",
    texte:
      "Tu peux utiliser le tuteur sans t'identifier. Si tu enregistres un jour ton numéro, ce sera uniquement pour retrouver tes révisions sur un autre téléphone.",
  },
  {
    icone: IcoEffacer,
    titre: "Effacer",
    texte:
      "Tu peux supprimer l'intégralité de tes conversations à tout moment, depuis cette page. La suppression est immédiate et définitive.",
  },
];

export default function Confidentialite() {
  const router = useRouter();
  const reinitialiser = useReglages((e) => e.reinitialiser);
  /**
   * L'effacement est irréversible et ne demandait rien avant de partir. Un
   * pouce qui glisse sur un téléphone effaçait des semaines de révision : le
   * bouton demande donc une seconde confirmation, sur place.
   */
  const [confirme, setConfirme] = useState(false);

  async function effacer() {
    if (!confirme) {
      setConfirme(true);
      return;
    }
    await effacerConversations();
    reinitialiser();
    toast.success("Tes conversations ont été effacées.");
    router.replace("/");
  }

  return (
    <main className="flex h-full flex-col overflow-y-auto px-5 pt-[max(18px,env(safe-area-inset-top))] pb-[max(18px,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Retour"
        className="animate-rise grid size-9 shrink-0 place-items-center rounded-full border border-line bg-[var(--surface)] text-ink-2 shadow-[var(--shadow-1)] transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.92]"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <h1
        className="animate-rise t-display mt-5 text-balance"
        style={{ animationDelay: "70ms" }}
      >
        Tes données
      </h1>
      <p
        className="animate-rise mt-2.5 max-w-[34ch] t-sub text-ink-2"
        style={{ animationDelay: "120ms" }}
      >
        Quatre engagements, en clair. Aucun n&apos;a de petites lignes.
      </p>

      <div className="mt-6 flex shrink-0 flex-col gap-2.5">
        {ENGAGEMENTS.map((e, i) => (
          <article
            key={e.titre}
            className="animate-rise flex items-start gap-3.5 rounded-[var(--radius-card)] border border-line bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
            style={{ animationDelay: `${170 + i * 55}ms` }}
          >
            <span className="jeton grid size-10 shrink-0 place-items-center rounded-[13px] text-accent">
              {e.icone}
            </span>
            <div className="min-w-0">
              <h2 className="t-sub font-semibold">{e.titre}</h2>
              <p className="mt-1 t-caption leading-relaxed text-ink-2">
                {e.texte}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="min-h-6 flex-1" />

      <div className="shrink-0 pt-4">
        <Button variante="sec" className="w-full" onClick={() => router.back()}>
          Retour
        </Button>
        <Button
          variante="ghost"
          className="mt-1.5 w-full text-stop"
          onClick={effacer}
        >
          {confirme
            ? "Confirmer — cette action est définitive"
            : "Effacer mes conversations"}
        </Button>
      </div>
    </main>
  );
}
