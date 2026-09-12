/**
 * Export d'un document (épreuve, fiche de révision, emploi du temps) en PDF
 * ou en image, entièrement dans le navigateur.
 *
 * Pas de bibliothèque PDF : les polices standard d'un PDF ne connaissent que
 * le Latin-1, et une épreuve béninoise contient des « ’ », des « œ », des
 * tableaux alignés. On dessine donc chaque page sur un canevas, avec les
 * polices du téléphone qui savent tout afficher, puis on assemble les pages
 * en PDF (une image JPEG par page — quelques lignes de syntaxe PDF suffisent)
 * ou on les livre telles quelles en PNG.
 *
 * Rien ne quitte l'appareil : pas d'aller-retour serveur, donc pas de données
 * consommées, et l'export marche hors ligne pour une épreuve déjà reçue.
 */

export type BlocDoc =
  | { t: "h"; v: string }
  | { t: "p"; v: string }
  | { t: "li"; v: string }
  /** Texte à chasse fixe dont l'alignement porte le sens (un tableau). */
  | { t: "pre"; v: string }
  /** Encadré mis en valeur (le piège de l'examen). */
  | { t: "note"; v: string };

export type DocExport = {
  titre: string;
  sousTitre?: string;
  blocs: BlocDoc[];
  /** Nom de fichier sans extension. */
  fichier: string;
};

// A4 à ~150 ppp : lisible à l'impression, léger à partager sur WhatsApp.
const L = 1240;
const H = 1754;
const MARGE = 96;
const LARGEUR = L - 2 * MARGE;
const HAUT_CONTENU = 150;
const BAS_CONTENU = H - 110;

const ENCRE = "#122837";
const ENCRE_2 = "#4a6275";
const FILET = "#dfe5ea";
const FOND_PRE = "#e3eaf0";
const FOND_NOTE = "#fbfbdd";
const BORD_NOTE = "#6b6d00";

function police(): string {
  try {
    const f = getComputedStyle(document.body).fontFamily;
    if (f) return f;
  } catch {
    /* rendu hors document : repli ci-dessous */
  }
  return "system-ui, -apple-system, Roboto, 'Segoe UI', sans-serif";
}

const MONO = "ui-monospace, 'Roboto Mono', Menlo, Consolas, monospace";

/** Coupe un paragraphe en lignes tenant dans `largeur`, mots trop longs compris. */
function couper(ctx: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
  const lignes: string[] = [];
  for (const brut of texte.split("\n")) {
    const mots = brut.split(/\s+/).filter(Boolean);
    if (mots.length === 0) {
      lignes.push("");
      continue;
    }
    let courante = "";
    for (let mot of mots) {
      // Un mot plus large que la colonne (une URL, une suite de points) est
      // coupé à la lettre plutôt que de déborder de la page.
      while (ctx.measureText(mot).width > largeur) {
        let n = mot.length - 1;
        while (n > 1 && ctx.measureText(mot.slice(0, n)).width > largeur) n--;
        if (courante) {
          lignes.push(courante);
          courante = "";
        }
        lignes.push(mot.slice(0, n));
        mot = mot.slice(n);
      }
      const essai = courante ? `${courante} ${mot}` : mot;
      if (ctx.measureText(essai).width <= largeur) {
        courante = essai;
      } else {
        lignes.push(courante);
        courante = mot;
      }
    }
    if (courante) lignes.push(courante);
  }
  return lignes;
}

/** Une ligne prête à dessiner, déjà positionnée dans le flux vertical. */
type Ligne = {
  texte: string;
  font: string;
  couleur: string;
  hauteur: number;
  x: number;
  /** Fond à peindre derrière la ligne (bloc `pre` ou `note`). */
  fond?: string;
  bord?: string;
  /** Espace à laisser avant la ligne. */
  avant: number;
};

