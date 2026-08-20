# NOC Report Template Generator — Technical Architecture PRD / TDD

**Document ID:** NOCREPORT-TDD-001  
**Version:** 0.1  
**Status:** Baseline / Technical Source of Truth  
**Parent documents:** `docs/00-product/MASTER-PRD.md`, `docs/01-ux/UI-UX-PRD.md`  
**Repository:** `jangangitungapah-pixel/nocreportv2`  
**Primary platform:** Responsive client-side web application  
**Architecture goal:** Professional modular React/Vite SPA with a Firebase Spark-compatible production path

---

# 1. Purpose

This document defines how the NOC Report Template Generator will be implemented technically.

The Master Product PRD defines **what** the product must do. The UI/UX PRD defines **how the user experiences it**. This TDD defines **how the codebase, runtime, data access, OCR pipeline, map integration, state boundaries, testing, build system, and deployment architecture must be structured**.

If implementation code conflicts with this document, the implementation must be corrected unless this TDD is intentionally revised.

This document does not define the final Firestore collection schema, final API contract, or final Firebase Security Rules. Those are delegated to the Data & Database, API & Integration, and Security & Access Control documents.

---

# 2. Architecture Principles

## ARCH-01 — Single-page application, not a server-rendered framework

The application will use a client-side React SPA.

Next.js is intentionally not used.

Reasons:

- no SEO requirement for operational pages;
- no SSR requirement;
- no server-rendered business logic requirement;
- Firebase Hosting works naturally with static SPA output;
- lower framework complexity;
- simpler local development and deployment;
- easier Spark-only architecture.

## ARCH-02 — JavaScript-first codebase

The application uses JavaScript and JSX.

Primary source formats:

- `.jsx`
- `.js`
- `.css`
- `.json`

TypeScript is not required for the MVP.

Runtime validation and carefully defined domain contracts remain mandatory even without TypeScript.

## ARCH-03 — Modular vertical architecture

Feature code must be organized by product domain rather than placing every component, hook, and utility into large global folders.

Feature-specific logic stays inside its feature.

Reusable domain entities and infrastructure boundaries are extracted only when shared.

## ARCH-04 — Business logic must be independent from UI

The following must be implemented as pure/testable domain functions where possible:

- report generation;
- TT number extraction;
- coordinate parsing;
- DMS/DDM conversion;
- coordinate validation;
- coordinate formatting;
- timeline sorting;
- ticket lifecycle validation;
- optional section rendering.

React components must not become the only place where these rules exist.

## ARCH-05 — Firebase is an adapter, not the domain

UI code must not scatter Firestore SDK calls across components.

All persistence access goes through repository/service boundaries.

This allows:

- unit testing without Firebase;
- Firebase Emulator integration tests;
- future database replacement if ever needed;
- predictable write/read behavior;
- easier Security Rules alignment.

## ARCH-06 — Spark Plan constraint is architectural

MVP production architecture must avoid features that require Firebase Blaze.

Therefore the baseline architecture does not depend on:

- Cloud Functions;
- Cloud Run;
- Firebase App Hosting;
- Cloud Storage for Firebase;
- Google Maps APIs attached to the Firebase project;
- server-side OCR;
- paid server compute.

## ARCH-07 — Operational reliability over cleverness

The architecture should prefer explicit, boring, testable code over unnecessary abstraction.

No microservices, monorepo, server framework, GraphQL layer, Redux-style global store, or complex event bus is required for the MVP.

---

# 3. Technology Baseline

The implementation baseline is:

