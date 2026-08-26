import { describe, expect, it } from 'vitest';

import {
  TIME_INTELLIGENCE_REFRESH_MS,
  deriveTimeIntelligence,
  formatOperationalDuration,
} from './timeIntelligence.js';

describe('GEN-F4 Time Intelligence', () => {
  it('derives active incident, dispatch, Progress and update ages from normalized instants', () => {
    const now = new Date('2026-08-26T12:00:00.000Z');
    const result = deriveTimeIntelligence(
      {
        occurAt: new Date('2026-08-26T10:00:00.000Z'),
        dispatchAt: new Date('2026-08-26T10:12:00.000Z'),
        updatedAt: new Date('2026-08-26T11:45:00.000Z'),
        progress: [
          { occurredAt: new Date('2026-08-26T10:30:00.000Z') },
          { occurredAt: new Date('2026-08-26T11:20:00.000Z') },
        ],
      },
      { now, timezone: 'Asia/Jakarta' },
    );

    expect(result.timezone).toBe('Asia/Jakarta');
    expect(result.refreshAfterMs).toBe(TIME_INTELLIGENCE_REFRESH_MS);
    expect(result.incidentElapsedMs).toBe(120 * 60_000);
    expect(result.dispatchDelayMs).toBe(12 * 60_000);
    expect(result.latestProgressAgeMs).toBe(40 * 60_000);
    expect(result.latestUpdateAgeMs).toBe(15 * 60_000);
    expect(result.resolvedDurationMs).toBeNull();
  });

  it('freezes incident elapsed at resolution and exposes resolved duration', () => {
    const result = deriveTimeIntelligence(
      {
        occurAt: '2026-08-26T08:00:00.000Z',
        resolvedAt: '2026-08-26T09:35:00.000Z',
      },
      { now: new Date('2026-08-26T12:00:00.000Z') },
    );

    expect(result.incidentElapsedMs).toBe(95 * 60_000);
    expect(result.resolvedDurationMs).toBe(95 * 60_000);
  });

  it('keeps negative dispatch delay visible so impossible ordering can be validated', () => {
    const result = deriveTimeIntelligence({
      occurAt: '2026-08-26T10:00:00.000Z',
      dispatchAt: '2026-08-26T09:55:00.000Z',
    });

    expect(result.dispatchDelayMs).toBe(-5 * 60_000);
    expect(formatOperationalDuration(result.dispatchDelayMs)).toBe('-5m');
  });

  it('uses normalized Outlook Sent provenance instead of reconstructed Dispatch Time', () => {
    const result = deriveTimeIntelligence({
      occurAt: '2026-08-26T10:00:00.000Z',
      dispatchAt: '2026-08-26T10:45:00.000Z',
      importProvenance: {
        sourceKind: 'outlook_msg',
        dispatchTimeSource: 'PR_CLIENT_SUBMIT_TIME',
        messageSentAt: '2026-08-26T10:08:00.000Z',
      },
    });

    expect(result.dispatchAt.toISOString()).toBe('2026-08-26T10:08:00.000Z');
    expect(result.dispatchDelayMs).toBe(8 * 60_000);
  });

  it('prefers latestProgress summary and includes it in latest update age', () => {
    const result = deriveTimeIntelligence(
      {
        latestProgress: { occurredAt: '2026-08-26T11:50:00.000Z' },
        progress: [{ occurredAt: '2026-08-26T11:55:00.000Z' }],
        updatedAt: '2026-08-26T11:30:00.000Z',
      },
      { now: new Date('2026-08-26T12:00:00.000Z') },
    );

    expect(result.latestProgressAgeMs).toBe(10 * 60_000);
    expect(result.latestUpdateAgeMs).toBe(10 * 60_000);
    expect(result.latestUpdateAt.toISOString()).toBe('2026-08-26T11:50:00.000Z');
    expect(result.incidentElapsedMs).toBeNull();
    expect(result.dispatchDelayMs).toBeNull();
  });

  it('formats operational durations at minute precision', () => {
    expect(formatOperationalDuration(0)).toBe('0m');
    expect(formatOperationalDuration(65 * 60_000)).toBe('1h 5m');
    expect(formatOperationalDuration((24 * 60 + 7) * 60_000)).toBe('1d 0h 7m');
    expect(formatOperationalDuration(null)).toBe('—');
  });
});
