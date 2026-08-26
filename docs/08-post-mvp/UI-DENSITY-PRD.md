# NOC Report — Mega UI Overhaul & Dense Operations System PRD

**Document ID:** NOCREPORT-POSTMVP-UI-MEGA-001  
**Status:** ACTIVE SOURCE OF TRUTH — IMPLEMENTATION PENDING  
**Branch:** `feature/ui-density-system`  
**Parent:** `feature/ticket-detail-separation`  
**Product direction:** dense, premium, modern operations console  
**Scope:** total presentation-system, interaction-system, layout, navigation, and UX-flow modernization while preserving the product's functional purpose.

---

## 1. Executive intent

NOC Report must stop feeling like a collection of polished web pages and start feeling like a **cohesive professional operations application**.

The current UI has already improved significantly in branding, custom visual language, Ticket safety, Smart Parsing, and baseline spatial consistency. However, the application still carries structural traits from a conventional SaaS/admin web UI:

- too much vertical whitespace;
- large cards and oversized radii;
- repeated explanatory copy;
- page heroes where compact toolbars are more appropriate;
- too many nested surfaces;
- manually maintained UI primitives that can now be replaced by mature headless libraries;
- inconsistent composition patterns between pages;
- limited use of persistent workspace layouts;
- operational datasets presented as styled cards instead of true data workspaces;
- custom interaction logic that should be delegated to stable accessibility primitives;
- minimal keyboard-first productivity tooling;
- no application-wide command surface;
- limited user control over workspace geometry.

This PRD therefore supersedes the narrower “density-only” interpretation of this document.

The new target is a **Mega UI Overhaul** built around a **Dense Operations System**.

The redesign must be visually premium, extremely modern, highly intentional, information-dense, keyboard-friendly, mobile-safe, and comfortable for long NOC sessions.

It is explicitly permitted to refactor or alter presentation-related application logic when necessary to improve UI or UX flow, provided the functional purpose and business outcome do not change.

---

## 2. Product experience statement

> NOC Report should feel closer to a modern IDE, operations console, incident-management workstation, or premium desktop productivity tool than a conventional SaaS dashboard.

The interface must prioritize:

1. **operational density** — more useful information per viewport;
2. **scan speed** — hierarchy must be understood within seconds;
3. **low travel** — reduce scrolling, pointer movement, and unnecessary navigation;
4. **explicit mutation boundaries** — review remains safe and editing remains deliberate;
5. **workspace continuity** — users should feel they are working inside one application, not visiting disconnected pages;
6. **keyboard efficiency** — common actions should be discoverable and reachable without a mouse;
7. **high-quality motion** — motion should clarify state and hierarchy, not decorate;
8. **visual restraint** — premium means controlled, not flashy;
9. **accessible custom interaction** — native/browser-default feel should be eliminated without reducing accessibility;
10. **component ownership** — each UI concern must have one clear implementation layer.

---

## 3. Functional invariants

The overhaul may change presentation logic and UX orchestration, but must preserve the product's functional meaning.

### 3.1 Functions that must remain semantically unchanged

- Firebase Authentication and account access remain the authentication source.
- Admin / Operator / Viewer authorization remains capability-driven.
- Ticket lifecycle semantics remain Draft / Running / Resolved / Archived as currently defined.
- Firestore remains the canonical persisted Ticket dataset.
- optimistic revision protection must continue preventing stale mutations;
- Progress Timeline persistence remains revision-aware;
- Cut Point coordinates remain canonical Ticket metadata;
- browser-local OCR privacy remains intact;
- Smart Parsing remains local/browser-side and does not require an AI API;
- canonical report formatting remains functionally equivalent unless a separate report-format change is explicitly approved;
- Ticket Detail remains safe read-only review by default;
- Template Generator remains the explicit mutation/editing workspace;
- Firebase Spark-compatible architecture remains the baseline unless separately approved.

### 3.2 UI/UX logic changes that are explicitly allowed

The implementation may refactor logic when the change exists solely to improve presentation or workflow ergonomics, including:

- route composition and redirect behavior;
- local view-state management;
- table view models;
- column visibility preferences;
- client-side sorting/filtering orchestration;
- localStorage-backed display preferences;
- panel-size persistence;
- command-palette action routing;
- keyboard shortcuts;
- UI-only selection state;
- compact/expanded row presentation state;
- responsive composition logic;
- optimistic visual feedback;
- local draft state organization;
- confirmation flow composition;
- toast/notification plumbing;
- form schema adapters;
- modal/popover/drawer orchestration;
- navigation grouping;
- view tabs and segmented display modes;
- skeleton/loading presentation state;
- context menus and row action menus.

### 3.3 Not allowed without a separate product decision

- changing what a Ticket means;
- changing role permissions merely to simplify UI;
- removing revision guards;
- weakening Firestore Security Rules;
- changing persistence from canonical Ticket data to duplicated page-specific datasets;
- uploading OCR photos to cloud storage;
- changing lifecycle transitions for visual convenience;
- changing incident/report semantics;
- introducing paid infrastructure solely for UI purposes.

---

## 4. Verified technology baseline

The overhaul must use the dependencies already present in the repository rather than introducing competing UI frameworks.

### 4.1 Core platform

- React `19.2.x`
- React DOM `19.2.x`
- React Router `7.18.x`
- Vite `8.2.x`
- Tailwind CSS `4.3.x`
- Firebase `12.18.x`

