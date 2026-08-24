# NOC Report Template Generator — Implementation Workplan & Phase Tracker

**Document ID:** NOCREPORT-WORKPLAN-001  
**Version:** 0.3  
**Status:** Active Project Tracker  
**Repository:** `jangangitungapah-pixel/nocreportv2`  
**Purpose:** Canonical implementation order, phase completion criteria, and persistent project progress tracker.

---

# 1. Purpose

This document is the operational implementation tracker for NOC Report Template Generator.

It exists so that every development session starts from a known project state instead of relying on conversation history or memory.

This file is the canonical answer to:

- what has already been completed;
- what phase is currently active;
- what must be implemented next;
- what acceptance gates must pass before moving forward;
- which documentation or architecture decisions remain unresolved.

The implementation sequence in this workplan is derived from:

- `docs/00-product/MASTER-PRD.md`
- `docs/01-ux/UI-UX-PRD.md`
- `docs/02-architecture/TECHNICAL-ARCHITECTURE-TDD.md`
- `docs/03-data/DATA-DATABASE-PRD.md`
- `docs/04-api/API-INTEGRATION-PRD.md`
- `docs/05-security/SECURITY-ACCESS-CONTROL-PRD.md`

If this workplan conflicts with a source-of-truth PRD/TDD, the PRD/TDD takes precedence and this workplan must be updated.

---

# 2. Tracker Rules

## TRACK-01 — This document must be updated after every completed phase

When a phase is completed:

1. change the phase checkbox from `[ ]` to `[x]`;
2. mark all required phase checklist items `[x]`;
3. update the phase status to `COMPLETE`;
4. record the completion commit/PR reference when available;
5. add a concise completion note if an architectural decision changed during implementation;
6. move `Current Active Phase` to the next incomplete phase.

A phase must never be checked complete simply because code was written.

---

## TRACK-02 — Completion requires quality gates

A phase is complete only when:

- implementation scope is finished;
- relevant automated tests pass;
- lint passes;
- formatting checks pass when configured;
- build passes;
- no known blocker remains inside that phase;
- relevant documentation is updated when implementation changed a documented contract.

---

## TRACK-03 — No silent scope skipping

If a planned item is intentionally deferred, it must not simply be checked complete.

Use:

```text
[~] Deferred — reason
```

and record where it was moved.

GitHub Markdown does not render `[~]` as a checkbox, so it is used only as an explicit tracker notation.

---

## TRACK-04 — Architecture drift requires documentation update

If implementation requires introducing or replacing a major architecture dependency, update the relevant PRD/TDD first.

Examples:

- Next.js;
- Cloud Functions;
- Cloud Storage;
- a custom backend server;
- a different map provider architecture;
- a global state framework;
- server-side OCR;
- a different database topology.

Do not let implementation silently redefine architecture.

---

## TRACK-05 — One active implementation phase at a time

Development should normally complete the active phase before beginning the next one.

Small preparatory changes for a later phase are allowed only when they are necessary to complete the active phase.

---

# 3. Current Project Status

**Overall status:** IMPLEMENTATION IN PROGRESS  
**Current Active Phase:** `T7 — Hardening, Security Validation & Full QA`  
**Next Implementation Phase:** `T8 — Firebase Deployment & MVP Release`

## Documentation Status

- [x] Master Product PRD
- [x] UI/UX PRD
- [x] Technical Architecture PRD / TDD
- [x] Data & Database PRD
- [x] API & Integration PRD
- [x] Security & Access Control PRD
- [x] Implementation Workplan & Phase Tracker created

D0 is complete. Cross-document review resolved the React Router baseline to the current stable 7.x line and confirmed the Spark-only/no-photo-storage architecture.

---

# 4. Master Phase Overview

- [x] **D0 — Documentation Baseline Completion**
- [x] **T0 — Repository Foundation**
- [x] **T1 — Domain Foundation**
- [x] **T2 — UI Shell & Design System Foundation**
- [x] **T3 — Template Generator Core**
- [x] **T4 — Local OCR & Coordinate Extraction**
- [x] **T5 — Firebase Integration & Operational Data Features**
- [x] **T6 — Cut Point Tracker**
- [ ] **T7 — Hardening, Security Validation & Full QA**
- [ ] **T8 — Firebase Deployment & MVP Release**

---

# 5. D0 — Documentation Baseline Completion

