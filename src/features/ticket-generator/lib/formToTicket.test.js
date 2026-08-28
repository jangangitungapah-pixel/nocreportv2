import { describe, expect, it } from 'vitest';

import { DEFAULT_TICKET_FORM, buildTicketFromForm } from './formToTicket.js';

describe('form to Ticket coordinate metadata', () => {
  it('keeps verified OCR source metadata on normalized coordinates', () => {
    const ticket = buildTicketFromForm({
      ...DEFAULT_TICKET_FORM,
      latitude: '-6.12345',
      longitude: '107.12345',
      coordinateSource: 'ocr',
      coordinateDetectedFormat: 'DMS',
      coordinateVerified: true,
    });

    expect(ticket.coordinate).toMatchObject({
      latitude: -6.12345,
      longitude: 107.12345,
      source: 'ocr',
      detectedFormat: 'DMS',
      verified: true,
    });
    expect(ticket.hasCoordinates).toBe(true);
  });

  it('does not create partial coordinate metadata', () => {
    const ticket = buildTicketFromForm({
      ...DEFAULT_TICKET_FORM,
      latitude: '-6.12345',
      longitude: '',
      coordinateSource: 'ocr',
    });

    expect(ticket.coordinate).toBeNull();
    expect(ticket.hasCoordinates).toBe(false);
  });

  it('maps optional Closed Time into Ticket timing', () => {
    const ticket = buildTicketFromForm({
      ...DEFAULT_TICKET_FORM,
      occurAt: '2026-08-26T19:00',
      closedAt: '2026-08-26T20:15',
    });

    expect(ticket.closedAt).toBeInstanceOf(Date);
    expect(ticket.closedAt.getTime()).toBe(new Date('2026-08-26T20:15').getTime());
  });
});
