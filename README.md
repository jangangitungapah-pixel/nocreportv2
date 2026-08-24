# NOC Report Template Generator

React/Vite web app for creating, persisting, searching, and resolving NOC incident reports with a canonical report template, local Cut Point OCR, role-based Firebase access, and an operational Cut Point map.

## Current project state

The planned MVP is **RELEASED**. T0–T8 are complete, with the production application live at:

```text
https://nocreportv2.web.app
```

The Firebase release to project `nocreportv2` includes Firebase Hosting, Cloud Firestore Security Rules, and Firestore indexes. The public production smoke passed for the primary SPA routes and published static assets. The project owner subsequently accepted the full authenticated production smoke, including login, Dashboard/Firestore access, Ticket create/save and reload persistence, Running transition, Progress persistence, deployed-browser OCR, verified coordinate persistence, Running Tickets, Cut Point Tracker, Copy Report, Resolve, signed-out protection, and the Admin/Operator/Viewer RBAC matrix.

The intended Firebase Spark plan/account billing state and required Firebase Authentication provider were explicitly confirmed for release acceptance. No Critical/High production blocker remained at T8 acceptance.

The canonical phase tracker lives at `docs/06-workplan/IMPLEMENTATION-WORKPLAN.md`. Release procedures and evidence live under `docs/07-release/`.

## Technology baseline

- React 19 + Vite 8 SPA
- React Router 7
- React Hook Form + Zod
- Firebase Authentication + Cloud Firestore
- Firebase Emulator Suite for integration/security testing
- Leaflet with configurable OpenStreetMap-compatible tiles
- browser-local PaddleOCR.js primary OCR with Tesseract.js fallback
- Vitest + React Testing Library
- Playwright + axe in the CI browser gate

## Architecture invariants

- Firebase Spark-compatible MVP path
- no Cloud Storage, Cloud Functions, Cloud Run, App Hosting, or custom backend dependency
- Cut Point source photos never leave the browser and are never persisted
- only verified coordinate metadata is persisted
- one canonical Ticket dataset; Running Tickets and map markers are views/queries, not duplicate collections
- Firebase SDK access stays behind infrastructure/repository boundaries
- no per-keystroke Firestore persistence
- optimistic Ticket revisions protect against silent concurrent overwrite
- report preview and clipboard output share the same canonical formatter

## Prerequisites

- Node.js 24 (`.nvmrc` is committed)
- npm
- Java 21 when running Firebase Emulator integration tests

## Local setup

```bash
npm ci
npm run dev
```

With no Firebase environment configured, the app runs in local preview/development mode and does not write to Firestore.

For a real Firebase-backed local session, copy `.env.example` to `.env.local` and use the public Firebase Web App configuration defined there. Real `.env*` files are ignored and must not be committed.

```bash
cp .env.example .env.local
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
npm run dev
```

## Environment contract

