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
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

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
    r.continuous = false;
    r.onresult = (e) => {
      const dernier = e.results[e.results.length - 1];
      setTexte(dernier[0].transcript);
    };
    r.onend = () => setDicte(false);
    r.onerror = () => setDicte(false);
    reco.current = r;
    return () => r.stop();
  }, []);

  function basculerDictee() {
    if (!reco.current) return;
    if (dicte) {
      reco.current.stop();
      setDicte(false);
    } else {
      setTexte("");
      reco.current.start();
      setDicte(true);
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

  function envoyer() {
    const t = texte.trim();
    // Une photo seule est un envoi valable : « c'est quoi ça ? » se pose très
    // bien en montrant l'énoncé sans rien écrire.
    if ((!t && !image) || occupe || prepare) return;
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
            disabled={!dictaDispo || occupe}
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
