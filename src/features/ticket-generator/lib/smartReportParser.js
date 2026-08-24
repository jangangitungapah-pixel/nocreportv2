const FIELD_DEFINITIONS = [
  {
    key: 'occurAt',
    pattern: /^(?:alarm\s+down\s+time|occur\s+time)\s*[:=]\s*(.*)$/i,
  },
  {
    key: 'dispatchAt',
    pattern: /^(?:dispatch|dispacth)\s+time\s*[:=]\s*(.*)$/i,
  },
  { key: 'pic', pattern: /^pic\s*[:=]\s*(.*)$/i },
  { key: 'rootcause', pattern: /^root\s*cause\s*[:=]\s*(.*)$/i },
  { key: 'cutPoint', pattern: /^cut\s*point\s*[:=]\s*(.*)$/i },
];

const IMPACT_HEADER = /^impact(?:\s+list)?\s*:?[\s]*$/i;
const PROGRESS_HEADER = /^(?:update\s+progress|progress\s+update)\s*:?[\s]*$/i;
const TITLE_FIELD = /^title\s*:\s*(.*)$/i;
const EXAMPLE_MARKER = /^contoh\s+\d+\s*$/i;
const SEPARATOR = /^[=_-]{12,}$/;
const PROGRESS_LINE = /^(\d{1,2}):(\d{2})\s+(.+)$/;

function normalizeLine(line) {
  return String(line ?? '')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function stripOuterEmphasis(value) {
  const normalized = normalizeLine(value);
  if (normalized.length >= 2 && normalized.startsWith('*') && normalized.endsWith('*')) {
    return normalized.slice(1, -1).trim();
  }
  return normalized;
}

function cleanImpactLine(line) {
  return normalizeLine(line)
    .replace(/^\d+\s*[.)-]\s*/, '')
    .replace(/^[•-]\s*/, '')
    .trim();
}

function toInputValue(year, month, day, hour, minute) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

export function parseOperationalDateTime(value) {
  const normalized = normalizeLine(value);
  if (!normalized) return null;

  let match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})$/);
  if (match) {
    const [, year, month, day, hour, minute] = match.map(Number);
    const candidate = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (
      candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day &&
      candidate.getHours() === hour &&
      candidate.getMinutes() === minute
    ) {
      return toInputValue(year, month, day, hour, minute);
    }
    return null;
  }

  match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const [, day, month, year, hour, minute] = match.map(Number);
  const candidate = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day ||
    candidate.getHours() !== hour ||
    candidate.getMinutes() !== minute
  ) {
    return null;
  }

  return toInputValue(year, month, day, hour, minute);
}

function matchField(line) {
  for (const definition of FIELD_DEFINITIONS) {
    const match = line.match(definition.pattern);
    if (match) return { key: definition.key, rawValue: match[1] ?? '' };
  }
  return null;
}

function isStructuralLine(line) {
  return (
    !line ||
    SEPARATOR.test(line) ||
    EXAMPLE_MARKER.test(line) ||
    IMPACT_HEADER.test(line) ||
    PROGRESS_HEADER.test(line) ||
    TITLE_FIELD.test(line) ||
    Boolean(matchField(line))
  );
}

