import { describe, expect, it } from 'vitest';

import { TICKET_TITLE_MODE, createEmptyTicket } from './index.js';

describe('Ticket schema-v2 production defaults', () => {
  it('creates new Tickets as schema v2 with safe optional metadata defaults', () => {
    const ticket = createEmptyTicket({
      title: '[MANDAU] LINK DOWN [TT : INC-20260826-00000054]',
    });

    expect(ticket.schemaVersion).toBe(2);
    expect(ticket.titleMode).toBe(TICKET_TITLE_MODE.MANUAL);
    expect(ticket.externalTtNumber).toBe('INC-20260826-00000054');
    expect(ticket.templateProfileId).toBeNull();
    expect(ticket.pathKey).toBeNull();
    expect(ticket.alarmContext.pathEndpoints).toEqual([]);
    expect(ticket.importProvenance).toBeNull();
  });

  it('keeps explicitly loaded schema-v1 Tickets readable as schema v1', () => {
    const legacy = createEmptyTicket({
      schemaVersion: 1,
      title: 'Legacy Ticket',
      externalTtNumber: 'INC-20260818-00015849',
    });

    expect(legacy.schemaVersion).toBe(1);
    expect(legacy.externalTtNumber).toBe('INC-20260818-00015849');
    expect(legacy.alarmContext.pathEndpoints).toEqual([]);
    expect(legacy.importProvenance).toBeNull();
  });

  it('normalizes v2 metadata while preserving raw alarm text and endpoint order', () => {
    const sentAt = new Date('2026-08-26T00:12:26.000Z');
    const ticket = createEmptyTicket({
      schemaVersion: 2,
      titleMode: TICKET_TITLE_MODE.GENERATED,
      templateProfileId: 'MANDAU_DEFAULT',
      incidentKey: 'INC-20260825-00015373',
      pathKey: 'NODE_A<>NODE_B<>NODE_C',
      alarmContext: {
        rawAlarm: '  Physical Port Down  ',
        alarmFamily: 'LINK_DOWN',
        transportFamily: 'DWDM UJB',
        pathEndpoints: [' NODE A ', 'NODE B', ' NODE C'],
        externalTtReferences: [' DWDM-INC-20260825-00015373 '],
      },
      importProvenance: {
        sourceKind: 'outlook_msg',
        dispatchTimeSource: 'PR_CLIENT_SUBMIT_TIME',
        messageSentAt: sentAt,
      },
    });

    expect(ticket.schemaVersion).toBe(2);
    expect(ticket.titleMode).toBe(TICKET_TITLE_MODE.GENERATED);
    expect(ticket.alarmContext.rawAlarm).toBe('Physical Port Down');
    expect(ticket.alarmContext.pathEndpoints).toEqual(['NODE A', 'NODE B', 'NODE C']);
    expect(ticket.alarmContext.externalTtReferences).toEqual(['DWDM-INC-20260825-00015373']);
    expect(ticket.importProvenance).toEqual({
      sourceKind: 'outlook_msg',
      dispatchTimeSource: 'PR_CLIENT_SUBMIT_TIME',
      messageSentAt: sentAt,
    });
  });
});
