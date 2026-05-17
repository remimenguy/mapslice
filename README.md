# MapSlice

> Géocodage CSV et zones éditables sur carte interactive.

**MapSlice** est une application web qui transforme un fichier CSV de contacts (nom + adresse) en points géolocalisés sur une carte. Vous pouvez ensuite dessiner des zones polygonales pour regrouper automatiquement les contacts par secteur, éditer les résultats, et exporter/importer la session de travail.

## ✨ Fonctionnalités

- 📍 **Géocodage CSV** — Import d’un fichier CSV (nom, adresse) et conversion en coordonnées géographiques.
- ⚡ **Mode rapide** — Géocodage accéléré pour les gros fichiers.
- 🗺️ **Carte interactive** — Visualisation des points sur une carte Leaflet avec clustering automatique des marqueurs.
- ✏️ **Zones éditables** — Dessin et édition de polygones pour découper la carte en secteurs.
- 📋 **Répertoire par zone** — Génération automatique d’une liste des contacts présents dans chaque zone.
- 💬 **Composition de messages** — Création de messages personnalisés avec template (utilisez `XXXX` pour insérer le nom).
- 💾 **Session persistante** — Export/import de la session complète au format JSON pour reprendre le travail plus tard.

## 🛠️ Stack technique

- **Backend** : [Node.js](https://nodejs.org/) (≥ 18) — serveur HTTP statique léger sans dépendance externe.
- **Frontend** : HTML / CSS / JavaScript vanilla (aucun framework).
- **Cartographie** : [Leaflet](https://leafletjs.com/) + [Leaflet.draw](https://github.com/Leaflet/Leaflet.draw) + [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster).
- **Parsing CSV** : [PapaParse](https://www.papaparse.com/).
- **Calculs géospatiaux** : [Turf.js](https://turfjs.org/) (point-in-polygon, etc.).

## 📋 Prérequis

- [Node.js](https://nodejs.org/) version **18 ou supérieure**.
- Un navigateur moderne (Chrome, Firefox, Safari, Edge).

## 🚀 Installation

```bash
# Cloner le dépôt
git clone https://github.com/remimenguy/mapslice.git
cd mapslice

# Démarrer le serveur
npm start
```

L’application est ensuite accessible à l’adresse <http://localhost:3000> (ou le port défini par le serveur).

## 📖 Utilisation

1. **Charger un CSV** depuis le panneau latéral. Le fichier doit contenir au minimum deux colonnes : `nom` et `adresse`.
1. Cliquer sur **Géocoder** (qualité standard) ou **Géocoder rapide** (volume).
1. Une fois les points placés sur la carte, dessiner une zone à l’aide des outils Leaflet.draw.
1. Cliquer sur **Valider la zone** pour l’enregistrer et générer son répertoire.
1. Utiliser **Afficher les pins** pour basculer la visibilité des marqueurs.
1. **Exporter la session** pour sauvegarder l’état complet (points + zones) en JSON, et la réimporter plus tard.

### Format CSV attendu

```csv
nom,adresse
Dupont,1 rue de la Paix 75002 Paris
Martin,12 avenue Victor Hugo 69006 Lyon
```

## 🧪 Tests

Les tests utilisent le runner natif de Node :

```bash
npm test
```

## 📁 Structure du projet

```
mapslice/
├── public/           # Assets statiques (CSS, JS)
│   ├── css/
│   └── js/
├── tests/            # Tests unitaires (node --test)
├── mapslice.html     # Page principale de l'application
├── server.js         # Serveur Node.js
├── package.json
└── LICENSE
```

## 📄 Licence

Distribué sous licence [MIT](LICENSE).