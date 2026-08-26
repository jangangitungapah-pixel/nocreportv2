export const TIME_INTELLIGENCE_REFRESH_MS = 60_000;

function validDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function nonNegativeDuration(later, earlier) {
  const end = validDate(later);
  const start = validDate(earlier);
  if (!end || !start) return null;
  return Math.max(0, end.getTime() - start.getTime());
}

function signedDuration(later, earlier) {
  const end = validDate(later);
  const start = validDate(earlier);
  if (!end || !start) return null;
  return end.getTime() - start.getTime();
}

function latestProgressAt(ticket) {
  const explicit = validDate(ticket?.latestProgress?.occurredAt);
  if (explicit) return explicit;

  const progress = Array.isArray(ticket?.progress) ? ticket.progress : [];
  return progress.reduce((latest, entry) => {
    const occurredAt = validDate(entry?.occurredAt);
    if (!occurredAt) return latest;
    if (!latest || occurredAt.getTime() > latest.getTime()) return occurredAt;
    return latest;
  }, null);
}

export function deriveTimeIntelligence(
  ticket,
  { now = new Date(), timezone = 'Asia/Jakarta' } = {},
) {
  const current = validDate(now) ?? new Date();
  const occurAt = validDate(ticket?.occurAt);
  const dispatchAt = validDate(ticket?.dispatchAt);
  const resolvedAt = validDate(ticket?.resolvedAt);
  const updatedAt = validDate(ticket?.updatedAt);
  const progressAt = latestProgressAt(ticket);

  return {
    timezone,
    calculatedAt: current,
    refreshAfterMs: TIME_INTELLIGENCE_REFRESH_MS,
    incidentElapsedMs: occurAt ? nonNegativeDuration(resolvedAt ?? current, occurAt) : null,
    dispatchDelayMs: occurAt && dispatchAt ? signedDuration(dispatchAt, occurAt) : null,
    latestProgressAgeMs: progressAt ? nonNegativeDuration(current, progressAt) : null,
    resolvedDurationMs: occurAt && resolvedAt ? nonNegativeDuration(resolvedAt, occurAt) : null,
    latestUpdateAgeMs: updatedAt ? nonNegativeDuration(current, updatedAt) : null,
    latestProgressAt: progressAt,
    occurAt,
    dispatchAt,
    resolvedAt,
    updatedAt,
  };
}

export function formatOperationalDuration(milliseconds) {
  if (!Number.isFinite(milliseconds)) return '—';

  const sign = milliseconds < 0 ? '-' : '';
  let remainingMinutes = Math.floor(Math.abs(milliseconds) / 60_000);
  const days = Math.floor(remainingMinutes / (24 * 60));
  remainingMinutes -= days * 24 * 60;
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return `${sign}${parts.join(' ')}`;
}
