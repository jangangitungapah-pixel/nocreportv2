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
  coordinateSource: 'manual',
  coordinateDetectedFormat: 'DD',
  coordinateVerified: true,
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

function coordinateFromForm(values) {
  const lat = String(values?.latitude ?? '').trim();
  const lng = String(values?.longitude ?? '').trim();
  if (!lat || !lng) return null;

  const normalized = normalizeCoordinates(lat, lng);
  if (!normalized) return null;

  return {
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    source: values?.coordinateSource === 'ocr' ? 'ocr' : 'manual',
    detectedFormat: values?.coordinateDetectedFormat ?? 'DD',
    verified: values?.coordinateVerified !== false,
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
    coordinate: coordinateFromForm(values),
    status,
    progress,
    progressCount: progress.length,
    revision,
  });
}
