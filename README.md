# Baston TV — Prototype v0.15

## Publier sur GitHub Pages

1. Décompresser l’archive GitHub (ne pas envoyer le ZIP lui-même).
2. Ouvrir le dépôt `Drajibus84/baston-tv` → **Add file → Upload files**.
3. Déposer **tous les fichiers à la racine**, avec le dossier `assets/` entier (notamment `index.html`, `app.js`, `styles.css`, `sw.js`).
4. **Commit changes**, vérifier le déploiement dans **Actions**.
5. Sur le téléphone, fermer complètement Baston TV, puis rouvrir. Si l'ancienne version subsiste, vérifier la version dans le navigateur avant de réessayer.

**Ne pas désinstaller l’application ni vider ses données**, car la collection est enregistrée localement dans le navigateur.

## Nouveautés v0.15

- Sac et corde regroupés dans un pendule : ils oscillent **ensemble** lorsqu’on frappe une cible.
- Bouton **Commencer la séance** directement **en dessous du sac**, avant le choix de l’accompagnateur. Les prix et les résultats restent accessibles en défilant.
- Carte **Protéine d’évolution** déplacée sous la carte « Équipements de boxe / Recruter » dans les vestiaires.
- TV de l’accueil : les deux combattants se font face et s’échangent des petits coups avec « POW ! », « BAM ! », « TCHAK ! », « PAF ! ». Aucun dégât, son ni impact économique.
- Jauges de combat 10 % plus rapides et aiguille plus fine.
- Protection bleue abaissée de **100 % à 90 %** ; les attaques non ratées infligent toujours au moins **1 point de dégâts** même en cas de très bonne parade.
- Compatibilité conservée avec les sauvegardes de la v0.14 (`bastontv-save-v03`), les pièces, gemmes, œufs, shinies, protéines et codes déjà utilisés.

## Jouer hors ligne

Serveur local VS Code / Live Server ou GitHub Pages. Le fichier `sw.js` utilise désormais le cache `baston-tv-v015`.
