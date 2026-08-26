import { TICKET_TITLE_MODE } from '../../../entities/ticket/index.js';
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

function normalizeImportProvenance(value) {
  if (!value || typeof value !== 'object') return null;
  const sourceKind = typeof value.sourceKind === 'string' ? value.sourceKind.trim() : '';
  const dispatchTimeSource =
    typeof value.dispatchTimeSource === 'string' ? value.dispatchTimeSource.trim() : '';
  const messageSentAt = value.messageSentAt ?? null;
  if (!sourceKind && !dispatchTimeSource && !messageSentAt) return null;
  return {
    sourceKind: sourceKind || null,
    dispatchTimeSource: dispatchTimeSource || null,
    messageSentAt,
  };
}

export function normalizeTicketFeatureMetadata(ticket = {}) {
  return {
    titleMode:
      ticket.titleMode === TICKET_TITLE_MODE.GENERATED
        ? TICKET_TITLE_MODE.GENERATED
        : TICKET_TITLE_MODE.MANUAL,
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
    importProvenance: normalizeImportProvenance(ticket.importProvenance),
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
