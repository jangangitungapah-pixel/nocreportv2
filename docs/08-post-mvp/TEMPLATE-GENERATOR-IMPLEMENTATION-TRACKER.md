# Template Generator Feature Expansion — Implementation Tracker

**Source workplan:** `docs/08-post-mvp/TEMPLATE-GENERATOR-FEATURE-WORKPLAN.md`  
**Evidence annex:** `docs/08-post-mvp/TEMPLATE-GENERATOR-EMAIL-IMPORT-ADDENDUM.md`  
**Branch:** `feature/template-generator-features`  
**PR:** #7  
**Status:** GEN-F0 COMPLETE · GEN-F1 COMPLETE · GEN-F2 COMPLETE · GEN-F3 COMPLETE · GEN-F4 COMPLETE · GEN-F5 COMPLETE · GEN-F6 COMPLETE · GEN-F7 COMPLETE · GEN-F8 COMPLETE · GEN-F9 IN PROGRESS

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

- [x] Add a dedicated Impact candidate parser for operator-pasted service/node lists.
- [x] Support multiline Impact parsing with bullet/number normalization.
- [x] Filter safe exact-normalized Impact duplicates while preserving meaningful order.
- [x] Reuse Impact candidate normalization for imported Impact blocks where appropriate.
- [x] Add preview/select proposed Impact items before applying them to the live form.
- [x] Keep Impact manually editable after apply; never infer impact from Site ID/topology alone.
- [x] Preserve existing report-text Impact import compatibility.
- [x] Keep Quick Progress inside the existing Generator workspace.
- [x] Preserve current-time default and editable Progress event time.
- [x] Preserve pending/error draft retention and stale-revision handling.
- [x] Add profile-owned reusable Progress snippet library for Dispatch, Arrival, Investigation, OTDR, Material, Jointing, Monitoring, Clearance and Escalation.
- [x] Add deterministic snippet placeholder resolver with required-placeholder validation.
- [x] Snippets fill the Progress editor only and never auto-submit.
- [x] Keep generated snippet text manually editable before submit.
- [x] Add versioned browser-local favorite snippets with invalid/stale storage fail-safe behavior.
- [x] Keep `Ctrl/Cmd+Enter` scoped to the Progress editor and add regression coverage.
- [x] Persist Progress for existing Tickets only through revision-safe `persistProgressAppend`.
- [x] Keep Progress local-only for a new unsaved Ticket until initial create.
- [x] Add pure-unit coverage for Impact parsing/de-duplication and snippet placeholders/preferences.
- [x] Add component coverage for Impact preview/select, Quick Progress, snippets, favorites and keyboard submit.
- [x] Preserve lifecycle/RBAC/canonical report/OCR/import privacy contracts.
- [x] Full repository Quality green on clean GEN-F3 head.
- [x] Final committed-format verifier green on clean GEN-F3 head.

### GEN-F3 completion evidence

Impact Builder now normalizes pasted multiline service/node lists, strips safe bullet/number prefixes, removes only exact-normalized duplicates, preserves meaningful order and requires explicit operator selection before applying proposals. Applied Impact rows remain ordinary editable Generator form values; no impact is inferred from topology or Site ID alone. Existing Smart Report Impact parsing reuses the shared normalization without breaking report-text import compatibility.

Quick Progress remains inside the existing Generator and continues to use the established progress persistence path. `MANDAU_DEFAULT` owns reusable Dispatch, Arrival, Investigation, OTDR, Material, Jointing, Monitoring, Clearance and Escalation snippets. Required placeholders are resolved deterministically, snippets only fill the editor, generated text remains editable, favorites are optional versioned browser-local preferences, event time defaults to now but remains editable, and `Ctrl/Cmd+Enter` stays scoped to the Progress editor. Existing Tickets still append through the expected revision boundary; new unsaved Ticket progress stays local until initial create.

Focused GEN-F3 integration evidence covered Impact parsing/de-duplication, Impact preview/select/manual edit, Progress snippets/placeholders/favorites, editable event time, keyboard submission, report-text parity and revision-safe progress persistence. The one-time formatter gate ran those focused regressions before committing the exact Prettier output and was removed from the branch afterward.