### 4.2 Form and validation platform

- React Hook Form
- Zod
- `@hookform/resolvers`

### 4.3 Headless interaction primitives

- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-tooltip`
- `@radix-ui/react-tabs`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-separator`
- `@radix-ui/react-switch`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-toggle-group`
- `@radix-ui/react-slot`

### 4.4 Design-system utilities

- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react`

### 4.5 Motion and feedback

- `motion`
- `sonner`

### 4.6 Productivity/workspace dependencies

- `cmdk`
- `@tanstack/react-table`
- `@tanstack/react-virtual`
- `react-resizable-panels`

### 4.7 Existing operational dependencies retained

- Leaflet
- PaddleOCR.js
- Tesseract.js

No Material UI, Ant Design, Chakra, Mantine, Bootstrap, or competing visual component framework should be introduced.

---

## 5. Dependency ownership contract

Every new dependency must have a real product responsibility. The final codebase must not maintain two competing implementations of the same concern without a documented reason.

### 5.1 Tailwind CSS

**Owns:** low-level layout, spacing, responsive breakpoints, typography utilities, token consumption, state styling, and component composition styling.

Tailwind is not the design system by itself. It consumes semantic tokens and CVA component contracts.

### 5.2 CVA + clsx + tailwind-merge

Create a canonical `cn(...)` utility using `clsx` + `tailwind-merge`.

CVA owns reusable visual variants for:

- Button;
- IconButton;
- Badge;
- StatusBadge;
- Input shell;
- toolbar actions;
- compact row actions;
- panel variants;
- navigation items;
- inline alerts.

Page code must stop duplicating giant string constants such as `primaryLinkClass`, `actionClass`, `secondaryActionClass`, and `openLinkClass` when the same semantic variant already exists.

### 5.3 Radix Dialog

Must replace bespoke dialog focus/portal behavior for:

- archive confirmation;
- restore confirmation;
- destructive progress removal;
- unsaved-change confirmation where an in-app dialog is appropriate;
- expanded Smart Import workflows if a modal form is used;
- future keyboard-accessible modal flows.

Existing test coverage for focus trap, Escape behavior, and focus restoration must be preserved or improved.

### 5.4 Radix Dropdown Menu

Owns:

- account/workspace menu;
- repeated table row action menus;
- compact “More” actions;
- table display options;
- export/copy action grouping where appropriate.

Repeated rows should not permanently display four full text buttons if a safe menu provides better density. Destructive actions must retain explicit labels and confirmation.

### 5.5 Radix Popover

Owns lightweight floating configuration surfaces such as advanced filters, column controls, compact view options, contextual utilities, and searchable selector shells when combined with cmdk.

### 5.6 Radix Tooltip

Owns explanatory labels for icon-only controls.

Rules:

- tooltips supplement accessible names; they never replace them;
- no tooltip for obvious text-labelled actions;
- delay must be restrained and consistent;
- tooltips must remain keyboard accessible.

### 5.7 Radix Tabs

Must be used where multiple related views currently consume unnecessary simultaneous vertical space.

Approved uses include:

- Archive Resolved / Archived switch;
- Ticket Detail information modes if tabbing improves scanability without hiding urgent context;
- Generator secondary utility areas where appropriate;
- future detail subviews.

Tabs must not hide essential incident status or required mutation controls.

### 5.8 Radix Scroll Area

Owns contained scrollable UI regions where application chrome benefits from a consistent custom surface:

- Report Preview;
- long timeline panes;
- mapped incident side list;
- command palette results;
- long dropdown/popover contents;
- virtualized list containers where compatible.

Document-level scrolling may keep the global scrollbar styling.

### 5.9 Radix Separator

Replace decorative divider markup where a semantic structural separator is appropriate.

### 5.10 Radix Checkbox

Must have a meaningful product use rather than being installed unused.

Primary use:

- TanStack Table column visibility chooser;
- optional multi-select display/filter controls where applicable.

### 5.11 Radix Switch

Use for a genuine UI-only binary view preference, not for business state.

Approved examples:

- wrap long Ticket titles on/off;
- show/hide secondary row metadata;
- map/list UI-only preference;
- another non-business display option.

The preference may persist to localStorage.

### 5.12 Radix Toggle Group

Use for compact mutually related view filters such as Cut Point status scope: All / Running / Resolved.

### 5.13 Radix Slot

Use in polymorphic shared primitives so links and buttons share the same semantic design variants without duplicating styles.

### 5.14 Lucide React

Lucide becomes the canonical product icon language.

The current hand-maintained `UiIcon` path catalog must be deprecated and removed after migration.

Rules:

- icons normally use 14–18px artwork in dense desktop UI;
- icon hit targets remain accessible;
- use consistent stroke width;
- avoid decorative icons where text/state is enough;
- do not mix Lucide with Unicode symbol controls.

### 5.15 Motion

Motion becomes the canonical animation layer.

Approved motion:

- dialog/popover enter/exit;
- command palette;
- sidebar state transitions;
- tab/segmented indicator transitions;
- collapsible utility sections;
- row insertion/removal feedback;
- subtle layout transitions;
- selected map/list item feedback.

Motion must not make data rows bob or float during ordinary pointer scanning.

