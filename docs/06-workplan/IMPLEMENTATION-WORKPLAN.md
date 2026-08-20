# NOC Report Template Generator — Implementation Workplan & Phase Tracker

**Document ID:** NOCREPORT-WORKPLAN-001  
**Version:** 0.1  
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
- `docs/05-security/SECURITY-ACCESS-CONTROL-PRD.md` once created

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

**Overall status:** DOCUMENTATION BASELINE IN PROGRESS  
**Current Active Phase:** `D0 — Documentation Baseline Completion`  
**Next Implementation Phase:** `T0 — Repository Foundation`

## Documentation Status

- [x] Master Product PRD
- [x] UI/UX PRD
- [x] Technical Architecture PRD / TDD
- [x] Data & Database PRD
- [x] API & Integration PRD
- [ ] Security & Access Control PRD
- [x] Implementation Workplan & Phase Tracker created

D0 remains incomplete until the Security & Access Control PRD is finished and cross-document conflicts have been reviewed.

---

# 4. Master Phase Overview

- [ ] **D0 — Documentation Baseline Completion**
- [ ] **T0 — Repository Foundation**
- [ ] **T1 — Domain Foundation**
- [ ] **T2 — UI Shell & Design System Foundation**
- [ ] **T3 — Template Generator Core**
- [ ] **T4 — Local OCR & Coordinate Extraction**
- [ ] **T5 — Firebase Integration & Operational Data Features**
- [ ] **T6 — Cut Point Tracker**
- [ ] **T7 — Hardening, Security Validation & Full QA**
- [ ] **T8 — Firebase Deployment & MVP Release**

---

# 5. D0 — Documentation Baseline Completion

**Status:** IN PROGRESS  
**Dependency:** None  
**Goal:** Finish the product and technical contracts before application implementation begins.

## Required Work

- [x] Create Master Product PRD.
- [x] Create UI/UX PRD.
- [x] Create Technical Architecture PRD / TDD.
- [x] Create Data & Database PRD.
- [x] Create API & Integration PRD.
- [ ] Create Security & Access Control PRD.
- [x] Create this Implementation Workplan.
- [ ] Cross-review all PRDs/TDDs for conflicting requirements.
- [ ] Confirm final MVP technology baseline remains Spark-compatible.
- [ ] Confirm no MVP requirement depends on Cloud Storage.
- [ ] Confirm persisted Cut Point photo policy: **photo not stored; only coordinate metadata persisted**.
- [ ] Resolve any documentation contradictions discovered during review.

## Exit Criteria

D0 is complete when:

- all six product/technical documents exist;
- this tracker exists;
- no known high-impact contradiction exists between them;
- implementation can begin without making fundamental product decisions during scaffolding.

## Completion Record

**Completed:** —  
**Commit / PR:** —  
**Notes:** Security & Access Control PRD remains pending.

---

# 6. T0 — Repository Foundation

**Status:** NOT STARTED  
**Dependency:** D0 complete  
**Goal:** Create a clean, reproducible React/Vite development foundation before feature implementation.

## Scope

### Project Scaffold

- [ ] Scaffold Vite React application using JavaScript/JSX.
- [ ] Confirm application starts locally.
- [ ] Confirm production build succeeds.
- [ ] Commit `package-lock.json`.
- [ ] Establish supported Node.js version.
- [ ] Add `.nvmrc` or equivalent runtime documentation if useful.

### Core Dependencies

- [ ] Install React Router.
- [ ] Install Tailwind CSS using approved Vite integration.
- [ ] Install React Hook Form.
- [ ] Install Zod.
- [ ] Install Firebase Web SDK.
- [ ] Install Leaflet dependencies.
- [ ] Install OCR dependency only where architecture requires it; keep OCR lazy-loadable.

### Code Quality

- [ ] Configure ESLint.
- [ ] Configure Prettier.
- [ ] Add lint script.
- [ ] Add format script.
- [ ] Add format-check script.
- [ ] Add build script.
- [ ] Add test script foundation.

### Test Foundation

