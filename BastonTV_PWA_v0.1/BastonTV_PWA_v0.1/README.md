# Baston TV — premier prototype PWA (v0.1)

Un petit jeu mobile hors-ligne en **HTML, CSS et JavaScript**, sans bibliothèque et sans base de données.

## Lancer le jeu sur ton ordinateur

1. Décompresse l'archive ZIP.
2. Ouvre le dossier `BastonTV_PWA_v0.1` dans VS Code (ou un terminal).
3. Si Python est installé, lance `python -m http.server 8000` (sous Windows, `py -m http.server 8000` fonctionne souvent également).
4. Va dans **http://localhost:8000** avec ton navigateur.

Attention : ouvrir directement `index.html` via `file://` peut permettre de jouer, mais **n'active pas correctement le mode hors ligne ni l'installation PWA**. Il faut utiliser `localhost` ou HTTPS.

## Installer comme application

- Sur Chrome/Edge : utilise l'option d'installation de l'application lorsque disponible.
- Sur téléphone : il faudra d'abord mettre les fichiers en ligne sur une adresse **HTTPS** (par exemple un hébergement statique). Une simple adresse `localhost` sur ton ordinateur n'est pas accessible depuis ton téléphone.
- Certains navigateurs iOS/Android permettent ensuite « Ajouter à l'écran d'accueil » ; les menus exacts varient.

## Ce qui fonctionne

- Une chaîne Boxe TV avec 1 boxeur de départ et 600 pièces.
- Revenus automatiques des **deux meilleurs combattants**, avec accumulation hors ligne limitée à 8 heures.
- Amélioration du studio en dépensant des pièces (+25 % de revenus par niveau).
- Séances à 100 pièces : pendant 20 secondes, touche des points faibles qui changent de position sur un sac.
- 1 à 4 équipements gagnés selon le score, plus un bonus pour un combo de 5.
- Recrutement d'un Paumé grâce à 4 équipements.
- Fusion de 2 boxeurs identiques pour obtenir l'évolution supérieure (jusqu'au Titan).
- Sauvegarde locale (localStorage) et ressources PWA en cache pour un usage hors connexion après la première visite.

## Pas encore disponible

- Les œufs et shinies ; les gemmes ; les combats, les championnats et les QTE ; les six autres chaînes ; la collection complète et le PvP.
- Pas de synchronisation entre appareils : vider les données du navigateur efface la progression.

## À quoi servent les fichiers ?

- `index.html` : la structure de la page.
- `styles.css` : les couleurs, les formes et la présentation mobile.
- `app.js` : les règles du jeu, le mini-jeu et la sauvegarde.
- `manifest.webmanifest` : nom, icône et paramètres d'installation PWA.
- `sw.js` : mémorise les fichiers pour les rejouer hors connexion.
- `assets/` : personnages et icônes.

## Première séance de test

1. Ouvre l'onglet TV et regarde tes pièces augmenter.
2. Va dans Entraîner, dépense 100 pièces et frappe les cibles mouvantes.
3. Vérifie les récompenses dans Vestiaires.
4. Recommence jusqu'à obtenir les 4 objets différents, puis recrute un boxeur.
5. Fusionne deux Paumés et retourne voir les revenus TV.
6. Ferme l'onglet quelques minutes, rouvre-le et vérifie les pièces gagnées.

Les chiffres sont **des paramètres de test**, pas encore l'équilibrage définitif.
