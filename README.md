# Baston TV — Prototype v0.21.1

Cette édition remplace directement la v0.21. Tu peux passer de la v0.20 à la v0.21.1 : **aucune installation intermédiaire n’est nécessaire**.

## Corrections graphiques

- **Bébé Bourrin (niveau 1)** : illustration conservée **à l’identique** depuis la v0.20.
- **Le Titan (niveau 5)** : nouveau dessin à **deux bras**, très musclé, **sans ceinture de champion**.
- **Le Champion (niveau 6)** : nouveau dessin à **deux bras**, expression sérieuse et confiante, avec **grosses ceintures dorées** aux épaules et à la taille. Le nom « Le Quadri-Poings » a été remplacé pour correspondre à son nouveau design.
- **Ninja (niveau 5)** : retrait des fragments détachés appartenant à l’évolution voisine, sans changer son apparence principale.
- Les autres dessins des Bourrins (niveaux 2 à 4) restent identiques à la v0.21.

## Équilibrage de la v0.21 conservé

Défense : gris 20 %, vert 35 %, bleu 75 %, rouge 0 %. Zones vertes affinées, Robot : zones bleues légèrement agrandies et 12 % de blindage passif. La liste des protéines affiche la famille et ✨ pour les shinies, sans identifiant visible.

## Compatibilité

Même clé de sauvegarde `bastontv-save-v03`, mêmes niveaux, mêmes coûts, mêmes gains et mêmes familles. Changer le nom de l’évolution 6 n’altère ni les combattants existants ni leurs statistiques.

## Installation sur GitHub Pages

Décompresse le ZIP `BastonTV_GitHubPages_v0.21.1.zip`, puis téléverse **tous les fichiers qu’il contient à la racine** du dépôt, dont `index.html`, `app.js`, `sw.js`, `styles.css`, le dossier `assets/` et ses images. Vérifie que les images `boxeur-1.png`, `boxeur-5.png`, `boxeur-6.png` et `ninja-5.png` ont été mises à jour. Termine par **Commit changes** ; le service worker utilise le cache `baston-tv-v0211`.
