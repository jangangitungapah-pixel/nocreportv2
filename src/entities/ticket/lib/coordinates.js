const DEGREE = '[°º]';
const MINUTE = "['’′]";
const SECOND = '[\"”″]';

const DMS_HEMISPHERE_PATTERN = new RegExp(
  `([+-]?\\d{1,3})\\s*${DEGREE}\\s*(\\d{1,2})\\s*${MINUTE}\\s*` +
    `(\\d{1,2}(?:\\.\\d+)?)\\s*${SECOND}?\\s*([NSEW])`,
  'gi',
);

const DDM_HEMISPHERE_PATTERN = new RegExp(
  `([+-]?\\d{1,3})\\s*${DEGREE}\\s*(\\d{1,2}(?:\\.\\d+)?)\\s*${MINUTE}\\s*([NSEW])`,
  'gi',
);

const DECIMAL_HEMISPHERE_PATTERN =
  /([+-]?\d{1,3}(?:\.\d+)?)\s*([NS])\s*[,;]?\s*([+-]?\d{1,3}(?:\.\d+)?)\s*([EW])/i;
const LAT_LABEL_PATTERN =
  /\b(?:lat|latitude)\b\s*[:=]?\s*([+-]?\d{1,3}(?:\.\d+)?)/i;
const LON_LABEL_PATTERN =
  /\b(?:lon|long|longitude|lng)\b\s*[:=]?\s*([+-]?\d{1,3}(?:\.\d+)?)/i;
const DECIMAL_PAIR_PATTERN =
  /([+-]?\d{1,3}(?:\.\d+)?)\s*[,;]\s*([+-]?\d{1,3}(?:\.\d+)?)/;
const DECIMAL_SPACE_PAIR_PATTERN =
  /([+-]?\d{1,3}\.\d+)\s+([+-]?\d{1,3}\.\d+)/;

function normalizeWatermarkText(value) {
  return String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/[−–—]/g, '-')
    .replace(/(\d),(\d)/g, '$1.$2');
}

function hemisphereSign(hemisphere) {
  return ['S', 'W'].includes(String(hemisphere).toUpperCase()) ? -1 : 1;
}

function coordinateAxis(hemisphere) {
  const normalized = String(hemisphere).toUpperCase();

  if (['N', 'S'].includes(normalized)) {
    return 'latitude';
  }

  if (['E', 'W'].includes(normalized)) {
    return 'longitude';
  }

  return null;
}

function cleanPrecision(value) {
  return Number(Number(value).toFixed(12));
}

function convertDms(degrees, minutes, seconds, hemisphere) {
  const degreeValue = Number(degrees);
  const minuteValue = Number(minutes);
  const secondValue = Number(seconds);

  if (
    !Number.isFinite(degreeValue) ||
    !Number.isFinite(minuteValue) ||
    !Number.isFinite(secondValue) ||
    minuteValue < 0 ||
    minuteValue >= 60 ||
    secondValue < 0 ||
    secondValue >= 60
  ) {
    return null;
  }

  const magnitude = Math.abs(degreeValue) + minuteValue / 60 + secondValue / 3600;
  const sign = hemisphere ? hemisphereSign(hemisphere) : degreeValue < 0 ? -1 : 1;
  return magnitude * sign;
}

function convertDdm(degrees, minutes, hemisphere) {
  const degreeValue = Number(degrees);
  const minuteValue = Number(minutes);

  if (
    !Number.isFinite(degreeValue) ||
    !Number.isFinite(minuteValue) ||
    minuteValue < 0 ||
    minuteValue >= 60
  ) {
    return null;
  }

  const magnitude = Math.abs(degreeValue) + minuteValue / 60;
  const sign = hemisphere ? hemisphereSign(hemisphere) : degreeValue < 0 ? -1 : 1;
  return magnitude * sign;
}

export function validateCoordinatePair(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      valid: false,
      code: 'INVALID_NUMBER',
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lon) ? lon : null,
    };
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, code: 'LATITUDE_OUT_OF_RANGE', latitude: lat, longitude: lon };
  }

  if (lon < -180 || lon > 180) {
    return { valid: false, code: 'LONGITUDE_OUT_OF_RANGE', latitude: lat, longitude: lon };
  }

  return { valid: true, code: null, latitude: lat, longitude: lon };
}

