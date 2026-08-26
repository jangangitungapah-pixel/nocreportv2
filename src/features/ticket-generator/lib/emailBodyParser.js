import {
  normalizeExternalTtReference,
  normalizeOperationalText,
} from './operationalNormalization.js';
import { parseOperationalDateTime } from './smartReportParser.js';

const BODY_LABELS = Object.freeze({
  tt: 'primaryTt',
  'ioh tt': 'iohTt',
  'h3i tt': 'h3iTt',
  alarm: 'alarm',
  'alarm source': 'alarmSource',
  'ems alarm no': 'emsAlarmNo',
  'alarm location info': 'alarmLocationInfo',
  'site id': 'siteId',
  'site name': 'siteName',
  severity: 'severity',
  'occur time': 'occurAtRaw',
  'dispatch to': 'dispatchTo',
  region: 'region',
  description: 'description',
  'last link flapped': 'lastLinkFlapped',
  status: 'sourceStatus',
});

function normalizeLabel(value) {
  return normalizeOperationalText(value).toLowerCase().replace(/\s+/g, ' ');
}

export function parseOperationalEmailBody(value) {
  const rawText = String(value ?? '').replace(/\r\n?/g, '\n');
  const result = {
    primaryTt: null,
    iohTt: null,
    h3iTt: null,
    externalTtReferences: [],
    alarm: null,
    alarmSource: null,
    emsAlarmNo: null,
    alarmLocationInfo: null,
    siteId: null,
    siteName: null,
    severity: null,
    occurAtRaw: null,
    occurAt: null,
    dispatchTo: null,
    region: null,
    description: null,
    lastLinkFlapped: null,
    sourceStatus: null,
    detectedLabels: [],
  };

  for (const rawLine of rawText.split('\n')) {
    const match = rawLine.match(/^\s*([^:=]{1,48}?)\s*[:=]\s*(.*?)\s*$/);
    if (!match) continue;

    const label = normalizeLabel(match[1]);
    const key = BODY_LABELS[label];
    if (!key || result.detectedLabels.includes(label)) continue;

    const normalizedValue = normalizeOperationalText(match[2]);
    result[key] = normalizedValue || null;
    result.detectedLabels.push(label);
  }

  result.occurAt = result.occurAtRaw ? parseOperationalDateTime(result.occurAtRaw) : null;

  result.externalTtReferences = [result.primaryTt, result.iohTt, result.h3iTt]
    .map(normalizeExternalTtReference)
    .filter(Boolean)
    .filter((entry, index, values) => values.indexOf(entry) === index);

  result.primaryTt = normalizeExternalTtReference(result.primaryTt);
  result.iohTt = normalizeExternalTtReference(result.iohTt);
  result.h3iTt = normalizeExternalTtReference(result.h3iTt);

  return result;
}
