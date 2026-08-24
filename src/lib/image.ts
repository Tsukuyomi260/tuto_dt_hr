/**
 * Réduction d'une photo avant envoi.
 *
 * Elle se fait sur le téléphone, jamais sur le serveur, et c'est le point
 * essentiel : une photo d'appareil moderne pèse 3 à 8 Mo, et le candidat
 * béninois visé paie ses données au mégaoctet. Téléverser l'original pour le
 * réduire ensuite lui ferait payer vingt fois le prix de ce qu'on utilise —
 * le modèle ne lit de toute façon rien au-delà de ~1568 px.
 *
 * Le résultat est une URL de données `data:image/jpeg;base64,…`, directement
 * stockable dans IndexedDB et directement transmissible à l'API.
 */

/** Côté le plus long après réduction. Au-delà, on paie des pixels inutiles. */
export const COTE_MAX = 1024;

/**
 * Assez pour un énoncé photographié, assez bas pour rester lisible sur une
 * connexion lente. Le JPEG est retenu même pour les captures d'écran : le PNG
 * d'une capture pèse plusieurs fois plus pour un gain nul à cette taille.
 */
const QUALITE = 0.85;

export class ImageIllisible extends Error {}

export async function reduireImage(fichier: File): Promise<string> {
  if (!fichier.type.startsWith("image/")) {
    throw new ImageIllisible("Ce fichier n'est pas une image.");
  }
  if (typeof createImageBitmap !== "function") {
    throw new ImageIllisible("Ce navigateur ne sait pas préparer les photos.");
  }

  // `imageOrientation` applique la rotation EXIF. Sans elle, une photo prise
  // en tenant le téléphone verticalement arrive couchée — et un énoncé
  // couché est un énoncé que le modèle lit mal.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(fichier, { imageOrientation: "from-image" });
  } catch {
    throw new ImageIllisible("Cette image n'a pas pu être ouverte.");
  }

  try {
    const echelle = Math.min(1, COTE_MAX / Math.max(bitmap.width, bitmap.height));
    const largeur = Math.max(1, Math.round(bitmap.width * echelle));
    const hauteur = Math.max(1, Math.round(bitmap.height * echelle));

    const toile = document.createElement("canvas");
    toile.width = largeur;
    toile.height = hauteur;

    const ctx = toile.getContext("2d");
    if (!ctx) throw new ImageIllisible("Cette image n'a pas pu être préparée.");

    // Le fond blanc compte : un PNG transparent aplati en JPEG vire au noir,
    // et une capture d'écran à fond transparent deviendrait illisible.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, largeur, hauteur);
    ctx.drawImage(bitmap, 0, 0, largeur, hauteur);

    return toile.toDataURL("image/jpeg", QUALITE);
  } finally {
    bitmap.close();
  }
}
