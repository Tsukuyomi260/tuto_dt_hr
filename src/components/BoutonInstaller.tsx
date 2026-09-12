"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import {
  abonner,
  consommerInvitation,
  invitationCourante,
} from "@/lib/installation";

/**
 * Installer l'application sur l'écran d'accueil.
 *
 * L'application est déjà une PWA (manifeste, service worker) : installée,
 * elle s'ouvre en plein écran comme une application du Play Store, garde ses
 * conversations hors ligne, et ne pèse presque rien. Encore faut-il le
 * savoir — les premiers testeurs demandaient « une application mobile » sans
 * se douter qu'elle était à un geste.
 *
 * Trois cas :
 *   - Android / Chrome : le navigateur fournit une invitation native (captée
 *     au démarrage, voir lib/installation.ts), déclenchée au bouton ;
 *   - iPhone / Safari : aucune invitation programmable, on explique le geste
 *     (Partager → Sur l'écran d'accueil) ;
 *   - déjà installée, ou navigateur sans support : le bouton ne s'affiche pas.
 */
export function BoutonInstaller({ compact = false }: { compact?: boolean }) {
  const invitation = useSyncExternalStore(abonner, invitationCourante, () => null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const installee =
      matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (installee) return;
    const ua = navigator.userAgent;
    // iPadOS se présente comme un Mac : on le reconnaît à l'écran tactile.
    setIos(/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1));
  }, []);

  if (!invitation && !ios) return null;

  async function installer() {
    if (invitation) {
      await invitation.prompt();
      const { outcome } = await invitation.userChoice;
      consommerInvitation();
      if (outcome === "accepted") toast.success("Tuto DT HR est sur ton écran d'accueil.");
      return;
    }
    toast(
      "Sur iPhone : appuie sur le bouton Partager de Safari (le carré avec une flèche), puis sur « Sur l'écran d'accueil ».",
      { duration: 9000 },
    );
  }

  return (
    <button
      type="button"
      onClick={installer}
      className={cn(
        "flex w-full items-center justify-center gap-2 border border-line font-semibold transition-transform duration-[160ms] ease-[var(--ease-out)]",
        compact
          ? "rounded-[var(--radius-btn)] px-3 py-2.5 t-caption text-ink-2 active:scale-[0.97]"
          : "rounded-full bg-[var(--surface)] px-5 py-3 t-sub text-ink shadow-[var(--shadow-1)] active:scale-[0.975]",
      )}
    >
      <svg width={compact ? 15 : 17} height={compact ? 15 : 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
        <path d="M12 7v7M9 11l3 3 3-3M10.5 18.5h3" />
      </svg>
      Installer l&apos;application
    </button>
  );
}
