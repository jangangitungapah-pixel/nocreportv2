# Template Generator Visual Overhaul — Implementation Tracker

**PRD:** `docs/08-post-mvp/TEMPLATE-GENERATOR-VISUAL-OVERHAUL-PRD.md`  
**Branch:** `feature/template-generator-visual-overhaul`  
**Stacked base:** `feature/template-generator-features`  
**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 IN PROGRESS

## Baseline

- [x] GEN-F0 through GEN-F9 complete.
- [x] GEN-F9 human workflow acceptance recorded.
- [x] Canonical Quality #807 full green before visual-overhaul branch.
- [x] Existing `feature/ui-overhaul-v2` ancestry confirmed already contained in current branch history.
- [x] No merge/cherry-pick from legacy UI branch required.

## GUX-0 — Cockpit architecture foundation

- [x] Add Generator-specific semantic visual tokens/classes.
- [x] Establish cockpit page wrapper and atmospheric depth.
- [x] Redesign command bar hierarchy while preserving actions/test semantics.
- [x] Improve editor/preview `ResizableWorkspace` framing.
- [x] Upgrade `EditorSection` hierarchy and spacing.
- [x] Establish visual tiers for primary authoring, intelligence and utility surfaces.
- [x] Preserve existing IDs, labels, form behavior, lifecycle actions and keyboard commands.
- [x] Presentation regression review complete; no new focused test was required for the class-only foundation change.
- [x] Prettier green.
- [x] ESLint green.
- [x] Unit/component suite green.
- [x] Generator browser matrix intentionally deferred to GUX-5/GUX-7; no browser result is inferred for GUX-0.

**Exit:** the page reads as one coherent operations workstation without functional behavior changes.

### GUX-0 automated evidence

One-shot GUX-0 gate applied presentation-only cockpit foundation changes, then passed committed Prettier formatting, ESLint, the full unit/component suite, and the production build before persisting source. No Firestore, RBAC, lifecycle, parser, OCR, report-content, persistence, ID or accessible-label contract was intentionally changed.

The browser-responsive/touch matrix is intentionally not claimed by GUX-0 and remains scheduled for GUX-5/GUX-7.

## GUX-1 — Import + readiness intelligence

- [x] Unified Import visual redesign.
- [x] `.msg` source/drop/input state redesign.
- [x] source/confidence/conflict hierarchy.
- [x] Validation Center severity hierarchy.
- [x] duplicate/related risk visual integration.
- [x] explicit operator decision actions remain obvious.
- [x] behavioral regression coverage green.

### GUX-1 automated evidence

GUX-1 presentation changes passed targeted Unified Import, Validation Center and duplicate/related regression coverage, committed Prettier formatting, ESLint, the full unit/component suite and the production build. The patch adds only semantic presentation hooks, severity/risk data attributes and CSS hierarchy. Parser behavior, selective Apply, duplicate scoring, bounded Firestore reads, related-Ticket actions, lifecycle gating and persistence contracts remain unchanged.

## GUX-2 — Core incident authoring

- [ ] Ticket Identity redesign.
- [ ] timing redesign.
- [ ] assignment/diagnosis redesign.
- [ ] coordinate section redesign.
- [ ] Impact editor/builder redesign.
- [ ] Smart Title + detected TT scanability.
- [ ] validation/focus semantics preserved.

## GUX-3 — Operations timeline + evidence

- [ ] Evidence Workspace redesign.
- [ ] OCR/Coordinate extraction redesign.
- [ ] Progress Composer redesign.
- [ ] Progress Timeline redesign.
- [ ] local-file/privacy semantics preserved.
- [ ] revision-safe Progress semantics preserved.

## GUX-4 — Output + handover utilities

- [ ] Report Preview redesign.
- [ ] Copy Center redesign.
- [ ] Handover Summary utility redesign.
- [ ] Operator Presets redesign.
- [ ] Revision History/Audit redesign.
- [ ] clipboard/audit semantics preserved.

## GUX-5 — Responsive/mobile workspace

- [ ] intentional mobile information ordering.
- [ ] sticky primary actions remain reachable.
- [ ] 360x800 green.
- [ ] 390x844 green.
- [ ] 412x915 green.
- [ ] no horizontal overflow.
- [ ] touch targets safe.

## GUX-6 — Theme, motion and accessibility polish

- [ ] Light theme visual QA.
- [ ] Dark theme visual QA.
- [ ] contrast/state differentiation.
- [ ] keyboard/focus order.
- [ ] reduced-motion behavior.
- [ ] serious/critical axe clean.

## GUX-7 — Integrated release readiness

- [ ] Prettier + committed-format verifier.
- [ ] ESLint.
- [ ] all unit/component tests.
- [ ] Firebase Emulator repository tests.
- [ ] Firestore Security Rules matrix.
- [ ] dependency/security hygiene.
- [ ] release preflight.
- [ ] generic production build.
- [ ] Firebase-configured production build.
- [ ] responsive/touch browser matrix.
- [ ] Admin lifecycle E2E.
- [ ] Operator/Viewer RBAC E2E.
- [ ] Generator import/draft/revision/keyboard E2E.
- [ ] Light/Dark axe + overflow.
- [ ] human desktop/mobile visual acceptance.
- [ ] PR ready only after explicit acceptance.

## Protected contracts

- Ticket lifecycle semantics unchanged.
- `/tickets/:ticketId` remains read-only.
- `/generator/:ticketId/edit` remains explicit mutation entry.
- optimistic revision checks remain authoritative.
- Firebase Security Rules/RBAC remain authoritative.
- OCR remains local-only.
- Smart/Email Import never auto-write Firestore.
- `.msg` privacy boundary unchanged.
- canonical report content unchanged.
- duplicate/related reads remain bounded.