Default durations should generally remain within 120–220ms. `prefers-reduced-motion` must disable nonessential motion.

### 5.16 Sonner

Sonner replaces the custom toast infrastructure.

Toast rules:

- maximum visual noise must be low;
- success messages disappear automatically;
- error messages remain readable long enough;
- destructive mutation confirmation is never replaced by a toast;
- repeated background messages should be deduplicated;
- Firebase/network errors use consistent language.

### 5.17 cmdk

Introduce an application-wide **Command Palette**.

Primary shortcut:

- `Ctrl+K` / `Cmd+K`.

Initial command set:

- New Ticket;
- Dashboard;
- Running Tickets;
- Cut Point Tracker;
- Archive & Restore when authorized;
- toggle theme;
- search/open known Ticket where feasible without introducing unbounded Firestore reads;
- focus current-page search;
- copy current report when context supports it;
- Edit Ticket from Ticket Detail when authorized.

Command availability must follow RBAC. The palette must not expose actions a role cannot perform.

### 5.18 TanStack Table

TanStack Table becomes the default engine for operational desktop datasets.

Primary migration targets:

- Running Tickets;
- Archive & Restore;
- future high-density Ticket collection views.

Required capabilities:

- column definitions;
- controlled sorting;
- controlled filtering;
- column visibility;
- optional column sizing;
- keyboard-safe row interactions;
- status/TT/PIC/time cells;
- reusable action cell;
- responsive fallback rather than forcing desktop tables onto narrow phones.

TanStack owns table behavior, not visual styling.

### 5.19 TanStack Virtual

Use virtualization only where it provides real value.

Primary candidates:

- long Running Ticket collection;
- long mapped incident side list;
- long Archive pages if page size grows;
- long command/search result sets.

Do not virtualize tiny lists simply because the dependency exists. At least one meaningful long-list path must exercise the dependency during the overhaul.

### 5.20 react-resizable-panels

Use for desktop productivity workspaces.

Primary targets:

1. Template Generator — Editor pane / Live Report Preview pane.
2. Cut Point Tracker — incident list/filter pane / map pane.
3. Ticket Detail — optional operational detail/timeline / report preview split if usability benefits.

Rules:

- sensible minimum pane sizes;
- panel size may persist locally;
- mobile must not expose desktop resize affordances;
- resizing cannot change data semantics.

### 5.21 React Hook Form + Zod + resolvers

Form validation architecture must converge on a single schema-driven contract.

Template Generator should use Zod-backed React Hook Form validation so:

- field validation and persistence validation do not drift;
- parser import results can be normalized through the same schema;
- error messages stay consistent;
- UI can focus the first invalid control;
- validation logic becomes easier to test.

Migration must preserve current accepted Ticket inputs unless a current behavior is demonstrably broken.

---

## 6. Deprecated UI infrastructure after migration

The overhaul should deliberately remove superseded custom layers.

Target deprecations:

- custom `UiIcon` SVG path registry → Lucide;
- bespoke toast provider/render layer → Sonner;
- bespoke modal focus/portal logic → Radix Dialog;
- manual duplicated link/button class strings → CVA shared primitives + Radix Slot;
- manual desktop operational table composition → TanStack Table;
- page-specific custom overflow panes → Radix Scroll Area where appropriate;
- ad hoc segmented buttons → Tabs/Toggle Group where semantics fit;
- unnecessary page-specific `!important` density patches → semantic density tokens and component variants.

Do not remove existing code before the replacement is covered by tests.

---

## 7. Visual direction

### 7.1 Design character

Keywords:

- dense;
- premium;
- calm;
- technical;
- youthful;
- precise;
- spatial only where spatial depth helps;
- modern desktop productivity;
- not corporate-template;
- not gaming dashboard;
- not glassmorphism showcase.

### 7.2 Premium does not mean oversized

Premium quality should come from typography rhythm, consistent icons, strong information hierarchy, subtle border/surface changes, excellent motion timing, crisp focus states, compact controls, aligned baselines, balanced color, and predictable interaction.

It must not come from huge headings, giant rounded cards, excessive gradients, constant glowing panels, decorative blur everywhere, excessive shadows, or animation on every hover.

---

## 8. Density system

### 8.1 Reference desktop viewport

Primary reference: **1280 × 900**.

Targets:

- desktop sidebar: **232–248px**;
- topbar: **48–52px**;
- page content begins within **10–16px** below topbar;
- page header normally **44–64px**;
- routine panel padding **10–14px**;
- normal sibling gap **8–12px**;
- default desktop control **38px**;
- compact action **32–36px**;
- one-line data row **44–52px**;
- two-line incident row **54–62px**;
- status chip **22–26px**;
- hero panels prohibited on authenticated operational pages.

### 8.2 Mobile reference

Reference widths: 360px, 390px, and 412px.

Rules:

- touch hit area generally **42–44px** minimum;
- passive badges can be smaller;
- page padding **10–12px**;
- page gaps **8–10px**;
- mobile cards must flatten metadata rather than stack nested tiles;
- horizontal scrolling may be used only for data that genuinely benefits from it;
- mobile bottom-navigation safe area remains respected.

### 8.3 Spacing tokens

Target operational spacing:

- `--space-1: 4px`
- `--space-2: 6px`
- `--space-3: 8px`
- `--space-4: 10px`
- `--space-5: 12px`
- `--space-6: 16px`
- `--space-7: 20px`
- `--space-8: 24px`