**Quality #768 — FULL GREEN** on final clean GEN-F3 product/code head `ed2ab93412848986e2ef5e84bd6dbe8f9dda218b` (run ID `32965402882`).

Validated gates:

- committed Prettier formatting + final committed-format verifier;
- ESLint;
- **231 unit/component tests passed** with 15 emulator-only skips in the normal unit pass;
- Firebase Emulator Ticket repository integration **6/6**;
- Firestore Security Rules matrix **9/9**;
- T7 repository/security hygiene: **32 production dependencies referenced**, no committed fixture/test-data files, legacy UI guard clean;
- T8 Firebase release preflight;
- generic + Firebase-configured production builds;
- dev smoke;
- T6 browser QA at 360x800, 390x844, 412x915 and 1280x900 plus marker-touch QA;
- Playwright **6/6** covering lifecycle, RBAC, keyboard/dialog focus, themes, responsive overflow and serious axe checks.

GEN-F3 exit criterion is satisfied: routine operator Impact and Progress updates require materially fewer keystrokes while changes still flow through the existing explicit form and revision-safe persistence boundaries.

## GEN-F4 — Validation Center + Time Intelligence

- [x] Add a derived Validation finding model with blocking/warning severity and field/action targeting.
- [x] Bridge Generator/Zod field errors into Validation Center findings without creating divergent validation rules.
- [x] Bridge domain lifecycle validation into Validation Center findings.
- [x] Surface unresolved source/import conflict findings where source evidence is available.
- [x] Surface missing Outlook Sent Time / Dispatch Time review finding without inventing a fallback.
- [x] Surface coordinate verification finding for unverified OCR/manual coordinate states where applicable.
- [x] Reserve bounded duplicate/suspected-duplicate warning integration for GEN-F5 without adding unbounded reads.
- [x] Add derived incident elapsed time.
- [x] Add derived dispatch delay as Dispatch Time minus Occur Time.
- [x] Add derived age since latest Progress / latest update age.
- [x] Add derived resolved duration where resolution timestamps are available.
- [x] Add focus-to-field actions from Validation Center findings.
- [x] Keep warning-only findings non-blocking and add no SLA breach/judgement semantics.
- [x] Refresh time intelligence at minute-level only; no second-by-second global rerender.
- [x] Add pure-unit coverage for finding derivation, time ordering and time metrics.
- [x] Add component coverage for blocking/warning rendering and focus-to-field actions.
- [x] Preserve lifecycle/RBAC/revision/canonical report/OCR/import privacy contracts.
- [x] Full repository Quality green on clean GEN-F4 head.
- [x] Final committed-format verifier green on clean GEN-F4 head.

### GEN-F4 completion evidence

The Generator now derives one Validation Center from existing Zod form validation, domain Running requirements, import conflict evidence, coordinate verification state and normalized timestamps. Blocking findings remain separate from warnings/informational gaps, findings can focus the relevant Generator field, and warning-only findings do not block normal Draft Save behavior.

Time Intelligence derives incident elapsed time, Dispatch delay, latest Progress age, latest update age and resolved duration at minute-level refresh. `MANDAU_DEFAULT` remains explicit `Asia/Jakarta`; Outlook-derived Dispatch calculations prioritize persisted `PR_CLIENT_SUBMIT_TIME` provenance and never substitute Delivery Time. No SLA breach judgement or second-by-second global rerender was introduced.

A GEN-F4 regression investigation found and fixed a referential render loop in Unified Import analysis defaults. Stable shared empty defaults removed the loop; the formerly timing-out `SmartPasteParser.validation.test.jsx` then passed in isolation and in the full unit/component suite. Temporary diagnostic/recovery workflows were removed before final integration QA.

**Quality #778 — FULL GREEN** on final clean GEN-F4 product/code head `6198e7aed522c7ca3146d95268eead52c306b956` (run ID `32974216637`).

Validated gates:

- committed Prettier formatting + final committed-format verifier;
- ESLint;
- **248 unit/component tests passed** with 15 emulator-only skips in the normal unit pass;
- Firebase Emulator Ticket repository integration **6/6**;
- Firestore Security Rules matrix **9/9**;
- T7 repository/security hygiene: **32 production dependencies referenced**, no committed fixture/test-data files, legacy UI guard clean;
- T8 Firebase release preflight;
- generic + Firebase-configured production builds;
- dev smoke;
- T6 browser QA at 360x800, 390x844, 412x915 and 1280x900 plus marker-touch QA;
- Playwright **6/6** covering lifecycle, RBAC, keyboard/dialog focus, themes, responsive overflow and serious axe checks.

GEN-F4 exit criterion is satisfied: the Generator presents one derived Validation Center that reuses existing form/domain rules, distinguishes blocking findings from warnings, links findings back to the relevant field, and adds timestamp-derived operational context without introducing SLA judgement or a second validation authority.

## GEN-F5 — Duplicate Detection + Related Tickets

- [x] Add deterministic advisory duplicate scoring with explicit matching reasons.
- [x] Treat exact `externalTtNumber` match as critical duplicate evidence.
- [x] Treat same canonical `incidentKey` as critical/high relationship evidence.
- [x] Treat same `pathKey` within the bounded occurrence-time window as high evidence.
- [x] Treat an active same-`pathKey` Ticket as high evidence without making it a hard block.
- [x] Treat Site ID + alarm family + close Occur Time as medium evidence where structured metadata exists.
- [x] Keep normalized title similarity weak fallback evidence only.
- [x] Do not treat different EMS Alarm Numbers as proof of different physical incidents.
- [x] Add bounded Firestore lookup priority: exact TT, incidentKey, active/recent pathKey, then bounded recent fallback only if justified.
- [x] Add any required Firestore indexes without introducing collection-wide client scans.
- [x] Feed duplicate candidates into the existing Validation Center as warning-only findings.
- [x] Show candidate TT, status, Occur Time, latest update and matching reasons.
- [x] Provide Review existing Ticket and explicit Create anyway behavior without silently blocking creation.
- [x] Add `incidentGroups/{groupId}` repository/model boundary with bounded related-Ticket reads.
- [x] Support create group from a duplicate suggestion, link Ticket, unlink Ticket and bounded related-Ticket listing.
- [x] Keep each related Ticket lifecycle, revision and Progress state independent.
- [x] Keep related/duplicate mutations inside existing RBAC/revision-safe persistence boundaries.
- [x] Add pure-unit coverage for scoring/reason ordering/time windows.
- [x] Add Firebase Emulator coverage for bounded duplicate/group persistence behavior and Security Rules where required.
- [x] Add component coverage for advisory candidate review and explicit operator actions.
- [x] Preserve canonical report/OCR/import privacy and all protected contracts.
- [x] Full repository Quality green on clean GEN-F5 head.

### GEN-F5 completion evidence

Duplicate detection now uses deterministic advisory scoring with explicit reasons and bounded Firestore candidate lookup. Exact TT and canonical incident identity remain the strongest evidence, path/time and active-path evidence are high signals, structured Site ID + alarm-family proximity is medium evidence, title similarity remains weak fallback only, and different EMS Alarm Numbers are never treated as proof of unrelated physical incidents. Validation Center surfaces suspected duplicates as warnings while the operator explicitly chooses Review existing Ticket, Create anyway or related-Ticket actions.

Related incidents use bounded `incidentGroups/{groupId}` documents while every Ticket retains independent lifecycle, revision and Progress state. Link/unlink/group creation routes remain revision-safe, reject conflicting group membership, and never silently merge Tickets. Firestore Security Rules enforce role checks plus Ticket/group post-transaction membership consistency, reject pre-linked Ticket creation and forged `incidentGroupId` mutation, and preserve schema-v1 → v2 upgrades where an absent group field becomes explicit `null`.

**GEN-F5 QA #8 — FULL GREEN** for final product/code head `3a465742a180d71bfe0502e237665ecc300e8c62` through read-only QA wrapper head `014b08800d36bf8a360487315110833f5fd635c8` (run ID `32993651051`). The wrapper added only the QA workflow and trigger; product code under test was the exact `3a465742` tree.

Validated gates:

- committed Prettier formatting;
- ESLint;
- **272 unit/component tests passed** with emulator-only suites skipped in the normal unit pass;
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

### GEN-F5 exit criterion

Potential duplicate or related incidents are surfaced early through bounded indexed reads and deterministic advisory evidence, while the operator retains explicit control to review, create anyway or link incidents and every Ticket keeps independent lifecycle/revision/Progress semantics.

## GEN-F6 — Draft Recovery + Revision Diff

- [x] Add versioned browser-local draft recovery with a bounded TTL.
- [x] Recover new-Ticket form values, selected Template Profile, local Progress Timeline entries and the current Progress composer draft.
- [x] Keep recovery local-only; never store `.msg` bytes, raw email body/HTML, OCR image bytes or attachment blobs.
- [x] Add explicit Restore / Discard UX and clear recovery after successful persistence.
- [x] Key existing-Ticket recovery by Ticket ID + base revision and require manual review when the cloud revision changed.
- [x] Preserve revision-safe Ticket/Progress persistence as the only cloud mutation boundary.
- [x] Add compact operational `TICKET_UPDATED` revision diffs while keeping status/Progress/coordinate events on dedicated semantics.
- [x] Keep old audit events without diff readable.
- [x] Add bounded latest-50 Audit History reads with deterministic ordering.
- [x] Gate Audit History through the existing `audit:read` capability so Operator/Viewer do not issue Admin-only reads.
- [x] Add pure-unit coverage for recovery sanitization/TTL/stale-revision behavior and revision diff generation.
- [x] Add component/page coverage for Restore, Discard, local Progress recovery, Audit History and capability gating.
- [x] Add audit-query contract coverage for the hard 50-event cap and backward-compatible legacy event mapping.
- [x] Preserve lifecycle/RBAC/canonical report/OCR/import privacy and bounded-read contracts.
- [x] Full repository Quality green on clean GEN-F6 head.
- [x] Final committed-format verifier green on clean GEN-F6 head.

### GEN-F6 completion evidence

Draft Recovery is now an explicit browser-local safety net rather than hidden Firestore auto-save. New Ticket recovery restores safe form values, Template Profile state, local Progress Timeline entries and the in-progress Progress composer draft. Existing Ticket snapshots remain revision-aware; if the cloud revision moved, recovery is surfaced for manual review rather than silently overwriting newer data. Recovery sanitization excludes Outlook message bytes/body/HTML, OCR image bytes and attachment blobs, expires snapshots by TTL and clears them after explicit persistence or Discard.

Future `TICKET_UPDATED` audit events now carry compact operational field diffs with revision boundaries. Legacy audit events without diffs remain readable, while status, Progress and coordinate events keep their existing dedicated semantics. Revision History uses a bounded newest-first query capped at 50 and is only enabled for identities with the existing `audit:read` capability.

**Quality #801 — FULL GREEN** on clean GEN-F6 head `2b571d38c937359295200899693176dacc240f1b` (run ID `33000123863`).

Validated gates:

- committed Prettier formatting + final committed-format verifier;
- ESLint;
- **294 unit/component tests passed** with 21 emulator-only skips in the normal unit pass;
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

### GEN-F6 exit criterion

Operators can recover interrupted local authoring without bypassing explicit persistence, while Admin audit readers can inspect a bounded, backward-compatible revision history with compact operational diffs. Revision checks, privacy boundaries and immutable audit semantics remain authoritative.

## GEN-F7 — Handover + Copy Center + Presets + Commands

