# Template Generator Feature Expansion — Implementation Tracker

**Source workplan:** `docs/08-post-mvp/TEMPLATE-GENERATOR-FEATURE-WORKPLAN.md`  
**Evidence annex:** `docs/08-post-mvp/TEMPLATE-GENERATOR-EMAIL-IMPORT-ADDENDUM.md`  
**Branch:** `feature/template-generator-features`  
**PR:** #7  
**Status:** GEN-F0 COMPLETE · GEN-F1 INTEGRATION QA

## GEN-F0 — Baseline, contracts and feature skeleton

- [x] Dedicated implementation branch created from the validated Mega UI foundation.
- [x] Dedicated draft PR created; no merge authorized.
- [x] Normalized Import Candidate contract added.
- [x] Explicit candidate source/confidence vocabulary added.
- [x] `message_metadata` candidate source reserved for Outlook top-level metadata.
- [x] Operational text normalization handles NBSP/whitespace and literal `undefined`.
- [x] Raw external TT normalization preserves the source reference.
- [x] Canonical `incidentKey` normalizes `INC-`, `DWDM-INC-`, and `DATACOM-INC-` variants to the embedded `INC-YYYYMMDD-NNN...` identity.
- [x] Raw alarm preservation + deterministic alarm-family normalization added.
- [x] Ordered `pathEndpoints[]` parsing added.
- [x] Canonical endpoint normalization treats spaces/underscores equivalently for identity.
- [x] Orientation-equivalent `pathKey` added: `A<>B<>C == C<>B<>A` while interior reordering remains distinct.
- [x] `MANDAU_DEFAULT` Template Profile contract added.
- [x] `MANDAU_DEFAULT` timezone locked to `Asia/Jakarta`.
- [x] Email Dispatch Time contract locked to `PR_CLIENT_SUBMIT_TIME` / `0x00390040`.
- [x] Delivery Time fallback explicitly disabled in profile contract.
- [x] Quoted body `Sent:` fallback explicitly disabled in profile contract.
- [x] Non-persisted Ticket schema-v2 feature contract proposal added.
- [x] Schema-v1 compatibility defaults covered without changing production mapper/persistence.
- [x] Sanitized corpus-inspired fixtures added with fake node/TT data only.
- [x] Sanitized fixtures cover multi-point path, reverse orientation, TT prefixes, and quoted `Sent:` risk.
- [x] Pure unit regression coverage added for GEN-F0 contracts.
- [x] Production Generator form behavior unchanged.
- [x] Firestore persistence/schema behavior unchanged.
- [x] RBAC/Security Rules/lifecycle/OCR/canonical report behavior unchanged.
- [x] Prettier formatting committed.
- [x] ESLint green.
- [x] Unit/component suite green.
- [x] Firebase Emulator repository tests green.
- [x] Firestore Security Rules matrix green.
- [x] Repository/dependency hygiene green.
- [x] Release preflight green.
- [x] Generic + Firebase-configured production builds green.
- [x] Dev smoke green.
- [x] Real-browser viewport/touch QA green.
- [x] Playwright lifecycle/RBAC/keyboard/overflow/axe green.
- [x] Final committed-format verifier green on clean head.
- [x] PR returned to stacked base `feature/ui-density-system` after clean integration QA.

### GEN-F0 automated QA evidence

**Quality #747 — FULL GREEN** on final GEN-F0 product/code head `152c82ae1d5d27610c48d9cf3b94d80c6d84efb4` (run ID `32929648966`).

Validated gates:

- committed Prettier formatting + final committed-format verifier;
- ESLint;
- **173 unit/component tests passed** with 13 emulator-only skips in the normal unit pass;
- Firebase Emulator Ticket repository integration **6/6**;
- Firestore Security Rules matrix **7/7**;
- T7 repository/security hygiene: all **31 production dependencies referenced**, no committed real fixture/test-data files, legacy UI guard clean;
- T8 Firebase release preflight;
- generic + Firebase-configured production builds;
- dev smoke;
- T6 browser QA at 360x800, 390x844, 412x915 and 1280x900 plus marker-touch QA;
- Playwright **6/6** covering Login/recovery, Admin lifecycle, Operator/Viewer RBAC, keyboard/dialog focus, Light/Dark persistence/accessibility, and responsive overflow/serious axe checks.

GEN-F0 intentionally changed no production Generator form behavior, Firestore persistence schema, lifecycle, RBAC, OCR or canonical report formatting. Its deliverable is the tested contract foundation for GEN-F1 and later phases.