**Status:** COMPLETE  
**Dependency:** None  
**Goal:** Finish the product and technical contracts before application implementation begins.

## Required Work

- [x] Create Master Product PRD.
- [x] Create UI/UX PRD.
- [x] Create Technical Architecture PRD / TDD.
- [x] Create Data & Database PRD.
- [x] Create API & Integration PRD.
- [x] Create Security & Access Control PRD.
- [x] Create this Implementation Workplan.
- [x] Cross-review all PRDs/TDDs for conflicting requirements.
- [x] Confirm final MVP technology baseline remains Spark-compatible.
- [x] Confirm no MVP requirement depends on Cloud Storage.
- [x] Confirm persisted Cut Point photo policy: **photo not stored; only coordinate metadata persisted**.
- [x] Resolve any documentation contradictions discovered during review.

## Exit Criteria

D0 is complete when:

- all six product/technical documents exist;
- this tracker exists;
- no known high-impact contradiction exists between them;
- implementation can begin without making fundamental product decisions during scaffolding.

## Completion Record

**Completed:** 2026-08-21  
**Commit / PR:** `6543b9cd92d8f43a8521c107ab970868b4878e4f` + T0 foundation branch  
**Notes:** Security PRD completed. Cross-review confirmed Spark-compatible MVP, no Cloud Storage dependency, browser-local Cut Point photos, coordinate-only persistence, and corrected React Router baseline to stable 7.x.

---

# 6. T0 — Repository Foundation

**Status:** COMPLETE  
**Dependency:** D0 complete  
**Goal:** Create a clean, reproducible React/Vite development foundation before feature implementation.

## Scope

### Project Scaffold

- [x] Scaffold Vite React application using JavaScript/JSX.
- [x] Confirm application starts locally.
- [x] Confirm production build succeeds.
- [x] Commit `package-lock.json`.
- [x] Establish supported Node.js version.
- [x] Add `.nvmrc` or equivalent runtime documentation if useful.

### Core Dependencies

- [x] Install React Router.
- [x] Install Tailwind CSS using approved Vite integration.
- [x] Install React Hook Form.
- [x] Install Zod.
- [x] Install Firebase Web SDK.
- [x] Install Leaflet dependencies.
- [x] Install OCR dependency only where architecture requires it; keep OCR lazy-loadable.

### Code Quality

- [x] Configure ESLint.
- [x] Configure Prettier.
- [x] Add lint script.
- [x] Add format script.
- [x] Add format-check script.
- [x] Add build script.
- [x] Add test script foundation.

### Test Foundation

- [x] Configure Vitest.
- [x] Configure React Testing Library.
- [x] Configure jest-dom matchers.
- [x] Create one smoke/unit test proving test runner works.

### Repository Structure

- [x] Create `src/app/`.
- [x] Create `src/features/`.
- [x] Create `src/entities/`.
- [x] Create `src/infrastructure/`.
- [x] Create `src/shared/`.
- [x] Create `src/styles/`.
- [x] Preserve vertical feature architecture from TDD.

### Environment Foundation

- [x] Add `.env.example` without secrets.
- [x] Define expected Firebase environment variable names.
- [x] Define map tile environment variable names.
- [x] Ensure real `.env` files are ignored.

### CI Foundation

- [x] Add GitHub Actions quality workflow.
- [x] CI runs install, lint, format check, test, and build.
- [x] CI succeeds on the foundation commit/PR.

## Mandatory Quality Gate

- [x] `npm run lint` passes.
- [x] `npm run format:check` passes.
- [x] `npm test` passes.
- [x] `npm run build` passes.
- [x] GitHub Actions passes.

## Exit Criteria

Repository can be freshly cloned, installed, tested, linted, and built without feature code or manual repair.

## Completion Record

**Completed:** 2026-08-21  
**Commit / PR:** `9279420056540c71aa33edc2f0c2f92f6d979ea7`  
**Notes:** React/Vite foundation, pinned runtime/dependencies, Tailwind, ESLint, Prettier, Vitest/RTL, environment contract, vertical source directories, generated package lock, dev-server smoke check, and GitHub Actions quality gate completed.

---

# 7. T1 — Domain Foundation

**Status:** COMPLETE  
**Dependency:** T0 complete  
**Goal:** Implement product rules as tested pure JavaScript before UI depends on them.

## Ticket Domain

