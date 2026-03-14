'use strict';

let geocodingDone = false;
let pinsVisible = false;
let currentRecipients = [];

const csvInput = document.getElementById('csvInput');
const geocodeBtn = document.getElementById('geocodeBtn');
const geocodeFastBtn = document.getElementById('geocodeFastBtn');
const validateZoneBtn = document.getElementById('validateZoneBtn');
const applyChangesBtn = document.getElementById('applyChangesBtn');
const togglePinsBtn = document.getElementById('togglePinsBtn');
const exportSessionBtn = document.getElementById('exportSessionBtn');
const importSessionInput = document.getElementById('importSessionInput');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const modal = document.getElementById('message-modal');
const inputTitle = document.getElementById('msg-title');
const inputBody = document.getElementById('msg-body');
const btnCancel = document.getElementById('msg-cancel');
const btnConfirm = document.getElementById('msg-confirm');

function sanitizeCell(value) {
  return String(value ?? '').replace(/,/g, ' ');
}

function downloadTextFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

btnCancel.onclick = () => {
  modal.style.display = 'none';
};

btnConfirm.onclick = () => {
  let csv = 'NomPrenom,Adresse,Titre,Message\n';
  currentRecipients.forEach((recipient) => {
    const personalizedBody = inputBody.value.replace(/XXXX/g, recipient.name);
    csv += `${sanitizeCell(recipient.name)},${sanitizeCell(recipient.addr)},${sanitizeCell(inputTitle.value)},${sanitizeCell(personalizedBody)}\n`;
  });
  downloadTextFile(csv, `${inputTitle.value || 'messages'}.csv`, 'text/csv');
  modal.style.display = 'none';
};

const map = L.map('map').setView([43.8, 7.2], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const markerClusterGroup = L.markerClusterGroup().addTo(map);
const drawnItems = new L.FeatureGroup().addTo(map);
const drawControl = new L.Control.Draw({
  edit: { featureGroup: drawnItems },
  draw: { polyline: false, circle: false, marker: false }
});
map.addControl(drawControl);
const editToolbar = drawControl._toolbars.edit;

const zoneColors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6'];
let zoneCount = 0;
const zones = [];
const markersData = [];

function resetSessionData() {
  drawnItems.clearLayers();
  markerClusterGroup.clearLayers();
  zones.length = 0;
  markersData.length = 0;
  zoneCount = 0;
  geocodingDone = false;
  pinsVisible = false;

  validateZoneBtn.disabled = true;
  applyChangesBtn.disabled = true;
  togglePinsBtn.disabled = true;
  togglePinsBtn.textContent = 'Afficher les pins';
  exportSessionBtn.disabled = true;
  resultsDiv.innerHTML = '<h2>Répertoire par zone :</h2>';
}

csvInput.addEventListener('change', () => {
  const hasFile = csvInput.files.length > 0;
  geocodeBtn.disabled = !hasFile;
  geocodeFastBtn.disabled = !hasFile;
  statusDiv.textContent = hasFile ? 'CSV prêt.' : 'Aucun CSV chargé.';
});

map.on(L.Draw.Event.CREATED, (event) => {
  zoneCount += 1;
  const layer = event.layer;
  const color = zoneColors[(zoneCount - 1) % zoneColors.length];
  const name = `Zone ${zoneCount}`;

  layer.setStyle({ color, fillColor: color, fillOpacity: 0.2 });
  layer.bindTooltip(name, { permanent: true, direction: 'center', className: 'zone-label' });

  drawnItems.addLayer(layer);
  zones.push({ id: zoneCount, name, layer, geoJSON: layer.toGeoJSON(), color });
  statusDiv.textContent = `${zones.length} zone(s) dessinée(s).`;

  if (geocodingDone) {
    validateZoneBtn.disabled = false;
  }

  layer.on('click', () => editToolbar._modes.edit.handler.enable());
});

map.on('draw:edited', (event) => {
  event.layers.eachLayer((layer) => {
    const zone = zones.find((candidate) => candidate.layer._leaflet_id === layer._leaflet_id);
    if (zone) {
      zone.geoJSON = layer.toGeoJSON();
    }
  });
  editToolbar._modes.edit.handler.disable();
  applyChangesBtn.disabled = false;
  statusDiv.textContent = 'Zones modifiées.';
});

importSessionInput.addEventListener('change', () => {
  const file = importSessionInput.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      if (!Array.isArray(parsed.zones) || !Array.isArray(parsed.markers)) {
        throw new Error('Invalid session format');
      }

      resetSessionData();

      parsed.zones.forEach((zone, index) => {
        const layer = L.geoJSON(zone.geoJSON).getLayers()[0];
        if (!layer) {
          return;
        }

        const fallbackId = index + 1;
        const id = Number(zone.id) || fallbackId;
        const name = zone.name || `Zone ${id}`;
        const color = zone.color || zoneColors[(id - 1) % zoneColors.length];

        layer.setStyle({ color, fillColor: color, fillOpacity: 0.2 });
        layer.bindTooltip(name, { permanent: true, direction: 'center', className: 'zone-label' });
        layer.on('click', () => editToolbar._modes.edit.handler.enable());

        drawnItems.addLayer(layer);
        zones.push({ id, name, layer, geoJSON: zone.geoJSON, color });
        zoneCount = Math.max(zoneCount, id);
      });

      parsed.markers.forEach((markerEntry) => {
        const lat = Number(markerEntry.lat);
        const lng = Number(markerEntry.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return;
        }

        const name = (markerEntry.name || 'Sans nom').trim();
        const addr = (markerEntry.addr || '').trim();
        const marker = L.marker([lat, lng], { opacity: 0 })
          .bindPopup(`<strong>${name}</strong><br>${addr}`);

        markersData.push({ marker, lat, lng, name, addr });
      });

      geocodingDone = markersData.length > 0;
      validateZoneBtn.disabled = !(geocodingDone && zones.length > 0);
      exportSessionBtn.disabled = zones.length === 0 && markersData.length === 0;

      if (zones.length > 0 && geocodingDone) {
        updateDisplay();
      } else if (zones.length > 0) {
        statusDiv.textContent = `${zones.length} zone(s) importée(s). Ajoutez ou géocodez des adresses pour continuer.`;
      } else {
        statusDiv.textContent = 'Session importée.';
      }
    } catch (error) {
      console.error(error);
      statusDiv.textContent = 'Erreur: session JSON invalide.';
    } finally {
      importSessionInput.value = '';
    }
  };

  reader.readAsText(file, 'utf-8');
});

