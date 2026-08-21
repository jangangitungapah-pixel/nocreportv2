function toDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function epoch(value) {
  return toDate(value)?.getTime() ?? Number.POSITIVE_INFINITY;
}

function compareStrings(left, right) {
  return String(left ?? '').localeCompare(String(right ?? ''));
}

export function sortProgressTimeline(progressEntries = []) {
  return progressEntries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const occurredDelta = epoch(left.entry.occurredAt) - epoch(right.entry.occurredAt);
      if (occurredDelta !== 0) {
        return occurredDelta;
      }

      const createdDelta = epoch(left.entry.createdAt) - epoch(right.entry.createdAt);
      if (createdDelta !== 0) {
        return createdDelta;
      }

      const idDelta = compareStrings(left.entry.id, right.entry.id);
      if (idDelta !== 0) {
        return idDelta;
      }

      return left.index - right.index;
    })
    .map(({ entry }) => entry);
}

function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function formatProgressTime(value) {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function createProgressEntry({ id, occurredAt, text, createdAt = null, createdBy = null }) {
  return {
    id: id ?? null,
    occurredAt: occurredAt ?? null,
    text: typeof text === 'string' ? text.trim() : '',
    createdAt,
    createdBy,
  };
}
