import { describe, expect, it } from 'vitest';

import {
  buildPathKey,
  canonicalizePathEndpoint,
  deriveOperationalIdentity,
  normalizeAlarm,
  normalizeExternalTtReference,
  normalizeIncidentKey,
  normalizeOperationalText,
  parsePathEndpoints,
} from './operationalNormalization.js';

describe('operational normalization foundation', () => {
  it('normalizes whitespace and literal undefined safely', () => {
    expect(normalizeOperationalText('  A\u00a0  B  ')).toBe('A B');
    expect(normalizeOperationalText('undefined')).toBe('');
    expect(normalizeOperationalText(null)).toBe('');
  });

  it('normalizes TT references while preserving an incident key across prefixes', () => {
    expect(normalizeExternalTtReference(' dwdm-inc-20260825-00015072 ')).toBe(
      'DWDM-INC-20260825-00015072',
    );
    expect(normalizeIncidentKey('INC-20260825-00015072')).toBe('INC-20260825-00015072');
    expect(normalizeIncidentKey('DWDM-INC-20260825-00015072')).toBe(
      'INC-20260825-00015072',
    );
    expect(normalizeIncidentKey('DATACOM-INC-20260825-00015072')).toBe(
      'INC-20260825-00015072',
    );
  });

  it('preserves raw alarm text and derives a stable family', () => {
    expect(normalizeAlarm('Link Down')).toEqual({ rawAlarm: 'Link Down', alarmFamily: 'LINK_DOWN' });
    expect(normalizeAlarm('Physical Port Down')).toEqual({
      rawAlarm: 'Physical Port Down',
      alarmFamily: 'LINK_DOWN',
    });
    expect(normalizeAlarm('ETH_LOS')).toEqual({ rawAlarm: 'ETH_LOS', alarmFamily: 'ETH_LOS' });
    expect(normalizeAlarm('MUT_LOS')).toEqual({ rawAlarm: 'MUT_LOS', alarmFamily: 'MUT_LOS' });
  });

  it('parses ordered two-point and multi-point paths', () => {
    expect(parsePathEndpoints('NODE A <> NODE B <> NODE C')).toEqual([
      'NODE A',
      'NODE B',
      'NODE C',
    ]);
    expect(parsePathEndpoints([' NODE A ', 'NODE\u00a0B'])).toEqual(['NODE A', 'NODE B']);
  });

  it('normalizes spaces, underscores and transport-reference parentheses for path identity', () => {
    expect(canonicalizePathEndpoint('21MTW0005_MUARA TEWEH_EP (REF01)')).toBe(
      '21MTW0005_MUARA_TEWEH_EP',
    );
  });

  it('treats forward and reverse orientation as the same path without sorting interior nodes', () => {
    const forward = buildPathKey(['A', 'B', 'C']);
    const reverse = buildPathKey(['C', 'B', 'A']);
    const reordered = buildPathKey(['A', 'C', 'B']);

    expect(forward).toBe(reverse);
    expect(reordered).not.toBe(forward);
  });

  it('derives incident and path identity together', () => {
    expect(
      deriveOperationalIdentity({
        externalTtNumber: 'DWDM-INC-20260825-00015072',
        pathEndpoints: ['NODE A', 'NODE B'],
      }),
    ).toEqual({
      incidentKey: 'INC-20260825-00015072',
      pathKey: 'NODE_A<>NODE_B',
    });
  });
});