function composer(ctx: CanvasRenderingContext2D, doc: DocExport): Ligne[] {
  const sans = police();
  const sortie: Ligne[] = [];

  for (const bloc of doc.blocs) {
    if (bloc.t === "h") {
      const font = `600 34px ${sans}`;
      ctx.font = font;
      couper(ctx, bloc.v, LARGEUR).forEach((texte, i) =>
        sortie.push({ texte, font, couleur: ENCRE, hauteur: 46, x: MARGE, avant: i === 0 ? 30 : 0 }),
      );
    } else if (bloc.t === "p" || bloc.t === "note") {
      const font = `400 27px ${sans}`;
      ctx.font = font;
      const retrait = bloc.t === "note" ? 28 : 0;
      couper(ctx, bloc.v, LARGEUR - 2 * retrait).forEach((texte, i) =>
        sortie.push({
          texte,
          font,
          couleur: ENCRE,
          hauteur: 40,
          x: MARGE + retrait,
          avant: i === 0 ? 16 : 0,
          ...(bloc.t === "note" ? { fond: FOND_NOTE, bord: BORD_NOTE } : {}),
        }),
      );
    } else if (bloc.t === "li") {
      const font = `400 27px ${sans}`;
      ctx.font = font;
      couper(ctx, bloc.v, LARGEUR - 34).forEach((texte, i) =>
        sortie.push({
          texte: i === 0 ? `• ${texte}` : texte,
          font,
          couleur: ENCRE,
          hauteur: 40,
          x: MARGE + (i === 0 ? 0 : 34),
          avant: i === 0 ? 8 : 0,
        }),
      );
    } else {
      // Le tableau garde ses colonnes : on réduit la police jusqu'à ce que la
      // ligne la plus longue tienne, et on ne coupe qu'en dernier recours.
      const brutes = bloc.v.replace(/^\n+|\n+$/g, "").split("\n");
      let taille = 24;
      for (; taille > 13; taille--) {
        ctx.font = `400 ${taille}px ${MONO}`;
        if (Math.max(...brutes.map((l) => ctx.measureText(l).width)) <= LARGEUR - 32) break;
      }
      const font = `400 ${taille}px ${MONO}`;
      ctx.font = font;
      const hauteur = Math.round(taille * 1.45);
      let premiere = true;
      for (const brute of brutes) {
        const morceaux =
          ctx.measureText(brute).width <= LARGEUR - 32 ? [brute] : couper(ctx, brute, LARGEUR - 32);
        for (const texte of morceaux) {
          sortie.push({
            texte,
            font,
            couleur: ENCRE,
            hauteur,
            x: MARGE + 16,
            fond: FOND_PRE,
            avant: premiere ? 18 : 0,
          });
          premiere = false;
        }
      }
    }
  }
  return sortie;
}

/** Répartit les lignes en pages et dessine chacune sur son canevas. */
function paginer(doc: DocExport): HTMLCanvasElement[] {
  const mesure = document.createElement("canvas").getContext("2d");
  if (!mesure) throw new Error("Canevas indisponible.");
  const lignes = composer(mesure, doc);

  // La première page commence sous le titre du document.
  const debutPremiere = HAUT_CONTENU + 60 + (doc.sousTitre ? 34 : 0);

  const pages: Ligne[][] = [[]];
  let y = debutPremiere;
  for (const l of lignes) {
    let page = pages.at(-1)!;
    // L'espace avant un bloc n'a pas de sens en haut de page.
    let avant = page.length === 0 ? 0 : l.avant;
    if (page.length > 0 && y + avant + l.hauteur > BAS_CONTENU) {
      page = [];
      pages.push(page);
      y = HAUT_CONTENU;
      avant = 0;
    }
    page.push({ ...l, avant });
    y += avant + l.hauteur;
  }

  const sans = police();
  return pages.map((page, n) => {
    const c = document.createElement("canvas");
    c.width = L;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, L, H);
    ctx.textBaseline = "top";

    // En-tête courant : la marque et le titre, pour qu'une page isolée
    // partagée sur WhatsApp dise encore d'où elle vient.
    ctx.font = `600 22px ${sans}`;
    ctx.fillStyle = ENCRE_2;
    ctx.fillText("Tuto DT HR · Technologie Hôtelière", MARGE, 56);
    ctx.fillStyle = FILET;
    ctx.fillRect(MARGE, 96, LARGEUR, 2);

    let y = HAUT_CONTENU;
    if (n === 0) {
      ctx.font = `700 44px ${sans}`;
      ctx.fillStyle = ENCRE;
      ctx.fillText(doc.titre, MARGE, HAUT_CONTENU - 16, LARGEUR);
      if (doc.sousTitre) {
        ctx.font = `400 24px ${sans}`;
        ctx.fillStyle = ENCRE_2;
        ctx.fillText(doc.sousTitre, MARGE, HAUT_CONTENU + 46, LARGEUR);
      }
      y = debutPremiere;
    }

    for (const l of page) {
      y += l.avant;
      if (l.fond) {
        ctx.fillStyle = l.fond;
        ctx.fillRect(MARGE, y - 4, LARGEUR, l.hauteur + 4);
        if (l.bord) {
          ctx.fillStyle = l.bord;
          ctx.fillRect(MARGE, y - 4, 5, l.hauteur + 4);
        }
      }
      ctx.font = l.font;
      ctx.fillStyle = l.couleur;
      ctx.fillText(l.texte, l.x, y + 4);
      y += l.hauteur;
    }

    ctx.font = `400 20px ${sans}`;
    ctx.fillStyle = ENCRE_2;
    const pied = `${n + 1} / ${pages.length}`;
    ctx.fillText(pied, L - MARGE - ctx.measureText(pied).width, H - 70);
    return c;
  });
}

