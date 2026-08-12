#!/usr/bin/env node
/**
 * Vérifie les parcours du tuteur contre un serveur qui tourne.
 *
 * Le comportement du tuteur tient à un prompt : chaque retouche peut en casser
 * un autre point sans qu'on le voie. Ces cas sont ceux qui ont réellement
 * cassé au moins une fois — le document fantôme, la maïeutique hors sujet,
 * l'épreuve reformulée, le tableau aplati.
 *
 *   npm run dev            # dans un autre terminal
 *   npm run verif:parcours
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function appel(messages, niveau = "examen") {
  const r = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, niveau }),
  });
  const vide = { statut: r.status, texte: "", epreuve: null, fiches: null, relance: null };
  if (!r.ok) return { ...vide, texte: await r.text() };

  const res = { ...vide };
  for (const ligne of (await r.text()).trim().split("\n")) {
    try {
      const j = JSON.parse(ligne);
      if (j.t === "txt") res.texte += j.v;
      else if (j.t === "epr") res.epreuve = j.v;
      else if (j.t === "fic") res.fiches = j.v;
      else if (j.t === "rel") res.relance = j.v;
    } catch {
      /* trame tronquée : ignorée */
    }
  }
  return res;
}

const u = (c) => ({ role: "user", content: c });
const a = (c, relance) => ({ role: "assistant", content: c, ...(relance ? { relance } : {}) });

const CAS = [
  {
    nom: "Épreuve demandée → carte servie",
    run: () => appel([u("donne moi l'épreuve 2021")]),
    ok: (r) => r.epreuve?.id === "dt-hr-2021",
    detail: (r) => r.epreuve?.id ?? "aucune carte",
  },
  {
    nom: "Fidélité du tableau room rate",
    run: () => appel([u("donne moi l'épreuve 2021")]),
    ok: (r) => /Hébergement\s+15 000F\s+10 000F\s+8 000F/.test(r.epreuve?.enonce ?? ""),
    detail: (r) =>
      /Hébergement\s+15 000F/.test(r.epreuve?.enonce ?? "") ? "colonnes intactes" : "TABLEAU CASSÉ",
  },
  {
    nom: "Corrigé jamais servi au candidat",
    run: () => appel([u("donne moi l'épreuve 2021")]),
    ok: (r) => !/CORRECTION DES EPREUVES/i.test(r.epreuve?.enonce ?? ""),
    detail: () => "énoncé seul",
  },
  {
    nom: "Question de cours → aucune carte",
    run: () => appel([u("c'est quoi un no-show ?")]),
    ok: (r) => r.epreuve === null && r.fiches === null,
    detail: (r) => (r.epreuve || r.fiches ? "carte parasite" : "aucune carte"),
  },
  {
    nom: "Maïeutique : relance marquée",
    run: () => appel([u("c'est quoi le surbooking ?")]),
    ok: (r) => r.relance === 1 && !/\[relance/i.test(r.texte),
    detail: (r) => `relance ${r.relance ?? "absente"}`,
  },
  {
    nom: "Compteur de tentative",
    run: () =>
      appel([
        u("le surbooking ?"),
        a("Que fait un hôtel qui accepte trop de réservations ?", 1),
        u("je sais pas"),
      ]),
    ok: (r) => r.relance === 2,
    detail: (r) => `tentative ${r.relance ?? "absente"}`,
  },
  {
    nom: "Demande d'information → réponse directe",
    run: () => appel([u("donne moi la liste des catégories d'hôtels de tourisme")]),
    ok: (r) => r.relance === null,
    detail: (r) => (r.relance ? "relancé à tort" : "répond directement"),
  },
  {
    nom: "Aucun renvoi vers un document fantôme",
    run: () => appel([u("montre moi le résumé de cours")]),
    ok: (r) =>
      !/(regarde|cherche).{0,40}(plus haut|au-dessus|ci-dessus)|je t'?ai (fourni|donné|envoyé)/i.test(
        r.texte,
      ),
    detail: (r) =>
      /je t'?ai (fourni|donné)/i.test(r.texte) ? "PRÉTEND AVOIR FOURNI" : "pas de renvoi",
  },
  {
    nom: "Commentaire sur l'épreuve → pas de ré-affichage",
    run: () =>
      appel([
        u("donne moi l'épreuve 2021"),
        a("Voilà l'épreuve 2021. Première question : quel passage montre que Coffi mange à la carte ?"),
        u("dans l'épreuve je crois que c'est le passage sur le régime sans pension"),
      ]),
    ok: (r) => r.epreuve === null,
    detail: (r) => (r.epreuve ? "RÉ-AFFICHÉE" : "pas de ré-affichage"),
  },
  {
    nom: "Année inexistante → refus propre",
    run: () => appel([u("donne moi l'épreuve de 2013")]),
    ok: (r) => r.epreuve === null,
    detail: (r) => (r.epreuve ? "carte servie à tort" : "années réelles proposées"),
  },
  {
    nom: "Flashcards demandées → paquet servi",
    run: () => appel([u("Prépare-moi des flashcards pour réviser.")]),
    ok: (r) => (r.fiches?.length ?? 0) > 0,
    detail: (r) => `${r.fiches?.length ?? 0} fiches`,
  },
  {
    nom: "Fiches thématiques pertinentes",
    run: () => appel([u("donne moi des fiches sur le paiement")]),
    ok: (r) =>
      (r.fiches ?? []).some((f) => /acompte|arrhe|deposit|carte de cr|voucher|d[ée]bours/i.test(f.terme)),
    detail: (r) => (r.fiches ?? []).map((f) => f.terme).join(", ").slice(0, 56),
  },
  {
    nom: "Aucun doublon dans un paquet",
    run: () => appel([u("des fiches sur l'accueil")]),
    ok: (r) => {
      const t = (r.fiches ?? []).map((f) => f.terme.toLowerCase());
      return t.length > 0 && t.length === new Set(t).size;
    },
    detail: (r) => `${(r.fiches ?? []).length} fiches distinctes`,
  },
  {
    nom: "Hors programme → recadrage",
    run: () => appel([u("explique moi la photosynthèse")]),
    ok: (r) => /technologie h|programme|mati[èe]re|hôtel/i.test(r.texte),
    detail: (r) => r.texte.replace(/\n/g, " ").slice(0, 48) + "…",
  },
  {
    nom: "Requête vide → 400",
    run: () => appel([]),
    ok: (r) => r.statut === 400,
    detail: (r) => `HTTP ${r.statut}`,
  },
];

let verts = 0;
for (const c of CAS) {
  let r;
  try {
    r = await c.run();
  } catch (e) {
    console.log(`✗ ${c.nom.padEnd(46)} erreur réseau : ${e.message}`);
    continue;
  }
  const bon = c.ok(r);
  if (bon) verts++;
  console.log(`${bon ? "✓" : "✗"} ${c.nom.padEnd(46)} ${c.detail(r)}`);
}

console.log(`\n${verts}/${CAS.length} passent.`);
process.exit(verts === CAS.length ? 0 : 1);
