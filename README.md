# Baston TV — Prototype v0.19

## Nouveautés

- **Famille Sumos** : six illustrations (Bébé Sumo → Le Yokozuna), débloquage à **6 500 pièces** sur la page TV, puis une chaîne **Sumo TV** indépendante, des entraînements et équipements spécifiques, un vestiaire et le recrutement/fusion.
- Les Sumos sont **lents et résistants** : une attaque et **deux essais de parade** par tour, en gardant la meilleure protection.
- La progression de la chaîne Sumo va jusqu'au niveau 10, avec ses propres améliorations. Les revenus de toutes les chaînes se cumulent.
- Les œufs attribuent une famille au hasard uniquement parmi celles détenues par le joueur ; l'étiquette indique désormais « 🥊 Œuf de Bourrins », « 🥷 Œuf de Ninjas » ou « 🥋 Œuf de Sumos ».
- **Ninja niveau 4** : fragments du sprite niveau 5 supprimés du bord droit de l'image.
- Le résultat des frappes et parades reste affiché **1,5 seconde** (contre 1,75 s).

## Compatibilité

La sauvegarde utilise toujours la clé locale `bastontv-save-v03`. Les données v0.18 sont conservées ; le Sumo commence verrouillé et se débloque avec les pièces, sans toucher à tes Bourrins ou Ninjas.

## Installation GitHub Pages

Dans l'archive GitHub, transfère les **fichiers du dossier décompressé directement à la racine** de ton dépôt. Vérifie la présence de `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest` et `assets/`, notamment `assets/sumo-1.png` à `assets/sumo-6.png` et `assets/ninja-4.png`. Le cache de l'application est versionné `baston-tv-v019`.

## Contrôles et règles existantes

- Entraînements avec équipements exclusifs à chaque famille ; fusions de même stade, même famille, même rareté.
- Boutique : œuf normal (35 gemmes), shiny garanti (75 gemmes), gratuit toutes les 24 h, protéine (500 gemmes).
- Combats à jauge : Ninjas 2 attaques, Sumos 2 parades, Bourrins équilibrés.
- Tous les 7 combats remportés, un œuf ; incubation normale 30 min, shiny 2 h ; un autre œuf peut commencer dès que le précédent est prêt.
- Retour après 15 min : récapitulatif des gains hors ligne (8 heures maximum).

Pour tester en local, ouvre le projet avec Live Server. Pour installer la PWA sur téléphone, utilise GitHub Pages en HTTPS.
