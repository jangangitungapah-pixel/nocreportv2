const MAX_TEXT_LENGTH = 1000;
const MAX_ARRAY_ITEMS = 100;

const SIMPLE_FIELDS = Object.freeze([
  'title',
  'titleMode',
  'externalTtNumber',
  'templateProfileId',
  'incidentKey',
  'pathKey',
  'impactList',
  'occurAt',
  'dispatchAt',
  'pic',
  'rootcause',
  'cutPoint',
]);

const SAFE_ALARM_FIELDS = Object.freeze([
  'alarmFamily',
  'alarmSource',
  'emsAlarmNo',
  'siteId',
  'siteName',
  'severity',
  'sourceStatus',
  'dispatchTo',
  'region',
  'lastLinkFlapped',
  'transportFamily',
  'pathEndpoints',
  'externalTtReferences',
]);

function normalizedDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function compactValue(value) {
  if (value == null) return null;
  if (value instanceof Date) return normalizedDate(value);
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => compactValue(item));
  }
  if (typeof value === 'string') return value.slice(0, MAX_TEXT_LENGTH);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value).slice(0, MAX_TEXT_LENGTH);
}

function comparable(value) {
  return JSON.stringify(compactValue(value));
}

function addChange(changes, field, previousValue, nextValue) {
  const from = compactValue(previousValue);
  const to = compactValue(nextValue);
  if (comparable(from) === comparable(to)) return;
  changes[field] = { from, to };
}

export function buildOperationalRevisionDiff(previousTicket = {}, nextTicket = {}) {
  const changes = {};

  for (const field of SIMPLE_FIELDS) {
    const previousValue = field === 'occurAt' || field === 'dispatchAt'
      ? normalizedDate(previousTicket?.[field])
      : previousTicket?.[field];
    const nextValue = field === 'occurAt' || field === 'dispatchAt'
      ? normalizedDate(nextTicket?.[field])
      : nextTicket?.[field];
    addChange(changes, field, previousValue, nextValue);
  }

  for (const field of SAFE_ALARM_FIELDS) {
    addChange(
      changes,
      `alarmContext.${field}`,
      previousTicket?.alarmContext?.[field],
      nextTicket?.alarmContext?.[field],
    );
  }

  return changes;
}

export function buildTicketUpdatedAuditDetails({
  previousTicket,
  nextTicket,
  revisionFrom,
  revisionTo,
} = {}) {
  return {
    revisionFrom: Number(revisionFrom),
    revisionTo: Number(revisionTo),
    details: {
      changes: buildOperationalRevisionDiff(previousTicket, nextTicket),
    },
  };
}

export { SAFE_ALARM_FIELDS as REVISION_DIFF_ALARM_FIELDS, SIMPLE_FIELDS as REVISION_DIFF_FIELDS };
