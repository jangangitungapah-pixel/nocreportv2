import { describe, expect, it } from 'vitest';

import { formatTicketReport } from '../../../entities/ticket/index.js';
import {
  COPY_TARGET_IDS,
  COPY_TARGETS,
  buildCopyCenterTargets,
  formatCopyTarget,
  isCopyTargetId,
} from './copyCenter.js';

describe('copyCenter', () => {
  const ticket = {
    title: '[MANDAU] LINK DOWN NODE_A <> NODE_B [TT : INC-20260826-00000001]',
    externalTtNumber: 'INC-20260826-00000001',
    status: 'RUNNING',
    impactList: ['SERVICE_A', 'SERVICE_B'],
    occurAt: new Date(2026, 7, 26, 10, 0),
    dispatchAt: new Date(2026, 7, 26, 10, 5),
    pic: 'Team A',
    rootcause: 'FO cut',
    cutPoint: 'KM 24',
    coordinate: { latitude: -6.123456, longitude: 107.654321 },
    progress: [
      { id: 'p2', occurredAt: new Date(2026, 7, 26, 11, 30), text: 'OTDR complete' },
      { id: 'p1', occurredAt: new Date(2026, 7, 26, 10, 30), text: 'team OTW' },
    ],
    alarmContext: {
      rawAlarm: 'LINK_DOWN',
      alarmFamily: 'LINK_DOWN',
      alarmSource: 'NMS',
      emsAlarmNo: 'EMS-001',
      siteId: 'SITE_A',
      siteName: 'Node A',
      severity: 'Critical',
      dispatchTo: 'FIELD_TEAM',
      region: 'WEST JAVA',
      transportFamily: 'DWDM',
      pathEndpoints: ['NODE_A', 'NODE_B'],
    },
    importProvenance: {
      sourceKind: 'outlook_msg',
      dispatchTimeSource: 'PR_CLIENT_SUBMIT_TIME',
    },
  };

  it('exposes the required Copy Center target inventory in stable order', () => {
    expect(COPY_TARGETS.map((target) => target.id)).toEqual([
      'full_report',
      'title',
      'impact',
      'latest_progress',
      'progress_timeline',
      'coordinate',
      'primary_tt',
      'handover',
      'operational_source',
    ]);
    expect(COPY_TARGETS).toHaveLength(9);
    expect(isCopyTargetId(COPY_TARGET_IDS.HANDOVER)).toBe(true);
    expect(isCopyTargetId('delete_ticket')).toBe(false);
  });

  it('formats every copy target through deterministic non-JSX formatters', () => {
    const now = new Date(2026, 7, 26, 12, 0);

    expect(formatCopyTarget(COPY_TARGET_IDS.FULL_REPORT, ticket)).toBe(formatTicketReport(ticket));
    expect(formatCopyTarget(COPY_TARGET_IDS.TITLE, ticket)).toBe(ticket.title);
    expect(formatCopyTarget(COPY_TARGET_IDS.IMPACT, ticket)).toBe(
      'Impact List : SERVICE_A, SERVICE_B',
    );
    expect(formatCopyTarget(COPY_TARGET_IDS.LATEST_PROGRESS, ticket)).toBe('11:30 OTDR complete');
    expect(formatCopyTarget(COPY_TARGET_IDS.PROGRESS_TIMELINE, ticket)).toBe(
      '10:30 team OTW\n11:30 OTDR complete',
    );
    expect(formatCopyTarget(COPY_TARGET_IDS.COORDINATE, ticket)).toBe('-6.12346, 107.65432');
    expect(formatCopyTarget(COPY_TARGET_IDS.PRIMARY_TT, ticket)).toBe('INC-20260826-00000001');
    expect(
      formatCopyTarget(COPY_TARGET_IDS.HANDOVER, ticket, {
        now,
        relatedTicketCount: 1,
        validationFindings: [{ severity: 'warning', message: 'Coordinate needs review.' }],
      }),
    ).toContain('Related Tickets: 1');

    const operational = formatCopyTarget(COPY_TARGET_IDS.OPERATIONAL_SOURCE, ticket);
    expect(operational).toContain('Source: outlook_msg');
    expect(operational).toContain('Alarm: LINK_DOWN');
    expect(operational).toContain('Path: NODE_A <> NODE_B');
    expect(operational).not.toContain('[object Object]');
  });

  it('marks unavailable optional targets without fabricating content', () => {
    const targets = buildCopyCenterTargets({ title: 'Only title' }, { now: new Date() });
    const byId = Object.fromEntries(targets.map((target) => [target.id, target]));

    expect(byId.title.available).toBe(true);
    expect(byId.impact.available).toBe(false);
    expect(byId.coordinate.available).toBe(false);
    expect(byId.primary_tt.available).toBe(false);
    expect(formatCopyTarget('unknown_target', ticket)).toBe('');
  });
});
