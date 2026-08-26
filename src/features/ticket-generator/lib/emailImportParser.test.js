import { describe, expect, test } from 'vitest';

import { parseDecodedEmailImport } from './emailImportParser.js';
import { parseEmailSubject } from './emailSubjectParser.js';
import { buildPathKey } from './operationalNormalization.js';

const FLP_SUBJECT =
  '[FLP_3rd_MANDAU][Open - Critical] DOWN - 99AAA0001_FAKE_A<>99BBB0002_FAKE_B - DATACOM-INC-20260826-90000001';

const FLP_BODY = `TT = DATACOM-INC-20260826-90000001
Alarm = LINK_DOWN
Alarm Source = FAKE_NMS
EMS Alarm No = FAKE-001
Site ID = 99AAA0001
Site Name = FAKE A
Severity = Critical
Occur Time = 2026-08-26 07:45
Dispatch to = FAKE_TEAM
Region = JABOTABEK
Status = Open
Description = Synthetic fixture only

From: Older Fake Sender
Sent: Monday, August 24, 2026 08:00
Subject: Older quoted message`;

describe('GEN-F1 decoded email parsing', () => {
  test('uses top-level clientSubmitTime for Dispatch Time and ignores Delivery/quoted Sent timestamps', () => {
    const candidate = parseDecodedEmailImport({
      subject: FLP_SUBJECT,
      body: FLP_BODY,
      clientSubmitTime: '2026-08-26T00:59:26.000Z',
      messageDeliveryTime: '2026-08-26T00:59:40.000Z',
    });

    expect(candidate.fields.dispatchAt).toMatchObject({
      value: '2026-08-26T07:59',
      source: 'message_metadata',
      confidence: 'exact',
      rawValue: '2026-08-26T00:59:26.000Z',
    });
    expect(candidate.source.messageSentAt).toBe('2026-08-26T00:59:26.000Z');
    expect(candidate.fields.occurAt.value).toBe('2026-08-26T07:45');
    expect(candidate.alarmContext.dispatchTo.value).toBe('FAKE_TEAM');
    expect(candidate.warnings).not.toContain(
      'Email Sent Time was not available; Dispatch Time needs review.',
    );
  });

  test('parses direct MANDAU multi-point paths and preserves orientation-aware path identity', () => {
    const subject =
      '[MANDAU] LINK DOWN AT DWDM 1800 99AAA0100_FAKE_A <> 99BBB0200_FAKE_B <> 99CCC0300_FAKE_C [TT : DWDM-INC-20260826-90000002]';
    const candidate = parseDecodedEmailImport({
      subject,
      body: '',
      clientSubmitTime: '2026-08-26T01:10:12.000Z',
    });

    expect(candidate.alarmContext.transportFamily.value).toBe('DWDM 1800');
    expect(candidate.alarmContext.pathEndpoints.value).toEqual([
      '99AAA0100_FAKE_A',
      '99BBB0200_FAKE_B',
      '99CCC0300_FAKE_C',
    ]);
    expect(candidate.alarmContext.pathKey.value).toBe(
      buildPathKey(['99CCC0300_FAKE_C', '99BBB0200_FAKE_B', '99AAA0100_FAKE_A']),
    );
    expect(candidate.fields.externalTtNumber.value).toBe('DWDM-INC-20260826-90000002');
    expect(candidate.fields.incidentKey.value).toBe('INC-20260826-90000002');
    expect(candidate.alarmContext.alarmFamily.value).toBe('LINK_DOWN');
  });

  test('treats equivalent TT prefixes as the same incident identity but blocks true body/subject TT mismatch', () => {
    const equivalent = parseDecodedEmailImport({
      subject:
        '[MANDAU] LINK DOWN AT DWDM 99AAA0001_FAKE_A <> 99BBB0002_FAKE_B [TT : DWDM-INC-20260826-90000010]',
      body: 'TT = INC-20260826-90000010',
      clientSubmitTime: '2026-08-26T02:00:00.000Z',
    });
    expect(equivalent.conflicts).toEqual([]);
    expect(equivalent.fields.externalTtNumber.value).toBe('INC-20260826-90000010');
    expect(equivalent.fields.incidentKey.value).toBe('INC-20260826-90000010');

    const mismatch = parseDecodedEmailImport({
      subject:
        '[MANDAU] LINK DOWN AT DWDM 99AAA0001_FAKE_A <> 99BBB0002_FAKE_B [TT : INC-20260826-90000011]',
      body: 'TT = INC-20260826-90000012',
      clientSubmitTime: '2026-08-26T02:00:00.000Z',
    });
    expect(mismatch.fields.externalTtNumber.value).toBe('INC-20260826-90000012');
    expect(mismatch.conflicts).toEqual([
      expect.objectContaining({ field: 'externalTtNumber', severity: 'blocking' }),
    ]);
    expect(mismatch.warnings).toContain(
      'Imported email contains a blocking identity conflict that needs review.',
    );
  });

  test('extracts multiple external TT references without changing the primary TT', () => {
    const candidate = parseDecodedEmailImport({
      subject: '[MANDAU] LINK DOWN AT DWDM 99AAA0001_FAKE_A <> 99BBB0002_FAKE_B',
      body: `TT = INC-20260826-90000020
IOH TT = IOH-FAKE-20
H3I TT = H3I-FAKE-20`,
      clientSubmitTime: '2026-08-26T03:00:00.000Z',
    });

    expect(candidate.fields.externalTtNumber.value).toBe('INC-20260826-90000020');
    expect(candidate.alarmContext.externalTtReferences.value).toEqual([
      'INC-20260826-90000020',
      'IOH-FAKE-20',
      'H3I-FAKE-20',
    ]);
  });

  test('leaves Dispatch Time unresolved when Sent metadata is unavailable', () => {
    const candidate = parseDecodedEmailImport({ subject: FLP_SUBJECT, body: FLP_BODY });

    expect(candidate.fields.dispatchAt.selected).toBe(false);
    expect(candidate.fields.dispatchAt.value).toBeNull();
    expect(candidate.warnings).toContain(
      'Email Sent Time was not available; Dispatch Time needs review.',
    );
  });

  test('uses sanitized HTML only when plain text body is unavailable', () => {
    const candidate = parseDecodedEmailImport({
      subject: FLP_SUBJECT,
      htmlBody:
        '<div>TT = DATACOM-INC-20260826-90000001</div><div>Occur Time = 26/08/2026 07:45</div><script>TT = INC-19000101-1</script>',
      clientSubmitTime: '2026-08-26T00:59:26.000Z',
    });

    expect(candidate.fields.externalTtNumber.value).toBe('DATACOM-INC-20260826-90000001');
    expect(candidate.fields.occurAt.value).toBe('2026-08-26T07:45');
    expect(candidate.conflicts).toEqual([]);
  });
});

describe('GEN-F1 subject parsing', () => {
  test('parses direct transport variants and weak TT fallback from sanitized filenames', () => {
    const parsed = parseEmailSubject(
      '[MANDAU] LINK DOWN AT OSN 3500 99AAA0001_FAKE_A <> 99BBB0002_FAKE_B [TT : INC-20260826-90000030]',
    );

    expect(parsed.transportFamily).toBe('OSN 3500');
    expect(parsed.pathEndpoints).toHaveLength(2);
    expect(parsed.externalTtNumber).toBe('INC-20260826-90000030');

    const candidate = parseDecodedEmailImport(
      { subject: '[MANDAU] LINK DOWN AT DWDM 99AAA0001_FAKE_A <> 99BBB0002_FAKE_B' },
      { sourceName: '_TT_DWDM-INC-20260826-90000031_.msg' },
    );
    expect(candidate.fields.externalTtNumber).toMatchObject({
      value: 'DWDM-INC-20260826-90000031',
      source: 'filename',
      confidence: 'weak',
    });
  });
});