- [x] Define normalized Ticket object contract.
- [x] Implement empty Ticket factory.
- [x] Define canonical ticket statuses.
- [x] Implement Draft → Running validation.
- [x] Implement lifecycle transition validation.
- [x] Implement revision/concurrency domain contract.

## Report Formatter

- [x] Implement `formatTicketReport(ticket)`.
- [x] Preserve user wording.
- [x] Render canonical field order.
- [x] Hide Impact List when empty.
- [x] Render Impact List when populated.
- [x] Format Occur Time correctly.
- [x] Format Dispatch Time correctly.
- [x] Sort progress chronologically.
- [x] Ensure Preview and Clipboard can consume the same formatter output.

## TT Number Extraction

- [x] Implement recognizable external TT extraction.
- [x] Handle missing/unknown patterns safely.
- [x] Keep Title as source of truth.

## Progress Domain

- [x] Define Progress Entry contract.
- [x] Implement chronological sorting.
- [x] Support duplicate timestamps deterministically.
- [x] Support progress crossing midnight/date boundaries.

## Coordinate Domain

- [x] Implement Decimal Degrees parser.
- [x] Implement DMS parser.
- [x] Implement DDM parser.
- [x] Implement N/S/E/W conversion.
- [x] Implement latitude range validation.
- [x] Implement longitude range validation.
- [x] Implement canonical coordinate formatter.
- [x] Implement ambiguity result contract.

## Unit Test Gate

- [x] Report formatting tests pass.
- [x] Empty Impact List tests pass.
- [x] TT extraction tests pass.
- [x] Timeline ordering tests pass.
- [x] Midnight crossover tests pass.
- [x] DD coordinate tests pass.
- [x] DMS coordinate tests pass.
- [x] DDM coordinate tests pass.
- [x] Hemisphere conversion tests pass.
- [x] Invalid range tests pass.
- [x] Ambiguous coordinate tests pass.

## Mandatory Quality Gate

- [x] lint passes.
- [x] format check passes.
- [x] unit tests pass.
- [x] build passes.

## Exit Criteria

Critical product logic can be tested without React, Firebase, OCR, or map dependencies.

## Completion Record

**Completed:** 2026-08-21  
**Commit / PR:** `9279420056540c71aa33edc2f0c2f92f6d979ea7`  
**Notes:** Pure JavaScript Ticket domain completed with lifecycle/revision validation, canonical report generation, external TT extraction, deterministic progress ordering, DD/DMS/DDM coordinate parsing, range validation, ambiguity handling, and regression tests.

---

# 8. T2 — UI Shell & Design System Foundation

**Status:** COMPLETE  
**Dependency:** T1 complete  
**Goal:** Build the responsive NOC operations shell and reusable UI primitives before feature screens become large.

## Application Shell

- [x] Configure application routing.
- [x] Add authenticated-route placeholder boundary.
- [x] Implement desktop sidebar shell.
- [x] Implement mobile top bar.
- [x] Implement mobile bottom navigation.
- [x] Implement Not Found route.

## Routes

- [x] `/dashboard`
- [x] `/generator/new`
- [x] `/generator/:ticketId`
- [x] `/running`
- [x] `/cut-points`
- [x] `/login`

## Theme & Tokens

- [x] Implement semantic color tokens.
- [x] Implement typography tokens.
- [x] Implement spacing/radius/shadow tokens where useful.
- [x] Implement Light Mode.
- [x] Implement Dark Mode.
- [x] Persist local theme preference.
- [x] Avoid duplicate Light/Dark components.

## Shared UI

- [x] Button.
- [x] Icon Button.
- [x] Text Input.
- [x] Textarea.
- [x] Date/time input wrapper.
- [x] Status Badge.
- [x] Empty State.
- [x] Error State.
- [x] Skeleton/loading primitives.
- [x] Dialog/confirmation primitive.
- [x] Toast/notification feedback.

## Accessibility Baseline

- [x] Keyboard-visible focus states.
- [x] Proper labels for form controls.
- [x] Icon button accessible names.
- [x] Minimum practical touch target.
- [x] No status conveyed by color alone.

## Responsive Gate

- [x] No horizontal page overflow on target mobile viewport.
- [x] Sidebar/navigation responsive behavior verified.
- [x] Keyboard navigation verified for shell.

## Mandatory Quality Gate

