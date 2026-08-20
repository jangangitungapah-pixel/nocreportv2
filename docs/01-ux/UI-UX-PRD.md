# NOC Report Template Generator — UI/UX PRD

**Document ID:** NOCREPORT-UX-001  
**Version:** 0.1  
**Status:** Baseline / Supporting Product Specification  
**Parent document:** `docs/00-product/MASTER-PRD.md`  
**Repository:** `jangangitungapah-pixel/nocreportv2`  
**Primary platform:** Responsive web application  
**UI implementation direction:** React + Vite + JSX + Tailwind CSS ecosystem

---

# 1. Purpose

This document defines the complete MVP user experience and interface requirements for NOC Report Template Generator.

The Master Product PRD remains the source of truth for product behavior and scope. This UI/UX PRD translates those requirements into navigation, page composition, interaction patterns, visual hierarchy, responsive behavior, states, forms, feedback, accessibility, and operational workflows.

The application must feel like an **NOC operations workspace**, not a generic admin template or a long CRUD form.

The interface must optimize for:

- fast incident creation;
- rapid repeated progress updates;
- high information density without visual chaos;
- immediate visibility of running incidents;
- predictable interaction patterns;
- minimal navigation cost;
- easy copy/paste reporting;
- reliable use during time-sensitive operational work;
- strong desktop productivity while remaining fully usable on mobile.

---

# 2. UX Product Principles

## UX-01 — Operational speed over decoration

Every major screen must prioritize useful information and actions over ornamental whitespace.

The UI may be visually modern, but visual styling must never slow the operator down.

## UX-02 — Structured but forgiving

Running incidents are naturally incomplete.

The interface must clearly distinguish:

- required to create a Draft;
- required to mark Running;
- recommended information;
- information currently unknown.

Unknown Rootcause, PIC, Cut Point, or coordinates must not make the form feel broken.

## UX-03 — Frequent actions stay close

The highest-frequency actions must require minimal travel and minimal clicks:

- New Ticket;
- Add Progress;
- Save;
- Copy Report;
- Open Running Ticket;
- Resolve Ticket.

## UX-04 — No silent state changes

Users must always understand whether data is:

- saved;
- unsaved;
- processing;
- invalid;
- incomplete;
- successfully copied;
- successfully extracted from OCR.

## UX-05 — One ticket, one source of truth

Dashboard, Generator, Running Ticket, and Cut Point Tracker are different views of the same Ticket Report data.

The UI must reinforce this model and avoid duplicate editing concepts.

## UX-06 — Dense, aligned, and scan-friendly

Desktop layouts should make efficient use of space.

Avoid:

- oversized hero sections;
- giant empty cards;
- excessive card nesting;
- decorative gradients that reduce readability;
- inconsistent widths;
- arbitrary spacing;
- misaligned field labels or action rows.

## UX-07 — Mobile is operational, not merely responsive

Mobile must not be a shrunken desktop layout.

It must support actual field/operator use with:

- one-handed navigation;
- large tap targets;
- sticky critical actions;
- collapsible sections;
- mobile-friendly ticket cards instead of forced desktop tables;
- bottom sheets/drawers where appropriate.

---

# 3. Information Architecture

The MVP application has four primary destinations:

1. Dashboard
2. Template Generator
3. Running Ticket
4. Cut Point Tracker

Recommended routes:

```text
/
/generator
/tickets/running
/tickets/:ticketId
/cut-points
```

The exact router library belongs to the Technical Architecture PRD, but navigation behavior must follow this information architecture.

---

# 4. Global Application Shell

## 4.1 Desktop

Desktop layout uses a persistent left navigation rail/sidebar plus a compact top application bar.

Recommended composition:

```text
┌──────────────┬───────────────────────────────────────────────┐
│ Sidebar      │ Top Bar                                       │
│              ├───────────────────────────────────────────────┤
│ Dashboard    │                                               │
│ Generator    │ Main Workspace                                │
│ Running      │                                               │
│ Cut Points   │                                               │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

Sidebar requirements:

- clear active-page indicator;
- icon + text label in expanded mode;
- optional compact/collapsed state on smaller desktop widths;
- New Ticket quick action remains prominent;
- no multi-level navigation in MVP unless required later.

Top bar requirements:

- current page/title context;
- optional compact search entry where page-appropriate;
- connection/sync state when necessary;
- user/profile menu after authentication is implemented;
- theme control if theme switching is enabled.

## 4.2 Tablet

Sidebar may collapse into a navigation rail or drawer.

Main content must retain operational density without horizontal page overflow.

## 4.3 Mobile

Primary navigation uses a compact mobile pattern.

Preferred MVP pattern:

- top app bar for page context;
- bottom navigation for the four primary destinations;
- floating or prominent New Ticket action where it does not conflict with bottom navigation.

Bottom navigation labels:

- Dashboard
- Generator
- Running
- Cut Points

The active destination must always be obvious.

---

# 5. Visual Design System

## 5.1 Visual Character

The visual language should feel:

- modern;
- technical;
- professional;
- calm under operational pressure;
- high fidelity;
- compact;
- trustworthy.

Avoid a playful consumer-app look.

## 5.2 Theme

The design system should support both Light and Dark themes without maintaining separate component implementations.

All components must consume semantic design tokens rather than hardcoded theme-specific values.

Theme preference should persist locally for the user.

If no preference exists, following the OS/browser preference is acceptable.

## 5.3 Color Semantics

Semantic color roles must exist for:

- background;
- surface;
- elevated surface;
- border/subtle divider;
- primary text;
- secondary text;
- muted text;
- primary action;
- success;
- warning;
- danger;
- informational;
- focus ring.

Ticket status colors must be used consistently across all pages.

Suggested semantic mapping:

- Draft → neutral
- Running → active/information emphasis
- Resolved → success
- Archived → muted

Color must never be the only status indicator; status text/iconography is also required.

## 5.4 Typography

Use one highly legible UI sans-serif family.

Typography hierarchy should remain compact.

Recommended functional scale:

- Page title: 24–28 px desktop, 20–24 px mobile
- Section heading: 16–18 px
- Body/input: 14–16 px
- Data-grid metadata: 12–14 px
- Caption/helper: 12–13 px

Avoid oversized display typography.

Operational identifiers such as TT numbers and coordinates may use tabular numbers or a monospace treatment when this improves scanability.

## 5.5 Spacing

Use a consistent spacing scale.

Preferred rhythm:

```text
4 / 8 / 12 / 16 / 20 / 24 / 32 px
```

Most operational forms should primarily use 8–16 px internal spacing.

## 5.6 Corners and elevation

Use moderate radius rather than extreme pill-shaped containers.

Suggested:

- controls: 8–10 px;
- panels/cards: 10–14 px;
- badges: pill only where semantically appropriate.

Elevation should be subtle and used to establish hierarchy, not decorate every card.

---

# 6. Core Component Rules

The application should establish reusable primitives for:

- Button
- Icon Button
- Text Input
- Text Area
- Date/Time Input
- Select
- Checkbox/Toggle where needed
- Badge
- Status Badge
- Card/Panel
- Section Header
- Data Grid/Table
- Mobile Ticket Card
- Dialog
- Drawer/Bottom Sheet
- Toast
- Inline Alert
- Empty State
- Skeleton
- Tooltip
- Dropzone
- Timeline Item
- Map Marker Popup
- Confirmation Dialog

Every form control must use consistent:

- label position;
- height;
- border;
- focus treatment;
- validation presentation;
- disabled state;
- helper text behavior.

---

# 7. Dashboard

## 7.1 Goal

The Dashboard answers three immediate questions:

1. How many incidents are currently running?
2. What changed recently?
3. What should I open next?

## 7.2 Desktop layout

Recommended layout:

```text
Page Header + New Ticket

[ Running Tickets ] [ Tickets Today ] [ With Cut Point ] [ Recently Resolved ]

[ Running Ticket Overview / high-priority recent list                ]

