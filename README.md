# Onde — Montage audio

Version autonome issue de la version 14 (source 87788995337dfaf79a1f880e60aff0168f34b519).

Éditeur multipiste exécuté dans le navigateur. Aucun compte ChatGPT, serveur applicatif, compilation ou clé API nécessaire. Les fichiers de `dist/` sont les sources directement modifiables, sauf la bibliothèque tierce MP3.

## GitHub puis Netlify depuis Safari sur iPhone

1. Le code est disponible dans le dépôt public https://github.com/Nicolas-DW/onde.
2. Sur https://app.netlify.com, choisir **Add new project → Import an existing project → GitHub**.
3. Autoriser Netlify à accéder au dépôt Onde puis le sélectionner.
4. Laisser la commande de build vide et utiliser **dist** comme dossier publié (déjà configuré dans `netlify.toml`).
5. Déployer. Les changements envoyés sur la branche de production déclencheront les déploiements suivants.


## Déploiement manuel

L'archive séparée `onde-deploiement-direct.zip` contient le site avec `index.html` à la racine. Décompresser puis déposer le dossier dans **Deploy manually** sur https://app.netlify.com/drop. Le choix d'un dossier peut être peu pratique sur iOS ; privilégier GitHub pour les mises à jour. Ce déploiement ne crée pas de dépôt GitHub.

## Transférer les montages

Le stockage du navigateur est propre à chaque adresse. Il ne migre pas automatiquement.

1. Sur l'ancienne adresse, ouvrir chaque montage et exporter son projet portable `.onde` depuis **Projets**.
2. Sur la nouvelle adresse, importer ce fichier depuis **Projets** et sauvegarder.
3. Conserver ces fichiers comme sauvegardes : ils incluent les médias. Un export WAV/MP3 est un mixage, pas un projet éditable.

Les préréglages personnels sont aussi propres au navigateur et ne migrent pas automatiquement. Le contrôle d'accès ChatGPT n'est pas repris : l'accès au site dépendra de Netlify. Les montages restent locaux et ne sont pas partagés avec les visiteurs.

## Modifier hors ChatGPT

- `dist/index.html` : interface ; `dist/style.css` : apparence ; `dist/mobile.css` : interface téléphone.
- `dist/app.js` : coordination de l'éditeur.
- `dist/*.mjs` : montage, audio, transport, stockage, effets.
- Workers et worklet : traitements audio.
- `dist/vendor/` : encodeur MP3 et licence à conserver.
- `tests/` : tests existants.

Serveur local sur ordinateur :

```sh
python3 -m http.server 8080 --directory dist
```

Ouvrir http://localhost:8080 ; éviter `file://` (modules et workers).

Tests (Node.js récent) :

```sh
npm ci --prefix tests
node --test tests/*.test.mjs
```

## Sur téléphone

Une interface tactile s'active automatiquement sur les petits écrans (largeur ≤ 760 px, ou téléphone en paysage). Elle utilise le même montage, les mêmes projets et les mêmes réglages ; seules la présentation et les gestes changent :

- barre du haut : nom du projet, annuler, rétablir, sauvegarder et menu ⋯ (projets, export, master FX, pistes, analyse, grille, aide) ;
- un doigt fait défiler le montage, la règle place la tête de lecture ;
- zoom : pincement à deux doigts, ou bouton Zoom (curseur de durée visible, paliers − / +, cadrages Tout, 1 min, 10 s, 2 s centrés sur la tête de lecture) ;
- toucher un bloc le sélectionne et affiche sa barre (réglages, FX, couper, options, supprimer) ; un bloc sélectionné se déplace au doigt, poignées agrandies, défilement automatique près des bords ; appui long : options du bloc ;
- toucher le nom d'une piste ouvre ses options (nom, volume, FX, aimant, ordre, import, suppression) ;
- les fenêtres deviennent des panneaux qui montent du bas ; réglages précis par curseurs (fondus, décalage ±0,1 s / ±1 s) ;
- Menu → Interface ordinateur rétablit la présentation complète ; Affichage → Interface téléphone l'impose sur tout appareil (choix mémorisé dans le navigateur).

Dans Safari, Partager → Sur l'écran d'accueil installe Onde en plein écran (`manifest.webmanifest`, icônes `icon-180.png` et `icon-512.png`).

Fichiers : `dist/mobile.css` (présentation, active seulement avec la classe `mobile` sur `<html>`) et la dernière section de `dist/app.js` (gestes et panneaux). `tests/mobile.test.mjs` couvre ces comportements.
