import { describe, expect, it } from 'vitest';

import { TICKET_STATUS } from '../../../entities/ticket/index.js';
import {
  DUPLICATE_EVIDENCE_LEVEL,
  PATH_PROXIMITY_WINDOW_MS,
  rankDuplicateCandidates,
  scoreDuplicateCandidate,
} from './duplicateDetection.js';

function ticket(overrides = {}) {
  return {
    id: overrides.id ?? 'ticket-a',
    title: '[MANDAU] LINK DOWN AT DWDM NODE_A <> NODE_B [TT : INC-20260826-00000001]',
    externalTtNumber: 'INC-20260826-00000001',
    incidentKey: 'INC-20260826-00000001',
    pathKey: 'NODE_A<>NODE_B',
    status: TICKET_STATUS.RUNNING,
    occurAt: new Date('2026-08-26T12:00:00.000Z'),
    updatedAt: new Date('2026-08-26T12:10:00.000Z'),
    alarmContext: {
      siteId: 'NODE_A',
      alarmFamily: 'LINK_DOWN',
      emsAlarmNo: 'EMS-001',
    },
    ...overrides,
  };
}

describe('scoreDuplicateCandidate', () => {
  it('treats exact external TT and canonical incident identity as critical evidence', () => {
    const result = scoreDuplicateCandidate(ticket(), ticket({ id: 'ticket-b' }));

    expect(result.level).toBe(DUPLICATE_EVIDENCE_LEVEL.CRITICAL);
    expect(result.reasons.map((reason) => reason.code)).toEqual(
      expect.arrayContaining(['EXACT_EXTERNAL_TT', 'SAME_INCIDENT_KEY']),
    );
  });

  it('treats same path within fifteen minutes as high evidence without requiring the same TT', () => {
    const candidate = ticket({
      id: 'ticket-b',
      externalTtNumber: 'INC-20260826-00000099',
      incidentKey: 'INC-20260826-00000099',
      occurAt: new Date('2026-08-26T12:14:59.000Z'),
      status: TICKET_STATUS.RESOLVED,
    });

    const result = scoreDuplicateCandidate(ticket(), candidate);

    expect(result.level).toBe(DUPLICATE_EVIDENCE_LEVEL.HIGH);
    expect(result.reasons.map((reason) => reason.code)).toContain('PATH_TIME_PROXIMITY');
  });

  it('does not award the close-path reason outside the fifteen minute window', () => {
    const candidate = ticket({
      id: 'ticket-b',
      externalTtNumber: 'INC-20260826-00000099',
      incidentKey: 'INC-20260826-00000099',
      occurAt: new Date(ticket().occurAt.getTime() + PATH_PROXIMITY_WINDOW_MS + 1),
      status: TICKET_STATUS.RESOLVED,
      title: 'Totally different incident wording',
      alarmContext: { siteId: 'OTHER', alarmFamily: 'ETH_LOS', emsAlarmNo: 'EMS-999' },
    });

    const result = scoreDuplicateCandidate(ticket(), candidate);
    expect(result.reasons.map((reason) => reason.code)).not.toContain('PATH_TIME_PROXIMITY');
  });

  it('treats an active same-path Ticket as high evidence even when occurrence time is distant', () => {
    const candidate = ticket({
      id: 'ticket-b',
      externalTtNumber: 'INC-20260825-00000099',
      incidentKey: 'INC-20260825-00000099',
      occurAt: new Date('2026-08-25T00:00:00.000Z'),
      status: TICKET_STATUS.DRAFT,
      title: 'Different title entirely',
      alarmContext: { siteId: 'OTHER', alarmFamily: 'ETH_LOS', emsAlarmNo: 'EMS-999' },
    });

    const result = scoreDuplicateCandidate(ticket(), candidate);
    expect(result.level).toBe(DUPLICATE_EVIDENCE_LEVEL.HIGH);
    expect(result.reasons.map((reason) => reason.code)).toContain('ACTIVE_SAME_PATH');
  });

  it('uses Site ID + alarm family + close occurrence as medium evidence', () => {
    const candidate = ticket({
      id: 'ticket-b',
      externalTtNumber: 'INC-20260826-00000099',
      incidentKey: 'INC-20260826-00000099',
      pathKey: 'OTHER_A<>OTHER_B',
      occurAt: new Date('2026-08-26T12:20:00.000Z'),
      status: TICKET_STATUS.RESOLVED,
      title: 'Different title entirely',
      alarmContext: { siteId: 'node_a', alarmFamily: 'link_down', emsAlarmNo: 'EMS-999' },
    });

    const result = scoreDuplicateCandidate(ticket(), candidate);
    expect(result.level).toBe(DUPLICATE_EVIDENCE_LEVEL.MEDIUM);
    expect(result.reasons.map((reason) => reason.code)).toContain('SITE_ALARM_TIME_PROXIMITY');
  });

  it('never treats a different EMS Alarm Number as proof of a different physical incident', () => {
    const candidate = ticket({ id: 'ticket-b' });
    candidate.alarmContext = { ...candidate.alarmContext, emsAlarmNo: 'EMS-DIFFERENT' };

    const result = scoreDuplicateCandidate(ticket(), candidate);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.some((reason) => /EMS/i.test(reason.code))).toBe(false);
  });
});

describe('rankDuplicateCandidates', () => {
  it('orders stronger evidence before weaker evidence and removes the current Ticket', () => {
    const target = ticket();
    const candidates = [
      ticket({
        id: 'weak',
        externalTtNumber: 'INC-20260826-99999999',
        incidentKey: 'INC-20260826-99999999',
        pathKey: 'OTHER<>PATH',
        status: TICKET_STATUS.RESOLVED,
        alarmContext: { siteId: 'OTHER', alarmFamily: 'ETH_LOS', emsAlarmNo: 'EMS-X' },
      }),
      ticket({ id: 'critical' }),
      ticket({ id: 'ticket-a' }),
    ];

    const ranked = rankDuplicateCandidates(target, candidates, { excludeTicketId: 'ticket-a' });
    expect(ranked[0].id).toBe('critical');
    expect(ranked.some((candidate) => candidate.id === 'ticket-a')).toBe(false);
  });

  it('de-duplicates candidate ids and enforces a bounded result limit', () => {
    const target = ticket();
    const candidates = Array.from({ length: 30 }, (_, index) =>
      ticket({ id: `candidate-${index}` }),
    );
    candidates.push(ticket({ id: 'candidate-0' }));

    const ranked = rankDuplicateCandidates(target, candidates, { limit: 5 });
    expect(ranked).toHaveLength(5);
    expect(new Set(ranked.map((candidate) => candidate.id)).size).toBe(5);
  });
});
