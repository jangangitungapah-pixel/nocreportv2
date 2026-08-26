import { extractExternalTicketNumber } from '../../../entities/ticket/index.js';
import { createCandidateField, createImportCandidate } from './importCandidate.js';
import { normalizeIncidentKey } from './operationalNormalization.js';
import { parseSmartReport } from './smartReportParser.js';

function parsedField(parsed, key) {
  if (!parsed.detectedFields.includes(key)) {
    return createCandidateField({ selected: false });
  }

  return createCandidateField({
    value: parsed.values[key],
    rawValue: parsed.values[key],
    source: 'body',
    confidence: 'exact',
  });
}

export function parseReportTextImport(input, { profileId = 'MANDAU_DEFAULT' } = {}) {
  const parsed = parseSmartReport(input);
  const externalTtNumber = extractExternalTicketNumber(parsed.values.title);
  const incidentKey = normalizeIncidentKey(externalTtNumber);

  return createImportCandidate({
    source: {
      kind: 'report_text',
      profileId,
      parserVersion: 1,
    },
    fields: {
      title: parsedField(parsed, 'title'),
      externalTtNumber: externalTtNumber
        ? createCandidateField({
            value: externalTtNumber,
            rawValue: externalTtNumber,
            source: 'body',
            confidence: 'strong',
          })
        : createCandidateField({ selected: false }),
      incidentKey: incidentKey
        ? createCandidateField({
            value: incidentKey,
            rawValue: externalTtNumber,
            source: 'inference',
            confidence: 'strong',
          })
        : createCandidateField({ selected: false }),
      occurAt: parsedField(parsed, 'occurAt'),
      dispatchAt: parsedField(parsed, 'dispatchAt'),
      pic: parsedField(parsed, 'pic'),
      rootcause: parsedField(parsed, 'rootcause'),
      cutPoint: parsedField(parsed, 'cutPoint'),
      impactList: parsedField(parsed, 'impactList'),
    },
    progress: parsed.progress,
    warnings: parsed.warnings,
    stats: {
      ...parsed.stats,
      adapter: 'report_text',
      canApply: parsed.canApply,
      detectedFields: [...parsed.detectedFields],
    },
  });
}