| Area | Technology |
| --- | --- |
| Runtime UI | React 19.2.x |
| Build tool | Vite 8.x |
| Routing | React Router 8.x in client SPA/declarative mode |
| Styling | Tailwind CSS 4.x via `@tailwindcss/vite` |
| Local component CSS | Plain `.css` where component-specific styling is clearer |
| Forms | React Hook Form |
| Runtime schema validation | Zod |
| Database | Cloud Firestore |
| Authentication boundary | Firebase Authentication |
| Hosting | Firebase Hosting |
| OCR | Tesseract.js 7.x, browser-side |
| Map renderer | Leaflet 1.9.4 stable |
| Base map | OpenStreetMap raster tiles for MVP/dev, provider-configurable |
| Unit/component tests | Vitest + React Testing Library + jest-dom |
| E2E | Playwright |
| Accessibility testing | axe-core / Playwright integration |
| Linting | ESLint flat configuration |
| Formatting | Prettier |
| Package manager | npm with committed `package-lock.json` |
| CI | GitHub Actions |
| Local Firebase integration | Firebase Emulator Suite |

Exact patch versions must be pinned in `package-lock.json` when project scaffolding begins.

Avoid floating dependency ranges in CI-sensitive tooling where reproducibility matters.

---

# 4. Runtime Requirements

Development baseline:

- Node.js 24 LTS;
- modern evergreen browser;
- npm;
- Git;
- Firebase CLI for emulator/deployment phases.

Browser target is aligned with modern Tailwind CSS v4 support.

The application does not target Internet Explorer or obsolete Android browsers.

---

# 5. Repository Structure

The repository remains a **single web application repository**, not a monorepo.

Target structure:

```text
nocreportv2/
├── docs/
│   ├── 00-product/
│   ├── 01-ux/
│   ├── 02-architecture/
│   ├── 03-data/
│   ├── 04-api/
│   └── 05-security/
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   ├── router.jsx
│   │   ├── providers/
│   │   └── layouts/
│   │
│   ├── features/
│   │   ├── dashboard/
│   │   ├── ticket-generator/
│   │   ├── running-tickets/
│   │   ├── cut-point-tracker/
│   │   └── auth/
│   │
│   ├── entities/
│   │   └── ticket/
│   │       ├── model/
│   │       ├── lib/
│   │       └── repository/
│   │
│   ├── infrastructure/
│   │   ├── firebase/
│   │   ├── ocr/
│   │   └── maps/
│   │
│   ├── shared/
│   │   ├── ui/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── config/
│   │   └── constants/
│   │
│   ├── styles/
│   │   ├── app.css
│   │   └── tokens.css
│   │
│   └── main.jsx
│
├── e2e/
├── scripts/
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── eslint.config.js
├── vite.config.js
├── package.json
└── package-lock.json
```

---

# 6. Feature Folder Contract

A feature may contain:

```text
feature-name/
├── components/
├── hooks/
├── pages/
├── lib/
├── schemas/
└── index.js
```

Not every feature must contain every directory.

Folders are created only when needed.

Example:

```text
ticket-generator/
├── components/
│   ├── TicketForm.jsx
│   ├── ImpactListEditor.jsx
│   ├── CoordinateExtractor.jsx
│   ├── ProgressComposer.jsx
│   ├── ProgressTimeline.jsx
│   └── ReportPreview.jsx
├── hooks/
│   ├── useTicketDraft.js
│   └── useCoordinateExtraction.js
├── pages/
│   └── TicketGeneratorPage.jsx
├── schemas/
│   └── ticketFormSchema.js
└── index.js
```

Feature folders may import from:

- `entities`;
- `infrastructure` through approved adapters;
- `shared`.

Features should not directly depend on another feature's private component tree.

---

# 7. Routing Architecture

The application uses client-side routing.

Baseline routes:

```text
/
/dashboard
/generator/new
/generator/:ticketId
/running
/cut-points
/login
```

Potential route aliases may redirect to canonical paths.

`/` should resolve to the authenticated default workspace, normally `/dashboard`.

Unknown routes render a proper Not Found state.

Firebase Hosting must rewrite SPA routes to `/index.html`.

Route-level code splitting should be used for heavier screens, especially:

- Template Generator OCR module;
- Cut Point Tracker map module.

The OCR engine must not be downloaded during initial Dashboard load.

---

# 8. Application Providers

Global providers must remain minimal.

Expected providers:

```text
ErrorBoundary
AuthProvider
ThemeProvider
RouterProvider
Toast/Notification Provider
```

A global application provider must not become a generic dumping ground for ticket state.

Ticket editing state stays with the Ticket Generator route/feature.

---

# 9. State Management Strategy

MVP does **not** require Redux or a large global state framework.

State is separated into four categories.

## 9.1 Local UI state

Use normal React state for:

- dialog visibility;
- selected tab;
- mobile bottom sheet state;
- map popup state;
- temporary preview state.

## 9.2 Form state

Use React Hook Form for Ticket Generator form state.

Responsibilities:

- dirty tracking;
- validation;
- controlled submit lifecycle;
- field arrays such as Impact List;
- error presentation;
- reset from loaded Ticket data.

## 9.3 Shared application state

Use Context only for truly global state such as:

- authenticated user;
- theme preference.

## 9.4 Persistent/server state

Firestore data is accessed through repository hooks/services.

A separate cache framework is not mandatory at MVP baseline because Firestore already provides client-side query and realtime primitives.

If later implementation demonstrates significant cross-route caching complexity, a dedicated server-state library may be introduced through an explicit TDD revision.

---

# 10. Domain Model Boundary

The `entities/ticket` module owns the common Ticket concepts used by multiple pages.

It should expose functions/contracts such as:

```text
createEmptyTicket()
normalizeTicket()
validateTicketTransition()
extractExternalTicketNumber()
sortProgressTimeline()
formatTicketReport()
parseCoordinateText()
normalizeCoordinates()
```

These functions must not import React.

The report formatter must be deterministic.

Given the same normalized Ticket object, it must produce the same report string.

---

# 11. Form Validation Architecture

Zod schemas define runtime validation for form and repository boundaries.

Validation is layered.

## Layer A — Draft-safe validation

Allows incomplete operational information.

Example:

- Rootcause may be empty;
- PIC may be empty;
- Cut Point may be empty;
- coordinates may be absent.

## Layer B — Status transition validation

Before changing Draft → Running, validate required Running fields such as:

- Title;
- Occur Time.

## Layer C — coordinate validation

If coordinates exist:

```text
-90 <= latitude <= 90
-180 <= longitude <= 180
```

Latitude and longitude must be valid as a pair.

## Layer D — persistence validation

Objects returned from or written to Firestore must be normalized before entering application state.

Malformed persisted data must fail safely rather than crashing the UI.

---

# 12. Report Generation Architecture

The generated NOC report is produced by a pure function.

Example responsibility:

```text
formatTicketReport(ticket) => string
```

The formatter must:

- preserve user wording;
- use canonical field order;
- hide Impact List when empty;
- format dates consistently;
- sort progress chronologically;
- render plain text;
- avoid adding coordinate text until the product spec explicitly requires it.

The preview component must consume this formatter.

The Copy Report action must copy the exact same string.

There must never be separate formatting logic for Preview and Clipboard output.

---

# 13. Progress Timeline Architecture

Each progress entry is modeled as its own structured object containing at minimum:

```text
id
occurredAt
text
createdAt
createdBy
```

A stable secondary ordering key must be available for duplicate timestamps.

The UI may show only `HH:mm`, but domain sorting uses full datetime.

Appending progress must not require rewriting unrelated ticket form fields in application state.

Final Firestore write strategy is specified in the Data & Database PRD.

---

# 14. Firebase Architecture

Firebase integration uses the modular Firebase Web SDK.

Recommended infrastructure modules:

```text
src/infrastructure/firebase/
├── firebaseApp.js
├── authClient.js
├── firestoreClient.js
├── ticketRepository.js
└── firebaseErrors.js
```

Firebase initialization happens once.

React components must not call `initializeApp()`.

Firebase configuration comes from Vite environment variables.

