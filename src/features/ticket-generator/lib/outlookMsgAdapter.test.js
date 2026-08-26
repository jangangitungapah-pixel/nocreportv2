import { describe, expect, test, vi } from 'vitest';

import {
  DEFAULT_MAX_OUTLOOK_MSG_BYTES,
  OutlookMsgDecodeError,
  decodeOutlookMsgBuffer,
  decodeOutlookMsgBufferWithDefaultDecoder,
  parseOutlookMsgImport,
  parseOutlookMsgImportWithDefaultDecoder,
} from './outlookMsgAdapter.js';

function createReaderFactory(fields) {
  return vi.fn((arrayBuffer) => ({
    arrayBuffer,
    getFileData: () => fields,
  }));
}

function createDecoderModuleLoader(fields) {
  const MsgReader = class {
    constructor(arrayBuffer) {
      this.arrayBuffer = arrayBuffer;
    }

    getFileData() {
      return fields;
    }
  };

  return vi.fn(async () => ({ MsgReader }));
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

  test('lazy production decoder keeps Delivery Time and private transport fields outside the app boundary', async () => {
    const loadDecoderModule = createDecoderModuleLoader({
      subject: '[MANDAU] LINK DOWN AT DWDM 99AAA0001_FAKE_A <> 99BBB0002_FAKE_B',
      body: 'TT = INC-20260826-90010003',
      bodyHtml: '<div>TT = INC-20260826-90010003</div>',
      clientSubmitTime: '2026-08-26T01:10:00.000Z',
      messageDeliveryTime: '2026-08-26T01:10:09.000Z',
      senderEmail: 'private@example.test',
      recipients: [{ email: 'private-recipient@example.test' }],
      attachments: [{ fileName: 'private.bin', content: new Uint8Array([9, 8, 7]) }],
    });

    const decoded = await decodeOutlookMsgBufferWithDefaultDecoder(new Uint8Array([1, 2, 3]), {
      sourceName: 'synthetic.msg',
      loadDecoderModule,
    });

    expect(loadDecoderModule).toHaveBeenCalledTimes(1);
    expect(decoded).toEqual({
      subject: '[MANDAU] LINK DOWN AT DWDM 99AAA0001_FAKE_A <> 99BBB0002_FAKE_B',
      body: 'TT = INC-20260826-90010003',
      htmlBody: '<div>TT = INC-20260826-90010003</div>',
      clientSubmitTime: '2026-08-26T01:10:00.000Z',
    });
    expect(decoded).not.toHaveProperty('messageDeliveryTime');
    expect(decoded).not.toHaveProperty('senderEmail');
    expect(decoded).not.toHaveProperty('recipients');
    expect(decoded).not.toHaveProperty('attachments');
  });

  test('lazy production import uses current-email Client Submit Time as Dispatch Time', async () => {
    const loadDecoderModule = createDecoderModuleLoader({
      subject:
        '[MANDAU] LINK DOWN AT DWDM 99AAA0001_FAKE_A <> 99BBB0002_FAKE_B [TT : INC-20260826-90010004]',
      body: ['Occur Time = 26/08/2026 07:45', 'Sent: Tuesday, August 25, 2026 4:00 PM'].join(
        '\n',
      ),
      clientSubmitTime: '2026-08-26T01:15:26.000Z',
      messageDeliveryTime: '2026-08-26T01:15:44.000Z',
    });

    const candidate = await parseOutlookMsgImportWithDefaultDecoder(new Uint8Array([4, 5, 6]), {
      sourceName: 'synthetic.msg',
      loadDecoderModule,
    });

    expect(candidate.fields.dispatchAt).toMatchObject({
      value: '2026-08-26T08:15',
      source: 'message_metadata',
      rawValue: '2026-08-26T01:15:26.000Z',
    });
    expect(candidate.source.messageSentAt).toBe('2026-08-26T01:15:26.000Z');
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

  test('lazy decoder validates local source before importing the package', async () => {
    const loadDecoderModule = createDecoderModuleLoader({});

    await expect(
      decodeOutlookMsgBufferWithDefaultDecoder(new Uint8Array([1]), {
        sourceName: 'synthetic.eml',
        loadDecoderModule,
      }),
    ).rejects.toMatchObject({ code: 'OUTLOOK_MSG_UNSUPPORTED_EXTENSION' });
    expect(loadDecoderModule).not.toHaveBeenCalled();
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

  test('surfaces a missing lazy decoder module as a typed local error', async () => {
    const loadDecoderModule = vi.fn(async () => {
      throw new Error('synthetic module load failure');
    });

    await expect(
      decodeOutlookMsgBufferWithDefaultDecoder(new Uint8Array([1]), {
        sourceName: 'synthetic.msg',
        loadDecoderModule,
      }),
    ).rejects.toMatchObject({
      name: 'OutlookMsgDecodeError',
      code: 'OUTLOOK_MSG_DECODER_UNAVAILABLE',
    });
  });

  test('keeps the injectable sync path explicit for unit and corpus regression tests', () => {
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
