import {
  formatCoordinatePair,
  formatProgressTime,
  formatTicketReport,
  sortProgressTimeline,
} from '../../../entities/ticket/index.js';
import { buildAndFormatHandoverSummary } from './handoverSummary.js';

export const COPY_TARGET_IDS = Object.freeze({
  FULL_REPORT: 'full_report',
  TITLE: 'title',
  IMPACT: 'impact',
  LATEST_PROGRESS: 'latest_progress',
  PROGRESS_TIMELINE: 'progress_timeline',
  COORDINATE: 'coordinate',
  PRIMARY_TT: 'primary_tt',
  HANDOVER: 'handover',
  OPERATIONAL_SOURCE: 'operational_source',
});

export const COPY_TARGETS = Object.freeze([
  Object.freeze({ id: COPY_TARGET_IDS.FULL_REPORT, label: 'Full Report' }),
  Object.freeze({ id: COPY_TARGET_IDS.TITLE, label: 'Title' }),
  Object.freeze({ id: COPY_TARGET_IDS.IMPACT, label: 'Impact' }),
  Object.freeze({ id: COPY_TARGET_IDS.LATEST_PROGRESS, label: 'Latest Progress' }),
  Object.freeze({ id: COPY_TARGET_IDS.PROGRESS_TIMELINE, label: 'Full Progress Timeline' }),
  Object.freeze({ id: COPY_TARGET_IDS.COORDINATE, label: 'Coordinate' }),
  Object.freeze({ id: COPY_TARGET_IDS.PRIMARY_TT, label: 'Primary TT' }),
  Object.freeze({ id: COPY_TARGET_IDS.HANDOVER, label: 'Handover Summary' }),
  Object.freeze({ id: COPY_TARGET_IDS.OPERATIONAL_SOURCE, label: 'Operational Source / Alarm' }),
]);

const COPY_TARGET_ID_SET = new Set(COPY_TARGETS.map((target) => target.id));

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function progressEntries(ticket) {
  const progress = Array.isArray(ticket?.progress) ? ticket.progress : [];
  const entries = sortProgressTimeline(progress).filter((entry) => cleanText(entry?.text));
  if (entries.length) return entries;
  return cleanText(ticket?.latestProgress?.text) ? [ticket.latestProgress] : [];
}

function formatProgressEntry(entry) {
  if (!entry || !cleanText(entry.text)) return '';
  const time = formatProgressTime(entry.occurredAt);
  return `${time ? `${time} ` : ''}${cleanText(entry.text)}`;
}

function formatImpact(ticket) {
  const entries = Array.isArray(ticket?.impactList)
    ? ticket.impactList.map(cleanText).filter(Boolean)
    : [];
  return entries.length ? `Impact List : ${entries.join(', ')}` : '';
}

function formatProgressTimeline(ticket) {
  return progressEntries(ticket).map(formatProgressEntry).filter(Boolean).join('\n');
}

function formatLatestProgress(ticket) {
  return formatProgressEntry(progressEntries(ticket).at(-1));
}

function formatCoordinate(ticket) {
  const coordinate = ticket?.coordinate;
  if (!coordinate) return '';
  return formatCoordinatePair(coordinate.latitude, coordinate.longitude) ?? '';
}

function formatOperationalSource(ticket) {
  const alarm = ticket?.alarmContext ?? {};
  const provenance = ticket?.importProvenance ?? {};
  const rows = [
    ['Source', provenance.sourceKind],
    ['Dispatch source', provenance.dispatchTimeSource],
    ['Alarm', alarm.rawAlarm],
    ['Alarm family', alarm.alarmFamily],
    ['Alarm source', alarm.alarmSource],
    ['EMS Alarm No', alarm.emsAlarmNo],
    ['Site ID', alarm.siteId],
    ['Site Name', alarm.siteName],
    ['Severity', alarm.severity],
    ['Dispatch To', alarm.dispatchTo],
    ['Region', alarm.region],
    ['Transport', alarm.transportFamily],
    ['Path', Array.isArray(alarm.pathEndpoints) ? alarm.pathEndpoints.join(' <> ') : ''],
  ];

  return rows
    .map(([label, value]) => [label, cleanText(value)])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');
}

export function isCopyTargetId(value) {
  return COPY_TARGET_ID_SET.has(value);
}

export function formatCopyTarget(
  targetId,
  ticket = {},
  { validationFindings = [], relatedTicketCount = 0, now = new Date(), timezone = 'Asia/Jakarta' } = {},
) {
  switch (targetId) {
    case COPY_TARGET_IDS.FULL_REPORT:
      return formatTicketReport(ticket);
    case COPY_TARGET_IDS.TITLE:
      return cleanText(ticket.title);
    case COPY_TARGET_IDS.IMPACT:
      return formatImpact(ticket);
    case COPY_TARGET_IDS.LATEST_PROGRESS:
      return formatLatestProgress(ticket);
    case COPY_TARGET_IDS.PROGRESS_TIMELINE:
      return formatProgressTimeline(ticket);
    case COPY_TARGET_IDS.COORDINATE:
      return formatCoordinate(ticket);
    case COPY_TARGET_IDS.PRIMARY_TT:
      return cleanText(ticket.externalTtNumber);
    case COPY_TARGET_IDS.HANDOVER:
      return buildAndFormatHandoverSummary(ticket, {
        validationFindings,
        relatedTicketCount,
        now,
        timezone,
      });
    case COPY_TARGET_IDS.OPERATIONAL_SOURCE:
      return formatOperationalSource(ticket);
    default:
      return '';
  }
}

export function buildCopyCenterTargets(ticket, options) {
  return COPY_TARGETS.map((target) => {
    const text = formatCopyTarget(target.id, ticket, options);
    return { ...target, text, available: Boolean(text) };
  });
}
