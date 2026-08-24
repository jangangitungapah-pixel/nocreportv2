# Post-MVP UI Overhaul Plan

**Document ID:** NOCREPORT-POSTMVP-UI-001  
**Status:** AUTOMATED QA COMPLETE — VISUAL ACCEPTANCE PENDING  
**Branch:** `feature/ui-overhaul-v2`  
**Production baseline:** `main` / MVP RELEASED

## Design intent

Refresh the complete NOC Report interface without changing operational business rules, Firebase data contracts, authorization boundaries, or production workflows.

The target direction is a **spatial operations cockpit**: modern, youthful, calm, high-density when needed, and comfortable for long monitoring/reporting sessions.

### Experience principles

- Modern, not trendy-for-trend's-sake.
- Youthful, not playful or noisy.
- Spatial depth through layered surfaces, not excessive decoration.
- Strong typography hierarchy with highly readable operational text.
- Calm contrast for long sessions; important states remain immediately scannable.
- Light and dark themes remain first-class.
- Mobile remains touch-safe and compact; desktop gains more breathing room and hierarchy.
- No business logic, Firebase, RBAC, OCR, Ticket lifecycle, or persistence behavior is intentionally changed.

## Visual language

- Display / heading font: **Space Grotesk**.
- UI / body font: **Manrope**.
- Operational identifiers and machine-like data may use the existing monospace stack.
- Calm indigo-blue primary accent with restrained secondary cyan/violet atmospheric accents.
- Softer canvas with subtle radial depth.
- Layered panel/elevated/glass surfaces.
- Larger, more deliberate radius scale.
- Soft multi-level elevation rather than hard borders everywhere.
- Short ease-out transitions and motion that respects `prefers-reduced-motion`.

## Implementation phases

### UI-0 — Design system foundation

- [x] expand semantic color tokens for light/dark modes;
- [x] add typography, spacing, radius, elevation, motion, control, and layout tokens;
- [x] modernize global typography/background/scrollbar/selection behavior;
- [x] modernize Button, IconButton, fields, status badges, empty/error states, skeletons, and dialogs;
- [x] preserve accessibility/focus behavior.

### UI-1 — Application shell

- [x] modernize desktop navigation rail;
- [x] modernize sticky top bar;
- [x] modernize mobile bottom navigation;
- [x] improve workspace/profile presentation;
- [x] keep responsive/protected-route behavior unchanged.

### UI-2 — Dashboard

- [x] spatial hero/overview composition;
- [x] stronger KPI cards and data hierarchy;
- [x] refreshed recent-ticket activity surface;
- [x] improved local-preview messaging.

### UI-3 — Template Generator & Ticket Viewer

- [x] redesign form sections and report workspace;
- [x] improve long-form input comfort and section hierarchy;
- [x] modernize progress timeline, OCR/coordinate surfaces, preview, and lifecycle actions;
- [x] preserve save/revision/OCR behavior.

### UI-4 — Running Tickets & Archive

- [x] redesign filter/search controls;
- [x] modernize desktop table/data grid;
- [x] modernize mobile ticket cards;
- [x] improve quick-action hierarchy and scanability.

### UI-5 — Cut Point Tracker

- [x] modernize map/list workspace framing;
- [x] modernize filter/list/bottom-sheet surfaces;
- [x] improve marker-detail and map-control visual integration;
- [x] preserve Leaflet/touch behavior.

### UI-6 — Authentication

- [x] redesign Login into a polished production entry experience;
- [x] preserve Firebase authentication behavior and error handling.

### UI-7 — Full visual QA & release readiness

- [x] format/lint/unit/component tests green on the final overhaul code head;
- [x] Firebase Emulator/security tests green on the final overhaul code head;
- [x] production build green on the final overhaul code head;
- [x] browser responsive/touch gate green on the final overhaul code head;
- [x] Playwright lifecycle/RBAC/accessibility gate green on the final overhaul code head;
- [ ] manual light/dark desktop/mobile visual QA accepted;
- [ ] PR ready for merge to `main` only after acceptance.

## Automated QA evidence

Quality **#617** completed successfully for code head `84085f6fbc09405ef56ea2e7ad13907255a16bc7` on 2026-08-24.

Validated gates:

- Prettier formatting and committed-format verification;
- ESLint;
- 104 unit/component tests;
- Firebase Emulator repository integration;
- Firestore Security Rules role matrix;
- repository/security hygiene;
- Firebase production release preflight;
- generic and Firebase-configured production builds;
- dev-server smoke;
- responsive viewport and touch QA;
- Admin end-to-end Ticket lifecycle including OCR, progress, resolve, archive, and restore;
- Operator/Viewer RBAC restrictions;
- keyboard navigation and dialog focus management;
- serious/critical axe accessibility checks on primary routes.

## Implementation notes

- Presentation components and semantic tokens were overhauled first so pages share one coherent visual language.
- The Generator workspace frame received a dedicated final spatial pass so the most frequently used operator page is consistent with the rest of the overhaul.
- Generator persistence, optimistic revision handling, Ticket transitions, report formatting, and OCR contracts were intentionally left unchanged.
- Running Tickets, Archive, Cut Point Tracker, Dashboard, Login, Viewer, and supporting states now use the spatial design system.
- Muted-text and destructive-action contrast issues discovered by axe were corrected centrally through semantic tokens.
- Leaflet attribution links remain intact and now have explicit non-color link distinction and focus treatment.
- Exact Prettier output is committed to the feature branch; the temporary one-shot formatting workflow was removed and is not part of the PR diff.
- `main` remains the released production baseline until this draft PR receives explicit manual visual acceptance.

## Manual visual acceptance checklist

Review both **Light** and **Dark** themes at desktop and mobile sizes, with special attention to:

- Login — first impression, hierarchy, contrast, and form comfort;
- Dashboard — spatial depth, KPI scanability, recent activity, and long-session visual fatigue;
- Generator — command toolbar, form density, section hierarchy, Report Preview, OCR, coordinate, and Progress Timeline;
- Running Tickets — desktop data density, mobile cards, filtering, and quick actions;
- Cut Point Tracker — map/list balance, marker cards, mobile bottom-sheet feel, and map controls;
- Archive — lifecycle actions, destructive-state clarity, and data scanability;
- shell/navigation — desktop rail, top bar, mobile bottom navigation, Light/Dark consistency, and no distracting decorative excess.

## Non-goals

This overhaul must not intentionally change:

- Ticket data model;
- Firestore collections/index contracts;
- Firebase Authentication/RBAC rules;
- Ticket lifecycle semantics;
- OCR engine/privacy contract;
- coordinate persistence rules;
- report formatter output;
- production hosting architecture.