- [x] component tests for critical shared primitives pass.
- [x] lint passes.
- [x] format check passes.
- [x] tests pass.
- [x] build passes.

## Exit Criteria

All four product pages can exist inside a stable responsive shell using shared visual primitives.

## Completion Record

**Completed:** 2026-08-21  
**Commit / PR:** `9279420056540c71aa33edc2f0c2f92f6d979ea7`  
**Notes:** Responsive operations shell, complete route map, protected-route boundary, persistent semantic light/dark theme, desktop sidebar, mobile top/bottom navigation, shared accessible UI primitives, feedback/dialog foundations, responsive overflow protection, and component tests completed.

---

# 9. T3 — Template Generator Core

**Status:** COMPLETE  
**Dependency:** T2 complete  
**Goal:** Deliver the primary reporting workflow before cloud persistence or OCR integration.

## Generator Workspace

- [x] Implement desktop split workspace.
- [x] Implement mobile single-column workflow.
- [x] Implement Live Report Preview.
- [x] Keep preview output identical to formatter output.
- [x] Implement Copy Report.
- [x] Implement copy success/failure feedback.

## Ticket Form

- [x] Title input.
- [x] detected TT number display.
- [x] Impact List add/edit/remove/reorder.
- [x] Occur Time.
- [x] Dispatch Time.
- [x] PIC.
- [x] Rootcause.
- [x] Cut Point.
- [x] Latitude input.
- [x] Longitude input.
- [x] coordinate validation feedback.

## Progress Timeline

- [x] Progress Composer.
- [x] Full datetime internally.
- [x] Add update interaction.
- [x] Edit progress locally before Firebase phase where appropriate.
- [x] Delete/correct progress UX.
- [x] Multi-day grouping/display.
- [x] Correct chronological ordering.

## Ticket Lifecycle UI

- [x] Draft state.
- [x] Mark Running action.
- [x] Running validation errors.
- [x] Resolve action UX foundation.
- [x] Archive action visibility according to role placeholder.

## Dirty State & Save UX Foundation

- [x] React Hook Form dirty tracking.
- [x] Unsaved Changes indicator.
- [x] navigation protection for dirty form.
- [x] Save interface prepared against repository contract.
- [x] No Firestore per-keystroke writes.

## Component/Integration Test Gate

- [x] Title/report preview flow.
- [x] Impact hide/show flow.
- [x] progress add/render flow.
- [x] running validation flow.
- [x] coordinate manual validation flow.
- [x] Copy Report flow.

## Mandatory Quality Gate

- [x] lint passes.
- [x] format check passes.
- [x] tests pass.
- [x] build passes.
- [x] manual desktop Generator QA passes.
- [x] manual mobile Generator QA passes.

## Exit Criteria

An operator can generate a complete report locally without Firebase and without OCR.

## Completion Record

**Completed:** 2026-08-21  
**Commit / PR:** `9279420056540c71aa33edc2f0c2f92f6d979ea7`  
**Notes:** Local Generator workflow completed with React Hook Form, optional Impact List editing/reorder, incident fields, manual coordinate validation, editable multi-day Progress Timeline, lifecycle validation, unsaved-navigation protection, local-session Save state, canonical live report preview, Clipboard copy feedback, and integration tests. No Firebase writes or OCR are introduced in this phase.

---

# 10. T4 — Local OCR & Coordinate Extraction

**Status:** COMPLETE  
**Dependency:** T3 complete  
**Goal:** Extract Cut Point coordinates from geotag watermark photos entirely in the browser.

## Photo Input

- [x] Drag and drop area.
- [x] File picker fallback.
- [x] Mobile image selection support.
- [x] supported image type validation.
- [x] practical file size handling.
- [x] local image preview.

## Local OCR

- [x] Tesseract worker integration.
- [x] OCR module lazy-loaded.
- [x] browser UI remains responsive during OCR.
- [x] implement preprocessing where it measurably improves coordinate extraction.
- [x] expose OCR processing state.
- [x] expose OCR failure state.

## Coordinate Candidate Pipeline

- [x] Feed OCR text into T1 coordinate parser.
- [x] Recognize explicit Lat/Lng labels.
- [x] Recognize hemisphere indicators.
- [x] Handle DD.
- [x] Handle DMS.
- [x] Handle DDM.
- [x] detect ambiguous candidates.
- [x] do not silently guess materially ambiguous coordinates.

## Verification UX

