const TT_LABEL_PATTERN = /\[\s*TT\s*:\s*([A-Z0-9][A-Z0-9._/-]*)\s*\]/i;
const TT_INLINE_PATTERN = /\bTT\s*:\s*([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\b/i;
const INCIDENT_PATTERN = /\bINC-\d{8}-\d+\b/i;

export function extractExternalTicketNumber(title) {
  if (typeof title !== 'string' || !title.trim()) {
    return null;
  }

  const labeled = title.match(TT_LABEL_PATTERN)?.[1];
  if (labeled) {
    return labeled.toUpperCase();
  }

  const inline = title.match(TT_INLINE_PATTERN)?.[1];
  if (inline) {
    return inline.toUpperCase();
  }

  const incident = title.match(INCIDENT_PATTERN)?.[0];
  return incident ? incident.toUpperCase() : null;
}
