# Baston TV — prototype 0.12

Jeu PWA en HTML/CSS/JavaScript, jouable dans un navigateur et installable depuis GitHub Pages.

## Nouveautés de la version 0.12

- **6 stades** pour les Bourrins : Bébé Bourrin (nouvelle illustration), Paumé, Balourd, Cogneur, Titan, Quadri-Poings (effet de gants provisoire pour la dernière forme).
- **Sauvegardes v0.11 migrées automatiquement** : les anciens personnages gardent une apparence équivalente ; le niveau 5 « Mastodonte » provisoire devient un Titan niveau 5.
- **Entraînement plus exigeant** : moins de 3 touches = 0 équipement ; 3 à 7 = 1 ; 8 ou plus = 2. Un combo d'au moins 8 sans faute offre un bonus, un combo de 13 sans faute offre un second bonus (4 maximum).
- **Fini les œufs quotidiens** : un œuf toutes les sept victoires, à récupérer depuis l'incubateur. Les outils de test des œufs sont réservés au mode développeur.
- **Paramètres** en haut : volumes séparés pour menus et effets ; futur volume musical mémorisé, mais pas de bande-son pour le moment.
- **Codes** : `Test0.12` donne 100 gemmes une fois par navigateur ; `DEV0.12` active le mode développeur (ajouts de gemmes/pièces et œufs de test).
- **Réinitialiser la partie** : deux confirmations obligatoires, dont la saisie exacte `REINITIALISER`.

## Démarrer en local

1. Décompresser le ZIP puis ouvrir le dossier avec Visual Studio Code.
2. Installer l'extension Live Server si nécessaire.
3. Clic droit sur `index.html` → **Open with Live Server**.

## Publier sur GitHub Pages

Décompresser le ZIP GitHub Pages (fichiers à la racine) puis envoyer tous les fichiers et le dossier `assets/` dans ton dépôt `baston-tv` via **Add file → Upload files**, sans envoyer le ZIP. Vérifier **Settings → Pages → Deploy from a branch → main / (root)**. Attendre la fin du déploiement dans Actions.

## Précautions

- Le jeu ne possède pas de serveur : les sauvegardes et les codes sont locaux à chaque navigateur/appareil.
- Les codes sont présents dans le JavaScript public : **ne pas les considérer comme secrets ou sécurisés**. Désactiver le mode développeur et retirer son code pour une vraie sortie publique.
- Réinitialiser le compte efface la progression locale, mais ne remet pas à zéro les codes cadeaux déjà utilisés sur cet appareil.
- Le réglage « musique » est prévu mais aucun fichier musical n'est joué en v0.12.
