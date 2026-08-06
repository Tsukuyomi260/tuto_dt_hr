import { cn } from "@/lib/cn";

type Props = {
  role: "user" | "assistant";
  /** Variante accentuée pour une relance maïeutique (§7 du brief). */
  relance?: boolean;
  horodatage?: number;
  children: React.ReactNode;
};

function heure(ts?: number) {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Bubble({ role, relance, horodatage, children }: Props) {
  const agent = role === "assistant";
  return (
    <div
      className={cn(
        "animate-rise max-w-[85%] px-3.5 py-2.5 text-[14.5px] leading-[1.55] whitespace-pre-wrap",
        agent
          ? // Le coin pincé du côté de l'émetteur distingue les bulles même en
            // niveaux de gris — c'est ce qui les sépare, pas seulement la couleur.
            "self-start border border-line border-l-[2.5px] rounded-[6px_18px_18px_6px]"
          : "self-end bg-primary text-primary-ink rounded-[18px_18px_6px_18px]",
        agent && (relance ? "bg-accent-soft border-l-accent" : "bg-surface border-l-agent-edge"),
      )}
    >
      {relance && (
        <span className="mb-1.5 block font-mono text-[9.5px] font-semibold tracking-[0.1em] text-accent-ink uppercase">
          Relance
        </span>
      )}
      {children}
      {horodatage && (
        <span className="mt-1.5 block text-[10.5px] opacity-60 tabular-nums">
          {heure(horodatage)}
        </span>
      )}
    </div>
  );
}
