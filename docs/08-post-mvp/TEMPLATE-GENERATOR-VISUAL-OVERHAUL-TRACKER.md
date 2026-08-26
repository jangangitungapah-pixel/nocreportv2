# Template Generator Visual Overhaul — Implementation Tracker

**PRD:** `docs/08-post-mvp/TEMPLATE-GENERATOR-VISUAL-OVERHAUL-PRD.md`  
**Branch:** `feature/template-generator-visual-overhaul`  
**Stacked base:** `feature/template-generator-features`  
**Status:** GUX-0 IN PROGRESS

## Baseline

- [x] GEN-F0 through GEN-F9 complete.
- [x] GEN-F9 human workflow acceptance recorded.
- [x] Canonical Quality #807 full green before visual-overhaul branch.
- [x] Existing `feature/ui-overhaul-v2` ancestry confirmed already contained in current branch history.
- [x] No merge/cherry-pick from legacy UI branch required.

## GUX-0 — Cockpit architecture foundation

- [ ] Add Generator-specific semantic visual tokens/classes.
- [ ] Establish cockpit page wrapper and atmospheric depth.
- [ ] Redesign command bar hierarchy while preserving actions/test semantics.
- [ ] Improve editor/preview `ResizableWorkspace` framing.
- [ ] Upgrade `EditorSection` hierarchy and spacing.
- [ ] Establish visual tiers for primary authoring, intelligence and utility surfaces.
- [ ] Preserve existing IDs, labels, form behavior, lifecycle actions and keyboard commands.
- [ ] Update/add focused presentation regression tests if needed.
- [ ] Prettier green.
- [ ] ESLint green.
- [ ] Unit/component suite green.
- [ ] Focused Generator browser smoke if practical.

**Exit:** the page reads as one coherent operations workstation without functional behavior changes.

## GUX-1 — Import + readiness intelligence

- [ ] Unified Import visual redesign.
- [ ] `.msg` source/drop/input state redesign.
- [ ] source/confidence/conflict hierarchy.
- [ ] Validation Center severity hierarchy.
- [ ] duplicate/related risk visual integration.
- [ ] explicit operator decision actions remain obvious.
- [ ] behavioral regression coverage green.

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
