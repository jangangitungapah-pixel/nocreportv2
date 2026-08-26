import { describe, expect, it } from 'vitest';

import { hasDuplicateLookupSignal } from './duplicateDetection.js';

function ticket(overrides = {}) {
  return {
    title: '',
    externalTtNumber: null,
    incidentKey: null,
    pathKey: null,
    occurAt: null,
    alarmContext: {
      siteId: '',
      alarmFamily: null,
    },
    ...overrides,
  };
}

describe('hasDuplicateLookupSignal', () => {
  it('allows title + Occur Time to use the bounded recent fallback', () => {
    expect(
      hasDuplicateLookupSignal(
        ticket({
          title: '[MANDAU] LINK DOWN AT DWDM NODE_A <> NODE_B',
          occurAt: new Date('2026-08-26T12:00:00.000Z'),
        }),
      ),
    ).toBe(true);
  });

  it('does not run a title-only lookup without an occurrence-time bound', () => {
    expect(hasDuplicateLookupSignal(ticket({ title: 'LINK DOWN NODE_A NODE_B' }))).toBe(false);
  });

  it('still accepts exact indexed identity signals without Occur Time', () => {
    expect(hasDuplicateLookupSignal(ticket({ externalTtNumber: 'INC-20260826-00000001' }))).toBe(
      true,
    );
    expect(hasDuplicateLookupSignal(ticket({ incidentKey: 'INC-20260826-00000001' }))).toBe(true);
    expect(hasDuplicateLookupSignal(ticket({ pathKey: 'NODE_A<>NODE_B' }))).toBe(true);
  });
});
