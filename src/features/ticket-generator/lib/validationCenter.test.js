import { describe, expect, it } from 'vitest';

import { createEmptyTicket } from '../../../entities/ticket/index.js';
import {
  deriveReportValidation,
  withDuplicateCandidateFindings,
} from './validationCenter.js';

function validForm(overrides = {}) {
  return {
    title: '[MANDAU] LINK DOWN [TT : INC-20260826-00000001]',
    impactList: [],
    occurAt: '2026-08-26T10:00',
    dispatchAt: '2026-08-26T10:10',
    pic: 'NOC',
    rootcause: '',
    cutPoint: '',
    latitude: '',
    longitude: '',
    coordinateSource: 'manual',
    coordinateDetectedFormat: 'DD',
    coordinateVerified: true,
    ...overrides,
  };
}

function validTicket(overrides = {}) {
  return createEmptyTicket({
    title: '[MANDAU] LINK DOWN [TT : INC-20260826-00000001]',
    occurAt: new Date('2026-08-26T10:00:00.000Z'),
    dispatchAt: new Date('2026-08-26T10:10:00.000Z'),
    pic: 'NOC',
    progress: [{ occurredAt: new Date('2026-08-26T10:30:00.000Z'), text: 'Checking' }],
    ...overrides,
  });
}

describe('GEN-F4 Report Validation Center', () => {
  it('reuses lifecycle requirements for Running readiness', () => {
    const result = deriveReportValidation(createEmptyTicket(), {
      formValues: validForm({ title: '', occurAt: '' }),
    });

    expect(result.readyForRunning).toBe(false);
    expect(result.blocking.map((item) => item.code)).toEqual(
      expect.arrayContaining(['RUNNING_REQUIRED_TITLE', 'RUNNING_REQUIRED_OCCURAT']),
    );
    expect(result.blocking.find((item) => item.code === 'RUNNING_REQUIRED_TITLE')).toMatchObject({
      field: 'title',
      source: 'lifecycle',
    });
  });

  it('surfaces Zod coordinate failures as blocking field-linked findings', () => {
    const result = deriveReportValidation(validTicket(), {
      formValues: validForm({ latitude: '-7.1', longitude: '' }),
    });

    expect(result.blocking).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'blocking',
          field: 'longitude',
          source: 'zod',
          message: 'Latitude and Longitude must be provided together.',
        }),
      ]),
    );
  });

  it('blocks impossible dispatch ordering while retaining minute-level derived time data', () => {
    const result = deriveReportValidation(
      validTicket({ dispatchAt: new Date('2026-08-26T09:55:00.000Z') }),
      { formValues: validForm({ dispatchAt: '2026-08-26T09:55' }) },
    );

    expect(result.blocking).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'DISPATCH_BEFORE_OCCUR', field: 'dispatchAt' }),
      ]),
    );
    expect(result.time.dispatchDelayMs).toBe(-5 * 60_000);
  });

  it('treats unresolved primary TT conflict as blocking and other import conflict as warning', () => {
    const result = deriveReportValidation(validTicket({ dispatchAt: null }), {
      formValues: validForm({ dispatchAt: '' }),
      importCandidate: {
        conflicts: [
          { severity: 'blocking', field: 'externalTtNumber', candidates: [{ value: 'INC-A' }] },
          { severity: 'warning', field: 'severity', candidates: [{ value: 'MAJOR' }] },
        ],
        warnings: ['Email Sent Time was not available; Dispatch Time needs review.'],
      },
    });

    expect(result.blocking).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'PRIMARY_TT_CONFLICT', field: 'title' }),
      ]),
    );
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'IMPORT_CONFLICT', field: 'severity' }),
        expect.objectContaining({ code: 'EMAIL_SENT_TIME_UNAVAILABLE', field: 'dispatchAt' }),
      ]),
    );
  });

  it('clears the primary TT blocker after explicit identity review while retaining other warnings', () => {
    const result = deriveReportValidation(validTicket(), {
      formValues: validForm(),
      resolvedPrimaryIdentity: true,
      importCandidate: {
        conflicts: [
          { severity: 'blocking', field: 'externalTtNumber', candidates: [{ value: 'INC-A' }] },
          { severity: 'warning', field: 'severity', candidates: [{ value: 'MAJOR' }] },
        ],
        warnings: [],
      },
    });

    expect(result.blocking.find((item) => item.code === 'PRIMARY_TT_CONFLICT')).toBeUndefined();
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'IMPORT_CONFLICT' })]),
    );
    expect(result.readyForRunning).toBe(true);
  });

  it('keeps missing Outlook Sent review after persistence until Dispatch Time is supplied manually', () => {
    const missingDispatch = deriveReportValidation(
      validTicket({
        dispatchAt: null,
        importProvenance: { sourceKind: 'outlook_msg', messageSentAt: null },
      }),
      { formValues: validForm({ dispatchAt: '' }) },
    );
    expect(missingDispatch.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'EMAIL_SENT_TIME_UNAVAILABLE' })]),
    );

    const reviewed = deriveReportValidation(
      validTicket({
        dispatchAt: new Date('2026-08-26T10:15:00.000Z'),
        importProvenance: { sourceKind: 'outlook_msg', messageSentAt: null },
      }),
      { formValues: validForm({ dispatchAt: '2026-08-26T10:15' }) },
    );
    expect(
      reviewed.warnings.find((item) => item.code === 'EMAIL_SENT_TIME_UNAVAILABLE'),
    ).toBeUndefined();
  });

  it('separates warning-only completeness from informational optional gaps', () => {
    const result = deriveReportValidation(
      validTicket({
        pic: '',
        rootcause: '',
        progress: [],
        coordinate: null,
        impactList: [],
        importProvenance: { sourceKind: 'outlook_msg' },
      }),
      { formValues: validForm({ pic: '', rootcause: '' }) },
    );

    expect(result.warnings.map((item) => item.code)).toEqual(
      expect.arrayContaining(['PIC_EMPTY', 'ROOTCAUSE_EMPTY', 'NO_PROGRESS']),
    );
    expect(result.informational.map((item) => item.code)).toEqual(
      expect.arrayContaining(['NO_COORDINATE', 'IMPACT_EMPTY', 'EMAIL_DESCRIPTION_UNAVAILABLE']),
    );
  });

  it('keeps duplicate detection advisory for the next phase', () => {
    const subject = validTicket();
    const result = deriveReportValidation(subject, {
      formValues: validForm(),
      duplicateCandidates: [{ ticketId: 'ticket-2' }],
    });

    expect(result.ticket).toBe(subject);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SUSPECTED_DUPLICATE', severity: 'warning' }),
      ]),
    );
    expect(result.readyForRunning).toBe(true);
  });

  it('decorates an existing validation snapshot with live duplicate candidates without adding blockers', () => {
    const base = deriveReportValidation(validTicket(), { formValues: validForm() });
    const decorated = withDuplicateCandidateFindings(base, [
      { id: 'ticket-2', duplicateEvidence: { level: 'critical', score: 100 } },
      { id: 'ticket-3', duplicateEvidence: { level: 'high', score: 70 } },
    ]);

    expect(decorated.blocking).toEqual(base.blocking);
    expect(decorated.readyForRunning).toBe(base.readyForRunning);
    expect(decorated.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'SUSPECTED_DUPLICATE',
          severity: 'warning',
          meta: { count: 2 },
        }),
      ]),
    );
    expect(decorated.counts.warning).toBe(base.counts.warning + 1);
  });
});
