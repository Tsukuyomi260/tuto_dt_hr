/**
 * Invitation d'installation de la PWA, captée une fois pour toute l'application.
 *
 * Chrome n'émet `beforeinstallprompt` qu'une fois, tôt après le chargement. Un
 * bouton monté plus tard — dans la feuille des discussions, ouverte des
 * minutes après — ne l'entendrait jamais. On l'écoute donc dès le démarrage,
 * depuis le layout, et les boutons s'abonnent ici.
 */

export type InvitationInstallation = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let invitation: InvitationInstallation | null = null;
const abonnes = new Set<() => void>();
let ecoute = false;

function prevenir() {
  for (const f of abonnes) f();
}

/** À appeler une fois, au plus tôt (RegisterSW, monté dans le layout). */
export function ecouterInstallation() {
  if (ecoute || typeof window === "undefined") return;
  ecoute = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    // Sans `preventDefault`, Chrome affiche sa propre mini-barre à un moment
    // qu'on ne choisit pas ; on garde l'invitation pour nos boutons.
    e.preventDefault();
    invitation = e as InvitationInstallation;
    prevenir();
  });
  window.addEventListener("appinstalled", () => {
    invitation = null;
    prevenir();
  });
}

export function abonner(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

export function invitationCourante(): InvitationInstallation | null {
  return invitation;
}

/** Une invitation ne sert qu'une fois, acceptée ou non. */
export function consommerInvitation() {
  invitation = null;
  prevenir();
}
