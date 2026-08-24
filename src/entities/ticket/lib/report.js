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
    return null;
  }

  const entries = impactList.map(reportValue).filter(Boolean);
  return entries.length > 0 ? `Impact List : ${entries.join(', ')}` : null;
}

export function formatTicketReport(ticket = {}) {
  const lines = [`Title : ${formatTitle(ticket.title)}`];
  const impactLine = formatImpactList(ticket.impactList);

  if (impactLine) {
    lines.push(impactLine);
  }

  lines.push(`Occur Time = ${formatDateTime(ticket.occurAt)}`);
  lines.push(`Dispatch Time = ${formatDateTime(ticket.dispatchAt)}`);
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
