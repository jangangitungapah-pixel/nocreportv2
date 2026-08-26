import { describe, expect, test } from 'vitest';

import { parseOperationalDateTime, parseSmartReport } from './smartReportParser.js';

const EXAMPLE_1 = `*[FLP_3rd_MANDAU][Open - Major] DOWN - 13TSK0017_RADIOPURNAMASUKAMAJU_HS(100133)<>13TSK0002_BSCSINGAPARNA_PL(107006) - DATACOM-INC-20260823-00022973*
Occur Time = 2026-08-23 23:28
Dispacth Time = 2026-08-24 00:25
PIC = Tetep(Tasik)
Rootcause = Still Investigation
Cut Point = Still Investigation

Update Progress
00:30 We already open TT MDU-20260824-0000037597,coordination with team
01:55 team otw site 100133 eta 60menit
03:41 team progress pengecekan`;

const EXAMPLE_2 = `*[MANDAU] LINK DOWN AT DWDM 100315_RASUNA <> 100399_CANGKUDU [TT : INC-20260822-00015684]*
Impact
1. ❌ [FLP_3rd_MANDAU][Open - Major] DOWN - 11TGN0552_BOJONG_RENGADTANGERANG_PL(100280)<>11TGN0416_MAUKRAYA_PL(096104) - DATACOM-INC-20260822-00016184

Occur Time = 22/08/2026 13:16
Dispacth Time = 22/08/2026 13:54
PIC =
Rootcause = Still Investigation
Cut Point = Still Investigation

Update Progress
13:55 We Already Open TT MDU-20260822-0000037367 & Coordinated with team
14:08 team prepare tools`;

const EXAMPLE_4 = `*[MANDAU] LINK DOWN AT DWDM 12JKS0974_NEW PLAZA KUNINGAN <> 100034_KARAWANG H3I [TT : INC-20260822-00004736]*
Impact :
MD [PL3] | DOWN | SR#01428674 | PT. MEGA AKSES PERSADA | LCO_MAP_JKT_SBY_001 | Link Backbone DWDM UAJB CYBER2 - KARAWANG terpantau DOWN [IOCH Case# 01428674]
MD [PL3] | DOWN | SR#01428711 | PT. IFORTE SOLUSI INFOTEK | LCO_ISI_JKT_SBY_001 | Jakarta - Karawang Down [IOCH Case# 01428711]
MD [PL3] | DOWN | SR#01428712 | PT. MORA TELEMATIKA INDONESIA | DLC MRTEL JKT-SBY 220002 | 4 Core DWDM Nokia & Huawei MTI Section NIX Jatinegara - Karawang via UJB 3rd Party - H3I Down [IOCH Case# 01428712]
MD [PL3] | DOWN | SR#01428723 | PT. MORA TELEMATIKA INDONESIA | DLC MRTEL JKT-SBY 220002 | Dark Core Triasmitra Deliver To JKLD NIX Jakarta - Karawang via IOH 4 CORE DOWN | 22/8/2026 [IOCH Case# 01428723]

Occur Time = 22/08/2026 07:19
Dispacth Time = 22/08/2026 07:34
PIC = Dadan (Bekasi Barat)
Rootcause = Impact hit by truck
Cut Point = KM 35,2 from PK

Update Progress
07:35 We Already Open TT MDU-20260822-0000037315 & FD Result FO CUT at KM 35,2 from PK
07:42 Team prepare tools
08:29 Team OTW FD ETA 60 Min
09:24 Team on check JC nearest result FD
09:40 Makesure OTDR from JC, still cut at KM 4,4 toward PK
10:00 Team trace CP
10:22 Trace CP team found cable cut impact hit by truck
10:59 Team process peeled cable existing side Karawang
11:03 Team process peeled cable existing side Jakarta
11:23 Team support otw to CP 60 min
11:46 Team process seeting closure cable existing side Karawang
11:55 Team process seeting closure cable existing side Jakarta
12:13 Team process jumper crossing road
12:33 Team process peeled cable jumper side Jakarta
12:55 Team process joincore side Jakarta
14:03 Team process joincore side Karawang`;

