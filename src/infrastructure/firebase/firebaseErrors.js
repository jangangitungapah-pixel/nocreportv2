const FIREBASE_ERROR_MAP = Object.freeze({
  'auth/invalid-credential': 'AUTH_FAILED',
  'auth/user-disabled': 'ACCOUNT_DISABLED',
  'auth/network-request-failed': 'NETWORK_ERROR',
  'firestore/permission-denied': 'PERMISSION_DENIED',
  'firestore/unauthenticated': 'AUTH_REQUIRED',
  'firestore/unavailable': 'NETWORK_ERROR',
  'firestore/not-found': 'NOT_FOUND',
  'firestore/already-exists': 'CONFLICT',
  'firestore/deadline-exceeded': 'NETWORK_ERROR',
});

export class InfrastructureError extends Error {
  constructor(code, message, { cause = null, details = null } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'InfrastructureError';
    this.code = code;
    this.details = details;
  }
}

export function createInfrastructureError(code, message, options) {
  return new InfrastructureError(code, message, options);
}

export function normalizeFirebaseError(error, fallbackCode = 'PERSISTENCE_ERROR') {
  if (error instanceof InfrastructureError) {
    return error;
  }

  const firebaseCode = String(error?.code ?? '');
  const code = FIREBASE_ERROR_MAP[firebaseCode] ?? fallbackCode;

  return new InfrastructureError(code, 'The Firebase operation could not be completed.', {
    cause: error instanceof Error ? error : null,
    details: firebaseCode ? { firebaseCode } : null,
  });
}
