# Firebase Deployment & MVP Release Runbook

## Release target

- Firebase project: `nocreportv2`
- Hosting output: `dist`
- Production URL: `https://nocreportv2.web.app`
- Deployment scope: Firebase Hosting + Cloud Firestore Security Rules + Cloud Firestore indexes
- Intended billing path: Firebase Spark-compatible MVP
- Explicitly excluded: Cloud Storage, Cloud Functions, Cloud Run, App Hosting, server-side OCR, and paid Google Maps APIs

## Pricing/quota check — 2026-08-24

Official Firebase documentation was rechecked before T8 release preparation.

For the Firebase Spark plan, the current no-cost path used by this MVP includes Firebase Hosting, most Firebase Authentication providers, and Cloud Firestore within free quotas. Cloud Firestore Standard free quota currently includes 1 GiB stored data, 50,000 document reads/day, 20,000 document writes/day, 20,000 document deletes/day, and 10 GiB/month outbound transfer. Firebase Hosting Spark limits currently include 10 GB storage and 360 MB/day data transfer. Phone Authentication and paid Google Cloud products are intentionally outside this MVP release path.

Official references:

- https://firebase.google.com/pricing
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- https://firebase.google.com/docs/firestore/pricing
- https://firebase.google.com/docs/auth/limits

Always recheck these pages before a future production release because Firebase pricing and quotas can change.

## Production environment contract

The Firebase Web App values in `.env.example` are public client configuration, not service-account credentials. The deterministic production build script loads this public configuration and refuses to build if:

- `VITE_FIREBASE_PROJECT_ID` is not `nocreportv2`;
- a required Firebase Web App client value is missing;
- `VITE_USE_FIREBASE_EMULATORS` is not `false`.

Do not commit service-account JSON, private keys, refresh tokens, or any other credential material.

## Preflight

Run from the repository root:

```bash
npm ci
npm run release:preflight
npm run quality
npm run build:production
```

The T8 release preflight validates:

- `.firebaserc` targets `nocreportv2`;
- the production Firebase project ID matches the public Web App config;
- production emulator mode is disabled;
- `firebase.json` deploys `firestore.rules` and `firestore.indexes.json`;
- Firebase Hosting publishes `dist`;
- the SPA rewrite sends `**` to `/index.html`;
- no Firebase Storage/Functions configuration was introduced;
- no Cloud Run release dependency was introduced;
- release deployment commands exist.

## Firebase console preparation

These are account/project-side checks and cannot be proven by repository CI alone:

1. Open Firebase project `nocreportv2`.
2. Confirm the project remains on the intended Spark plan before release.
3. Confirm the Cloud Firestore production database exists and uses the intended Standard-edition/location configuration.
4. Confirm the required Firebase Authentication provider is enabled. The current application login flow expects a normal Firebase Authentication provider; do not enable Phone Auth unless the product requirements change.
5. Confirm Firebase Hosting is initialized for the project.
6. Do not enable Cloud Storage, Cloud Functions, Cloud Run, or App Hosting for this MVP.

## Authentication for Firebase CLI

For a developer-operated release, authenticate the Firebase CLI using your own authorized Firebase/Google account:

```bash
npx --yes firebase-tools login
npx --yes firebase-tools projects:list
```

Verify `nocreportv2` is visible before deploying. Never commit Firebase CLI credentials or exported tokens.

## Deploy Firestore only

```bash
npm run firebase:deploy:firestore
```

This deploys Security Rules and indexes only.

## Deploy Hosting only

```bash
npm run firebase:deploy:hosting
```

This automatically runs the T8 preflight and deterministic production build before deploying Hosting.

## Full MVP release

```bash
npm run firebase:deploy:release
```

This performs:

1. T8 release preflight;
2. deterministic production build with real Firebase client configuration and emulators disabled;
3. Firestore Security Rules deployment;
4. Firestore indexes deployment;
5. Firebase Hosting deployment.

## Public production smoke — PASSED 2026-08-24

After deployment, the project owner ran:

```bash
npm run release:smoke:public
```

against:

```text
https://nocreportv2.web.app
```

The smoke passed for `/`, `/login`, `/dashboard`, `/generator/new`, `/running`, and `/cut-points`, with HTTP 200 SPA-shell responses. Same-origin production assets discovered from the root document also returned HTTP 200.

This validates Firebase Hosting reachability, SPA rewrites, and published static assets only. It does not validate authenticated Firebase Auth/Firestore/RBAC behavior.

Detailed operator evidence is recorded in `docs/07-release/PRODUCTION-DEPLOYMENT-EVIDENCE.md`.

## Authenticated production smoke

The remaining final T8 gate is the authenticated production lifecycle and authorization smoke.

Use the canonical checklist:

```text
docs/07-release/AUTHENTICATED-PRODUCTION-SMOKE.md
```

Required smoke path:

- login;
- Dashboard loads;
- create/save Draft Ticket;
- Mark Running;
- append Progress;
- reload and verify persistence;
- OCR a representative Cut Point image in the deployed browser;
- verify/correct coordinates and save;
- find the Ticket in Running Tickets;
- open/focus the Ticket in Cut Point Tracker;
- Copy Report;
- Resolve Ticket;
- verify Viewer writes are denied;
- verify Operator/Admin permissions still match the documented role matrix.

Do not mark T8 complete until this smoke test passes against the production Firebase project.

## Known MVP limitations

- Spark quotas are hard limits for paid-tier Firebase products; exceeding the relevant no-cost allowance can interrupt that product until quota/reset conditions are met or the project is deliberately upgraded.
- OCR is browser-local and can be CPU/memory intensive on lower-end devices.
- OCR worker/model assets make the lazy OCR path relatively large; they must remain out of the initial Dashboard bundle.
- Cut Point basemap availability depends on the configured OpenStreetMap-compatible public tile source and network access.
- The current release has no server-side background processing, scheduled jobs, Cloud Storage photo archive, or Cloud Functions.
- Source Cut Point images are intentionally not persisted; only verified coordinate metadata is saved.
- Full production smoke testing requires real authorized Firebase users and therefore remains a release-owner action rather than a public CI test.
