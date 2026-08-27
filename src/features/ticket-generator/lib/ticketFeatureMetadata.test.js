import { describe, expect, it } from 'vitest';

import { createCandidateField, createImportCandidate } from './importCandidate.js';
import {
  createEditorFeatureMetadata,
  featureMetadataFromImportCandidate,
  importCandidateHasOperationalMetadata,
} from './ticketFeatureMetadata.js';

describe('Ticket schema-v2 operational metadata', () => {
  it('maps selected operational import evidence without raw email transport data', () => {
    const sentAt = new Date('2026-08-26T00:12:26.000Z');
    const candidate = createImportCandidate({
      source: {
        kind: 'outlook_msg',
        profileId: 'MANDAU_DEFAULT',
        sourceName: 'sanitized.msg',
        subject: '[MANDAU] LINK DOWN',
        messageSentAt: sentAt,
      },
      fields: {
        externalTtNumber: createCandidateField({
          value: 'DWDM-INC-20260825-00015373',
          source: 'subject',
          confidence: 'strong',
        }),
        incidentKey: createCandidateField({
          value: 'INC-20260825-00015373',
          source: 'inference',
          confidence: 'strong',
        }),
      },
      alarmContext: {
        rawAlarm: createCandidateField({
          value: 'Physical Port Down',
          source: 'body',
          confidence: 'exact',
        }),
        alarmFamily: createCandidateField({
          value: 'LINK_DOWN',
          source: 'inference',
          confidence: 'strong',
        }),
        transportFamily: createCandidateField({
          value: 'DWDM UJB',
          source: 'subject',
          confidence: 'strong',
        }),
        pathEndpoints: createCandidateField({
          value: ['NODE A', 'NODE B', 'NODE C'],
          source: 'subject',
          confidence: 'strong',
        }),
        pathKey: createCandidateField({
          value: 'NODE_A<>NODE_B<>NODE_C',
          source: 'inference',
          confidence: 'strong',
        }),
        externalTtReferences: createCandidateField({
          value: ['DWDM-INC-20260825-00015373', 'IOH-001'],
          source: 'inference',
          confidence: 'strong',
        }),
      },
    });

    expect(importCandidateHasOperationalMetadata(candidate)).toBe(true);
    const metadata = featureMetadataFromImportCandidate(candidate);

    expect(metadata).toMatchObject({
      externalTtNumber: 'DWDM-INC-20260825-00015373',
      titleMode: 'MANUAL',
      templateProfileId: 'MANDAU_DEFAULT',
      incidentKey: 'INC-20260825-00015373',
      pathKey: 'NODE_A<>NODE_B<>NODE_C',
      importProvenance: {
        sourceKind: 'outlook_msg',
        dispatchTimeSource: 'PR_CLIENT_SUBMIT_TIME',
        messageSentAt: sentAt,
      },
    });
    expect(metadata.alarmContext).toMatchObject({
      rawAlarm: 'Physical Port Down',
      alarmFamily: 'LINK_DOWN',
      transportFamily: 'DWDM UJB',
      pathEndpoints: ['NODE A', 'NODE B', 'NODE C'],
      externalTtReferences: ['DWDM-INC-20260825-00015373', 'IOH-001'],
    });
    expect(metadata).not.toHaveProperty('subject');
    expect(metadata).not.toHaveProperty('sourceName');
    expect(metadata).not.toHaveProperty('body');
    expect(metadata).not.toHaveProperty('attachments');
    expect(metadata.importProvenance).not.toHaveProperty('messageDeliveryTime');
  });

  it('keeps legacy schema-v1 Tickets readable with empty optional feature metadata', () => {
    const metadata = createEditorFeatureMetadata({
      schemaVersion: 1,
      title: 'Legacy Ticket',
      externalTtNumber: 'INC-20260818-00015849',
    });

    expect(metadata.externalTtNumber).toBe('INC-20260818-00015849');
    expect(metadata.titleMode).toBe('MANUAL');
    expect(metadata.templateProfileId).toBeNull();
    expect(metadata.incidentKey).toBeNull();
    expect(metadata.pathKey).toBeNull();
    expect(metadata.alarmContext.pathEndpoints).toEqual([]);
    expect(metadata.importProvenance).toBeNull();
  });
});
