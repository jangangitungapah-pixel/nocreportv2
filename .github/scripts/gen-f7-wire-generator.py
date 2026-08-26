from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {count}')
    return text.replace(old, new, 1)


page_path = Path('src/features/ticket-generator/pages/TicketGeneratorPage.jsx')
page = page_path.read_text()

page = replace_once(
    page,
    "import { CAPABILITY } from '../../../entities/user/authorization.js';\nimport { AppIcon }",
    "import { CAPABILITY } from '../../../entities/user/authorization.js';\nimport {\n  GENERATOR_WORKSPACE_COMMAND_EVENT,\n  GENERATOR_WORKSPACE_COMMANDS,\n} from '../../../shared/lib/generatorWorkspaceCommands.js';\nimport { AppIcon }",
    'page shared command import',
)
page = replace_once(
    page,
    "import { CoordinateExtractor } from '../components/CoordinateExtractor.jsx';",
    "import { CoordinateExtractor } from '../components/CoordinateExtractor.jsx';\nimport { CopyCenter } from '../components/CopyCenter.jsx';",
    'page CopyCenter import',
)
page = replace_once(
    page,
    "import { ImpactListEditor } from '../components/ImpactListEditor.jsx';",
    "import { ImpactListEditor } from '../components/ImpactListEditor.jsx';\nimport { OperatorPresetsPanel } from '../components/OperatorPresetsPanel.jsx';",
    'page OperatorPresets import',
)
page = replace_once(
    page,
    "import { mergeImpactValues } from '../lib/impactCandidates.js';",
    "import { mergeImpactValues } from '../lib/impactCandidates.js';\nimport {\n  readOperatorPresets,\n  resetOperatorPresets,\n  sanitizeOperatorPresets,\n  writeOperatorPresets,\n} from '../lib/operatorPresets.js';\nimport { DEFAULT_PROGRESS_SNIPPETS } from '../lib/progressSnippets.js';",
    'page presets lib imports',
)
page = replace_once(
    page,
    "const EMAIL_SENT_TIME_WARNING = 'Email Sent Time was not available; Dispatch Time needs review.';",
    "const EMAIL_SENT_TIME_WARNING = 'Email Sent Time was not available; Dispatch Time needs review.';\nconst VALID_PROGRESS_SNIPPET_IDS = Object.freeze(\n  DEFAULT_PROGRESS_SNIPPETS.map((snippet) => snippet.id),\n);",
    'page snippet ids constant',
)
page = replace_once(
    page,
    "function GeneratorLoading() {",
    "function focusWorkspaceElement(id) {\n  if (typeof document === 'undefined') return false;\n  const target = document.getElementById(id);\n  if (!target) return false;\n  target.scrollIntoView?.({ block: 'center', behavior: 'smooth' });\n  target.focus?.();\n  return true;\n}\n\nfunction GeneratorLoading() {",
    'page focus helper',
)
page = replace_once(
    page,
    "  const { pushToast } = useToast();\n  const [status, setStatus] = useState(TICKET_STATUS.DRAFT);",
    "  const { pushToast } = useToast();\n  const [operatorPresets, setOperatorPresets] = useState(() =>\n    readOperatorPresets({ validSnippetIds: VALID_PROGRESS_SNIPPET_IDS }),\n  );\n  const [selectedCopyTargetId, setSelectedCopyTargetId] = useState(null);\n  const [handoverContext, setHandoverContext] = useState({\n    validationFindings: [],\n    relatedTicketCount: 0,\n  });\n  const [status, setStatus] = useState(TICKET_STATUS.DRAFT);",
    'page preset states',
)
page = replace_once(
    page,
    "  const [featureMetadata, setFeatureMetadata] = useState(() =>\n    createEditorFeatureMetadata({ templateProfileId: 'MANDAU_DEFAULT' }),\n  );",
    "  const [featureMetadata, setFeatureMetadata] = useState(() =>\n    createEditorFeatureMetadata({\n      templateProfileId: routeTicketId ? 'MANDAU_DEFAULT' : operatorPresets.templateProfileId,\n    }),\n  );",
    'page profile preset initialization',
)
page = replace_once(
    page,
    "    defaultValues: { ...DEFAULT_TICKET_FORM, impactList: [] },",
    "    defaultValues: {\n      ...DEFAULT_TICKET_FORM,\n      impactList: [],\n      ...(!routeTicketId && operatorPresets.defaultPic ? { pic: operatorPresets.defaultPic } : {}),\n    },",
    'page default PIC initialization',
)
page = replace_once(
    page,
    "  const coordinate = coordinateSummary(watchedValues?.latitude, watchedValues?.longitude);\n\n  const loadPersistedEditor",
    "  const coordinate = coordinateSummary(watchedValues?.latitude, watchedValues?.longitude);\n  const selectedCopyTarget = selectedCopyTargetId ?? operatorPresets.defaultCopyTarget;\n\n  const persistOperatorPresetState = useCallback((nextValue) => {\n    const next = sanitizeOperatorPresets(nextValue, {\n      validSnippetIds: VALID_PROGRESS_SNIPPET_IDS,\n    });\n    setOperatorPresets(next);\n    writeOperatorPresets(next, { validSnippetIds: VALID_PROGRESS_SNIPPET_IDS });\n    return next;\n  }, []);\n\n  const resetOperatorPresetState = useCallback(() => {\n    const next = resetOperatorPresets({ validSnippetIds: VALID_PROGRESS_SNIPPET_IDS });\n    setOperatorPresets(next);\n    setSelectedCopyTargetId(null);\n    pushToast({\n      title: 'Operator presets reset',\n      message: 'Browser-local Generator defaults returned to profile defaults.',\n      tone: 'success',\n    });\n  }, [pushToast]);\n\n  const updateFavoriteSnippetIds = useCallback((ids) => {\n    setOperatorPresets((current) => {\n      const next = sanitizeOperatorPresets(\n        { ...current, favoriteProgressSnippetIds: ids },\n        { validSnippetIds: VALID_PROGRESS_SNIPPET_IDS },\n      );\n      writeOperatorPresets(next, { validSnippetIds: VALID_PROGRESS_SNIPPET_IDS });\n      return next;\n    });\n  }, []);\n\n  const updateHandoverContext = useCallback((context) => {\n    setHandoverContext(context);\n  }, []);\n\n  const loadPersistedEditor",
    'page preset handlers',
)
page = replace_once(
    page,
    "  const submitTicket = handleSubmit(persistCoreTicket, notifyInvalidForm);\n\n  const transitionTo",
    "  const submitTicket = handleSubmit(persistCoreTicket, notifyInvalidForm);\n\n  useEffect(() => {\n    const handleSaveShortcut = (event) => {\n      if (event.defaultPrevented) return;\n      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;\n      const activeElement = document.activeElement;\n      if (activeElement?.closest?.('[role=\"dialog\"], [role=\"menu\"]')) return;\n      const form = document.getElementById('ticket-editor-form');\n      if (!form || typeof form.requestSubmit !== 'function') return;\n      event.preventDefault();\n      form.requestSubmit();\n    };\n\n    document.addEventListener('keydown', handleSaveShortcut);\n    return () => document.removeEventListener('keydown', handleSaveShortcut);\n  }, []);\n\n  const transitionTo",
    'page save shortcut',
)
old_copy = """  const copyReport = async () => {
    setCopyPending(true);
    try {
      await copyPlainText(report);
      pushToast({
        title: 'Report copied',
        message: 'Plain text is ready to paste.',
        tone: 'success',
      });
    } catch {
      pushToast({
        title: 'Copy failed',
        message: 'Your browser did not allow clipboard access.',
        tone: 'error',
      });
    } finally {
      setCopyPending(false);
    }
  };
"""
new_copy = """  const copyOutput = useCallback(
    async (text, { title = 'Copied', message = 'Plain text is ready to paste.' } = {}) => {
      if (copyPending || !text) return false;
      setCopyPending(true);
      try {
        await copyPlainText(text);
        pushToast({ title, message, tone: 'success' });
        return true;
      } catch {
        pushToast({
          title: 'Copy failed',
          message: 'Your browser did not allow clipboard access.',
          tone: 'error',
        });
        return false;
      } finally {
        setCopyPending(false);
      }
    },
    [copyPending, pushToast],
  );

  const copyReport = () =>
    copyOutput(report, { title: 'Report copied', message: 'Plain text is ready to paste.' });

  const copyUtilityTarget = (target) =>
    copyOutput(target?.text, {
      title: `${target?.label ?? 'Output'} copied`,
      message: 'Canonical Generator output is ready to paste.',
    });

  useEffect(() => {
    const handleWorkspaceCommand = (event) => {
      const command = event?.detail?.command;
      if (command === GENERATOR_WORKSPACE_COMMANDS.COPY_REPORT) {
        void copyOutput(report, {
          title: 'Report copied',
          message: 'Plain text is ready to paste.',
        });
        return;
      }
      if (command === GENERATOR_WORKSPACE_COMMANDS.FOCUS_SMART_IMPORT) {
        focusWorkspaceElement('generator-smart-import');
        return;
      }
      if (command === GENERATOR_WORKSPACE_COMMANDS.FOCUS_PROGRESS) {
        focusWorkspaceElement('progress-text');
        return;
      }
      if (command === GENERATOR_WORKSPACE_COMMANDS.FOCUS_VALIDATION) {
        focusWorkspaceElement('generator-validation-center');
      }
    };

    window.addEventListener(GENERATOR_WORKSPACE_COMMAND_EVENT, handleWorkspaceCommand);
    return () => window.removeEventListener(GENERATOR_WORKSPACE_COMMAND_EVENT, handleWorkspaceCommand);
  }, [copyOutput, report]);
"""
page = replace_once(page, old_copy, new_copy, 'page copy and workspace commands')
page = replace_once(
    page,
    "      <ValidationCenter validation={validation} onFocusField={focusValidationField} />",
    "      <ValidationCenter\n        validation={validation}\n        onFocusField={focusValidationField}\n        onOperationalContextChange={updateHandoverContext}\n      />",
    'page ValidationCenter context',
)
page = replace_once(
    page,
    "      <ProgressComposer\n        onAdd={addProgress}\n        profileId={featureMetadata.templateProfileId}\n        recoveryDraft={progressRecoveryDraft}\n        onDraftChange={setProgressComposerDraft}\n      />",
    "      <ProgressComposer\n        onAdd={addProgress}\n        profileId={featureMetadata.templateProfileId}\n        recoveryDraft={progressRecoveryDraft}\n        onDraftChange={setProgressComposerDraft}\n        favoriteSnippetIds={operatorPresets.favoriteProgressSnippetIds}\n        onFavoriteSnippetIdsChange={updateFavoriteSnippetIds}\n        eventTimeBehavior={operatorPresets.eventTimeBehavior}\n      />",
    'page Progress presets',
)
page = replace_once(
    page,
    "      <ProgressTimeline\n        entries={progressEntries}\n        onUpdate={updateProgress}\n        onRemove={setRemoveProgressId}\n      />\n      <TicketAuditHistory",
    "      <ProgressTimeline\n        entries={progressEntries}\n        onUpdate={updateProgress}\n        onRemove={setRemoveProgressId}\n      />\n      <CopyCenter\n        ticket={ticket}\n        validationFindings={handoverContext.validationFindings}\n        relatedTicketCount={handoverContext.relatedTicketCount}\n        selectedTargetId={selectedCopyTarget}\n        expanded={operatorPresets.utilityState.copyCenterExpanded}\n        handoverExpanded={operatorPresets.utilityState.handoverExpanded}\n        onSelectedTargetChange={setSelectedCopyTargetId}\n        onExpandedChange={(expanded) =>\n          persistOperatorPresetState({\n            ...operatorPresets,\n            utilityState: { ...operatorPresets.utilityState, copyCenterExpanded: expanded },\n          })\n        }\n        onHandoverExpandedChange={(expanded) =>\n          persistOperatorPresetState({\n            ...operatorPresets,\n            utilityState: { ...operatorPresets.utilityState, handoverExpanded: expanded },\n          })\n        }\n        onCopy={copyUtilityTarget}\n      />\n      <OperatorPresetsPanel\n        presets={operatorPresets}\n        expanded={operatorPresets.utilityState.presetsExpanded}\n        onChange={persistOperatorPresetState}\n        onReset={resetOperatorPresetState}\n      />\n      <TicketAuditHistory",
    'page utility panels',
)
page_path.write_text(page)