- [x] populate editable Latitude/Longitude fields.
- [x] show normalized output.
- [x] allow manual correction.
- [x] user confirmation becomes canonical final coordinate.

## Privacy / Storage Rule

- [x] confirm no photo upload occurs.
- [x] confirm no base64 photo is persisted.
- [x] confirm no image is persisted to Firestore.
- [x] confirm no Firebase Storage dependency exists.
- [x] only coordinate metadata proceeds to persistence boundary.

## OCR Test Gate

- [x] fixture image with DD coordinate passes.
- [x] fixture image with DMS coordinate passes.
- [x] fixture image with DDM coordinate passes.
- [x] ambiguous fixture requires user verification.
- [x] no-coordinate fixture fails gracefully.

## Mandatory Quality Gate

- [x] lint passes.
- [x] format check passes.
- [x] tests pass.
- [x] build passes.
- [x] OCR bundle does not load on initial Dashboard route.

## Exit Criteria

An operator can select a local Cut Point photo, extract/verify coordinates, and populate the Ticket coordinate fields without uploading the image.

## Completion Record

**Completed:** 2026-08-21  
**Commit / PR:** `9279420056540c71aa33edc2f0c2f92f6d979ea7`  
**Notes:** Browser-local Cut Point OCR completed with image type/size validation, local preview, lazy Tesseract.js worker execution, temporary in-memory preprocessing, DD/DMS/DDM candidate parsing, ambiguity review, explicit operator verification, editable coordinate fields, OCR-source metadata, and regression tests. No image upload, base64 persistence, Cloud Storage, or Firestore image write is introduced.

---

# 11. T5 — Firebase Integration & Operational Data Features

**Status:** COMPLETE  
**Dependency:** T4 complete; Security PRD must exist before security-related T5 work is accepted  
**Goal:** Connect the tested application to Firestore/Auth using repository contracts and deliver persistent operational workflows.

## Firebase Foundation

- [x] Initialize Firebase adapter once.
- [x] Add Firestore client adapter.
- [x] Add Authentication adapter foundation.
- [x] Configure Firebase Emulator Suite.
- [x] Ensure tests never write to production Firebase.

## Ticket Repository

- [x] `createTicket()`.
- [x] `getTicket()`.
- [x] `saveTicket()`.
- [x] lifecycle/status mutation contract.
- [x] archive/restore contract.
- [x] optimistic/revision concurrency handling.
- [x] normalized application errors.

## Progress Repository

- [x] append progress using transaction/batch rules.
- [x] update progress.
- [x] remove progress where allowed.
- [x] maintain `latestProgress`.
- [x] maintain `progressCount`.
- [x] handle backdated progress correctly.
- [x] update Ticket revision atomically.

## Coordinate Persistence

- [x] persist Latitude/Longitude metadata.
- [x] persist verification metadata.
- [x] maintain `hasCoordinates` atomically.
- [x] confirm photo remains browser-local only.

## Firestore Indexes

- [x] add indexes required by Running Ticket queries.
- [x] add indexes required by map/cut point queries.
- [x] add indexes required by historical pagination if needed.
- [x] commit `firestore.indexes.json`.

## Dashboard

- [x] Running Ticket summary.
- [x] recent ticket activity.
- [x] recent updates.
- [x] quick action to create Ticket.
- [x] Firestore reads bounded and intentional.

## Running Ticket

- [x] query only `RUNNING` records by default.
- [x] desktop data grid.
- [x] mobile Ticket Cards.
- [x] search by external TT number.
- [x] search Title within bounded operational dataset.
- [x] search PIC within bounded operational dataset.
- [x] search Cut Point within bounded operational dataset.
- [x] sorting.
- [x] relevant filtering.
- [x] quick Open action.
- [x] quick Add Progress action.
- [x] quick Copy Report action.
- [x] Resolve action.

## Historical Query Foundation

- [x] no unbounded `getAllTickets()` implementation.
- [x] pagination/cursor support.
- [x] archive excluded from normal operational view.

## Audit Trail

- [x] meaningful ticket audit events.
- [x] meaningful progress audit events.
- [x] coordinate update audit event.
- [x] lifecycle audit event.
- [x] no per-keystroke audit logging.

## Emulator Integration Tests

- [x] create/save ticket.
- [x] load ticket.
- [x] append progress.
- [x] concurrent revision rejection.
- [x] coordinate persistence.
- [x] mark Running.
- [x] Resolve.
- [x] archive/restore where implemented.

