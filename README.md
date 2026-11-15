# Baston TV — Prototype v0.20

## Nouveautés

- **Quatrième famille : Robots 🤖**. Débloque Robot TV après les Sumos pour **18 000 pièces**. Six évolutions illustrées, de Bébé Boulon au Mécha Suprême ; chaîne autonome, vestiaire, équipements exclusifs, entraînement, fusions, œufs, protéines et sélection en combat.
- **Style Robots :** robustes, vitesse intermédiaire et **blindage passif de −12 % de dégâts reçus** en plus de la parade. Une attaque et une parade par tour.
- **Découverte progressive des adversaires :** tu peux combattre uniquement les familles déjà débloquées et la **suivante**. Exemple : avec la Boxe seule, adversaires Bourrins/Ninjas ; après les Ninjas, les Sumos s'ajoutent, etc.
- **Chaînes secrètes :** seules les chaînes débloquées et la prochaine à débloquer sont nommées sur l'accueil. Les suivantes restent « 🔒 ??? ».
- **Récapitulatif d'entraînement :** fenêtre de 3,5 secondes montrant immédiatement la quantité et le type des équipements gagnés. Les résultats restent également dans la salle d'entraînement.

## Compatibilité de sauvegarde

La clé de sauvegarde reste `bastontv-save-v03`. Les anciennes collections, familles déjà débloquées, gemmes, protéines, shinies, œufs, équipements et chaînes sont préservés. Les Robots commencent verrouillés et leurs nouvelles données sont initialisées sans réinitialiser ton compte.

## GitHub Pages

Téléverse le **contenu de l'archive GitHub directement à la racine du dépôt** (pas son dossier enveloppe). Il faut `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest` et `assets/`, incluant **`robot-1.png` à `robot-6.png`**. Le service worker est versionné `baston-tv-v020` pour faciliter l'actualisation de la PWA.

Pour un test local, utilise VS Code avec Live Server. Les mécanismes existants d'œufs, incubations, boutique, sons, combats et fusions restent disponibles.