- [ ] Configure Vitest.
- [ ] Configure React Testing Library.
- [ ] Configure jest-dom matchers.
- [ ] Create one smoke/unit test proving test runner works.

### Repository Structure

- [ ] Create `src/app/`.
- [ ] Create `src/features/`.
- [ ] Create `src/entities/`.
- [ ] Create `src/infrastructure/`.
- [ ] Create `src/shared/`.
- [ ] Create `src/styles/`.
- [ ] Preserve vertical feature architecture from TDD.

### Environment Foundation

- [ ] Add `.env.example` without secrets.
- [ ] Define expected Firebase environment variable names.
- [ ] Define map tile environment variable names.
- [ ] Ensure real `.env` files are ignored.

### CI Foundation

- [ ] Add GitHub Actions quality workflow.
- [ ] CI runs install, lint, format check, test, and build.
- [ ] CI succeeds on the foundation commit/PR.

## Mandatory Quality Gate

- [ ] `npm run lint` passes.
- [ ] `npm run format:check` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] GitHub Actions passes.

## Exit Criteria

Repository can be freshly cloned, installed, tested, linted, and built without feature code or manual repair.

## Completion Record

**Completed:** —  
**Commit / PR:** —  
**Notes:** —

---

# 7. T1 — Domain Foundation

**Status:** NOT STARTED  
**Dependency:** T0 complete  
**Goal:** Implement product rules as tested pure JavaScript before UI depends on them.

## Ticket Domain

- [ ] Define normalized Ticket object contract.
- [ ] Implement empty Ticket factory.
- [ ] Define canonical ticket statuses.
- [ ] Implement Draft → Running validation.
- [ ] Implement lifecycle transition validation.
- [ ] Implement revision/concurrency domain contract.

## Report Formatter

- [ ] Implement `formatTicketReport(ticket)`.
- [ ] Preserve user wording.
- [ ] Render canonical field order.
- [ ] Hide Impact List when empty.
- [ ] Render Impact List when populated.
- [ ] Format Occur Time correctly.
- [ ] Format Dispatch Time correctly.
- [ ] Sort progress chronologically.
- [ ] Ensure Preview and Clipboard can consume the same formatter output.

## TT Number Extraction

- [ ] Implement recognizable external TT extraction.
- [ ] Handle missing/unknown patterns safely.
- [ ] Keep Title as source of truth.

## Progress Domain

- [ ] Define Progress Entry contract.
- [ ] Implement chronological sorting.
- [ ] Support duplicate timestamps deterministically.
- [ ] Support progress crossing midnight/date boundaries.

## Coordinate Domain

- [ ] Implement Decimal Degrees parser.
- [ ] Implement DMS parser.
- [ ] Implement DDM parser.
- [ ] Implement N/S/E/W conversion.
- [ ] Implement latitude range validation.
- [ ] Implement longitude range validation.
- [ ] Implement canonical coordinate formatter.
- [ ] Implement ambiguity result contract.

## Unit Test Gate

- [ ] Report formatting tests pass.
- [ ] Empty Impact List tests pass.
- [ ] TT extraction tests pass.
- [ ] Timeline ordering tests pass.
- [ ] Midnight crossover tests pass.
- [ ] DD coordinate tests pass.
- [ ] DMS coordinate tests pass.
- [ ] DDM coordinate tests pass.
- [ ] Hemisphere conversion tests pass.
- [ ] Invalid range tests pass.
- [ ] Ambiguous coordinate tests pass.

## Mandatory Quality Gate

- [ ] lint passes.
- [ ] format check passes.
- [ ] unit tests pass.
- [ ] build passes.

## Exit Criteria

Critical product logic can be tested without React, Firebase, OCR, or map dependencies.

## Completion Record

**Completed:** —  
**Commit / PR:** —  
**Notes:** —

---

# 8. T2 — UI Shell & Design System Foundation

**Status:** NOT STARTED  
**Dependency:** T1 complete  
**Goal:** Build the responsive NOC operations shell and reusable UI primitives before feature screens become large.

## Application Shell

