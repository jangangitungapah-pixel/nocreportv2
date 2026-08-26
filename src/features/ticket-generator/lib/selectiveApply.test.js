import { describe, expect, test } from 'vitest';

import { createCandidateField, createImportCandidate } from './importCandidate.js';
import { applySelectiveImport, buildSelectiveApplyPlan } from './selectiveApply.js';

function fixtureCandidate() {
  return createImportCandidate({
    fields: {
      title: createCandidateField({
        value: '[MANDAU] IMPORTED TITLE',
        source: 'subject',
        confidence: 'strong',
      }),
      occurAt: createCandidateField({
        value: '2026-08-26T07:45',
        source: 'body',
        confidence: 'exact',
      }),
      dispatchAt: createCandidateField({
        value: '2026-08-26T07:59',
        source: 'message_metadata',
        confidence: 'exact',
      }),
    },
  });
}

describe('selectiveApply', () => {
  test('marks dirty replacements for explicit confirmation while allowing safe empty-field fills', () => {
    const plan = buildSelectiveApplyPlan(
      fixtureCandidate(),
      {
        title: 'Operator custom title',
        occurAt: '',
        dispatchAt: '',
      },
      { dirtyFields: ['title'] },
    );

    expect(plan.find((item) => item.field === 'title')).toMatchObject({
      replacement: true,
      dirty: true,
      requiresConfirmation: true,
    });
    expect(plan.find((item) => item.field === 'occurAt')).toMatchObject({
      replacement: false,
      requiresConfirmation: false,
    });
  });

  test('does not silently overwrite dirty fields and applies them only after explicit confirmation', () => {
    const currentValues = {
      title: 'Operator custom title',
      occurAt: '',
      dispatchAt: '',
    };

    const first = applySelectiveImport(fixtureCandidate(), currentValues, {
      dirtyFields: ['title'],
    });

    expect(first.nextValues.title).toBe('Operator custom title');
    expect(first.nextValues.occurAt).toBe('2026-08-26T07:45');
    expect(first.nextValues.dispatchAt).toBe('2026-08-26T07:59');
    expect(first.skippedFields).toEqual(['title']);

    const confirmed = applySelectiveImport(fixtureCandidate(), currentValues, {
      dirtyFields: ['title'],
      confirmedFields: ['title'],
    });

    expect(confirmed.nextValues.title).toBe('[MANDAU] IMPORTED TITLE');
    expect(confirmed.appliedFields).toContain('title');
  });
});
