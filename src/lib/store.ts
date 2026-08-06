import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Niveau } from "./prompt";

type Reglages = {
  niveau: Niveau | null;
  onboardingFait: boolean;
  setNiveau: (n: Niveau | null) => void;
  terminerOnboarding: () => void;
  reinitialiser: () => void;
};

export const useReglages = create<Reglages>()(
  persist(
    (set) => ({
      niveau: null,
      onboardingFait: false,
      setNiveau: (niveau) => set({ niveau }),
      terminerOnboarding: () => set({ onboardingFait: true }),
      reinitialiser: () => set({ niveau: null, onboardingFait: false }),
    }),
    { name: "tuto-dt-hr-reglages" },
  ),
);