- [x] Add versioned browser-local Operator Presets with safe invalid/stale-storage fallback and Reset to defaults.
- [x] Support default Template Profile, favorite Progress snippets, operationally allowed default PIC, default Copy action, utility expansion state and default event-time behavior without storing RBAC state.
- [x] Generate a deterministic Shift Handover Summary from current Ticket state.
- [x] Include TT, status, Occur Time, duration, PIC, Rootcause, Cut Point, recent/latest Progress, Validation Center warnings and related-Ticket count in the Handover model where available.
- [x] Keep Handover preview/copy-only by default; no AI or hidden persistence.
- [x] Add Copy Center targets for Full Report, Title, Impact, Latest Progress, Full Progress Timeline, Coordinate, primary TT, Handover Summary and operational source/alarm summary.
- [x] Route Copy Center output through canonical formatter functions instead of ad-hoc JSX strings.
- [x] Add `Ctrl/Cmd+S` Save shortcut scoped safely to the Generator workspace.
- [x] Preserve `Ctrl/Cmd+Enter` as Progress-only when the Progress editor owns focus.
- [x] Add Command Palette actions for Copy Report, focus Smart Import, focus Progress and focus Validation Center.
- [x] Do not add easy accidental keyboard shortcuts for lifecycle transitions.
- [x] Keep dialog/menu keyboard scopes safe and preserve accessibility behavior.
- [x] Add pure-unit coverage for presets, handover formatting and copy-target formatting.
- [x] Add component/page coverage for Copy Center, presets, shortcuts and Command Palette actions.
- [x] Preserve lifecycle/RBAC/revision/canonical report/OCR/import privacy/bounded-read contracts.
- [x] Full repository Quality green on clean GEN-F7 head.
- [x] Final committed-format verifier green on clean GEN-F7 head.

### GEN-F7 completion evidence

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

## GEN-F8 — Evidence / Attachment Workspace

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

## GEN-F9 — Integrated Hardening / Feature Release Readiness

- [x] Prettier + committed-format verification.
- [x] ESLint.
- [x] Run all unit/component tests.
- [x] Run Firebase Emulator repository tests.
- [x] Run Firestore Security Rules matrix.
- [x] Run dependency/security/legacy hygiene.
- [x] Run release preflight.
- [x] Run generic production build.
- [x] Run Firebase-configured production build.
- [x] Run real-browser responsive/touch matrix.
- [x] Validate Admin lifecycle E2E.
- [x] Validate Operator/Viewer RBAC E2E.
- [x] Add `.msg` import E2E with a sanitized fixture.
- [x] Add Sent Time → Dispatch Time E2E.
- [x] Add quoted `Sent:` rejection E2E.
- [x] Add selective overwrite-safety E2E.
- [x] Add multi-endpoint path E2E.
- [x] Add duplicate detection E2E.
- [x] Add draft restore E2E.
- [x] Add revision diff E2E.
- [x] Validate keyboard shortcut E2E.
- [x] Validate Light/Dark serious/critical axe.
- [x] Validate mobile no-horizontal-overflow.
- [ ] Obtain human NOC workflow acceptance; do not infer or fabricate sign-off.
- [ ] Close the workplan with final release evidence after every automated gate and human acceptance are satisfied.

### GEN-F9 automated QA evidence

**Focused GEN-F9 browser QA — GREEN.** Workflow run ID `33010779128`, successful attempt 5, validated the runtime Outlook `.msg` path plus current-message Sent metadata authority / quoted `Sent:` rejection, selective dirty-field overwrite safety, three-endpoint import, bounded duplicate advisory with explicit Create anyway, Draft Recovery, revision diff/audit history, and Generator `Ctrl+S`. Result: **7/7 passed**. The phase-only focused workflow was removed after success.

**Quality #807 — FULL GREEN** on automated-gate head `6bd6485ebf8c19e7aa6ab419b6f2e5965bd764bb` (run ID `33013473856`). Validated committed Prettier formatting, ESLint, full unit/component suite, Firebase Emulator repository integration, Firestore Security Rules coverage, dependency/security/legacy hygiene, release preflight, generic and Firebase-configured production builds, dev smoke, real-browser responsive/touch QA, canonical Admin lifecycle and Operator/Viewer RBAC Playwright coverage, Light/Dark accessibility checks, mobile overflow coverage, and the final committed-format verifier.

Automated GEN-F9 hardening is green. **Human NOC workflow acceptance remains outstanding and is intentionally not inferred or fabricated.** GEN-F9 stays IN PROGRESS until the user explicitly provides that acceptance; final release evidence/closeout also remains pending until then.

### GEN-F9 exit criterion

The complete Template Generator feature program is production-ready only after the integrated automated hardening matrix is clean and human NOC workflow acceptance is explicitly recorded. Visual overhaul may start afterward.

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