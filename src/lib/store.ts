import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FIL_INITIAL, nouvelIdentifiantFil } from "./fils";
import type { Niveau } from "./prompt";

type Reglages = {
  niveau: Niveau | null;
  onboardingFait: boolean;
  /**
   * Discussion ouverte. Persistée : le candidat qui ferme l'application au
   * milieu d'une épreuve doit la retrouver là où il l'a laissée, pas devant
   * un fil vide.
   */
  filCourant: string;
  setNiveau: (n: Niveau | null) => void;
  terminerOnboarding: () => void;
  /** Ouvre une discussion vierge sans rien supprimer de l'ancienne. */
  nouveauFil: () => void;
  ouvrirFil: (fil: string) => void;
  reinitialiser: () => void;
};

export const useReglages = create<Reglages>()(
  persist(
    (set) => ({
      niveau: null,
      onboardingFait: false,
      filCourant: FIL_INITIAL,
      setNiveau: (niveau) => set({ niveau }),
      terminerOnboarding: () => set({ onboardingFait: true }),
      nouveauFil: () => set({ filCourant: nouvelIdentifiantFil() }),
      ouvrirFil: (filCourant) => set({ filCourant }),
      // Appelé après l'effacement des conversations : le fil courant doit
      // repartir à zéro, sinon le candidat reste pointé sur un fil vidé.
      reinitialiser: () =>
        set({ niveau: null, onboardingFait: false, filCourant: FIL_INITIAL }),
    }),
    { name: "tuto-dt-hr-reglages" },
  ),
);
