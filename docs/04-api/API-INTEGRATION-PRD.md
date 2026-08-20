# NOC Report Template Generator — API & Integration PRD

**Document ID:** NOCREPORT-API-001  
**Version:** 0.1  
**Status:** Baseline / Integration Contract Source of Truth  
**Parent documents:** `docs/00-product/MASTER-PRD.md`, `docs/01-ux/UI-UX-PRD.md`, `docs/02-architecture/TECHNICAL-ARCHITECTURE-TDD.md`, `docs/03-data/DATA-DATABASE-PRD.md`  
**Repository:** `jangangitungapah-pixel/nocreportv2`  
**Runtime model:** Browser SPA using Firebase Web SDK through application adapters  
**MVP backend model:** No custom server, no Cloud Functions, no REST server  
**Cloud constraint:** Firebase Spark-compatible architecture

---

# 1. Purpose

This document defines the application-facing API contracts and integration boundaries for NOC Report Template Generator.

For the MVP, the word **API** does not mean a public HTTP/REST backend. The application is a React/Vite browser SPA and communicates with Firebase through the Firebase Web SDK. Therefore, this document defines the stable contracts between UI/features and infrastructure adapters such as:

- Ticket Repository;
- Progress Repository operations;
- Dashboard queries;
- Cut Point queries;
- Authentication adapter;
- OCR adapter;
- coordinate parser;
- map adapter;
- clipboard integration;
- future external integrations.

The UI must depend on these application contracts rather than directly depending on Firestore implementation details.

If the application later introduces a backend API, the public feature contracts in this document should remain stable where practical and only the infrastructure implementation should change.

Security enforcement, authorization rules, and Firebase Security Rules are defined in the Security & Access Control PRD.

---

# 2. API Architecture Principles

## API-01 — No unnecessary backend server

The MVP must not introduce Express, Fastify, Next.js API routes, Cloud Functions, Cloud Run, or another server layer merely to proxy Firestore operations.

The baseline flow is:

```text
React Feature
    ↓
Application Service / Repository Contract
    ↓
Firebase Adapter
    ↓
Firebase Web SDK
    ↓
Cloud Firestore / Firebase Auth
```

This keeps the MVP compatible with the Spark-only architecture.

## API-02 — UI never owns persistence implementation

React components must not contain scattered raw Firestore calls.

Bad:

```js
await updateDoc(doc(db, 'tickets', id), ...)
```

inside many unrelated components.

Preferred:

```js
await ticketRepository.updateTicket(...)
```

The repository owns:

- Firestore references;
- query construction;
- transactions/batches;
- timestamp mapping;
- validation boundaries;
- error normalization;
- persistence normalization.

## API-03 — Contracts return domain-friendly values

Application consumers should receive normalized JavaScript domain objects, not raw Firestore snapshots.

The UI must not need to understand:

- `DocumentSnapshot`;
- `QuerySnapshot`;
- Firestore sentinel values;
- raw Firebase error codes;
- Firestore reference paths.

## API-04 — Mutations are explicit

No API operation persists on each keystroke.

Mutation contracts correspond to deliberate user actions such as:

- Save Ticket;
- Mark Running;
- Add Progress;
- Update Progress;
- Update Coordinates;
- Resolve Ticket;
- Archive Ticket.

## API-05 — Optimistic concurrency is mandatory

Mutations that overwrite existing Ticket state must carry the revision the user last loaded.

The repository must reject stale writes instead of silently overwriting a newer revision.

## API-06 — Structured errors

Infrastructure errors must be normalized into application error codes.

Components must not parse raw Firebase error messages.

## API-07 — Pagination and bounded queries

List/query contracts must be bounded.

Historical ticket APIs must not expose an accidental `getAllTickets()` contract that downloads the entire Firestore dataset.

## API-08 — Integrations are replaceable adapters

OCR, maps, clipboard, Firebase, and future third-party integrations must be isolated behind interfaces/modules so product features do not become coupled to one provider.

---

# 3. API Layers

The application uses three conceptual layers.

```text
Feature / UI
     ↓
Application Contract
     ↓
Infrastructure Adapter
     ↓
External SDK / Browser API
```

