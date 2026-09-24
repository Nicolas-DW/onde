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

- `dist/index.html` : interface ; `dist/style.css` : apparence.
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

L'extraction conserve les fonctionnalités et l'interface existantes. Elle n'ajoute pas d'adaptation tactile. Déployer depuis l'iPhone ne garantit pas le confort d'utilisation de l'éditeur sur ce téléphone.
