# Ticket Detail / Template Generator Separation

**Status:** IMPLEMENTED — AUTOMATED QA COMPLETE — MANUAL ACCEPTANCE PENDING  
**Branch:** `feature/ticket-detail-separation`  
**Parent:** `feature/ui-native-polish`

## Goal

Separate incident review from incident editing so opening a persisted TT from operational lists never exposes editable form controls by default.

## Route contract

- `/tickets/:ticketId` — canonical read-only Ticket Detail / review surface.
- `/generator/:ticketId` — existing Template Generator editor route for roles with Ticket edit capability.
- `/generator/:ticketId/edit` — explicit Edit Ticket alias used by the Ticket Detail CTA.
- `/generator/new` — new Ticket creation flow; unchanged.

Viewer-role protection on generator routes remains enforced by the existing capability-aware `TicketRoutePage`.

## Navigation contract

- [x] Dashboard Recently Updated rows open `/tickets/:ticketId`.
- [x] Running Ticket mobile/desktop title links open `/tickets/:ticketId`.
- [x] Running Ticket `Review` action opens `/tickets/:ticketId`.
- [x] Running Ticket `Add Progress` remains an explicit editor deep-link to `/generator/:ticketId#progress-text`.
- [x] Ticket Detail exposes `Edit Ticket` only when `CAPABILITY.EDIT_TICKET` is available.
- [x] `Edit Ticket` opens `/generator/:ticketId/edit`.

## Review safety contract

The Ticket Detail page:

- reads persisted Ticket + Progress data;
- exposes no editable Ticket fields;
- exposes no Save / lifecycle mutation / Progress mutation controls;
- keeps Copy Report available;
- clearly identifies itself as `Read only` / `Safe review mode`;
- explains that persisted data cannot be changed from the review surface.

## Regression coverage

- [x] Running Ticket links are tested to keep review navigation separate from Add Progress editing.
- [x] Dashboard recent Ticket navigation is tested to use the read-only detail route.
- [x] Ticket Detail is tested to omit editor controls.
- [x] Ticket Detail Edit CTA is capability-gated and points to the explicit edit route.
- [x] Full repository Quality workflow green on final product/code head.

## Automated QA evidence

**Quality #648 — FULL GREEN** on product/code head `c3ac3cb76c90c2772f0e6fa1ae3c178c41bc9c3b`.

Passed:

- formatting and committed-format verification;
- lint;
- 117 unit/component tests;
- Firebase Emulator repository integration;
- Firestore Security Rules role matrix;
- release preflight;
- generic production build and Firebase-configured production build;
- dev-server smoke;
- real-browser responsive/touch QA;
- Playwright Admin lifecycle;
- Operator/Viewer RBAC;
- keyboard/focus behavior;
- serious/critical axe accessibility checks.

Quality #646 exposed a stale browser-test expectation from the previous Viewer wording. Quality #647 passed every functional/browser gate and identified only a missing final newline in the E2E spec. The exact formatter output was persisted before Quality #648.

## Guardrails

No intentional changes to Firestore schema/rules, persistence semantics, revision guards, Ticket lifecycle, OCR, Smart Parsing, report formatting, or role capability definitions.