Example:

```text
RunningTicketsPage
     ↓
listRunningTickets()
     ↓
FirestoreTicketRepository
     ↓
Cloud Firestore
```

Example OCR:

```text
CoordinateExtractor
     ↓
extractCoordinateCandidates(file)
     ↓
BrowserOcrAdapter
     ↓
Tesseract.js Worker
```

---

# 4. Suggested Contract Modules

Target modules:

```text
src/entities/ticket/repository/
├── ticketRepository.js
├── ticketQueryContract.js
└── ticketMutationContract.js

src/infrastructure/firebase/
├── firestoreTicketRepository.js
├── firestoreMappers.js
├── firestoreQueries.js
├── firestoreMutations.js
└── firebaseErrors.js

src/infrastructure/ocr/
├── ocrClient.js
├── extractWatermarkText.js
└── coordinateCandidates.js

src/infrastructure/maps/
├── mapConfig.js
└── mapAdapter.js

src/shared/lib/
└── clipboard.js
```

Exact file decomposition may evolve, but boundaries must remain clear.

---

# 5. Common Result Contract

Repository functions may either throw normalized `AppError` instances or return a typed result-style object. The project must choose one convention and use it consistently.

Recommended baseline: successful functions return domain values and failures throw `AppError`.

Conceptual shape:

```js
class AppError extends Error {
  constructor(code, message, details = null, cause = null) {
    super(message)
    this.code = code
    this.details = details
    this.cause = cause
  }
}
```

UI code must branch on `error.code`, not Firebase SDK strings.

---

# 6. Canonical Error Codes

Minimum application error contract:

```text
VALIDATION_ERROR
NOT_AUTHENTICATED
PERMISSION_DENIED
NOT_FOUND
CONFLICT
STALE_REVISION
NETWORK_ERROR
OFFLINE_ERROR
QUOTA_EXCEEDED
PERSISTENCE_ERROR
QUERY_ERROR
OCR_ERROR
OCR_NO_COORDINATE
OCR_AMBIGUOUS
INVALID_COORDINATE
MAP_ERROR
CLIPBOARD_ERROR
UNSUPPORTED_FILE
FILE_TOO_LARGE
UNKNOWN_ERROR
```

## 6.1 Validation error

Example:

```js
{
  code: 'VALIDATION_ERROR',
  details: {
    fields: {
      title: 'Title is required before ticket can become Running.'
    }
  }
}
```

## 6.2 Stale revision

Example:

```js
{
  code: 'STALE_REVISION',
  details: {
    ticketId: 'abc123',
    expectedRevision: 7,
    currentRevision: 8
  }
}
```

The UI must surface this as a conflict requiring reload/review, not as a generic save failure.

---

# 7. Ticket Repository Contract

Conceptual interface:

```js
const ticketRepository = {
  createTicket,
  getTicketById,
  saveTicket,
  transitionTicketStatus,
  listRunningTickets,
  listTickets,
  listCutPointTickets,
  getDashboardSummary,
  appendProgress,
  updateProgress,
  removeProgress,
  listProgress,
  updateCoordinate,
  clearCoordinate,
  archiveTicket,
  restoreTicket,
}
```

The implementation may split queries and mutations into separate modules, but feature-facing behavior must remain equivalent.

---

# 8. createTicket()

Purpose: create a new Ticket record.

Conceptual request:

```js
createTicket({
  title,
  impactList,
  occurAt,
  dispatchAt,
  pic,
  rootcause,
  cutPoint,
  coordinate,
  status,
})
```

Defaults:

```text
status = DRAFT
progressCount = 0
latestProgress = null
revision = 1
schemaVersion = 1
```

The repository derives/sets:

- Firestore document ID;
- normalized `externalTtNumber` when detectable;
- `hasCoordinates`;
- `createdAt`;
- `createdBy`;
- `updatedAt`;
- `updatedBy`;
- lifecycle timestamps;
- initial audit event.

Conceptual response:

```js
{
  ticketId: 'abc123',
  ticket: normalizedTicket
}
```

## Atomicity

Creation should use a batch so the Ticket and `TICKET_CREATED` audit event succeed together where practical.

