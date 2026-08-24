# T8 Production Deployment Evidence

**Project:** `nocreportv2`  
**Date:** 2026-08-24  
**Phase:** T8 — Firebase Deployment & MVP Release  
**Production URL:** `https://nocreportv2.web.app`  
**Final Result:** PASS — MVP RELEASED

## Confirmed deployment evidence

The project owner confirmed from the production workstation that the Firebase deployment completed successfully and Firebase Hosting is live.

Accepted deployment facts:

- the intended production Firebase project was reachable by the authenticated Firebase CLI;
- the release command completed successfully;
- Firestore Security Rules were deployed;
- Firestore indexes were deployed;
- Firebase Hosting deployment succeeded;
- the production build completed successfully on Windows after the Node 24 cross-platform build fix.

## Repository validation evidence

GitHub Actions Quality #590 completed successfully on release commit `3623afdf4078d390f268107e5257fe313cb30ce1`.

That run covered committed formatting verification, lint, unit/component tests, Firebase Emulator integration, Firestore Security Rules role-matrix tests, security/repository hygiene, T8 release preflight, generic production build, Firebase-configured production build, dev-server smoke, real-browser viewport/touch QA, and the Playwright lifecycle/RBAC/responsive/accessibility suite.

The release-preparation work also corrected the Dashboard loading-state accessibility semantics by assigning the labeled loading container an appropriate `status` role. The corrected state passes the Playwright/axe gate.

## Public Hosting smoke — PASSED

On 2026-08-24 the project owner ran:

```powershell
npm run release:smoke:public
```

against:

```text
https://nocreportv2.web.app
```

HTTP 200 React SPA-shell responses were confirmed for:

- `/`
- `/login`
- `/dashboard`
- `/generator/new`
- `/running`
- `/cut-points`

Published JavaScript/CSS assets discovered from the root document also returned HTTP 200.

Accepted conclusion:

- Firebase Hosting is reachable;
- SPA rewrites work for direct route requests;
- the deployed React shell is served on all primary routes;
- referenced production static assets are reachable.

## Authenticated production acceptance — PASSED

The project owner subsequently confirmed that the complete authenticated production smoke passed against the real production origin and Firebase project.

Accepted production behavior includes:

- authorized login;
- Dashboard and Firestore access;
- Ticket create/save and reload persistence;
- Running transition;
- Progress append and reload persistence;
- deployed-browser OCR;
- verified coordinate persistence;
- Running Tickets;
- Cut Point Tracker and map interaction;
- Copy Report;
- Resolve lifecycle;
- signed-out protected-route behavior;
- Viewer, Operator, and Admin allow/deny behavior against production Security Rules.

The intended Firebase Spark plan/account billing state and required Firebase Authentication provider were explicitly confirmed. No Critical/High production blocker was observed.

The detailed acceptance record is stored in:

`docs/07-release/AUTHENTICATED-PRODUCTION-SMOKE-EVIDENCE.md`

## Final T8 conclusion

T8 is **COMPLETE**. The canonical tracker records the project as **MVP RELEASED** at `https://nocreportv2.web.app`.
