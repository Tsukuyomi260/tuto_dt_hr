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
| `npm run corpus` | Régénère l'annale depuis `data/annales/*.pdf` |
| `npm run verif:api` | Appel réel : latence, cache, et surtout — le tuteur relance-t-il ? |

## Structure

```
src/app/            Écrans (accueil, calibrage, chat, confidentialité)
src/app/api/chat/   Route de streaming vers Claude — la clé ne quitte pas le serveur
src/components/     Bibliothèque de composants (§7 du brief)
src/lib/prompt.ts   Prompt maïeutique — préfixe mis en cache
src/lib/modele.ts   Modèle courant et paramètres de réflexion compatibles
src/lib/corpus.ts   Chargement de l'annale, injectée entière dans le prompt
src/lib/db.ts       Dexie / IndexedDB : stockage local d'abord
src/lib/store.ts    Zustand : niveau de calibrage, état d'onboarding
```

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
- **Deux graisses de police, 400 et 600.** Les graisses intermédiaires sont
  synthétisées sur Android d'entrée de gamme et rendent mal.
- **Le rouge est réservé au message non délivré**, jamais à une mauvaise
  réponse (§4 et §8 du brief).

## Documents de référence

| Fichier | Contenu |
|---|---|
| `Brief_Design_Tuto_DT_HR_IA.md` | Brief complet : écrans, composants, identité, conformité, stack |
| `direction-visuelle.html` | Planche de style : palette, typo, composants interactifs, clair/sombre |
| `recherche-onboarding-apps-apprentissage.html` | Étude comparative de 13 apps d'apprentissage |

## Reste à faire

- Entrée par photo : réduction côté client (~1024 px) puis blocs image dans la
  route API. Le bouton est en place, désactivé.
- Écrans banque d'épreuves, fiche de révision, emploi du temps.
- RAG : Postgres + recherche plein texte française sur les annales.
- Sauvegarde du numéro (OTP) — après le premier artefact, jamais avant.
