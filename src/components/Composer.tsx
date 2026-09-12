"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { ImageIllisible, reduireImage } from "@/lib/image";

/* L'API Web Speech n'est pas typée dans la lib DOM standard. */
type Reconnaissance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

/** Ce que le candidat peut faire, selon la panne de dictée signalée par le navigateur. */
function messageDictee(erreur: string): string | null {
  switch (erreur) {
    case "not-allowed":
    case "service-not-allowed":
      return "Le micro est bloqué. Autorise-le dans les réglages du navigateur pour dicter.";
    case "network":
      return "La dictée a besoin d'internet. Vérifie ta connexion, ou écris ta question.";
    case "no-speech":
      return "Je n'ai rien entendu. Appuie sur le micro et parle près du téléphone.";
    case "audio-capture":
      return "Aucun micro détecté sur cet appareil.";
    case "aborted":
      return null;
    default:
      return "La dictée s'est interrompue. Réessaie, ou écris ta question.";
  }
}

declare global {
  interface Window {
    SpeechRecognition?: new () => Reconnaissance;
    webkitSpeechRecognition?: new () => Reconnaissance;
  }
}

type Props = {
  /** `image` est une URL de données déjà réduite (voir lib/image.ts). */
  onEnvoi: (texte: string, image?: string) => void;
  occupe: boolean;
};

