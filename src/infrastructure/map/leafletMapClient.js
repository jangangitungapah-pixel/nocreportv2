const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION = '© OpenStreetMap contributors';
const INDONESIA_CENTER = [-2.5, 118];
const INDONESIA_ZOOM = 5;

export const MAP_MARKER_TOUCH_SIZE = 44;

export function readMapConfig(env = import.meta.env) {
  return {
    tileUrl: String(env?.VITE_MAP_TILE_URL ?? '').trim() || DEFAULT_TILE_URL,
    attribution: String(env?.VITE_MAP_ATTRIBUTION ?? '').trim() || DEFAULT_ATTRIBUTION,
  };
}

function textLine(label, value) {
  const line = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = `${label}: `;
  line.append(strong, document.createTextNode(value || '—'));
  return line;
}

function createPopupNode(marker, onOpenTicket) {
  const root = document.createElement('div');
  root.className = 'noc-map-popup';

  const title = document.createElement('strong');
  title.textContent = marker.externalTtNumber || marker.title;
  root.append(title);

  if (marker.externalTtNumber) {
    const subtitle = document.createElement('p');
    subtitle.textContent = marker.title;
    root.append(subtitle);
  }

  root.append(
    textLine('Status', marker.status),
    textLine('Cut Point', marker.cutPoint),
    textLine('Coordinate', marker.coordinateLabel),
    textLine('PIC', marker.pic),
    textLine('Latest update', marker.latestProgress),
    textLine('Updated', marker.updatedLabel),
  );

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Open Ticket';
  button.className = 'noc-map-popup-action';
  button.addEventListener('click', () => onOpenTicket?.(marker.ticketId));
  root.append(button);

  return root;
}

function createMarkerIcon(L) {
  return L.divIcon({
    className: 'noc-map-marker-icon',
    html: '<span class="noc-map-marker-hit" aria-hidden="true"><span class="noc-map-marker-dot"></span></span>',
    iconSize: [MAP_MARKER_TOUCH_SIZE, MAP_MARKER_TOUCH_SIZE],
    iconAnchor: [MAP_MARKER_TOUCH_SIZE / 2, MAP_MARKER_TOUCH_SIZE / 2],
    popupAnchor: [0, -18],
  });
}

export async function createLeafletMap({
  container,
  config = readMapConfig(),
  onOpenTicket,
  onTileError,
} = {}) {
  if (!container) throw new Error('Leaflet map container is required.');

  const [leafletModule] = await Promise.all([
    import('leaflet'),
    import('leaflet/dist/leaflet.css'),
    import('./leafletMap.css'),
  ]);
  const L = leafletModule.default ?? leafletModule;
  const map = L.map(container, { zoomControl: true }).setView(INDONESIA_CENTER, INDONESIA_ZOOM);
  const markerLayer = L.layerGroup().addTo(map);
  const markerReferences = new Map();
  const markerIcon = createMarkerIcon(L);

  const tileLayer = L.tileLayer(config.tileUrl, {
    attribution: config.attribution,
    maxZoom: 19,
  });
  tileLayer.on('tileerror', () => onTileError?.());
  tileLayer.addTo(map);

  function setMarkers(markers = []) {
    markerLayer.clearLayers();
    markerReferences.clear();

    const coordinates = [];
    for (const markerData of markers) {
      const markerLabel = markerData.externalTtNumber || markerData.title || 'Cut Point';
      const marker = L.marker([markerData.latitude, markerData.longitude], {
        icon: markerIcon,
        keyboard: true,
        title: markerLabel,
        alt: `Cut Point ${markerLabel}`,
      });
      marker.bindPopup(createPopupNode(markerData, onOpenTicket), { maxWidth: 320 });
      marker.addTo(markerLayer);
      markerReferences.set(markerData.ticketId, marker);
      coordinates.push([markerData.latitude, markerData.longitude]);
    }

    if (coordinates.length === 0) {
      map.setView(INDONESIA_CENTER, INDONESIA_ZOOM);
    } else if (coordinates.length === 1) {
      map.setView(coordinates[0], 13);
    } else {
      map.fitBounds(coordinates, { padding: [36, 36], maxZoom: 13 });
    }
  }

  function focusMarker(ticketId) {
    const marker = markerReferences.get(ticketId);
    if (!marker) return false;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 13), { duration: 0.35 });
    marker.openPopup();
    return true;
  }

  window.setTimeout(() => map.invalidateSize(), 0);

  return {
    setMarkers,
    focusMarker,
    invalidateSize() {
      map.invalidateSize();
    },
    destroy() {
      map.remove();
      markerReferences.clear();
    },
  };
}
