# MapSlice

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%E2%89%A518-339933.svg?logo=node.js&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.x-199900.svg?logo=leaflet&logoColor=white)
![Status](https://img.shields.io/badge/status-active-success.svg)

> Turn a CSV of addresses into an interactive map, then slice it into editable zones to build per-area contact directories.

-----

## Concept

MapSlice bridges the gap between a flat contact list and field-level territory management. You feed it a CSV containing names and addresses; it geocodes each entry, plots the results on an interactive map, and lets you draw custom polygonal zones on top of the map. As soon as a zone is drawn, MapSlice computes which contacts fall inside it and produces a directory grouped by zone — ready to be exported, edited, or used as the basis for targeted communication.

Typical use cases include door-to-door campaigns, sales territory planning, distribution route design, local outreach, and any workflow that requires splitting a customer or member base into geographic sectors.

The application runs locally as a lightweight Node.js server with a vanilla JavaScript front-end, so it has no database, no cloud dependency, and no build step.

-----

## Features

- **CSV import** — Load any CSV file containing names and addresses.
- **Geocoding** — Resolve addresses to coordinates, with a standard mode and a fast bulk mode.
- **Interactive map** — Pan, zoom, and explore your data on a Leaflet-powered map.
- **Marker clustering** — Automatic aggregation of nearby points for readability at any zoom level.
- **Editable zones** — Draw, reshape, and delete polygonal zones directly on the map.
- **Per-zone directory** — Automatic listing of every contact contained in each zone.
- **Message composer** — Compose personalized messages using a simple `XXXX` placeholder for the contact name.
- **Session export/import** — Save the full working state (points + zones + edits) as JSON and reload it later.

-----

## Tech stack

|Layer      |Technology                                              |
|-----------|--------------------------------------------------------|
|Runtime    |Node.js (>= 18), zero external dependencies             |
|Front-end  |Plain HTML / CSS / JavaScript (no framework, no bundler)|
|Mapping    |Leaflet, Leaflet.draw, Leaflet.markercluster            |
|CSV parsing|PapaParse                                               |
|Geospatial |Turf.js (point-in-polygon, geometry operations)         |
|Testing    |Native Node.js test runner (`node --test`)              |

-----

## Requirements

- Node.js **18 or later**
- A modern browser (Chrome, Firefox, Safari, or Edge)

-----

## Installation

```bash
# Clone the repository
git clone https://github.com/remimenguy/mapslice.git
cd mapslice

# Start the server
npm start
```

Then open the application in your browser at the URL printed in the terminal (the server defaults to a local port).

-----

## Usage

1. **Load a CSV** from the sidebar. The file must include at least a name column and an address column.
1. Click **Geocode** for the standard pipeline, or **Fast geocode** for larger files.
1. Once the markers appear on the map, use the drawing tools to outline a zone.
1. Click **Validate zone** to persist it and generate its directory.
1. Use **Apply changes** to commit edits made to points or zones.
1. Toggle marker visibility with **Show pins**.
1. Click **Export session** to download the current state as JSON, or use the file picker to **import** a previously saved session.

### Expected CSV format

```csv
name,address
Doe,1 Infinite Loop, Cupertino, CA
Smith,10 Downing Street, London
Martin,12 Avenue Victor Hugo, Lyon
```

-----

## Project structure

```
mapslice/
├── public/           Static assets served to the browser
│   ├── css/          Stylesheets
│   └── js/           Front-end application code
├── tests/            Unit tests (node --test)
├── mapslice.html     Main HTML entry point
├── server.js         Node.js static server
├── package.json
└── LICENSE
```

-----

## Testing

```bash
npm test
```

Tests run with the built-in Node.js test runner, so no additional dependency is required.

-----

## License

Released under the [MIT License](LICENSE).