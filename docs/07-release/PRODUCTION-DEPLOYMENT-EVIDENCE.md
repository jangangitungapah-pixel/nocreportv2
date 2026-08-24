# T8 Production Deployment Evidence

**Project:** `nocreportv2`  
**Date:** 2026-08-24  
**Phase:** T8 — Firebase Deployment & MVP Release
**Production URL:** `https://nocreportv2.web.app`

## Confirmed deployment evidence

The project owner confirmed from the production workstation that the Firebase deployment completed successfully and Firebase Hosting is live.

This confirmation is accepted as operator evidence for the following T8 release facts:

- the intended production Firebase project was reachable by the authenticated Firebase CLI;
- the release command completed successfully;
- Firestore Security Rules were deployed as part of the full release command;
- Firestore indexes were deployed as part of the full release command;
- Firebase Hosting deployment succeeded;
- the production build completed successfully on Windows after the Node 24 cross-platform build fix.

## Repository validation evidence

GitHub Actions Quality #570 completed successfully on commit `4c66ad557dba0ccd28c5739634abcb79a060d606`.

That run covered committed formatting verification, lint, unit/component tests, Firebase Emulator integration, Firestore Security Rules role-matrix tests, security/repository hygiene, T8 release preflight, generic production build, Firebase-configured production build, dev-server smoke, real-browser viewport/touch QA, and the Playwright lifecycle/RBAC/responsive/accessibility suite.

The same release-preparation work also corrected the Dashboard loading-state accessibility semantics by assigning the labeled loading container an appropriate `status` role. The corrected state passes the Playwright/axe gate.

## Public Hosting smoke — PASSED

On 2026-08-24 the project owner ran:

```powershell
npm run release:smoke:public
```

against the canonical production origin:

```text
https://nocreportv2.web.app
```

The public production smoke passed with HTTP 200 responses for the React SPA shell on:

- `/`
- `/login`
- `/dashboard`
- `/generator/new`
- `/running`
- `/cut-points`

The published production asset requests discovered from the root document also returned HTTP 200, including the main JavaScript/CSS bundles and shared application chunks.

Accepted conclusion:

- Firebase Hosting is reachable;
- SPA rewrites are working for direct route requests;
- the deployed React shell is being served on all primary routes;
- production static assets referenced by the shell are reachable.

This public smoke intentionally does **not** prove authenticated Firebase Auth/Firestore/RBAC behavior or the full NOC lifecycle.

## Evidence intentionally not inferred

The following T8 checks remain open until explicitly validated in production:

- Spark plan/account billing state;
- configured Firebase Authentication provider(s);
- successful production login with authorized users;
- Dashboard production data access after authentication;
- Ticket create/save lifecycle;
- Running transition and progress append;
- browser-local OCR in the deployed origin;
- coordinate persistence and Cut Point map behavior;
- Copy Report and Resolve lifecycle;
- Viewer/Operator/Admin authorization behavior against production Security Rules.

## Authenticated production smoke

Use `docs/07-release/AUTHENTICATED-PRODUCTION-SMOKE.md` for the final T8 acceptance sequence.

The authenticated smoke must exercise the actual production origin and production Firebase project with authorized test users. Do not substitute Emulator Suite results for this final gate.

## Final T8 completion rule

T8 remains **IN PROGRESS — authenticated production smoke pending** until the authenticated production workflow and authorization checklist are accepted. After those checks pass, the canonical tracker can be marked COMPLETE and the release PR can move out of draft state.
