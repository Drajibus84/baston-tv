# Baston TV — Prototype v0.23.2

Jeu PWA mobile, HTML/CSS/JavaScript sans framework. Les parties restent dans le navigateur via la clé `bastontv-save-v03`.

## Nouveauté v0.23.2 : Muay Thaï offensif et vol de vie

- Deux frappes par tour (contre une auparavant).
- Aucune parade : pas de jauge de défense pour le Muay Thaï, qu'il soit joué par le joueur ou par l'IA.
- Vol de vie : 35 % des **dégâts réellement infligés**, arrondi à l'entier inférieur ; aucun soin sur un coup raté, et jamais plus que les PV maximum.
- Statistiques : davantage de PV et une bonne attaque pour compenser l'absence totale de parade.
- Au combat, les soins apparaissent avec « 💚 +X », ainsi que dans le résultat du coup.
- Les autres familles continuent à utiliser leurs parades habituelles. Les Muay Thaï ennemis ne bloquent pas les attaques.

## Rappels des nouveautés v0.23 et v0.23.1

- Famille Muay Thaï : six personnages, transformations hybrides dragons aux stades avancés, huit équipements de recrutement, chaîne Muay TV et vestiaire distinct. Déblocage après Robot TV pour 42 000 pièces.
- Teintes bleu/turquoise/vert des personnages et des décors Muay Thaï (v0.23.1).
- Journal shiny avec les illustrations découvertes dans la boutique.
- Protéines filtrées par famille dans chaque vestiaire.
- Coûts supplémentaires en gemmes des chaînes affichés uniquement quand le prochain niveau les exige.
- Ninja niveau 6 avec deux vrais bras, deux bras violets d'ombre, yeux blancs et sans aura autour des bras.

## Installation sur GitHub Pages

Décompresser l'archive spéciale GitHub, puis envoyer **son contenu** à la racine du dépôt : `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `.nojekyll` et le dossier `assets/` avec ses sous-dossiers. La publication Pages doit pointer sur `main / (root)`.

La nouvelle version utilise le cache PWA `baston-tv-v0232`. Après le déploiement, ouvrir le jeu dans le navigateur, fermer complètement la PWA installée et la rouvrir. Ne pas désinstaller l'application ni effacer ses données pour éviter de perdre la sauvegarde locale.