- [ ] Configure application routing.
- [ ] Add authenticated-route placeholder boundary.
- [ ] Implement desktop sidebar shell.
- [ ] Implement mobile top bar.
- [ ] Implement mobile bottom navigation.
- [ ] Implement Not Found route.

## Routes

- [ ] `/dashboard`
- [ ] `/generator/new`
- [ ] `/generator/:ticketId`
- [ ] `/running`
- [ ] `/cut-points`
- [ ] `/login`

## Theme & Tokens

- [ ] Implement semantic color tokens.
- [ ] Implement typography tokens.
- [ ] Implement spacing/radius/shadow tokens where useful.
- [ ] Implement Light Mode.
- [ ] Implement Dark Mode.
- [ ] Persist local theme preference.
- [ ] Avoid duplicate Light/Dark components.

## Shared UI

- [ ] Button.
- [ ] Icon Button.
- [ ] Text Input.
- [ ] Textarea.
- [ ] Date/time input wrapper.
- [ ] Status Badge.
- [ ] Empty State.
- [ ] Error State.
- [ ] Skeleton/loading primitives.
- [ ] Dialog/confirmation primitive.
- [ ] Toast/notification feedback.

## Accessibility Baseline

- [ ] Keyboard-visible focus states.
- [ ] Proper labels for form controls.
- [ ] Icon button accessible names.
- [ ] Minimum practical touch target.
- [ ] No status conveyed by color alone.

## Responsive Gate

- [ ] No horizontal page overflow on target mobile viewport.
- [ ] Sidebar/navigation responsive behavior verified.
- [ ] Keyboard navigation verified for shell.

## Mandatory Quality Gate

- [ ] component tests for critical shared primitives pass.
- [ ] lint passes.
- [ ] format check passes.
- [ ] tests pass.
- [ ] build passes.

## Exit Criteria

All four product pages can exist inside a stable responsive shell using shared visual primitives.

## Completion Record

**Completed:** —  
**Commit / PR:** —  
**Notes:** —

---

# 9. T3 — Template Generator Core

**Status:** NOT STARTED  
**Dependency:** T2 complete  
**Goal:** Deliver the primary reporting workflow before cloud persistence or OCR integration.

## Generator Workspace

- [ ] Implement desktop split workspace.
- [ ] Implement mobile single-column workflow.
- [ ] Implement Live Report Preview.
- [ ] Keep preview output identical to formatter output.
- [ ] Implement Copy Report.
- [ ] Implement copy success/failure feedback.

## Ticket Form

- [ ] Title input.
- [ ] detected TT number display.
- [ ] Impact List add/edit/remove/reorder.
- [ ] Occur Time.
- [ ] Dispatch Time.
- [ ] PIC.
- [ ] Rootcause.
- [ ] Cut Point.
- [ ] Latitude input.
- [ ] Longitude input.
- [ ] coordinate validation feedback.

## Progress Timeline

- [ ] Progress Composer.
- [ ] Full datetime internally.
- [ ] Add update interaction.
- [ ] Edit progress locally before Firebase phase where appropriate.
- [ ] Delete/correct progress UX.
- [ ] Multi-day grouping/display.
- [ ] Correct chronological ordering.

## Ticket Lifecycle UI

- [ ] Draft state.
- [ ] Mark Running action.
- [ ] Running validation errors.
- [ ] Resolve action UX foundation.
- [ ] Archive action visibility according to role placeholder.

## Dirty State & Save UX Foundation

- [ ] React Hook Form dirty tracking.
- [ ] Unsaved Changes indicator.
- [ ] navigation protection for dirty form.
- [ ] Save interface prepared against repository contract.
- [ ] No Firestore per-keystroke writes.

## Component/Integration Test Gate

- [ ] Title/report preview flow.
- [ ] Impact hide/show flow.
- [ ] progress add/render flow.
- [ ] running validation flow.
- [ ] coordinate manual validation flow.
- [ ] Copy Report flow.

## Mandatory Quality Gate

