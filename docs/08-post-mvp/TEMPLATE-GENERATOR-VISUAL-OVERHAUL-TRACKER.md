# Template Generator Visual Overhaul — Implementation Tracker

**PRD:** `docs/08-post-mvp/TEMPLATE-GENERATOR-VISUAL-OVERHAUL-PRD.md`  
**Branch:** `feature/template-generator-visual-overhaul`  
**Stacked base:** `feature/template-generator-features`  
**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 COMPLETE · GUX-4 COMPLETE · GUX-5 COMPLETE · GUX-6 COMPLETE · GUX-7 IN PROGRESS — AUTOMATED GATES COMPLETE · HUMAN ACCEPTANCE REQUIRED · GUX-8 IN PROGRESS

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

- [x] Light theme visual QA.
- [x] Dark theme visual QA.
- [x] contrast/state differentiation.
- [x] keyboard/focus order.
- [x] reduced-motion behavior.
- [x] serious/critical axe clean.

### GUX-6 automated evidence

GUX-6 passed dedicated authenticated Chromium coverage in Light and Dark themes. The gate verifies distinct semantic state borders and complete success tokens, keyboard order without positive tabindex, visible Generator focus treatment, keyboard activation of validation findings, reduced-motion CSS and auto-scrolling focus paths, and zero serious/critical axe violations in both themes. Targeted Generator regression, the full unit/component suite and the production build also remain green. Firestore, RBAC, lifecycle, revision, import/OCR, validation and canonical report semantics are unchanged.

## GUX-7 — Integrated release readiness

- [x] Prettier + committed-format verifier.
- [x] ESLint.
- [x] all unit/component tests.
- [x] Firebase Emulator repository tests.
- [x] Firestore Security Rules matrix.
- [x] dependency/security hygiene.
- [x] release preflight.
- [x] generic production build.
- [x] Firebase-configured production build.
- [x] responsive/touch browser matrix.
- [x] Admin lifecycle E2E.
- [x] Operator/Viewer RBAC E2E.
- [x] Generator import/draft/revision/keyboard E2E.
- [x] Light/Dark axe + overflow.
- [ ] human desktop/mobile visual acceptance.
- [ ] PR ready only after explicit acceptance.

### GUX-7 automated evidence

The integrated release-readiness gate passed repository formatting plus a committed-diff verifier, ESLint, the full unit/component suite, Firebase Emulator repository and Firestore Security Rules matrices, dependency/security hygiene, release preflight, generic and Firebase-configured production builds, dev-server smoke, the canonical T6 viewport/touch browser gate, and the complete authenticated Playwright suite. Runtime Outlook `.msg` coverage used the pinned upstream fixture commit and included import replacement decisions, draft recovery, revision history and Generator keyboard Save. Admin lifecycle, Operator/Viewer RBAC, responsive overflow, Light/Dark, serious/critical axe, focus, touch and reduced-motion coverage all remained green. Human desktop/mobile visual acceptance and explicit permission to mark PR #8 ready remain intentionally open.

## GUX-8 — Spatial flow refinement

- [x] Add a scan-first 01–04 workflow map without converting the Generator into a blocking wizard.
- [x] Group existing modules into one continuous incident canvas with Intake, Incident, Response and Handover stages.
- [x] Add contextual next-best-action guidance driven by the existing validation findings.
- [x] Add persistent live-output readiness context without changing canonical report content.
- [x] Preserve the desktop resizable split and intentional mobile editor-before-preview order.
- [x] Keep all new visual rules Generator-scoped; no global color, type, spacing or component reset.
- [x] Preserve existing labels, IDs, actions, persistence, lifecycle, import, OCR, evidence and audit contracts.
- [x] Add focused component coverage for stage navigation, blocker focus and readiness progression.
- [ ] Prettier, ESLint, unit/component, integration, production build and browser gates.
- [ ] human desktop/mobile Light/Dark visual acceptance.

**Exit:** an operator can understand where they are, what remains, and the next useful action without losing direct access to any existing Generator capability.

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
