export const USER_ROLE = Object.freeze({
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  VIEWER: 'VIEWER',
  LOCAL_DEV: 'LOCAL_DEV',
});

export const CAPABILITY = Object.freeze({
  READ_OPERATIONS: 'operations:read',
  CREATE_TICKET: 'ticket:create',
  EDIT_TICKET: 'ticket:edit',
  CHANGE_STATUS: 'ticket:change-status',
  UPDATE_COORDINATE: 'ticket:update-coordinate',
  MANAGE_PROGRESS: 'progress:manage',
  COPY_REPORT: 'report:copy',
  ARCHIVE_RESTORE: 'ticket:archive-restore',
  READ_AUDIT: 'audit:read',
  MANAGE_USERS: 'users:manage',
});

const OPERATIONAL_ROLES = new Set([USER_ROLE.ADMIN, USER_ROLE.OPERATOR, USER_ROLE.VIEWER]);

const ROLE_CAPABILITIES = Object.freeze({
  [USER_ROLE.ADMIN]: new Set(Object.values(CAPABILITY)),
  [USER_ROLE.OPERATOR]: new Set([
    CAPABILITY.READ_OPERATIONS,
    CAPABILITY.CREATE_TICKET,
    CAPABILITY.EDIT_TICKET,
    CAPABILITY.CHANGE_STATUS,
    CAPABILITY.UPDATE_COORDINATE,
    CAPABILITY.MANAGE_PROGRESS,
    CAPABILITY.COPY_REPORT,
  ]),
  [USER_ROLE.VIEWER]: new Set([CAPABILITY.READ_OPERATIONS, CAPABILITY.COPY_REPORT]),
  [USER_ROLE.LOCAL_DEV]: new Set(Object.values(CAPABILITY)),
});

export function isOperationalRole(role) {
  return OPERATIONAL_ROLES.has(role);
}

export function hasCapability(role, capability, { localDevelopmentMode = false } = {}) {
  const effectiveRole = localDevelopmentMode ? USER_ROLE.LOCAL_DEV : role;
  return ROLE_CAPABILITIES[effectiveRole]?.has(capability) ?? false;
}

export function canCreateTicket(role, options) {
  return hasCapability(role, CAPABILITY.CREATE_TICKET, options);
}

export function canMutateTicket(role, options) {
  return hasCapability(role, CAPABILITY.EDIT_TICKET, options);
}

export function canArchiveTicket(role, options) {
  return hasCapability(role, CAPABILITY.ARCHIVE_RESTORE, options);
}
