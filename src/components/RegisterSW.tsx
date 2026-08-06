"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Un échec d'enregistrement ne doit jamais casser l'application :
      // le service worker n'est qu'un confort hors ligne.
    });
  }, []);
  return null;
}
