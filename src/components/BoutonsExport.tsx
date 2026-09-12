"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import type { DocExport } from "@/lib/export";

/**
 * Les deux sorties d'un document : PDF pour imprimer ou garder, image pour
 * partager sur WhatsApp ou retrouver dans la galerie.
 *
 * Le module d'export n'est chargé qu'à l'appui : il n'a rien à faire dans le
 * paquet initial du fil, que la plupart des candidats ouvrent sans jamais
 * rien télécharger.
 */
export function BoutonsExport({ doc }: { doc: () => DocExport }) {
  const [enCours, setEnCours] = useState<"pdf" | "image" | null>(null);

  async function exporter(format: "pdf" | "image") {
    if (enCours) return;
    setEnCours(format);
    try {
      const m = await import("@/lib/export");
      await (format === "pdf" ? m.exporterPdf(doc()) : m.exporterImage(doc()));
    } catch {
      toast.error("Le fichier n'a pas pu être préparé. Réessaie.");
    } finally {
      setEnCours(null);
    }
  }

  const bouton = (format: "pdf" | "image", libelle: string) => (
    <button
      type="button"
      onClick={() => exporter(format)}
      disabled={enCours !== null}
      aria-label={`Télécharger en ${libelle}`}
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 t-caption font-semibold text-ink-2",
        "transition-[transform,background-color] duration-[160ms] ease-[var(--ease-out)] active:scale-[0.96] active:bg-accent-soft",
        enCours !== null && enCours !== format && "opacity-50",
      )}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
      </svg>
      {enCours === format ? "…" : libelle}
    </button>
  );

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {bouton("pdf", "PDF")}
      {bouton("image", "Image")}
    </div>
  );
}
