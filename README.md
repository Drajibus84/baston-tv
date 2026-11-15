# Baston TV — v0.22

## Changements

- Ninja niveau 6 : 2 bras naturels + 2 bras d’ombre violets, sprite PNG entièrement détouré.
- Chaînes : niveaux 9 et 10 coûtent maintenant les pièces habituelles **et** respectivement 5 puis 10 gemmes.
- IA : elle vise plus souvent la zone verte et rate rarement (attaque : 10 % gris, 65 % vert, 20 % bleu, 5 % rouge ; défense : 15/60/20/5).
- Journal visuel des évolutions : sur la chaîne concernée et dans la boutique, illustrations des stades déjà découverts et ??? pour les autres. Les découvertes sont enregistrées localement.
- Recrutement : Bourrins = 4 équipements différents, Ninjas = 5, Sumos = 6, Robots = 7. Un exemplaire de chaque ; les inventaires existants sont conservés et les nouvelles catégories démarrent à zéro.
- Entraînement : un sac de boxe, un mannequin en bois Ninja, un pilier Sumo ou une cible Robot, même mécanique des points faibles.

## Sauvegardes

La clé de sauvegarde reste `bastontv-save-v03` ; passage du schéma en version 22, les anciens personnages et ressources sont conservés. Les éléments du journal sont déduits des niveaux présents dans les anciennes sauvegardes.

## Installation GitHub Pages

Décompresser la version GitHub et envoyer les **fichiers contenus à la racine** du dépôt : index.html, app.js, styles.css, sw.js, manifest.webmanifest, .nojekyll, ainsi que le dossier assets et ses sous-dossiers. Settings → Pages doit pointer sur main / (root). Après publication, fermer puis rouvrir l’application PWA pour recharger le cache v022.