[ Recent Activity                         ] [ Recent Cut Points / summary ]
```

The exact metric set may evolve as data becomes available, but the page must not invent analytics unsupported by stored ticket data.

## 7.3 Running Ticket Overview

Show a concise operational list containing at least:

- TT number if detected;
- shortened Title;
- Occur Time;
- PIC;
- latest progress;
- last updated time;
- status.

Each row/card opens the Ticket detail/editor.

## 7.4 Quick Actions

At minimum:

- New Ticket
- View Running Tickets

## 7.5 Mobile

Summary metrics become horizontally scrollable compact stat cards or a two-column grid.

Running tickets use stacked cards.

The page must not require horizontal scrolling for primary content.

---

# 8. Template Generator — Primary Workspace

## 8.1 Goal

Template Generator is the most important interface in the product.

The operator must be able to create or update a usable report without feeling like they are filling a long bureaucratic form.

## 8.2 Desktop composition

Use a split workspace on sufficiently wide screens.

Recommended ratio:

```text
58–62% Form Workspace
38–42% Report Preview
```

Example:

```text
┌─────────────────────────────────┬───────────────────────────┐
│ Ticket Form                     │ Live Report Preview       │
│                                 │                           │
│ Identity                        │ Generated plain text      │
│ Impact                          │                           │
│ Timing                          │                           │
│ Assignment                      │                           │
│ Diagnosis / Cut Point           │                           │
│ Coordinate Extraction           │                           │
│ Progress Timeline               │                           │
│                                 │ [Copy Report]             │
└─────────────────────────────────┴───────────────────────────┘
```

The preview panel may remain sticky within the viewport so the report remains visible while editing.

The form pane remains the primary scroll container/page flow.

## 8.3 Generator Header

Header must show:

- Draft/Running/Resolved status;
- detected TT number where available;
- unsaved/saved state;
- primary Save action;
- Copy Report action;
- contextual status action such as Mark Running or Resolve.

Do not place a large decorative page hero above the form.

## 8.4 Form grouping

Fields are organized into operational sections.

### Section A — Ticket Identity

- Title
- detected TT number display if recognized

TT detection is informative; it does not replace Title input.

### Section B — Impact List

Impact List uses a repeatable list editor.

Requirements:

- Add Impact button;
- inline editing;
- delete/remove;
- drag handle or explicit move controls for reorder;
- hide unused empty row noise.

If no impact exists, the section should remain compact and communicate that it is optional.

### Section C — Incident Timing

- Occur Time
- Dispatch Time

On desktop, these fields may share one row.

On mobile, stack them unless width permits comfortable side-by-side entry.

### Section D — Assignment

- PIC

### Section E — Diagnosis & Cut Point

- Rootcause
- Cut Point narrative

These text fields may grow vertically as content expands.

### Section F — Cut Point Coordinate

Contains:

- image dropzone;
- image preview when selected;
- OCR processing state;
- extracted text/candidate coordinate;
- Latitude input;
- Longitude input;
- normalized coordinate preview;
- validation state.

### Section G — Progress Timeline

This section receives special interaction priority because updates are frequent.

---

# 9. Progress Timeline UX

## 9.1 Add Progress Composer

The Add Progress composer should be visible without opening a modal in the normal Generator workflow.

Inputs:

- date/time;
- progress text.

Default timestamp may initialize to current local time, but the user must be able to correct it before saving.

Primary action:

- Add Update

Keyboard-friendly submission should be supported where safe.

## 9.2 Timeline display

Each entry shows:

- HH:mm prominently;
- date when required to disambiguate multi-day incidents;
- progress text;
- edit action for authorized users;
- delete/remove action only with confirmation or deliberate affordance.

Entries are displayed chronologically.

For incidents spanning multiple days, insert subtle date separators.

Example:

```text
18 Aug 2026
14:21  we have open TT ...
14:47  team OTW ...
23:55  Team sedang proses splicing ...

