# T8 Production Deployment Evidence

**Project:** `nocreportv2`  
**Date:** 2026-08-24  
**Phase:** T8 — Firebase Deployment & MVP Release

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

Before the production deployment, GitHub Actions Quality #548 completed successfully on commit `2d1b36e1686723654f0beb72200fc4a449c5877f`.

That run covered the T8 release preflight, generic production build, Firebase-configured production build, Firebase Emulator integration, security/repository hygiene, and the existing browser QA gates.

## Evidence intentionally not inferred

The following T8 checks remain open until explicitly validated in production:

- Spark plan/account billing state;
- configured Firebase Authentication provider(s);
- successful production login with authorized users;
- Dashboard production data access;
- Ticket create/save lifecycle;
- Running transition and progress append;
- browser-local OCR in the deployed origin;
- coordinate persistence and Cut Point map behavior;
- Copy Report and Resolve lifecycle;
- Viewer/Operator/Admin authorization behavior against production Security Rules.

## Public Hosting smoke

Run the repository public smoke check after pulling the release branch:

```powershell
npm run release:smoke:public
```

It defaults to:

```text
https://nocreportv2.web.app
```

To test a different Firebase Hosting/custom-domain origin:

```powershell
$env:T8_PRODUCTION_URL="https://your-production-host.example"
npm run release:smoke:public
```

The public smoke test validates Hosting reachability, SPA rewrites, and published static assets. It does not replace the authenticated production workflow smoke test.

## Final T8 completion rule

T8 remains **IN PROGRESS** until the authenticated production workflow and authorization smoke checklist are accepted. After those checks pass, the canonical tracker can be marked COMPLETE and the release PR can move out of draft state.