function parseAndGeocode({ fast }) {
  geocodeBtn.disabled = true;
  if (fast) {
    geocodeFastBtn.disabled = true;
  }
  statusDiv.textContent = fast ? 'Géocodage rapide...' : 'Géocodage...';

  Papa.parse(csvInput.files[0], {
    header: true,
    skipEmptyLines: true,
    complete: (result) => {
      const rows = result.data;
      let idx = 0;
      const delay = fast ? 0 : 200;

      const next = () => {
        if (idx >= rows.length) {
          statusDiv.textContent = fast ? 'Géocodage rapide terminé.' : 'Géocodage terminé.';
          geocodingDone = true;
          if (zones.length) {
            validateZoneBtn.disabled = false;
          }
          return;
        }

        const row = rows[idx++];
        const name = (row.nom || '').trim() || 'Sans nom';
        const addr = (row.adresse || '').trim();

        statusDiv.textContent = fast
          ? `Géocodage rapide ${idx}/${rows.length}`
          : `Géocodage ${idx}/${rows.length}`;

        fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(addr)}`)
          .then((response) => response.json())
          .then((data) => {
            if (data.features && data.features.length) {
              const [lon, lat] = data.features[0].geometry.coordinates;
              const marker = L.marker([lat, lon], { opacity: 0 })
                .bindPopup(`<strong>${name}</strong><br>${addr}`);
              markersData.push({ marker, lat, lng: lon, name, addr });
            }
          })
          .catch(console.error)
          .finally(() => {
            if (delay > 0) {
              setTimeout(next, delay);
            } else {
              next();
            }
          });
      };

      next();
    }
  });
}

geocodeBtn.addEventListener('click', () => parseAndGeocode({ fast: false }));
geocodeFastBtn.addEventListener('click', () => parseAndGeocode({ fast: true }));

function createZoneTable(recipients) {
  const table = document.createElement('table');
  table.innerHTML = '<thead><tr><th>Nom</th><th>Adresse</th></tr></thead>';
  const tbody = document.createElement('tbody');

  recipients.forEach((person) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${person.name}</td><td>${person.addr}</td>`;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  return table;
}

function buildCsvContent(recipients) {
  let csv = 'Nom,Adresse\n';
  recipients.forEach((recipient) => {
    csv += `${sanitizeCell(recipient.name)},${sanitizeCell(recipient.addr)}\n`;
  });
  return csv;
}

function updateDisplay() {
  statusDiv.textContent = 'Affichage...';
  resultsDiv.innerHTML = '<h2>Répertoire par zone :</h2>';
  markerClusterGroup.clearLayers();
  pinsVisible = false;
  togglePinsBtn.disabled = false;
  togglePinsBtn.textContent = 'Afficher les pins';

  zones.forEach((zone) => {
    const recipients = markersData.filter((person) =>
      turf.booleanPointInPolygon(turf.point([person.lng, person.lat]), zone.geoJSON)
    );

    const container = document.createElement('div');
    container.className = 'zone';

    const titleRow = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = `${zone.name} (${recipients.length})`;
    titleRow.appendChild(title);

    const renameBtn = document.createElement('button');
    renameBtn.textContent = 'Renommer';
    renameBtn.onclick = () => {
      const nextName = prompt('Nom zone', zone.name);
      if (nextName) {
        zone.name = nextName;
        zone.layer.unbindTooltip();
        zone.layer.bindTooltip(nextName, { permanent: true, direction: 'center', className: 'zone-label' });
        title.textContent = `${zone.name} (${recipients.length})`;
      }
    };
    titleRow.appendChild(renameBtn);
    container.appendChild(titleRow);

    container.appendChild(createZoneTable(recipients));

    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Télécharger CSV';
    downloadBtn.disabled = recipients.length === 0;
    downloadBtn.onclick = () => {
      downloadTextFile(buildCsvContent(recipients), `${zone.name}.csv`, 'text/csv');
    };
    container.appendChild(downloadBtn);

    const writeMsgBtn = document.createElement('button');
    writeMsgBtn.textContent = 'Écrire un message';
    writeMsgBtn.disabled = recipients.length === 0;
    writeMsgBtn.onclick = () => {
      currentRecipients = recipients;
      inputTitle.value = '';
      inputBody.value = '';
      modal.style.display = 'flex';
    };
    container.appendChild(writeMsgBtn);

    resultsDiv.appendChild(container);

    recipients.forEach((person) => {
      const marker = L.marker([person.lat, person.lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
          iconSize: [52, 83],
          iconAnchor: [26, 83],
          popupAnchor: [0, -83]
        })
      }).bindPopup(`<strong>${person.name}</strong><br>${person.addr}`);

      markerClusterGroup.addLayer(marker);
    });
  });

  const unassigned = markersData.filter((person) =>
    !zones.some((zone) => turf.booleanPointInPolygon(turf.point([person.lng, person.lat]), zone.geoJSON))
  );

  const containerUnassigned = document.createElement('div');
  containerUnassigned.className = 'zone';
  containerUnassigned.style.cssFloat = 'right';

  const titleUnassigned = document.createElement('h3');
  titleUnassigned.textContent = `Sans zone (${unassigned.length})`;
  containerUnassigned.appendChild(titleUnassigned);
  containerUnassigned.appendChild(createZoneTable(unassigned));

  const downloadUnassignedBtn = document.createElement('button');
  downloadUnassignedBtn.textContent = 'Télécharger CSV';
  downloadUnassignedBtn.disabled = unassigned.length === 0;
  downloadUnassignedBtn.onclick = () => {
    downloadTextFile(buildCsvContent(unassigned), 'Sans_zone.csv', 'text/csv');
  };
  containerUnassigned.appendChild(downloadUnassignedBtn);

  resultsDiv.appendChild(containerUnassigned);

  applyChangesBtn.disabled = true;
  exportSessionBtn.disabled = false;
  statusDiv.textContent = 'Prêt.';
}

validateZoneBtn.addEventListener('click', updateDisplay);
applyChangesBtn.addEventListener('click', updateDisplay);

togglePinsBtn.addEventListener('click', () => {
  if (pinsVisible) {
    map.removeLayer(markerClusterGroup);
    pinsVisible = false;
    togglePinsBtn.textContent = 'Afficher les pins';
    return;
  }

  map.addLayer(markerClusterGroup);
  pinsVisible = true;
  togglePinsBtn.textContent = 'Masquer les pins';
});

exportSessionBtn.addEventListener('click', () => {
  const session = {
    zones: zones.map((zone) => ({ id: zone.id, name: zone.name, color: zone.color, geoJSON: zone.geoJSON })),
    markers: markersData.map((person) => ({ lat: person.lat, lng: person.lng, name: person.name, addr: person.addr }))
  };

  downloadTextFile(JSON.stringify(session, null, 2), 'session.json', 'application/json');
});
