import { describe, expect, it } from 'vitest';

import { buildCutPointMarkers, filterCutPointMarkers, isValidMapCoordinate } from './mapData.js';

function ticket(overrides = {}) {
  return {
    id: 'ticket-1',
    title: '[MANDAU] LINK DOWN',
    externalTtNumber: 'INC-20260818-00015849',
    status: 'RUNNING',
    pic: 'Agus',
    cutPoint: 'KM 24 Majalengka',
    hasCoordinates: true,
    coordinate: {
      latitude: -6.12345,
      longitude: 107.12345,
      verified: true,
    },
    latestProgress: { text: 'team arrived at cut point' },
    updatedAt: new Date('2026-08-18T09:00:00.000Z'),
    ...overrides,
  };
}

describe('Cut Point marker data', () => {
  it('accepts only finite in-range coordinates', () => {
    expect(isValidMapCoordinate(-6.2, 106.8)).toBe(true);
    expect(isValidMapCoordinate(91, 106.8)).toBe(false);
    expect(isValidMapCoordinate(-6.2, 181)).toBe(false);
    expect(isValidMapCoordinate(Number.NaN, 106.8)).toBe(false);
  });

  it('maps only confirmed Ticket coordinates without creating duplicate location records', () => {
    const markers = buildCutPointMarkers([
      ticket(),
      ticket({ id: 'unverified', coordinate: { latitude: -6, longitude: 107, verified: false } }),
      ticket({ id: 'invalid', coordinate: { latitude: 95, longitude: 107, verified: true } }),
      ticket({ id: 'missing-flag', hasCoordinates: false }),
    ]);

    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({
      ticketId: 'ticket-1',
      latitude: -6.12345,
      longitude: 107.12345,
      externalTtNumber: 'INC-20260818-00015849',
      status: 'RUNNING',
      pic: 'Agus',
      cutPoint: 'KM 24 Majalengka',
    });
  });

  it('filters markers by status and operational search fields', () => {
    const markers = buildCutPointMarkers([
      ticket(),
      ticket({
        id: 'ticket-2',
        status: 'RESOLVED',
        title: '[BANDUNG] SECOND LINK',
        externalTtNumber: 'INC-20260818-00015850',
        pic: 'Budi',
      }),
    ]);

    expect(filterCutPointMarkers(markers, { status: 'RUNNING' })).toHaveLength(1);
    expect(filterCutPointMarkers(markers, { search: 'Budi' })).toEqual([
      expect.objectContaining({ ticketId: 'ticket-2' }),
    ]);
    expect(filterCutPointMarkers(markers, { search: 'does-not-exist' })).toHaveLength(0);
  });
});