A Firestore document reference may be generated before the batch is committed, allowing the audit event path to be known.

---

# 9. getTicketById()

Conceptual request:

```js
getTicketById(ticketId)
```

Response:

```js
normalizedTicket
```

Errors:

```text
NOT_FOUND
NOT_AUTHENTICATED
PERMISSION_DENIED
NETWORK_ERROR
PERSISTENCE_ERROR
```

The returned object must be normalized and schema-validated before entering feature state.

Progress Timeline is not required to be embedded in this response because progress has its own subcollection.

---

# 10. saveTicket()

Purpose: save edits to Ticket core fields.

Conceptual request:

```js
saveTicket({
  ticketId,
  expectedRevision,
  patch: {
    title,
    impactList,
    occurAt,
    dispatchAt,
    pic,
    rootcause,
    cutPoint,
  }
})
```

The operation must not allow arbitrary uncontrolled document fields.

The repository uses an allowlist of mutable fields.

## Transaction rule

Use a Firestore transaction:

1. Read current Ticket.
2. Verify it exists.
3. Verify current `revision === expectedRevision`.
4. Validate allowed state.
5. Normalize derived fields such as `externalTtNumber`.
6. Write allowed field patch.
7. Increment revision.
8. Set `updatedAt` and `updatedBy`.
9. Write appropriate audit event where required.

Conceptual response:

```js
{
  ticket: updatedNormalizedTicket,
  revision: 8
}
```

A stale edit returns `STALE_REVISION`.

---

# 11. transitionTicketStatus()

Purpose: perform explicit lifecycle transitions.

Conceptual request:

```js
transitionTicketStatus({
  ticketId,
  expectedRevision,
  toStatus: 'RUNNING'
})
```

Allowed transition matrix is enforced by domain validation and Security Rules where feasible.

Expected transitions:

```text
DRAFT    → RUNNING
RUNNING  → RESOLVED
RESOLVED → ARCHIVED
DRAFT    → ARCHIVED    when authorized
RUNNING  → ARCHIVED    restricted/admin workflow
ARCHIVED → previous supported state through explicit restore workflow
```

The exact restore semantics are defined by product/security rules.

When resolving:

```text
resolvedAt
resolvedBy
```

are written atomically with status.

When archiving:

```text
archivedAt
archivedBy
```

are written atomically with status.

Every successful transition writes `STATUS_CHANGED` or the relevant specialized audit event.

---

# 12. appendProgress()

Purpose: append one operational Progress Timeline entry without saving/replacing the entire Ticket form.

Conceptual request:

```js
appendProgress({
  ticketId,
  expectedRevision,
  occurredAt,
  text,
})
```

Validation:

- Ticket exists;
- user may edit Ticket;
- text is non-empty after outer trim;
- `occurredAt` is a valid datetime;
- expected revision is current.

## Transaction behavior

The operation must atomically coordinate:

1. new `progress/{progressId}` document;
2. parent `progressCount + 1`;
3. parent `latestProgress` when this entry is chronologically latest;
4. parent `updatedAt`;
5. parent `updatedBy`;
6. parent `revision + 1`;
7. audit event.

A Firestore transaction is the baseline because the operation depends on current revision/count/latest state.

Response:

```js
{
  progress: normalizedProgress,
  ticketRevision: 9,
  latestProgress: normalizedLatestProgress,
  progressCount: 15
}
```

---

# 13. updateProgress()

Conceptual request:

```js
updateProgress({
  ticketId,
  progressId,
  expectedRevision,
  occurredAt,
  text,
})
```

The repository must account for the possibility that editing this entry changes which entry is chronologically latest.

If the edited entry was or becomes the latest entry, `latestProgress` must be recalculated deterministically.

If recalculation is needed, repository may query the minimal number of progress records required to identify the latest remaining entry.

The parent Ticket revision increments on success.

---

# 14. removeProgress()

Purpose: remove an incorrect Progress Timeline entry when user permission allows.

Conceptual request:

```js
removeProgress({
  ticketId,
  progressId,
  expectedRevision,
})
```

Behavior:

- delete the progress document;
- decrement `progressCount`, never below zero;
- recalculate `latestProgress` if necessary;
- increment Ticket revision;
- update parent audit metadata;
- create `PROGRESS_REMOVED` audit event.

