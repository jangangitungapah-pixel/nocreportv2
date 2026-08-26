import { describe, expect, it } from 'vitest';

import { SANITIZED_EMAIL_CORPUS_FIXTURES } from './emailCorpusFixtures.js';
import { buildPathKey, normalizeIncidentKey } from './operationalNormalization.js';

describe('sanitized corpus-inspired fixtures', () => {
  it('contains no recipient/email-address data', () => {
    const serialized = JSON.stringify(SANITIZED_EMAIL_CORPUS_FIXTURES);
    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  });

  it('covers multi-point and reverse-orientation path identity', () => {
    const multiPoint = SANITIZED_EMAIL_CORPUS_FIXTURES.find(
      (fixture) => fixture.id === 'direct-mandau-multi-point',
    );
    const reverse = SANITIZED_EMAIL_CORPUS_FIXTURES.find(
      (fixture) => fixture.id === 'direct-mandau-reverse-path',
    );

    expect(buildPathKey(multiPoint.path)).toBe(buildPathKey(reverse.path));
  });

  it('covers TT prefix normalization without erasing the raw reference', () => {
    const fixture = SANITIZED_EMAIL_CORPUS_FIXTURES[0];
    expect(fixture.externalTtNumber).toBe('DATACOM-INC-20260826-90000001');
    expect(normalizeIncidentKey(fixture.externalTtNumber)).toBe('INC-20260826-90000001');
  });

  it('keeps current-message Sent metadata separate from quoted body Sent text', () => {
    const fixture = SANITIZED_EMAIL_CORPUS_FIXTURES.find(
      (entry) => entry.id === 'quoted-sent-body-risk',
    );

    expect(fixture.body).toContain('Sent: Monday, August 24, 2026 08:00');
    expect(fixture.messageSentAt).toBe('2026-08-26T02:30:45.000Z');
  });
});