## GEN-F1 — Unified Import + Outlook `.msg`

- [x] Refactor current Smart Report parser behind a `report_text` source adapter with parity tests.
- [x] Complete browser `.msg` decoder dependency spike and exact-pin `@kenjiuno/msgreader-web-ng@0.2.0-alpha1`.
- [x] Wire the approved browser `.msg` decoder into the local ArrayBuffer adapter behind a lazy app-owned boundary.
- [x] Add a bounded local ArrayBuffer decoder boundary with extension/size/error contracts and no persistence.
- [ ] Validate top-level Outlook Sent Time from a real supported `.msg` fixture through the package decoder's `clientSubmitTime` output.
- [x] Convert decoded Sent instants timezone-aware to `Asia/Jakarta` for Generator `dispatchAt`.
- [x] Explicitly exclude Delivery Time and quoted body `Sent:` from Dispatch Time resolution.
- [x] Add email subject parser for FLP and direct MANDAU variants.
- [x] Add structured body parser for operational labels.
- [x] Add multi-TT reference extraction.
- [x] Add ordered multi-point path extraction.
- [x] Add sanitized HTML-to-text fallback.
- [x] Add `undefined`/blank normalization through the shared GEN-F0 contract.
- [x] Add field source/confidence metadata.
- [x] Add subject/body conflict detection, including prefix-equivalent TT identity handling.
- [x] Add filename fallback at lowest confidence only.
- [x] Add selective Apply model without Firestore writes or silent dirty-field overwrite.
- [x] Preserve existing Smart Paste behavior through adapter parity.
- [x] Add synthetic decoded-message regression fixtures only; no real operational email committed.
- [x] Decoder boundary drops Delivery Time, recipients, headers, attachments and raw properties before the Import Candidate layer.
- [x] Add lazy decoder regression coverage for module loading, privacy boundary, Client Submit Time authority and local validation failures.
- [x] Integrate Unified Import preview/apply into the Generator UI without auto-save.
- [ ] Add a sanitized package-backed supported/corrupt `.msg` fixture regression or equivalent real-decoder evidence without committing operational mail.
- [ ] Full repository Quality green on clean GEN-F1 head.

### GEN-F1 integration checkpoint

The current checkpoint exact-pins `@kenjiuno/msgreader-web-ng@0.2.0-alpha1`, keeps the alpha dependency behind a replaceable lazy adapter, preserves the injectable decoder path for deterministic tests, and integrates a single Unified Import panel for existing report text plus local Outlook `.msg` files.

Selective Apply now preselects only safe empty-field fills. Replacements remain unchecked until the operator explicitly selects them; dirty replacements are confirmed through the existing selective-apply contract. Blocking TT identity conflicts are surfaced instead of guessed, and the Generator apply boundary only mutates the in-memory draft/progress state—never Firestore.

Integration QA is running with PR #7 temporarily retargeted to `main`. The real supported `.msg` fixture gate remains intentionally open until package-backed evidence is available without committing operational mail.

### GEN-F1 exit criterion

A supported Outlook `.msg` can be decoded locally into the shared Import Candidate, with reliable Sent Time → Dispatch Time behavior and conflict-safe preview/apply semantics, without bypassing the existing Generator Save/persistence boundary.

## Remaining phases

- [ ] GEN-F2 — Structured alarm metadata + Template Profile + Smart Title
- [ ] GEN-F3 — Impact Builder + Progress acceleration
- [ ] GEN-F4 — Validation Center + Time Intelligence
- [ ] GEN-F5 — Duplicate Detection + Related Tickets
- [ ] GEN-F6 — Draft Recovery + Revision Diff
- [ ] GEN-F7 — Handover + Copy Center + Presets + Commands
- [ ] GEN-F8 — Evidence workspace
- [ ] GEN-F9 — Integrated hardening / feature-release readiness

## Protected contracts

- Ticket lifecycle meaning remains unchanged.
- `/tickets/:ticketId` remains read-only.
- `/generator/:ticketId/edit` remains explicit mutation entry.
- optimistic revision checks remain authoritative.
- Firebase Security Rules/RBAC remain authoritative.
- OCR remains local-only.
- Email/Smart Import never auto-write Firestore.
- Outlook `.msg` bytes, raw body/HTML, recipient lists, Exchange headers and attachments are not persisted.
- all future duplicate/related-Ticket reads remain bounded.
