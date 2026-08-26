import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = vi.hoisted(() => ({
  findDuplicateTicketCandidates: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/firestoreTicketRepository.js', () => ({
  findDuplicateTicketCandidates: repositoryMocks.findDuplicateTicketCandidates,
}));

import { findDuplicateCandidates } from './duplicateDetectionService.js';

describe('GEN-F5 bounded duplicate lookup service', () => {
  beforeEach(() => {
    repositoryMocks.findDuplicateTicketCandidates.mockReset();
  });

  it('skips Firestore entirely when the draft has no justified duplicate lookup signal', async () => {
    await expect(findDuplicateCandidates({ title: '', occurAt: null })).resolves.toEqual([]);
    expect(repositoryMocks.findDuplicateTicketCandidates).not.toHaveBeenCalled();
  });

  it('caps the repository candidate read at 32 and ranks only advisory evidence', async () => {
    const target = {
      title: '[MANDAU] LINK DOWN NODE_A <> NODE_B',
      externalTtNumber: 'INC-20260826-00000123',
      incidentKey: 'INC-20260826-00000123',
      pathKey: 'NODE_A<>NODE_B',
      occurAt: new Date('2026-08-26T12:00:00.000Z'),
      alarmContext: { siteId: '', alarmFamily: null },
    };
    repositoryMocks.findDuplicateTicketCandidates.mockResolvedValue([
      {
        id: 'ticket-existing',
        title: target.title,
        externalTtNumber: target.externalTtNumber,
        incidentKey: target.incidentKey,
        pathKey: target.pathKey,
        occurAt: new Date('2026-08-26T12:05:00.000Z'),
        updatedAt: new Date('2026-08-26T12:06:00.000Z'),
        status: 'RUNNING',
        alarmContext: { siteId: '', alarmFamily: null },
      },
    ]);

    const result = await findDuplicateCandidates(target, {
      excludeTicketId: 'ticket-current',
      limit: 99,
    });

    expect(repositoryMocks.findDuplicateTicketCandidates).toHaveBeenCalledWith({
      ticket: target,
      excludeTicketId: 'ticket-current',
      limit: 32,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'ticket-existing',
      duplicateEvidence: {
        level: 'critical',
      },
    });
    expect(result[0].duplicateEvidence.reasons.map((reason) => reason.code)).toContain(
      'EXACT_EXTERNAL_TT',
    );
  });
});
