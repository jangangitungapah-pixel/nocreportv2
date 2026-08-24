# NOC Report Template Generator

React/Vite web app for creating, persisting, searching, and resolving NOC incident reports with a canonical report template, local Cut Point OCR, role-based Firebase access, and an operational Cut Point map.

## Current project state

The implementation is currently in **T7 — Hardening, Security Validation & Full QA**. T0–T6 are complete. Automated T7 coverage includes Firebase Auth/RBAC, Firestore Security Rules, emulator integration, security/repository hygiene, responsive browser checks, Playwright end-to-end coverage, keyboard/focus checks, and axe serious/critical accessibility checks. Firebase production deployment is intentionally deferred to T8.

The canonical phase tracker lives at `docs/06-workplan/IMPLEMENTATION-WORKPLAN.md`.

## Technology baseline

- React 19 + Vite 8 SPA
- React Router 7
- React Hook Form + Zod
- Firebase Authentication + Cloud Firestore
- Firebase Emulator Suite for integration/security testing
- Leaflet with configurable OpenStreetMap-compatible tiles
- browser-local PaddleOCR.js primary OCR with Tesseract.js fallback
- Vitest + React Testing Library
- Playwright + axe in the CI T7 browser gate

## Architecture invariants

- Firebase Spark-compatible MVP path
- no Cloud Storage, Cloud Functions, Cloud Run, or custom backend dependency
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
- dev-server smoke testing
- real-browser T6 Cut Point viewport/touch QA
- T7 Playwright MVP E2E, responsive, keyboard/focus, and accessibility QA

## Firestore development and validation

Integration and Security Rules tests run against a demo Firebase project through the Emulator Suite and never target production data.

Useful scripts:

```bash
npm run test:firebase:emulator
npm run firebase:deploy:rules
npm run firebase:deploy:indexes
npm run firebase:deploy:firestore
```

The deploy scripts above target Firestore rules/indexes only. Production Hosting release and production smoke validation belong to T8 and are not considered complete yet.

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

If implementation and documentation diverge, the relevant PRD/TDD must be reconciled before the phase is finalized.