Routine surfaces should strongly prefer 6 / 8 / 10 / 12 / 16px.

### 8.4 Control tokens

Target:

- `--control-height-xs: 32px`
- `--control-height-sm: 36px`
- `--control-height: 38px`
- `--control-height-touch: 44px`

### 8.5 Radius tokens

Target operational scale:

- 6px compact;
- 8px control;
- 10px panel;
- 12–14px major workspace;
- 16–20px dialog/showcase;
- pill only for badge/chip semantics.

The current 22–28px default-radius behavior must disappear from routine authenticated surfaces.

### 8.6 Shadow rules

- data rows: no elevation;
- table/list container: border or subtle shadow only;
- toolbar: no more than shadow-xs;
- floating overlays/dialogs: stronger elevation allowed;
- map controls/floating mobile navigation: elevation allowed;
- no routine hover `translateY` on dense datasets.

---

## 9. Surface discipline — anti-card rules

A visible box requires a functional reason.

### A surface is justified when it:

- owns a form group;
- owns independent scroll behavior;
- is an overlay;
- is a selectable entity;
- communicates warning/error/confirmation state;
- creates a persistent workspace boundary.

### Prohibited patterns

- card inside card inside card;
- every definition item as an individual rounded tile;
- hero card followed by filter card followed by list card;
- one-line informational message placed inside a large panel;
- decorative panels that carry no data/action/state;
- permanent explanatory banners for workflows users repeat daily.

### Preferred alternatives

- separators;
- flat rows;
- compact definition grids;
- toolbars;
- tables;
- inline metadata;
- subtle section backgrounds;
- contextual tooltip/help;
- command palette discovery.

---

## 10. Typography

### Operational scale

- page title: 22–26px desktop, 20–22px mobile;
- section title: 14–16px;
- body: 13–14px;
- table/list: 12–13px;
- labels: 11–12px;
- helper/error: 11–12px;
- TT identifiers: 10.5–12px mono;
- kicker: 10px and rare.

### Copy budget

Authenticated page header:

- zero descriptive lines by default;
- maximum one short sentence only when it communicates operational state or permission context.

Remove multi-line marketing-style explanations from routine pages.

---

## 11. Application shell mega overhaul

### Desktop navigation

Transform the current sidebar into a compact application rail/sidebar hybrid.

Requirements:

- target width 232–248px;
- compact brand lockup;
- navigation rows 38–42px;
- Lucide navigation icons;
- active state uses surface/border/accent, not oversized icon tiles;
- optional collapse behavior may be introduced if it materially improves workspace width;
- account details move into a Radix Dropdown Menu;
- Sign Out moves into account menu rather than permanent large button;
- role/environment shown compactly;
- tooltip appears for icon-only mode if collapsible sidebar is implemented.

### Topbar

Requirements:

- 48–52px target height;
- no oversized floating card treatment;
- page title + compact contextual actions;
- command palette trigger visible/discoverable on desktop;
- theme action compact;
- optional context actions can be injected by current route/page rather than duplicated inside page content.

### Command palette

Global `Ctrl/Cmd + K` command palette becomes a first-class shell feature and must be available on all authenticated routes.

### Main content

- 16–24px desktop side padding;
- 10–16px top padding;
- max-width rules should allow operational tables/maps to use available screen width;
- overly restrictive content-max widths should not limit data-heavy views.

---

## 12. Shared primitive overhaul

Create a coherent component layer such as:

- `Button`
- `IconButton`
- `Badge`
- `StatusBadge`
- `TextInput`
- `Textarea`
- `FieldLabel`
- `FieldMessage`
- `Combobox`
- `DropdownMenu`
- `Tooltip`
- `Tabs`
- `ToggleGroup`
- `Checkbox`
- `Switch`
- `Dialog`
- `ScrollArea`
- `Toolbar`
- `PageHeader`
- `DataTable`
- `EmptyState`
- `ErrorState`
- `Skeleton`
- `InlineAlert`

Requirements:

- CVA variants;
- `cn()` helper;
- Radix Slot polymorphism where appropriate;
- Lucide icons;
- dense and touch-safe sizes;
- accessible focus states;
- no duplicated page-level class constants for common component semantics.

---

## 13. Page-header standard

All authenticated pages use one compact PageHeader system.

Default structure:

- left: title + optional state badge/meta;
- right: primary action + compact utilities;
- optional second row only for filters/search that cannot fit elsewhere.

No surrounding hero card by default.

Hero treatment is allowed only for Login, onboarding, and rare zero-state/recovery experiences.

---

## 14. Dashboard total rebuild

Dashboard should become a compact operational start surface.

### Required layout

1. compact PageHeader;
2. KPI metric strip;
3. recent activity dataset;
4. optional contextual shortcuts only if they reduce navigation cost.

### KPI rules

- flatter visual language;
- no large marker tile in every KPI;
- compact number + label + subtle state mark;
- entire metric strip should fit in ~76–96px desktop height.

### Recent Tickets

Prefer a dense row/table-like presentation with TT number, title, status, updated time, and optional PIC.

Click always opens Ticket Detail read-only.

### Acceptance

At 1280×900, header, all KPI values, and multiple recent incidents must appear comfortably above the fold.

---

## 15. Running Tickets total rebuild

