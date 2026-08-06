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

## Structure

```
src/app/            Écrans (accueil, calibrage, chat, confidentialité)
src/app/api/chat/   Route de streaming vers Claude — la clé ne quitte pas le serveur
src/components/     Bibliothèque de composants (§7 du brief)
src/lib/prompt.ts   Prompt maïeutique — préfixe mis en cache
src/lib/db.ts       Dexie / IndexedDB : stockage local d'abord
src/lib/store.ts    Zustand : niveau de calibrage, état d'onboarding
```

## Points à ne pas casser

- **La clé Anthropic reste côté serveur.** Jamais de préfixe `NEXT_PUBLIC_`.
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