- [ ] lint passes.
- [ ] format check passes.
- [ ] tests pass.
- [ ] build passes.
- [ ] manual desktop Generator QA passes.
- [ ] manual mobile Generator QA passes.

## Exit Criteria

An operator can generate a complete report locally without Firebase and without OCR.

## Completion Record

**Completed:** —  
**Commit / PR:** —  
**Notes:** —

---

# 10. T4 — Local OCR & Coordinate Extraction

**Status:** NOT STARTED  
**Dependency:** T3 complete  
**Goal:** Extract Cut Point coordinates from geotag watermark photos entirely in the browser.

## Photo Input

- [ ] Drag and drop area.
- [ ] File picker fallback.
- [ ] Mobile image selection support.
- [ ] supported image type validation.
- [ ] practical file size handling.
- [ ] local image preview.

## Local OCR

- [ ] Tesseract worker integration.
- [ ] OCR module lazy-loaded.
- [ ] browser UI remains responsive during OCR.
- [ ] implement preprocessing where it measurably improves coordinate extraction.
- [ ] expose OCR processing state.
- [ ] expose OCR failure state.

## Coordinate Candidate Pipeline

- [ ] Feed OCR text into T1 coordinate parser.
- [ ] Recognize explicit Lat/Lng labels.
- [ ] Recognize hemisphere indicators.
- [ ] Handle DD.
- [ ] Handle DMS.
- [ ] Handle DDM.
- [ ] detect ambiguous candidates.
- [ ] do not silently guess materially ambiguous coordinates.

## Verification UX

- [ ] populate editable Latitude/Longitude fields.
- [ ] show normalized output.
- [ ] allow manual correction.
- [ ] user confirmation becomes canonical final coordinate.

## Privacy / Storage Rule

- [ ] confirm no photo upload occurs.
- [ ] confirm no base64 photo is persisted.
- [ ] confirm no image is persisted to Firestore.
- [ ] confirm no Firebase Storage dependency exists.
- [ ] only coordinate metadata proceeds to persistence boundary.

## OCR Test Gate

- [ ] fixture image with DD coordinate passes.
- [ ] fixture image with DMS coordinate passes.
- [ ] fixture image with DDM coordinate passes.
- [ ] ambiguous fixture requires user verification.
- [ ] no-coordinate fixture fails gracefully.

## Mandatory Quality Gate

- [ ] lint passes.
- [ ] format check passes.
- [ ] tests pass.
- [ ] build passes.
- [ ] OCR bundle does not load on initial Dashboard route.

## Exit Criteria

An operator can select a local Cut Point photo, extract/verify coordinates, and populate the Ticket coordinate fields without uploading the image.

## Completion Record

**Completed:** —  
**Commit / PR:** —  
**Notes:** —

---

# 11. T5 — Firebase Integration & Operational Data Features

**Status:** NOT STARTED  
**Dependency:** T4 complete; Security PRD must exist before security-related T5 work is accepted  
**Goal:** Connect the tested application to Firestore/Auth using repository contracts and deliver persistent operational workflows.

## Firebase Foundation

- [ ] Initialize Firebase adapter once.
- [ ] Add Firestore client adapter.
- [ ] Add Authentication adapter foundation.
- [ ] Configure Firebase Emulator Suite.
- [ ] Ensure tests never write to production Firebase.

## Ticket Repository

- [ ] `createTicket()`.
- [ ] `getTicket()`.
- [ ] `saveTicket()`.
- [ ] lifecycle/status mutation contract.
- [ ] archive/restore contract.
- [ ] optimistic/revision concurrency handling.
- [ ] normalized application errors.

## Progress Repository

- [ ] append progress using transaction/batch rules.
- [ ] update progress.
- [ ] remove progress where allowed.
- [ ] maintain `latestProgress`.
- [ ] maintain `progressCount`.
- [ ] handle backdated progress correctly.
- [ ] update Ticket revision atomically.

## Coordinate Persistence

- [ ] persist Latitude/Longitude metadata.
- [ ] persist verification metadata.
- [ ] maintain `hasCoordinates` atomically.
- [ ] confirm photo remains browser-local only.

