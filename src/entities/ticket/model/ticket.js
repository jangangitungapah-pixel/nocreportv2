import { normalizeCoordinates } from '../lib/coordinates.js';
import { extractExternalTicketNumber } from '../lib/tt-number.js';
import { TICKET_STATUS, isTicketStatus } from '../lib/status.js';

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanImpactList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(cleanString).filter(Boolean);
}

function cleanCoordinate(value) {
  if (!value) {
    return null;
  }

  const normalized = normalizeCoordinates(value.latitude, value.longitude);
  if (!normalized) {
    return null;
  }

  return {
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    source: value.source === 'ocr' ? 'ocr' : 'manual',
    detectedFormat: value.detectedFormat ?? null,
    verified: Boolean(value.verified),
    verifiedAt: value.verifiedAt ?? null,
    verifiedBy: value.verifiedBy ?? null,
  };
}

export function createEmptyTicket(overrides = {}) {
  const title = cleanString(overrides.title);
  const coordinate = cleanCoordinate(overrides.coordinate);

  return {
    id: overrides.id ?? null,
    schemaVersion: 1,
    title,
    externalTtNumber:
      overrides.externalTtNumber ?? extractExternalTicketNumber(title) ?? null,
    impactList: cleanImpactList(overrides.impactList),
    occurAt: overrides.occurAt ?? null,
    dispatchAt: overrides.dispatchAt ?? null,
    pic: cleanString(overrides.pic),
    rootcause: cleanString(overrides.rootcause),
    cutPoint: cleanString(overrides.cutPoint),
    coordinate,
    hasCoordinates: Boolean(coordinate),
    status: isTicketStatus(overrides.status) ? overrides.status : TICKET_STATUS.DRAFT,
    latestProgress: overrides.latestProgress ?? null,
    progressCount: Number.isInteger(overrides.progressCount) ? overrides.progressCount : 0,
    progress: Array.isArray(overrides.progress) ? [...overrides.progress] : [],
    revision: Number.isInteger(overrides.revision) && overrides.revision >= 0 ? overrides.revision : 0,
    createdAt: overrides.createdAt ?? null,
    createdBy: overrides.createdBy ?? null,
    updatedAt: overrides.updatedAt ?? null,
    updatedBy: overrides.updatedBy ?? null,
    resolvedAt: overrides.resolvedAt ?? null,
    resolvedBy: overrides.resolvedBy ?? null,
    archivedAt: overrides.archivedAt ?? null,
    archivedBy: overrides.archivedBy ?? null,
  };
}

export function normalizeTicket(ticket = {}) {
  return createEmptyTicket(ticket);
}
