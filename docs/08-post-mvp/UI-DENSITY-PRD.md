# NOC Report — Dense Operations UI System PRD

**Document ID:** NOCREPORT-POSTMVP-UI-DENSITY-001  
**Status:** ACTIVE SPEC — IMPLEMENTATION PENDING  
**Branch:** `feature/ui-density-system`  
**Parent:** `feature/ticket-detail-separation`  
**Scope:** authenticated application UI only, with Login treated as a deliberate exception where noted.

## 1. Purpose

NOC Report is an operational tool used for repeated monitoring, review, reporting, and incident updates. The interface must optimize for **information density, fast scanning, low pointer travel, and low vertical travel** rather than marketing-style presentation.

The current spatial design language is visually coherent, but several global primitives and page compositions still spend too much viewport area on:

- oversized panel padding;
- large radii and shadows;
- repeated helper copy;
- hero-style page intros;
- nested cards;
- tall controls;
- large gaps between functional groups;
- decorative surfaces that do not increase operational clarity.

The new target direction is a **dense operations console**.

The goal is not to make the UI visually cramped. The goal is to make every pixel carry either information, navigation, action, state, or necessary breathing room.

---

## 2. Product principle

### 2.1 Density statement

> Operational pages should feel closer to a modern NOC console, IDE, or high-quality admin workstation than a SaaS landing page.

### 2.2 Primary outcomes

The redesign must:

1. show more useful incident data above the fold;
2. reduce scrolling during common workflows;
3. keep important controls within short pointer/touch travel;
4. remove repeated explanatory text once a workflow is understood;
5. reduce card nesting and visual fragmentation;
6. preserve accessibility, hierarchy, and comfortable long-session readability;
7. preserve all Firebase, Ticket, OCR, parser, report, lifecycle, and RBAC behavior.

### 2.3 Non-goal

Density does **not** mean:

- tiny unreadable text;
- 24px desktop touch targets;
- every field on one line regardless of meaning;
- removing status clarity;
- hiding required validation/error feedback;
- removing whitespace completely;
- turning the UI into an unstyled spreadsheet.

---

## 3. Audit summary — current density blockers

### A. Global design tokens — HIGH

Current global presentation still favors spacious spatial UI:

- `--control-height: 46px`;
- `--control-height-sm: 40px`;
- radii scale up to `28px`;
- `spatial-chip` minimum height is `32px`;
- `spatial-title` can reach `2.75rem`;
- `spatial-description` uses a generous `1.7` line-height;
- panel/elevated surfaces use large radii and elevation by default.

**Effect:** even already-compacted pages inherit tall controls and generous surface geometry.

### B. Application shell — HIGH

Current authenticated shell uses:

- desktop sidebar width `w-72` / 288px;
- navigation rows around 48px tall;
- 32px icon tiles inside navigation rows;
- sticky topbar minimum height 64px;
- top padding around the sticky topbar;
- main content top padding of 20–28px.

**Effect:** a meaningful amount of the viewport is consumed before page content begins.

### C. Dashboard — MEDIUM

Dashboard has already been compacted substantially, but still contains:

- 46px primary CTA;
- 4 separate KPI cards with internal icon tiles and hints;
- generous row/card radii;
- a separate section label above KPI cards;
- activity rows with more vertical padding than required for two-line incident content.

**Effect:** good direction, but not yet the reference density target.

### D. Running Tickets — CRITICAL

Running Tickets still contains a hero-style elevated page panel with:

- kicker;
- status badge;
- large page title;
- multi-line explanatory paragraph;
- large decorative glow;
- large padding and gap.

The filter toolbar is a separate full panel, while mobile cards contain multiple nested metadata tiles plus a separate action zone.

**Effect:** the first incident list starts too far below the top of the page, and each card consumes excessive height.

### E. Archive & Restore — CRITICAL

Archive still contains:

- full hero panel;
- descriptive copy explaining lifecycle behavior;
- a second large history panel header;
- repeated kicker/title/hint hierarchy;
- row action buttons using full-height shared controls.

**Effect:** lifecycle data begins too far below the viewport and historical rows are more spacious than necessary.

### F. Cut Point Tracker — CRITICAL

Cut Point Tracker still contains:

- elevated hero panel;
- long explanation;
- multiple count chips;
- separate refresh action;
- sidebar heading + filter card + count copy before marker data;
- marker cards with nested detail tiles for Cut Point, PIC, Coordinate, and progress.

**Effect:** the map/list workspace is visually polished but highly fragmented and vertically expensive.

### G. Template Generator — MEDIUM

Generator has already received a compact pass and is closer to target. Remaining density blockers include:

- globally tall controls inherited from the design system;
- several fields still living in separate surface cards;
- long textareas that could support size presets;
- report preview header/footer spacing;
- command bar actions still using full-size primary controls.

**Effect:** acceptable baseline, but it should be normalized once global dense tokens exist instead of relying heavily on page-specific CSS overrides.

### H. Ticket Detail — CRITICAL

The new safe review surface currently contains:

- a hero-like title panel;
- a separate Safe Review Mode information panel;
- Operational Context as a card containing six nested Detail cards;
- Progress Timeline as a second large card;
- each progress entry as its own rounded surface.

**Effect:** the read-only page is safe but visually too tall for its information volume.

### I. Login — LOW / EXCEPTION

Login intentionally acts as the product entry surface and can retain more visual breathing room than operational pages.

It should still avoid unnecessary vertical waste on smaller screens, but it is **not** required to meet the same maximum-density targets as authenticated workspaces.

---

## 4. Measurable density targets

### 4.1 Desktop reference viewport

Primary reference: **1280 × 900**.

At this viewport:

- authenticated shell topbar height target: **48–52px**;
- desktop sidebar width target: **232–248px**;
- page content should begin within **12–16px** below the topbar;
- page header + page actions should usually fit within **44–72px**;
- first primary dataset or editor control should begin within **120px of the page content top**;
- hero-style panels are prohibited on routine operational pages;
- operational content gaps should normally be **8–12px**, max **16px**;
- default operational panel padding should be **10–14px**, max **16px**;
- desktop control height should normally be **36–40px**;
- compact/icon-only controls may be **32–36px** where pointer usage is dominant;
- table/list rows should target **44–52px** when content fits on one line;
- two-line incident rows should target **56–64px**;
- status chips should target **22–26px** height.

### 4.2 Mobile reference viewports

Reference widths: **360, 390, 412px**.

Mobile density must remain touch-safe:

- primary touch controls: target **42–44px** minimum interactive height;
- icon-only primary controls: target **42–44px** hit area even when icon artwork is smaller;
- compact passive chips may be **24–28px**;
- section padding: **10–12px**;
- vertical section gaps: **8–12px**;
- mobile cards should prefer flattened rows over nested metadata tiles;
- long-running pages must preserve the existing bottom-navigation safe area.

### 4.3 Viewport outcome requirements

At 1280×900, manual acceptance should confirm:

- Dashboard: page header + all KPI metrics + multiple recent Ticket rows visible without excessive scrolling;
- Running Tickets: compact title/filter controls and at least **6 useful Ticket rows** visible in the first viewport when data exists;
- Archive: segmented view control and at least **7 history rows** visible in the first viewport when data exists;
- Ticket Detail: title/status/actions + core operational fields + beginning of timeline visible in first viewport, with Report Preview still accessible;
- Generator: command bar + Smart Import + first core editor sections + Report Preview header visible in first viewport;
- Cut Point Tracker: the map/list split begins almost immediately after the compact page toolbar, with the map retaining at least **70vh** of useful height.

These are UX targets, not data-contract requirements.

---

## 5. Density token system

Create explicit dense semantic tokens instead of accumulating page-specific `!important` overrides.

### 5.1 Spacing scale

Recommended operational scale:

- `--space-1: 4px`
- `--space-2: 6px`
- `--space-3: 8px`
- `--space-4: 10px`
- `--space-5: 12px`
- `--space-6: 16px`
- `--space-7: 20px`
- `--space-8: 24px`

Routine operational composition should strongly prefer 6 / 8 / 10 / 12 / 16px.

### 5.2 Control heights

Recommended tokens:

- `--control-height-xs: 32px`
- `--control-height-sm: 36px`
- `--control-height: 38px`
- `--control-height-touch: 44px`

Rules:

- desktop forms/actions default to 38px;
- table row inline actions may use 32–36px;
- mobile primary controls use 42–44px hit areas;
- destructive confirmation buttons remain at least 38px desktop / 44px mobile.