function dateParts(inputValue) {
  const match = String(inputValue ?? '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  return match.slice(1).map(Number);
}

function inferProgressDateTimes(progressRows, occurAt) {
  if (!progressRows.length) return [];

  const baseParts = dateParts(occurAt);
  const baseDate = baseParts
    ? new Date(baseParts[0], baseParts[1] - 1, baseParts[2], 0, 0, 0, 0)
    : new Date();
  const occurDate = baseParts
    ? new Date(baseParts[0], baseParts[1] - 1, baseParts[2], baseParts[3], baseParts[4], 0, 0)
    : null;

  let dayOffset = 0;
  let previous = occurDate;

  return progressRows.map((row, index) => {
    let candidate = new Date(baseDate);
    candidate.setDate(candidate.getDate() + dayOffset);
    candidate.setHours(row.hour, row.minute, 0, 0);

    if (previous && candidate.getTime() < previous.getTime()) {
      dayOffset += 1;
      candidate = new Date(baseDate);
      candidate.setDate(candidate.getDate() + dayOffset);
      candidate.setHours(row.hour, row.minute, 0, 0);
    }

    previous = candidate;
    const occurredAt = toInputValue(
      candidate.getFullYear(),
      candidate.getMonth() + 1,
      candidate.getDate(),
      candidate.getHours(),
      candidate.getMinutes(),
    );

    return {
      occurredAt,
      text: row.text,
      sourceLine: row.sourceLine,
      sequence: index,
    };
  });
}

function buildWarnings({
  values,
  detectedFields,
  progressHeaderDetected,
  progressRows,
  multipleReports,
}) {
  const warnings = [];

  if (!detectedFields.includes('title')) warnings.push('Title was not detected.');
  if (!detectedFields.includes('occurAt')) warnings.push('Occur Time was not detected.');
  if (detectedFields.includes('occurAt') && !values.occurAt) {
    warnings.push('Occur Time was found but its date format was not recognized.');
  }
  if (detectedFields.includes('dispatchAt') && !values.dispatchAt) {
    warnings.push('Dispatch Time was found but its date format was not recognized.');
  }
  if (progressHeaderDetected && progressRows.length === 0) {
    warnings.push('Update Progress was found but no HH:mm progress rows were detected.');
  }
  if (multipleReports) {
    warnings.push(
      'Multiple report/example markers were detected. Paste one report at a time for best results.',
    );
  }

  return warnings;
}

export function parseSmartReport(input) {
  const rawText = String(input ?? '').replace(/\r\n?/g, '\n');
  const lines = rawText.split('\n').map(normalizeLine);
  const values = {
    title: '',
    impactList: [],
    occurAt: '',
    dispatchAt: '',
    pic: '',
    rootcause: '',
    cutPoint: '',
  };
  const detectedFields = [];
  const impactRows = [];
  const progressRows = [];
  let mode = 'default';
  let progressHeaderDetected = false;
  let exampleMarkers = 0;

  const rememberField = (key) => {
    if (!detectedFields.includes(key)) detectedFields.push(key);
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line || SEPARATOR.test(line)) continue;

    if (EXAMPLE_MARKER.test(line)) {
      exampleMarkers += 1;
      mode = 'default';
      continue;
    }

    const titleMatch = line.match(TITLE_FIELD);
    if (titleMatch) {
      values.title = stripOuterEmphasis(titleMatch[1]);
      rememberField('title');
      mode = 'default';
      continue;
    }

    if (IMPACT_HEADER.test(line)) {
      rememberField('impactList');
      mode = 'impact';
      continue;
    }

    if (PROGRESS_HEADER.test(line)) {
      rememberField('progress');
      progressHeaderDetected = true;
      mode = 'progress';
      continue;
    }

    const field = matchField(line);
    if (field) {
      rememberField(field.key);
      mode = 'default';
      if (field.key === 'occurAt' || field.key === 'dispatchAt') {
        values[field.key] = parseOperationalDateTime(field.rawValue) ?? '';
      } else {
        values[field.key] = normalizeLine(field.rawValue);
      }
      continue;
    }

    if (mode === 'impact') {
      const impact = cleanImpactLine(line);
      if (impact) impactRows.push(impact);
      continue;
    }

    if (mode === 'progress') {
      const progressMatch = line.match(PROGRESS_LINE);
      if (progressMatch) {
        const hour = Number(progressMatch[1]);
        const minute = Number(progressMatch[2]);
        if (hour <= 23 && minute <= 59) {
          progressRows.push({
            hour,
            minute,
            text: normalizeLine(progressMatch[3]),
            sourceLine: index + 1,
          });
          continue;
        }
      }

      if (progressRows.length > 0) {
        progressRows.at(-1).text = `${progressRows.at(-1).text} ${line}`.trim();
      }
      continue;
    }

    if (!values.title && !isStructuralLine(line)) {
      values.title = stripOuterEmphasis(line);
      rememberField('title');
    }
  }

  values.impactList = impactRows.map((value) => ({ value }));
  const progress = inferProgressDateTimes(progressRows, values.occurAt);
  const warnings = buildWarnings({
    values,
    detectedFields,
    progressHeaderDetected,
    progressRows,
    multipleReports: exampleMarkers > 1,
  });

  return {
    values,
    progress,
    detectedFields,
    warnings,
    stats: {
      fieldCount: detectedFields.filter((key) => key !== 'progress').length,
      impactCount: impactRows.length,
      progressCount: progress.length,
    },
    canApply: Boolean(values.title || detectedFields.length > 0 || progress.length > 0),
  };
}
