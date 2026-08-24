# NOC Report Template Generator

React/Vite web app for creating, persisting, searching, and resolving NOC incident reports with a canonical report template, local Cut Point OCR, role-based Firebase access, and an operational Cut Point map.

## Current project state

The implementation is currently in **T8 — Firebase Deployment & MVP Release**. T0–T7 are complete. T7 closed after Quality #525 passed the full automated gate and the project owner accepted the remaining manual visual/responsive QA on 2026-08-24.

T8 release preparation now includes a deterministic production Firebase build, a fail-fast Spark-compatible release preflight, explicit Hosting/Firestore deployment commands, and a production deployment/smoke-test runbook. Actual production Firebase console verification, deployment, and production smoke acceptance remain intentionally open until they are executed against the real `nocreportv2` project.

The canonical phase tracker lives at `docs/06-workplan/IMPLEMENTATION-WORKPLAN.md`. The T8 release runbook lives at `docs/07-release/FIREBASE-DEPLOYMENT.md`.

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
- dev-server smoke testing
- real-browser Cut Point viewport/touch QA
- Playwright MVP E2E, responsive, keyboard/focus, and accessibility QA

## Firestore development and validation

Integration and Security Rules tests run against a demo Firebase project through the Emulator Suite and never target production data.

Useful scripts:

```bash
npm run test:firebase:emulator
npm run firebase:deploy:rules
npm run firebase:deploy:indexes
npm run firebase:deploy:firestore
```

## T8 production release

Run the repository release preflight and deterministic production build before any deploy:

```bash
npm run release:preflight
npm run build:production
```

Firebase deployment commands target project `nocreportv2` explicitly:

```bash
npm run firebase:deploy:hosting
npm run firebase:deploy:release
```

`firebase:deploy:hosting` validates and builds before deploying Hosting. `firebase:deploy:release` validates and builds before deploying Firestore Security Rules, Firestore indexes, and Hosting together.

The complete account-side preparation, Firebase CLI authentication, deployment procedure, production smoke checklist, Spark quota notes, and known limitations are documented in `docs/07-release/FIREBASE-DEPLOYMENT.md`.

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

If implementation and documentation diverge, the relevant PRD/TDD must be reconciled before the phase is finalized.
