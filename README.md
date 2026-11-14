# Baston TV — prototype 0.10

## Démarrer en local

1. Décompresse le ZIP.
2. Ouvre le dossier `BastonTV_PWA_v0.10` dans VS Code.
3. Clic droit sur `index.html` → Open with Live Server.

## Corrections v0.10

- Les shinies sont positionnés à la même hauteur que les normaux dans l’arène et ne sont plus coupés en haut par la règle CSS de l’aura.
- Les textes de dégâts sont placés dans l’arène (en dehors de l’image retournée) : ceux infligés et ceux reçus sont lisibles dans le bon sens.
- Bouton **📲 Installer Baston TV** sur l’accueil : boîte native si le navigateur prend en charge `beforeinstallprompt`, instructions adaptées pour les autres appareils (notamment iPhone).
- Manifeste et service worker vérifiés pour un hébergement sous `/baston-tv/` sur GitHub Pages.

## Publier sur GitHub Pages (sans Git en ligne de commande)

1. Ouvre ton dépôt `baston-tv` sur GitHub, puis `Add file` → `Upload files`.
2. **Dépose le contenu du dossier** `BastonTV_PWA_v0.10`, pas le ZIP ni le dossier enveloppe. `index.html` doit être directement à la racine de `baston-tv`.
3. Termine avec `Commit changes`.
4. `Settings` → `Pages` → Source = `Deploy from a branch`, Branch = `main`, Folder = `/(root)` → Save.
5. Une fois le déploiement réussi, ouvre `https://drajibus84.github.io/baston-tv/` sur téléphone (HTTPS requis pour l'installation de PWA).
6. Sur Chrome Android, utilise le bouton **Installer** du jeu. Sur iPhone, utilise le menu Partager → Sur l'écran d'accueil.

Si le site retourne une erreur 404 : vérifie le fichier `index.html` à la racine, la branche `main` et le résultat du déploiement dans l’onglet `Actions`.

## Sauvegarde

La sauvegarde locale est conservée avec la clé `bastontv-save-v03`. Cependant, `localhost:5500` et `https://drajibus84.github.io` ne partagent pas leurs sauvegardes : sur ton téléphone tu commenceras une nouvelle partie. Le prototype ne synchronise pas encore les données entre appareils.

## Remarque

Le bouton d’installation ne s’affiche pas dans les vues autres que l’accueil. Sur certains navigateurs, l’invite native n’existe pas : les instructions de l’app apparaissent alors.