MVP does not require a full deleted-progress content archive unless the Security PRD later mandates one.

---

# 15. listProgress()

Conceptual request:

```js
listProgress({
  ticketId,
  pageSize = 100,
  cursor = null,
  direction = 'asc'
})
```

Canonical ordering:

```text
occurredAt ASC
createdAt ASC
progressId ASC
```

For typical Ticket Generator usage, enough progress entries may be loaded to render the operational report.

The repository must still support bounded pagination for unusually long incidents.

Conceptual response:

```js
{
  items: [...progressEntries],
  nextCursor: opaqueCursorOrNull,
  hasMore: false
}
```

Cursor values are infrastructure concerns and should be opaque to UI code.

---

# 16. updateCoordinate()

Purpose: persist confirmed latitude/longitude metadata.

Conceptual request:

```js
updateCoordinate({
  ticketId,
  expectedRevision,
  coordinate: {
    latitude: -6.12345,
    longitude: 107.12345,
    source: 'ocr',
    detectedFormat: 'DMS'
  }
})
```

Repository validation:

```text
-90 <= latitude <= 90
-180 <= longitude <= 180
```

On success repository sets:

```text
coordinate.latitude
coordinate.longitude
coordinate.source
coordinate.detectedFormat
coordinate.verified = true
coordinate.verifiedAt
coordinate.verifiedBy
hasCoordinates = true
updatedAt
updatedBy
revision + 1
```

and creates `COORDINATE_UPDATED` audit event.

No photo bytes, base64, filename, Storage URL, or raw image are accepted by this API.

This is an explicit contract rule.

---

# 17. clearCoordinate()

Conceptual request:

```js
clearCoordinate({
  ticketId,
  expectedRevision,
})
```

Atomic result:

```js
coordinate = null
hasCoordinates = false
```

The operation increments revision and writes an audit event.

The Cut Point narrative string is not cleared automatically.

---

# 18. listRunningTickets()

Purpose: power the Running Ticket operational workspace.

Conceptual request:

```js
listRunningTickets({
  limit = 100,
  sort = 'updated-desc'
})
```

Primary Firestore filter:

```text
status == RUNNING
```

Typical order:

```text
updatedAt DESC
```

Response rows may use Ticket parent summary fields, especially `latestProgress`, and must not read each Ticket's full Progress subcollection simply to render the list.

## Running Ticket search

The Master Product PRD requires search over:

- external TT number;
- Title;
- PIC;
- Cut Point.

Firestore does not provide a general substring full-text search primitive suitable for arbitrary fields.

Therefore MVP behavior is:

1. query the bounded active Running Ticket working set;
2. perform case-insensitive client-side filtering across the required fields;
3. keep the working set bounded by repository limits;
4. if future historical/full-text scale requires server-side indexing, introduce a dedicated search solution through an explicit architecture revision.

The MVP must not add Algolia/Elastic/paid search merely to satisfy a small Running Ticket set.

---

# 19. listTickets()

Purpose: generic bounded historical/query access.

Conceptual request:

```js
listTickets({
  statuses = null,
  externalTtNumber = null,
  occurredFrom = null,
  occurredTo = null,
  updatedFrom = null,
  updatedTo = null,
  limit = 50,
  cursor = null,
  orderBy = 'updatedAt',
  direction = 'desc'
})
```

Response:

```js
{
  items: [...tickets],
  nextCursor: opaqueCursorOrNull,
  hasMore: true
}
```

Rules:

- no unbounded list call;
- cursor-based pagination, not large offset pagination;
- query only indexed/supported combinations;
- unsupported query combinations fail clearly rather than silently downloading everything.

---

# 20. listCutPointTickets()

Purpose: load map marker source data.

Conceptual request:

```js
listCutPointTickets({
  statuses = ['RUNNING', 'RESOLVED'],
  limit = 500,
  cursor = null,
})
```

Primary persisted filter:

```text
hasCoordinates == true
```

The query must exclude records that the current user may not see.

Each result must have validated numeric coordinates before reaching the map adapter.

