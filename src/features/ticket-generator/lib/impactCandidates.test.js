import { describe, expect, it } from 'vitest';

import {
  cleanImpactCandidate,
  impactCandidateKey,
  mergeImpactValues,
  parseImpactCandidates,
} from './impactCandidates.js';

describe('GEN-F3 Impact candidates', () => {
  it('normalizes multiline bullets and numbers while preserving meaningful order', () => {
    const parsed = parseImpactCandidates(`Impact List:\n1. SITE_ALPHA\n- Service Beta\n• NODE GAMMA`);

    expect(parsed.items.map((item) => item.value)).toEqual([
      'SITE_ALPHA',
      'Service Beta',
      'NODE GAMMA',
    ]);
    expect(parsed.stats).toEqual({
      proposedCount: 3,
      sourceDuplicateCount: 0,
      existingDuplicateCount: 0,
    });
  });

  it('removes only exact-normalized duplicates and keeps the first wording/order', () => {
    const parsed = parseImpactCandidates(`SITE_ALPHA\n site_alpha \nSITE ALPHA\nSITE_BETA`);

    expect(parsed.items.map((item) => item.value)).toEqual(['SITE_ALPHA', 'SITE ALPHA', 'SITE_BETA']);
    expect(parsed.duplicateItems).toEqual([
      { value: 'site_alpha', sourceLine: 2, reason: 'source_duplicate' },
    ]);
  });

  it('filters values already present in the live Impact draft without inventing topology impact', () => {
    const parsed = parseImpactCandidates(`SITE_EXISTING\nSITE_NEW`, {
      existing: [{ value: 'site_existing' }],
    });

    expect(parsed.items.map((item) => item.value)).toEqual(['SITE_NEW']);
    expect(parsed.existingDuplicateItems).toEqual([
      { value: 'SITE_EXISTING', sourceLine: 1, reason: 'already_present' },
    ]);
  });

  it('merges selected proposals with current Impact values without reordering existing entries', () => {
    expect(
      mergeImpactValues(
        [{ value: 'SITE_A' }, { value: 'Service B' }],
        ['service b', 'SITE_C', 'SITE_A'],
      ),
    ).toEqual(['SITE_A', 'Service B', 'SITE_C']);
  });

  it('supports inline Impact headers and stable exact-normalized identity', () => {
    expect(cleanImpactCandidate('Impact List:   NODE_A')).toBe('NODE_A');
    expect(impactCandidateKey('  node_a  ')).toBe('NODE_A');
    expect(impactCandidateKey('NODE A')).toBe('NODE A');
  });
});