### 5.3 Radius system

The current radius scale contributes heavily to the spacious/card-heavy feel.

Recommended operational radius scale:

- small controls: **6px**;
- standard controls: **8px**;
- compact panels: **10px**;
- large workspace panels: **12–14px**;
- dialogs/login showcase surfaces may use **16–20px**;
- pill radius reserved for chips/badges only.

Routine authenticated pages should not use 22–28px radii for every surface.

### 5.4 Shadow system

Operational density should rely more on boundaries and less on elevation.

Rules:

- data tables/lists: border + background only;
- filter/toolbars: `shadow-xs` at most;
- primary work panels: `shadow-xs` or subtle `shadow-sm` only when separation from canvas is required;
- `shadow-md/lg` reserved for overlays, floating mobile navigation, dialogs, and deliberate floating utilities;
- hover should not lift every data row/card vertically.

### 5.5 Chips / badges

Target:

- height: 22–26px desktop;
- 24–28px mobile;
- horizontal padding: 7–9px;
- font: 10–11px;
- status badges must remain recognizable by text + color/state styling.

---

## 6. Typography rules

### 6.1 Operational page typography

- page title: **22–26px desktop**, 20–22px mobile;
- section title: **14–16px**;
- body: **13–14px**;
- table/list text: **12–13px**;
- field labels: **11–12px**, semibold/bold;
- helper/error text: **11–12px**;
- TT / operational identifiers: **10.5–12px mono**;
- uppercase kicker: **10px** and used sparingly.

### 6.2 Copy rules

Operational pages must not contain marketing copy.

Allowed page-header copy:

- zero lines by default;
- maximum **one short line** if it communicates live state, permission, or workflow context.

Disallowed on routine pages:

- multi-line introductory descriptions;
- sentences explaining obvious UI structure;
- repeated statements already conveyed by badge, title, button, or role gate.

Documentation belongs in docs/tooltips/help, not permanent high-cost viewport copy.

---

## 7. Surface discipline — the anti-card rule

### 7.1 Default

A visual box must have a functional reason.

A box is justified when it:

- groups a form section;
- provides scroll containment;
- separates a floating utility;
- represents a selectable list entity;
- isolates a warning/error/confirmation state;
- owns independent interaction behavior.

### 7.2 Prohibited patterns

- card inside card inside card;
- each `<dt>/<dd>` pair rendered as its own rounded tile;
- separate card for one-line status explanation;
- hero card + filter card + list card where a toolbar + list would work;
- decorative glow on routine list/detail pages;
- a heading card that contains no actual operational data.

### 7.3 Preferred alternatives

Prefer:

- dividers;
- inline metadata columns;
- definition grids without child card backgrounds;
- compact toolbars;
- row hover states;
- subtle alternating surfaces only where scanability improves.

---

## 8. Authenticated shell rules

### Desktop sidebar

Target width: **232–248px**.

Rules:

- brand lockup height ≤ 52px;
- navigation row height 38–42px;
- nav icon container 26–30px;
- nav gap 4px;
- workspace section label may remain but should occupy ≤ 24px vertical height;
- profile/workspace card should be compressed into 52–72px;
- Sign Out should not permanently occupy a full 46px row when a compact account menu or smaller action is sufficient.

### Topbar

Target height: **48–52px**.

Rules:

- no outer top margin on desktop unless needed for safe visual separation;
- radius 10–14px, not oversized pill-like framing;
- title 17–19px;
- status chip compact;
- theme control 34–38px desktop;
- mobile branding remains visible but compact.

### Main content

- desktop horizontal padding: 16–24px depending viewport;
- main top padding: 10–16px;
- page sibling gap default: 10–12px.

---

## 9. Page-header standard

Every authenticated page should use one compact pattern.

Recommended structure:

`Title + optional status/meta` on the left, `primary/utility actions` on the right.

Rules:

- no outer card by default;
- no decorative glow;
- no paragraph longer than one line;
- no kicker unless it adds genuinely useful categorization;
- header should normally consume **44–72px** total height;
- filters may sit on the same row when space allows.

Hero panels are permitted only for:

- Login;
- first-run onboarding;
- rare empty/recovery experiences.

They are prohibited for Dashboard, Running Tickets, Archive, Ticket Detail, Generator, and Cut Point Tracker.

