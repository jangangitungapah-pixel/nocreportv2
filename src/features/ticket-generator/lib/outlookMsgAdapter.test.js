import { describe, expect, test, vi } from 'vitest';

import {
  DEFAULT_MAX_OUTLOOK_MSG_BYTES,
  OutlookMsgDecodeError,
  decodeOutlookMsgBuffer,
  parseOutlookMsgImport,
} from './outlookMsgAdapter.js';

function createReaderFactory(fields) {
  return vi.fn((arrayBuffer) => ({
    arrayBuffer,
    getFileData: () => fields,
  }));
}

describe('outlookMsgAdapter', () => {
  test('returns only operationally safe top-level fields from decoded Outlook data', () => {
    const createReader = createReaderFactory({
      subject: '[MANDAU] LINK DOWN AT DWDM 99AAA0001_FAKE_A <> 99BBB0002_FAKE_B',
      body: 'TT = INC-20260826-90010001',
      bodyHtml: '<div>TT = INC-20260826-90010001</div>',
      clientSubmitTime: '2026-08-26T00:59:26.000Z',
      messageDeliveryTime: '2026-08-26T00:59:40.000Z',
      senderEmail: 'private@example.test',
      recipients: [{ email: 'private-recipient@example.test' }],
      attachments: [{ fileName: 'private.jpg', content: new Uint8Array([1, 2, 3]) }],
      rawProps: [{ tag: '00390040' }],
    });

    const decoded = decodeOutlookMsgBuffer(new Uint8Array([1, 2, 3, 4]), {
      sourceName: 'synthetic.msg',
      createReader,
    });

    expect(decoded).toEqual({
      subject: '[MANDAU] LINK DOWN AT DWDM 99AAA0001_FAKE_A <> 99BBB0002_FAKE_B',
      body: 'TT = INC-20260826-90010001',
      htmlBody: '<div>TT = INC-20260826-90010001</div>',
      clientSubmitTime: '2026-08-26T00:59:26.000Z',
    });
    expect(decoded).not.toHaveProperty('messageDeliveryTime');
    expect(decoded).not.toHaveProperty('senderEmail');
    expect(decoded).not.toHaveProperty('recipients');
    expect(decoded).not.toHaveProperty('attachments');
    expect(decoded).not.toHaveProperty('rawProps');
    expect(createReader).toHaveBeenCalledTimes(1);
    expect(createReader.mock.calls[0][0]).toBeInstanceOf(ArrayBuffer);
  });

  test('maps the decoder Sent Time through the import pipeline without exposing Delivery Time', () => {
    const createReader = createReaderFactory({
      subject:
        '[MANDAU] LINK DOWN AT DWDM 99AAA0001_FAKE_A <> 99BBB0002_FAKE_B [TT : INC-20260826-90010002]',
      body: 'Occur Time = 26/08/2026 07:45',
      clientSubmitTime: '2026-08-26T00:59:26.000Z',
      messageDeliveryTime: '2026-08-26T00:59:44.000Z',
    });

    const candidate = parseOutlookMsgImport(new Uint8Array([10, 20, 30]), {
      sourceName: 'synthetic.msg',
      createReader,
    });

    expect(candidate.fields.dispatchAt).toMatchObject({
      value: '2026-08-26T07:59',
      source: 'message_metadata',
      rawValue: '2026-08-26T00:59:26.000Z',
    });
    expect(candidate.source.messageSentAt).toBe('2026-08-26T00:59:26.000Z');
  });

  test.each([
    ['not-an-array-buffer', 'OUTLOOK_MSG_INVALID_SOURCE'],
    [new Uint8Array([]), 'OUTLOOK_MSG_EMPTY_FILE'],
  ])('rejects invalid local source %#', (source, code) => {
    expect(() =>
      decodeOutlookMsgBuffer(source, {
        sourceName: 'synthetic.msg',
        createReader: createReaderFactory({}),
      }),
    ).toThrow(expect.objectContaining({ code }));
  });

  test('rejects non-msg extension before decoding', () => {
    expect(() =>
      decodeOutlookMsgBuffer(new Uint8Array([1]), {
        sourceName: 'synthetic.eml',
        createReader: createReaderFactory({}),
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'OUTLOOK_MSG_UNSUPPORTED_EXTENSION',
      }),
    );
  });

  test('rejects oversized email locally before invoking the decoder', () => {
    const createReader = createReaderFactory({});
    const source = new Uint8Array(8);

    expect(() =>
      decodeOutlookMsgBuffer(source, {
        sourceName: 'synthetic.msg',
        createReader,
        maxBytes: 4,
      }),
    ).toThrow(expect.objectContaining({ code: 'OUTLOOK_MSG_TOO_LARGE' }));
    expect(createReader).not.toHaveBeenCalled();
  });

  test('surfaces unsupported/corrupt decoder results as a typed local error', () => {
    expect(() =>
      decodeOutlookMsgBuffer(new Uint8Array([1, 2]), {
        sourceName: 'synthetic.msg',
        createReader: createReaderFactory({ error: 'Unsupported file type!' }),
      }),
    ).toThrow(
      expect.objectContaining({
        name: 'OutlookMsgDecodeError',
        code: 'OUTLOOK_MSG_UNSUPPORTED_OR_CORRUPT',
      }),
    );
  });

  test('does not require a decoder to exist until the Outlook source path is actually used', () => {
    expect(() =>
      decodeOutlookMsgBuffer(new Uint8Array([1]), {
        sourceName: 'synthetic.msg',
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'OUTLOOK_MSG_DECODER_UNAVAILABLE',
      }),
    );
  });

  test('keeps the default size budget bounded', () => {
    expect(DEFAULT_MAX_OUTLOOK_MSG_BYTES).toBe(10 * 1024 * 1024);
    expect(new OutlookMsgDecodeError('test')).toBeInstanceOf(Error);
  });
});