## Mandatory Quality Gate

- [x] lint passes.
- [x] format check passes.
- [x] unit/component tests pass.
- [x] Firebase emulator integration tests pass.
- [x] build passes.
- [x] Firestore read/write patterns reviewed for Spark Plan suitability.

## Exit Criteria

Core incident workflows persist correctly across browser reloads and multiple operator sessions without bypassing repository contracts.

## Completion Record

**Completed:** 2026-08-21  
**Commit / PR:** `b96b94a61af44a09f085781902c91181163bfc97` / PR #1 Quality #237  
**Notes:** Firebase Auth/Firestore adapters, bounded operational queries, optimistic revision guards, transactional progress and coordinate persistence, audit events, operational Dashboard/Running Ticket integration, archive/restore contracts, indexes, and a Firebase Auth + Firestore Emulator integration gate are validated. Running Ticket includes bounded search/filter/sort plus Open, Add Progress, canonical Copy Report, and optimistic-concurrency Resolve actions. Emulator tests use a demo project ID and never target production Firebase. Spark suitability review confirms no unbounded operational reads, no Cloud Storage, no Cloud Functions, and no per-keystroke persistence.

---

# 12. T6 — Cut Point Tracker

**Status:** COMPLETE  
**Dependency:** T5 complete  
**Goal:** Visualize confirmed Ticket Cut Point coordinates on an operational map using the canonical Ticket dataset.

## Map Foundation

- [x] Leaflet integration.
- [x] OpenStreetMap tile configuration.
- [x] tile URL environment-configurable.
- [x] attribution visible.
- [x] no Google Maps paid API dependency.

## Cut Point Query

- [x] query `hasCoordinates == true` or approved equivalent.
- [x] exclude invalid coordinates.
- [x] use same Ticket dataset; no duplicate `mapMarkers` collection.
- [x] query remains bounded according to operational scope.

## Marker UX

- [x] marker per valid Ticket.
- [x] TT number.
- [x] Title.
- [x] Ticket status.
- [x] Cut Point text.
- [x] Latitude/Longitude.
- [x] PIC.
- [x] latest update metadata where useful.
- [x] Open Ticket action.

## Desktop Layout

- [x] map workspace.
- [x] search/filter/list panel.
- [x] map receives primary screen area.

## Mobile Layout

- [x] map as primary canvas.
- [x] ticket/filter bottom sheet.
- [x] usable marker interaction on touch devices.
- [x] no page-level horizontal overflow.

## Error/Empty States

- [x] no coordinate records state.
- [x] tile/network failure state.
- [x] query failure state.

## Mandatory Quality Gate

- [x] component/integration tests pass.
- [x] map marker data mapping tests pass.
- [x] lint passes.
- [x] format check passes.
- [x] tests pass.
- [x] build passes.
- [x] manual mobile map QA passes.
- [x] manual desktop map QA passes.

## Exit Criteria

All eligible persisted Ticket coordinates can be visualized and opened from the Cut Point Tracker without duplicate location storage.

## Completion Record

**Completed:** 2026-08-21  
**Commit / PR:** `7a3da5b2ca638db915400907a92f97398311ce2e` / PR #1 Quality #505  
**Notes:** Cut Point Tracker implementation is complete. Automated Chrome QA validates 360×800, 390×844, 412×915, and 1280×900 viewports with no page-level horizontal overflow, desktop map dominance, OpenStreetMap attribution, and real touch interaction through marker popup and Open Ticket. Manual mobile and desktop visual map QA were explicitly accepted by the project owner on 2026-08-21 for the current release state.

---

# 13. T7 — Hardening, Security Validation & Full QA

**Status:** IN PROGRESS — automated hardening active; manual QA still required  
**Dependency:** T6 complete  
**Goal:** Validate the complete MVP against security, accessibility, responsive, concurrency, reliability, and regression requirements.

## Authentication & RBAC Completion

- [x] Firebase Authentication production flow.
- [x] Admin role behavior.
- [x] Operator role behavior.
- [x] Viewer role behavior.
- [x] protected routes.
- [x] permission-aware UI actions.

## Firestore Security Rules

- [x] rules match Security PRD.
- [x] unauthenticated access denied.
- [x] Viewer write attempts denied.
- [x] Operator allowed mutations verified.
- [x] Admin-only mutations verified.
- [x] rules validate important field invariants where practical.
- [x] rules tests run with Firebase Emulator.

