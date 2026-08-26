from pathlib import Path

TRACKER = Path('docs/08-post-mvp/TEMPLATE-GENERATOR-IMPLEMENTATION-TRACKER.md')
text = TRACKER.read_text()

old_status = (
    '**Status:** GEN-F0 COMPLETE · GEN-F1 COMPLETE · GEN-F2 COMPLETE · GEN-F3 COMPLETE · '
    'GEN-F4 COMPLETE · GEN-F5 COMPLETE · GEN-F6 COMPLETE · GEN-F7 COMPLETE · GEN-F8 IN PROGRESS'
)
new_status = old_status.replace('GEN-F8 IN PROGRESS', 'GEN-F8 COMPLETE · GEN-F9 IN PROGRESS')
if text.count(old_status) != 1:
    raise SystemExit('tracker status anchor missing or duplicated')
text = text.replace(old_status, new_status, 1)

f8_marker = '## GEN-F8 — Evidence / Attachment Workspace\n'
remaining_marker = '## Remaining phases\n'
protected_marker = '## Protected contracts\n'

f8_start = text.find(f8_marker)
remaining_start = text.find(remaining_marker)
protected_start = text.find(protected_marker)
if min(f8_start, remaining_start, protected_start) < 0 or not (f8_start < remaining_start < protected_start):
    raise SystemExit('GEN-F8/remaining/protected anchors invalid')

f8_complete = '''## GEN-F8 — Evidence / Attachment Workspace

- [x] Add a local-only evidence file queue inside the Generator workspace.
- [x] Validate supported local image evidence with explicit file type, size and bounded queue limits.
- [x] Show thumbnail/filename/size/type while the original local file is available in the current browser session.
- [x] Reuse the existing local OCR coordinate pipeline for an explicit per-evidence-item coordinate extraction action.
- [x] Keep extracted coordinate candidates operator-reviewable before applying them to Ticket coordinates.
- [x] Store only safe extracted coordinate/evidence metadata where recovery requires it; never persist image bytes, blobs, data URLs or object URLs.
- [x] Support an operator note per evidence item without embedding raw image content.
- [x] Support remove and explicit re-attach behavior for local evidence.
- [x] After reload/recovery, represent metadata-only evidence honestly and never imply that the original local file is still available.
- [x] Keep local object URLs lifecycle-safe and revoke them when evidence is removed or the workspace unmounts.
- [x] Add pure-unit coverage for queue normalization, validation bounds, metadata sanitization and privacy exclusions.
- [x] Add component/page coverage for add, remove, re-attach, OCR metadata, operator notes and metadata-only recovery state.
- [x] Preserve lifecycle/RBAC/revision/canonical report/import privacy/draft-recovery and bounded-read contracts.
- [x] Full repository Quality green on clean GEN-F8 head.
- [x] Final committed-format verifier green on clean GEN-F8 head.

### GEN-F8 completion evidence

Evidence Workspace is a bounded local-only image queue inside the Generator. It accepts the existing OCR-supported JPG/PNG/WebP types, reuses the established 15 MB per-image validator, caps the queue at eight items, and keeps original `File` objects plus object-URL thumbnails only for the current browser session. Preview URLs are revoked on removal/replacement/unmount.

Each evidence item supports a bounded operator note, explicit remove/re-attach, and an explicit per-item coordinate scan through the existing local OCR pipeline. OCR candidates remain reviewable and never apply Ticket coordinates until the operator explicitly selects one. The resulting coordinate flows through the existing editable coordinate path rather than creating a second persistence boundary.

Draft Recovery stores only sanitized evidence metadata. It excludes image bytes, `File` objects, blobs, data/object URLs, raw OCR text and OCR attempts. After reload, recovered evidence is honestly shown as metadata-only with `Re-attach required`; the UI never implies that the original local file survived the browser session.

**Quality #804 — FULL GREEN** on clean GEN-F8 no-op gate head `ed43ed69d0b222c545b495799e32b86ef945a574` (run ID `33008030885`). The no-op gate commit uses the exact product tree from clean head `319c1b1c973cb1986eac26236f923f31b85dad45`; no product/file content changed in the trigger commit.

Validated gates:

- committed Prettier formatting + final committed-format verifier;
- ESLint;
- **321 unit/component tests passed** with 21 emulator-only skips in the normal unit pass;
- GEN-F8 focused coverage: Evidence contract **5/5**, Evidence Workspace component **3/3**, evidence-only page recovery **1/1**, recovery privacy **1/1**;
- Firebase Emulator Ticket repository integration **6/6**;
- Firestore Security Rules matrix **9/9**;
- incident-group repository integration **1/1**;
- incident-group Security Rules **5/5**;
- T7 repository/security hygiene: **32 production dependencies referenced**, no committed fixture/test-data files, legacy UI guard clean;
- T8 Firebase release preflight;
- generic + Firebase-configured production builds;
- dev smoke;
- T6 browser QA at 360x800, 390x844, 412x915 and 1280x900 plus marker-touch QA at 390x844;
- Playwright **6/6** covering Login/recovery, Admin lifecycle through OCR/resolve/archive/restore, Operator/Viewer RBAC, keyboard/dialog focus, Light/Dark accessibility and primary-route responsive overflow/serious axe checks.

### GEN-F8 exit criterion

Evidence now assists the operator through a bounded local workspace and the existing OCR coordinate flow without weakening storage/privacy architecture, Firestore boundaries, lifecycle/RBAC, revision protection or Draft Recovery honesty.

'''

f9_section = '''## GEN-F9 — Integrated Hardening / Feature Release Readiness

- [ ] Prettier + committed-format verification.
- [ ] ESLint.
- [ ] Run all unit/component tests.
- [ ] Run Firebase Emulator repository tests.
- [ ] Run Firestore Security Rules matrix.
- [ ] Run dependency/security/legacy hygiene.
- [ ] Run release preflight.
- [ ] Run generic production build.
- [ ] Run Firebase-configured production build.
- [ ] Run real-browser responsive/touch matrix.
- [ ] Validate Admin lifecycle E2E.
- [ ] Validate Operator/Viewer RBAC E2E.
- [ ] Add `.msg` import E2E with a sanitized fixture.
- [ ] Add Sent Time → Dispatch Time E2E.
- [ ] Add quoted `Sent:` rejection E2E.
- [ ] Add selective overwrite-safety E2E.
- [ ] Add multi-endpoint path E2E.
- [ ] Add duplicate detection E2E.
- [ ] Add draft restore E2E.
- [ ] Add revision diff E2E.
- [ ] Validate keyboard shortcut E2E.
- [ ] Validate Light/Dark serious/critical axe.
- [ ] Validate mobile no-horizontal-overflow.
- [ ] Obtain human NOC workflow acceptance; do not infer or fabricate sign-off.
- [ ] Close the workplan with final release evidence after every automated gate and human acceptance are satisfied.

### GEN-F9 exit criterion

The complete Template Generator feature program is production-ready only after the integrated automated hardening matrix is clean and human NOC workflow acceptance is explicitly recorded. Visual overhaul may start afterward.

'''

text = text[:f8_start] + f8_complete + f9_section + text[protected_start:]
TRACKER.write_text(text)
