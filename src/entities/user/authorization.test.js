import { describe, expect, it } from 'vitest';

import {
  CAPABILITY,
  USER_ROLE,
  canArchiveTicket,
  canCreateTicket,
  canMutateTicket,
  hasCapability,
  isOperationalRole,
} from './authorization.js';

describe('authorization capability matrix', () => {
  it('keeps persisted operational roles explicit', () => {
    expect(isOperationalRole(USER_ROLE.ADMIN)).toBe(true);
    expect(isOperationalRole(USER_ROLE.OPERATOR)).toBe(true);
    expect(isOperationalRole(USER_ROLE.VIEWER)).toBe(true);
    expect(isOperationalRole(USER_ROLE.LOCAL_DEV)).toBe(false);
    expect(isOperationalRole('UNKNOWN')).toBe(false);
  });

  it('allows Admin to perform administrative and operational actions', () => {
    expect(canCreateTicket(USER_ROLE.ADMIN)).toBe(true);
    expect(canMutateTicket(USER_ROLE.ADMIN)).toBe(true);
    expect(canArchiveTicket(USER_ROLE.ADMIN)).toBe(true);
    expect(hasCapability(USER_ROLE.ADMIN, CAPABILITY.MANAGE_USERS)).toBe(true);
  });

  it('allows Operator operational writes but not administrative mutations', () => {
    expect(canCreateTicket(USER_ROLE.OPERATOR)).toBe(true);
    expect(canMutateTicket(USER_ROLE.OPERATOR)).toBe(true);
    expect(canArchiveTicket(USER_ROLE.OPERATOR)).toBe(false);
    expect(hasCapability(USER_ROLE.OPERATOR, CAPABILITY.MANAGE_USERS)).toBe(false);
  });

  it('keeps Viewer read-only while preserving report copy', () => {
    expect(hasCapability(USER_ROLE.VIEWER, CAPABILITY.READ_OPERATIONS)).toBe(true);
    expect(hasCapability(USER_ROLE.VIEWER, CAPABILITY.COPY_REPORT)).toBe(true);
    expect(canCreateTicket(USER_ROLE.VIEWER)).toBe(false);
    expect(canMutateTicket(USER_ROLE.VIEWER)).toBe(false);
    expect(canArchiveTicket(USER_ROLE.VIEWER)).toBe(false);
  });

  it('treats local preview as an explicit non-persisted development override', () => {
    expect(hasCapability(null, CAPABILITY.MANAGE_USERS, { localDevelopmentMode: true })).toBe(true);
  });
});
