import { createEmptyTicket, normalizeCoordinates } from '../../../entities/ticket/index.js';

export const DEFAULT_TICKET_FORM = Object.freeze({
  title: '',
  impactList: [],
  occurAt: '',
  dispatchAt: '',
  pic: '',
  rootcause: '',
  cutPoint: '',
  latitude: '',
  longitude: '',
});

function toDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeImpactList(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => entry?.value?.trim() ?? '').filter(Boolean);
}

function coordinateFromForm(latitude, longitude) {
  const lat = String(latitude ?? '').trim();
  const lng = String(longitude ?? '').trim();
  if (!lat || !lng) return null;

  const normalized = normalizeCoordinates(lat, lng);
  if (!normalized) return null;

  return {
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    source: 'manual',
    detectedFormat: 'DD',
    verified: true,
    verifiedAt: null,
    verifiedBy: null,
  };
}

export function buildTicketFromForm(values, { status, progress = [], revision = 0 } = {}) {
  return createEmptyTicket({
    title: values?.title ?? '',
    impactList: normalizeImpactList(values?.impactList),
    occurAt: toDateTime(values?.occurAt),
    dispatchAt: toDateTime(values?.dispatchAt),
    pic: values?.pic ?? '',
    rootcause: values?.rootcause ?? '',
    cutPoint: values?.cutPoint ?? '',
    coordinate: coordinateFromForm(values?.latitude, values?.longitude),
    status,
    progress,
    progressCount: progress.length,
    revision,
  });
}
