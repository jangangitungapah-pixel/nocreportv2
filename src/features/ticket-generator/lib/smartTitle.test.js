import { describe, expect, it } from 'vitest';

import { canGenerateSmartTitle, generateSmartTitle, smartTitleInputs } from './smartTitle.js';

describe('MANDAU Smart Title', () => {
  it('formats transport variants and ordered N-endpoint paths deterministically', () => {
    const ticket = {
      templateProfileId: 'MANDAU_DEFAULT',
      externalTtNumber: 'DWDM-INC-20260825-00015373',
      alarmContext: {
        alarmFamily: 'LINK_DOWN',
        transportFamily: 'DWDM UJB',
        pathEndpoints: ['110036_PEKALONGAN', '110109_BATANG', '117001_SEMARANG'],
      },
    };

    expect(generateSmartTitle(ticket)).toBe(
      '[MANDAU] LINK DOWN AT DWDM UJB 110036_PEKALONGAN <> 110109_BATANG <> 117001_SEMARANG [TT : DWDM-INC-20260825-00015373]',
    );
    expect(smartTitleInputs(ticket).pathEndpoints).toEqual([
      '110036_PEKALONGAN',
      '110109_BATANG',
      '117001_SEMARANG',
    ]);
  });

  it('keeps LOS families distinct and supports partial deterministic titles', () => {
    expect(
      generateSmartTitle({
        templateProfileId: 'MANDAU_DEFAULT',
        externalTtNumber: 'INC-20260826-00000054',
        alarmContext: { alarmFamily: 'ETH_LOS', pathEndpoints: ['NODE A', 'NODE B'] },
      }),
    ).toBe('[MANDAU] ETH LOS NODE A <> NODE B [TT : INC-20260826-00000054]');
  });

  it('reports whether enough normalized metadata exists to regenerate', () => {
    expect(canGenerateSmartTitle({})).toBe(false);
    expect(canGenerateSmartTitle({ alarmContext: { pathEndpoints: ['NODE A'] } })).toBe(true);
  });
});
