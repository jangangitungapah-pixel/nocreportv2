# Template Generator Visual Overhaul — Implementation Tracker

**PRD:** `docs/08-post-mvp/TEMPLATE-GENERATOR-VISUAL-OVERHAUL-PRD.md`  
**Branch:** `feature/template-generator-visual-overhaul`  
**Stacked base:** `feature/template-generator-features`  
**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 COMPLETE · GUX-4 COMPLETE · GUX-5 COMPLETE · GUX-6 IN PROGRESS

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

- [x] Ticket Identity redesign.
- [x] timing redesign.
- [x] assignment/diagnosis redesign.
- [x] coordinate section redesign.
- [x] Impact editor/builder redesign.
- [x] Smart Title + detected TT scanability.
- [x] validation/focus semantics preserved.

### GUX-2 automated evidence

GUX-2 presentation changes passed targeted Generator core-authoring, Smart Title and Impact Builder regression coverage, committed Prettier formatting, ESLint, the full unit/component suite and the production build. The implementation adds authoring-specific semantic classes, visual state attributes and CSS hierarchy only. Existing field IDs, React Hook Form registrations, validation focus mapping, Smart Title handlers, coordinate verification semantics, Impact mutation behavior, lifecycle rules, persistence and Firestore contracts remain unchanged.

## GUX-3 — Operations timeline + evidence

- [x] Evidence Workspace redesign.
- [x] OCR/Coordinate extraction redesign.
- [x] Progress Composer redesign.
- [x] Progress Timeline redesign.
- [x] local-file/privacy semantics preserved.
- [x] revision-safe Progress semantics preserved.

### GUX-3 automated evidence

GUX-3 presentation changes passed targeted Evidence Workspace, local OCR/coordinate, Progress Composer/presets, evidence recovery and revision-safe Progress persistence regression coverage, committed Prettier formatting, ESLint, the full unit/component suite and the production build. The implementation adds operations-specific semantic classes and CSS hierarchy only. Local evidence binaries remain browser-only, OCR behavior and coordinate verification are unchanged, and Progress append/update/remove continue through the existing optimistic-revision persistence contracts.

## GUX-4 — Output + handover utilities

- [x] Report Preview redesign.
- [x] Copy Center redesign.
- [x] Handover Summary utility redesign.
- [x] Operator Presets redesign.
- [x] Revision History/Audit redesign.
- [x] clipboard/audit semantics preserved.

### GUX-4 automated evidence

GUX-4 presentation changes passed targeted Copy Center, handover summary, Operator Presets, Revision History/Audit and Generator integration regression coverage, committed Prettier formatting, ESLint, the full unit/component suite and the production build. The implementation adds output/handover semantic classes and CSS hierarchy only. Canonical report generation, Copy Center target construction, clipboard callbacks, browser-local preset semantics, bounded immutable audit history reads and revision data contracts remain unchanged.

## GUX-5 — Responsive/mobile workspace

- [x] intentional mobile information ordering.
- [x] sticky primary actions remain reachable.
- [x] 360x800 green.
- [x] 390x844 green.
- [x] 412x915 green.
- [x] no horizontal overflow.
- [x] touch targets safe.

### GUX-5 automated evidence

GUX-5 passed the dedicated authenticated Chromium matrix at 360x800, 390x844 and 412x915 after presentation-only mobile workspace changes. The browser gate verifies explicit editor-before-live-output ordering, a sticky mobile command surface with reachable Save/transition actions, 44px-class primary action and field targets, and no document/body horizontal overflow before and after deep scrolling and at the live report output. Targeted Generator regression, the full unit/component suite and the production build also remain green. Desktop ResizableWorkspace behavior, form semantics, lifecycle actions, persistence, canonical report content and accessibility labels are unchanged.

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
