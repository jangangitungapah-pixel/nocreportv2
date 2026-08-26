export { createEmptyTicket, normalizeTicket, TICKET_TITLE_MODE } from './model/ticket.js';
export {
  TICKET_STATUS,
  isTicketStatus,
  validateExpectedRevision,
  validateRunningRequirements,
  validateTicketTransition,
} from './lib/status.js';
export { extractExternalTicketNumber } from './lib/tt-number.js';
export {
  createProgressEntry,
  formatDateTime,
  formatProgressTime,
  sortProgressTimeline,
} from './lib/timeline.js';
export { formatTicketReport } from './lib/report.js';
export {
  formatCoordinatePair,
  normalizeCoordinates,
  parseCoordinateText,
  validateCoordinatePair,
} from './lib/coordinates.js';
export {
  REVISION_DIFF_ALARM_FIELDS,
  REVISION_DIFF_FIELDS,
  buildOperationalRevisionDiff,
  buildTicketUpdatedAuditDetails,
} from './lib/revision-diff.js';