Running Tickets becomes a real operational queue rather than a card gallery.

### Desktop

Use TanStack Table.

Suggested columns:

- Status;
- TT;
- Title;
- PIC;
- Occur;
- Latest Progress;
- Cut Point / coordinate indicator;
- Updated;
- Actions.

### Table behavior

- sticky header;
- compact 44–56px rows depending content;
- sorting via TanStack;
- search;
- coordinate filter;
- column visibility menu using Radix Checkbox;
- row action dropdown using Radix Dropdown Menu;
- title/row opens read-only Ticket Detail;
- explicit Add Progress/Edit action opens editor;
- Copy Report stays accessible;
- Resolve remains explicit/destructive-safe;
- optional UI-only wrap-title Switch in view options;
- virtualization via TanStack Virtual when collection length warrants it.

### Mobile

Do not render a desktop table squeezed into 360px.

Use compact flattened incident rows/cards:

- no nested four-tile metadata grid;
- TT + status + updated time first line;
- title maximum two lines;
- PIC/latest progress compact metadata;
- primary review target is the row itself;
- mutation actions live in a contextual action menu or compact action strip.

### Acceptance

At 1280×900, target at least **6 useful incident rows** visible in initial viewport when data exists.

---

## 16. Ticket Detail total rebuild

Ticket Detail is a **read-only inspection workspace**. Safety remains its primary UX principle.

### Header

Compact single header containing:

- TT;
- status;
- title;
- read-only indicator;
- revision as secondary metadata;
- Edit Ticket CTA if authorized;
- Copy Report utility.

Remove the separate large “Safe review mode” card. Use a compact lock/read-only status treatment and optional tooltip/help instead.

### Operational context

Replace six nested Detail cards with a flat definition grid for Occur, Dispatch, PIC, Rootcause, Cut Point, and Coordinate.

Use dividers/grid alignment instead of child cards.

### Timeline

Use a compact dense timeline with minimal decoration. Entries should not each be oversized rounded cards unless selection requires it.

### Report Preview

May use a resizable desktop split if it improves inspection.

### Mutation boundary

No editable form control may appear on `/tickets/:ticketId`.

---

## 17. Template Generator total rebuild

Generator becomes the flagship desktop productivity workspace.

### Core desktop composition

Use `react-resizable-panels`.

**Left / primary pane:** Ticket editor, Smart Import, Impact, timing, ownership/rootcause, coordinate/OCR, progress.

**Right / secondary pane:** Live Report Preview.

Panel sizes should persist locally.

### Command bar

Create a compact sticky editor toolbar containing context-sensitive controls such as Save, lifecycle status/action, Copy Report, edit/unsaved state, and optional More menu.

Avoid a large decorative command panel.

### Smart Import

Treat as a utility. It may expand inline or through a Radix Dialog/Popover when needed. Detection summary remains compact, Fill Generator remains explicit, and imported data never auto-saves.

### Forms

Move validation toward Zod resolver.

Requirements:

- dense 38px controls desktop;
- touch-safe controls mobile;
- labels 11–12px;
- helper text only when necessary;
- two-column semantic grouping where appropriate;
- no section description if field labels explain it;
- errors focusable and clear;
- first invalid field may be focused after failed Save.

### Progress

- composer compact;
- timeline dense;
- add/edit/remove actions use consistent icon/menu primitives;
- destructive removal uses Radix Dialog;
- deep-link progress focus behavior remains supported or is replaced by an equivalent explicit focus target.

### OCR

OCR remains local. The UI should feel like a utility drawer/tool rather than a large card competing with core incident data.

### Mobile

Resizable panels collapse to a single-column workflow. Report Preview may become a tab, drawer, or explicit expandable section if that reduces scrolling without hiding critical editor state.

---

## 18. Cut Point Tracker total rebuild

Cut Point Tracker becomes a map-first operational workspace.

### Desktop

Use resizable panels:

- left incident pane ~280–360px initial width;
- right map fills remaining area.

### Header

Compact toolbar only: title, marker count, Refresh, and optional filters. Remove hero copy/glow.

### Filter system

- search field;
- Radix Toggle Group for All / Running / Resolved;
- optional filter popover for future secondary criteria.

### Incident list

- flatten MarkerCard nested tiles;
- status + TT + title + cut point + concise metadata;
- use Radix Scroll Area;
- use TanStack Virtual if list length warrants it;
- selected row visually corresponds to selected map marker.

### Open Ticket behavior

Review action must open `/tickets/:ticketId`, not the editor. Explicit Edit can be exposed separately when authorized.

### Map

Map should begin almost immediately below topbar and retain at least ~70vh useful height at reference desktop viewport.

Leaflet visual customizations remain consistent with the app.

---

## 19. Archive & Restore total rebuild

Archive becomes a compact lifecycle data workspace.

### Header

Compact title + Admin context where useful. No explanatory hero paragraph.

### View switch

Use Radix Tabs for Resolved / Archived.

### Desktop data

Use TanStack Table.

Suggested columns:

- status;
- TT;
- title;
- updated;
- revision;
- actions.

Row height target 44–52px where possible.

### Actions

- Review opens Ticket Detail;
- Archive/Restore remains explicit;
- confirmation uses Radix Dialog;
- secondary actions may live in Dropdown Menu;
- destructive action must not become an unlabeled icon-only action.

### Pagination