The map feature must not read a separate `mapMarkers` collection.

For future high-volume datasets, map viewport/geospatial query strategy may be introduced through a later TDD revision. It is not necessary for MVP scale.

---

# 21. getDashboardSummary()

Purpose: provide operational Dashboard data without downloading full history.

Conceptual response:

```js
{
  runningCount: 4,
  ticketsTodayCount: 8,
  resolvedTodayCount: 3,
  cutPointCount: 12,
  recentlyUpdated: [...tickets],
}
```

Implementation may use:

- bounded Ticket queries;
- Firestore aggregation queries where appropriate;
- direct Running Ticket query;
- recent activity query.

Do not introduce manually maintained global counter documents unless measurements prove they materially reduce cost and complexity.

Dashboard data does not need to be perfectly realtime to the millisecond.

---

# 22. Cursor Contract

Pagination cursor is opaque outside the repository.

Feature code may store/pass:

```js
nextCursor
```

but must not inspect internal Firestore snapshot fields.

This allows the repository implementation to change without rewriting UI components.

The cursor exists only in client runtime and does not need to be persisted in Firestore.

---

# 23. Firestore Query Contract

All production query patterns must be represented in `firestore.indexes.json` when composite indexes are required.

Expected query families include:

```text
RUNNING tickets ordered by updatedAt
Tickets ordered by updatedAt
Tickets filtered by status and ordered by updatedAt
Tickets filtered by hasCoordinates and ordered by updatedAt
Tickets filtered by externalTtNumber
Progress ordered by occurredAt/createdAt
```

Exact composite indexes are finalized during implementation/emulator testing.

A missing-index Firebase error during development must be resolved by adding the required index definition, not by falling back to an unbounded client download.

---

# 24. Realtime Subscription Contract

Realtime listeners are optional and must be intentionally scoped.

Potentially useful MVP subscriptions:

```js
subscribeRunningTickets(options, onData, onError)
```

or:

```js
subscribeTicket(ticketId, onData, onError)
```

Rules:

- do not subscribe to all historical tickets;
- do not create duplicate listeners for the same data unnecessarily;
- listeners must unsubscribe on component unmount;
- realtime behavior must not bypass stale-edit protections;
- explicit Save remains the Generator mutation model.

Initial implementation may use one-time reads first and add realtime listeners only where operational value is clear.

---

# 25. Transaction and Batch Rules

Use transactions when mutation correctness depends on existing persisted state.

Examples:

- revision validation;
- progress count increment/decrement;
- latest progress comparison;
- lifecycle transitions;
- concurrent updates.

Use batch writes when several independent writes should commit together but do not require reading current values first.

Example:

- initial Ticket document + initial audit event after generating a Ticket reference.

Never rely on a sequence of unrelated client writes when partial success would create inconsistent Ticket metadata.

---

# 26. Retry and Idempotency Rules

Firestore SDK may retry transactions internally.

Transaction callbacks therefore must not trigger external side effects such as:

- toast messages;
- clipboard writes;
- analytics events;
- file operations;
- browser navigation.

Those happen only after the transaction promise resolves successfully.

User-triggered mutation buttons must protect against accidental double submission while a request is pending.

For operations such as progress append, the repository should generate the progress document reference/ID before the transaction where helpful so retries do not create duplicate logical updates.

---

# 27. Offline and Connectivity Contract

The application must distinguish between:

- loading;
- offline/browser unavailable network;
- Firestore request failure;
- permission failure;
- quota failure.

The MVP may use Firebase client caching, but it must not present locally queued/uncertain writes as definitely server-confirmed without appropriate state feedback.

Save UI states should conceptually distinguish:

```text
Saving
Saved
Save failed
Offline / pending connectivity
Conflict
```

Exact Firebase offline persistence behavior is finalized during implementation testing.

---

# 28. OCR Integration Contract

OCR runs locally in the browser.

Public feature-facing contract:

```js
extractCoordinateCandidates(file, options?)
```

Conceptual result:

```js
{
  status: 'detected',
  rawText: '...',
  candidates: [
    {
      latitude: -6.12345,
      longitude: 107.12345,
      detectedFormat: 'DMS',
      confidence: 0.91,
      evidence: '...'
    }
  ]
}
```

