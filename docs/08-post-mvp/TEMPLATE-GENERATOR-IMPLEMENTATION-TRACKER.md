# Template Generator Feature Expansion — Implementation Tracker

**Source workplan:** `docs/08-post-mvp/TEMPLATE-GENERATOR-FEATURE-WORKPLAN.md`  
**Evidence annex:** `docs/08-post-mvp/TEMPLATE-GENERATOR-EMAIL-IMPORT-ADDENDUM.md`  
**Branch:** `feature/template-generator-features`  
**PR:** #7  
**Status:** GEN-F0 COMPLETE · GEN-F1 COMPLETE · GEN-F2 COMPLETE · GEN-F3 COMPLETE · GEN-F4 COMPLETE · GEN-F5 COMPLETE · GEN-F6 IN PROGRESS

## GEN-F0 — Baseline, contracts and feature skeleton

See prior completion evidence retained in repository history.

## GEN-F1 — Unified Import + Outlook `.msg`

See prior completion evidence retained in repository history.

## GEN-F2 — Structured metadata + Template Profile + Smart Title

See prior completion evidence retained in repository history.

## GEN-F3 — Impact Builder + Progress acceleration

See prior completion evidence retained in repository history.

## GEN-F4 — Validation Center + Time Intelligence

See prior completion evidence retained in repository history.

## GEN-F5 — Duplicate Detection + Related Tickets

- [x] Deterministic advisory duplicate scoring and explicit matching reasons.
- [x] Bounded indexed candidate lookup without collection-wide scans.
- [x] Validation Center duplicate warnings remain advisory.
- [x] Explicit Review existing / Create anyway behavior.
- [x] Revision-safe incident-group create/link/unlink/list boundaries.
- [x] Firestore Security Rules enforce Ticket/group consistency.
- [x] Unit/component + Emulator + browser/E2E QA complete.

### GEN-F5 completion evidence

**GEN-F5 QA #8 — FULL GREEN** for final product/code head `3a465742a180d71bfe0502e237665ecc300e8c62` through read-only QA wrapper head `014b08800d36bf8a360487315110833f5fd635c8` (run ID `32993651051`). Product code under test was the exact `3a465742` tree.

Validated gates included 272 unit/component tests, Ticket repository Emulator 6/6, Firestore Rules 9/9, incident-group repository 1/1, incident-group Rules 5/5, security hygiene, release preflight, generic/Firebase builds, smoke, viewport/touch QA and Playwright/accessibility 6/6.

## GEN-F6 — Draft Recovery + Revision Diff

- [x] Add versioned browser-local recovery storage with a bounded TTL.
- [x] Keep recovery local-only; no hidden Firestore autosave.
- [x] Store only safe whitelisted Generator form values.
- [x] Preserve selected Template Profile and compact safe feature metadata required for recovery.
- [x] Preserve new-Ticket local Progress Timeline entries and unsubmitted Progress composer draft.
- [x] Never store `.msg` bytes, raw email body/HTML, recipients, headers, OCR image bytes or attachment blobs.
- [x] Detect compatible recovery snapshot and offer explicit Restore / Discard.
- [x] Key existing-Ticket recovery by `ticketId + baseRevision`.
- [x] Detect stale existing-Ticket recovery and require explicit review before applying it.
- [x] Clear local recovery after successful Ticket create/save and successful persisted Progress append.
- [x] Expire invalid/stale storage payloads safely without blocking the editor.
- [x] Add page-level recovery regression for Restore / Discard and local Progress recovery.
- [x] Add compact operational revision diff contract for future `TICKET_UPDATED` events.
- [x] Exclude status, Progress and coordinate changes from generic update diffs because they retain dedicated audit semantics.
- [x] Exclude raw alarm/Description and other raw source content from audit diffs.
- [x] Persist `revisionFrom`, `revisionTo` and bounded `details.changes` on `TICKET_UPDATED` audit events.
- [x] Keep old audit events without compact diff readable.
- [x] Add bounded latest-50 audit history query.
- [x] Gate audit history reads to `audit:read` capability / Admin-compatible access.
- [x] Add Revision History UI with field changes and legacy-event fallback.
- [x] Add unit/component coverage for recovery privacy, stale revision review, audit diff, capability gate and bounded audit reads.
- [x] Focused GEN-F6 formatting + regression matrix green.
- [ ] Full repository Quality green on clean GEN-F6 head.
- [ ] Final committed-format verifier green on clean GEN-F6 head.
- [ ] Return PR #7 to stacked base `feature/ui-density-system` after integration QA.

### GEN-F6 exit criterion

An interrupted Generator session can be recovered locally without any hidden cloud write or raw source-content persistence, while future core Ticket updates emit compact immutable revision diffs and Admin audit history remains bounded, backward-compatible and read-only.

## Remaining phases

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
- all duplicate/related-Ticket reads remain bounded.
- Draft Recovery remains browser-local only and never becomes hidden Firestore autosave.
- Audit history reads remain bounded and capability-gated.
