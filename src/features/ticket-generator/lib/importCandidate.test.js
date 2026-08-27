import { describe, expect, it } from 'vitest';

import {
  createCandidateField,
  createImportCandidate,
  detectCandidateValueConflict,
} from './importCandidate.js';

describe('normalized Import Candidate contract', () => {
  it('creates a stable candidate shape with local-only source metadata', () => {
    const candidate = createImportCandidate({
      source: {
        kind: 'outlook_msg',
        sourceName: 'incident.msg',
        subject: '[MANDAU] LINK DOWN ...',
        messageSentAt: '2026-08-26T00:59:26.000Z',
      },
      fields: {
        dispatchAt: createCandidateField({
          value: '2026-08-26T07:59',
          rawValue: '2026-08-26T00:59:26.000Z',
          source: 'message_metadata',
          confidence: 'exact',
        }),
      },
    });

    expect(candidate.source).toMatchObject({
      kind: 'outlook_msg',
      profileId: 'MANDAU_DEFAULT',
      parserVersion: 1,
      sourceName: 'incident.msg',
      messageSentAt: '2026-08-26T00:59:26.000Z',
    });
    expect(candidate.fields.dispatchAt).toMatchObject({
      value: '2026-08-26T07:59',
      source: 'message_metadata',
      confidence: 'exact',
      selected: true,
    });
    expect(candidate.alarmContext.pathEndpoints.selected).toBe(false);
  });

  it('rejects unsupported source kinds and candidate sources', () => {
    expect(() => createImportCandidate({ source: { kind: 'remote_ai' } })).toThrow(
      'Unsupported import source kind',
    );
    expect(() => createCandidateField({ source: 'network_api' })).toThrow(
      'Unsupported candidate source',
    );
  });

  it('does not report a conflict for equivalent normalized values', () => {
    const conflict = detectCandidateValueConflict('externalTtNumber', [
      createCandidateField({
        value: 'INC-20260826-00000054',
        source: 'body',
        confidence: 'exact',
      }),
      createCandidateField({
        value: ' inc-20260826-00000054 ',
        source: 'subject',
        confidence: 'strong',
      }),
    ]);

    expect(conflict).toBeNull();
  });

  it('reports a deterministic conflict instead of choosing a winner silently', () => {
    const conflict = detectCandidateValueConflict('externalTtNumber', [
      createCandidateField({
        value: 'INC-20260826-00000054',
        source: 'body',
        confidence: 'exact',
      }),
      createCandidateField({
        value: 'INC-20260826-00000055',
        source: 'subject',
        confidence: 'strong',
      }),
    ]);

    expect(conflict).toMatchObject({
      kind: 'value_mismatch',
      field: 'externalTtNumber',
    });
    expect(conflict.candidates).toHaveLength(2);
  });
});