The client expects these variables when Firebase-backed mode is enabled:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_USE_FIREBASE_EMULATORS
VITE_FIRESTORE_EMULATOR_HOST
VITE_FIRESTORE_EMULATOR_PORT
VITE_AUTH_EMULATOR_URL
VITE_MAP_TILE_URL
VITE_MAP_ATTRIBUTION
```

Firebase Web App client configuration is public application configuration, not a service-account secret. Service-account keys and private-key material must never be committed.

The T8 production build reads the public Web App values from `.env.example`, requires project `nocreportv2`, and forces emulator mode off. This prevents an accidental Firebase Hosting release of the local-preview/emulator configuration.

## Main routes

- `/dashboard` — bounded operational summaries and recent activity
- `/generator/new` — create a Draft Ticket
- `/generator/:ticketId` — edit an existing Ticket and Progress Timeline
- `/running` — bounded Running Ticket search/actions
- `/cut-points` — map of Tickets with verified valid coordinates
- `/login` — Firebase Authentication entry point

Admin-only archive/restore behavior is protected by both permission-aware UI and Firestore Security Rules. Operator and Viewer behavior follows the role matrix in `docs/05-security/SECURITY-ACCESS-CONTROL-PRD.md`.

## OCR and coordinate privacy

Cut Point OCR executes in the browser. PaddleOCR.js is the primary engine and Tesseract.js is the fallback. The coordinate pipeline supports DD, DMS, and DDM formats, requires operator verification when needed, and only sends verified Latitude/Longitude metadata through the persistence boundary. Source images are not uploaded or stored.

## Quality commands

```bash
npm run format:check
npm run lint
npm test
npm run test:firebase:emulator
npm run build
```

The standard aggregate gate is:

```bash
npm run quality
```

GitHub Actions additionally runs:

- T7 security/repository hygiene scanning
- T8 Firebase release preflight
- production and Firebase-configured production builds
- dev-server smoke testing
- real-browser Cut Point viewport/touch QA
- Playwright MVP E2E, responsive, keyboard/focus, and accessibility QA
- guarded T8 finalization after authenticated production evidence exists

## Firestore development and validation

Integration and Security Rules tests run against a demo Firebase project through the Emulator Suite and never target production data.

Useful scripts:

```bash
npm run test:firebase:emulator
npm run firebase:deploy:rules
npm run firebase:deploy:indexes
npm run firebase:deploy:firestore
```

## Production release

Run the repository release preflight and deterministic production build before a deploy:

```bash
npm run release:preflight
npm run build:production
```

Firebase deployment commands target project `nocreportv2` explicitly:

```bash
npm run firebase:deploy:hosting
npm run firebase:deploy:release
```

Validate the public Hosting shell, SPA rewrites, and published assets after deployment:

```bash
npm run release:smoke:public
```

The smoke command defaults to `https://nocreportv2.web.app`. It validates the public Hosting/SPA layer and does not replace authenticated Firebase Auth/Firestore/RBAC workflow validation.

The full release procedure, public deployment evidence, and authenticated acceptance evidence are documented in:

- `docs/07-release/FIREBASE-DEPLOYMENT.md`
- `docs/07-release/PRODUCTION-DEPLOYMENT-EVIDENCE.md`
- `docs/07-release/AUTHENTICATED-PRODUCTION-SMOKE.md`
- `docs/07-release/AUTHENTICATED-PRODUCTION-SMOKE-EVIDENCE.md`

## Data and reliability behavior

- Ticket writes use repository/service boundaries and optimistic revisions.
- stale revisions are rejected instead of silently overwriting newer Ticket state.
- Progress append/update/remove maintains Ticket revision and timeline metadata atomically.
- failed Progress persistence keeps the operator draft intact.
- failed Ticket Save does not reset the form; network failures explicitly state that unsaved data remains on screen and the same Save action can be retried.
- historical reads are bounded/paginated.
- invalid coordinates never become map markers.

## Documentation

Source-of-truth documents:

- `docs/00-product/MASTER-PRD.md`
- `docs/01-ux/UI-UX-PRD.md`
- `docs/02-architecture/TECHNICAL-ARCHITECTURE-TDD.md`
- `docs/03-data/DATA-DATABASE-PRD.md`
- `docs/04-api/API-INTEGRATION-PRD.md`
- `docs/05-security/SECURITY-ACCESS-CONTROL-PRD.md`
- `docs/06-workplan/IMPLEMENTATION-WORKPLAN.md`
- `docs/07-release/FIREBASE-DEPLOYMENT.md`
- `docs/07-release/PRODUCTION-DEPLOYMENT-EVIDENCE.md`
- `docs/07-release/AUTHENTICATED-PRODUCTION-SMOKE.md`
- `docs/07-release/AUTHENTICATED-PRODUCTION-SMOKE-EVIDENCE.md`

If implementation and documentation diverge, the relevant PRD/TDD must be reconciled before a future release is accepted.