## Firestore Indexes

- [ ] add indexes required by Running Ticket queries.
- [ ] add indexes required by map/cut point queries.
- [ ] add indexes required by historical pagination if needed.
- [ ] commit `firestore.indexes.json`.

## Dashboard

- [ ] Running Ticket summary.
- [ ] recent ticket activity.
- [ ] recent updates.
- [ ] quick action to create Ticket.
- [ ] Firestore reads bounded and intentional.

## Running Ticket

- [ ] query only `RUNNING` records by default.
- [ ] desktop data grid.
- [ ] mobile Ticket Cards.
- [ ] search by external TT number.
- [ ] search Title within bounded operational dataset.
- [ ] search PIC within bounded operational dataset.
- [ ] search Cut Point within bounded operational dataset.
- [ ] sorting.
- [ ] relevant filtering.
- [ ] quick Open action.
- [ ] quick Add Progress action.
- [ ] quick Copy Report action.
- [ ] Resolve action.

## Historical Query Foundation

- [ ] no unbounded `getAllTickets()` implementation.
- [ ] pagination/cursor support.
- [ ] archive excluded from normal operational view.

## Audit Trail

- [ ] meaningful ticket audit events.
- [ ] meaningful progress audit events.
- [ ] coordinate update audit event.
- [ ] lifecycle audit event.
- [ ] no per-keystroke audit logging.

## Emulator Integration Tests

- [ ] create/save ticket.
- [ ] load ticket.
- [ ] append progress.
- [ ] concurrent revision rejection.
- [ ] coordinate persistence.
- [ ] mark Running.
- [ ] Resolve.
- [ ] archive/restore where implemented.

## Mandatory Quality Gate

- [ ] lint passes.
- [ ] format check passes.
- [ ] unit/component tests pass.
- [ ] Firebase emulator integration tests pass.
- [ ] build passes.
- [ ] Firestore read/write patterns reviewed for Spark Plan suitability.

## Exit Criteria

Core incident workflows persist correctly across browser reloads and multiple operator sessions without bypassing repository contracts.

## Completion Record

**Completed:** —  
**Commit / PR:** —  
**Notes:** —

---

# 12. T6 — Cut Point Tracker

**Status:** NOT STARTED  
**Dependency:** T5 complete  
**Goal:** Visualize confirmed Ticket Cut Point coordinates on an operational map using the canonical Ticket dataset.

## Map Foundation

- [ ] Leaflet integration.
- [ ] OpenStreetMap tile configuration.
- [ ] tile URL environment-configurable.
- [ ] attribution visible.
- [ ] no Google Maps paid API dependency.

## Cut Point Query

- [ ] query `hasCoordinates == true` or approved equivalent.
- [ ] exclude invalid coordinates.
- [ ] use same Ticket dataset; no duplicate `mapMarkers` collection.
- [ ] query remains bounded according to operational scope.

## Marker UX

- [ ] marker per valid Ticket.
- [ ] TT number.
- [ ] Title.
- [ ] Ticket status.
- [ ] Cut Point text.
- [ ] Latitude/Longitude.
- [ ] PIC.
- [ ] latest update metadata where useful.
- [ ] Open Ticket action.

## Desktop Layout

- [ ] map workspace.
- [ ] search/filter/list panel.
- [ ] map receives primary screen area.

## Mobile Layout

- [ ] map as primary canvas.
- [ ] ticket/filter bottom sheet.
- [ ] usable marker interaction on touch devices.
- [ ] no page-level horizontal overflow.

## Error/Empty States

- [ ] no coordinate records state.
- [ ] tile/network failure state.
- [ ] query failure state.

## Mandatory Quality Gate

- [ ] component/integration tests pass.
- [ ] map marker data mapping tests pass.
- [ ] lint passes.
- [ ] format check passes.
- [ ] tests pass.
- [ ] build passes.
- [ ] manual mobile map QA passes.
- [ ] manual desktop map QA passes.

## Exit Criteria

