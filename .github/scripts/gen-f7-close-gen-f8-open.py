from pathlib import Path

TRACKER = Path('docs/08-post-mvp/TEMPLATE-GENERATOR-IMPLEMENTATION-TRACKER.md')
text = TRACKER.read_text()

old_status = (
    '**Status:** GEN-F0 COMPLETE · GEN-F1 COMPLETE · GEN-F2 COMPLETE · GEN-F3 COMPLETE · '
    'GEN-F4 COMPLETE · GEN-F5 COMPLETE · GEN-F6 COMPLETE · GEN-F7 IN PROGRESS'
)
new_status = old_status.replace('GEN-F7 IN PROGRESS', 'GEN-F7 COMPLETE · GEN-F8 IN PROGRESS')
if text.count(old_status) != 1:
    raise SystemExit('tracker status anchor missing or duplicated')
text = text.replace(old_status, new_status, 1)

f7_marker = '## GEN-F7 — Handover + Copy Center + Presets + Commands\n'
remaining_marker = '## Remaining phases\n'
protected_marker = '## Protected contracts\n'

f7_start = text.find(f7_marker)
remaining_start = text.find(remaining_marker)
protected_start = text.find(protected_marker)
if min(f7_start, remaining_start, protected_start) < 0:
    raise SystemExit('tracker phase anchors missing')
if not (f7_start < remaining_start < protected_start):
    raise SystemExit('tracker phase anchors out of order')

f7_block = text[f7_start:remaining_start]
if '### GEN-F7 completion evidence' in f7_block:
    raise SystemExit('GEN-F7 completion evidence already exists')
f7_block = f7_block.replace('- [ ] ', '- [x] ')
if '- [x] Final committed-format verifier green on clean GEN-F7 head.' not in f7_block:
    f7_block = f7_block.rstrip() + '\n- [x] Final committed-format verifier green on clean GEN-F7 head.\n\n'

f7_evidence = '''### GEN-F7 completion evidence

Operator Presets are versioned browser-local preferences with strict whitelisting, stale/malformed fail-safe behavior and Reset to defaults. They cover Template Profile, favorite Progress snippets, default PIC for new Tickets, default Copy target, utility expansion state and event-time behavior without storing role or permission state. Existing favorite-snippet storage is migrated/synchronized so prior local preferences remain usable.

Shift Handover is deterministic and preview/copy-only. It derives TT, status, Occur Time, duration, PIC, Rootcause, Cut Point, recent Progress, Validation Center warnings and related-Ticket count from the current Ticket workspace without AI or hidden persistence. Copy Center exposes canonical Full Report, Title, Impact, Latest Progress, Full Progress Timeline, Coordinate, primary TT, Handover Summary and operational source/alarm outputs through formatter contracts rather than ad-hoc JSX strings.

Generator keyboard/command acceleration remains scoped: `Ctrl/Cmd+S` submits the explicit Generator form while respecting dialog/menu focus boundaries, `Ctrl/Cmd+Enter` remains Progress-editor-only, and Command Palette actions cover Copy Report, Smart Import focus, Progress focus and Validation Center focus. No lifecycle transition received an accidental shortcut.

**Quality #803 — FULL GREEN** on clean GEN-F7 head `a4ae7d9814fa8f2bd58b164aa07cd75a1770ce9a` (run ID `33004227306`).

Validated gates:

- committed Prettier formatting + final committed-format verifier;
- ESLint;
- **311 unit/component tests passed** with 21 emulator-only skips in the normal unit pass;
- Firebase Emulator Ticket repository integration **6/6**;
- Firestore Security Rules matrix **9/9**;
- incident-group repository integration **1/1**;
- incident-group Security Rules **5/5**;
- T7 repository/security hygiene: **32 production dependencies referenced**, no committed fixture/test-data files, legacy UI guard clean;
- T8 Firebase release preflight;
- generic + Firebase-configured production builds;
- dev smoke;
- T6 browser QA at 360x800, 390x844, 412x915 and 1280x900 plus marker-touch QA;
- Playwright **6/6** covering lifecycle, RBAC, keyboard/dialog focus, themes, responsive overflow and serious axe checks.

### GEN-F7 exit criterion

Operators can prepare deterministic handover/copy outputs and accelerate routine Generator work through safe local presets and scoped commands without bypassing explicit Save, revision protection, lifecycle/RBAC, canonical formatting or privacy boundaries.

'''

f8_section = '''## GEN-F8 — Evidence / Attachment Workspace

- [ ] Add a local-only evidence file queue inside the Generator workspace.
- [ ] Validate supported local image evidence with explicit file type, size and bounded queue limits.
- [ ] Show thumbnail/filename/size/type while the original local file is available in the current browser session.
- [ ] Reuse the existing local OCR coordinate pipeline for an explicit per-evidence-item coordinate extraction action.
- [ ] Keep extracted coordinate candidates operator-reviewable before applying them to Ticket coordinates.
- [ ] Store only safe extracted coordinate/evidence metadata where recovery requires it; never persist image bytes, blobs, data URLs or object URLs.
- [ ] Support an operator note per evidence item without embedding raw image content.
- [ ] Support remove and explicit re-attach behavior for local evidence.
- [ ] After reload/recovery, represent metadata-only evidence honestly and never imply that the original local file is still available.
- [ ] Keep local object URLs lifecycle-safe and revoke them when evidence is removed or the workspace unmounts.
- [ ] Add pure-unit coverage for queue normalization, validation bounds, metadata sanitization and privacy exclusions.
- [ ] Add component/page coverage for add, remove, re-attach, OCR metadata, operator notes and metadata-only recovery state.
- [ ] Preserve lifecycle/RBAC/revision/canonical report/import privacy/draft-recovery and bounded-read contracts.
- [ ] Full repository Quality green on clean GEN-F8 head.
- [ ] Final committed-format verifier green on clean GEN-F8 head.

## Remaining phases

- [ ] GEN-F9 — Integrated hardening / feature-release readiness

'''

text = text[:f7_start] + f7_block + f7_evidence + f8_section + text[protected_start:]
TRACKER.write_text(text)
