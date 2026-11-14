# Baston TV — PWA v0.17

Prototype de jeu mobile et ordinateur (HTML, CSS et JavaScript, sans serveur de sauvegarde). **La sauvegarde reste `bastontv-save-v03`**, donc les personnages, pièces, gemmes, chaînes, œufs et autres ressources de la v0.16 sont conservés lors de la mise à jour.

## Corrections de cette version

- Vestiaires : vrais planchers / plateformes pour chaque rangée de combattants, y compris lorsque plusieurs Ninjas se trouvent hors antenne. Jusqu'à 30 personnages visibles dans le vestiaire de chaque famille (les deux vedettes sont affichées séparément).
- Boutique / œufs : correction du menu de famille sur Android. Le jeu n'efface plus et ne reconstruit plus toute la boutique chaque seconde ; les compteurs de l'incubateur et de l'œuf gratuit sont mis à jour directement.
- Combats : sélection du combattant masquée par défaut derrière un bouton. Une fois le combattant choisi, la liste se referme automatiquement. Le classement des choix reste du niveau le plus élevé au plus bas.
- Combats : jauge **25 % plus rapide par rapport à la v0.16** (durée précédente divisée par 1,25 pour chaque famille).
- Combats : arène placée **avant la jauge**, barre de vie et vitesse compactes, disposition adaptée aux écrans de téléphone.
- Suppression du bouton développeur **« Jouer Sumo (test) »**. Les Sumos peuvent toujours être des adversaires.
- En-tête légèrement plus compact sur les petits écrans et cache PWA mis à jour (`baston-tv-v017`).

## Mettre le jeu sur GitHub Pages

Pour la version GitHub Pages, décompresser `BastonTV_GitHubPages_v0.17.zip`, ouvrir le dossier décompressé puis **téléverser son contenu** (pas seulement le dossier parent) à la racine du dépôt GitHub `Drajibus84/baston-tv`. Il faut notamment `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest` et **le dossier `assets` avec les images Bourrins et Ninjas**.

Après **Commit changes**, attendre la fin du déploiement dans l'onglet *Actions*. Ouvrir le jeu dans le navigateur, puis fermer complètement et rouvrir la PWA installée. Il faut parfois la rouvrir deux fois pour recevoir une mise à jour du service worker. **Ne pas désinstaller l'application ni effacer les données du site** pour forcer une mise à jour : cela pourrait supprimer la sauvegarde locale.

## Tester sur ordinateur

Décompresser `BastonTV_PWA_v0.17.zip` puis lancer `index.html` via Live Server (VS Code), ou servir le dossier sur un serveur local. Les fonctionnalités PWA complètes nécessitent HTTPS ou `localhost`.
