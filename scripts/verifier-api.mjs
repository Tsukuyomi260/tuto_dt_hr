#!/usr/bin/env node
/**
 * Vérifie de bout en bout que le tuteur fonctionne : clé valide, corpus chargé,
 * cache de prompt effectif, et surtout — qu'il *relance* au lieu de donner la
 * réponse tout de suite. C'est la signature pédagogique du produit ; tant
 * qu'on ne l'a pas vue à l'écran, elle n'est qu'une hypothèse.
 *
 *   npm run verif:api
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";

const cle = process.env.ANTHROPIC_API_KEY;
if (!cle || cle.trim() === "") {
  console.error("ANTHROPIC_API_KEY est vide dans .env.local.");
  process.exit(1);
}

const SYSTEM_PROMPT = readFileSync("src/lib/prompt.ts", "utf8")
  .split("export const SYSTEM_PROMPT = `")[1]
  .split("`;")[0];

let corpus = "";
try {
  corpus = readFileSync("data/corpus/technologie-hoteliere.md", "utf8");
} catch {
  console.warn("⚠ Corpus absent — lance `npm run corpus` d'abord.\n");
}

const client = new Anthropic();
const modele = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

const system = [
  { type: "text", text: SYSTEM_PROMPT },
  ...(corpus
    ? [
        {
          type: "text",
          text: `Voici l'intégralité de l'annale de référence.\n\n${corpus}`,
          cache_control: { type: "ephemeral", ttl: "1h" },
        },
      ]
    : []),
];

const question = process.argv[2] ?? "C'est quoi la mise en place ?";

console.log(`Modèle   : ${modele}`);
console.log(`Corpus   : ${corpus ? `${corpus.length.toLocaleString("fr-FR")} caractères` : "absent"}`);
console.log(`Question : « ${question} »\n`);
console.log("─".repeat(60));

const debut = Date.now();
let premierJeton = null;

const flux = client.messages.stream({
  model: modele,
  max_tokens: 6000,
  system,
  thinking: { type: "adaptive" },
  output_config: { effort: process.env.ANTHROPIC_EFFORT ?? "medium" },
  messages: [{ role: "user", content: question }],
});

for await (const e of flux) {
  if (e.type === "content_block_delta" && e.delta.type === "text_delta") {
    if (premierJeton === null) premierJeton = Date.now() - debut;
    process.stdout.write(e.delta.text);
  }
}

const final = await flux.finalMessage();
const u = final.usage;

console.log(`\n${"─".repeat(60)}`);
console.log(`Premier jeton : ${premierJeton} ms`);
console.log(`Total         : ${Date.now() - debut} ms`);
console.log(`stop_reason   : ${final.stop_reason}`);
console.log(
  `Jetons        : ${u.input_tokens} entrée · ${u.output_tokens} sortie`,
);
console.log(
  `Cache         : ${u.cache_creation_input_tokens ?? 0} écrits · ${u.cache_read_input_tokens ?? 0} lus`,
);

if ((u.cache_read_input_tokens ?? 0) > 0) {
  console.log("\n✓ Cache actif : relance la commande, la lecture doit rester > 0.");
} else if ((u.cache_creation_input_tokens ?? 0) > 0) {
  console.log("\n→ Cache écrit. Relance dans la minute : la lecture doit passer > 0.");
} else {
  console.log("\n⚠ Aucun cache. Préfixe trop court, ou il change à chaque appel.");
}

console.log(
  "\nÀ juger toi-même : le tuteur a-t-il RELANCÉ, ou donné la réponse\n" +
    "directement ? S'il répond tout de suite, le prompt maïeutique est trop\n" +
    "faible et c'est src/lib/prompt.ts qu'il faut durcir.",
);
