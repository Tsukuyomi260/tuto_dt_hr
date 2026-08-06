"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const bouton = cva(
  // scale(0.97) à l'appui : seul retour tactile disponible, indispensable
  // quand le réseau met deux secondes à répondre.
  [
    "inline-flex items-center justify-center gap-2 font-semibold leading-tight",
    "transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
    "active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100",
    "disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variante: {
        pri: "bg-primary text-primary-ink",
        sec: "border border-line-2 text-ink",
        ghost: "text-ink-2 hover:text-ink",
      },
      taille: {
        sm: "text-[12.5px] px-3 py-[7px] rounded-[var(--radius-btn)]",
        base: "text-[13.5px] px-4 py-[9px] rounded-[var(--radius-btn)]",
        lg: "text-[15px] px-5 py-[14px] w-full rounded-[var(--radius-btn)]",
      },
    },
    defaultVariants: { variante: "pri", taille: "base" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof bouton>;

export function Button({ className, variante, taille, ...reste }: Props) {
  return (
    <button className={cn(bouton({ variante, taille }), className)} {...reste} />
  );
}
