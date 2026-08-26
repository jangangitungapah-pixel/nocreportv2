import { describe, expect, it } from 'vitest';

import {
  REVISION_DIFF_ALARM_FIELDS,
  buildOperationalRevisionDiff,
  buildTicketUpdatedAuditDetails,
} from './ticketRevisionDiff.js';

describe('ticketRevisionDiff', () => {
  it('captures compact operational changes with normalized timestamps', () => {
    const previous = {
      title: 'Old title',
      pic: 'Team A',
      occurAt: new Date('2026-08-26T12:00:00.000Z'),
      impactList: ['SITE_A'],
      alarmContext: { severity: 'MAJOR', pathEndpoints: ['A', 'B'] },
    };
    const next = {
      ...previous,
      title: 'New title',
      pic: 'Team B',
      occurAt: new Date('2026-08-26T12:05:00.000Z'),
      impactList: ['SITE_A', 'SITE_B'],
      alarmContext: { severity: 'CRITICAL', pathEndpoints: ['A', 'B'] },
    };

    expect(buildOperationalRevisionDiff(previous, next)).toEqual({
      title: { from: 'Old title', to: 'New title' },
      impactList: { from: ['SITE_A'], to: ['SITE_A', 'SITE_B'] },
      occurAt: {
        from: '2026-08-26T12:00:00.000Z',
        to: '2026-08-26T12:05:00.000Z',
      },
      pic: { from: 'Team A', to: 'Team B' },
      'alarmContext.severity': { from: 'MAJOR', to: 'CRITICAL' },
    });
  });

  it('excludes raw source text plus fields with dedicated audit semantics', () => {
    const previous = {
      status: 'DRAFT',
      coordinate: null,
      progress: [],
      alarmContext: { rawAlarm: 'private old body line', description: 'private old description' },
    };
    const next = {
      status: 'RUNNING',
      coordinate: { latitude: -6.2, longitude: 106.8 },
      progress: [{ text: 'progress should stay dedicated' }],
      alarmContext: { rawAlarm: 'private new body line', description: 'private new description' },
    };

    const changes = buildOperationalRevisionDiff(previous, next);
    expect(changes).toEqual({});
    expect(REVISION_DIFF_ALARM_FIELDS).not.toContain('rawAlarm');
    expect(REVISION_DIFF_ALARM_FIELDS).not.toContain('description');
    expect(JSON.stringify(changes)).not.toContain('private');
    expect(JSON.stringify(changes)).not.toContain('progress should stay dedicated');
  });

  it('emits revision boundaries around the compact change map', () => {
    expect(
      buildTicketUpdatedAuditDetails({
        previousTicket: { cutPoint: 'A' },
        nextTicket: { cutPoint: 'B' },
        revisionFrom: 8,
        revisionTo: 9,
      }),
    ).toEqual({
      revisionFrom: 8,
      revisionTo: 9,
      details: {
        changes: {
          cutPoint: { from: 'A', to: 'B' },
        },
      },
    });
  });

  it('bounds large text and array values before they enter audit history', () => {
    const changes = buildOperationalRevisionDiff(
      { rootcause: '', impactList: [] },
      {
        rootcause: 'x'.repeat(1500),
        impactList: Array.from({ length: 150 }, (_, index) => `SITE_${index}`),
      },
    );

    expect(changes.rootcause.to).toHaveLength(1000);
    expect(changes.impactList.to).toHaveLength(100);
  });
});
