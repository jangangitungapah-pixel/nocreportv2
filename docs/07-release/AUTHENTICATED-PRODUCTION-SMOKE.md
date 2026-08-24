# T8 Authenticated Production Smoke

**Project:** `nocreportv2`  
**Production URL:** `https://nocreportv2.web.app`  
**Purpose:** Final production acceptance gate for T8 — Firebase Deployment & MVP Release.

This checklist must be executed against the real production Hosting origin and production Firebase project. Emulator results, local preview results, and public HTTP-only smoke results do not replace this gate.

## Before starting

Confirm these account-side facts in Firebase Console:

- [ ] project is the intended `nocreportv2` production project;
- [ ] intended billing state/Spark plan is confirmed;
- [ ] required Firebase Authentication provider is enabled;
- [ ] at least one authorized Admin test user exists;
- [ ] Operator and Viewer test users exist when role-specific production verification is required.

Use a disposable or clearly identified smoke-test Ticket so production test data is easy to recognize and clean up/archive afterward.

Recommended smoke Ticket identifier:

```text
[T8-SMOKE-20260824]
```

## A. Admin production lifecycle

Sign in through:

```text
https://nocreportv2.web.app/login
```

Validate in this order:

- [ ] Admin login succeeds.
- [ ] Dashboard loads production data without permission/index errors.
- [ ] Open `/generator/new`.
- [ ] Create a Draft Ticket containing `[T8-SMOKE-20260824]` in the Title.
- [ ] Save the Ticket.
- [ ] Reload/open the Ticket again and confirm persisted fields remain intact.
- [ ] Mark the Ticket `RUNNING`.
- [ ] Add at least one Progress entry.
- [ ] Reload and confirm the Progress entry persists.
- [ ] Copy Report and confirm clipboard output matches the visible canonical preview.

## B. Production OCR + coordinate flow

Use a representative local Cut Point/geotag image. The image itself must remain browser-local.

- [ ] Select the local image from the deployed production page.
- [ ] OCR starts and completes in the deployed browser origin.
- [ ] A coordinate candidate is extracted, or manual coordinate entry remains available if OCR cannot confidently extract one.
- [ ] Review/correct Latitude and Longitude.
- [ ] Explicitly apply/verify the coordinate.
- [ ] Save the Ticket.
- [ ] Reload the Ticket and confirm verified coordinate metadata persists.
- [ ] Confirm no source image/photo is persisted or uploaded by the application.

## C. Running Ticket + Cut Point Tracker

- [ ] The smoke Ticket appears in Running Tickets.
- [ ] Search/open behavior works using its TT/title data.
- [ ] Quick actions required by the current role behave correctly.
- [ ] The smoke Ticket appears in Cut Point Tracker after verified coordinates are saved.
- [ ] Its map marker/popup shows the expected Ticket information.
- [ ] Open Ticket from the map works.

## D. Resolve lifecycle

- [ ] Resolve the smoke Ticket.
- [ ] Confirm it leaves the default Running Ticket dataset.
- [ ] Reopen the Ticket and confirm the resolved state persists.
- [ ] Historical record remains available according to the implemented archive/history behavior.

## E. Production RBAC

### Viewer

With a Viewer account:

- [ ] authenticated operational reads allowed by the documented role matrix succeed;
- [ ] Ticket mutation controls are absent/disabled where expected;
- [ ] direct write attempts are rejected by production Firestore Security Rules;
- [ ] Viewer cannot promote their own role.

### Operator

With an Operator account:

- [ ] normal operational Ticket actions allowed to Operator succeed;
- [ ] Admin-only controls are not exposed as usable actions;
- [ ] Admin-only mutations are rejected by production Firestore Security Rules;
- [ ] Operator cannot promote their own role.

### Admin

With an Admin account:

- [ ] documented Admin-only behavior works;
- [ ] role management behavior, when exercised, matches the Security PRD;
- [ ] protected routes remain inaccessible when signed out.

## F. Failure-state sanity checks

- [ ] Signing out returns the user to an unauthenticated/protected state.
- [ ] Direct navigation to protected application routes while signed out does not expose operational data.
- [ ] No unexpected `PERMISSION_DENIED`, missing-index, Firebase configuration, or emulator-connection error occurs during the accepted Admin lifecycle.
- [ ] No Critical/High production blocker is observed.

## Acceptance summary

T8 may be marked COMPLETE only when all release-critical checks above that apply to the production role setup are accepted and there is no blocker in the primary NOC workflow:

```text
Login
→ Dashboard
→ Create/Save Draft
→ Running
→ Progress
→ Reload/Persistence
→ OCR/Coordinate Verify
→ Running Ticket
→ Cut Point Tracker
→ Copy Report
→ Resolve
→ RBAC denial/allow matrix
```

When accepted, record:

- production URL;
- date;
- tested roles;
- smoke Ticket identifier;
- any intentionally skipped role-specific check and its reason;
- final T8 completion commit/PR/CI reference.

Do not put passwords, tokens, Firebase CLI credentials, service-account keys, or other secrets into the evidence record.
