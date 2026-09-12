"use client";

import { useEffect } from "react";
import { ecouterInstallation } from "@/lib/installation";

export function RegisterSW() {
  useEffect(() => {
    // L'invitation d'installation n'est émise qu'une fois, tôt : on l'écoute
    // ici, dans le seul composant monté sur tous les écrans.
    ecouterInstallation();
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Un échec d'enregistrement ne doit jamais casser l'application :
      // le service worker n'est qu'un confort hors ligne.
    });
  }, []);
  return null;
}
