function toValidDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeMessageSentInstant(value) {
  const date = toValidDate(value);
  return date ? date.toISOString() : null;
}

export function formatInstantForTimeZone(value, timeZone = 'Asia/Jakarta') {
  const date = toValidDate(value);
  if (!date) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );

  if (!values.year || !values.month || !values.day || !values.hour || !values.minute) return null;
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}
