# Template Generator Feature Expansion — Implementation Tracker

**Source workplan:** `docs/08-post-mvp/TEMPLATE-GENERATOR-FEATURE-WORKPLAN.md`  
**Evidence annex:** `docs/08-post-mvp/TEMPLATE-GENERATOR-EMAIL-IMPORT-ADDENDUM.md`  
**Branch:** `feature/template-generator-features`  
**PR:** #7  
**Status:** GEN-F0 COMPLETE · GEN-F1 COMPLETE · GEN-F2 COMPLETE · GEN-F3 IN PROGRESS

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
- [x] Validate top-level Outlook Sent Time from a real supported sanitized `.msg` fixture through the package decoder's `clientSubmitTime` output.
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
- [x] Add equivalent package-backed supported/corrupt `.msg` evidence without committing operational mail.
- [x] Full repository Quality green on clean GEN-F1 head.
- [x] Final committed-format verifier green on clean GEN-F1 head.

### GEN-F1 completion evidence

`@kenjiuno/msgreader-web-ng@0.2.0-alpha1` remains exact-pinned behind a replaceable lazy app-owned adapter. Production import validates `.msg` extension/size locally, decodes from `ArrayBuffer`, keeps `clientSubmitTime` as the authoritative Outlook Sent metadata, and drops Delivery Time, recipients, attachments and transport/header details before the Import Candidate boundary.

One-time package-backed evidence run **32933586994** decoded the decoder project's pinned sanitized `sent.msg` fixture through the real npm package and the production adapter. It verified that Client Submit Time and Delivery Time remain distinct, the adapter retains Client Submit Time while excluding Delivery Time/private message fields, and a truncated/corrupt `.msg` is rejected. The fixture was fetched into runner `/tmp`; no operational user email or real `.msg` fixture was committed. The one-time workflow was then archived as manual-only/no-op evidence.

**Quality #754 — FULL GREEN** on final clean GEN-F1 head `8aa9de7772617cc98960d32f2137da1474e6a85d` (run ID `32933704919`).

Validated gates:

- exact dependency installation;
- committed Prettier formatting + final committed-format verifier;
- ESLint;
- unit/component suite;
- Firebase Emulator repository integration;
- Firestore Security Rules matrix;
- T7 repository/security hygiene;
- T8 Firebase release preflight;
- generic + Firebase-configured production builds;
- dev smoke;
- T6 real-browser viewport/touch QA;
- Playwright lifecycle/RBAC/keyboard/overflow/accessibility QA.

GEN-F1 exit criterion is satisfied: a supported Outlook `.msg` can be decoded locally into the shared Import Candidate with current-message Sent Time → Dispatch Time authority and conflict-safe selective preview/apply semantics, without bypassing the existing Generator Save/persistence boundary.

## GEN-F2 — Structured metadata + Template Profile + Smart Title

- [x] Extend Ticket entity with backward-compatible optional schema-v2 operational metadata.
- [x] Keep schema-v1 documents readable through backward-compatible mapper defaults.
- [x] Persist structured alarm metadata only through normal Ticket Save/update.
- [x] Update Firestore writes without bypassing revision protection.
- [x] Update Firestore Security Rules for the optional structured metadata shape.
- [x] Extend Security Rules emulator matrix for valid/invalid v2 metadata writes.
- [x] Persist raw alarm + normalized `alarmFamily` without destroying source text.
- [x] Persist `pathKey` + ordered `pathEndpoints` with N-endpoint support.
- [x] Persist compact Outlook Sent-time provenance without raw email/body/header data.
- [x] Promote `MANDAU_DEFAULT` from contract skeleton into the production Template Profile path.
- [x] Add deterministic `MANDAU_DEFAULT` Smart Title generator.
- [x] Support transport/family variants in generated titles.
- [x] Support N-endpoint ordered paths in generated titles.
- [x] Add Generated / Manual override title state.
- [x] Manual title edits do not get silently replaced by regenerated metadata.
- [x] Add explicit Regenerate action.
- [x] Add unit coverage for schema-v2 defaults, alarm normalization, path topology/orientation, metadata/provenance and Smart Title formatting.
- [x] Add component coverage for Generated / Manual override / Regenerate behavior.
- [x] Preserve canonical report determinism and existing lifecycle/RBAC/OCR contracts.
- [x] Full repository Quality green on clean GEN-F2 head.
- [x] Final committed-format verifier green on clean GEN-F2 head.
- [x] PR returned to stacked base `feature/ui-density-system` after clean integration QA.