Possible statuses:

```text
detected
ambiguous
not_found
unsupported_file
processing_error
```

`rawText` and OCR evidence are browser-local processing results and are not automatically persisted.

## OCR cancellation

The integration should support cancellation/disposal when:

- user selects another image;
- route changes;
- component unmounts;
- processing is manually cancelled.

A stale OCR result must never overwrite coordinates derived from a newer image selection.

---

# 29. Coordinate Parser Contract

Coordinate parsing is a pure local domain integration, not a cloud API.

Conceptual contract:

```js
parseCoordinateText(text)
```

Result:

```js
{
  status: 'detected' | 'ambiguous' | 'not_found' | 'invalid',
  candidates: [...]
}
```

Supported baseline formats:

```text
DD
DMS
DDM
hemisphere variants
common OCR spacing/symbol variants
```

Normalization contract:

```js
normalizeCoordinate(candidate)
```

returns numeric latitude/longitude plus standard five-decimal display values.

The parser must not persist anything by itself.

---

# 30. Map Integration Contract

Map implementation baseline:

```text
Leaflet
OpenStreetMap-compatible configurable tile provider
```

Feature-facing data contract should remain provider-neutral.

Conceptual marker input:

```js
{
  id: ticketId,
  latitude: -6.12345,
  longitude: 107.12345,
  title,
  externalTtNumber,
  status,
  cutPoint,
  pic,
  rootcause,
  updatedAt,
}
```

The map adapter must not fetch Firestore data directly.

Flow:

```text
CutPointTrackerPage
      ↓
listCutPointTickets()
      ↓
normalized Ticket marker models
      ↓
Map component / Leaflet adapter
```

This separates data retrieval from rendering provider.

---

# 31. Tile Provider Configuration

Tile provider configuration comes from environment/configuration, not hardcoded feature logic.

Example:

```text
VITE_MAP_TILE_URL
VITE_MAP_ATTRIBUTION
```

Map attribution must be rendered according to provider requirements.

If the project later changes tile provider, Ticket and map domain contracts should not change.

---

# 32. Clipboard Integration Contract

Feature-facing helper:

```js
copyTextToClipboard(text)
```

The Report Preview passes the exact output from:

```js
formatTicketReport(ticket)
```

No separate clipboard formatter is allowed.

Success:

```js
{ copied: true }
```

Failure normalizes to:

```text
CLIPBOARD_ERROR
```

Clipboard integration does not modify Ticket state.

---

# 33. Firebase Authentication Adapter

Authentication adapter provides a small application-facing contract.

Conceptual interface:

```js
const authClient = {
  signIn,
  signOut,
  subscribeAuthState,
  getCurrentUser,
}
```

The feature layer should receive normalized application identity such as:

```js
{
  uid,
  email,
  displayName,
  role,
}
```

Role resolution may require reading `users/{uid}` after Firebase Auth identity is established.

Detailed authentication method, role bootstrap, and security enforcement are specified in the Security PRD.

---

# 34. User Profile Lookup Contract

Conceptual request:

```js
getUserProfile(uid)
```

Response:

```js
{
  uid,
  displayName,
  email,
  role,
  active
}
```

The MVP does not need a public user-directory API.

User-management mutations belong to Admin-only workflows and are finalized in the Security PRD.

---

# 35. Rate Limiting and Abuse Controls

There is no custom HTTP server rate limiter in the MVP.

Instead, protection occurs through several layers:

- Firebase Authentication;
- Firestore Security Rules;
- bounded query contracts;
- disabled duplicate-submit UI states;
- no per-keystroke writes;
- explicit mutation actions;
- browser-local OCR;
- file type/size validation;
- transaction-based consistency;
- Spark quota monitoring during development/production.

Future public APIs or webhooks require explicit server-side rate limiting before release.

---

# 36. File Input Boundary

The only file input in MVP is the local Cut Point photo used for OCR.

The integration accepts a browser `File` object locally.

The persistence repository must never expose a parameter such as:

```text
photo
imageBase64
imageUrl
storagePath
```

This creates a hard boundary preventing accidental cloud photo storage from creeping into the data model.

