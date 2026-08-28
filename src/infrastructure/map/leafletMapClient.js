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

function displayStatus(status) {
  const normalized = String(status ?? '').trim().toLowerCase();
  return normalized ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : 'Unknown';
}

function createPopupDetail(label, value, { mono = false, emphasis = false } = {}) {
  const row = document.createElement('div');
  row.className = 'noc-map-popup__detail';
  if (emphasis) row.dataset.emphasis = 'true';

  const key = document.createElement('span');
  key.className = 'noc-map-popup__detail-key';
  key.textContent = label;

  const content = document.createElement('span');
  content.className = 'noc-map-popup__detail-value';
  if (mono) content.classList.add('noc-map-popup__detail-value--mono');
  content.textContent = value || '—';

  row.append(key, content);
  return row;
}

function createPopupNode(marker, onOpenTicket) {
  const root = document.createElement('div');
  root.className = 'noc-map-popup';

  const header = document.createElement('header');
  header.className = 'noc-map-popup__header';

  const identity = document.createElement('div');
  identity.className = 'noc-map-popup__identity';

  const eyebrow = document.createElement('span');
  eyebrow.className = 'noc-map-popup__eyebrow';
  eyebrow.textContent = 'Mapped incident';

  const tt = document.createElement('strong');
  tt.className = 'noc-map-popup__tt';
  tt.textContent = marker.externalTtNumber || 'Ticket';

  identity.append(eyebrow, tt);

  const status = document.createElement('span');
  status.className = 'noc-map-popup__status';
  status.dataset.status = String(marker.status ?? '').trim().toLowerCase();
  status.textContent = displayStatus(marker.status);

  header.append(identity, status);

  const title = document.createElement('p');
  title.className = 'noc-map-popup__title';
  title.textContent = marker.title || 'Untitled ticket';

  const details = document.createElement('div');
  details.className = 'noc-map-popup__details';
  details.append(
    createPopupDetail('Cut Point', marker.cutPoint),
    createPopupDetail('Coordinate', marker.coordinateLabel, { mono: true, emphasis: true }),
    createPopupDetail('PIC', marker.pic),
    createPopupDetail('Latest update', marker.latestProgress),
  );

  const footer = document.createElement('div');
  footer.className = 'noc-map-popup__footer';

  const updated = document.createElement('span');
  updated.className = 'noc-map-popup__updated';
  updated.textContent = `Updated ${marker.updatedLabel || '—'}`;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'noc-map-popup-action';
  button.setAttribute('aria-label', `Open ${marker.externalTtNumber || marker.title || 'ticket'}`);

  const buttonLabel = document.createElement('span');
  buttonLabel.textContent = 'Open Ticket';
  const buttonArrow = document.createElement('span');
  buttonArrow.className = 'noc-map-popup-action__arrow';
  buttonArrow.setAttribute('aria-hidden', 'true');
  buttonArrow.textContent = '→';
  button.append(buttonLabel, buttonArrow);
  button.addEventListener('click', () => onOpenTicket?.(marker.ticketId));

  footer.append(updated, button);
  root.append(header, title, details, footer);

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
      marker.bindPopup(createPopupNode(markerData, onOpenTicket), {
        minWidth: 300,
        maxWidth: 360,
        className: 'noc-map-popup-shell',
      });
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
