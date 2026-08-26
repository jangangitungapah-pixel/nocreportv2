from pathlib import Path

path = Path('src/features/ticket-generator/lib/draftRecovery.js')
text = path.read_text()

anchor = "const DRAFT_RECOVERY_VERSION = 1;\n"
replacement = "import { sanitizeEvidenceRecoveryItems } from './evidenceWorkspace.js';\n\n" + anchor
if text.count(anchor) != 1 or "sanitizeEvidenceRecoveryItems" in text:
    raise SystemExit('draftRecovery import anchor missing, duplicated, or already patched')
text = text.replace(anchor, replacement, 1)

anchor = "  progressDraft = null,\n  progressEntries = [],\n  templateProfileId = 'MANDAU_DEFAULT',\n"
replacement = "  progressDraft = null,\n  progressEntries = [],\n  evidenceItems = [],\n  templateProfileId = 'MANDAU_DEFAULT',\n"
if text.count(anchor) != 1:
    raise SystemExit('draftRecovery buildPayload input anchor missing or duplicated')
text = text.replace(anchor, replacement, 1)

anchor = "    progressDraft: sanitizeProgressDraft(progressDraft),\n    progressEntries: sanitizeProgressRecoveryEntries(progressEntries),\n    importMetadata: sanitizeImportRecoveryMetadata(importReview),\n"
replacement = "    progressDraft: sanitizeProgressDraft(progressDraft),\n    progressEntries: sanitizeProgressRecoveryEntries(progressEntries),\n    evidenceItems: sanitizeEvidenceRecoveryItems(evidenceItems),\n    importMetadata: sanitizeImportRecoveryMetadata(importReview),\n"
if text.count(anchor) != 1:
    raise SystemExit('draftRecovery payload anchor missing or duplicated')
text = text.replace(anchor, replacement, 1)

path.write_text(text)
