# Template Generator Visual Overhaul — PRD

**Document ID:** NOCREPORT-GEN-UI-001  
**Status:** ACTIVE — GUX-0 STARTING  
**Branch:** `feature/template-generator-visual-overhaul`  
**Stacked base:** `feature/template-generator-features`  
**Baseline:** GEN-F0 through GEN-F9 complete; canonical Quality #807 full green  
**Date:** 2026-08-27

## 1. Purpose

Transform the feature-complete Template Generator into a cohesive, premium, high-speed NOC operations cockpit without changing operational behavior.

The Generator already has strong capabilities, but GEN-F0–F9 added many new surfaces that currently read as one long stack of equally weighted panels. The visual overhaul must make the workspace easier to scan, easier to operate under pressure, and more comfortable during long NOC shifts.

## 2. Product outcome

The final workspace should feel like one coordinated incident-authoring console rather than a collection of independent forms.

Operators should be able to answer these questions almost instantly:

1. What Ticket am I editing and what state is it in?
2. Is anything unsaved or blocking release readiness?
3. What source evidence/import data is available?
4. What core incident fields still need attention?
5. What is the latest operational progress?
6. Is there duplicate/related incident risk?
7. What will the canonical report look like right now?
8. What can I copy/handover immediately?

## 3. Visual direction

Reuse the repository's existing spatial UI language already present in ancestry:

- Space Grotesk display hierarchy and Manrope UI/body typography;
- calm indigo-blue primary accent;
- restrained cyan/violet atmospheric accents;
- layered semantic surfaces rather than hard borders everywhere;
- soft elevation, deliberate radius, compact controls;
- high-density desktop with clear breathing zones;
- touch-safe mobile composition;
- Light and Dark themes as equal citizens;
- short ease-out motion respecting `prefers-reduced-motion`.

### Generator-specific design language

- **Cockpit header:** Ticket identity, lifecycle, revision/save state and primary actions in one unmistakable control strip.
- **Authoring lane:** core incident fields remain the visual anchor.
- **Intelligence lane:** import, validation, duplicate/related evidence and audit context feel supportive, not dominant.
- **Operations lane:** Progress, Evidence, Coordinate/OCR and Impact feel task-oriented and fast.
- **Output lane:** canonical report preview remains persistent and visually stable on desktop.
- **Utility drawer/shelf:** Copy, handover and presets are accessible without competing with authoring.

## 4. Protected contracts

This program must not intentionally change:

- Ticket data model or Firestore schema;
- Firestore query/index/Security Rules behavior;
- Firebase Authentication or RBAC outcomes;
- Ticket lifecycle semantics;
- optimistic revision handling;
- parser/import candidate behavior;
- `.msg` Sent Time → Dispatch Time authority;
- selective import overwrite safety;
- duplicate/related-Ticket scoring/query behavior;
- local Draft Recovery semantics;
- audit/revision data meaning;
- OCR local-only/privacy contract;
- coordinate persistence rules;
- canonical report text/content;
- clipboard output content.

Presentation refactors must preserve labels, accessible names, IDs and test-critical semantics unless tests are updated only for intentional presentation structure.

## 5. Phase plan

### GUX-0 — Cockpit architecture foundation

Goal: establish a strong workspace hierarchy before redesigning individual modules.

- create Generator-specific semantic layout classes/tokens;
- elevate PageHeader + command state into a cohesive cockpit header zone;
- redesign sticky command bar hierarchy without changing actions;
- improve editor/preview workspace framing and separation;
- give editor sections consistent premium section shells;
- establish primary/secondary/utility visual tiers;
- preserve all behavior and test hooks;
- add/adjust presentation regression tests where needed;
- format/lint/unit/component green.

**Exit:** the Generator reads as one coherent workstation even before module-specific passes.

### GUX-1 — Import + readiness intelligence

- redesign Unified Import source selector, `.msg` drop/input and review state;
- improve source/confidence/conflict hierarchy;
- redesign Validation Center blocker/warning/info presentation;
- integrate duplicate/related risk into the same intelligence language;
- emphasize explicit Apply/Create Anyway decisions;
- preserve import/duplicate behavior exactly.

### GUX-2 — Core incident authoring

