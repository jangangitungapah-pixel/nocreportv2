from pathlib import Path

page = Path('src/features/ticket-generator/pages/TicketGeneratorPage.jsx')
text = page.read_text()

old_ticket_import = """import {
  TICKET_STATUS,
  TICKET_TITLE_MODE,
  extractExternalTicketNumber,
  formatCoordinatePair,
  formatTicketReport,
  validateCoordinatePair,
  validateTicketTransition,
} from '../../../entities/ticket/index.js';"""
new_ticket_import = old_ticket_import + "\nimport { CAPABILITY } from '../../../entities/user/authorization.js';"
if old_ticket_import not in text:
    raise SystemExit('ticket import anchor missing')
text = text.replace(old_ticket_import, new_ticket_import, 1)

old_component_import = "import { ReportPreview } from '../components/ReportPreview.jsx';\nimport { SmartPasteParser } from '../components/SmartPasteParser.jsx';"
new_component_import = "import { ReportPreview } from '../components/ReportPreview.jsx';\nimport { RevisionHistoryWorkspace } from '../components/RevisionHistoryWorkspace.jsx';\nimport { SmartPasteParser } from '../components/SmartPasteParser.jsx';"
if old_component_import not in text:
    raise SystemExit('component import anchor missing')
text = text.replace(old_component_import, new_component_import, 1)

old_auth = "  const { localDevelopmentMode } = useAuth();"
new_auth = "  const { localDevelopmentMode, can } = useAuth();"
if old_auth not in text:
    raise SystemExit('auth anchor missing')
text = text.replace(old_auth, new_auth, 1)

old_render = """      <ProgressTimeline
        entries={progressEntries}
        onUpdate={updateProgress}
        onRemove={setRemoveProgressId}
      />"""
new_render = old_render + """
      <RevisionHistoryWorkspace
        ticketId={routeTicketId}
        enabled={Boolean(routeTicketId) && !localDevelopmentMode && can(CAPABILITY.READ_AUDIT)}
      />"""
if old_render not in text:
    raise SystemExit('history render anchor missing')
text = text.replace(old_render, new_render, 1)

page.write_text(text)
