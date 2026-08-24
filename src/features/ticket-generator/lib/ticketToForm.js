import { DEFAULT_TICKET_FORM } from './formToTicket.js';

function toLocalInputDateTime(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function ticketToFormValues(ticket) {
  return {
    ...DEFAULT_TICKET_FORM,
    title: ticket?.title ?? '',
    impactList: Array.isArray(ticket?.impactList)
      ? ticket.impactList.map((value) => ({ value }))
      : [],
    occurAt: toLocalInputDateTime(ticket?.occurAt),
    dispatchAt: toLocalInputDateTime(ticket?.dispatchAt),
    pic: ticket?.pic ?? '',
    rootcause: ticket?.rootcause ?? '',
    cutPoint: ticket?.cutPoint ?? '',
    latitude:
      ticket?.coordinate?.latitude === null || ticket?.coordinate?.latitude === undefined
        ? ''
        : String(ticket.coordinate.latitude),
    longitude:
      ticket?.coordinate?.longitude === null || ticket?.coordinate?.longitude === undefined
        ? ''
        : String(ticket.coordinate.longitude),
    coordinateSource: ticket?.coordinate?.source === 'ocr' ? 'ocr' : 'manual',
    coordinateDetectedFormat: ticket?.coordinate?.detectedFormat ?? 'DD',
    coordinateVerified: ticket?.coordinate ? Boolean(ticket.coordinate.verified) : true,
  };
}
