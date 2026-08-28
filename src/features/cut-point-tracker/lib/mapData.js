import { formatCoordinatePair, formatDateTime } from '../../../entities/ticket/index.js';

function coordinateNumber(value) {
  if (value === null || value === undefined) return Number.NaN;
  if (typeof value === 'string' && !value.trim()) return Number.NaN;
  return Number(value);
}

export function isValidMapCoordinate(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function buildCutPointMarkers(tickets = []) {
  if (!Array.isArray(tickets)) return [];

  return tickets.flatMap((ticket) => {
    const latitude = coordinateNumber(ticket?.coordinate?.latitude);
    const longitude = coordinateNumber(ticket?.coordinate?.longitude);

    if (
      !ticket?.id ||
      !ticket.hasCoordinates ||
      ticket.coordinate?.verified !== true ||
      !isValidMapCoordinate(latitude, longitude)
    ) {
      return [];
    }

    return [
      {
        id: ticket.id,
        ticketId: ticket.id,
        latitude,
        longitude,
        coordinateLabel: formatCoordinatePair(latitude, longitude),
        externalTtNumber: ticket.externalTtNumber ?? null,
        title: ticket.title || 'Untitled ticket',
        status: ticket.status,
        cutPoint: ticket.cutPoint || '',
        pic: ticket.pic || '',
        latestProgress: ticket.latestProgress?.text || '',
        updatedLabel: formatDateTime(ticket.updatedAt) || '—',
      },
    ];
  });
}

export function filterCutPointMarkers(markers, { search = '', status = 'ALL' } = {}) {
  const normalizedSearch = String(search).trim().toLocaleLowerCase();

  return markers.filter((marker) => {
    if (status !== 'ALL' && marker.status !== status) return false;
    if (!normalizedSearch) return true;

    return [
      marker.externalTtNumber,
      marker.title,
      marker.pic,
      marker.cutPoint,
      marker.latestProgress,
    ]
      .filter(Boolean)
      .join('\n')
      .toLocaleLowerCase()
      .includes(normalizedSearch);
  });
}