## Security Hygiene

- [x] no service-account key in repository.
- [x] no secret in Vite client environment beyond public Firebase client config.
- [x] no hidden reliance on UI-only authorization.
- [x] error messages do not leak unnecessary internal details.
- [x] photo/OCR pipeline remains local.

## Full E2E

- [x] Login.
- [x] create Draft Ticket.
- [x] populate incident details.
- [x] mark Running.
- [x] append progress.
- [x] reload and confirm persistence.
- [x] OCR fixture coordinate flow.
- [x] manual coordinate correction.
- [x] Copy Report.
- [x] Running Ticket search/open.
- [x] Cut Point marker/open Ticket.
- [x] Resolve Ticket.
- [x] permission restrictions by role.

## Accessibility

- [x] automated axe checks on primary routes.
- [x] keyboard-only primary workflow QA.
- [x] focus management for dialogs/sheets.
- [x] accessible form errors.
- [ ] contrast review.
- [x] no status conveyed by color alone.

## Responsive QA

Minimum representative widths:

- [x] ~360px mobile.
- [x] ~390/412px mobile.
- [x] ~768px tablet.
- [x] ~1024px small desktop/tablet landscape.
- [x] >=1280px desktop.

Verify:

- [x] no unintended horizontal page overflow.
- [ ] Generator usable on mobile.
- [ ] Running Ticket cards usable on mobile.
- [ ] map usable on mobile.
- [ ] desktop information density remains appropriate.

## Reliability / Edge Cases

- [x] save failure retains form data.
- [x] network error has recovery path.
- [x] stale revision does not silently overwrite newer Ticket.
- [x] duplicate progress timestamps remain deterministic.
- [x] cross-midnight incidents render correctly.
- [x] invalid coordinates never become markers.
- [x] empty Impact List never renders.
- [x] OCR failure does not block manual coordinate input.

## Performance

- [x] Dashboard initial bundle does not eagerly include OCR worker.
- [x] Cut Point map can be route-lazy-loaded.
- [x] large historical ticket data is paginated.
- [x] excessive Firestore listeners removed.
- [x] Firestore reads/writes reviewed.

## Repository Hygiene

- [x] no obsolete backup files.
- [x] no dead test fixtures without purpose.
- [x] no debug logging left in production path.
- [x] no unused major dependency.
- [x] documentation matches final implementation.

## Mandatory Quality Gate

- [x] lint passes.
- [x] format check passes.
- [x] unit tests pass.
- [x] component tests pass.
- [x] integration tests pass.
- [x] security rules tests pass.
- [x] Playwright E2E passes.
- [x] production build passes.
- [ ] manual responsive QA passes.
- [x] accessibility QA passes.

## Exit Criteria

MVP is considered release-candidate quality with no known critical blocker.

## Completion Record

**Completed:** —  
**Commit / PR:** —  
**Notes:** Automated T7 hardening is green through the latest validated PR Quality run: Firebase Auth/RBAC, Firestore Security Rules role matrix, normalized public Firebase errors, save/network recovery that preserves operator input and allows retry, dependency/fixture repository hygiene, bounded Firestore access with only the lifecycle-managed authenticated profile listener, full Playwright MVP workflow, keyboard/dialog focus checks, accessible form-error associations, readable status labels, axe serious/critical checks, responsive overflow coverage at 360/390/412/768/1024/1280 px, and README documentation aligned with the implemented MVP. Manual/subjective items such as visual contrast review, route usability, desktop information density, and manual responsive acceptance remain intentionally open until a human visual pass is recorded.

---

# 14. T8 — Firebase Deployment & MVP Release

**Status:** NOT STARTED  
**Dependency:** T7 complete  
**Goal:** Deploy the validated application to the intended Firebase Spark-compatible production environment.

Deployment is intentionally last. Development must not be shaped around premature production deployment.

## Firebase Project Preparation

- [ ] production Firebase project confirmed.
- [ ] Spark Plan confirmed where required.
- [ ] current Firebase quotas/pricing rechecked before release.
- [ ] Firestore production database configured.
- [ ] Firebase Authentication providers configured.
- [ ] Firebase Hosting configured.
- [ ] no Cloud Storage dependency created.
- [ ] no Blaze-only production dependency accidentally introduced.