Example names:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
```

Firebase web configuration is not treated as a server secret; actual data security must be enforced with Authentication and Firestore Security Rules.

No service-account key may exist in the browser repository.

---

# 15. Firebase Spark Plan Boundary

As of the architecture baseline date, Firebase Spark provides no-cost access/quotas for services such as Firestore, Hosting, and supported Authentication methods, but it does not provide unrestricted Google Cloud services.

The MVP therefore uses:

```text
Firebase Hosting
Cloud Firestore
Firebase Authentication
```

The MVP does not use:

```text
Cloud Functions
Cloud Run
Cloud Storage for Firebase
Firebase App Hosting
Google Maps Platform APIs
```

Important architecture rule:

**Cloud Storage for Firebase is not part of this application's Spark-only MVP.**

Field photos are processed locally in the browser and discarded unless the user independently keeps the original file.

Only extracted/confirmed coordinate metadata is persisted.

Current Spark quotas must be rechecked before production deployment because Firebase pricing and quotas can change.

---

# 16. Firestore Read/Write Efficiency

Because the application targets Spark Plan, read/write behavior must be intentional.

Rules:

- do not save on every keystroke;
- do not create high-frequency listeners unless operationally useful;
- use explicit Save for large Ticket edits;
- progress append may use a targeted write;
- Dashboard queries must request only operationally useful records;
- Running Ticket must query Running records rather than downloading all history and filtering in memory;
- pagination/query limits are required for historical lists;
- map queries should load only tickets with relevant coordinate/status scope where possible;
- avoid duplicate summary documents unless they clearly reduce total cost and complexity.

A quota-aware repository layer should make excessive read/write patterns visible during development.

---

# 17. Authentication Architecture

Authentication is represented as an application boundary from the beginning even if full role management is implemented later.

Initial production direction:

- Firebase Authentication;
- email/password or another Spark-compatible non-phone provider;
- authenticated routes;
- role/profile information stored separately from authentication identity where required.

Phone/SMS authentication is not an MVP dependency.

Detailed RBAC and Firestore rule design belongs to the Security & Access Control PRD.

---

# 18. OCR Architecture

OCR must execute in the browser.

Baseline engine:

**Tesseract.js 7.x**.

The OCR module is isolated under:

```text
src/infrastructure/ocr/
```

Suggested modules:

```text
ocrWorker.js
imagePreprocessor.js
extractWatermarkText.js
coordinateCandidates.js
```

## 18.1 OCR pipeline

```text
User selects image
        ↓
Validate type/size
        ↓
Create local object URL / image bitmap
        ↓
Optional resize/crop/preprocessing
        ↓
Tesseract worker OCR
        ↓
Raw OCR text
        ↓
Coordinate candidate parser
        ↓
DMS/DDM/DD conversion
        ↓
Geographic validation
        ↓
Confidence / ambiguity decision
        ↓
Populate editable Lat/Long fields
        ↓