export function Composer({ onEnvoi, occupe }: Props) {
  const [texte, setTexte] = useState("");
  const [dicte, setDicte] = useState(false);
  const [dictaDispo, setDictaDispo] = useState(false);
  /** Photo jointe, déjà réduite, en attente d'envoi. */
  const [image, setImage] = useState<string | null>(null);
  const [prepare, setPrepare] = useState(false);
  const reco = useRef<Reconnaissance | null>(null);
  /**
   * Texte présent dans le champ au moment où la dictée démarre. La dictée
   * s'ajoute à lui au lieu de l'écraser : le candidat qui a tapé le début de
   * sa question et dicte la suite ne doit pas perdre ce qu'il a écrit.
   */
  const base = useRef("");
  const champ = useRef<HTMLTextAreaElement>(null);
  const fichier = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;
    setDictaDispo(true);
    // Dictée locale au téléphone : zéro octet téléversé, zéro coût, réponse
    // immédiate. Le repli serveur n'existe que si l'API est absente.
    const r = new Ctor();
    r.lang = "fr-FR";
    r.interimResults = true;
    // Continu : une question se dicte rarement d'une traite, et la dictée
    // coupait à la première hésitation. Le candidat arrête lui-même.
    r.continuous = true;
    r.onresult = (e) => {
      // Tous les segments reconnus depuis le démarrage, définitifs comme
      // provisoires : ne garder que le dernier faisait disparaître le début
      // de la phrase dès la première pause.
      let dit = "";
      for (let i = 0; i < e.results.length; i++) dit += e.results[i][0].transcript;
      const avant = base.current.trimEnd();
      setTexte(avant ? `${avant} ${dit.trimStart()}` : dit.trimStart());
    };
    r.onend = () => setDicte(false);
    r.onerror = (e) => {
      setDicte(false);
      const m = messageDictee(e.error);
      if (m) toast.error(m);
    };
    reco.current = r;
    return () => r.stop();
  }, []);

  function basculerDictee() {
    if (!reco.current) {
      // Le bouton reste appuyable même sans dictée : un bouton grisé sans
      // explication laisse croire à une panne de l'application.
      toast("La dictée n'est pas disponible sur ce navigateur. Utilise le micro de ton clavier (Gboard, SwiftKey…), ou ouvre l'application dans Chrome.");
      return;
    }
    if (dicte) {
      reco.current.stop();
      setDicte(false);
    } else {
      base.current = texte;
      try {
        reco.current.start();
        setDicte(true);
      } catch {
        // `start()` lève si une session précédente n'est pas encore close.
        reco.current.stop();
      }
    }
  }

  // Le champ occupe toute la largeur : il doit grandir avec le texte, sinon
  // une question de trois lignes se lit par une fenêtre d'une seule ligne.
  useEffect(() => {
    const el = champ.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [texte]);

  async function choisirPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    // Le champ est remis à zéro tout de suite : sans ça, rechoisir la même
    // photo après l'avoir retirée ne déclenche aucun événement.
    e.target.value = "";
    if (!f) return;

    setPrepare(true);
    try {
      setImage(await reduireImage(f));
    } catch (erreur) {
      toast.error(
        erreur instanceof ImageIllisible
          ? erreur.message
          : "Cette photo n'a pas pu être préparée.",
      );
    } finally {
      setPrepare(false);
    }
  }

  /**
   * Une capture d'écran collée dans le champ (Ctrl+V sur ordinateur, appui
   * long sur certains claviers) est jointe comme une photo. Le texte collé,
   * lui, suit son chemin normal.
   */
  async function coller(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/"));
    if (!f || occupe || prepare) return;
    e.preventDefault();
    setPrepare(true);
    try {
      setImage(await reduireImage(f));
    } catch (erreur) {
      toast.error(
        erreur instanceof ImageIllisible ? erreur.message : "Cette image n'a pas pu être préparée.",
      );
    } finally {
      setPrepare(false);
    }
  }

  function envoyer() {
    const t = texte.trim();
    // Une photo seule est un envoi valable : « c'est quoi ça ? » se pose très
    // bien en montrant l'énoncé sans rien écrire.
    if ((!t && !image) || occupe || prepare) return;
    // La dictée en cours s'arrête à l'envoi : sinon ses derniers mots
    // reviendraient remplir le champ qu'on vient de vider.
    if (dicte) {
      reco.current?.stop();
      setDicte(false);
    }
    onEnvoi(t, image ?? undefined);
    setTexte("");
    setImage(null);
    champ.current?.focus();
  }

  const peutEnvoyer = (texte.trim() !== "" || image !== null) && !occupe && !prepare;

  return (
    /* La carte flotte sur la couche translucide parente : c'est elle qui porte
       le fond et le relief, pas la barre. */
    <div className="shrink-0 px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
      <div
        className={cn(
          "rounded-[26px] border border-line bg-[var(--raised)] shadow-[var(--shadow-2)]",
          "transition-colors duration-200 focus-within:border-line-2",
        )}
      >
        {/* La photo se voit avant de partir. Sans vignette, le candidat ne
            sait pas s'il a joint le bon cliché — ni s'il en a joint un. */}
        {image && (
          <div className="animate-emerge px-3 pt-3">
            <div className="relative inline-block">
              {/* Une URL de données locale : ni `next/image` ni optimisation
                  serveur n'ont de sens ici, d'où la balise native. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="Photo jointe à ton message"
                className="max-h-28 rounded-[14px] border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => setImage(null)}
                aria-label="Retirer la photo"
                className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-[var(--primary)] text-primary-ink shadow-[var(--shadow-2)] transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.9]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Le champ occupe sa propre ligne, en pleine largeur : une question
            longue reste lisible d'un coup d'œil au lieu de défiler dans une
            fente entre deux icônes. */}
        <textarea
          ref={champ}
          rows={1}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onPaste={coller}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              envoyer();
            }
          }}
          aria-label="Ta question"
          placeholder={dicte ? "Je t'écoute…" : "Écris ta question…"}
          className="block max-h-[132px] w-full resize-none bg-transparent px-4 pt-3.5 pb-1 t-sub text-ink placeholder:text-ink-3 focus:outline-none"
        />

        {/* Photo et micro restent visibles côte à côte, au même rang que le
            texte — le brief en fait trois entrées égales et interdit de les
            replier derrière un « + ». */}
        <div className="flex items-center gap-1 px-2 pt-0.5 pb-2">
          {/* Pas d'attribut `capture` : il forcerait l'appareil photo et
              retirerait l'accès à la galerie. Or le cahier des charges veut
              aussi les captures d'écran, qui n'y vivent nulle part ailleurs.
              Sans lui, Android propose les deux. */}
          <input
            ref={fichier}
            type="file"
            accept="image/*"
            onChange={choisirPhoto}
            className="hidden"
            tabIndex={-1}
            aria-hidden
          />
          <button
            type="button"
            onClick={() => fichier.current?.click()}
            disabled={occupe || prepare}
            aria-label="Joindre une photo ou une capture d'écran"
            title="Photo ou capture d'écran"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full",
              "transition-[transform,background-color] duration-[160ms] ease-[var(--ease-out)] active:scale-[0.94]",
              image ? "bg-accent-soft text-accent-ink" : "text-ink-2",
              (occupe || prepare) && "opacity-40",
            )}
          >
            {prepare ? (
              <span className="flex gap-0.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <i
                    key={i}
                    className="animate-dot block size-1 rounded-full bg-current"
                    style={{ animationDelay: `${i * 0.14}s` }}
                  />
                ))}
              </span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8a2 2 0 0 1 2-2h2.2l1.3-2h7l1.3 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <circle cx="12" cy="12.5" r="3.3" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={basculerDictee}
            disabled={occupe}
            aria-label={dicte ? "Arrêter la dictée" : "Dicter"}
            aria-pressed={dicte}
            title={dictaDispo ? "Dicter" : "Dictée indisponible sur ce navigateur"}
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full",
              "transition-[transform,background-color] duration-[160ms] ease-[var(--ease-out)] active:scale-[0.94]",
              dicte ? "bg-accent-soft text-accent-ink" : "text-ink-2",
              !dictaDispo && "opacity-40",
            )}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2.5" width="6" height="11.5" rx="3" />
              <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5" />
            </svg>
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={envoyer}
            disabled={!peutEnvoyer}
            aria-label="Envoyer"
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full",
              "transition-[transform,opacity,background-color] duration-[180ms] ease-[var(--ease-out)]",
              peutEnvoyer
                ? "bg-accent text-accent-on active:scale-[0.92]"
                : // Inactif, le bouton reste lisible mais cesse d'appeler :
                  // un aplat plein sans texte à envoyer serait une promesse.
                  "bg-[var(--line)] text-ink-3",
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
