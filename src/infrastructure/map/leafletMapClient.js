const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION = '© OpenStreetMap contributors';
const INDONESIA_CENTER = [-2.5, 118];
const INDONESIA_ZOOM = 5;
const MARKER_FOCUS_ZOOM = 13;

export const MAP_MARKER_TOUCH_SIZE = 44;

export function readMapConfig(env = import.meta.env) {
  return {
    tileUrl: String(env?.VITE_MAP_TILE_URL ?? '').trim() || DEFAULT_TILE_URL,
    attribution: String(env?.VITE_MAP_ATTRIBUTION ?? '').trim() || DEFAULT_ATTRIBUTION,
  };
}

export function isValidLeafletCoordinate(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function safeFocusZoom(zoom) {
  const numericZoom = Number(zoom);
  return Number.isFinite(numericZoom) ? Math.max(numericZoom, MARKER_FOCUS_ZOOM) : MARKER_FOCUS_ZOOM;
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
      const latitude = Number(markerData?.latitude);
      const longitude = Number(markerData?.longitude);
      if (!markerData?.ticketId || !isValidLeafletCoordinate(latitude, longitude)) continue;

      const markerLabel = markerData.externalTtNumber || markerData.title || 'Cut Point';
      const marker = L.marker([latitude, longitude], {
        icon: markerIcon,
        keyboard: true,
        title: markerLabel,
        alt: `Cut Point ${markerLabel}`,
      });
      marker.bindPopup(createPopupNode(markerData, onOpenTicket), { maxWidth: 320 });
      marker.addTo(markerLayer);
      markerReferences.set(markerData.ticketId, marker);
      coordinates.push([latitude, longitude]);
    }

    if (coordinates.length === 0) {
      map.setView(INDONESIA_CENTER, INDONESIA_ZOOM);
    } else if (coordinates.length === 1) {
      map.setView(coordinates[0], MARKER_FOCUS_ZOOM);
    } else {
      map.fitBounds(coordinates, { padding: [36, 36], maxZoom: MARKER_FOCUS_ZOOM });
    }
  }

  function focusMarker(ticketId) {
    const marker = markerReferences.get(ticketId);
    if (!marker) return false;

    const latLng = marker.getLatLng();
    if (!isValidLeafletCoordinate(Number(latLng?.lat), Number(latLng?.lng))) return false;

    /*
     * ResizableWorkspace can briefly leave Leaflet with a stale/zero cached viewport
     * while its panels settle. Leaflet flyTo() performs animated projection math from
     * that viewport and can turn it into NaN coordinates. Refresh the size and use a
     * deterministic non-animated focus instead. The visible result is the same for the
     * operator, while avoiding the invalid LatLng animation loop.
     */
    map.stop();
    map.invalidateSize({ pan: false, debounceMoveend: true });
    map.setView(latLng, safeFocusZoom(map.getZoom()), { animate: false });
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
