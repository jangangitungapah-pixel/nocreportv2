import { describe, expect, it } from 'vitest';

import {
  TICKET_STATUS,
  createEmptyTicket,
  extractExternalTicketNumber,
  formatCoordinatePair,
  formatTicketReport,
  parseCoordinateText,
  sortProgressTimeline,
  validateCoordinatePair,
  validateExpectedRevision,
  validateTicketTransition,
} from './index.js';

function localDate(day, hour, minute) {
  return new Date(2026, 7, day, hour, minute, 0, 0);
}

describe('ticket lifecycle', () => {
  it('creates a safe Draft ticket baseline', () => {
    const ticket = createEmptyTicket();

    expect(ticket.status).toBe(TICKET_STATUS.DRAFT);
    expect(ticket.impactList).toEqual([]);
    expect(ticket.progress).toEqual([]);
    expect(ticket.coordinate).toBeNull();
    expect(ticket.hasCoordinates).toBe(false);
    expect(ticket.revision).toBe(0);
  });

  it('requires Title and Occur Time before marking Running', () => {
    const result = validateTicketTransition(createEmptyTicket(), TICKET_STATUS.RUNNING);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.field)).toEqual(['title', 'occurAt']);
  });

  it('allows a valid Draft ticket to become Running', () => {
    const ticket = createEmptyTicket({
      title: '[MANDAU] LINK DOWN [TT : INC-20260818-00015849]',
      occurAt: localDate(18, 14, 20),
    });

    expect(validateTicketTransition(ticket, TICKET_STATUS.RUNNING)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('rejects an invalid direct Draft to Resolved transition', () => {
    const ticket = createEmptyTicket({ status: TICKET_STATUS.DRAFT });
    const result = validateTicketTransition(ticket, TICKET_STATUS.RESOLVED);

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('INVALID_TRANSITION');
  });

  it('detects stale revisions instead of silently accepting them', () => {
    expect(validateExpectedRevision(8, 7)).toMatchObject({
      valid: false,
      code: 'STALE_DATA',
      actualRevision: 8,
      expectedRevision: 7,
    });
    expect(validateExpectedRevision(8, 8).valid).toBe(true);
  });
});

describe('external TT number extraction', () => {
  it('extracts the canonical bracketed TT notation', () => {
    expect(
      extractExternalTicketNumber(
        '[MANDAU] LINK DOWN, [TT : INC-20260818-00015849]',
      ),
    ).toBe('INC-20260818-00015849');
  });

  it('accepts an incident number even when the TT label is absent', () => {
    expect(extractExternalTicketNumber('Escalation INC-20260818-00015849 ongoing')).toBe(
      'INC-20260818-00015849',
    );
  });

  it('returns null when no recognizable ticket number exists', () => {
    expect(extractExternalTicketNumber('MANDAU LINK DOWN')).toBeNull();
  });
});

describe('progress timeline ordering', () => {
  it('sorts updates chronologically across midnight', () => {
    const progress = [
      {
        id: 'b',
        occurredAt: localDate(19, 0, 15),
        createdAt: localDate(19, 0, 16),
        text: 'Jointing selesai',
      },
      {
        id: 'a',
        occurredAt: localDate(18, 23, 55),
        createdAt: localDate(18, 23, 56),
        text: 'Splicing core',
      },
    ];

    expect(sortProgressTimeline(progress).map((entry) => entry.id)).toEqual(['a', 'b']);
  });

  it('uses creation time and id as deterministic duplicate-time tie breakers', () => {
    const occurredAt = localDate(18, 20, 10);
    const progress = [
      {
        id: 'c',
        occurredAt,
        createdAt: localDate(18, 20, 13),
        text: 'third',
      },
      {
        id: 'b',
        occurredAt,
        createdAt: localDate(18, 20, 12),
        text: 'second-b',
      },
      {
        id: 'a',
        occurredAt,
        createdAt: localDate(18, 20, 12),
        text: 'second-a',
      },
    ];

    expect(sortProgressTimeline(progress).map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('report formatter', () => {
  const baseTicket = {
    title:
      '[MANDAU] LINK DOWN AT DWDM UJB 109202_BANDUNG_PETA <> 100109_MAJALENGKA, [TT : INC-20260818-00015849]',
    occurAt: localDate(18, 14, 20),
    dispatchAt: localDate(18, 14, 20),
    pic: 'Agus (majalengka)',
    rootcause: 'impact forest burning',
    cutPoint: 'OTDR FO CUT at KM 24 from majalengka (FD fibeerstar)',
  };

  it('hides Impact List completely when it is empty', () => {
    const report = formatTicketReport({
      ...baseTicket,
      impactList: [],
      progress: [],
    });

    expect(report).not.toContain('Impact List');
    expect(report).toContain('Occur Time = 18/08/2026 14:20');
    expect(report).toContain('Dispatch Time = 18/08/2026 14:20');
  });

  it('renders Impact List when populated and preserves entry order', () => {
    const report = formatTicketReport({
      ...baseTicket,
      impactList: ['SITE_A', 'SITE_B'],
      progress: [],
    });

    expect(report).toContain('Impact List : SITE_A, SITE_B');
  });

  it('sorts progress before rendering and preserves user wording', () => {
    const report = formatTicketReport({
      ...baseTicket,
      impactList: [],
      progress: [
        {
          id: '2',
          occurredAt: localDate(18, 14, 47),
          createdAt: localDate(18, 14, 48),
          text: 'team OTW ke lokasi CP, ETA 75 menit',
        },
        {
          id: '1',
          occurredAt: localDate(18, 14, 21),
          createdAt: localDate(18, 14, 22),
          text: 'we have open TT MDU-20260818-0000036711',
        },
      ],
    });

    expect(report.indexOf('14:21 we have open TT')).toBeLessThan(report.indexOf('14:47 team OTW'));
    expect(report).toContain('Rootcause = impact forest burning');
    expect(report).toContain(
      'Cut Point = OTDR FO CUT at KM 24 from majalengka (FD fibeerstar)',
    );
  });
});

describe('coordinate domain', () => {
  it('parses canonical Decimal Degrees', () => {
    expect(parseCoordinateText('-6.12345, 107.12345')).toMatchObject({
      status: 'success',
      format: 'DD',
      latitude: -6.12345,
      longitude: 107.12345,
      formatted: '-6.12345, 107.12345',
    });
  });

  it('parses labeled Decimal Degrees', () => {
    expect(parseCoordinateText('Latitude: -6.12345 Longitude: 107.12345')).toMatchObject({
      status: 'success',
      latitude: -6.12345,
      longitude: 107.12345,
    });
  });

  it('parses DMS and converts South to a negative latitude', () => {
    expect(
      parseCoordinateText(`6° 07' 24.42" S, 107° 07' 24.42" E`),
    ).toMatchObject({
      status: 'success',
      format: 'DMS',
      latitude: -6.12345,
      longitude: 107.12345,
      formatted: '-6.12345, 107.12345',
    });
  });

  it('parses DDM and converts hemisphere signs', () => {
    expect(parseCoordinateText(`6° 07.407' S, 107° 07.407' E`)).toMatchObject({
      status: 'success',
      format: 'DDM',
      latitude: -6.12345,
      longitude: 107.12345,
    });
  });

  it('parses decimal hemisphere notation', () => {
    expect(parseCoordinateText('6.12345 S, 107.12345 E')).toMatchObject({
      status: 'success',
      latitude: -6.12345,
      longitude: 107.12345,
    });
  });

  it('rejects out-of-range coordinates', () => {
    expect(validateCoordinatePair(91, 107)).toMatchObject({
      valid: false,
      code: 'LATITUDE_OUT_OF_RANGE',
    });
    expect(parseCoordinateText('91.00000, 107.00000')).toMatchObject({
      status: 'invalid',
      code: 'LATITUDE_OUT_OF_RANGE',
    });
  });

  it('returns an explicit ambiguity contract for unlabeled whitespace pairs', () => {
    const result = parseCoordinateText('6.12345 80.12345');

    expect(result.status).toBe('ambiguous');
    expect(result.code).toBe('AMBIGUOUS_ORDER');
    expect(result.candidates).toHaveLength(2);
  });

  it('formats validated coordinates with five decimal places', () => {
    expect(formatCoordinatePair(-6.1, 107.2)).toBe('-6.10000, 107.20000');
  });

  it('fails gracefully when no coordinate exists', () => {
    expect(parseCoordinateText('team sedang progress jumper kabel')).toEqual({
      status: 'not_found',
      format: null,
      code: 'NO_COORDINATE',
    });
  });
});
