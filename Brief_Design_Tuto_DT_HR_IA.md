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

1. **Accueil / onboarding**
   - Logo, nom, accroche.
   - Message clé : « Pas besoin de compte, commence tout de suite. »
   - Un seul bouton d'action : *Commencer*.

2. **Menu principal**
   - Les trois usages présentés clairement (poser une question, obtenir une épreuve, réviser).
   - Rappel du périmètre : *Technologie Hôtelière*.
   - Accès rapide à la saisie d'une question.

3. **Conversation — dialogue maïeutique** (écran central du produit)
   - Fil de discussion : messages de l'agent et du candidat, bien différenciés.
   - Mise en valeur des relances de l'agent et des tentatives du candidat.
   - Barre de saisie multiformat : texte, micro (audio), appareil photo.
   - Indicateur « l'agent réfléchit ».

4. **Banque d'épreuves**
   - Message de l'agent contenant une **carte de pièce jointe** (épreuve PDF téléchargeable, nommée par matière et session).
   - Invitation à s'entraîner ensuite sur l'épreuve.

5. **Flashcard**
   - **Carte recto / verso** : recto = la question, verso = la réponse.
   - Interaction pour retourner la carte.
   - Proposition d'une carte suivante.

6. **Fiche de révision / emploi du temps**
   - Présentation lisible d'une fiche (titre, points clés) ou d'un planning de révision par jour.

7. **Entrée par photo**
   - Le candidat envoie une photo d'une question.
   - L'agent confirme ce qu'il a lu avant de traiter (« La question est : … C'est bien cela ? »).

---

## 7. Composants récurrents à définir

- **Bulle de message agent** vs **bulle de message candidat** (deux styles nettement distincts).
- **Carte de pièce jointe** (épreuve PDF / image à télécharger).
- **Carte flashcard** (recto/verso).
- **Boutons de menu / actions rapides**.
- **Barre de saisie multiformat** (texte + micro + photo).
- **États système** : chargement, envoi en cours, hors-ligne, message non délivré.

---

## 8. Direction visuelle proposée

À affiner, mais dans l'esprit **sobre, chaleureux et fiable** — sans couleurs criardes.

- **Ambiance** : professionnelle et rassurante, avec une touche de chaleur qui évoque l'hôtellerie et l'accueil.
- **Palette suggérée** (à valider) :
  - Base neutre : blanc cassé / crème pour le fond, gris ardoise pour le texte.
  - Couleur principale : un bleu-vert profond ou un bleu nuit (confiance, sérieux).
  - Accent unique : un ambre / ocre doux, utilisé avec parcimonie (chaleur, hospitalité).
  - Éviter les dégradés voyants et les couleurs vives multiples.
- **Typographie** : une sans-serif très lisible sur petit écran, deux graisses seulement (normale et semi-grasse).
- **Formes** : coins arrondis doux, espacements généreux, iconographie simple au trait.
- **Mode sombre** : à prévoir, car beaucoup de révisions se font le soir.

---

## 9. Livrables attendus de Claude Design

1. Une **direction visuelle** : palette, typographie, style des composants (une planche de style).
2. Les **maquettes des écrans** listés en section 6.
3. La **bibliothèque de composants** de la section 7.
4. Les **variantes clair / sombre** au moins pour l'écran de conversation.

---

## 10. Prompt de démarrage à coller dans Claude Design

> Tu es mon partenaire de design pour **Tuto DT HR IA**, une application mobile de révision par IA destinée aux candidats au Diplôme de Technicien Hôtellerie-Restauration (Bénin, francophone). Le prototype porte sur une seule matière : la Technologie Hôtelière.
>
> Le produit est un tuteur conversationnel bienveillant qui guide l'élève **étape par étape** et ne donne jamais la réponse avant au moins deux tentatives de sa part. Il propose trois usages : questions-réponses guidées, accès à d'anciennes épreuves, et outils de révision (flashcards, fiches, emplois du temps). Pas de création de compte ; entrées possibles en texte, audio et photo.
>
> Style souhaité : **sobre, chaleureux, fiable**, mobile d'abord, sans couleurs criardes — base neutre, une couleur principale profonde, un seul accent chaud, deux graisses de police, coins arrondis doux, mode sombre prévu.
>
> Commence par me proposer **une direction visuelle** (palette, typographie, style des bulles de conversation et des cartes), puis nous concevrons les écrans un par un, en démarrant par **l'écran de conversation (dialogue maïeutique)**. Pose-moi des questions si un choix est ambigu.

---

*Brief de conception — Tuto DT HR IA, Phase 1. Contexte pédagogique basé sur l'annale de Technologie Hôtelière (R. DAASSI, édition 2025) et le cahier des charges du projet.*