---

## 10. Buttons and interactive controls

### Button hierarchy

Use fewer full-width/full-height buttons.

- primary page action: one visually dominant button;
- secondary utility actions: compact neutral buttons;
- row actions: 32–36px desktop;
- repeated row actions should prefer icon + tooltip/accessible label when text is redundant and meaning is obvious;
- destructive actions stay text-labeled where ambiguity would be dangerous.

### Hover behavior

Remove routine `translateY` hover motion from dense rows, tables, and metadata cards.

Preferred hover feedback:

- background change;
- border color change;
- subtle shadow only for actual floating/selectable cards.

This prevents visual jitter while scanning dense datasets.

---

## 11. Form density rules

### Fields

- label-to-control gap: 4–6px;
- field-to-field gap: 8–10px;
- helper text appears only when necessary;
- helper copy must not repeat section description;
- inline validation remains visible and accessible;
- control height 38px desktop;
- text area default min-height 72–88px unless the field is explicitly long-form.

### Form sections

- padding 10–14px;
- section header bottom gap 8–10px;
- section title 14–15px;
- no permanent description if labels/hints are sufficient;
- prefer two-column field layout on desktop where semantic pairing exists;
- form sections may share one outer editor panel when it reduces fragmentation.

### Smart Import

- remains a utility, not a hero;
- target textarea height ~96–120px desktop;
- detection summary should be one compact row when possible;
- apply/clear actions live in the same utility header/footer.

### Report Preview

- sticky desktop rail remains allowed;
- width target 340–400px depending viewport;
- header target 36–42px;
- copy action compact;
- report text uses dense mono leading without sacrificing readability;
- preview should not force the main editor below comfortable minimum width.

---

## 12. Tables, lists, and incident cards

### Desktop default

Data-heavy pages should prefer **rows/tables** over large cards.

A desktop incident row should aim to show:

- TT number;
- title;
- status;
- PIC or important ownership field;
- latest/occur time;
- coordinate signal if relevant;
- compact action group.

Do not place each metadata value in a separate tile.

### Row density

- one-line row: 44–52px;
- two-line row: 56–64px;
- row horizontal padding: 10–14px;
- table header: 32–38px;
- column labels: 10–11px uppercase or 11–12px semibold;
- action buttons: 32–36px.

### Mobile incident cards

Cards remain acceptable on mobile, but must be flat.

Preferred structure:

- line 1: status + TT + update time;
- line 2–3: title;
- line 4: compact metadata string or two-column definition row;
- optional latest progress excerpt;
- compact action strip.

Avoid four separate rounded metadata tiles inside one card.

---

## 13. Page-specific requirements

### 13.1 Dashboard

Target role: reference example for compact page composition.

Required changes:

- page header height ≤ 64px;
- New Ticket uses compact primary button;
- KPI cards target 72–88px height;
- KPI cards do not need separate icon tiles when label/value/state already communicate meaning;
- KPI hints should be removed or folded into label where obvious;
- remove `Today's pulse` heading if KPI grouping is visually self-evident;
- recent rows target 52–60px;
- empty activity state target ≤ 96px height.

### 13.2 Running Tickets

Required changes:

- remove hero panel entirely;
- title, Running count/status, New Ticket, search, coordinate filter, and sort should compose into one compact page header + toolbar;
- desktop primary display should be a dense table/list;
- mobile cards flattened;
- remove nested PIC/Cut Point/Coordinate/Occur tiles;
- actions condensed;
- review remains default safe navigation;
- Add Progress remains explicit mutation entry;
- local-preview message becomes a compact inline status row, not a full panel.

### 13.3 Archive & Restore

Required changes:

- remove hero panel;
- integrate Resolved/Archived segmented control into compact page header;
- remove redundant lifecycle description;
- history panel header collapses into toolbar/table header;
- first Ticket row should begin near the top of the page;
- rows target 52–60px;
- `Open` should use the safe review/detail route where product navigation contract requires review-first behavior;
- lifecycle actions remain explicit and confirmation-protected.

### 13.4 Cut Point Tracker

Required changes:

- remove hero panel;
- title, counts, status filter, search, and Refresh should occupy one compact toolbar area;
- desktop sidebar width target 300–340px unless testing proves wider is necessary;
- map begins within ~80–100px of page content top;
- marker cards flattened;
- Cut Point/PIC/coordinate should become inline metadata rows instead of nested tiles;
- map overlay chips reduced to essential state only;
- mobile bottom-sheet behavior preserved but internal padding/gaps reduced;
- map remains the visually dominant surface.

### 13.5 Ticket Detail

Required changes:

- merge title/status/TT/Edit into one compact detail header;
- remove standalone Safe Review Mode panel;
- represent read-only safety with a compact lock/read-only badge plus one short helper line if needed;
- Operational Context becomes a dense definition grid with dividers, not six child cards;
- timeline entries become compact rows with a narrow time column / marker and text body;
- Report Preview remains sticky desktop utility;
- core context and beginning of timeline should be visible in first desktop viewport.

### 13.6 Template Generator

Required changes:

- migrate current page-specific density hacks into shared tokens/primitives where possible;
- command bar ≤ 56–64px where content allows;
- controls adopt new dense global heights;
- form panels use 10–14px padding;
- paired fields remain two-column desktop;
- OCR utility remains visually subordinate;
- progress composer controls fit in compact horizontal composition on desktop where safe;
- no regression to save/revision/unsaved-change behavior.

### 13.7 Login

Login is the exception surface.

Allowed:

- larger radius;
- stronger elevation;
- atmospheric background;
- more breathing room;
- brand storytelling.

Still required:

- mobile login should avoid excessive vertical scrolling;
- form controls may use 42–44px height;
- decorative content must not displace the sign-in form on smaller screens.

---

## 14. Empty, loading, error, and warning states

### Empty states

Routine data-page empty states should be compact:

- icon 24–32px;
- vertical padding 24–36px max;
- one title;
- one short helper line if needed;
- CTA only if a meaningful next action exists.

Do not allocate half a viewport to `0 items`.

### Skeletons

Skeleton dimensions should approximate final dense content, not old spacious cards.

### Errors

Errors remain visible and accessible, but use compact alert rows/panels unless remediation requires more explanation.

### Local preview

`Local preview` should be treated as shell/workspace state, not repeated as a large content banner on every page.

---

## 15. Responsive rules

### Desktop ≥ 1024px

Maximum density mode.

- favor rows, tables, split panes;
- compact control heights;
- minimal vertical copy;
- multiple fields per row where semantics permit.

### Tablet 768–1023px

- preserve dense spacing;
- allow toolbars to wrap into two lines;
- tables may switch to compact card/list when columns become unreadable;
- avoid immediately falling back to large mobile cards.

### Mobile < 768px

- retain high density but respect touch size;
- flatten cards;
- avoid nested boxes;
- prefer short metadata rows;
- compact bottom navigation remains persistent;
- do not reduce readable text below practical mobile size to gain density.

---

## 16. Accessibility guardrails

Density work must not reduce accessibility quality.

Required:

- no serious/critical axe violations;
- visible keyboard focus remains clear;
- focus targets do not overlap sticky shell areas;
- labels remain programmatically associated;
- icon-only actions require accessible labels;
- contrast remains AA for normal operational text;
- mobile hit targets remain reasonable even when visual artwork is smaller;
- destructive actions remain clear and confirmation-protected;
- reduced-motion behavior remains respected.

---

## 17. Implementation architecture rules

1. **Token-first.** Change density through semantic tokens before page-level overrides.
2. **Primitive-first.** Shared Button, IconButton, fields, chips, badges, EmptyState, ErrorState, Skeleton, and dialogs adopt density rules before page rewrites.
3. **Remove CSS hacks.** Page selectors based on `:has()` and broad utility overrides should be reduced when equivalent shared primitives exist.
4. **Behavior isolation.** Density work must not alter persistence, Firebase calls, lifecycle state transitions, parser behavior, OCR behavior, report formatting, or RBAC capability checks.
5. **No broad rewrite of proven stateful pages unless required.** Recompose presentation while keeping persistence logic stable.
6. **One density language.** Avoid page-specific control heights/radii unless the page has a documented exception.

---

## 18. Implementation phases

### DENSITY-0 — Token baseline

- [ ] add dense spacing tokens;
- [ ] reduce operational radius scale;
- [ ] introduce 32/36/38/44px control tokens;
- [ ] reduce default chip/badge height;
- [ ] reduce operational title/body scale where needed;
- [ ] define low-elevation data surface rules.

