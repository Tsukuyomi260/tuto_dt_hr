# Tuto DT HR

Tuteur de révision par IA pour les candidat(e)s au Diplôme de Technicien
option Hôtellerie-Restauration (Bénin). Prototype centré sur une matière :
la Technologie Hôtelière.

## Démarrer

```bash
cp .env.example .env.local   # puis renseigne ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

Sans clé, l'application se lance et les écrans s'affichent ; la conversation
répond « Configuration du serveur incomplète ».

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm start` | Sert le build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run corpus` | Régénère l'annale depuis `data/annales/*.pdf` — **redémarre le serveur ensuite** : le corpus est lu une seule fois au démarrage |
| `npm run verif:api` | Appel réel : latence, cache, et surtout — le tuteur relance-t-il ? |
| `npm run verif:parcours` | Les 23 parcours du tuteur contre un serveur qui tourne — lance `npm run dev` d'abord |

## Structure

```
src/app/            Écrans (accueil, calibrage, chat, confidentialité)
src/app/api/chat/   Route de streaming vers Claude — la clé ne quitte pas le serveur
src/components/     Bibliothèque de composants (§7 du brief)
src/lib/prompt.ts   Prompt maïeutique — préfixe mis en cache
src/lib/modele.ts   Modèle courant et paramètres de réflexion compatibles
src/lib/corpus.ts   Chargement de l'annale, injectée entière dans le prompt
src/lib/db.ts       Dexie / IndexedDB : stockage local d'abord, un fil par discussion
src/lib/fils.ts     Identité d'une discussion — constante de migration et générateur
src/lib/store.ts    Zustand : niveau, onboarding, discussion ouverte
src/lib/revision.ts Outils rédigés par le tuteur (fiche, quiz, planning, cartes) et leur validation
src/lib/export.ts   Export PDF / image dans le navigateur, sans dépendance
src/lib/enonce.ts   Découpe prose / tableaux d'un énoncé, partagée écran et export
src/lib/installation.ts  Invitation d'installation PWA, captée au démarrage
```

## Retours du premier test (rapport R. Daassi)

| Axe du rapport | Traitement |
|---|---|
| Maïeutique trop vite abandonnée | Prompt : toute définition/explication est une question de cours, dès le 1er message. Route : rappel injecté au tour quand le message en a la forme (`QUESTION_COURS`) |
| Flashcards sur toutes les notions | `fournir_flashcards` accepte des `cartes` rédigées d'après l'annale, en plus des fiches littérales ; l'origine est affichée au verso |
| Réponses erronées, peu contextualisées | Section « Exactitude » du prompt : annale d'abord, hors-annale signalé, rien d'inventé, se corriger quand le candidat a raison |
| Méthodes de révision | Section dédiée du prompt + raccourci « Méthodes » |
| « Lingerie » corrigée en « Linger » | Règle : ne jamais remplacer le terme du candidat ; la distinction est dans le prompt |
| Épreuves en PDF / image | Boutons sur la carte d'épreuve (et fiche, planning) — `lib/export.ts`, partage natif sur mobile |
| Audio et captures d'écran | Photo déjà là ; dictée fiabilisée (ajout au texte, continue, erreurs expliquées) ; collage d'image dans le champ |
| Fiches de révision, planning, quiz | Outils `creer_fiche_revision`, `proposer_planning`, `lancer_quiz` et leurs cartes ; quiz corrigé sur place, score conservé |
| Application mobile | PWA existante + bouton « Installer l'application » (accueil et feuille des discussions) |

Les nouveaux comportements ont leurs cas dans `npm run verif:parcours`.

## Déploiement (Vercel)

Le corpus (`data/corpus/technologie-hoteliere.md`) **doit** être versionné :
Vercel construit depuis Git, et la route le lit sur le disque à l'exécution.
`next.config.ts` l'inclut déjà dans la trace de la fonction via
`outputFileTracingIncludes`. S'il manque, le tuteur démarre quand même mais
répond sans l'annale — en silence.

Variables à définir dans *Project → Settings → Environment Variables* :

| Variable | Valeur | Portée |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-…` | Production, Preview, Development |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5` | idem |
| `ANTHROPIC_EFFORT` | `medium` *(ignoré sur Haiku)* | idem |

Aucune ne porte le préfixe `NEXT_PUBLIC_` : elles restent côté serveur.

```bash
npm i -g vercel
vercel link
vercel env add ANTHROPIC_API_KEY production
vercel --prod
```

Ou, par Git : pousser sur `main` et importer le dépôt depuis
[vercel.com/new](https://vercel.com/new) — chaque poussée redéploie.

## Points à ne pas casser

- **La clé Anthropic reste côté serveur.** Jamais de préfixe `NEXT_PUBLIC_`.
- **Les paramètres de réflexion dépendent de la génération du modèle.**
  `thinking: {type:"adaptive"}` et `output_config.effort` n'existent qu'à
  partir de la 4.6 ; sur Haiku 4.5 ils renvoient un 400 et coupent la
  conversation. `src/lib/modele.ts` fait le tri — ajouter un modèle à la
  liste `ADAPTATIFS` avant de le mettre dans `ANTHROPIC_MODEL`.
- **`SYSTEM_PROMPT` doit rester stable.** C'est le préfixe mis en cache : y
  interpoler une date, un niveau ou un identifiant invalide le cache et fait
  repayer l'intégralité du préfixe à chaque appel. Tout ce qui varie passe
  par `messages`.
- **Le Palesun ne porte jamais de texte sur fond clair.** `#FBFC09` sur blanc
  est à 1,10:1 : invisible, et aucune taille de police ne rattrape ça. En
  aplat il porte l'encre bleue (`--accent-on`, 13,74:1) ; en trait ou en texte
  sur du clair, c'est `--accent-ink` qui prend le relais. La règle complète
  est en tête de `src/app/globals.css`.
- **Trois graisses de police : 400, 600 et 700.** Pas d'intermédiaires — elles
  sont synthétisées sur Android d'entrée de gamme et rendent mal. Le 700 n'est
  utilisé que par `.t-display`.
- **Le rouge est réservé au message non délivré**, jamais à une mauvaise
  réponse (§4 et §8 du brief).

## Documents de référence

| Fichier | Contenu |
|---|---|
| `Brief_Design_Tuto_DT_HR_IA.md` | Brief complet : écrans, composants, identité, conformité, stack. Sa §8 (direction visuelle) est marquée comme remplacée |
| `src/app/globals.css` | **La référence vivante** de la direction visuelle : jetons de marque, contrastes vérifiés, clair/sombre |
| `direction-visuelle.html` | *Historique* — planche de la première direction (lin, bleu-vert, ocre), abandonnée pour Uniform Blue / Palesun. Sa palette et ses hex ne valent plus ; ne pas y reprendre de couleur |
| `recherche-onboarding-apps-apprentissage.html` | Étude comparative de 13 apps d'apprentissage |

## Reste à faire

Mesuré contre le cahier des charges de Romaric Daassi (non versionné —
l'ajouter au dépôt serait utile).

**Écarts majeurs**

- **Trois matières sur quatre.** Seule la Technologie Hôtelière existe ;
  manquent Mercatique Hôtelière, Économat-Contrôle Nourritures Boissons et
  Sciences Appliquées. Bloqué tant que `data/annales/` est vide.
- **WhatsApp.** Pas une fonctionnalité mais une seconde interface : ni carte
  d'épreuve ni flashcard retournable n'y survivent, tout redevient du texte.

**Écarts moyens**

- Guides d'études détaillés par chapitre (au-delà des fiches de révision).
- Messages vocaux enregistrés : la dictée du navigateur couvre l'entrée
  audio, mais un vrai message vocal demanderait un service de transcription
  tiers — Claude ne lit pas l'audio.
- Écran banque d'épreuves : aujourd'hui accessible seulement en la demandant
  au tuteur.
- Sauvegarde du numéro (OTP) — après le premier artefact, jamais avant.

**Deux points à trancher avec l'auteur du cahier des charges**

- **Le RAG**, qu'il nomme explicitement. Le code fait l'inverse : l'annale
  entière part dans le contexte, avec cache partagé. Pour une matière de
  ~29 000 jetons c'est meilleur — un récupérateur peut se tromper de passage,
  un modèle qui voit tout le cours ne peut pas rater le chapitre. Mais quatre
  matières font ~120 000 jetons contre 200 000 de fenêtre sur Haiku 4.5 : le
  RAG n'est pas une erreur, il est **prématuré**, et redevient nécessaire à la
  deuxième ou troisième matière.
- **Les corrigés types.** Le cahier des charges se contredit : son objectif 2
  les veut accessibles, son §4-2 dit « sans les corrections ». Aujourd'hui ils
  sont dans le contexte du modèle — donc ils nourrissent ses corrections — mais
  ne sont jamais affichés.
