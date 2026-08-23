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
        // Le jaune de marque est la seule couleur d'action de l'application :
        // partout où il apparaît en aplat, c'est qu'il y a quelque chose à
        // presser. Il porte toujours l'encre bleue — 13,74:1.
        pri: "bg-accent text-accent-on shadow-[var(--shadow-2)] active:shadow-[var(--shadow-1)]",
        sec: "border border-line bg-[var(--raised)] text-ink shadow-[var(--shadow-1)]",
        ghost: "text-ink-2",
      },
      // Plein rond : c'est la forme des boutons d'action des trois références,
      // et elle distingue un bouton d'une carte, qui reste à 20 px.
      taille: {
        sm: "t-caption px-3.5 py-2 rounded-full",
        base: "t-sub px-4 py-2.5 rounded-full",
        lg: "t-body px-5 py-4 w-full rounded-full",
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
