import { cn } from "@/lib/cn";

type Props = {
  role: "user" | "assistant";
  /** Relance maïeutique — la signature pédagogique du produit. */
  relance?: boolean;
  horodatage?: number;
  /**
   * `rise`    — le message apparaît vraiment (candidat).
   * `emerge`  — fondu masqué par un flou, pour la reprise après l'indicateur
   *             de réflexion : sans lui on voit deux objets se superposer.
   * `false`   — aucune animation, pour le passage du flux au stockage local
   *             (le contenu est déjà à l'écran, le ré-animer le ferait sauter).
   */
  anime?: "rise" | "emerge" | false;
  children: React.ReactNode;
};

function heure(ts?: number) {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Bubble({
  role,
  relance,
  horodatage,
  anime = "rise",
  children,
}: Props) {
  const agent = role === "assistant";
  return (
    <div
      className={cn(
        "t-body max-w-[86%] px-4 py-3 whitespace-pre-wrap",
        anime === "rise" && "animate-rise",
        anime === "emerge" && "animate-emerge",
        agent
          ? // Le coin pincé du côté de l'émetteur : ce qui distingue les bulles
            // même en niveaux de gris, donc pour un daltonien.
            "self-start rounded-[8px_20px_20px_8px] border border-line border-l-[3px] shadow-[var(--shadow-1)]"
          : "self-end rounded-[20px_20px_8px_20px] bg-[linear-gradient(160deg,var(--primary)_0%,var(--primary-deep)_100%)] text-primary-ink shadow-[var(--shadow-2)]",
        agent &&
          (relance
            ? "border-l-accent bg-accent-soft"
            : "border-l-agent-edge bg-[var(--surface)]"),
      )}
    >
      {relance && (
        <span className="mb-2 flex items-center gap-1.5 t-label text-accent-ink">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3v6m0 6v6M3 12h6m6 0h6" />
          </svg>
          À toi de jouer
        </span>
      )}
      {children}
      {horodatage && (
        <span className="mt-1.5 block t-caption text-[11px] opacity-55 tabular-nums">
          {heure(horodatage)}
        </span>
      )}
    </div>
  );
}
