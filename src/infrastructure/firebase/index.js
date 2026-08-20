export { getAuthClient } from './authClient.js';
export {
  getFirebaseConfigStatus,
  readEmulatorConfig,
  readFirebaseConfig,
  shouldUseFirebaseEmulators,
} from './firebaseConfig.js';
export {
  InfrastructureError,
  createInfrastructureError,
  normalizeFirebaseError,
} from './firebaseErrors.js';
export { getFirebaseApp } from './firebaseApp.js';
export { getFirestoreClient } from './firestoreClient.js';
export {
  archiveTicket,
  firestoreTicketRepository,
  restoreTicket,
} from './firestoreTicketRepository.js';
