# NOC Report Template Generator

React/Vite web app for creating, persisting, searching, correlating, and resolving NOC incident reports with a canonical report template, Gemini-assisted Cut Point coordinate extraction, role-based Firebase access, and an operational Cut Point map.

## Current project state

The planned MVP is **RELEASED**. T0–T8 are complete, with the production application live at:

```text
https://nocreportv2.web.app
```

The Firebase release to project `nocreportv2` includes Firebase Hosting, Cloud Firestore Security Rules, and Firestore indexes. The public production smoke passed for the primary SPA routes and published static assets. The project owner subsequently accepted the full authenticated production smoke, including login, Dashboard/Firestore access, Ticket create/save and reload persistence, Running transition, Progress persistence, deployed-browser OCR, verified coordinate persistence, Running Tickets, Cut Point Tracker, Copy Report, Resolve, signed-out protection, and the Admin/Operator/Viewer RBAC matrix.

The intended Firebase Spark plan/account billing state and required Firebase Authentication provider were explicitly confirmed for release acceptance. No Critical/High production blocker remained at T8 acceptance.

The application has continued to evolve after that MVP release. Current implementation details that intentionally revise historical OCR assumptions are recorded in `docs/02-architecture/ADR-001-GEMINI-COORDINATE-OCR.md`.

The canonical phase tracker lives at `docs/06-workplan/IMPLEMENTATION-WORKPLAN.md`. Release procedures and evidence live under `docs/07-release/`.

## Technology baseline

- React 19 + Vite 8 SPA
- React Router 7
- React Hook Form + Zod
- Firebase Authentication + Cloud Firestore
- Firebase Emulator Suite for integration/security testing
- Leaflet with configurable OpenStreetMap-compatible tiles
- Gemini 3.6 Flash coordinate extraction through a direct browser-to-Gemini API request
- browser-local Gemini API-key configuration for the current client integration
- Vitest + React Testing Library
- Playwright + axe in the CI browser gate

## Architecture invariants

- Firebase Spark-compatible application path; Gemini usage is an external integration with its own quota/billing contract
- no Cloud Storage, Cloud Functions, Cloud Run, App Hosting, or custom backend dependency
- Cut Point source photos are never persisted by NOCReport or written to Firestore/Cloud Storage
- when the operator explicitly presses **Scan coordinates**, the selected image is transmitted directly from the browser to the Gemini API for coordinate extraction
- only operator-confirmed/verified coordinate metadata is persisted
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

The Gemini API key is intentionally not part of the build environment contract. The current client integration stores it in the browser's local storage through Settings and sends it with direct Gemini requests. It is not written to Firestore, GitHub, or the production bundle. Browser local storage is not a server-side secret store, so shared/untrusted browser profiles should not retain the key.

The T8 production build reads the public Web App values from `.env.example`, requires project `nocreportv2`, and forces emulator mode off. This prevents an accidental Firebase Hosting release of the local-preview/emulator configuration.

## Main routes

- `/dashboard` — bounded operational summaries and recent activity
- `/generator/new` — create a Draft Ticket
- `/tickets/:ticketId` — read-only persisted Ticket inspection
- `/generator/:ticketId/edit` — edit an existing Ticket and Progress Timeline
- `/running` — bounded Running Ticket search/actions
- `/cut-points` — map of Tickets with verified valid coordinates
- `/archive` — Admin-only Resolved/Archived lifecycle workspace
- `/settings` — Admin/Operator browser-scoped integration settings
- `/login` — Firebase Authentication entry point

Admin-only archive/restore behavior is protected by both permission-aware UI and Firestore Security Rules. Operator and Viewer behavior follows the role matrix in `docs/05-security/SECURITY-ACCESS-CONTROL-PRD.md` together with the current OCR revision in `docs/02-architecture/ADR-001-GEMINI-COORDINATE-OCR.md`.

## OCR and coordinate privacy

Cut Point source images remain local until the operator explicitly starts a scan. On **Scan coordinates**, the selected image is encoded in the browser and sent directly to the Gemini `generateContent` endpoint for coordinate extraction. NOCReport has no image-upload backend, does not write the source image to Firebase Storage or Firestore, and does not persist the image as part of Ticket data.

The Gemini response is normalized into coordinate candidates. The coordinate pipeline validates supported geographic ranges, requires operator review/confirmation where needed, and persists only verified Latitude/Longitude metadata and related coordinate provenance.

The Gemini API key is stored only in the current browser profile. Because browser local storage can be read by JavaScript running on the same origin, it must be treated as a browser-scoped credential rather than a protected server secret. Remove it from shared or untrusted browser profiles.

See `docs/02-architecture/ADR-001-GEMINI-COORDINATE-OCR.md` for the current provider, data-flow, privacy, and threat-model decision.

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
- guarded historical T8 finalization only on the legacy phase branch

The Quality workflow runs for pull requests targeting `main` and for direct pushes to `main`. Historical phase-finalizer steps are isolated to the legacy `feature/t0-repository-foundation` branch so a normal `main` quality run cannot mutate old T6–T8 tracker state.

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
- cross-tab workspace changes refresh read-only operational views while editors preserve local unsaved state and warn about newer persisted revisions.

## Documentation

Source-of-truth and current-revision documents:

- `docs/00-product/MASTER-PRD.md`
- `docs/01-ux/UI-UX-PRD.md`
- `docs/02-architecture/TECHNICAL-ARCHITECTURE-TDD.md`
- `docs/02-architecture/ADR-001-GEMINI-COORDINATE-OCR.md`
- `docs/03-data/DATA-DATABASE-PRD.md`
- `docs/04-api/API-INTEGRATION-PRD.md`
- `docs/05-security/SECURITY-ACCESS-CONTROL-PRD.md`
- `docs/06-workplan/IMPLEMENTATION-WORKPLAN.md`
- `docs/07-release/FIREBASE-DEPLOYMENT.md`
- `docs/07-release/PRODUCTION-DEPLOYMENT-EVIDENCE.md`
- `docs/07-release/AUTHENTICATED-PRODUCTION-SMOKE.md`
- `docs/07-release/AUTHENTICATED-PRODUCTION-SMOKE-EVIDENCE.md`

The baseline PRD/TDD set records the original MVP decisions. Accepted ADRs under `docs/02-architecture/` are explicit post-baseline revisions and take precedence for the decisions they name. Implementation and documentation must be reconciled before a future release is accepted.
