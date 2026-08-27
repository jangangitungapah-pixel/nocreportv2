import { describe, expect, it } from 'vitest';

import { buildAndFormatHandoverSummary, buildHandoverSummaryModel } from './handoverSummary.js';

describe('handoverSummary', () => {
  it('builds a deterministic operator handover from current Ticket state', () => {
    const occurAt = new Date(2026, 7, 26, 10, 0);
    const now = new Date(2026, 7, 26, 12, 30);
    const progress = [
      { id: 'p1', occurredAt: new Date(2026, 7, 26, 10, 15), text: 'dispatch team' },
      { id: 'p2', occurredAt: new Date(2026, 7, 26, 10, 45), text: 'team arrived' },
      { id: 'p3', occurredAt: new Date(2026, 7, 26, 11, 20), text: 'OTDR running' },
      { id: 'p4', occurredAt: new Date(2026, 7, 26, 12, 5), text: 'jointing preparation' },
    ];

    const model = buildHandoverSummaryModel(
      {
        externalTtNumber: 'INC-20260826-00000001',
        status: 'RUNNING',
        occurAt,
        pic: 'Team Majalengka',
        rootcause: 'FO cut',
        cutPoint: 'KM 24',
        progress,
      },
      {
        now,
        relatedTicketCount: 2,
        validationFindings: [
          { severity: 'warning', message: 'Rootcause needs confirmation.' },
          { severity: 'blocking', message: 'Blocking finding is not a handover warning.' },
          { severity: 'warning', message: 'No coordinate recorded.' },
        ],
      },
    );

    expect(model.recentProgress.map((entry) => entry.text)).toEqual([
      'team arrived',
      'OTDR running',
      'jointing preparation',
    ]);
    expect(model.latestProgress.text).toBe('jointing preparation');
    expect(model.durationMs).toBe(2.5 * 60 * 60 * 1000);
    expect(model.warnings).toEqual(['Rootcause needs confirmation.', 'No coordinate recorded.']);
    expect(model.relatedTicketCount).toBe(2);

    const output = buildAndFormatHandoverSummary(
      {
        externalTtNumber: 'INC-20260826-00000001',
        status: 'RUNNING',
        occurAt,
        pic: 'Team Majalengka',
        rootcause: 'FO cut',
        cutPoint: 'KM 24',
        progress,
      },
      {
        now,
        relatedTicketCount: 2,
        validationFindings: model.warnings.map((message) => ({ severity: 'warning', message })),
      },
    );

    expect(output).toContain('TT: INC-20260826-00000001');
    expect(output).toContain('Occur Time: 26/08/2026 10:00');
    expect(output).toContain('Duration: 2h 30m');
    expect(output).toContain('Latest Progress: 12:05 jointing preparation');
    expect(output).toContain('Related Tickets: 2');
    expect(output).toContain('- Rootcause needs confirmation.');
    expect(output).not.toContain('dispatch team');
  });

  it('uses explicit empty markers and never invents missing operational data', () => {
    const output = buildAndFormatHandoverSummary({}, { now: new Date(2026, 7, 26, 12, 0) });

    expect(output).toContain('TT: —');
    expect(output).toContain('Occur Time: —');
    expect(output).toContain('Duration: —');
    expect(output).toContain('PIC: —');
    expect(output).toContain('Latest Progress: —');
    expect(output).toContain('Related Tickets: 0');
    expect(output).not.toContain('Recent Progress:');
    expect(output).not.toContain('Warnings:');
  });
});
