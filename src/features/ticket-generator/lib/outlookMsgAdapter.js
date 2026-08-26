import { parseDecodedEmailImport } from './emailImportParser.js';

export const DEFAULT_MAX_OUTLOOK_MSG_BYTES = 10 * 1024 * 1024;

export class OutlookMsgDecodeError extends Error {
  constructor(message, { code = 'OUTLOOK_MSG_DECODE_FAILED', cause = null } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'OutlookMsgDecodeError';
    this.code = code;
  }
}

function toOwnedArrayBuffer(input) {
  if (input instanceof ArrayBuffer) {
    return input.slice(0);
  }

  if (ArrayBuffer.isView(input)) {
    const start = input.byteOffset;
    const end = input.byteOffset + input.byteLength;
    return input.buffer.slice(start, end);
  }

  throw new OutlookMsgDecodeError('Outlook email source must be an ArrayBuffer.', {
    code: 'OUTLOOK_MSG_INVALID_SOURCE',
  });
}

function validateSourceName(sourceName) {
  if (!sourceName) return;
  if (!String(sourceName).toLowerCase().endsWith('.msg')) {
    throw new OutlookMsgDecodeError('Only Outlook .msg files are supported.', {
      code: 'OUTLOOK_MSG_UNSUPPORTED_EXTENSION',
    });
  }
}

function buildSafeDecodedMessage(fields) {
  return {
    subject: typeof fields?.subject === 'string' ? fields.subject : '',
    body: typeof fields?.body === 'string' ? fields.body : '',
    htmlBody: typeof fields?.bodyHtml === 'string' ? fields.bodyHtml : '',
    clientSubmitTime: fields?.clientSubmitTime ?? null,
  };
}

export function decodeOutlookMsgBuffer(
  input,
  {
    sourceName = null,
    createReader,
    maxBytes = DEFAULT_MAX_OUTLOOK_MSG_BYTES,
  } = {},
) {
  validateSourceName(sourceName);
  const arrayBuffer = toOwnedArrayBuffer(input);

  if (!arrayBuffer.byteLength) {
    throw new OutlookMsgDecodeError('Outlook .msg file is empty.', {
      code: 'OUTLOOK_MSG_EMPTY_FILE',
    });
  }

  if (arrayBuffer.byteLength > maxBytes) {
    throw new OutlookMsgDecodeError(
      `Outlook .msg file exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB local parsing limit.`,
      { code: 'OUTLOOK_MSG_TOO_LARGE' },
    );
  }

  if (typeof createReader !== 'function') {
    throw new OutlookMsgDecodeError('Outlook .msg decoder is not available.', {
      code: 'OUTLOOK_MSG_DECODER_UNAVAILABLE',
    });
  }

  let fields;
  try {
    const reader = createReader(arrayBuffer);
    fields = reader?.getFileData?.();
  } catch (error) {
    throw new OutlookMsgDecodeError('Outlook .msg file could not be decoded.', {
      cause: error,
    });
  }

  if (!fields || typeof fields !== 'object') {
    throw new OutlookMsgDecodeError('Outlook .msg decoder returned no message data.');
  }

  if (fields.error) {
    throw new OutlookMsgDecodeError(String(fields.error), {
      code: 'OUTLOOK_MSG_UNSUPPORTED_OR_CORRUPT',
    });
  }

  return buildSafeDecodedMessage(fields);
}

export function parseOutlookMsgImport(
  input,
  {
    sourceName = null,
    createReader,
    maxBytes = DEFAULT_MAX_OUTLOOK_MSG_BYTES,
    profileId = 'MANDAU_DEFAULT',
  } = {},
) {
  const decoded = decodeOutlookMsgBuffer(input, {
    sourceName,
    createReader,
    maxBytes,
  });

  return parseDecodedEmailImport(decoded, { sourceName, profileId });
}