19 Aug 2026
00:15  Jointing selesai ...
```

Generated report formatting remains governed by the Master PRD.

## 9.3 Fast update from Running Ticket

Running Ticket must provide a fast Add Progress action that opens either:

- the ticket editor focused directly on the composer; or
- a compact progress drawer.

It must not require navigating through unrelated fields first.

---

# 10. Live Report Preview

## 10.1 Behavior

Preview reflects current editable form state immediately.

It is a faithful plain-text rendering, not a redesigned card version of the report.

## 10.2 Preview controls

Minimum:

- Copy Report
- copy-success feedback

Optional later:

- Select All
- expand preview

## 10.3 Empty values

The preview must follow product rendering rules.

Example:

- empty Impact List → entire Impact List output hidden;
- incomplete operational fields must not result in misleading fake values.

## 10.4 Copy feedback

After successful copy:

- button can temporarily show `Copied`;
- optional non-intrusive toast appears;
- feedback disappears automatically without blocking work.

Copy failure must provide actionable error feedback.

---

# 11. Coordinate Photo / OCR UX

## 11.1 Dropzone

Desktop dropzone supports:

- drag and drop;
- click to browse.

Mobile supports:

- choose photo/file;
- browser-supported camera source where available.

Dropzone clearly explains its purpose:

**Extract coordinates from visible geotag watermark.**

Do not imply that image recognition is authoritative.

## 11.2 Processing states

The OCR area must visibly distinguish:

1. No image
2. Image selected
3. Processing
4. Coordinate detected with high confidence
5. Candidate coordinate requires verification
6. No coordinate detected
7. Invalid coordinate
8. Processing error

## 11.3 Review before trust

OCR output should populate editable Latitude/Longitude fields while visually indicating that the values were extracted.

When result is ambiguous:

- highlight the two candidate values;
- explain the uncertainty briefly;
- require user verification before treating the location as valid for mapping.

## 11.4 Normalized display

After valid input, show:

```text
-6.12345, 107.12345
```

with a clear Valid/Ready state.

Do not use excessive success decoration.

## 11.5 Replace/remove image

User can replace or clear the locally selected image without clearing already confirmed coordinates unless explicitly chosen.

---

# 12. Save and Unsaved Changes UX

## 12.1 Explicit persistence

The interface must expose a clear Save action.

To avoid unnecessary Firestore write amplification and ambiguous background behavior, MVP UX should not depend on aggressive per-keystroke cloud autosave.

A future debounced autosave strategy may be added in the Technical Architecture phase if it remains Spark-friendly and reliable.

## 12.2 Dirty state

When current form data differs from the last persisted version, show a compact `Unsaved changes` indicator.

After save:

- indicator becomes `Saved` or disappears after brief confirmation;
- timestamp may show `Saved just now` where useful.

## 12.3 Navigation guard

If meaningful unsaved changes exist and the user navigates away, the application must prevent silent data loss.

Use a confirmation dialog such as:

- Stay and continue editing
- Leave without saving

Browser close/reload handling should use standard browser protections where technically possible.

---

# 13. Running Ticket Page

## 13.1 Goal

This page is the active incident command list.

It must be optimized for scanning many running incidents quickly.

## 13.2 Desktop data grid

Recommended columns:

- TT
- Title
- Occur Time
- PIC
- Rootcause
- Cut Point
- Latest Progress
- Last Updated
- Coordinate
- Status
- Actions

Not every column must remain visible at all desktop widths.

Priority order should preserve:

1. TT / Title
2. latest progress
3. last updated
4. PIC
5. Occur Time
6. relevant operational metadata

Long values should truncate visually with accessible expansion/tooltip behavior rather than forcing massive row height by default.

## 13.3 Filters

Minimum useful controls:

- Search
- PIC filter where data supports it
- coordinate presence filter
- sort by Last Updated / Occur Time

Because this page already represents Running status, a redundant status filter is unnecessary in the default MVP view.

## 13.4 Search

Search must support at least:

- TT number
- Title
- PIC
- Cut Point

Search field remains easy to reach.

## 13.5 Row actions

High-value row actions:

- Open
- Add Progress
- Copy Report
- Resolve

Dangerous/less frequent actions belong in an overflow menu.

## 13.6 Mobile

Do not render a desktop table squeezed into the viewport.

Use stacked Ticket Cards.

Each card should display:

- TT/status row;
- shortened title;
- latest progress;
- PIC;
- last updated;
- quick actions.

Card can expand for additional metadata.

A sticky search/filter bar may be used if it improves repeated use.

---

# 14. Ticket Detail / Edit Context

A ticket opened from Dashboard, Running Ticket, or Cut Point Tracker should use the same editing experience as Template Generator rather than creating a second unrelated edit UI.

This can be implemented as:

- `/generator?id=<ticket>` style state; or
- `/tickets/:ticketId` rendering the shared Generator workspace.

Exact route architecture is deferred to the TDD.

UX requirement:

**create and edit must share component behavior and visual language.**

---

# 15. Cut Point Tracker

## 15.1 Goal

Visualize valid known cut-point coordinates from Ticket Reports.

## 15.2 Desktop layout

Preferred layout:

```text
┌──────────────────────┬─────────────────────────────────────┐
│ Filter / Ticket List │ Map                                 │
│                      │                                     │
│ Search               │ Markers                             │
│ Status               │                                     │
│ Date                  │                                     │
│ Ticket cards          │                                     │
└──────────────────────┴─────────────────────────────────────┘
```

The map receives the majority of the available space.

The companion list helps users access tickets without relying only on map interaction.

## 15.3 Marker behavior

Selecting a marker shows a compact popup containing:

- TT number;
- shortened Title;
- status;
- Cut Point;
- coordinate;
- PIC;
- last updated;
- Open Ticket action.

Do not overload the popup with the entire report.

## 15.4 Marker states

Resolved and Running tickets should be distinguishable using semantic marker style plus text/icon context when selected.

The map must not render invalid coordinates.

## 15.5 Mobile

Map becomes the primary canvas.

Filters/list may open in a bottom sheet.

Selecting a marker opens a bottom sheet/card rather than a tiny desktop-style popup where possible.

Controls must not obscure essential map navigation.

---

# 16. Loading States

Avoid full-screen blocking spinners for normal page loads.

Preferred patterns:

- skeleton rows for ticket lists;
- skeleton metric cards;
- localized spinner for OCR;
- localized progress indicator for Save action;
- map loading placeholder within map region.

If initial authentication/loading genuinely blocks the application, a compact application-level loading screen is acceptable.

---

# 17. Empty States

Empty states must be useful and concise.

## Dashboard — no tickets

Message should explain that no tickets are recorded yet and offer `Create Ticket`.

## Running Ticket — no active incident

Show a calm `No running tickets` state plus New Ticket action.

Do not frame absence of incidents as an error.

## Cut Point Tracker — no coordinates

Explain that tickets appear on the map after valid Cut Point coordinates are saved.

## Search — no results

Distinguish `no tickets exist` from `no tickets match this search/filter`.

---

# 18. Error States

Errors must be categorized by context.

Examples:

- validation error;
- save failed;
- ticket load failed;
- OCR processing failed;
- coordinate invalid;
- clipboard copy failed;
- map load failed;
- network/offline state;
- authorization denied.

Error presentation rules:

- field errors remain inline near the field;
- page-load failures use an inline panel with Retry;
- transient action failures may use toast plus persistent inline context when necessary;
- never discard user-entered form data merely because persistence failed.

---

# 19. Confirmation Dialogs

Require confirmation for actions with meaningful destructive consequences, including:

- discard unsaved changes;
- archive ticket;
- remove a progress entry when loss is meaningful;
- clear confirmed coordinates where accidental loss would be problematic.

Do not add confirmation dialogs to routine actions such as copying reports or adding progress.

Resolve/Close may use a lightweight confirmation if business workflow requires intentional status transition.

---

# 20. Toast / Feedback Rules

Use toasts for short non-blocking feedback such as:

- Saved
- Report copied
- Ticket resolved
- Coordinate extracted

Avoid stacking many toasts for background events.

Failures that require user action must not disappear only as a toast.

---

# 21. Validation UX

Validation should happen at the most useful time.

Rules:

- do not show every field as red immediately on page load;
- validate on blur, submit, status transition, or when input becomes clearly invalid;
- preserve incomplete Draft workflows;
- distinguish warning from blocking error.

Examples:

### Draft

Title may be incomplete depending on implementation policy.

### Mark Running

Must clearly identify missing required fields such as Title or Occur Time according to Master PRD.

### Coordinate

Latitude outside `-90...90` is a blocking coordinate error.

Longitude outside `-180...180` is a blocking coordinate error.

---

# 22. Responsive Breakpoint Behavior

Implementation may use Tailwind defaults or adjusted project tokens, but product behavior should approximately follow:

- Mobile: `< 768 px`
- Tablet/small desktop: `768–1199 px`
- Desktop workspace: `>= 1200 px`

These are behavioral guidelines rather than an obligation to hardcode exactly these numbers.

## Desktop

- split Generator workspace;
- persistent/collapsible sidebar;
- data grid;
- Cut Point side list + map.

## Tablet

- sidebar collapses;
- Generator preview may become secondary panel/drawer depending on width;
- table reduces lower-priority columns.

## Mobile

- single-column forms;
- bottom navigation;
- Ticket Cards;
- report preview as full-height sheet/drawer or dedicated tab within Generator;
- map filter/list in bottom sheet;
- sticky contextual action bar where needed.

---

# 23. Mobile Generator UX

The mobile Generator must prioritize entry and update flow.

Recommended structure:

```text
Top Bar
Status + Save state