Current bounded-read behavior remains. “Load more” can remain, or UX may become a compact paginated/infinite view if Firestore query semantics and bounded reads remain safe.

### Acceptance

At 1280×900 target approximately **7 visible history rows** when data exists.

---

## 20. Login total rebuild

Login remains the one page allowed to breathe more.

Requirements:

- Lucide where icons are used;
- shared Button/Input variants;
- Motion for restrained entrance transitions;
- no excessive animation;
- strong product logo presence;
- responsive layout must avoid giant empty regions on laptop screens;
- error states use shared InlineAlert/feedback system;
- local preview action remains clear when Firebase is unavailable.

Login does not need to meet the same density ceiling as authenticated operational pages.

---

## 21. Mobile application rules

Mobile is not “desktop but stacked”.

### Navigation

- bottom navigation remains available;
- height may be reduced visually while preserving hit area;
- icons use Lucide;
- selected state should be simple and stable;
- safe-area handling remains mandatory.

### Data pages

- prioritize primary incident identity/status;
- collapse secondary metadata;
- use contextual menus for repeated actions;
- maintain 42–44px hit targets;
- avoid card-within-card layouts;
- avoid hiding critical status behind horizontal swipes.

### Generator

- single-column editing;
- preview becomes secondary view/drawer/tab if needed;
- sticky Save/status action area may be used if it materially reduces travel;
- keyboard and browser viewport behavior must remain usable.

### Cut Point

Map/list mobile composition may retain bottom-sheet behavior but should use the new compact density and interaction primitives.

---

## 22. Interaction and motion rules

Motion communicates opening/closing, selection, layout-mode change, successful insertion/removal, and context transition. Motion does not communicate “premium” by making every hover move.

Recommended timings:

- fast state: 120–150ms;
- standard transition: 160–200ms;
- dialog/layout: up to 220–260ms if needed.

Every nonessential Motion animation must respect reduced-motion preference.

Dense data rows use background/border changes rather than routine translateY.

---

## 23. Command and keyboard productivity

### Global shortcuts

Initial target:

- `Ctrl/Cmd + K` — Command Palette;
- `/` or platform-appropriate shortcut may focus page search when safe and not inside an input;
- Escape closes open overlays/dialogs according to Radix behavior.

### Command palette RBAC

Commands must be capability-filtered.

Viewer must never see New Ticket, Edit Ticket, Archive/Restore mutation commands, or other unauthorized actions.

### Focus

- visible focus ring always preserved;
- route navigation should place focus sensibly;
- dialog closes return focus to trigger;
- table row actions reachable by keyboard;
- resizable separators keyboard-accessible according to library support.

---

## 24. Loading, empty, error, and feedback states

### Skeletons

- match final dense geometry;
- no giant placeholder panels after actual UI is compacted;
- table skeletons use row geometry.

### Empty states

Routine empty states should be compact. Large illustration-style empty states are not appropriate for operational tables unless it is a true first-run experience.

### Errors

- inline error when scoped to a field/panel;
- page-level ErrorState only for page-level failure;
- retry stays close to failed content;
- Firebase error language remains specific where useful.

### Toasts

Use Sonner. No duplicate custom toast layer remains after migration.

---

## 25. Accessibility contract

The visual overhaul is not allowed to trade away accessibility.

Must preserve or improve:

- WCAG AA text contrast;
- keyboard navigation;
- focus visibility;
- dialog focus containment/restoration;
- accessible names for icon controls;
- status information not conveyed by color alone;
- reduced motion;
- 42–44px mobile interaction targets where practical;
- semantic table headers;
- accessible menu/tab/checkbox/switch semantics through Radix;
- no serious/critical axe violations on primary routes.

Playwright + axe remains a release gate.

---

## 26. Performance contract

Premium UI must not degrade operational responsiveness.

Rules:

- avoid importing large motion/icon bundles unnecessarily;
- Lucide imports should remain tree-shakable;
- route-level lazy loading remains encouraged;
- virtualize genuinely long lists;
- do not animate expensive map/layout properties unnecessarily;
- avoid layout thrashing during resizable panels;
- preserve bounded Firestore reads;
- command search must not introduce unbounded queries;
- keep production bundle review in QA.

---

## 27. Responsive acceptance matrix

Mandatory viewport checks:

- 360×800;
- 390×844;
- 412×915;
- 768×900;
- 1024×900;
- 1280×900;
- optional 1536+ visual review for wide-screen workspace behavior.

No primary route may horizontally overflow unintentionally.

---

## 28. Implementation architecture

The overhaul should be delivered bottom-up.

### Foundation first

1. tokens;
2. `cn()` utility;
3. CVA primitives;
4. Lucide icon system;
5. Radix wrappers;
6. Sonner provider;
7. Motion utilities;
8. page shell.

### Data/workspace second

9. shared DataTable architecture;
10. virtualized list utility;
11. resizable workspace utility;
12. command palette;
13. page rebuilds.

### Do not

- rewrite every page before shared primitives exist;
- leave half the app on old components indefinitely;
- introduce page-specific fixes that bypass the new system unless documented as temporary migration code.

---

## 29. Implementation phases

### MEGA-0 — Dependency activation and design-system foundation

