import { normalizeCoordinates } from '../lib/coordinates.js';
import { extractExternalTicketNumber } from '../lib/tt-number.js';
import { TICKET_STATUS, isTicketStatus } from '../lib/status.js';

export const TICKET_TITLE_MODE = Object.freeze({
  GENERATED: 'GENERATED',
  MANUAL: 'MANUAL',
});

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanNullableString(value) {
  const normalized = cleanString(value);
  return normalized || null;
}

function cleanStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean);
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

function cleanAlarmContext(value = {}) {
  return {
    rawAlarm: cleanString(value.rawAlarm),
    alarmFamily: cleanNullableString(value.alarmFamily),
    alarmSource: cleanString(value.alarmSource),
    emsAlarmNo: cleanString(value.emsAlarmNo),
    siteId: cleanString(value.siteId),
    siteName: cleanString(value.siteName),
    severity: cleanString(value.severity),
    sourceStatus: cleanString(value.sourceStatus),
    dispatchTo: cleanString(value.dispatchTo),
    region: cleanString(value.region),
    description: cleanString(value.description),
    lastLinkFlapped: cleanString(value.lastLinkFlapped),
    transportFamily: cleanString(value.transportFamily),
    pathEndpoints: cleanStringList(value.pathEndpoints),
    externalTtReferences: cleanStringList(value.externalTtReferences),
  };
}

function cleanImportProvenance(value) {
  if (!value || typeof value !== 'object') return null;

  const sourceKind = cleanNullableString(value.sourceKind);
  const dispatchTimeSource = cleanNullableString(value.dispatchTimeSource);
  const messageSentAt = value.messageSentAt ?? null;
  if (!sourceKind && !dispatchTimeSource && !messageSentAt) return null;

  return {
    sourceKind,
    dispatchTimeSource,
    messageSentAt,
  };
}

function normalizeSchemaVersion(overrides) {
  if (!Object.prototype.hasOwnProperty.call(overrides, 'schemaVersion')) return 2;
  return Number(overrides.schemaVersion) === 2 ? 2 : 1;
}

function normalizeTitleMode(value) {
  return value === TICKET_TITLE_MODE.GENERATED
    ? TICKET_TITLE_MODE.GENERATED
    : TICKET_TITLE_MODE.MANUAL;
}

export function createEmptyTicket(overrides = {}) {
  const title = cleanString(overrides.title);
  const coordinate = cleanCoordinate(overrides.coordinate);

  return {
    id: overrides.id ?? null,
    schemaVersion: normalizeSchemaVersion(overrides),
    title,
    titleMode: normalizeTitleMode(overrides.titleMode),
    externalTtNumber: overrides.externalTtNumber ?? extractExternalTicketNumber(title) ?? null,
    templateProfileId: cleanNullableString(overrides.templateProfileId),
    incidentKey: cleanNullableString(overrides.incidentKey),
    pathKey: cleanNullableString(overrides.pathKey),
    alarmContext: cleanAlarmContext(overrides.alarmContext),
    importProvenance: cleanImportProvenance(overrides.importProvenance),
    incidentGroupId: cleanNullableString(overrides.incidentGroupId),
    impactList: cleanImpactList(overrides.impactList),
    occurAt: overrides.occurAt ?? null,
    dispatchAt: overrides.dispatchAt ?? null,
    closedAt: overrides.closedAt ?? null,
    pic: cleanString(overrides.pic),
    rootcause: cleanString(overrides.rootcause),
    cutPoint: cleanString(overrides.cutPoint),
    coordinate,
    hasCoordinates: Boolean(coordinate),
    status: isTicketStatus(overrides.status) ? overrides.status : TICKET_STATUS.DRAFT,
    latestProgress: overrides.latestProgress ?? null,
    progressCount: Number.isInteger(overrides.progressCount) ? overrides.progressCount : 0,
    progress: Array.isArray(overrides.progress) ? [...overrides.progress] : [],
    revision:
      Number.isInteger(overrides.revision) && overrides.revision >= 0 ? overrides.revision : 0,
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
