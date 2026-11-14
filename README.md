# Baston TV — prototype PWA v0.3

**NOUVEAUTÉ : animations du boxeur et premier combat 1 contre 1 !**

## Pour tester avec VS Code

1. Décompresse le ZIP `BastonTV_PWA_v0.3.zip`.
2. Dans VS Code, menu **Fichier > Ouvrir un dossier**, sélectionne **BastonTV_PWA_v0.3** (pas un fichier isolé).
3. Ouvre `index.html`, puis fais clic droit > **Open with Live Server** (ou **Go Live** en bas à droite).
4. Sur la page, choisis l’onglet **⚔️ Combat**, clique sur « Lancer le combat », puis sur **Coup rapide** ou **Uppercut**.
5. Dans **Entraîner**, frappe les cibles : ton boxeur s’avance et le sac se balance.

## Fonctionnalités incluses

- Tout ce que faisait la v0.1 : pièces automatiques, studio amélioré, entraînement (20 s, 100 pièces), équipement, recrutement et fusion.
- Les combattants bougent doucement au repos dans les émissions, au gymnase et dans la collection.
- Lors d’une cible touchée, le boxeur donne un coup et le sac réagit.
- **Nouveau mini-combat de démonstration (1 contre 1)** : 2 coups, animations des attaques, réactions, points de vie, victoire (+75 pièces), retour de l’adversaire.
- Aucun combattant perdu en cas de défaite. Pas encore de véritables QTE, équipes de trois ou championnats.
- Les images existantes sont animées par CSS : pas encore de dessins de bras ou jambes image par image.
- Sauvegarde existante de la v0.1 conservée via la même clé de stockage sur le **même navigateur et la même adresse**.

## Publier sur GitHub Pages

La v0.3 se publie comme la v0.1 : il faut envoyer tous les fichiers **à la racine** du dépôt, avec `index.html` bien visible au premier niveau.
Si GitHub Pages renvoie **404**, vérifie que le site est publié depuis `main` et `/(root)` dans **Settings > Pages**, et que `index.html` est à la racine (pas dans un dossier interne). L'adresse doit normalement finir par `/baston-tv/`.

Après une mise à jour, actualise le navigateur si l’ancienne version est encore affichée. Le service worker de la v0.3 privilégie les ressources récentes quand Internet fonctionne et conserve un cache pour l’usage hors connexion.

## À quoi servent les fichiers ?

- `index.html` : structure des écrans et navigation.
- `styles.css` : mise en page et **animations visuelles** (les `@keyframes` en bas du fichier).
- `app.js` : règles du jeu et déroulement des attaques (fonctions `combatScreen`, `startDuel`, `punch`).
- `sw.js` : cache PWA pour le mode hors connexion.
- `manifest.webmanifest` : paramètres de l’installation sur téléphone.
- `assets/` : illustrations des quatre boxeurs et icônes.

## À venir

- Animation image par image plus complexe et effets sonores.
- Véritables combats 3 contre 3, QTE, championnats, sept disciplines, œufs et shiny.
