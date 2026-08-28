import { createEmptyTicket, createProgressEntry } from '../../entities/ticket/index.js';

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapCoordinate(coordinate) {
  if (!coordinate) return null;

  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    source: coordinate.source ?? 'manual',
    detectedFormat: coordinate.detectedFormat ?? null,
    verified: Boolean(coordinate.verified),
    verifiedAt: toDate(coordinate.verifiedAt),
    verifiedBy: coordinate.verifiedBy ?? null,
  };
}

function mapLatestProgress(latestProgress) {
  if (!latestProgress) return null;

  return {
    progressId: latestProgress.progressId ?? null,
    occurredAt: toDate(latestProgress.occurredAt),
    text: latestProgress.text ?? '',
  };
}

function mapImportProvenance(importProvenance) {
  if (!importProvenance) return null;
  return {
    sourceKind: importProvenance.sourceKind ?? null,
    dispatchTimeSource: importProvenance.dispatchTimeSource ?? null,
    messageSentAt: toDate(importProvenance.messageSentAt),
  };
}

export function mapTicketData(id, data = {}) {
  return createEmptyTicket({
    id,
    ...data,
    occurAt: toDate(data.occurAt),
    dispatchAt: toDate(data.dispatchAt),
    closedAt: toDate(data.closedAt),
    coordinate: mapCoordinate(data.coordinate),
    importProvenance: mapImportProvenance(data.importProvenance),
    latestProgress: mapLatestProgress(data.latestProgress),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    resolvedAt: toDate(data.resolvedAt),
    archivedAt: toDate(data.archivedAt),
  });
}

export function mapTicketSnapshot(snapshot) {
  return mapTicketData(snapshot.id, snapshot.data());
}

export function mapProgressData(id, data = {}) {
  return createProgressEntry({
    id,
    occurredAt: toDate(data.occurredAt),
    text: data.text ?? '',
    createdAt: toDate(data.createdAt),
    createdBy: data.createdBy ?? null,
    updatedAt: toDate(data.updatedAt),
    updatedBy: data.updatedBy ?? null,
  });
}

export function mapProgressSnapshot(snapshot) {
  return mapProgressData(snapshot.id, snapshot.data());
}

export function timestampMillis(value) {
  if (!value) return Number.NEGATIVE_INFINITY;
  if (typeof value.toMillis === 'function') return value.toMillis();
  return toDate(value)?.getTime() ?? Number.NEGATIVE_INFINITY;
}
