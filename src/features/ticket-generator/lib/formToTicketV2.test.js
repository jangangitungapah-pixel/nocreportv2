import { describe, expect, it } from 'vitest';

import { TICKET_STATUS } from '../../../entities/ticket/index.js';
import { DEFAULT_TICKET_FORM, buildTicketFromForm } from './formToTicket.js';

describe('Generator schema-v2 identity composition', () => {
  it('lets an explicit TT in the edited Title override stale imported primary identity', () => {
    const ticket = buildTicketFromForm(
      {
        ...DEFAULT_TICKET_FORM,
        title: '[MANDAU] MANUAL TITLE [TT : INC-20260826-00000054]',
      },
      {
        status: TICKET_STATUS.DRAFT,
        featureMetadata: {
          externalTtNumber: 'DWDM-INC-20260825-00015373',
          incidentKey: 'INC-20260825-00015373',
          templateProfileId: 'MANDAU_DEFAULT',
        },
      },
    );

    expect(ticket.externalTtNumber).toBe('INC-20260826-00000054');
    expect(ticket.incidentKey).toBe('INC-20260826-00000054');
  });

  it('falls back to structured import identity when the Title has no TT token', () => {
    const ticket = buildTicketFromForm(
      {
        ...DEFAULT_TICKET_FORM,
        title: '[MANDAU] LINK DOWN AT DWDM NODE_A <> NODE_B',
      },
      {
        status: TICKET_STATUS.DRAFT,
        featureMetadata: {
          externalTtNumber: 'DWDM-INC-20260825-00015373',
          incidentKey: 'INC-20260825-00015373',
          templateProfileId: 'MANDAU_DEFAULT',
        },
      },
    );

    expect(ticket.externalTtNumber).toBe('DWDM-INC-20260825-00015373');
    expect(ticket.incidentKey).toBe('INC-20260825-00015373');
  });
});
