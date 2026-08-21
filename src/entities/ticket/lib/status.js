export const TICKET_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  RUNNING: 'RUNNING',
  RESOLVED: 'RESOLVED',
  ARCHIVED: 'ARCHIVED',
});

const ALLOWED_TRANSITIONS = Object.freeze({
  [TICKET_STATUS.DRAFT]: new Set([TICKET_STATUS.RUNNING, TICKET_STATUS.ARCHIVED]),
  [TICKET_STATUS.RUNNING]: new Set([TICKET_STATUS.RESOLVED, TICKET_STATUS.ARCHIVED]),
  [TICKET_STATUS.RESOLVED]: new Set([TICKET_STATUS.ARCHIVED]),
  [TICKET_STATUS.ARCHIVED]: new Set([
    TICKET_STATUS.DRAFT,
    TICKET_STATUS.RUNNING,
    TICKET_STATUS.RESOLVED,
  ]),
});

export function isTicketStatus(value) {
  return Object.values(TICKET_STATUS).includes(value);
}

export function validateRunningRequirements(ticket) {
  const errors = [];

  if (!ticket?.title?.trim()) {
    errors.push({ field: 'title', code: 'REQUIRED', message: 'Title is required.' });
  }

  if (!ticket?.occurAt) {
    errors.push({
      field: 'occurAt',
      code: 'REQUIRED',
      message: 'Occur Time is required.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateTicketTransition(ticket, targetStatus) {
  const currentStatus = ticket?.status ?? TICKET_STATUS.DRAFT;

  if (!isTicketStatus(currentStatus) || !isTicketStatus(targetStatus)) {
    return {
      valid: false,
      errors: [
        {
          field: 'status',
          code: 'INVALID_STATUS',
          message: 'Ticket status is not recognized.',
        },
      ],
    };
  }

  if (currentStatus === targetStatus) {
    return { valid: true, errors: [] };
  }

  if (!ALLOWED_TRANSITIONS[currentStatus].has(targetStatus)) {
    return {
      valid: false,
      errors: [
        {
          field: 'status',
          code: 'INVALID_TRANSITION',
          message: `Cannot transition ticket from ${currentStatus} to ${targetStatus}.`,
        },
      ],
    };
  }

  if (targetStatus === TICKET_STATUS.RUNNING) {
    return validateRunningRequirements(ticket);
  }

  return { valid: true, errors: [] };
}

export function validateExpectedRevision(actualRevision, expectedRevision) {
  const actual = Number(actualRevision ?? 0);
  const expected = Number(expectedRevision ?? 0);

  if (!Number.isInteger(actual) || !Number.isInteger(expected) || actual < 0 || expected < 0) {
    return {
      valid: false,
      code: 'INVALID_REVISION',
      actualRevision: actualRevision ?? null,
      expectedRevision: expectedRevision ?? null,
    };
  }

  if (actual !== expected) {
    return {
      valid: false,
      code: 'STALE_DATA',
      actualRevision: actual,
      expectedRevision: expected,
    };
  }

  return {
    valid: true,
    code: null,
    actualRevision: actual,
    expectedRevision: expected,
  };
}
