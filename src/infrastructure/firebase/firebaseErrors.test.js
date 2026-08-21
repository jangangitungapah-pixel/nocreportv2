import { describe, expect, it } from 'vitest';

import {
  InfrastructureError,
  createInfrastructureError,
  normalizeFirebaseError,
} from './firebaseErrors.js';

describe('Firebase error normalization', () => {
  it('maps Firestore permission errors to the application contract', () => {
    const error = normalizeFirebaseError({ code: 'firestore/permission-denied' });

    expect(error).toBeInstanceOf(InfrastructureError);
    expect(error.code).toBe('PERMISSION_DENIED');
    expect(error.details).toEqual({ firebaseCode: 'firestore/permission-denied' });
  });

  it('maps modular Firestore permission errors without a service prefix', () => {
    const error = normalizeFirebaseError({ code: 'permission-denied' });

    expect(error.code).toBe('PERMISSION_DENIED');
    expect(error.details).toEqual({ firebaseCode: 'permission-denied' });
  });

  it('maps quota errors explicitly', () => {
    expect(normalizeFirebaseError({ code: 'firestore/resource-exhausted' }).code).toBe(
      'QUOTA_EXCEEDED',
    );
    expect(normalizeFirebaseError({ code: 'resource-exhausted' }).code).toBe('QUOTA_EXCEEDED');
  });

  it('maps Firestore failed preconditions explicitly', () => {
    expect(normalizeFirebaseError({ code: 'firestore/failed-precondition' }).code).toBe(
      'FIRESTORE_PRECONDITION',
    );
    expect(normalizeFirebaseError({ code: 'failed-precondition' }).code).toBe(
      'FIRESTORE_PRECONDITION',
    );
  });

  it('preserves an existing normalized infrastructure error', () => {
    const source = createInfrastructureError('STALE_REVISION', 'stale');
    expect(normalizeFirebaseError(source)).toBe(source);
  });

  it('uses the supplied fallback for unknown SDK failures', () => {
    expect(normalizeFirebaseError(new Error('unknown'), 'QUERY_ERROR').code).toBe('QUERY_ERROR');
  });
});
