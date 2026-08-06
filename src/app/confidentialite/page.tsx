"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { effacerConversations } from "@/lib/db";
import { useReglages } from "@/lib/store";

/**
 * Obligations du Code du numérique béninois (loi n° 2017-20, autorité APDP) :
 * finalité explicite, et droits d'accès, de rectification et d'effacement.
 * Le bouton d'effacement doit fonctionner réellement, pas décorer la page.
 */
export default function Confidentialite() {
  const router = useRouter();
  const reinitialiser = useReglages((e) => e.reinitialiser);

  async function effacer() {
    await effacerConversations();
    reinitialiser();
    toast.success("Tes conversations ont été effacées.");
    router.replace("/");
  }

  return (
    <main className="flex h-full flex-col overflow-y-auto px-6 py-8">
      <h1 className="t-display text-balance">
        Tes données
      </h1>

      <div className="mt-5 flex flex-col gap-4 t-body text-ink-2">
        <p>
          <span className="font-semibold text-ink">Ce qui reste sur ton téléphone.</span>{" "}
          Tes conversations, tes flashcards et tes fiches sont enregistrées dans
          la mémoire de ton navigateur. Elles ne partent nulle part et
          fonctionnent sans connexion.
        </p>
        <p>
          <span className="font-semibold text-ink">Ce qui est envoyé.</span> Quand
          tu poses une question, son texte est transmis au modèle qui rédige la
          réponse, le temps de te répondre. Rien d&apos;autre n&apos;est
          transmis&nbsp;: ni ton nom, ni ton numéro, ni ta position.
        </p>
        <p>
          <span className="font-semibold text-ink">Aucun compte.</span> Tu peux
          utiliser le tuteur sans t&apos;identifier. Si tu enregistres un jour ton
          numéro, ce sera uniquement pour retrouver tes révisions sur un autre
          téléphone.
        </p>
        <p>
          <span className="font-semibold text-ink">Effacer.</span> Tu peux
          supprimer l&apos;intégralité de tes conversations à tout moment, depuis
          cette page. La suppression est immédiate et définitive.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-2.5">
        <Button variante="sec" onClick={() => router.back()}>
          Retour
        </Button>
        <Button
          variante="ghost"
          className="text-stop"
          onClick={effacer}
        >
          Effacer mes conversations
        </Button>
      </div>
    </main>
  );
}