function versBlob(c: HTMLCanvasElement, type: string, qualite?: number): Promise<Blob> {
  return new Promise((ok, ko) =>
    c.toBlob((b) => (b ? ok(b) : ko(new Error("Export impossible."))), type, qualite),
  );
}

/**
 * Assemble des pages JPEG en un PDF minimal : un catalogue, un arbre de
 * pages, et pour chaque page un objet page, son flux de contenu et son image.
 * Le JPEG s'insère tel quel (filtre DCTDecode) — aucun réencodage.
 */
async function assemblerPdf(pages: HTMLCanvasElement[]): Promise<Blob> {
  const enc = new TextEncoder();
  const morceaux: Uint8Array[] = [];
  const offsets: number[] = [];
  let taille = 0;
  const ecrire = (b: Uint8Array | string) => {
    const u = typeof b === "string" ? enc.encode(b) : b;
    morceaux.push(u);
    taille += u.length;
  };
  const objet = (n: number) => {
    offsets[n] = taille;
    ecrire(`${n} 0 obj\n`);
  };

  // Points PDF d'une page A4.
  const PW = 595.28;
  const PH = 841.89;
  const nb = pages.length;
  // 1 catalogue, 2 arbre ; puis par page : page, contenu, image.
  const numPage = (i: number) => 3 + i * 3;

  ecrire("%PDF-1.4\n%âãÏÓ\n");
  objet(1);
  ecrire("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objet(2);
  ecrire(
    `<< /Type /Pages /Count ${nb} /Kids [${pages.map((_, i) => `${numPage(i)} 0 R`).join(" ")}] >>\nendobj\n`,
  );

  for (let i = 0; i < nb; i++) {
    const p = numPage(i);
    const jpeg = new Uint8Array(await (await versBlob(pages[i], "image/jpeg", 0.88)).arrayBuffer());
    const contenu = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;

    objet(p);
    ecrire(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${p + 2} 0 R >> >> /Contents ${p + 1} 0 R >>\nendobj\n`,
    );
    objet(p + 1);
    ecrire(`<< /Length ${contenu.length} >>\nstream\n${contenu}\nendstream\nendobj\n`);
    objet(p + 2);
    ecrire(
      `<< /Type /XObject /Subtype /Image /Width ${pages[i].width} /Height ${pages[i].height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    );
    ecrire(jpeg);
    ecrire("\nendstream\nendobj\n");
  }

  const total = 3 + nb * 3;
  const debutXref = taille;
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let n = 1; n < total; n++) xref += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  ecrire(xref);
  ecrire(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${debutXref}\n%%EOF\n`);

  return new Blob(morceaux as BlobPart[], { type: "application/pdf" });
}

/**
 * Sur téléphone, la feuille de partage native vaut mieux qu'un
 * téléchargement : elle mène directement à WhatsApp, à la galerie ou aux
 * fichiers, et c'est la seule voie fiable dans une application installée sur
 * iPhone. Sur ordinateur, on télécharge.
 */
async function livrer(fichiers: File[], titre: string): Promise<void> {
  const tactile = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  if (tactile && navigator.canShare?.({ files: fichiers })) {
    try {
      await navigator.share({ files: fichiers, title: titre });
      return;
    } catch (e) {
      // Le candidat a fermé la feuille de partage : ce n'est pas une panne.
      if (e instanceof DOMException && e.name === "AbortError") return;
      // Toute autre erreur : on retombe sur le téléchargement.
    }
  }
  for (const f of fichiers) {
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}

export async function exporterPdf(doc: DocExport): Promise<void> {
  const pdf = await assemblerPdf(paginer(doc));
  await livrer([new File([pdf], `${doc.fichier}.pdf`, { type: "application/pdf" })], doc.titre);
}

export async function exporterImage(doc: DocExport): Promise<void> {
  const pages = paginer(doc);
  const fichiers = await Promise.all(
    pages.map(async (c, i) => {
      const nom = pages.length === 1 ? doc.fichier : `${doc.fichier}-page-${i + 1}`;
      return new File([await versBlob(c, "image/png")], `${nom}.png`, { type: "image/png" });
    }),
  );
  await livrer(fichiers, doc.titre);
}
