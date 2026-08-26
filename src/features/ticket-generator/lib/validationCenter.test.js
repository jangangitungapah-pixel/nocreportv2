import { describe, expect, it } from 'vitest';

import { createEmptyTicket } from '../../../entities/ticket/index.js';
import { deriveReportValidation } from './validationCenter.js';

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
    const result = deriveReportValidation(validTicket(), {
      formValues: validForm(),
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
    const result = deriveReportValidation(validTicket(), {
      formValues: validForm(),
      duplicateCandidates: [{ ticketId: 'ticket-2' }],
    });

    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SUSPECTED_DUPLICATE', severity: 'warning' }),
      ]),
    );
    expect(result.readyForRunning).toBe(true);
  });
});