describe('smartReportParser', () => {
  test('accepts ISO-like and Indonesian operational date formats', () => {
    expect(parseOperationalDateTime('2026-08-23 23:28')).toBe('2026-08-23T23:28');
    expect(parseOperationalDateTime('22/08/2026 13:16')).toBe('2026-08-22T13:16');
    expect(parseOperationalDateTime('31/02/2026 13:16')).toBeNull();
  });

  test('parses typo-tolerant Dispatch and rolls progress across midnight', () => {
    const parsed = parseSmartReport(EXAMPLE_1);

    expect(parsed.values.title).toContain('DATACOM-INC-20260823-00022973');
    expect(parsed.values.occurAt).toBe('2026-08-23T23:28');
    expect(parsed.values.dispatchAt).toBe('2026-08-24T00:25');
    expect(parsed.values.pic).toBe('Tetep(Tasik)');
    expect(parsed.values.rootcause).toBe('Still Investigation');
    expect(parsed.values.cutPoint).toBe('Still Investigation');
    expect(parsed.values.impactList).toEqual([]);
    expect(parsed.progress).toHaveLength(3);
    expect(parsed.progress[0]).toMatchObject({
      occurredAt: '2026-08-24T00:30',
      text: 'We already open TT MDU-20260824-0000037597,coordination with team',
    });
    expect(parsed.progress[2].occurredAt).toBe('2026-08-24T03:41');
    expect(parsed.warnings).toEqual([]);
  });

  test('parses one numbered Impact and preserves an explicitly blank PIC', () => {
    const parsed = parseSmartReport(EXAMPLE_2);

    expect(parsed.values.occurAt).toBe('2026-08-22T13:16');
    expect(parsed.values.dispatchAt).toBe('2026-08-22T13:54');
    expect(parsed.values.pic).toBe('');
    expect(parsed.detectedFields).toContain('pic');
    expect(parsed.values.impactList).toEqual([
      {
        value:
          '❌ [FLP_3rd_MANDAU][Open - Major] DOWN - 11TGN0552_BOJONG_RENGADTANGERANG_PL(100280)<>11TGN0416_MAUKRAYA_PL(096104) - DATACOM-INC-20260822-00016184',
      },
    ]);
    expect(parsed.progress.map((entry) => entry.occurredAt)).toEqual([
      '2026-08-22T13:55',
      '2026-08-22T14:08',
    ]);
  });

  test('keeps multiline Impact rows separate and imports a long progress timeline', () => {
    const parsed = parseSmartReport(EXAMPLE_4);

    expect(parsed.values.impactList).toHaveLength(4);
    expect(parsed.values.impactList[0].value).toContain('PT. MEGA AKSES PERSADA');
    expect(parsed.values.impactList[3].value).toContain('PT. MORA TELEMATIKA INDONESIA');
    expect(parsed.values.rootcause).toBe('Impact hit by truck');
    expect(parsed.values.cutPoint).toBe('KM 35,2 from PK');
    expect(parsed.progress).toHaveLength(16);
    expect(parsed.progress.at(-1)).toMatchObject({
      occurredAt: '2026-08-22T14:03',
      text: 'Team process joincore side Karawang',
    });
    expect(parsed.stats).toEqual({ fieldCount: 7, impactCount: 4, progressCount: 16 });
  });

  test('filters exact-normalized duplicate Impact rows while preserving order', () => {
    const parsed = parseSmartReport(`Title : *[MANDAU] TEST [TT : INC-20260825-00000002]*
Impact List :
1. SITE_A
- site_a
- SITE A
- SITE_B
Occur Time = 25/08/2026 01:10`);

    expect(parsed.values.impactList).toEqual([
      { value: 'SITE_A' },
      { value: 'SITE A' },
      { value: 'SITE_B' },
    ]);
    expect(parsed.stats.impactCount).toBe(3);
  });

  test('supports canonical Title and Impact List labels', () => {
    const parsed = parseSmartReport(`Title : *[MANDAU] TEST [TT : INC-20260825-00000001]*
Impact List :
- Service A
- Service B
Occur Time = 25/08/2026 01:10
Dispatch Time = 25/08/2026 01:20
PIC = Operator
Root Cause = testing parser
Cut Point = KM 1

Update Progress :
01:21 parser applied`);

    expect(parsed.values.title).toBe('[MANDAU] TEST [TT : INC-20260825-00000001]');
    expect(parsed.values.impactList).toEqual([{ value: 'Service A' }, { value: 'Service B' }]);
    expect(parsed.values.rootcause).toBe('testing parser');
    expect(parsed.progress[0].occurredAt).toBe('2026-08-25T01:21');
  });
});