Ticket Identity
Impact
Timing
Assignment
Diagnosis
Coordinates
Progress

Sticky Bottom Action Area
[Save] [Preview / Copy]
```

Sections may be collapsible after they contain valid data, but the UI must not hide validation errors inside collapsed sections without a visible error indicator.

Report Preview on mobile should open as:

- full-screen sheet;
- large bottom sheet; or
- dedicated internal Preview mode.

The preview must have a sticky Copy button.

---

# 24. Accessibility Requirements

MVP must target WCAG 2.1 AA-compatible interaction patterns where reasonably achievable.

Minimum requirements:

- semantic HTML controls;
- keyboard-accessible navigation and forms;
- visible focus states;
- meaningful labels for every input;
- icon-only buttons have accessible names;
- error messages are programmatically associated with fields;
- status does not rely only on color;
- sufficient text/background contrast;
- map information also accessible through the companion ticket list;
- drag-and-drop photo input also works through standard file selection;
- dialogs manage focus correctly;
- touch targets are approximately 44×44 px minimum for primary mobile interactions.

---

# 25. Keyboard Productivity

Desktop NOC users may repeatedly enter updates from a keyboard.

The UI should support efficient keyboard operation.

Recommended behavior:

- predictable Tab order;
- `Ctrl/Cmd + S` may trigger Save when safe;
- Add Progress can support a deliberate keyboard shortcut or `Ctrl/Cmd + Enter` inside the composer;
- Escape closes dismissible drawers/dialogs when no destructive side effect occurs.

Keyboard shortcuts must never cause accidental ticket resolution or destructive actions.

---

# 26. Date and Time UX

Display/report format follows:

```text
DD/MM/YYYY HH:mm
```

Requirements:

- 24-hour clock;
- locale-friendly input;
- full date stored even if timeline rendering emphasizes HH:mm;
- multi-day timeline clearly indicates date boundaries;
- no ambiguity between month/day ordering in visible output.

---

# 27. Status UX

Status must appear consistently in:

- Generator header;
- Dashboard ticket list;
- Running Ticket;
- Cut Point marker details;
- Ticket detail context.

Available product states:

- Draft
- Running
- Resolved/Closed
- Archived

Status transition actions should use verbs:

- Mark Running
- Resolve Ticket
- Archive Ticket

rather than forcing users to manipulate an abstract status dropdown for every workflow.

An advanced/admin edit control may exist later, but the normal operator flow should be action-oriented.

---

# 28. Content and Labeling Rules

The application interface may use concise English operational labels aligned with the report format.

Canonical field names remain:

- Title
- Impact List
- Occur Time
- Dispatch Time
- PIC
- Rootcause
- Cut Point
- Update Progress
- Latitude
- Longitude

Avoid unnecessary alternate wording across pages.

For example, do not call `PIC` "Assigned Engineer" on one screen and `PIC` elsewhere unless the product terminology is intentionally revised.

---

# 29. Data Density and Alignment Rules

Every page must maintain a clear grid.

Desktop rules:

- shared left edges for related form controls;
- field label/input rhythm remains consistent;
- button heights align with adjacent inputs;
- table header and row alignment remains stable;
- cards in one metric row use equal heights;
- no arbitrary off-grid action placement;
- action clusters align to a predictable edge.

Mobile rules:

- full-width primary controls where appropriate;
- no horizontal body overflow;
- avoid nested horizontal scrollers except intentional compact stat rows;
- preserve at least 16 px safe page padding on typical mobile widths.

---

# 30. Performance Perception UX

Even before detailed performance budgets are defined in the TDD, perceived responsiveness is a UX requirement.

Expected behavior:

- navigation feels immediate;
- text entry never blocks on cloud writes;
- OCR processing does not freeze the entire UI;
- large ticket lists use appropriate pagination/virtualization strategy when needed;
- map loading is isolated from other page content;
- Save button prevents accidental duplicate writes while a save is in flight.

---

# 31. Offline / Weak Connection UX

Full offline-first behavior is not required for MVP, but the application must fail gracefully.

When connectivity is unavailable:

- existing editable state must remain on screen;
- Save failure must be explicit;
- user input must not be cleared;
- network status may be shown unobtrusively;
- Retry must be possible.

The exact caching/offline persistence strategy belongs to the Technical Architecture PRD.

---

# 32. Page-Specific Acceptance Criteria

## Dashboard

- Operator can identify the number of Running Tickets without opening another page.
- Recent/running ticket information is readable without excessive scrolling on desktop.
- New Ticket is available as a clear primary action.
- Mobile layout has no mandatory horizontal page scroll.

## Template Generator

- User can identify required operational sections quickly.
- Desktop user can edit the form while simultaneously seeing report preview.
- User can add Progress without opening a separate multi-step workflow.
- Empty Impact List does not render in Preview.
- Unsaved state is visible.
- Save success/failure is visible.
- Report can be copied in one clear action.

## OCR / Coordinate

- Drag/drop and file selection are both supported on desktop.
- Mobile can select a photo using browser-supported input.
- Processing state is visible.
- Ambiguous extraction is visibly presented as requiring review.
- Latitude and Longitude remain manually editable.
- Invalid coordinates never display as map-ready.

## Running Ticket

- Desktop supports dense scan-friendly representation.
- Search can be reached immediately.
- Add Progress is a fast row/card action.
- Mobile uses cards rather than a compressed desktop table.
- Resolving a ticket removes it from the default Running view after persistence succeeds.

## Cut Point Tracker

- Valid cut points appear as markers.
- Selecting a marker reveals enough information to identify the Ticket.
- Ticket can be opened from marker/list context.
- A non-map companion representation exists so information is not accessible only through pointer-based map interaction.

---

# 33. UX Definition of Done for MVP

The UI/UX implementation is considered MVP-ready when an operator can complete this workflow efficiently on both desktop and mobile:

1. Open the application.
2. See current Running Ticket context.
3. Start a New Ticket.
4. Enter Title and time information.
5. Add optional Impact List entries.
6. Enter/update PIC, Rootcause, and Cut Point as information becomes available.
7. Add multiple progress updates without leaving the primary ticket workspace.
8. Save without uncertainty about persistence state.
9. See a live report preview.
10. Copy the report.
11. Reopen the same Ticket from Running Ticket.
12. Add another Progress update quickly.
13. Drop/select a geotagged Cut Point photo.
14. See OCR processing state.
15. Review/correct extracted coordinates.
16. Save valid Latitude and Longitude.
17. Find the ticket on Cut Point Tracker.
18. Open the ticket from map/list context.
19. Resolve the ticket deliberately.
20. Confirm it no longer appears in the default Running Ticket view.

The implementation must accomplish this without separate duplicated ticket-edit interfaces, excessive modal chains, hidden critical actions, or desktop-only interaction assumptions.

---

# 34. Explicit UI/UX Non-Goals for MVP

The following are intentionally excluded unless later product revisions add them:

- complex customizable dashboard widgets;
- drag-and-drop dashboard builder;
- multi-workspace layouts;
- advanced GIS drawing tools;
- network topology editor;
- realtime collaborative cursors;
- rich-text report editor;
- WYSIWYG document formatting;
- AI chat assistant embedded in every screen;
- animation-heavy transitions;
- fully customizable theme builder;
- end-user layout personalization.

---

# 35. Handoff to Technical Architecture PRD / TDD

The next Technical Architecture document must decide how to implement this UX with the approved platform constraints.

It must define at minimum:

- React/Vite application structure;
- routing;
- component architecture;
- state management;
- form state and validation;
- Firebase integration boundary;
- Firestore read/write strategy;
- local dirty-state handling;
- OCR library/worker strategy;
- coordinate parser modules;
- map provider/library;
- theme-token implementation;
- responsive implementation;
- testing strategy;
- accessibility testing;
- performance boundaries;
- CI/CD direction.

If implementation constraints require a UX change, the change should be reviewed against this document rather than silently diverging.

---

# 36. Final UX Definition

NOC Report Template Generator must present a compact, modern, high-fidelity operational workspace where structured incident data can be entered and continuously updated quickly, while the formatted NOC report remains immediately visible and copy-ready.

Desktop should emphasize simultaneous information density and fast keyboard/mouse operation. Mobile should emphasize one-handed operational updates, clear hierarchy, and contextual bottom-sheet/sticky-action patterns rather than attempting to reproduce desktop tables and split panes at reduced scale.

The interface must make Ticket status, save state, Progress Timeline, Cut Point coordinate confidence, and next available action obvious at all times while avoiding unnecessary visual noise.