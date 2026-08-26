import { deriveOperationalIdentity, normalizeAlarm } from './operationalNormalization.js';

export const TICKET_SCHEMA_VERSION_V2 = 2;

export function createEmptyAlarmContext() {
  return {
    rawAlarm: '',
    alarmFamily: null,
    alarmSource: '',
    emsAlarmNo: '',
    siteId: '',
    siteName: '',
    severity: '',
    sourceStatus: '',
    dispatchTo: '',
    region: '',
    description: '',
    lastLinkFlapped: '',
    transportFamily: '',
    pathEndpoints: [],
    externalTtReferences: [],
  };
}

export function normalizeTicketFeatureMetadata(ticket = {}) {
  return {
    templateProfileId: ticket.templateProfileId ?? null,
    incidentKey: ticket.incidentKey ?? null,
    pathKey: ticket.pathKey ?? null,
    alarmContext: {
      ...createEmptyAlarmContext(),
      ...(ticket.alarmContext ?? {}),
      pathEndpoints: Array.isArray(ticket.alarmContext?.pathEndpoints)
        ? [...ticket.alarmContext.pathEndpoints]
        : [],
      externalTtReferences: Array.isArray(ticket.alarmContext?.externalTtReferences)
        ? [...ticket.alarmContext.externalTtReferences]
        : [],
    },
    importProvenance: ticket.importProvenance ? { ...ticket.importProvenance } : null,
    incidentGroupId: ticket.incidentGroupId ?? null,
  };
}

export function buildTicketSchemaV2Proposal(ticket = {}) {
  const metadata = normalizeTicketFeatureMetadata(ticket);
  const pathEndpoints = metadata.alarmContext.pathEndpoints;
  const identity = deriveOperationalIdentity({
    externalTtNumber: ticket.externalTtNumber,
    pathEndpoints,
  });
  const normalizedAlarm = normalizeAlarm(metadata.alarmContext.rawAlarm);

  return {
    ...ticket,
    schemaVersion: TICKET_SCHEMA_VERSION_V2,
    ...metadata,
    incidentKey: metadata.incidentKey ?? identity.incidentKey,
    pathKey: metadata.pathKey ?? identity.pathKey,
    alarmContext: {
      ...metadata.alarmContext,
      rawAlarm: normalizedAlarm.rawAlarm,
      alarmFamily: metadata.alarmContext.alarmFamily ?? normalizedAlarm.alarmFamily,
    },
  };
}