All eligible persisted Ticket coordinates can be visualized and opened from the Cut Point Tracker without duplicate location storage.

## Completion Record

**Completed:** —  
**Commit / PR:** —  
**Notes:** —

---

# 13. T7 — Hardening, Security Validation & Full QA

**Status:** NOT STARTED  
**Dependency:** T6 complete  
**Goal:** Validate the complete MVP against security, accessibility, responsive, concurrency, reliability, and regression requirements.

## Authentication & RBAC Completion

- [ ] Firebase Authentication production flow.
- [ ] Admin role behavior.
- [ ] Operator role behavior.
- [ ] Viewer role behavior.
- [ ] protected routes.
- [ ] permission-aware UI actions.

## Firestore Security Rules

- [ ] rules match Security PRD.
- [ ] unauthenticated access denied.
- [ ] Viewer write attempts denied.
- [ ] Operator allowed mutations verified.
- [ ] Admin-only mutations verified.
- [ ] rules validate important field invariants where practical.
- [ ] rules tests run with Firebase Emulator.

## Security Hygiene

- [ ] no service-account key in repository.
- [ ] no secret in Vite client environment beyond public Firebase client config.
- [ ] no hidden reliance on UI-only authorization.
- [ ] error messages do not leak unnecessary internal details.
- [ ] photo/OCR pipeline remains local.

## Full E2E

- [ ] Login.
- [ ] create Draft Ticket.
- [ ] populate incident details.
- [ ] mark Running.
- [ ] append progress.
- [ ] reload and confirm persistence.
- [ ] OCR fixture coordinate flow.
- [ ] manual coordinate correction.
- [ ] Copy Report.
- [ ] Running Ticket search/open.
- [ ] Cut Point marker/open Ticket.
- [ ] Resolve Ticket.
- [ ] permission restrictions by role.

## Accessibility

- [ ] automated axe checks on primary routes.
- [ ] keyboard-only primary workflow QA.
- [ ] focus management for dialogs/sheets.
- [ ] accessible form errors.
- [ ] contrast review.
- [ ] no status conveyed by color alone.

## Responsive QA

Minimum representative widths:

- [ ] ~360px mobile.
- [ ] ~390/412px mobile.
- [ ] ~768px tablet.
- [ ] ~1024px small desktop/tablet landscape.
- [ ] >=1280px desktop.

Verify:

- [ ] no unintended horizontal page overflow.
- [ ] Generator usable on mobile.
- [ ] Running Ticket cards usable on mobile.
- [ ] map usable on mobile.
- [ ] desktop information density remains appropriate.

## Reliability / Edge Cases

- [ ] save failure retains form data.
- [ ] network error has recovery path.
- [ ] stale revision does not silently overwrite newer Ticket.
- [ ] duplicate progress timestamps remain deterministic.
- [ ] cross-midnight incidents render correctly.
- [ ] invalid coordinates never become markers.
- [ ] empty Impact List never renders.
- [ ] OCR failure does not block manual coordinate input.

## Performance

- [ ] Dashboard initial bundle does not eagerly include OCR worker.
- [ ] Cut Point map can be route-lazy-loaded.
- [ ] large historical ticket data is paginated.
- [ ] excessive Firestore listeners removed.
- [ ] Firestore reads/writes reviewed.

## Repository Hygiene

- [ ] no obsolete backup files.
- [ ] no dead test fixtures without purpose.
- [ ] no debug logging left in production path.
- [ ] no unused major dependency.
- [ ] documentation matches final implementation.

## Mandatory Quality Gate

- [ ] lint passes.
- [ ] format check passes.
- [ ] unit tests pass.
- [ ] component tests pass.
- [ ] integration tests pass.
- [ ] security rules tests pass.
- [ ] Playwright E2E passes.
- [ ] production build passes.
- [ ] manual responsive QA passes.
- [ ] accessibility QA passes.

## Exit Criteria

MVP is considered release-candidate quality with no known critical blocker.

## Completion Record

**Completed:** —  
**Commit / PR:** —  
**Notes:** —

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
