# Brief de design — Tuto DT HR IA

> Document à fournir à Claude Design pour l'imprégner du projet avant de concevoir l'interface (Phase 1).
> Prototype centré sur une matière unique : **Technologie Hôtelière**.

---

## 1. Le projet en une phrase

**Tuto DT HR IA** est un tuteur de révision par IA, accessible sur mobile, qui aide les candidat(e)s au **Diplôme de Technicien option Hôtellerie-Restauration** à réviser en les guidant pas à pas — sans jamais leur donner la réponse tout de suite.

---

## 2. Le produit

Un agent conversationnel personnalisé, disponible en **application mobile** et via **WhatsApp**, qui repose sur trois usages :

| Usage | Ce que fait l'agent |
|---|---|
| **Questions-réponses guidées** | Le candidat pose une question de cours ou d'épreuve ; l'agent le fait réfléchir en plusieurs relances avant de livrer la correction. |
| **Banque d'épreuves** | L'agent remet une ancienne épreuve (PDF ou image), **sans** la correction. |
| **Outils de révision** | L'agent génère des flashcards, des fiches de révision, des emplois du temps et des guides d'étude. |

Sa signature pédagogique est **l'approche maïeutique** : il sollicite **au moins deux tentatives** du candidat avant de donner la réponse exacte, dans un échange bienveillant et encourageant.

---

## 3. Les utilisateurs

- **Qui** : des candidat(e)s à l'examen DT HR, principalement au Bénin et en Afrique de l'Ouest francophone.
- **Contexte** : révision autonome, souvent le soir, sur un téléphone d'entrée ou de milieu de gamme.
- **Contraintes réelles** : connexion parfois lente ou intermittente, données mobiles limitées, écran de petite taille.
- **État d'esprit** : stress de l'examen, besoin d'être rassuré et guidé, pas jugé.

**Conséquences pour le design** : mobile d'abord, léger, très lisible, chaleureux, avec des temps de chargement visibles et un fonctionnement dégradé acceptable en mauvaise connexion.

---

## 4. Principes directeurs

1. **Guider, pas donner** — l'interface met en valeur le dialogue et l'effort du candidat, jamais la réponse « toute faite ».
2. **Bienveillance visible** — ton chaleureux, encouragements, aucune sanction visuelle en cas d'erreur.
3. **Zéro friction** — pas de création de compte, on commence à discuter immédiatement.
4. **Multiformat** — le candidat peut écrire, dicter (audio) ou photographier une question.
5. **Confiance et sérieux** — l'agent s'appuie sur de vraies annales et corrigés (technique RAG) ; l'interface doit inspirer la fiabilité.
6. **Sobriété** — épuré, professionnel, sans surcharge décorative.

---

## 5. Ton et personnalité de l'agent

- **Rôle** : un tuteur patient et encourageant, jamais professoral ni condescendant.
- **Voix** : tutoiement, phrases courtes, questions ouvertes, validation systématique des efforts (« Exactement », « Tu y es »).
- **Émotion** : calme, positif, motivant.
- À traduire visuellement par : des couleurs posées, des formes douces, un rythme de lecture aéré.

---

## 6. Écrans à concevoir

Concevoir l'application mobile. Pour chaque écran, prévoir l'état par défaut et, si pertinent, l'état de chargement et l'état hors-ligne.

1. **Accueil** *(écran unique, sans défilement)*
   - Logo, nom, accroche.
   - Message clé : « Pas besoin de compte, commence tout de suite. »
   - Un seul bouton d'action : *Commencer*.
   - **Ligne de transparence sur les données** sous le bouton — une phrase et un lien, jamais un interstitiel bloquant (voir §9).

2. **Question de calibrage** *(unique, passable)*
   - « Où en es-tu en Technologie Hôtelière ? » — trois réponses en langage courant, aucune humiliante.
   - Barre de progression visible ; bouton *Passer* toujours accessible.
   - La date de session n'est **pas** demandée : le DT HR est une session nationale unique, la date est codée en dur.

3. **Menu principal**
   - Les trois usages présentés clairement (poser une question, obtenir une épreuve, réviser).
   - Rappel du périmètre : *Technologie Hôtelière*.
   - Accès rapide à la saisie d'une question.

4. **Conversation — dialogue maïeutique** (écran central du produit)
   - Fil de discussion : messages de l'agent et du candidat, bien différenciés.
   - Mise en valeur des relances de l'agent et des tentatives du candidat.
   - Barre de saisie multiformat : texte, micro (audio), appareil photo — les trois au même rang, jamais derrière un « + ».
   - Indicateur « l'agent réfléchit ».
   - Amorces tapables plutôt qu'un champ vide au premier lancement.

