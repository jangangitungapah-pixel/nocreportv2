from pathlib import Path

path = Path('src/features/ticket-generator/pages/TicketGeneratorPage.jsx')
text = path.read_text()

replacements = [
    (
        "import { DraftRecoveryNotice } from '../components/DraftRecoveryNotice.jsx';\nimport { ImpactListEditor } from '../components/ImpactListEditor.jsx';\n",
        "import { DraftRecoveryNotice } from '../components/DraftRecoveryNotice.jsx';\nimport { EvidenceWorkspace } from '../components/EvidenceWorkspace.jsx';\nimport { ImpactListEditor } from '../components/ImpactListEditor.jsx';\n",
        'EvidenceWorkspace import',
    ),
    (
        "import { clearDraftRecovery, readDraftRecovery, writeDraftRecovery } from '../lib/draftRecovery.js';\nimport { DEFAULT_TICKET_FORM, buildTicketFromForm } from '../lib/formToTicket.js';\n",
        "import { clearDraftRecovery, readDraftRecovery, writeDraftRecovery } from '../lib/draftRecovery.js';\nimport { restoreEvidenceRecoveryItems } from '../lib/evidenceWorkspace.js';\nimport { DEFAULT_TICKET_FORM, buildTicketFromForm } from '../lib/formToTicket.js';\n",
        'evidence recovery import',
    ),
    (
        "  const [progressComposerDraft, setProgressComposerDraft] = useState(EMPTY_PROGRESS_DRAFT);\n  const [progressRecoveryDraft, setProgressRecoveryDraft] = useState(null);\n",
        "  const [progressComposerDraft, setProgressComposerDraft] = useState(EMPTY_PROGRESS_DRAFT);\n  const [progressRecoveryDraft, setProgressRecoveryDraft] = useState(null);\n  const [evidenceItems, setEvidenceItems] = useState([]);\n",
        'evidence state',
    ),
    (
        "      progressDirty ||\n      featureMetadataDirty ||\n      Boolean(progressComposerDraft.text?.trim());\n",
        "      progressDirty ||\n      featureMetadataDirty ||\n      Boolean(progressComposerDraft.text?.trim()) ||\n      evidenceItems.length > 0;\n",
        'recoverable evidence dirty state',
    ),
    (
        "        progressDraft: progressComposerDraft,\n        progressEntries: routeTicketId ? [] : progressEntries,\n        templateProfileId: featureMetadata.templateProfileId,\n",
        "        progressDraft: progressComposerDraft,\n        progressEntries: routeTicketId ? [] : progressEntries,\n        evidenceItems,\n        templateProfileId: featureMetadata.templateProfileId,\n",
        'recovery evidence payload',
    ),
    (
        "    featureMetadata,\n    featureMetadataDirty,\n    importReview,\n",
        "    evidenceItems,\n    featureMetadata,\n    featureMetadataDirty,\n    importReview,\n",
        'recovery dependency',
    ),
    (
        "    setProgressComposerDraft(recoveredDraft);\n    setProgressRecoveryDraft({ ...recoveredDraft });\n    setImportReview(recoveredImportReview(payload.importMetadata));\n    setDraftRecovery(EMPTY_DRAFT_RECOVERY);\n",
        "    setProgressComposerDraft(recoveredDraft);\n    setProgressRecoveryDraft({ ...recoveredDraft });\n    setEvidenceItems(restoreEvidenceRecoveryItems(payload.evidenceItems));\n    setImportReview(recoveredImportReview(payload.importMetadata));\n    setDraftRecovery(EMPTY_DRAFT_RECOVERY);\n",
        'restore recovered evidence metadata',
    ),
    (
        "      <CoordinateExtractor onApplyCoordinate={applyExtractedCoordinate} />\n      <ProgressComposer\n",
        "      <EvidenceWorkspace\n        items={evidenceItems}\n        onItemsChange={setEvidenceItems}\n        onApplyCoordinate={applyExtractedCoordinate}\n      />\n      <CoordinateExtractor onApplyCoordinate={applyExtractedCoordinate} />\n      <ProgressComposer\n",
        'EvidenceWorkspace render',
    ),
]

for old, new, label in replacements:
    if text.count(old) != 1:
        raise SystemExit(f'{label} anchor missing or duplicated: {text.count(old)}')
    text = text.replace(old, new, 1)

path.write_text(text)
