import { describe, expect, it } from 'vitest';

import {
  TICKET_SCHEMA_VERSION_V2,
  buildTicketSchemaV2Proposal,
  normalizeTicketFeatureMetadata,
} from './ticketSchemaV2Contract.js';

describe('Ticket schema-v2 feature contract proposal', () => {
  it('reads a schema-v1 Ticket with safe optional feature defaults without mutating it', () => {
    const legacy = Object.freeze({
      schemaVersion: 1,
      title: 'Legacy Ticket',
      externalTtNumber: 'INC-20260826-00000054',
    });

    const metadata = normalizeTicketFeatureMetadata(legacy);

    expect(legacy).toEqual({
      schemaVersion: 1,
      title: 'Legacy Ticket',
      externalTtNumber: 'INC-20260826-00000054',
    });
    expect(metadata).toMatchObject({
      templateProfileId: null,
      incidentKey: null,
      pathKey: null,
      importProvenance: null,
      incidentGroupId: null,
    });
    expect(metadata.alarmContext.pathEndpoints).toEqual([]);
    expect(metadata.alarmContext.externalTtReferences).toEqual([]);
  });

  it('builds a non-persisted schema-v2 proposal with derived incident/path/alarm identity', () => {
    const proposal = buildTicketSchemaV2Proposal({
      schemaVersion: 1,
      title: 'Example',
      externalTtNumber: 'DWDM-INC-20260825-00015072',
      templateProfileId: 'MANDAU_DEFAULT',
      alarmContext: {
        rawAlarm: 'Physical Port Down',
        pathEndpoints: ['NODE A', 'NODE B', 'NODE C'],
        externalTtReferences: ['IOH-001', 'H3I-002'],
      },
    });

    expect(proposal.schemaVersion).toBe(TICKET_SCHEMA_VERSION_V2);
    expect(proposal.incidentKey).toBe('INC-20260825-00015072');
    expect(proposal.pathKey).toBe('NODE_A<>NODE_B<>NODE_C');
    expect(proposal.alarmContext).toMatchObject({
      rawAlarm: 'Physical Port Down',
      alarmFamily: 'LINK_DOWN',
      pathEndpoints: ['NODE A', 'NODE B', 'NODE C'],
      externalTtReferences: ['IOH-001', 'H3I-002'],
    });
  });
});