5. **Banque d'épreuves**
   - Message de l'agent contenant une **carte de pièce jointe** (épreuve PDF téléchargeable, nommée par matière et session).
   - Invitation à s'entraîner ensuite sur l'épreuve.

6. **Flashcard**
   - **Carte recto / verso** : recto = la question, verso = la réponse.
   - Interaction pour retourner la carte.
   - Proposition d'une carte suivante.

7. **Fiche de révision / emploi du temps**
   - Présentation lisible d'une fiche (titre, points clés) ou d'un planning de révision par jour.

8. **Entrée par photo**
   - Le candidat envoie une photo d'une question.
   - L'agent confirme ce qu'il a lu avant de traiter (« La question est : … C'est bien cela ? »).
   - Cet écran de confirmation tient lieu de tutoriel : aucune explication préalable de la fonction photo.

9. **Proposition de sauvegarde** *(nouveau — issu de la recherche onboarding)*
   - Apparaît **après le premier artefact** produit (jeu de flashcards, fiche, planning), jamais avant.
   - Encart dans le fil : « Tu veux garder tes révisions ? » — *Enregistrer mon numéro* (plein) / *Plus tard* (fantôme).
   - Reporter doit être sans conséquence : tout continue de fonctionner localement.

10. **Saisie du numéro + code** *(nouveau)*
    - Numéro de téléphone puis code à usage unique. Aucun mot de passe, aucun e-mail.
    - Accessible aussi depuis les réglages, à tout moment.

---

## 7. Composants récurrents à définir

- **Bulle de message agent** vs **bulle de message candidat** (deux styles nettement distincts, différenciés par la **forme** autant que par la couleur : coin pincé à 6 px du côté de l'émetteur).
- **Bulle de relance maïeutique** — variante accentuée de la bulle agent, avec étiquette « Relance — tentative N ».
- **Carte de pièce jointe** (épreuve PDF / image à télécharger).
- **Carte flashcard** (recto/verso).
- **Boutons de menu / actions rapides**.
- **Barre de saisie multiformat** (texte + micro + photo).
- **Encart de sauvegarde** (proposition d'enregistrer le numéro, avec échappatoire).
- **États système** : chargement, envoi en cours, hors-ligne, message non délivré, synchronisation.

> Tous ces composants sont construits et visibles dans `direction-visuelle.html`.

---

## 8. Direction visuelle — **validée**

Planche de style complète, avec composants interactifs et contrastes vérifiés : `direction-visuelle.html`.

**Thème clair** — fond `#F7F5F0` · surface `#FFFFFF` · texte `#1C2A2B` (13,62:1) · texte secondaire `#5D6E6F` (4,91:1) · primaire bleu-vert `#0F4F4A` (9,39:1 en aplat) · accent ocre **aplat** `#C07C2C` · accent ocre **texte** `#96601C` (4,83:1) · fond d'accent `#F6EADA` · panne `#8C3A2E`.

**Thème sombre** — fond `#0E1516` · surface `#16201F` · texte `#E8EDEB` · secondaire `#9FB0B0` · primaire éclaircie `#5FB3A9` · bulle candidat `#17564F` · accent `#D89A4A` · fond d'accent `#2B2216`.

Décisions structurantes :

- **L'ocre est dédoublé.** `#C07C2C` ne passe qu'à 3,13:1 sur le fond : réservé aux aplats, filets et icônes. Dès qu'il porte du texte, utiliser `#96601C`.
- **Aucune police téléchargée.** Police système (Roboto sur Android, San Francisco sur iOS) : 0 octet sur des données mobiles comptées, aucun risque de repli silencieux. Deux graisses strictement — 400 et 600, jamais de graisse intermédiaire (mal rendue sur Android d'entrée de gamme).
- **Le rouge est réservé au message non délivré.** Jamais une mauvaise réponse — c'est la garantie du principe « aucune sanction visuelle ».
- **Mode sombre livré**, construit en parallèle sur les mêmes jetons, pas par inversion.
- **Formes** : rayons 6 (coin pincé) · 12 (bouton) · 14 (carte) · 18 (bulle) · 20 (champ) · 999 (pastille). Espacement 4 · 8 · 12 · 16 · 24 · 32 · 48.
- **Mouvement** : entrée de message 240 ms `ease-out` · appui `scale(0.97)` 160 ms · retournement de flashcard 460 ms `ease-in-out` · réflexion en boucle 1,25 s. Aucune animation sur le clavier ni le défilement. `prefers-reduced-motion` respecté.

*Reste à décider : le logo. La pastille « TH » est un substitut de travail.*

---

## 9. Identité, compte et conformité

Étude comparative complète : `recherche-onboarding-apps-apprentissage.html` (13 produits d'apprentissage).

**Principe retenu : la vérification est un péage, on le place devant la valeur qu'il protège, jamais devant la porte d'entrée.**

- **Aucune vérification d'identité, ni en v1 ni ensuite.** Le tuteur ne délivre aucun diplôme et ne traite aucun paiement : rien ne la justifie. Coursera n'exige une pièce d'identité que pour ses certificats, pas pour ses comptes.
- **Aucune barrière d'âge, aucune date de naissance.** Public de 16-20 ans, pas de contenu sensible, pas de fonction sociale, pas de publicité : rien ne déclenche d'obligation. Ne pas collecter une donnée dont on n'a aucun usage.
- **Le compte est une fonction de récupération, pas une porte.** Proposé après le premier artefact, refusable sans conséquence. Identifiant : **numéro de téléphone + code**. Au Bénin le numéro est l'identifiant universel, pas l'e-mail ; un mot de passe inventé un soir de révision est un mot de passe perdu.
- **Local d'abord, synchronisation ensuite.** Tout fonctionne hors ligne ; le compte ne conditionne jamais l'accès. C'est la seule façon de tenir « zéro friction » sans accepter la perte de données.

**Code du numérique béninois (loi n° 2017-20, autorité APDP).** Les photos d'énoncés et les enregistrements vocaux sont des données personnelles : consentement éclairé, finalité explicite, droits d'accès, de rectification et d'effacement. Traduction en design : **une ligne sous le bouton *Commencer*** disant ce qui est conservé, où et combien de temps — plus un bouton « Effacer mes conversations » qui fonctionne réellement. Aucun interstitiel bloquant.

**WhatsApp (hors périmètre du prototype, à ne pas oublier).** Le numéro y *est* l'identité : la promesse « pas de compte » n'y existe déjà plus. Meta impose un opt-in explicite avant tout message initié par le service, et une fenêtre de 24 h après chaque message du candidat hors de laquelle seuls des modèles pré-approuvés passent. Un rappel de révision est donc un modèle à faire valider, pas un simple message.

---

## 10. Stack technique

Contraintes qui décident : téléphone Android d'entrée de gamme, données comptées, réseau intermittent, clé API à protéger.

| Couche | Choix | Pourquoi celui-là |
|---|---|---|
| **Enveloppe** | **PWA installable** (pas d'app store en v1) | Un APK de 40-60 Mo à télécharger sur des données comptées est la plus grosse friction possible *avant* la première valeur — exactement ce que la recherche dit d'éviter. Une PWA pèse 1-2 Mo, s'installe depuis le navigateur et fonctionne hors ligne. Android domine le parc visé. Repli possible : emballage Capacitor plus tard, sans réécriture. |
| **Framework** | **Next.js (App Router) + TypeScript** | Il faut de toute façon un serveur : **la clé Anthropic ne doit jamais atteindre le client**. Next.js donne le proxy API et l'app dans un seul déploiement. |
| **Style** | **Tailwind CSS v4** + jetons CSS de la §8 | Les variables de la planche de style deviennent directement le thème. |
| **Composants** | **Base UI** (primitives non stylées) + **CVA** + **clsx** ; **Sonner** pour les toasts | Aucun kit thémé (MUI, Chakra) : ils combattraient les jetons et alourdiraient le bundle. |
| **Mouvement** | **CSS d'abord.** Motion seulement si un geste de glissement l'exige | Les animations CSS tournent hors du thread principal — décisif sur Android d'entrée de gamme. |
| **État & stockage** | **Zustand** + **Dexie (IndexedDB)** | Conversations, flashcards et fiches vivent localement ; la synchronisation vient après. |
| **Modèle** | **Claude Opus 5** (`claude-opus-5`) via `@anthropic-ai/sdk`, en **streaming** | Le streaming est ce qui rend l'attente supportable sur réseau lent : le premier mot arrive vite. |
| **Effort** | `output_config: { effort: "medium" }`, à faire descendre vers `low` | Sur Opus 5, `low` et `medium` tiennent remarquablement bien et sont le principal levier de latence et de coût. |
| **Cache de prompt** | `cache_control: { type: "ephemeral" }` sur le prompt système + le contexte de cours | **Le plus gros levier de coût du projet.** Le prompt maïeutique et les extraits de cours sont stables ; les lectures de cache coûtent ~0,1×. Le minimum tombe à 512 jetons sur Opus 5. |
| **RAG** | **Postgres (Supabase)** — recherche plein texte française `tsvector` en v1 | Une seule matière, une seule annale : quelques centaines de fragments. Les vecteurs viendront quand le corpus grandira ; démarrer sans embeddings supprime une décision et une dépendance. Supabase apporte en prime le stockage des PDF d'épreuves et l'OTP par SMS le jour où le compte arrive. |
| **Hébergement** | Vercel + Supabase en **région européenne** (pas US) | La latence depuis le Bénin est sensiblement meilleure. |

**Deux règles d'implémentation qui découlent des contraintes :**

1. **Réduire les photos côté client avant l'envoi** (≈ 1024 px sur le grand côté). Une image pleine résolution coûte au candidat ses données mobiles *et* jusqu'à ~4 800 jetons d'entrée. Double économie pour une perte de lisibilité nulle sur un énoncé.
2. **Dictée via l'API Web Speech du navigateur** (`fr-FR`), en local sur Android, plutôt qu'un envoi audio vers un service de transcription. Zéro octet téléversé, zéro coût, réponse immédiate. Repli serveur uniquement si l'API est absente.

**Pas d'i18n en v1** — français uniquement. Une bibliothèque d'internationalisation pour une seule langue n'est que du poids.

---

---

## 11. Livrables — état d'avancement

| # | Livrable | État |
|---|---|---|
| 1 | **Direction visuelle** : palette, typographie, style des composants | ✅ `direction-visuelle.html` |
| 2 | **Bibliothèque de composants** de la §7 | ✅ 8 composants construits et interactifs |
| 3 | **Variantes clair / sombre** de l'écran de conversation | ✅ les deux, côte à côte |
| 4 | **Parcours de premier lancement** (accueil → question → compte) | ✅ 3 écrans |
| 5 | **Recherche onboarding & ouverture de compte** | ✅ `recherche-onboarding-apps-apprentissage.html` |
| 6 | Écrans restants : banque d'épreuves pleine page, fiche de révision, emploi du temps, retour de lecture photo | ⬜ à concevoir |
| 7 | Logo | ⬜ à décider |
| 8 | Vérification sur Android d'entrée de gamme réel | ⬜ à faire |

---

## 12. Prompt de démarrage à coller dans Claude Design

> Tu es mon partenaire de design pour **Tuto DT HR IA**, une application mobile de révision par IA destinée aux candidats au Diplôme de Technicien Hôtellerie-Restauration (Bénin, francophone). Le prototype porte sur une seule matière : la Technologie Hôtelière.
>
> Le produit est un tuteur conversationnel bienveillant qui guide l'élève **étape par étape** et ne donne jamais la réponse avant au moins deux tentatives de sa part. Il propose trois usages : questions-réponses guidées, accès à d'anciennes épreuves, et outils de révision (flashcards, fiches, emplois du temps). Pas de création de compte ; entrées possibles en texte, audio et photo.
>
> Style souhaité : **sobre, chaleureux, fiable**, mobile d'abord, sans couleurs criardes — base neutre, une couleur principale profonde, un seul accent chaud, deux graisses de police, coins arrondis doux, mode sombre prévu.
>
> **La direction visuelle est déjà arrêtée : lis `direction-visuelle.html` et reprends ses jetons tels quels** — ne repropose pas de palette. Idem pour la stratégie d'onboarding, tranchée dans `recherche-onboarding-apps-apprentissage.html`. Concevons les écrans restants listés en §11 (banque d'épreuves pleine page, fiche de révision, emploi du temps, retour de lecture photo). Pose-moi des questions si un choix est ambigu.

---

*Brief de conception — Tuto DT HR IA. Contexte pédagogique basé sur l'annale de Technologie Hôtelière (R. DAASSI, édition 2025) et le cahier des charges du projet.*

*Mis à jour le 6 août 2026 — §6, §7, §8 révisées ; §9 (identité et conformité), §10 (stack) et §11 (avancement) ajoutées, à partir de l'étude comparative d'onboarding et de la planche de style.*
