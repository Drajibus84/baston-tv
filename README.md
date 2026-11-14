# Baston TV — Prototype v0.16

Deux familles recrutables : Bourrins et Ninjas. Sauvegarde locale rétrocompatible avec la v0.15 (`bastontv-save-v03`).

## Nouveautés

- Déblocage du dojo Ninja (2 000 pièces) avec un Bébé Ninja offert à l’ouverture.
- Chaînes **Boxe TV** et **Ninja TV**, chacune avec ses deux combattants en direct et **10 niveaux d’amélioration** (+100 % maximum par chaîne).
- Migration des anciens niveaux du studio vers Boxe TV, en préservant le bonus acquis : niv. 1→1, 2→3, 3→5, 4→7, 5→10.
- Vestiaires séparés, équipements propres aux deux familles et entraînement ciblé. Entraînement Ninja 35 % plus cher.
- 6 illustrations Ninja ; fusions et protéines indépendantes des familles.
- Choix du combattant depuis la collection triée par niveau décroissant sur l’écran Combat.
- Ninja jouable réellement avec ses deux frappes et sa vitesse élevée ; Sumo toujours adversaire (style provisoire).
- Vitesse des jauges de combat +25 % (durée divisée par 1,25).
- Choix de famille pour les œufs au lancement de l’incubation (famille débloquée uniquement).
- Les revenus TV des différentes chaînes s’ajoutent, et les shinies découverts donnent un bonus global.

## Installer sur GitHub Pages

Décompresser le ZIP GitHub Pages, puis charger **tous les fichiers qu'il contient** à la racine de `Drajibus84/baston-tv`, y compris `assets/ninja-1.png` à `ninja-6.png` et les images de boxe. Conserver l’arborescence et valider **Commit changes**. Attendre le déploiement GitHub Actions, puis relancer l’app PWA.

## Notes

Les fichiers `index.html`, `styles.css`, `app.js`, `manifest.webmanifest` et `sw.js` doivent rester au même niveau. Les prix et statistiques sont provisoires et peuvent être équilibrés après les tests sur téléphone. Les données sont stockées localement, pas synchronisées entre appareils. N’efface pas les données du site pour mettre à jour.
