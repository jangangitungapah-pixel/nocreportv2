import { formatDateTime, formatProgressTime, sortProgressTimeline } from '../../../entities/ticket/index.js';
import { deriveTimeIntelligence, formatOperationalDuration } from './timeIntelligence.js';

const EMPTY_VALUE = '—';
const RECENT_PROGRESS_LIMIT = 3;

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function warningMessages(findings = []) {
  if (!Array.isArray(findings)) return [];
  return findings
    .filter((finding) => finding?.severity === 'warning')
    .map((finding) => cleanText(finding?.message))
    .filter(Boolean);
}

function recentProgress(ticket) {
  const entries = sortProgressTimeline(Array.isArray(ticket?.progress) ? ticket.progress : []);
  return entries
    .filter((entry) => cleanText(entry?.text))
    .slice(-RECENT_PROGRESS_LIMIT)
    .map((entry) => ({
      occurredAt: entry.occurredAt ?? null,
      text: cleanText(entry.text),
    }));
}

export function buildHandoverSummaryModel(
  ticket = {},
  {
    validationFindings = [],
    relatedTicketCount = 0,
    now = new Date(),
    timezone = 'Asia/Jakarta',
  } = {},
) {
  const time = deriveTimeIntelligence(ticket, { now, timezone });
  const progress = recentProgress(ticket);

  return {
    externalTtNumber: cleanText(ticket.externalTtNumber) || null,
    status: cleanText(ticket.status) || null,
    occurAt: ticket.occurAt ?? null,
    durationMs: time.incidentElapsedMs,
    pic: cleanText(ticket.pic) || null,
    rootcause: cleanText(ticket.rootcause) || null,
    cutPoint: cleanText(ticket.cutPoint) || null,
    latestProgress: progress.at(-1) ?? null,
    recentProgress: progress,
    warnings: warningMessages(validationFindings),
    relatedTicketCount: Math.max(0, Number(relatedTicketCount) || 0),
    timezone,
  };
}

export function formatHandoverSummary(model = {}) {
  const latestProgress = model.latestProgress
    ? `${formatProgressTime(model.latestProgress.occurredAt)} ${cleanText(model.latestProgress.text)}`.trim()
    : EMPTY_VALUE;

  const lines = [
    'Shift Handover',
    `TT: ${cleanText(model.externalTtNumber) || EMPTY_VALUE}`,
    `Status: ${cleanText(model.status) || EMPTY_VALUE}`,
    `Occur Time: ${formatDateTime(model.occurAt) || EMPTY_VALUE}`,
    `Duration: ${formatOperationalDuration(model.durationMs)}`,
    `PIC: ${cleanText(model.pic) || EMPTY_VALUE}`,
    `Rootcause: ${cleanText(model.rootcause) || EMPTY_VALUE}`,
    `Cut Point: ${cleanText(model.cutPoint) || EMPTY_VALUE}`,
    `Latest Progress: ${latestProgress}`,
    `Related Tickets: ${Math.max(0, Number(model.relatedTicketCount) || 0)}`,
  ];

  const recent = Array.isArray(model.recentProgress) ? model.recentProgress : [];
  if (recent.length) {
    lines.push('Recent Progress:');
    for (const entry of recent) {
      const time = formatProgressTime(entry.occurredAt);
      lines.push(`- ${time ? `${time} ` : ''}${cleanText(entry.text)}`.trimEnd());
    }
  }

  const warnings = Array.isArray(model.warnings) ? model.warnings.map(cleanText).filter(Boolean) : [];
  if (warnings.length) {
    lines.push('Warnings:');
    for (const warning of warnings) lines.push(`- ${warning}`);
  }

  return lines.join('\n');
}

export function buildAndFormatHandoverSummary(ticket, options) {
  return formatHandoverSummary(buildHandoverSummaryModel(ticket, options));
}