- redesign Ticket Identity, timing, assignment/diagnosis and coordinate sections;
- improve field density and grouping;
- make Smart Title state and detected TT easier to scan;
- redesign Impact editor/builder;
- improve coordinate normalized/verified states;
- preserve form IDs, validation and persistence.

### GUX-3 — Operations timeline + evidence

- redesign Evidence Workspace queue/cards;
- redesign OCR/Coordinate extraction surface;
- redesign Progress Composer for fast snippet-driven updates;
- redesign Progress Timeline for shift scanning;
- improve status/event-time hierarchy;
- preserve local-file/privacy and revision-safe Progress behavior.

### GUX-4 — Output + handover utilities

- strengthen Report Preview as the canonical output surface;
- redesign Copy Center and Handover Summary as compact utilities;
- redesign Operator Presets as low-noise configuration;
- redesign Revision History/Audit surface;
- keep clipboard and audit semantics unchanged.

### GUX-5 — Responsive/mobile workspace

- replace desktop assumptions with intentional mobile information ordering;
- keep primary Save/lifecycle actions reachable;
- avoid excessively tall stacked utility blocks;
- ensure Import, Validation, Progress and Preview remain usable at 360–412 px widths;
- no horizontal overflow;
- touch targets remain safe.

### GUX-6 — Theme, motion and accessibility polish

- Light/Dark parity;
- serious/critical axe clean;
- keyboard/focus order review;
- contrast and state differentiation;
- reduced-motion behavior;
- long-session visual-fatigue review.

### GUX-7 — Integrated release readiness

- Prettier + committed-format verification;
- ESLint;
- all unit/component tests;
- Firebase Emulator repository tests;
- Firestore Security Rules matrix;
- dependency/security hygiene;
- generic + Firebase-configured production builds;
- responsive/touch browser matrix;
- Admin lifecycle E2E;
- Operator/Viewer RBAC E2E;
- Generator-specific import/draft/revision/keyboard regressions;
- Light/Dark axe + overflow;
- human desktop/mobile visual acceptance.

### GUX-8 — Spatial flow refinement

- expose the existing workflow as four navigable stages: Intake, Incident, Response and Handover;
- keep the stages non-blocking so experienced operators can jump directly to any module;
- group modules into one continuous incident canvas with a compact stage rail;
- derive a single next-best-action from the existing validation contract and operational context;
- keep canonical output persistent and add a compact readiness summary around it;
- preserve the resizable desktop split and editor-before-preview mobile order;
- prefer Generator-scoped composition styles over global design-system resets;
- preserve all protected functional, data, privacy, lifecycle and accessibility contracts.

## 6. Desktop information architecture

Preferred hierarchy:

```text
Page / Cockpit Header
Sticky Command Bar

┌──────────────────────────── Authoring / Operations ────────────────────────────┬──────── Output ────────┐
│ Recovery / Import / Readiness intelligence                                    │ Canonical Report       │
│ Core incident form                                                            │ Preview                │
│ Impact                                                                         │ persistent / stable    │
│ Evidence + Coordinate                                                         │                        │
│ Progress Composer + Timeline                                                   │                        │
│ Utility shelf: Copy / Presets / Audit                                          │                        │
└────────────────────────────────────────────────────────────────────────────────┴────────────────────────┘
```

The desktop split remains resizable. The overhaul should improve visual framing rather than replace the existing `ResizableWorkspace` behavior.

## 7. Mobile information architecture

Recommended order:

1. compact Ticket/cockpit header;
2. sticky primary actions;
3. blocker/warning summary;
4. core authoring fields;
5. Import/Impact helpers;
6. Progress composer/timeline;
7. Evidence/Coordinate;
8. Report Preview;
9. Copy/Presets/Audit utilities.

Exact ordering may vary when preserving existing component behavior is safer, but important actions must not disappear below low-priority utilities.

## 8. Acceptance criteria

- no functional regression from GEN-F9 baseline;
- no data/schema/rules changes unless separately approved;
- Generator has unmistakable primary, secondary and utility hierarchy;
- desktop authoring + preview can be scanned without visual clutter;
- 360/390/412 px mobile widths remain usable without horizontal overflow;
- lifecycle and Save state remain obvious;
- blocking validation is visually stronger than warnings/info;
- imported source/confidence/conflicts remain understandable;
- Progress updates remain fast;
- Light/Dark both look intentional;
- keyboard/focus/accessibility remain production-grade.
