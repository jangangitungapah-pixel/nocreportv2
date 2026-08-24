# Post-MVP UI Overhaul Plan

**Document ID:** NOCREPORT-POSTMVP-UI-001  
**Status:** IMPLEMENTED — QA / VISUAL ACCEPTANCE PENDING  
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

- [ ] format/lint/unit/component tests green on the final overhaul head;
- [ ] Firebase Emulator/security tests green on the final overhaul head;
- [ ] production build green on the final overhaul head;
- [ ] browser responsive/touch gate green on the final overhaul head;
- [ ] Playwright lifecycle/RBAC/accessibility gate green on the final overhaul head;
- [ ] manual light/dark desktop/mobile visual QA accepted;
- [ ] PR ready for merge to `main` only after acceptance.

## Implementation notes

- Presentation components and semantic tokens were overhauled first so pages share one coherent visual language.
- Generator persistence, optimistic revision handling, Ticket transitions, report formatting, and OCR contracts were intentionally left unchanged.
- Running Tickets, Archive, Cut Point Tracker, Dashboard, Login, Viewer, and supporting states now use the spatial design system.
- The previous muted-text palette failed the serious WCAG color-contrast gate during Playwright QA; semantic text contrast was raised centrally in the token layer instead of patched page-by-page.
- `main` remains the released production baseline until this draft PR completes QA and receives explicit visual acceptance.

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
