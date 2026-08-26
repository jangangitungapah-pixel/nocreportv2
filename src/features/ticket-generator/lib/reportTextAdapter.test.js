import { describe, expect, test } from 'vitest';

import { parseReportTextImport } from './reportTextAdapter.js';
import { parseSmartReport } from './smartReportParser.js';

const REPORT = `*[MANDAU] LINK DOWN AT DWDM 99AAA0001_FAKE_A <> 99BBB0002_FAKE_B [TT : INC-20260826-90000100]*
Impact
- Fake Service A
Occur Time = 26/08/2026 07:15
Dispatch Time = 26/08/2026 07:20
PIC = Fake Operator
Rootcause = Still Investigation
Cut Point = Still Investigation

Update Progress
07:21 Fake progress`;

describe('reportTextAdapter', () => {
  test('preserves current Smart Report values and progress through the unified candidate contract', () => {
    const legacy = parseSmartReport(REPORT);
    const candidate = parseReportTextImport(REPORT);

    expect(candidate.source.kind).toBe('report_text');
    expect(candidate.fields.title.value).toBe(legacy.values.title);
    expect(candidate.fields.impactList.value).toEqual(legacy.values.impactList);
    expect(candidate.fields.occurAt.value).toBe(legacy.values.occurAt);
    expect(candidate.fields.dispatchAt.value).toBe(legacy.values.dispatchAt);
    expect(candidate.fields.pic.value).toBe(legacy.values.pic);
    expect(candidate.fields.rootcause.value).toBe(legacy.values.rootcause);
    expect(candidate.fields.cutPoint.value).toBe(legacy.values.cutPoint);
    expect(candidate.progress).toEqual(legacy.progress);
    expect(candidate.warnings).toEqual(legacy.warnings);
    expect(candidate.stats.canApply).toBe(legacy.canApply);
  });

  test('derives TT identity without changing the parsed report title', () => {
    const candidate = parseReportTextImport(REPORT);

    expect(candidate.fields.externalTtNumber.value).toBe('INC-20260826-90000100');
    expect(candidate.fields.incidentKey.value).toBe('INC-20260826-90000100');
    expect(candidate.fields.title.value).toContain('[MANDAU] LINK DOWN AT DWDM');
  });
});
