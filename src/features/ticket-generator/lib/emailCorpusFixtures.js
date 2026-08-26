export const SANITIZED_EMAIL_CORPUS_FIXTURES = Object.freeze([
  Object.freeze({
    id: 'flp-link-down-complete',
    sourceKind: 'outlook_msg',
    subject:
      '[FLP_3rd_MANDAU][Open - Critical] DOWN - 99AAA0001_FAKE_A<>99BBB0002_FAKE_B - DATACOM-INC-20260826-90000001',
    externalTtNumber: 'DATACOM-INC-20260826-90000001',
    alarm: 'LINK_DOWN',
    path: '99AAA0001_FAKE_A <> 99BBB0002_FAKE_B',
    occurAt: '2026-08-26T00:45:00.000Z',
    messageSentAt: '2026-08-26T00:59:26.000Z',
  }),
  Object.freeze({
    id: 'direct-mandau-multi-point',
    sourceKind: 'outlook_msg',
    subject:
      '[MANDAU] LINK DOWN AT DWDM 1800 99AAA0100_FAKE_A <> 99BBB0200_FAKE_B <> 99CCC0300_FAKE_C [TT : DWDM-INC-20260826-90000002]',
    externalTtNumber: 'DWDM-INC-20260826-90000002',
    path: '99AAA0100_FAKE_A <> 99BBB0200_FAKE_B <> 99CCC0300_FAKE_C',
    messageSentAt: '2026-08-26T01:10:12.000Z',
  }),
  Object.freeze({
    id: 'direct-mandau-reverse-path',
    sourceKind: 'outlook_msg',
    subject:
      '[MANDAU] LINK DOWN AT DWDM 99CCC0300_FAKE_C <> 99BBB0200_FAKE_B <> 99AAA0100_FAKE_A [TT : INC-20260826-90000003]',
    externalTtNumber: 'INC-20260826-90000003',
    path: '99CCC0300_FAKE_C <> 99BBB0200_FAKE_B <> 99AAA0100_FAKE_A',
    messageSentAt: '2026-08-26T01:12:00.000Z',
  }),
  Object.freeze({
    id: 'quoted-sent-body-risk',
    sourceKind: 'outlook_msg',
    subject: '[MANDAU] LINK DOWN AT DWDM ZTE 99DDD0400_FAKE_D <> 99EEE0500_FAKE_E',
    body: 'Current incident body.\n\nFrom: Fake Sender\nSent: Monday, August 24, 2026 08:00\nSubject: Older quoted message',
    messageSentAt: '2026-08-26T02:30:45.000Z',
  }),
]);
