import { describe, expect, it } from 'vitest';

import { mapProgressData, mapTicketData, toDate } from './firestoreMappers.js';

function timestamp(date) {
  return { toDate: () => date, toMillis: () => date.getTime() };
}

describe('Firestore domain mappers', () => {
  it('converts Firebase-style timestamps into Date values', () => {
    const date = new Date(2026, 7, 18, 14, 20);
    expect(toDate(timestamp(date))).toEqual(date);
  });

  it('normalizes a persisted Ticket without leaking Firestore timestamp objects', () => {
    const occurAt = new Date(2026, 7, 18, 14, 20);
    const updatedAt = new Date(2026, 7, 18, 15, 0);
    const ticket = mapTicketData('ticket-1', {
      title: '[MANDAU] LINK DOWN',
      occurAt: timestamp(occurAt),
      updatedAt: timestamp(updatedAt),
      status: 'RUNNING',
      revision: 4,
      coordinate: {
        latitude: -6.12345,
        longitude: 107.12345,
        source: 'ocr',
        detectedFormat: 'DMS',
        verified: true,
        verifiedAt: timestamp(updatedAt),
        verifiedBy: 'operator-1',
      },
    });

    expect(ticket).toMatchObject({
      id: 'ticket-1',
      title: '[MANDAU] LINK DOWN',
      occurAt,
      updatedAt,
      status: 'RUNNING',
      revision: 4,
      hasCoordinates: true,
      coordinate: {
        latitude: -6.12345,
        longitude: 107.12345,
        source: 'ocr',
        detectedFormat: 'DMS',
        verified: true,
        verifiedAt: updatedAt,
        verifiedBy: 'operator-1',
      },
    });
  });

  it('maps Progress timestamps through the domain contract', () => {
    const occurredAt = new Date(2026, 7, 18, 14, 47);
    const createdAt = new Date(2026, 7, 18, 14, 48);
    const progress = mapProgressData('progress-1', {
      occurredAt: timestamp(occurredAt),
      createdAt: timestamp(createdAt),
      text: 'team OTW ke lokasi CP',
      createdBy: 'operator-1',
    });

    expect(progress).toEqual({
      id: 'progress-1',
      occurredAt,
      text: 'team OTW ke lokasi CP',
      createdAt,
      createdBy: 'operator-1',
    });
  });
});