The UI validates supported file format and practical browser memory limits before OCR.

Exact file-size limit is determined during OCR performance testing and may be configurable.

---

# 37. External Integration Policy

MVP does not automatically send or ingest data from:

- WhatsApp;
- Telegram;
- Slack;
- email;
- NMS;
- OSS;
- upstream incident-management systems;
- Google Maps;
- external AI APIs.

Generated reports are copied manually to operational communication channels.

This is intentional MVP scope, not an implementation omission.

---

# 38. Future External Integration Boundary

If future phases add integrations, they should use explicit adapters such as:

```text
IncidentSourceAdapter
ReportDeliveryAdapter
NotificationAdapter
ExternalTicketAdapter
```

Example future flow:

```text
Upstream OSS
    ↓
ExternalTicketAdapter
    ↓
normalized Ticket input
    ↓
application domain
```

External payloads must never be allowed to write directly into Firestore without application validation/security boundaries.

---

# 39. Future Webhook Rules

No incoming/outgoing webhook is part of MVP.

If webhooks are introduced later, they require:

- server-side endpoint;
- authentication/signature verification;
- replay protection;
- idempotency key;
- payload schema validation;
- rate limiting;
- retry policy;
- audit logging;
- secret management;
- dead-letter/error handling where appropriate.

A webhook integration therefore requires an architecture/security revision because it cannot be safely implemented as a static browser-only feature.

---

# 40. Validation Boundary

Validation occurs at multiple levels.

```text
UI convenience validation
        ↓
Domain schema validation
        ↓
Repository validation
        ↓
Firestore Security Rules
```

No layer should assume another layer makes invalid input impossible.

The browser UI improves user experience.

The repository protects internal correctness.

Security Rules protect the database boundary from unauthorized clients.

---

# 41. Date/Time Contract

Application-facing domain values may use JavaScript `Date` objects or a normalized date abstraction selected during implementation.

Persistence adapter converts to/from Firestore `Timestamp`.

Feature components must not manually convert Firestore Timestamp structures throughout the UI.

Generated report format remains:

```text
DD/MM/YYYY HH:mm
```

Progress ordering always uses full datetime, not only displayed `HH:mm`.

The application's operational timezone behavior must be consistent and explicitly implemented; silent browser-timezone ambiguity is not acceptable.

The MVP target operating timezone is the configured NOC workspace timezone, initially expected to be `Asia/Jakarta`, unless product configuration later changes it.

---

# 42. Search Contract

Search is divided into two scopes.

## 42.1 Running operational search

Searches the bounded currently Running set locally after Firestore status query.

Supported fields:

```text
externalTtNumber
title
pic
cutPoint
```

## 42.2 Historical structured lookup

Firestore-supported filters such as:

```text
externalTtNumber
status
date ranges
```

are executed server-side through indexed queries.

General historical substring search across all free-text fields is not promised in MVP.

If that becomes a product requirement at scale, a proper search index/provider must be selected explicitly.

---

# 43. Report Generation Contract

Report generation is local and pure.

Conceptual contract:

```js
formatTicketReport({ ticket, progress }) => string
```

Input is normalized domain data.

Output is plain text.

It performs no network call.

It performs no Firestore write.

It must:

- preserve user wording;
- hide empty Impact List section;
- format dates consistently;
- sort Progress deterministically;
- produce the exact string used by Preview and Clipboard.

---

# 44. Audit Integration Contract

Audit writes are owned by mutation repository operations.

Feature components must not separately call:

```js
createAuditEvent()
```

after performing a Ticket mutation, because the main mutation could succeed while the audit call fails.

Where audit is required, it is part of the same transactional/batched repository operation whenever Firestore capabilities allow.

Audit is therefore an internal persistence concern, not a UI workflow.

---

# 45. Logging and Diagnostics

The application may log development diagnostics for:

- failed queries;
- OCR duration;
- OCR parser result category;
- map initialization failures;
- mutation error codes;
- unexpected schema versions.

Production logs must not casually print sensitive Ticket data or entire Firestore documents to browser console.

Raw image contents must never be logged.

No third-party telemetry/analytics provider is required for MVP.

---