## Production Configuration

- [ ] production environment values configured safely.
- [ ] SPA Hosting rewrite configured.
- [ ] Firestore indexes deployed.
- [ ] Firestore Security Rules deployed.
- [ ] Hosting deployment succeeds.

## Production Smoke Test

- [ ] login works.
- [ ] Dashboard loads.
- [ ] create/save Ticket works.
- [ ] mark Running works.
- [ ] progress append works.
- [ ] OCR works in deployed browser context.
- [ ] coordinate save works.
- [ ] Running Ticket works.
- [ ] Cut Point map works.
- [ ] Copy Report works.
- [ ] Resolve works.
- [ ] unauthorized behavior remains blocked.

## Release Documentation

- [ ] README setup instructions updated.
- [ ] local development instructions updated.
- [ ] Firebase emulator instructions updated.
- [ ] deployment instructions documented.
- [ ] known limitations documented.
- [ ] final implementation status recorded in this tracker.

## Mandatory Quality Gate

- [ ] CI green for release commit.
- [ ] production build green.
- [ ] production smoke test green.
- [ ] no Critical/High known security issue.
- [ ] no known blocker for primary NOC reporting workflow.

## Exit Criteria

The MVP is deployed to Firebase Hosting and the primary end-to-end NOC report workflow works in production.

## Completion Record

**Completed:** —  
**Commit / PR:** —  
**Production URL:** —  
**Notes:** —

---

# 15. Phase Dependency Graph

```text
D0 Documentation Baseline
        ↓
T0 Repository Foundation
        ↓
T1 Domain Foundation
        ↓
T2 UI Shell & Design System
        ↓
T3 Template Generator Core
        ↓
T4 Local OCR & Coordinates
        ↓
T5 Firebase + Dashboard + Running Ticket
        ↓
T6 Cut Point Tracker
        ↓
T7 Security + Hardening + Full QA
        ↓
T8 Firebase Deployment + MVP Release
```

---

# 16. Definition of Project MVP Complete

The project MVP is complete only when all master phases show:

```text
[x]
```

and the following end-to-end operator workflow passes in production:

1. authenticate;
2. create a Ticket;
3. enter Title and operational incident fields;
4. add Impact List when applicable;
5. enter Occur/Dispatch Time;
6. enter PIC, Rootcause, and Cut Point when known;
7. add Progress Timeline entries;
8. mark Ticket Running;
9. find Ticket in Running Ticket;
10. reopen and append additional progress;
11. select a local Cut Point photo;
12. OCR the visible geotag locally;
13. normalize/verify Latitude and Longitude;
14. save only coordinate metadata to Firestore;
15. view Ticket marker in Cut Point Tracker;
16. generate the canonical report;
17. copy report text;
18. resolve the Ticket;
19. retain the historical Ticket record.

---

# 17. Permanent Implementation Decisions

Unless a source-of-truth document is intentionally revised, the following remain fixed:

- React + Vite SPA;
- JavaScript/JSX codebase;
- Tailwind CSS ecosystem with plain CSS where appropriate;
- no Next.js;
- Firestore persistence;
- Firebase Authentication;
- Firebase Hosting;
- Spark-compatible MVP target;
- no Cloud Storage for Cut Point photos;
- no persisted Cut Point image;
- only coordinate metadata is persisted;
- OCR runs locally in the browser;
- Tesseract.js baseline OCR engine;
- pure JavaScript coordinate parser;
- Leaflet map renderer;
- configurable OpenStreetMap-compatible tile source;
- no custom backend server for MVP;
- no per-keystroke Firestore persistence;
- one canonical Ticket dataset;
- progress stored as Ticket subcollection;
- Running Ticket is a query/view, not a duplicate collection;
- Cut Point Tracker uses the same Ticket records, not a duplicate marker database;
- report preview and clipboard output share one canonical formatter;
- automated quality gates are required before a phase is marked complete.

---

# 18. Tracker Update Template

When completing a phase, update the corresponding section using this pattern:

```text
- [x] T1 — Domain Foundation

Status: COMPLETE
Completed: YYYY-MM-DD
Commit / PR: <reference>
Notes: <short implementation summary>
```

Then update:

```text
Current Active Phase: T2 — UI Shell & Design System Foundation
```

This ensures future implementation sessions can resume directly from repository state without reconstructing project history from chat.