User confirms/corrects
```

## 18.2 Worker requirement

Heavy OCR processing must not block the primary UI thread.

The implementation must use the worker-based Tesseract execution model.

The OCR engine should be lazy-loaded only when the user uses the photo extraction feature.

## 18.3 Image lifecycle

The original image must stay local for MVP.

Rules:

- no Firebase Storage upload;
- no base64 image written to Firestore;
- revoke temporary object URLs when no longer used;
- release large ImageBitmap/canvas resources;
- resize very large images before OCR when practical;
- do not keep multiple full-resolution copies in React state.

---

# 19. Coordinate Parser Architecture

OCR and coordinate parsing are separate systems.

OCR answers:

> What text appears in the image?

Coordinate parsing answers:

> Does this text contain valid coordinates, and what are they?

The parser must be pure JavaScript and independently testable.

Minimum formats:

- Decimal Degrees;
- DMS;
- DDM;
- N/S/E/W variants;
- comma-separated values;
- label-separated values;
- common OCR whitespace/symbol variation.

Parser pipeline:

```text
normalize OCR characters
↓
detect labelled values
↓
detect DMS/DDM patterns
↓
detect decimal candidates
↓
convert to decimal degrees
↓
apply hemisphere sign
↓
validate geographic ranges
↓
score confidence
↓
return confirmed candidate or ambiguity set
```

Return values must represent ambiguity explicitly.

Example conceptual result:

```js
{
  status: 'verified-candidate',
  latitude: -6.12345,
  longitude: 107.12345,
  confidence: 'high',
  sourceFormat: 'DMS'
}
```

or:

```js
{
  status: 'ambiguous',
  candidates: [...]
}
```

The parser must never convert an ambiguous result directly into authoritative saved coordinates without user verification.

---

# 20. Map Architecture

Baseline renderer:

**Leaflet 1.9.4 stable**.

Do not use Leaflet 2 prerelease builds for MVP baseline.

Map implementation lives under:

```text
src/infrastructure/maps/
```

Suggested modules:

```text
mapConfig.js
coordinateBounds.js
markerPresentation.js
```

The Cut Point Tracker feature owns product-specific ticket marker UI.

## 20.1 Tile provider

OpenStreetMap raster tiles may be used for normal MVP interactive viewing.

The tile URL must not be hardcoded deep inside components.

Use configuration such as:

```text
VITE_MAP_TILE_URL
VITE_MAP_ATTRIBUTION
```

This makes future migration to another OSM-derived provider possible without rewriting the map feature.

## 20.2 OSM usage constraints

When using public OpenStreetMap tiles:

- attribution must remain visible;
- do not bulk-download or prefetch large map areas;
- do not implement offline map downloads against public OSM tile servers;
- normal browser caching behavior must not be deliberately bypassed;
- service is best-effort and has no SLA.

The app must not treat the public OSM tile server as a permanent guaranteed enterprise backend.

## 20.3 Google Maps exclusion

Google Maps Platform is not the MVP baseline because it introduces billing/API coupling that conflicts with the Spark-only goal.

---

# 21. Styling Architecture

Tailwind CSS 4.x is integrated through `@tailwindcss/vite`.

Primary application stylesheet:

```text
src/styles/app.css
```

Tailwind is used for:

- layout;
- spacing;
- responsive behavior;
- common typography;
- borders;
- utility-level states.

Plain CSS is allowed and encouraged when it improves clarity for:

- complex data-grid behavior;
- sticky workspace layouts;
- map container sizing;
- intricate animations;
- reusable semantic theme tokens.

Do not create unreadable JSX containing hundreds of arbitrary utility values where a semantic class would be clearer.

---

# 22. Design Token Architecture

Light and dark theme must use the same components.

Semantic tokens should define concepts such as:

```text
--surface
--surface-elevated
--surface-muted
--text-primary
--text-secondary
--border
--accent
--danger
--warning
--success
```

Component code must consume semantic styling rather than duplicating separate light/dark component implementations.

Theme preference can be stored locally on the device.

---

# 23. Shared UI Component Strategy

Reusable primitives may include:

```text
Button
IconButton
Input
Textarea
DateTimeField
Select
Badge
Card
Dialog
Drawer
Sheet
Tooltip
Toast
EmptyState
ErrorState
Skeleton
ConfirmDialog
```

Feature-specific components such as `ProgressComposer` or `TicketMarkerPopup` remain inside their feature rather than being promoted prematurely to `shared/ui`.

A component should become shared only after it has a genuinely generic contract.

---

# 24. Error Handling

Errors must be normalized at infrastructure boundaries.

Firestore/Firebase errors should not be rendered directly as raw SDK exception text.

Application error categories include:

```text
VALIDATION_ERROR
AUTH_ERROR
PERMISSION_DENIED
NOT_FOUND
NETWORK_ERROR
PERSISTENCE_ERROR
OCR_ERROR
COORDINATE_PARSE_ERROR
CLIPBOARD_ERROR
MAP_ERROR
UNKNOWN_ERROR
```

Each feature decides how to present the error while preserving the original cause for development logging when appropriate.

Save failures must leave current form state intact.

---

# 25. Loading Strategy

Use localized loading states.

Examples:

- ticket list skeleton;
- generator loading shell;
- map loading state;
- OCR progress indicator;
- save button pending state.

Avoid blocking the full application for local operations.

Large optional modules should be dynamically imported.

---

# 26. Performance Requirements

Initial Dashboard and Running Ticket routes must not load OCR or map bundles unnecessarily.

Performance rules:

- route-level code splitting;
- lazy-load Tesseract.js;
- lazy-load Leaflet/map feature;
- avoid storing full-resolution image blobs in global state;
- limit Firestore query result sizes;
- virtualize datagrid only if real dataset size justifies it;
- memoization only when profiling shows benefit;
- avoid premature optimization that complicates feature code.

Target user experience:

- immediate UI feedback for user actions;
- no main-thread freeze during OCR;
- report preview update should feel instantaneous;
- adding normal progress entries should not trigger unrelated heavy rendering.

---

# 27. Offline and Network Behavior

The MVP is **network-aware but not a full offline application**.

Requirements:

- detect obvious network/save failures;
- preserve unsaved form state while the page remains open;
- never claim Saved before persistence succeeds;
- allow user to retry failed saves;
- show stale/offline status where operationally relevant.

Full offline synchronization, conflict resolution, or offline map packages are outside MVP scope.

Firestore persistent offline cache may be evaluated later but is not required for the first implementation milestone.

---

# 28. Concurrency Strategy

Multiple users may eventually open the same Ticket.

MVP must at minimum preserve:

```text
updatedAt
updatedBy
```

The UI should avoid silently overwriting a newer record when a clearly detectable stale edit condition exists.

Detailed conflict-control fields and transaction strategy belong to the Data & Database PRD.

Real-time collaborative text editing is explicitly outside MVP scope.

---

# 29. Testing Architecture

Testing is mandatory for domain-critical functionality.

## 29.1 Unit tests

Vitest tests pure functions for:

- report formatter;
- optional Impact List behavior;
- TT number extraction;
- coordinate parsing;
- DMS conversion;
- DDM conversion;
- hemisphere conversion;
- invalid coordinate rejection;
- timeline sorting;
- midnight ordering;
- duplicate timestamp ordering;
- lifecycle validation.

These are high-priority tests because errors can directly produce incorrect NOC reports.

## 29.2 Component tests

React Testing Library covers:

- Ticket form validation;
- Impact List manipulation;
- Progress Composer;
- Report Preview;
- coordinate verification UI;
- unsaved state indicators;
- error states.

Tests must prefer user-visible behavior over implementation details.

## 29.3 Integration tests

Firebase Emulator Suite is used for Firestore/Auth integration where required.

Tests must never depend on production Firestore.

## 29.4 End-to-end tests

Playwright covers critical workflows:

1. create Draft;
2. mark Running;
3. add progress;
4. generate/copy report;
5. resolve Ticket;
6. search Running Ticket;
7. save coordinates;
8. display map marker using controlled fixture data.

OCR E2E uses fixed fixture images with known coordinate watermarks.

## 29.5 Accessibility tests

Automated accessibility checks should be run against major screens.

Keyboard workflows must also be manually QA'd.

---

# 30. Test Fixtures

Repository should contain safe synthetic fixtures, not confidential operational data.

Example fixture categories:

```text
standard-ticket.json
running-ticket.json
multi-day-ticket.json
no-impact-ticket.json
dms-watermark.jpg
ddm-watermark.jpg
decimal-watermark.jpg
ambiguous-watermark.jpg
```

Any real operational example committed to the repository must be intentionally sanitized.

---

# 31. Code Quality Gates

Baseline scripts:

```text
npm run dev
npm run build
npm run preview
npm run lint
npm run format
npm run format:check
npm run test
npm run test:run
npm run test:e2e
```

Before a development phase is accepted:

```text
lint
unit/component tests
build
```

must pass.

Critical integration/E2E phases additionally require their related suites.

---

# 32. CI/CD Architecture

GitHub Actions provides continuous integration.

Pull request CI baseline:

```text
checkout
setup Node 24
npm ci
lint
format check
unit/component tests
build
```

E2E may run in a separate job once the first navigable application shell exists.

Deployment is intentionally not implemented in the initial development phase.

Later production deployment flow:

```text
main
↓
quality gates
↓
Vite production build
↓
Firebase Hosting deploy
```

Deployment credentials must use GitHub/Firebase supported secure secret mechanisms and must never be committed.

---

# 33. Environment Strategy

Minimum environment tiers:

```text
local
production
```

Optional staging may be introduced later.

Use:

```text
.env.local
.env.example
```

`.env.local` must be ignored by Git.

`.env.example` documents required variables without real credentials.

Environment reads should be centralized in a validated config module rather than accessing `import.meta.env` across arbitrary components.

---

# 34. Security Architecture Boundary

Even though detailed security is defined later, architecture must obey these rules now:

- never place Admin SDK/service-account credentials in frontend code;
- never rely on hidden UI buttons as authorization;
- Firestore Security Rules are mandatory before production data usage;
- browser Firebase config is not an authorization mechanism;
- sanitize/escape rendered text through normal React rendering;
- avoid `dangerouslySetInnerHTML` for ticket content;
- validate uploaded image MIME/type/size before OCR processing;
- treat OCR text as untrusted input;
- external map links/URLs must use controlled construction.

---

# 35. Logging and Diagnostics

MVP logging is intentionally lightweight.

Development may use structured console diagnostics behind environment checks.

Do not log:

- passwords;
- auth tokens;
- full sensitive user records;
- raw production image content.

User-facing errors must remain understandable without exposing internal stack traces.

Advanced observability is outside the first MVP architecture.

---

# 36. Dependency Policy

Dependencies must solve a real problem.

Before adding a package, evaluate:

- active maintenance;
- bundle impact;
- browser compatibility;
- license;
- security history;
- whether the same function can remain a small local utility.

Avoid overlapping libraries that solve the same problem.

Examples:

- one form library;
- one validation library;
- one map renderer;
- one OCR engine;
- one icon set.

Prerelease dependencies must not be used for critical MVP infrastructure unless explicitly approved.

This is why Leaflet stable is preferred over Leaflet 2 prerelease for the baseline.

---

# 37. Initial Implementation Sequence

Development should follow this order after all PRDs are completed.

## Phase T0 — Repository Foundation

- Vite React scaffold;
- Node/npm baseline;
- Tailwind CSS v4;
- ESLint;
- Prettier;
- Vitest;
- routing shell;
- folder architecture;
- theme tokens;
- CI quality gate.

## Phase T1 — Domain Foundation

Implement and test:

- Ticket model;
- report formatter;
- timeline sorting;
- coordinate parser;
- status rules;
- TT extractor.

No Firebase dependency required for this phase.

## Phase T2 — UI Shell

Implement:

- application layout;
- desktop sidebar;
- mobile navigation;
- Dashboard shell;
- Generator shell;
- Running Ticket shell;
- Cut Point Tracker shell.

## Phase T3 — Generator Core

Implement:

- form;
- Impact List;
- datetime fields;
- PIC;
- Rootcause;
- Cut Point;
- Progress Timeline;
- live Report Preview;
- Copy Report.

## Phase T4 — Local OCR

Implement:

- Cut Point photo dropzone;
- image preprocessing;
- Tesseract worker;
- coordinate candidate extraction;
- verification UX.

## Phase T5 — Firebase Data Integration

After Data/Security PRDs:

- Firebase initialization;
- Auth boundary;
- Firestore ticket repository;
- Running Ticket queries;
- save/update workflow;
- emulator integration tests.

## Phase T6 — Cut Point Tracker

- Leaflet;
- configurable tile source;
- ticket markers;
- marker details;
- ticket navigation;
- responsive bottom sheet.

## Phase T7 — Hardening

- accessibility;
- error states;
- loading states;
- mobile QA;
- E2E;
- performance QA;
- Firestore query/read review.

## Phase T8 — Deployment

Only after development acceptance:

- Firebase Hosting configuration;
- production environment;
- security review;
- final Spark quota check;
- deployment workflow.

---

# 38. Technical Definition of Done

The architecture is successfully implemented when:

1. the repository follows the approved modular structure;
2. the app is React/Vite and does not require Next.js or server rendering;
3. domain report generation is pure and fully testable;
4. coordinate parsing is independent from OCR;
5. Tesseract OCR runs browser-side and does not require backend compute;
6. images are not persisted to Firebase Storage;
7. Firestore access is isolated behind repositories;
8. Firebase SDK calls are not scattered through presentation components;
9. Running Ticket and Dashboard use bounded Firestore queries;
10. map code is lazily loaded;
11. OCR code is lazily loaded;
12. OSM provider configuration is replaceable;
13. forms preserve unsaved user state during failures;
14. lint, tests, and build pass;
15. critical workflows pass Playwright E2E;
16. no secret server credentials exist in frontend source;
17. Firebase production design remains compatible with Spark Plan constraints documented for the project.

---

# 39. Architecture Decisions Locked by This TDD

The following decisions are now baseline decisions and should not be casually changed during implementation:

```text
Architecture       = Client-side SPA
Framework          = React
Build              = Vite
Language           = JavaScript + JSX
Styling            = Tailwind CSS + plain CSS
Routing            = React Router
Form State          = React Hook Form
Validation          = Zod
Backend Service     = Firebase client services only
Database            = Cloud Firestore
Auth                = Firebase Authentication
Hosting             = Firebase Hosting
Cloud Storage       = NOT USED in Spark MVP
Server Functions    = NOT USED in Spark MVP
OCR                 = Tesseract.js in browser worker
Coordinate Parser   = Pure local JavaScript
Map Renderer        = Leaflet stable
MVP Map Tiles       = OpenStreetMap, provider-configurable
Global State        = Minimal Context; no Redux baseline
Testing             = Vitest + RTL + Playwright
CI                  = GitHub Actions
Package Manager     = npm
Repository Model    = Single-app repository, not monorepo
```

Any architecture change that contradicts these decisions should be made through an explicit TDD revision rather than ad-hoc implementation drift.

---

# 40. Current External Constraint Notes

Architecture baseline reviewed on **21 August 2026**.

Important external constraints verified at baseline:

- Firebase Spark remains a no-payment-method plan with no-cost product access/quotas.
- Cloud Firestore and Firebase Hosting retain Spark usage quotas.
- Firebase Authentication supports no-cost non-phone authentication within documented Spark limits.
- Cloud Storage for Firebase requires Blaze and therefore is excluded.
- Google Cloud services and billing-linked Google services can force a Firebase project away from Spark; avoid them for this product baseline.
- Tailwind CSS v4 officially supports a dedicated Vite plugin.
- React 19.2 is the current React documentation line.
- Vite 8 is the current major baseline.
- Leaflet 1.9.4 remains the stable Leaflet release; Leaflet 2 is not selected while prerelease status remains relevant to the implementation baseline.
- Public OpenStreetMap tiles are a best-effort community service subject to usage policy and must remain provider-configurable.

These facts must be revalidated immediately before production deployment because vendor plans, quotas, package versions, and usage policies can change.

---

# 41. Handoff to Next Specification

The next document is:

**Data & Database PRD**

It must translate this architecture into the exact Firestore model, including:

- collections;
- ticket document schema;
- Progress Timeline storage strategy;
- user/profile documents;
- field types;
- timestamps;
- status values;
- indexes;
- query patterns;
- create/update semantics;
- soft archive;
- lifecycle;
- audit metadata;
- concurrency/version strategy;
- Firestore quota-conscious data access;
- data retention;
- backup/export considerations;
- Security Rules-facing document boundaries.
