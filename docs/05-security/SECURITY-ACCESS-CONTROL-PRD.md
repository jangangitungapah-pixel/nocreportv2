# NOC Report Template Generator — Security & Access Control PRD

**Document ID:** NOCREPORT-SEC-001  
**Version:** 0.1  
**Status:** Baseline / Security Source of Truth  
**Parent documents:** `docs/00-product/MASTER-PRD.md`, `docs/01-ux/UI-UX-PRD.md`, `docs/02-architecture/TECHNICAL-ARCHITECTURE-TDD.md`, `docs/03-data/DATA-DATABASE-PRD.md`, `docs/04-api/API-INTEGRATION-PRD.md`  
**Repository:** `jangangitungapah-pixel/nocreportv2`  
**Authentication:** Firebase Authentication  
**Authorization:** Role-based access enforced by application guards and Firestore Security Rules  
**Cloud constraint:** Firebase Spark-compatible architecture

---

# 1. Purpose

This document defines authentication, authorization, role-based access control, session behavior, Firestore Security Rules requirements, data isolation, input trust boundaries, secrets/configuration handling, abuse prevention, audit expectations, and security acceptance criteria for NOC Report Template Generator.

Security is enforced at the data boundary. UI hiding alone is never considered authorization.

---

# 2. Security Principles

## SEC-01 — Deny by default

Firestore access must be denied unless an authenticated request explicitly satisfies an allowed rule.

## SEC-02 — Authentication is mandatory for operational data

Production Ticket, Progress, Audit Event, and user-profile data must not be anonymously readable or writable.

## SEC-03 — UI permission checks are convenience only

Buttons and routes may be hidden/disabled according to role, but Firestore Security Rules remain authoritative.

## SEC-04 — Browser Firebase config is not a secret

Values such as Firebase API key, auth domain, project ID, and app ID may exist in Vite client configuration. They must never be treated as authorization controls.

Security relies on Authentication and Firestore Security Rules.

## SEC-05 — No privileged credentials in the frontend

The repository and browser bundle must never contain:

- Firebase service-account JSON;
- private keys;
- admin SDK credentials;
- OAuth client secrets intended for server-side use;
- passwords or shared operator credentials.

## SEC-06 — Least privilege

Users receive only the permissions necessary for their operational role.

## SEC-07 — No Cut Point image persistence

Cut Point photos are processed locally in the browser. The application must not persist the original image, base64 image, thumbnail, EXIF blob, or cloud-storage URL.

Only validated coordinate metadata may be persisted.

---

# 3. Authentication Model

MVP authentication uses Firebase Authentication.

Preferred baseline sign-in methods are Spark-compatible non-phone providers, initially:

- email/password; and/or
- another approved non-phone Firebase Authentication provider if later enabled.

Phone/SMS authentication is not required by the MVP.

Authenticated identity is represented by Firebase `uid`.

The application must not create its own password database.

---

# 4. User Profile and Role Model

Application authorization metadata is stored separately from Firebase Authentication identity.

Canonical path:

```text
users/{uid}
```

Baseline profile shape:

```js
{
  schemaVersion: 1,
  displayName: "Operator Name",
  email: "operator@example.com",
  role: "ADMIN" | "OPERATOR" | "VIEWER",
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

The `uid` is the document ID.

The application must not trust a role supplied by form input, query string, localStorage, or client-modified application state.

---

# 5. Canonical Roles

Persisted role values:

```text
ADMIN
OPERATOR
VIEWER
```

## ADMIN

May:

- view operational data;
- create and edit tickets;
- append/edit progress;
- change ticket status;
- update coordinates;
- archive/restore tickets;
- view audit information where exposed;
- manage user roles/profile activation when the administrative workflow is implemented.

## OPERATOR

May:

- view operational data;
- create tickets;
- edit tickets;
- append/edit progress according to product rules;
- transition operational ticket states permitted to operators;
- update/verify coordinates;
- use report generation and map features.

Operator does not receive unrestricted user-role administration.

## VIEWER

Read-only operational role.

May:

- view Dashboard data;
- view Running Tickets;
- view Ticket details;
- view Cut Point Tracker;
- generate/copy reports from readable data.

May not mutate Ticket, Progress, Coordinate, lifecycle, or user-management data.

---

# 6. Permission Matrix

| Capability | ADMIN | OPERATOR | VIEWER |
| --- | --- | --- | --- |
| Authenticate | Yes | Yes | Yes |
| Read tickets | Yes | Yes | Yes |
| Create ticket | Yes | Yes | No |
| Edit ticket fields | Yes | Yes | No |
| Add progress | Yes | Yes | No |
| Edit progress | Yes | Yes | No |
| Change Draft/Running/Resolved state | Yes | Yes | No |
| Update coordinates | Yes | Yes | No |
| View Cut Point map | Yes | Yes | Yes |
| Copy generated report | Yes | Yes | Yes |
| Archive/restore ticket | Yes | Restricted / no by baseline | No |
| Read audit events | Yes | Restricted where needed | No by baseline |
| Manage roles | Yes | No | No |
| Activate/deactivate users | Yes | No | No |

Where product requirements later need a narrower operator action, the more restrictive rule wins until this document is revised.

---

# 7. Route Access

Production routes require an authenticated session except the login/auth route.

Baseline:

```text
/login                 public-to-unauthenticated
/dashboard             authenticated
/generator/new         ADMIN, OPERATOR
/generator/:ticketId   role-dependent read/edit
/running               authenticated
/cut-points             authenticated
```

VIEWER may open the Ticket Generator route only in read-only mode if that route is reused as Ticket detail view.

Route guards improve UX but are not a replacement for Firestore Security Rules.

---

# 8. Session Handling

The app uses Firebase Authentication session persistence supported by the browser SDK.

Requirements:

- application must resolve authentication state before rendering protected operational routes;
- signed-out users are redirected to login;
- authorization must be re-evaluated when profile/role data changes;
- logout clears application-level sensitive state;
- stale ticket form data from one authenticated user must not be exposed after another user signs in on the same browser session.

The application must not store authentication passwords locally.

---

# 9. Firestore Rules Strategy

Firestore Rules must use authenticated identity plus the authoritative `users/{uid}` profile.

Conceptual helpers:

```text
isSignedIn()
currentUserProfile()
isActiveUser()
hasRole(role)
isAdmin()
isOperator()
isViewer()
canWriteOperationalData()
```

Rules must fail closed when:

- `request.auth == null`;
- user profile is absent;
- `active != true`;
- role is missing/unknown.

---

# 10. Ticket Security Rules Requirements

Path:

```text
tickets/{ticketId}
```

Reads:

- allowed to active ADMIN, OPERATOR, VIEWER.

Creates:

- allowed to active ADMIN or OPERATOR;
- `createdBy` must equal `request.auth.uid`;
- initial data must satisfy the expected field contract;
- client must not forge archive/resolve audit fields inconsistent with initial state.

Updates:

- allowed to active ADMIN or OPERATOR according to lifecycle permissions;
- immutable ownership/audit fields must not be arbitrarily rewritten;
- `updatedBy` must equal `request.auth.uid`;
- revision must advance according to repository contract;
- coordinate values, when present, must be numeric and geographically valid;
- role/profile fields do not belong in Ticket documents.

Deletes:

- hard delete is denied for normal MVP clients.

Archive uses lifecycle mutation, not document deletion.

---

# 11. Progress Security Rules Requirements

Path:

```text
tickets/{ticketId}/progress/{progressId}
```

Reads:

- allowed to active authenticated operational roles.

Creates/updates:

- ADMIN or OPERATOR only;
- `createdBy`/`updatedBy` must match authenticated uid as appropriate;
- progress text must be a non-empty string;
- timestamps must conform to repository contract.

Deletes:

- baseline should prefer logical/application-controlled removal or admin/operator permission narrowly defined by the final repository implementation;
- arbitrary unauthenticated delete is denied.

---

# 12. Audit Event Security

Path:

```text
tickets/{ticketId}/auditEvents/{eventId}
```

Audit events are append-oriented.

Client rules must prevent ordinary users from rewriting historical audit events.

Baseline:

- create allowed only as part of an authorized operational mutation pattern supported by the repository/rules design;
- update denied;
- delete denied;
- read restricted, with ADMIN always allowed and OPERATOR access only if product UI requires it.

Because the MVP has no trusted server, audit records improve operational traceability but must not be marketed as tamper-proof forensic logs.

---

# 13. User Profile Security

Path:

```text
users/{uid}
```

Baseline policy:

- authenticated users may read their own profile;
- ADMIN may read profiles required for administration;
- ordinary users cannot promote their own role;
- OPERATOR/VIEWER cannot write `role` or `active` for themselves or others;
- ADMIN-only role management must be enforced by Security Rules, not merely by hiding controls.

Initial bootstrap of the first ADMIN is an explicit deployment/admin setup operation and must not rely on a public self-promotion path.

---

# 14. Coordinate Security

Coordinates are operational metadata.

Requirements:

```text
-90 <= latitude <= 90
-180 <= longitude <= 180
```

If `hasCoordinates == true`, a valid coordinate object must exist.

If coordinates are removed, `hasCoordinates` must become false in the same logical mutation.

Security Rules should validate invariants that are practical in Firestore Rules. Domain validation remains responsible for richer parsing and normalization.

No Security Rule or database contract requires image persistence.

---

# 15. Input Trust Boundaries

All client inputs are untrusted, including:

- Title;
- Impact List;
- PIC;
- Rootcause;
- Cut Point;
- Progress text;
- manually entered coordinates;
- OCR-derived text;
- query parameters;
- localStorage values;
- imported future integration payloads.

The application must perform runtime schema validation before persistence.

Firestore Rules provide a second enforcement boundary for security-sensitive invariants.

---

# 16. XSS and Rendering Safety

Operational text is rendered as text, not trusted HTML.

Requirements:

- React text rendering is the default;
- do not use `dangerouslySetInnerHTML` for Ticket/Progress content;
- generated report is plain text;
- copied report does not require HTML injection;
- URLs or future rich text must be explicitly sanitized/validated before rendering as interactive content.

---

# 17. File/OCR Security

Cut Point image processing occurs locally.

Requirements:

- accept only approved browser-supported image MIME/types;
- enforce reasonable client-side size limits to prevent accidental resource exhaustion;
- revoke object URLs when no longer needed;
- terminate/reuse OCR workers intentionally;
- never execute file content;
- do not persist image data to Firestore;
- do not upload image data to Cloud Storage in MVP;
- OCR output is treated as untrusted candidate text and must pass coordinate validation.

---

# 18. Environment and Secret Management

Repository may include:

```text
.env.example
```

Repository must ignore real local environment files.

Firebase browser configuration may use `VITE_*` variables.

Never commit:

```text
service-account.json
*.pem
private keys
admin credentials
real user passwords
```

GitHub Actions secrets are used only if a later deployment workflow genuinely requires secrets.

The development CI quality workflow should not require production credentials.

---

# 19. Abuse and Quota Protection

The application targets Firebase Spark Plan, so accidental excessive usage is also an operational-security concern.

Requirements:

- no write on every keystroke;
- bounded/paginated list queries;
- no unbounded `getAllTickets()` operation;
- no unnecessary high-frequency listeners;
- OCR runs only after explicit image selection/user action;
- repeated mutation actions must disable/debounce while a request is already in flight where duplicate writes are possible;
- future public integrations require rate-limit/abuse design before enablement.

---

# 20. Concurrency and Integrity

Revision-based optimistic concurrency defined in Data/API specifications must be preserved.

Security/integrity expectations:

- stale writes must not silently overwrite newer Ticket state;
- status transitions use expected revision;
- targeted progress mutations preserve Ticket summary integrity;
- mutations that update multiple related documents use Firestore transaction/batch where required;
- client-generated audit metadata must identify the authenticated actor.

---

# 21. Offline Behavior

Firestore browser caching/offline behavior must not weaken authorization assumptions.

The UI must distinguish local pending state from confirmed persisted state where relevant.

A user losing permission must not be treated as authorized merely because stale client data remains cached.

Sensitive mutation errors such as permission denied must be surfaced clearly and normalized through the application error contract.

---

# 22. Security Error Handling

Application-facing categories include:

```text
AUTH_REQUIRED
AUTH_FAILED
ACCOUNT_DISABLED
PERMISSION_DENIED
STALE_DATA
VALIDATION_ERROR
NETWORK_ERROR
```

The UI may show actionable messages but should not leak unnecessary internal Firebase implementation details.

---

# 23. Security Testing Requirements

Security validation must include Firebase Emulator Suite tests for Firestore Rules.

Minimum test matrix:

- unauthenticated user cannot read tickets;
- unauthenticated user cannot write tickets;
- VIEWER can read but cannot mutate;
- OPERATOR can create/update allowed operational data;
- OPERATOR cannot self-promote role;
- ADMIN can perform approved administrative operations;
- inactive user is denied;
- normal client cannot hard-delete Ticket;
- invalid coordinates are denied where rules validate them;
- forged `createdBy`/`updatedBy` identities are denied;
- audit event rewrite/delete is denied;
- user cannot arbitrarily modify another user's role.

Rules tests are mandatory before T7 can be completed.

---

# 24. MVP Security Non-Goals

MVP does not claim to provide:

- enterprise SSO/SAML;
- hardware security keys as a required login factor;
- custom server-side IAM;
- tamper-proof forensic event sourcing;
- public API authentication;
- multi-tenant isolation;
- Cloud Storage image authorization;
- webhook signing because external webhooks are not part of MVP.

These require explicit future architecture revisions.

---

# 25. Security Acceptance Criteria

Security baseline is accepted when:

1. all production operational routes require authentication;
2. role is derived from authoritative profile data;
3. VIEWER cannot perform writes;
4. OPERATOR cannot alter authorization roles;
5. hard Ticket deletion is denied to normal MVP client workflows;
6. Firestore Rules enforce authenticated operational access;
7. Firestore Emulator rule tests cover the permission matrix;
8. no service-account/private server credentials exist in the browser repository;
9. real `.env` files are ignored;
10. user-authored report/progress content is rendered as text;
11. Cut Point photos remain browser-local and are never persisted;
12. only validated coordinate metadata is saved;
13. stale write/concurrency errors cannot silently overwrite newer data;
14. Security Rules and application authorization behavior agree.

---

# 26. Final Security Rule

The core security model is:

```text
Firebase Authentication
        ↓
users/{uid} active role profile
        ↓
Application route/action guard
        ↓
Repository validation
        ↓
Firestore Security Rules
        ↓
Ticket / Progress / Audit data
```

The application must assume that every browser can be manipulated by its user. Therefore, any permission that matters must be enforced at the Firestore boundary, not merely in React UI code.