- [ ] create canonical `cn()` helper using clsx + tailwind-merge;
- [ ] create CVA variant architecture;
- [ ] create new density tokens;
- [ ] normalize typography/radius/shadow/control tokens;
- [ ] introduce Lucide as canonical icon layer;
- [ ] define Motion timing/easing/reduced-motion helpers;
- [ ] establish component folder/module boundaries;
- [ ] document temporary legacy component compatibility.

### MEGA-1 — Headless primitive migration

- [ ] Radix Dialog wrapper;
- [ ] Dropdown Menu wrapper;
- [ ] Popover wrapper;
- [ ] Tooltip wrapper;
- [ ] Tabs wrapper;
- [ ] Scroll Area wrapper;
- [ ] Separator wrapper;
- [ ] Checkbox wrapper;
- [ ] Switch wrapper;
- [ ] Toggle Group wrapper;
- [ ] Slot-powered polymorphic Button/Link behavior;
- [ ] migrate focus/keyboard tests;
- [ ] remove superseded bespoke overlay logic after parity.

### MEGA-2 — Feedback, command, and application shell

- [ ] replace custom toast system with Sonner;
- [ ] implement global cmdk Command Palette;
- [ ] capability-filter commands;
- [ ] compact desktop sidebar;
- [ ] account dropdown menu;
- [ ] compact topbar;
- [ ] command trigger;
- [ ] Lucide nav/theme icons;
- [ ] compact mobile navigation;
- [ ] route-aware PageHeader architecture.

### MEGA-3 — Data workspace foundation

- [ ] shared TanStack DataTable;
- [ ] sorting/filter/visibility state helpers;
- [ ] Radix Checkbox column visibility menu;
- [ ] row action dropdown pattern;
- [ ] dense desktop row variants;
- [ ] compact mobile list fallback;
- [ ] TanStack Virtual integration for a meaningful long-list path;
- [ ] table/list skeletons and empty states.

### MEGA-4 — Dashboard + Running Tickets

- [ ] rebuild Dashboard to compact metric/activity workspace;
- [ ] remove residual card-heavy KPI treatment;
- [ ] migrate Running desktop to TanStack Table;
- [ ] flatten Running mobile rows;
- [ ] view preferences using Switch where useful;
- [ ] preserve review-vs-edit navigation boundaries;
- [ ] verify ≥6 useful Running rows at 1280×900.

### MEGA-5 — Ticket Detail + Template Generator

- [ ] flatten Ticket Detail hero/safe-mode/context cards;
- [ ] compact read-only timeline;
- [ ] preserve explicit Edit boundary;
- [ ] introduce resizable Detail/Preview if accepted by usability review;
- [ ] rebuild Generator command bar;
- [ ] introduce Editor/Preview resizable panels;
- [ ] persist panel ratio locally;
- [ ] migrate validation to Zod resolver without changing accepted semantics;
- [ ] compact Smart Import;
- [ ] compact OCR utility;
- [ ] migrate destructive dialogs to Radix;
- [ ] make Preview a Radix Scroll Area;
- [ ] mobile single-column/secondary-preview behavior.

### MEGA-6 — Cut Point Tracker

- [ ] remove hero panel;
- [ ] compact map toolbar;
- [ ] resizable list/map desktop workspace;
- [ ] Toggle Group status filter;
- [ ] Scroll Area incident list;
- [ ] virtualize list if useful;
- [ ] flatten marker rows;
- [ ] selected row/marker Motion feedback;
- [ ] Open Ticket routes to read-only detail;
- [ ] retain mobile map/list bottom-sheet ergonomics;
- [ ] map ≥70vh at reference desktop viewport.

### MEGA-7 — Archive & Restore

- [ ] remove hero panel;
- [ ] Radix Tabs Resolved/Archived;
- [ ] TanStack Table desktop history;
- [ ] compact mobile history rows;
- [ ] Review opens Ticket Detail;
- [ ] archive/restore confirmation uses Radix Dialog;
- [ ] row action menu where appropriate;
- [ ] verify ~7 useful rows at 1280×900.

### MEGA-8 — Login + edge states

- [ ] rebuild Login using shared primitives;
- [ ] restrained Motion entrance;
- [ ] shared alert/error styling;
- [ ] loading/auth-session branding cleanup;
- [ ] Not Found cleanup;
- [ ] empty/error/skeleton states normalized;
- [ ] remove remaining old icon/toast/component implementations.

### MEGA-9 — Legacy elimination audit

- [ ] search for `UiIcon` legacy usage;
- [ ] search for old custom toast APIs;
- [ ] search for bespoke overlay/focus-trap code;
- [ ] search for duplicated action class strings;
- [ ] search for obsolete `spatial-panel-elevated` hero usage;
- [ ] search for excessive 22–28px operational radii;
- [ ] search for routine hover translateY on rows;
- [ ] search for native visible select controls;
- [ ] search for nested metadata card patterns;
- [ ] remove obsolete Generator `!important` density overrides where tokens now cover them;
- [ ] verify all installed UI dependencies have an intentional implemented use.

### MEGA-10 — Full QA and release readiness

