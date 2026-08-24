# Post-MVP UI Overhaul Plan

**Document ID:** NOCREPORT-POSTMVP-UI-001  
**Status:** ACTIVE  
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

- [ ] expand semantic color tokens for light/dark modes;
- [ ] add typography, spacing, radius, elevation, motion, control, and layout tokens;
- [ ] modernize global typography/background/scrollbar/selection behavior;
- [ ] modernize Button, IconButton, fields, status badges, empty/error states, skeletons, and dialogs;
- [ ] preserve accessibility/focus behavior.

### UI-1 — Application shell

- [ ] modernize desktop navigation rail;
- [ ] modernize sticky top bar;
- [ ] modernize mobile bottom navigation;
- [ ] improve workspace/profile presentation;
- [ ] keep responsive/protected-route behavior unchanged.

### UI-2 — Dashboard

- [ ] spatial hero/overview composition;
- [ ] stronger KPI cards and data hierarchy;
- [ ] refreshed recent-ticket activity surface;
- [ ] improved local-preview messaging.

### UI-3 — Template Generator & Ticket Viewer

- [ ] redesign form sections and report workspace;
- [ ] improve long-form input comfort and section hierarchy;
- [ ] modernize progress timeline, OCR/coordinate surfaces, preview, and lifecycle actions;
- [ ] preserve save/revision/OCR behavior.

### UI-4 — Running Tickets & Archive

- [ ] redesign filter/search controls;
- [ ] modernize desktop table/data grid;
- [ ] modernize mobile ticket cards;
- [ ] improve quick-action hierarchy and scanability.

### UI-5 — Cut Point Tracker

- [ ] modernize map/list workspace framing;
- [ ] modernize filter/list/bottom-sheet surfaces;
- [ ] improve marker-detail and map-control visual integration;
- [ ] preserve Leaflet/touch behavior.

### UI-6 — Authentication

- [ ] redesign Login into a polished production entry experience;
- [ ] preserve Firebase authentication behavior and error handling.

### UI-7 — Full visual QA & release readiness

- [ ] format/lint/unit/component tests green;
- [ ] Firebase Emulator/security tests green;
- [ ] production build green;
- [ ] browser responsive/touch gate green;
- [ ] Playwright lifecycle/RBAC/accessibility gate green;
- [ ] manual light/dark desktop/mobile visual QA accepted;
- [ ] PR ready for merge to `main` only after acceptance.

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
