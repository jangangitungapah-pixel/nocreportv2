export {
  CANDIDATE_CONFIDENCE,
  CANDIDATE_SOURCES,
  IMPORT_SOURCE_KINDS,
  createCandidateField,
  createImportCandidate,
  detectCandidateValueConflict,
} from './importCandidate.js';
export {
  buildPathKey,
  canonicalizePathEndpoint,
  deriveOperationalIdentity,
  normalizeAlarm,
  normalizeExternalTtReference,
  normalizeIncidentKey,
  normalizeOperationalText,
  parsePathEndpoints,
} from './operationalNormalization.js';
export {
  MANDAU_DEFAULT_PROFILE,
  TEMPLATE_PROFILE_IDS,
  getTemplateProfile,
  requireTemplateProfile,
} from './templateProfiles.js';
export {
  TICKET_SCHEMA_VERSION_V2,
  buildTicketSchemaV2Proposal,
  createEmptyAlarmContext,
  normalizeTicketFeatureMetadata,
} from './ticketSchemaV2Contract.js';
