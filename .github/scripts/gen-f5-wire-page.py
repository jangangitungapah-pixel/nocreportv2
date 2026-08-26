from pathlib import Path

path = Path('src/features/ticket-generator/pages/TicketGeneratorPage.jsx')
text = path.read_text()


def replace_once(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, got {count}')
    text = text.replace(old, new, 1)


replace_once(
    "import { CoordinateExtractor } from '../components/CoordinateExtractor.jsx';\nimport { ImpactListEditor } from '../components/ImpactListEditor.jsx';",
    "import { CoordinateExtractor } from '../components/CoordinateExtractor.jsx';\nimport { DuplicateRelatedPanel } from '../components/DuplicateRelatedPanel.jsx';\nimport { ImpactListEditor } from '../components/ImpactListEditor.jsx';",
    'component import',
)

replace_once(
    "import { DEFAULT_TICKET_FORM, buildTicketFromForm } from '../lib/formToTicket.js';\nimport { mergeImpactValues } from '../lib/impactCandidates.js';",
    "import {\n  duplicateLookupFingerprint,\n  hasDuplicateLookupSignal,\n} from '../lib/duplicateDetection.js';\nimport { findDuplicateCandidates } from '../lib/duplicateDetectionService.js';\nimport { DEFAULT_TICKET_FORM, buildTicketFromForm } from '../lib/formToTicket.js';\nimport { mergeImpactValues } from '../lib/impactCandidates.js';",
    'duplicate service import',
)

replace_once(
    "import { applySelectiveImport } from '../lib/selectiveApply.js';\nimport { canGenerateSmartTitle, generateSmartTitle } from '../lib/smartTitle.js';",
    "import {\n  loadRelatedTickets,\n  relateTicketToCandidate,\n  unlinkCurrentTicketFromGroup,\n} from '../lib/relatedTicketsService.js';\nimport { applySelectiveImport } from '../lib/selectiveApply.js';\nimport { canGenerateSmartTitle, generateSmartTitle } from '../lib/smartTitle.js';",
    'related service import',
)

replace_once(
    "  const [importReview, setImportReview] = useState(null);\n  const [validationNow, setValidationNow] = useState(() => new Date());",
    "  const [importReview, setImportReview] = useState(null);\n  const [validationNow, setValidationNow] = useState(() => new Date());\n  const [duplicateCandidates, setDuplicateCandidates] = useState([]);\n  const [duplicatePending, setDuplicatePending] = useState(false);\n  const [duplicateError, setDuplicateError] = useState(null);\n  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);\n  const [relatedGroup, setRelatedGroup] = useState(null);\n  const [relatedTickets, setRelatedTickets] = useState([]);\n  const [relatedPending, setRelatedPending] = useState(false);\n  const [relatedError, setRelatedError] = useState(null);\n  const [relatePendingId, setRelatePendingId] = useState(null);\n  const [unlinkPending, setUnlinkPending] = useState(false);",
    'F5 state',
)

replace_once(
    "  const report = useMemo(() => formatTicketReport(ticket), [ticket]);\n  const validation = useMemo(",
    "  const report = useMemo(() => formatTicketReport(ticket), [ticket]);\n  const duplicateFingerprint = useMemo(() => duplicateLookupFingerprint(ticket), [ticket]);\n  const validation = useMemo(",
    'duplicate fingerprint',
)

replace_once(
    "        resolvedPrimaryIdentity: Boolean(importReview?.identityResolution),\n        now: validationNow,",
    "        resolvedPrimaryIdentity: Boolean(importReview?.identityResolution),\n        duplicateCandidates,\n        now: validationNow,",
    'validation candidates option',
)

replace_once(
    "    [importReview, ticket, validationNow, watchedValues],",
    "    [duplicateCandidates, importReview, ticket, validationNow, watchedValues],",
    'validation dependency',
)

timer_anchor = """  useEffect(() => {
    const timer = window.setInterval(
      () => setValidationNow(new Date()),
      TIME_INTELLIGENCE_REFRESH_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

"""
if text.count(timer_anchor) != 1:
    raise SystemExit(f'validation timer: expected exactly one anchor, got {text.count(timer_anchor)}')

f5_effects = timer_anchor + """  useEffect(() => {
    setDuplicateAcknowledged(false);
  }, [duplicateFingerprint]);

  useEffect(() => {
    if (localDevelopmentMode || !hasDuplicateLookupSignal(ticket)) {
      setDuplicateCandidates([]);
      setDuplicatePending(false);
      setDuplicateError(null);
      return undefined;
    }

    let cancelled = false;
    setDuplicatePending(true);
    setDuplicateError(null);
    const timer = window.setTimeout(() => {
      findDuplicateCandidates(ticket, { excludeTicketId: routeTicketId, limit: 8 })
        .then((candidates) => {
          if (!cancelled) setDuplicateCandidates(candidates);
        })
        .catch((error) => {
          if (!cancelled) {
            setDuplicateCandidates([]);
            setDuplicateError(error);
          }
        })
        .finally(() => {
          if (!cancelled) setDuplicatePending(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [localDevelopmentMode, routeTicketId, ticket]);

  useEffect(() => {
    if (localDevelopmentMode || !routeTicketId || !ticket.incidentGroupId) {
      setRelatedGroup(null);
      setRelatedTickets([]);
      setRelatedPending(false);
      setRelatedError(null);
      return undefined;
    }

    let cancelled = false;
    setRelatedPending(true);
    setRelatedError(null);
    loadRelatedTickets(ticket.incidentGroupId, routeTicketId)
      .then((result) => {
        if (!cancelled) {
          setRelatedGroup(result.group);
          setRelatedTickets(result.tickets);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setRelatedGroup(null);
          setRelatedTickets([]);
          setRelatedError(error);
        }
      })
      .finally(() => {
        if (!cancelled) setRelatedPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [localDevelopmentMode, revision, routeTicketId, ticket.incidentGroupId]);

"""
text = text.replace(timer_anchor, f5_effects, 1)

handler_anchor = "  const notifyInvalidForm = () => {\n"
if text.count(handler_anchor) != 1:
    raise SystemExit(f'handler anchor: expected exactly one anchor, got {text.count(handler_anchor)}')

handlers = """  const handleCreateAnyway = () => {
    setDuplicateAcknowledged(true);
    pushToast({
      title: 'Duplicate warning reviewed',
      message: 'Creation remains allowed. Existing Ticket evidence was not treated as a hard block.',
      tone: 'info',
    });
  };

  const handleRelateCandidate = async (candidate) => {
    if (!routeTicketId || localDevelopmentMode) return;
    if (hasUnsavedChanges) {
      pushToast({
        title: 'Save changes first',
        message: 'Related-Ticket membership changes revision. Save the current editor before linking.',
        tone: 'warning',
      });
      return;
    }

    setRelatePendingId(candidate.id);
    try {
      await relateTicketToCandidate({
        currentTicket: { ...ticket, id: routeTicketId, revision },
        candidate,
      });
      await loadPersistedEditor();
      pushToast({
        title: 'Tickets linked',
        message: 'The Tickets now share an incident group while keeping independent lifecycle and Progress.',
        tone: 'success',
      });
    } catch (error) {
      pushToast({
        title: 'Could not link Tickets',
        message: persistenceMessage(error, error?.message ?? 'Related-Ticket link failed.'),
        tone: 'error',
      });
    } finally {
      setRelatePendingId(null);
    }
  };

  const handleUnlinkCurrent = async () => {
    if (!routeTicketId || localDevelopmentMode || !ticket.incidentGroupId) return;
    if (hasUnsavedChanges) {
      pushToast({
        title: 'Save changes first',
        message: 'Save the current editor before changing incident-group membership.',
        tone: 'warning',
      });
      return;
    }

    setUnlinkPending(true);
    try {
      await unlinkCurrentTicketFromGroup({ ...ticket, id: routeTicketId, revision });
      await loadPersistedEditor();
      pushToast({
        title: 'Ticket unlinked',
        message: 'The current Ticket was removed from the incident group.',
        tone: 'success',
      });
    } catch (error) {
      pushToast({
        title: 'Could not unlink Ticket',
        message: persistenceMessage(error, error?.message ?? 'Related-Ticket unlink failed.'),
        tone: 'error',
      });
    } finally {
      setUnlinkPending(false);
    }
  };

""" + handler_anchor
text = text.replace(handler_anchor, handlers, 1)

render_anchor = "      <ValidationCenter validation={validation} onFocusField={focusValidationField} />\n"
if text.count(render_anchor) != 1:
    raise SystemExit(f'validation render anchor: expected exactly one anchor, got {text.count(render_anchor)}')

panel = """      <DuplicateRelatedPanel
        candidates={duplicateCandidates}
        duplicatePending={duplicatePending}
        duplicateError={duplicateError}
        duplicateAcknowledged={duplicateAcknowledged}
        onCreateAnyway={handleCreateAnyway}
        canRelate={Boolean(routeTicketId && !localDevelopmentMode)}
        hasUnsavedChanges={hasUnsavedChanges}
        relatePendingId={relatePendingId}
        onRelate={handleRelateCandidate}
        relatedGroup={relatedGroup}
        relatedTickets={relatedTickets}
        relatedPending={relatedPending}
        relatedError={relatedError}
        unlinkPending={unlinkPending}
        onUnlinkCurrent={handleUnlinkCurrent}
      />

""" + render_anchor
text = text.replace(render_anchor, panel, 1)

path.write_text(text)