- [ ] Prettier formatting committed;
- [ ] ESLint green;
- [ ] unit/component tests green;
- [ ] Firebase Emulator repository tests green;
- [ ] Firestore Security Rules matrix green;
- [ ] generic production build green;
- [ ] Firebase-configured production build green;
- [ ] dev smoke green;
- [ ] viewport/touch matrix green;
- [ ] Playwright Admin lifecycle green;
- [ ] Operator/Viewer RBAC green;
- [ ] Ticket review/edit separation green;
- [ ] keyboard/focus tests green;
- [ ] command palette RBAC tests green;
- [ ] table interaction tests green;
- [ ] resizable workspace tests where practical;
- [ ] serious/critical axe checks green;
- [ ] Light/Dark manual acceptance;
- [ ] desktop/mobile manual density acceptance;
- [ ] no legacy native/default visual feel identified in final audit;
- [ ] PR remains unmerged until explicit user approval.

---

## 30. Required regression coverage additions

Add or adapt tests for:

- Button polymorphic/link behavior;
- Radix Dialog focus trap + Escape + focus return;
- Dropdown Menu keyboard operation;
- Tooltip accessible trigger labels;
- Tabs keyboard selection;
- Toggle Group filter behavior;
- Checkbox column visibility;
- Switch UI-only preference persistence;
- Sonner success/error notification invocation;
- Command Palette open/close and role-gated commands;
- Running DataTable sorting/filter/search;
- Running row review navigation;
- explicit mutation navigation;
- Archive tabs + lifecycle confirmation;
- Ticket Detail remains read-only;
- Generator Zod form validation;
- Smart Import still fills draft without auto-save;
- resizable panel composition does not lose editor data;
- Cut Point Open Ticket uses read-only route;
- Viewer cannot discover mutation commands through palette/menus.

---

## 31. Manual visual acceptance checklist

Review Light and Dark themes.

### Global

- [ ] UI feels like one application, not mixed library components;
- [ ] no component visibly looks like default Radix styling;
- [ ] no browser/native feel remains where product-owned UI is expected;
- [ ] Lucide icon language is consistent;
- [ ] density feels intentional rather than cramped;
- [ ] focus states are visible but not visually noisy;
- [ ] motion feels subtle and fast;
- [ ] repeated explanatory copy is removed;
- [ ] card nesting is dramatically reduced;
- [ ] rows/tables feel stable during hover.

### Shell

- [ ] sidebar is materially narrower;
- [ ] topbar is materially shorter;
- [ ] Command Palette is discoverable;
- [ ] account menu is compact;
- [ ] mobile navigation remains comfortable.

### Dashboard

- [ ] KPIs + activity are visible high in first viewport;
- [ ] no landing-page feel;
- [ ] recent incidents scan quickly.

### Running

- [ ] desktop feels like an operations queue;
- [ ] table columns are useful, not decorative;
- [ ] row actions are discoverable but compact;
- [ ] at least six useful rows fit reference viewport;
- [ ] mobile is flattened and touch-safe.

### Ticket Detail

- [ ] clearly read-only;
- [ ] core incident facts visible quickly;
- [ ] no six-card metadata grid;
- [ ] Edit Ticket remains explicit;
- [ ] report/timeline usable without excessive scrolling.

### Generator

- [ ] feels like a productivity editor;
- [ ] split preview is useful and resizable;
- [ ] command bar is compact;
- [ ] Smart Import is utility-weight, not hero-weight;
- [ ] form validation remains clear;
- [ ] OCR does not dominate layout;
- [ ] mobile remains usable.

### Cut Point

- [ ] map dominates appropriate screen area;
- [ ] left pane is dense and resizable;
- [ ] list/marker selection feels connected;
- [ ] filters are compact;
- [ ] ticket review is safe by default.

### Archive

- [ ] Resolved/Archived tabs feel immediate;
- [ ] history table is dense;
- [ ] destructive lifecycle actions remain unmistakable;
- [ ] seven-ish rows fit reference viewport when content allows.

### Login

- [ ] retains premium branding;
- [ ] motion is restrained;
- [ ] no excessive blank space on common laptops;
- [ ] mobile entry remains clean.

---

## 32. Completion definition

The Mega UI Overhaul is complete only when all of the following are true:

1. the new semantic density tokens are the real default, not a page-specific override layer;
2. all installed UI dependencies have a deliberate implemented product responsibility;
3. Lucide is the canonical icon system;
4. Sonner is the canonical toast system;
5. Radix owns overlay/menu/tab/toggle interaction primitives;
6. TanStack Table owns operational desktop datasets where appropriate;
7. TanStack Virtual is used meaningfully for at least one long dataset path;
8. resizable panels power the intended desktop workspaces;
9. cmdk provides a role-aware global command palette;
10. Zod + React Hook Form provide unified Generator validation;
11. routine authenticated hero panels are eliminated;
12. nested metadata-card patterns are eliminated or justified;
13. review/edit mutation boundaries remain safe;
14. Light/Dark and desktop/mobile all pass visual acceptance;
15. automated QA is fully green;
16. no critical native/default-feel residue remains in the final audit;
17. business function remains equivalent even where UX flow logic was refactored.

---

## 33. Final design doctrine

When deciding between two implementations, choose the one that:

- exposes more useful operational information;
- needs less travel;
- has fewer permanent visual containers;
- requires less bespoke interaction code;
- uses the established headless primitive correctly;
- remains keyboard/accessibility safe;
- makes mutation intentional;
- feels stable during long work sessions;
- looks custom despite using open-source primitives;
- and can be understood quickly by an operator under pressure.

**The objective is not merely a prettier NOC Report. The objective is a materially better operations workstation.**