export function formatCoordinatePair(latitude, longitude, precision = 5) {
  const validation = validateCoordinatePair(latitude, longitude);
  if (!validation.valid) {
    return null;
  }

  return `${validation.latitude.toFixed(precision)}, ${validation.longitude.toFixed(precision)}`;
}

export function normalizeCoordinates(latitude, longitude) {
  const validation = validateCoordinatePair(latitude, longitude);
  if (!validation.valid) {
    return null;
  }

  const normalizedLatitude = cleanPrecision(validation.latitude);
  const normalizedLongitude = cleanPrecision(validation.longitude);

  return {
    latitude: normalizedLatitude,
    longitude: normalizedLongitude,
    formatted: formatCoordinatePair(normalizedLatitude, normalizedLongitude),
  };
}

function success(format, latitude, longitude) {
  const normalized = normalizeCoordinates(latitude, longitude);
  if (!normalized) {
    return {
      status: 'invalid',
      format,
      code: validateCoordinatePair(latitude, longitude).code,
    };
  }

  return {
    status: 'success',
    format,
    ...normalized,
  };
}

function extractHemispherePair(text, pattern, format, converter) {
  pattern.lastIndex = 0;
  const values = {};

  for (const match of text.matchAll(pattern)) {
    const hemisphere = match.at(-1);
    const axis = coordinateAxis(hemisphere);
    if (!axis || values[axis] !== undefined) {
      continue;
    }

    values[axis] = converter(...match.slice(1, -1), hemisphere);
  }

  if (values.latitude === undefined || values.longitude === undefined) {
    return null;
  }

  return success(format, values.latitude, values.longitude);
}

function parseDms(text) {
  return extractHemispherePair(text, DMS_HEMISPHERE_PATTERN, 'DMS', convertDms);
}

function parseDdm(text) {
  return extractHemispherePair(text, DDM_HEMISPHERE_PATTERN, 'DDM', convertDdm);
}

function parseDecimalHemisphere(text) {
  const match = text.match(DECIMAL_HEMISPHERE_PATTERN);
  if (!match) {
    return null;
  }

  const latitude = Math.abs(Number(match[1])) * hemisphereSign(match[2]);
  const longitude = Math.abs(Number(match[3])) * hemisphereSign(match[4]);
  return success('DD', latitude, longitude);
}

function parseLabeledDecimal(text) {
  const latitude = text.match(LAT_LABEL_PATTERN)?.[1];
  const longitude = text.match(LON_LABEL_PATTERN)?.[1];

  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  return success('DD', latitude, longitude);
}

function parseDecimalPair(text) {
  const match = text.match(DECIMAL_PAIR_PATTERN);
  if (!match) {
    return null;
  }

  return success('DD', match[1], match[2]);
}

function parseSpacePair(text) {
  const match = text.match(DECIMAL_SPACE_PAIR_PATTERN);
  if (!match) {
    return null;
  }

  const conventional = normalizeCoordinates(match[1], match[2]);
  const swapped = normalizeCoordinates(match[2], match[1]);

  if (conventional && swapped) {
    return {
      status: 'ambiguous',
      format: 'DD',
      code: 'AMBIGUOUS_ORDER',
      candidates: [conventional, swapped],
    };
  }

  if (conventional) {
    return { status: 'success', format: 'DD', ...conventional };
  }

  if (swapped) {
    return { status: 'success', format: 'DD', ...swapped };
  }

  return { status: 'invalid', format: 'DD', code: 'OUT_OF_RANGE' };
}

export function parseCoordinateText(input) {
  const text = typeof input === 'string' ? normalizeWatermarkText(input.trim()) : '';
  if (!text) {
    return { status: 'not_found', format: null, code: 'NO_COORDINATE' };
  }

  const parsers = [
    parseDms,
    parseDdm,
    parseDecimalHemisphere,
    parseLabeledDecimal,
    parseDecimalPair,
    parseSpacePair,
  ];

  for (const parser of parsers) {
    const result = parser(text);
    if (result) {
      return result;
    }
  }

  return { status: 'not_found', format: null, code: 'NO_COORDINATE' };
}