# 46. Testing Contract

Repository and integration boundaries must be independently testable.

## Unit tests

Test pure contracts such as:

- report formatter;
- coordinate parser;
- external TT parser;
- validation;
- error mapping;
- cursor-independent domain normalization.

## Firebase Emulator integration tests

Test:

- create Ticket;
- save with revision;
- stale revision rejection;
- status transition;
- append Progress transaction;
- backdated Progress handling;
- update/remove latest Progress recalculation;
- coordinate update/clear;
- pagination;
- indexed query patterns;
- audit event creation.

## OCR tests

Use fixture images with known watermark coordinate formats.

## E2E tests

Verify UI-to-contract behavior without using production Firestore.

---

# 47. API Performance Requirements

Operational interactions should feel immediate under normal network conditions.

Architecture requirements:

- route loading must not wait for OCR library;
- list queries request only necessary records;
- Running Ticket rows use parent summaries;
- no N+1 Progress reads for Running Ticket grid;
- Progress writes target one Progress document plus parent metadata/audit;
- report generation is local;
- coordinate parsing is local;
- image OCR is local and worker-based;
- map provider is lazy-loaded with the Cut Point route.

Exact numerical performance budgets are finalized during implementation profiling.

---

# 48. Quota-Aware Integration Rules

Because the MVP targets Firebase Spark:

- do not poll Firestore rapidly;
- do not maintain unnecessary listeners;
- do not save form keystrokes;
- do not download all history;
- do not upload photos;
- do not use Cloud Functions for simple client operations;
- do not duplicate Ticket documents into view-specific collections;
- use pagination and limits;
- test realistic read/write behavior with the Emulator before production.

A feature that materially increases Firestore read/write frequency must be reviewed against this document before implementation.

---

# 49. Integration Security Boundary

The client application cannot be trusted merely because it is our own React code.

Every Firestore request may theoretically be reproduced outside the UI.

Therefore:

- Firebase Auth identifies the user;
- Security Rules authorize the operation;
- repository validation improves correctness but is not a security boundary;
- client role labels alone must never grant access;
- no service-account credentials exist in browser code.

Detailed rules follow in the Security & Access Control PRD.

---

# 50. API Definition of Done

The API/integration layer is considered MVP-ready when:

1. React features can create, read, update, and transition Tickets without directly importing Firestore SDK operations into feature components.
2. Ticket saves reject stale revisions.
3. Progress append/update/remove preserve parent summary correctness.
4. Running Ticket can load a bounded active dataset without N+1 Progress reads.
5. historical Ticket queries are paginated.
6. Cut Point Tracker consumes the canonical Ticket dataset.
7. coordinate persistence accepts only validated metadata, never image data.
8. OCR executes locally and returns normalized candidates.
9. ambiguous OCR results require user verification.
10. Map rendering is decoupled from Firestore retrieval.
11. Preview and Clipboard use the same report formatter.
12. Firebase errors are normalized into application error codes.
13. meaningful mutations create audit events where required.
14. Emulator integration tests validate transaction behavior.
15. unsupported external integrations are not silently added to MVP.

---

# 51. Explicit MVP API Non-Goals

The MVP does not expose:

```text
/public/api/*
REST API
GraphQL API
WebSocket server
incoming webhook
outgoing webhook
WhatsApp API
Telegram API
Slack API
NMS API
OSS API
cloud OCR API
photo upload API
Google Maps API
AI API
```

These require explicit future product/architecture/security work.

---

# 52. Handoff to Security & Access Control PRD

The next specification must finalize:

- Firebase Authentication method;
- account provisioning;
- authenticated route behavior;
- Admin / Operator / Viewer RBAC;
- `users/{uid}` profile ownership;
- Firestore Security Rules;
- field-level mutation restrictions where practical;
- role mutation policy;
- inactive/disabled account behavior;
- session handling;
- stale session behavior;
- secure Firebase configuration expectations;
- service-account prohibition;
- abuse prevention;
- audit access;
- archived Ticket permissions;
- Progress edit/delete permissions;
- coordinate mutation permissions;
- user-management permissions.

Until that document is completed, this API PRD defines functional contracts but does not grant permissions by itself.