### DENSITY-1 — Shared primitives

- [ ] Button / IconButton density;
- [ ] TextInput / Textarea / DateTime / Select density;
- [ ] StatusBadge / chips;
- [ ] EmptyState / ErrorState / Skeleton;
- [ ] Dialog / toast density;
- [ ] preserve focus/accessibility contracts.

### DENSITY-2 — Application shell

- [ ] sidebar width and nav-row reduction;
- [ ] compact account/workspace area;
- [ ] 48–52px topbar;
- [ ] reduced main top padding;
- [ ] compact mobile nav without reducing usable hit areas.

### DENSITY-3 — Dashboard + Running

- [ ] dashboard becomes density reference surface;
- [ ] remove Running hero;
- [ ] consolidate Running header/filter tools;
- [ ] dense desktop incident rows;
- [ ] flattened mobile Running cards.

### DENSITY-4 — Ticket Detail + Generator

- [ ] flatten Ticket Detail context;
- [ ] remove standalone safe-review card;
- [ ] compact timeline;
- [ ] normalize Generator against shared dense tokens;
- [ ] reduce Generator page-specific override debt.

### DENSITY-5 — Cut Point Tracker

- [ ] remove Cut Point hero;
- [ ] compact toolbar;
- [ ] narrow sidebar where safe;
- [ ] flatten marker cards;
- [ ] maximize map viewport.

### DENSITY-6 — Archive

- [ ] remove Archive hero;
- [ ] compact segmented lifecycle toolbar;
- [ ] flatten history list/table;
- [ ] reduce empty/loading states;
- [ ] preserve confirmation safety.

### DENSITY-7 — Login + edge surfaces

- [ ] mobile Login density review;
- [ ] Not Found / auth loading / permission errors;
- [ ] local-preview messages;
- [ ] toast/dialog final alignment.

### DENSITY-8 — Full QA + manual acceptance

- [ ] Prettier committed;
- [ ] lint green;
- [ ] unit/component tests green;
- [ ] Firebase Emulator repository tests green;
- [ ] Firestore Rules tests green;
- [ ] generic + production Firebase builds green;
- [ ] 360 / 390 / 412 / 768 / 1024 / 1280 responsive checks green;
- [ ] Playwright Admin lifecycle green;
- [ ] Operator/Viewer RBAC green;
- [ ] keyboard/focus green;
- [ ] serious/critical axe checks green;
- [ ] manual Light/Dark desktop/mobile density acceptance complete.

---

## 19. Manual audit checklist

For every authenticated page, reviewers must ask:

- Is there any panel that contains no data or action and could simply be normal layout?
- Is any sentence explaining something the labels/buttons already make clear?
- Is there a card inside a card that could become a divider or metadata row?
- Is a control taller than needed on desktop?
- Is an action repeated as text where an accessible compact icon action would be safe?
- Does the first useful dataset begin quickly enough?
- Can the user see materially more information than before without feeling cramped?
- Does Light mode still feel calm?
- Does Dark mode retain enough surface separation without relying on giant shadows?
- Can the page still be operated comfortably by keyboard?
- Are touch targets safe on mobile?

If the answer reveals avoidable viewport waste, the surface does not pass density acceptance.

---

## 20. Acceptance definition

The density overhaul is complete only when:

1. the global tokens/primitives encode density directly;
2. routine operational pages no longer use hero-style panels;
3. nested metadata cards are removed from list/detail surfaces;
4. desktop control heights and shell chrome are materially reduced;
5. first-view useful data increases on Dashboard, Running, Archive, Ticket Detail, Generator, and Cut Point Tracker;
6. all existing functional/security/browser QA remains green;
7. Light/Dark desktop/mobile manual review confirms the application feels **compact, intentional, fast to scan, and comfortable for long NOC sessions**.

---

## 21. Non-functional guardrails

This PRD must not intentionally change:

- Firestore schema or index contracts;
- Firebase Authentication behavior;
- role/capability definitions;
- Ticket lifecycle semantics;
- optimistic revision guards;
- Smart Parsing behavior;
- OCR engine or local-photo privacy contract;
- coordinate persistence rules;
- canonical report format;
- Firebase Hosting architecture.