validation_path = Path('src/features/ticket-generator/components/ValidationCenter.jsx')
validation = validation_path.read_text()
validation = replace_once(
    validation,
    'export function ValidationCenter({ validation, onFocusField }) {',
    'export function ValidationCenter({ validation, onFocusField, onOperationalContextChange }) {',
    'ValidationCenter signature',
)
validation = replace_once(
    validation,
    "  const hasUnsavedChanges = generatorHasUnsavedChanges();\n\n  return (",
    "  const hasUnsavedChanges = generatorHasUnsavedChanges();\n\n  useEffect(() => {\n    onOperationalContextChange?.({\n      validationFindings: displayValidation?.findings ?? [],\n      relatedTicketCount: relatedTickets.length,\n    });\n  }, [displayValidation?.findings, onOperationalContextChange, relatedTickets.length]);\n\n  return (",
    'ValidationCenter operational context effect',
)
validation = replace_once(
    validation,
    '<section className="generator-validation-center overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">',
    '<section\n        id="generator-validation-center"\n        className="generator-validation-center overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"\n        tabIndex={-1}\n      >',
    'ValidationCenter focus anchor',
)
validation_path.write_text(validation)

smart_path = Path('src/features/ticket-generator/components/SmartPasteParser.jsx')
smart = smart_path.read_text()
smart = replace_once(
    smart,
    '<section className="generator-smart-import overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-accent)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">',
    '<section\n      id="generator-smart-import"\n      className="generator-smart-import overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-accent)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"\n      tabIndex={-1}\n    >',
    'Smart Import focus anchor',
)
smart_path.write_text(smart)