### GEN-F2 completion evidence

Production Ticket writes now use backward-compatible schema v2 metadata while schema-v1 Tickets remain readable and may upgrade only through a normal revision-safe Save. Structured alarm/path identity, ordered N-endpoint paths, `incidentKey`, `pathKey`, Template Profile state and compact Outlook Sent provenance are persisted without raw email body/HTML/recipient/header/attachment data. Security Rules permit v1/v2 with controlled v1→v2 migration and reject malformed v2 metadata or v2→v1 downgrade.

`MANDAU_DEFAULT` is now the production Template Profile used by deterministic Smart Title generation. Title generation consumes normalized metadata, supports transport/family variants and ordered N-endpoint paths, preserves manual edits through a `MANUAL` override mode, and returns to generated mode only through explicit Regenerate. The canonical Title TT remains authoritative for primary TT/`incidentKey` compatibility when an operator edits it manually.

**Quality #762 — FULL GREEN** on final clean GEN-F2 head `fb02d59d41e31c14f9b39944b7a3e807fb32cfbb` (run ID `32949117038`).

Validated gates:

- committed Prettier formatting + final committed-format verifier;
- ESLint;
- unit/component suite including GEN-F2 schema/metadata/Smart Title regressions;
- Firebase Emulator repository integration + schema-v2 Security Rules matrix;
- T7 repository/security hygiene;
- T8 Firebase release preflight;
- generic + Firebase-configured production builds;
- dev smoke;
- T6 real-browser viewport/touch QA;
- T7 Playwright lifecycle/RBAC/keyboard/overflow/accessibility QA.

GEN-F2 exit criterion is satisfied: imported operational metadata survives normal Ticket Save safely and remains backward-compatible with schema-v1 Tickets, while deterministic Smart Title generation supports transport variants and ordered N-endpoint paths without silently overwriting a manual title.

## GEN-F3 — Impact Builder + Progress acceleration

- [ ] Add a dedicated Impact candidate parser for operator-pasted service/node lists.
- [ ] Support multiline Impact parsing with bullet/number normalization.
- [ ] Filter safe exact-normalized Impact duplicates while preserving meaningful order.
- [ ] Reuse Impact candidate normalization for imported Impact blocks where appropriate.
- [ ] Add preview/select proposed Impact items before applying them to the live form.
- [ ] Keep Impact manually editable after apply; never infer impact from Site ID/topology alone.
- [ ] Preserve existing report-text Impact import compatibility.
- [ ] Keep Quick Progress inside the existing Generator workspace.
- [ ] Preserve current-time default and editable Progress event time.
- [ ] Preserve pending/error draft retention and stale-revision handling.
- [ ] Add profile-owned reusable Progress snippet library for Dispatch, Arrival, Investigation, OTDR, Material, Jointing, Monitoring, Clearance and Escalation.
- [ ] Add deterministic snippet placeholder resolver with required-placeholder validation.
- [ ] Snippets fill the Progress editor only and never auto-submit.
- [ ] Keep generated snippet text manually editable before submit.
- [ ] Add versioned browser-local favorite snippets with invalid/stale storage fail-safe behavior.
- [ ] Keep `Ctrl/Cmd+Enter` scoped to the Progress editor and add regression coverage.
- [ ] Persist Progress for existing Tickets only through revision-safe `persistProgressAppend`.
- [ ] Keep Progress local-only for a new unsaved Ticket until initial create.
- [ ] Add pure-unit coverage for Impact parsing/de-duplication and snippet placeholders/preferences.
- [ ] Add component coverage for Impact preview/select, Quick Progress, snippets, favorites and keyboard submit.
- [ ] Preserve lifecycle/RBAC/canonical report/OCR/import privacy contracts.
- [ ] Full repository Quality green on clean GEN-F3 head.

### GEN-F3 exit criterion

Routine operator Impact and Progress updates require materially fewer keystrokes while all changes still flow through the existing explicit form and revision-safe persistence boundaries.

## Remaining phases

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
