import { formatDateTime, formatProgressTime, sortProgressTimeline } from './timeline.js';

function reportValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatTitle(title) {
  const value = reportValue(title);
  if (value.startsWith('*') && value.endsWith('*')) {
    return value;
  }

  return `*${value}*`;
}

function formatImpactList(impactList) {
  if (!Array.isArray(impactList)) {
    return [];
  }

  const entries = impactList.map(reportValue).filter(Boolean);
  if (entries.length === 0) {
    return [];
  }

  return ['Impact List :', ...entries.map((entry, index) => `${index + 1}. ${entry}`)];
}

export function formatTicketReport(ticket = {}) {
  const lines = [formatTitle(ticket.title)];
  const impactLines = formatImpactList(ticket.impactList);

  if (impactLines.length > 0) {
    lines.push(...impactLines);
  }

  lines.push(`Occur Time = ${formatDateTime(ticket.occurAt)}`);
  lines.push(`Dispatch Time = ${formatDateTime(ticket.dispatchAt)}`);
  if (ticket.closedAt) {
    lines.push(`Closed Time = ${formatDateTime(ticket.closedAt)}`);
  }
  lines.push(`PIC = ${reportValue(ticket.pic)}`);
  lines.push(`Rootcause = ${reportValue(ticket.rootcause)}`);
  lines.push(`Cut Point = ${reportValue(ticket.cutPoint)}`);
  lines.push('', 'Update Progress :');

  const progress = sortProgressTimeline(ticket.progress ?? []);
  for (const entry of progress) {
    const text = reportValue(entry.text);
    if (!text) {
      continue;
    }

    const time = formatProgressTime(entry.occurredAt);
    lines.push(time ? `${time} ${text}` : text);
  }

  return lines.join('\n');
}
