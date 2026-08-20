# NOC Report Template Generator — Data & Database PRD

**Document ID:** NOCREPORT-DATA-001  
**Version:** 0.1  
**Status:** Baseline / Data Source of Truth  
**Parent documents:** `docs/00-product/MASTER-PRD.md`, `docs/01-ux/UI-UX-PRD.md`, `docs/02-architecture/TECHNICAL-ARCHITECTURE-TDD.md`  
**Repository:** `jangangitungapah-pixel/nocreportv2`  
**Primary persistence:** Cloud Firestore  
**MVP topology:** Single operational workspace; not multi-tenant  
**Cloud constraint:** Firebase Spark-compatible architecture

---

# 1. Purpose

This document defines the Firestore data model, document contracts, collection relationships, indexes, lifecycle behavior, audit strategy, soft-delete/archive behavior, retention expectations, coordinate metadata persistence, read/write patterns, concurrency rules, and migration/versioning strategy for NOC Report Template Generator.

The Master Product PRD defines product behavior. The UI/UX PRD defines user interaction. The Technical Architecture TDD defines code/runtime architecture. This Data & Database PRD defines the canonical persisted representation of application data.

If persisted data or repository code conflicts with this document, the data implementation must be corrected unless this document is intentionally revised.

Security enforcement is specified separately in the Security & Access Control PRD. API/repository method contracts are specified separately in the API & Integration PRD.

---

# 2. Data Principles

## DATA-01 — Ticket is the primary aggregate

A Trouble Ticket is represented by one canonical Firestore Ticket document plus related subcollections.

No duplicate `runningTickets`, `mapMarkers`, or `closedTickets` collections may be created.

Dashboard, Running Ticket, report generation, and Cut Point Tracker must derive from the same Ticket dataset.

## DATA-02 — Structured data is source of truth

Generated report text is not the canonical stored record.

The canonical stored record is structured data such as:

- Title;
- Impact List;
- Occur Time;
- Dispatch Time;
- PIC;
- Rootcause;
- Cut Point;
- coordinate metadata;
- lifecycle status;
- Progress Timeline.

The report is rendered from this data.

## DATA-03 — Progress is not embedded as an ever-growing array

Progress Timeline entries must be stored in a Ticket subcollection.

Reason:

- appending one progress update should not rewrite the entire Ticket document;
- a long-running incident may accumulate many updates;
- Firestore documents have finite size limits;
- targeted progress writes are friendlier to Spark Plan quotas;
- progress entries need independent timestamps and audit metadata.

## DATA-04 — No Cut Point photo is persisted

The application does not store:

- original Cut Point image;
- image binary/base64;
- Firebase Storage object;
- image URL;
- thumbnail;
- EXIF blob;
- local filesystem path;
- OCR source image.

The image exists only in the user's browser during local OCR processing.

Only confirmed coordinate data and minimal coordinate-related metadata may be persisted.

## DATA-05 — Query-first modeling

Firestore structure must support the actual operational queries required by:

- Dashboard;
- Running Ticket;
- Ticket Generator;
- Cut Point Tracker.

The model must not imitate relational normalization where it creates unnecessary reads.

## DATA-06 — Intentional denormalization is allowed

Small derived fields may be stored on the Ticket document when they substantially reduce operational reads.

Examples:

- external TT number;
- `hasCoordinates`;
- latest progress summary;
- progress count;
- normalized status.

Such fields are derived metadata, not separate sources of truth.

## DATA-07 — No per-keystroke persistence

Ticket form editing must not write to Firestore on every input change.

Writes occur on explicit save, explicit lifecycle transitions, progress append/update/delete, and other deliberate mutations.

---

# 3. Firestore Collection Overview

MVP baseline:

```text
firestore/
│
├── tickets/{ticketId}
│   ├── progress/{progressId}
│   └── auditEvents/{eventId}
│
└── users/{uid}
```

No separate collection is created for:

```text
runningTickets
closedTickets
cutPoints
mapMarkers
reports
photos
ocrImages
```

Those concepts are either views of Ticket data or browser-local processing state.

---

# 4. Ticket Document

Path:

```text
tickets/{ticketId}
```

A Ticket document represents one NOC incident.

Recommended baseline shape:

```js
{
  schemaVersion: 1,

  title: "[MANDAU] LINK DOWN ... [TT : INC-20260818-00015849]",
  externalTtNumber: "INC-20260818-00015849",

  impactList: [
    "SITE_A",
    "SITE_B"
  ],

  occurAt: Timestamp,
  dispatchAt: Timestamp | null,

  pic: "Agus (majalengka)",
  rootcause: "impact forest burning",
  cutPoint: "OTDR FO CUT at KM 24 from majalengka (FD fibeerstar)",

  coordinate: {
    latitude: -6.12345,
    longitude: 107.12345,
    source: "ocr" | "manual",
    detectedFormat: "DD" | "DMS" | "DDM" | "unknown" | null,
    verified: true,
    verifiedAt: Timestamp | null,
    verifiedBy: "uid" | null
  } | null,

  hasCoordinates: true,

  status: "DRAFT" | "RUNNING" | "RESOLVED" | "ARCHIVED",

  latestProgress: {
    progressId: "progressId",
    occurredAt: Timestamp,
    text: "Team sedang proses splicing core sisi Bandung"
  } | null,

  progressCount: 14,

  createdAt: Timestamp,
  createdBy: "uid",
  updatedAt: Timestamp,
  updatedBy: "uid",

  resolvedAt: Timestamp | null,
  resolvedBy: "uid" | null,

  archivedAt: Timestamp | null,
  archivedBy: "uid" | null,

  revision: 7
}
```

The exact JavaScript object formatting is illustrative. Firestore field types are authoritative.

---

# 5. Ticket ID Strategy

Firestore auto-generated document IDs are the baseline.

Example:

```text
tickets/7qQhK2...
```

The upstream/external TT number such as:

```text
INC-20260818-00015849
```

must not be used as the Firestore document ID.

Reasons:

- external TT number detection may fail;
- external formats may change;
- some records may not have a TT number yet;
- the Title remains the operational source of truth;
- generated Firestore IDs avoid coupling persistence identity to an external system.

`externalTtNumber` is stored as query/search metadata when detected.

---

# 6. Ticket Field Contract

## 6.1 schemaVersion

Type:

```text
integer
```

Initial value:

```text
1
```

Purpose:

- identify persisted schema version;
- support future migrations;
- permit safe parsing of older records.

Every new Ticket document must include this field.

## 6.2 title

Type:

```text
string
```

Rules:

- canonical operational title;
- preserve capitalization and punctuation;
- required before status becomes `RUNNING`;
- trimmed only at outer whitespace boundaries;
- application must not rewrite wording automatically.

## 6.3 externalTtNumber

Type:

```text
string | null
```

Example:

```text
INC-20260818-00015849
```

Derived from recognizable Title patterns.

Rules:

- optional;
- normalized for search where safe;
- failure to detect does not block save;
- not the document primary key.

## 6.4 impactList

Type:

```text
array<string>
```

Rules:

- empty array means no Impact List;
- blank entries are removed before persistence;
- order is meaningful and must be preserved;
- duplicates may be prevented by UI where useful but database does not require global uniqueness.

Baseline expected size is small enough to remain embedded in the Ticket document.

## 6.5 occurAt

Type:

```text
Firestore Timestamp
```

Rules:

- required for `RUNNING`;
- represents incident/alarm occurrence datetime;
- full datetime is stored even though report formatting uses `DD/MM/YYYY HH:mm`.

## 6.6 dispatchAt

Type:

```text
Firestore Timestamp | null
```

May be unknown during Draft/early Running state.

## 6.7 pic

Type:

```text
string
```

Empty string is allowed while unknown.

## 6.8 rootcause

Type:

```text
string
```

Empty string is allowed while investigation is incomplete.

## 6.9 cutPoint

Type:

```text
string
```

This is narrative operational text and is independent from geographic coordinates.

---

# 7. Coordinate Data Contract

Coordinate data is stored inside the Ticket document because the map needs to query Ticket records efficiently.

Canonical shape:

```js
coordinate: {
  latitude: -6.12345,
  longitude: 107.12345,
  source: "ocr",
  detectedFormat: "DMS",
  verified: true,
  verifiedAt: Timestamp,
  verifiedBy: "uid"
}
```

If there is no confirmed coordinate:

```js
coordinate: null,
hasCoordinates: false
```

## 7.1 latitude

Type:

```text
number
```

Valid range:

```text
-90 <= latitude <= 90
```

## 7.2 longitude

Type:

```text
number
```

Valid range:

```text
-180 <= longitude <= 180
```

## 7.3 Precision

Coordinates may retain available validated numeric precision internally.

Standard UI/report metadata display uses five decimal places.

Example:

```text
-6.12345, 107.12345
```

Firestore stores numeric values, not the formatted display string.

## 7.4 source

Allowed values:

```text
ocr
manual
```

Meaning:

- `ocr`: values originated from local image OCR and were then confirmed/corrected by the user;
- `manual`: values were entered manually without relying on OCR.

If a user manually changes an OCR result before confirmation, implementation may preserve `source: "ocr"` because OCR initiated the candidate, while verification metadata establishes the human-confirmed final value.

## 7.5 detectedFormat

Allowed values:

```text
DD
DMS
DDM
unknown
null
```

This is diagnostic metadata only.

It is not required for map rendering.

## 7.6 verified

Type:

```text
boolean
```

A coordinate should normally be persisted to the canonical Ticket record only after validation and explicit user acceptance.

Canonical map coordinates therefore normally use:

```text
verified = true
```

## 7.7 verifiedAt / verifiedBy

Provide traceability for the final coordinate accepted by an operator.

## 7.8 Data explicitly NOT persisted

The Ticket must not store:

```text
photoBinary
photoBase64
photoUrl
storagePath
thumbnail
originalFilename
localPath
EXIF blob
imageHash
full OCR image
```

Raw OCR text is also not required for MVP persistence.

The objective is to persist the useful operational result, not turn Firestore into an image/OCR archive.

---

# 8. hasCoordinates Derived Field

Type:

```text
boolean
```

Rules:

```text
true  = valid confirmed latitude + longitude exist
false = coordinate missing or invalid
```

Purpose:

- efficient Cut Point Tracker query;
- avoid attempting Firestore queries based on nested field existence/null semantics;
- simplify Dashboard counters.

`hasCoordinates` must be updated atomically with the `coordinate` field.

Invariant:

```text
hasCoordinates === true
```

implies:

```text
coordinate != null
coordinate.latitude is valid
coordinate.longitude is valid
```

---

# 9. Ticket Status Contract

Canonical persisted values:

```text
DRAFT
RUNNING
RESOLVED
ARCHIVED
```

Uppercase strings are used for persistence consistency.

UI labels may use:

```text
Draft
Running
Resolved
Archived
```

## 9.1 DRAFT

Record exists but is not yet considered an active operational ticket.

## 9.2 RUNNING

Active incident.

Minimum transition requirements are defined by the Product and domain validation layer.

## 9.3 RESOLVED

Incident troubleshooting is complete.

When set:

```text
resolvedAt = server timestamp
resolvedBy = current uid
```

## 9.4 ARCHIVED

Soft-archived record.

When set:

```text
archivedAt = server timestamp
archivedBy = current uid
```

Archived is not equivalent to hard deletion.

---

# 10. Progress Timeline Subcollection

Path:

```text
tickets/{ticketId}/progress/{progressId}
```

Each progress entry is an independent document.

Recommended shape:

```js
{
  schemaVersion: 1,

  occurredAt: Timestamp,
  text: "team OTW ke lokasi CP, ETA 75 menit",

  createdAt: Timestamp,
  createdBy: "uid",
  updatedAt: Timestamp,
  updatedBy: "uid",

  revision: 1
}
```

## 10.1 progressId

Use Firestore auto-generated document ID.

## 10.2 occurredAt

Represents when the operational event occurred.

This differs from `createdAt`.

Example:

The operator enters at 14:25 an event that actually occurred at 14:21:

```text
occurredAt = 14:21
createdAt  = 14:25
```

Generated report ordering uses `occurredAt`.

## 10.3 text

User-authored operational update.

Rules:

- non-empty after trim;
- preserve wording/case/punctuation;
- no automatic AI rewrite in MVP.

## 10.4 Duplicate timestamps

Multiple progress entries may share the same `occurredAt`.

Stable ordering is:

```text
occurredAt ASC
createdAt ASC
progressId ASC
```

The application may use a deterministic local tie-breaker if Firestore query constraints require it.

---

# 11. latestProgress Summary

To avoid reading the entire progress subcollection merely to show Running Ticket rows or Dashboard summaries, the parent Ticket stores a small derived summary:

```js
latestProgress: {
  progressId: "...",
  occurredAt: Timestamp,
  text: "team masih progress jumper kabel crossing jalan"
}
```

Also store:

```text
progressCount
```

## 11.1 Update rule

When a new progress entry becomes chronologically latest, the write operation must update:

- new progress document;
- Ticket `latestProgress`;
- Ticket `progressCount`;
- Ticket `updatedAt`;
- Ticket `updatedBy`;
- Ticket `revision`.

This should use a Firestore batch or transaction as defined in the implementation/API spec.

## 11.2 Backdated progress

If a user adds a backdated progress entry that is older than the current latest progress:

- create the progress document;
- increment `progressCount`;
- do not replace `latestProgress` unless its `occurredAt` is actually later according to deterministic ordering.

## 11.3 Editing/deleting latest progress

If the current latest progress is edited so that it is no longer latest, or is removed, the repository must recalculate the latest remaining progress entry.

---

# 12. Audit Events Subcollection

Path:

```text
tickets/{ticketId}/auditEvents/{eventId}
```

Audit logging is intentionally lightweight.

It is not a keystroke history and not a full event-sourcing system.

Audit events are written for meaningful persisted operations such as:

```text
TICKET_CREATED
TICKET_UPDATED
STATUS_CHANGED
PROGRESS_ADDED
PROGRESS_UPDATED
PROGRESS_REMOVED
COORDINATE_UPDATED
TICKET_ARCHIVED
TICKET_RESTORED
```

Suggested shape:

```js
{
  schemaVersion: 1,
  type: "STATUS_CHANGED",
  actorUid: "uid",
  createdAt: Timestamp,

  summary: "RUNNING -> RESOLVED",

  changes: {
    status: {
      from: "RUNNING",
      to: "RESOLVED"
    }
  }
}
```

## 12.1 Audit minimization

Audit events should contain operationally useful metadata, not full duplicate Ticket snapshots.

Do not duplicate large fields unnecessarily.

## 12.2 Atomicity

Where a user mutation requires an audit event, the data mutation and audit creation should be committed in the same Firestore batch/transaction when technically appropriate.

## 12.3 Audit edit policy

Audit records are append-only from normal application workflows.

Normal Operator UI must not edit or delete historical audit events.

Final permission enforcement belongs to Security Rules.

---

# 13. User Profile Collection

Path:

```text
users/{uid}
```

The Firebase Authentication user account owns identity/authentication.

The Firestore User document stores application profile and role metadata.

Baseline shape:

```js
{
  schemaVersion: 1,
  displayName: "Arief",
  email: "user@example.com",
  role: "ADMIN" | "OPERATOR" | "VIEWER",
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Detailed role management and authorization behavior is defined in the Security & Access Control PRD.

Passwords, password hashes, tokens, and service credentials must never be stored in this collection.

---

# 14. Relationships

Logical model:

```text
User
  │
  ├── creates/updates ───────► Ticket
  │                              │
  │                              ├── Progress Entry
  │                              └── Audit Event
  │
  └── verifies coordinate ───► Ticket.coordinate
```

Firestore relationship form:

```text
users/{uid}

tickets/{ticketId}

tickets/{ticketId}/progress/{progressId}

tickets/{ticketId}/auditEvents/{eventId}
```

No relational foreign-key enforcement exists in Firestore, so repository validation and Security Rules must enforce allowed relationships where possible.

---

# 15. Running Ticket Query

Running Ticket must query Firestore using persisted status.

Baseline query:

```text
collection: tickets
where status == RUNNING
order by updatedAt DESC
limit N
```

Recommended initial UI limit:

```text
50–100 records
```

Exact value is an implementation constant and can be tuned.

Running Ticket must not download all historical tickets and filter `RUNNING` in memory.

---

# 16. Running Ticket Search Strategy

Firestore does not provide general multi-field substring full-text search.

MVP therefore uses this strategy:

1. fetch the bounded set of currently Running Tickets;
2. perform instant client-side filtering on the loaded operational set for:
   - external TT number;
   - Title;
   - PIC;
   - Cut Point.

This is acceptable because the Running set is expected to remain operationally bounded and already limited by query.

The MVP must not create large search-token arrays merely to simulate a full-text search engine.

Historical global search may receive a dedicated search architecture in a future phase if operational scale requires it.

---

# 17. Dashboard Query Strategy

Dashboard should avoid downloading unnecessary history.

Baseline data needs:

- Running Ticket count/view;
- recently updated tickets;
- tickets created/occurred today where needed;
- recent resolved activity;
- Cut Point availability summary where practical.

For MVP, prefer small bounded queries over maintaining many counter documents.

Do not introduce distributed counters until real usage demonstrates a need.

This avoids extra writes for every mutation.

---

# 18. Cut Point Tracker Query

Baseline query:

```text
collection: tickets
where hasCoordinates == true
order by updatedAt DESC
limit N
```

The UI can further filter by status.

If map usage grows enough that status-scoped loading is required, use a composite query such as:

```text
hasCoordinates == true
status in [RUNNING, RESOLVED]
order by updatedAt DESC
```

Map rendering must read coordinates from:

```text
Ticket.coordinate.latitude
Ticket.coordinate.longitude
```

No separate marker collection is permitted in MVP.

---

# 19. Historical Ticket Query

Historical data must use pagination.

Example baseline:

```text
order by updatedAt DESC
limit pageSize
startAfter cursor
```

Avoid unbounded collection reads.

The current MVP does not require a dedicated Historical Tickets page, but the data layer must not prevent one from being added later.

---

# 20. Firestore Index Requirements

The exact generated index file is finalized during implementation, but baseline composite indexes should anticipate these query shapes.

## IDX-01

```text
Collection: tickets
status ASC
updatedAt DESC
```

Supports Running Ticket and status-specific operational views.

## IDX-02

```text
Collection: tickets
status ASC
occurAt DESC
```

Supports incident-time views scoped by status.

## IDX-03

```text
Collection: tickets
hasCoordinates ASC
updatedAt DESC
```

Supports Cut Point Tracker.

## IDX-04

Potential when map status filtering is implemented server-side:

```text
Collection: tickets
hasCoordinates ASC
status ASC
updatedAt DESC
```

## IDX-05

Progress subcollection normally queries:

```text
occurredAt ASC
createdAt ASC
```

If Firestore requires a composite collection/subcollection index for the final implementation, it must be added to `firestore.indexes.json`.

Unnecessary indexes should be disabled/excluded for fields that are never queried and may contain long text, where Firestore configuration allows and where doing so is beneficial.

---

# 21. Long Text / Index Exclusion Guidance

Fields such as:

```text
title
rootcause
cutPoint
progress.text
auditEvents.summary
```

are not intended for arbitrary Firestore ordering.

During implementation, index exemptions should be considered for long text fields that do not need server-side querying, especially `progress.text` and verbose audit text.

Do not disable an index required by an actual product query.

---

# 22. Revision / Optimistic Concurrency

Ticket documents include:

```text
revision: integer
```

Initial value:

```text
1
```

Each meaningful Ticket mutation increments `revision`.

Purpose:

- detect stale editing sessions;
- reduce accidental last-write-wins overwrites;
- support future optimistic concurrency safeguards.

Recommended repository flow:

```text
Load ticket revision = 7
User edits
Save expects revision = 7
Transaction verifies revision = 7
Write new data
revision = 8
```

If current persisted revision is already `8`, the client must not silently overwrite without conflict handling.

The exact UX for conflict resolution belongs to API/UX implementation details.

---

# 23. Server Timestamps

Canonical audit/system times should use Firestore server timestamps where possible:

```text
createdAt
updatedAt
resolvedAt
archivedAt
verifiedAt
auditEvents.createdAt
progress.createdAt
progress.updatedAt
```

Operational event times entered by the user use explicit values:

```text
occurAt
dispatchAt
progress.occurredAt
```

Do not replace user-entered operational timestamps with server receive time.

---

# 24. Timezone Strategy

Operational display timezone for the initial product is Indonesia/Jakarta unless product requirements are revised.

Persisted Firestore Timestamps represent absolute instants.

Formatting to:

```text
DD/MM/YYYY HH:mm
```

occurs at the application presentation/report layer.

Full timestamps are always preserved internally so progress crossing midnight can be ordered correctly.

---

# 25. Soft Delete / Archive Policy

MVP does not expose normal hard deletion of Ticket records.

Archive flow:

```text
status = ARCHIVED
archivedAt = server timestamp
archivedBy = uid
```

The record remains queryable for authorized administrative/history use.

Benefits:

- operational history is not accidentally destroyed;
- audit trail remains intact;
- Ticket references remain valid.

A future administrator-only permanent purge flow may be introduced only through an explicit product/security revision.

---

# 26. Progress Deletion Policy

Unlike whole Ticket deletion, an incorrectly entered progress update may need removal/correction.

MVP recommendation:

- authorized Operator/Admin may edit a progress entry;
- removal is permitted only through an explicit action;
- removal generates an audit event;
- parent `progressCount` and `latestProgress` are recalculated atomically.

Alternative future policy could use `deletedAt` soft deletion for progress if stronger compliance/history requirements emerge.

For MVP, audit-backed removal is sufficient unless Security PRD tightens this rule.

---

# 27. Data Retention

Baseline MVP retention:

```text
Ticket records: retained indefinitely until an explicit future policy is adopted
Progress: retained with parent Ticket
Audit Events: retained with parent Ticket
Coordinate metadata: retained with parent Ticket
Photos: not persisted
```

No automatic TTL deletion is required for core MVP data.

This keeps historical Cut Point knowledge useful.

If Firestore quota/storage growth becomes material later, retention policy must be reviewed based on real usage.

---

# 28. Backup / Recovery Strategy

The Spark-only MVP must not pretend that an enterprise-grade automated backup system exists when it has not been implemented.

Baseline rules:

1. Application code and Firestore schema/rules/index configuration are versioned in Git.
2. Production data should not rely on client browser cache as backup.
3. Before production rollout, current Firebase/Firestore backup/export capabilities and plan requirements must be reviewed.
4. If automated managed backup/export requires a billing tier outside project constraints, the limitation must be documented rather than silently enabling Blaze.
5. A future admin export mechanism may be designed if operationally required and compatible with the chosen cost model.

The application must never claim that Cut Point photos are backed up because they are intentionally not stored.

---

# 29. Data Validation Invariants

The repository/domain layer must enforce these invariants before persistence.

## INV-001

`status` is one of:

```text
DRAFT
RUNNING
RESOLVED
ARCHIVED
```

## INV-002

`RUNNING` requires at minimum:

```text
title
occurAt
```

## INV-003

Coordinates are either absent entirely or valid as a pair.

Invalid state is not permitted:

```text
latitude exists
longitude missing
```

## INV-004

If:

```text
hasCoordinates == true
```

then:

```text
coordinate != null
latitude valid
longitude valid
```

## INV-005

`impactList` contains no blank strings.

## INV-006

Progress `text` must not be blank.

## INV-007

System-created timestamps and user identity fields are not trusted solely from arbitrary form input.

## INV-008

A resolved Ticket has `resolvedAt` and `resolvedBy` when the transition is performed through the supported application path.

## INV-009

An archived Ticket has `archivedAt` and `archivedBy`.

## INV-010

`progressCount` cannot be negative.

---

# 30. Write Patterns

## 30.1 Create Draft Ticket

Writes:

```text
1 Ticket document
1 audit event
```

Prefer batch write.

## 30.2 Save Ticket Form Changes

Writes:

```text
Ticket update
Audit event
```

Only changed persisted data should be included where practical.

Do not write while the user is merely typing.

## 30.3 Add Progress

Writes approximately:

```text
1 Progress document
1 Ticket summary update
1 Audit event
```

Committed atomically with batch/transaction where appropriate.

## 30.4 Update Coordinate

Writes approximately:

```text
Ticket coordinate + hasCoordinates + metadata
Audit event
```

No photo write occurs.

## 30.5 Resolve Ticket

Writes:

```text
Ticket status/resolution metadata
Audit event
```

---

# 31. Read Patterns

## Dashboard

Small bounded ticket queries.

## Running Ticket

One status-scoped bounded query.

Progress history is not automatically downloaded for every row.

`latestProgress` comes from the parent Ticket document.

## Ticket Generator

Open existing Ticket:

```text
read Ticket document
read Ticket progress subcollection
```

Audit data is not required for normal form rendering unless a History UI is opened.

## Cut Point Tracker

Read only Ticket documents with:

```text
hasCoordinates == true
```

No progress subcollections are needed to render markers.

---

# 32. Offline / Firestore Cache Considerations

Firestore browser caching may improve resilience, but cached state must not be treated as an authoritative backup.

The application should surface network/save state clearly.

A user seeing local form changes must not be led to believe they are safely persisted if Firestore write confirmation has not succeeded.

Detailed offline UX belongs to UI/API implementation.

---

# 33. Data Migration Strategy

Firestore is schema-flexible, but application data still requires explicit migration discipline.

Rules:

- every Ticket has `schemaVersion`;
- every Progress document has `schemaVersion`;
- every Audit Event has `schemaVersion`;
- repository normalization must tolerate known older schema versions;
- breaking changes require a documented migration;
- never silently reinterpret existing field semantics.

Possible future migration scripts live in:

```text
scripts/migrations/
```

Migration code must not run implicitly during ordinary page rendering if it could produce uncontrolled bulk writes.

---

# 34. Development / Emulator Data

Local development and automated integration tests must use Firebase Emulator Suite where Firebase behavior is required.

Test fixtures should include at least:

1. Draft Ticket with minimal fields.
2. Running Ticket without Rootcause.
3. Running Ticket with many progress entries.
4. Ticket crossing midnight.
5. Ticket with Impact List.
6. Ticket without Impact List.
7. Ticket with manual coordinates.
8. Ticket with OCR-derived verified coordinates.
9. Resolved Ticket.
10. Archived Ticket.

Development seed data must never require production Firestore access.

---

# 35. Example Complete Ticket

```js
{
  schemaVersion: 1,

  title: "[MANDAU] LINK DOWN AT DWDM UJB 109202_BANDUNG_PETA <> 100109_MAJALENGKA, [TT : INC-20260818-00015849]",
  externalTtNumber: "INC-20260818-00015849",

  impactList: [],

  occurAt: Timestamp("2026-08-18T14:20:00+07:00"),
  dispatchAt: Timestamp("2026-08-18T14:20:00+07:00"),

  pic: "Agus (majalengka)",
  rootcause: "impact forest burning",
  cutPoint: "OTDR FO CUT at KM 24 from majalengka (FD fibeerstar)",

  coordinate: {
    latitude: -6.12345,
    longitude: 107.12345,
    source: "ocr",
    detectedFormat: "DMS",
    verified: true,
    verifiedAt: Timestamp,
    verifiedBy: "uid-operator"
  },

  hasCoordinates: true,
  status: "RUNNING",

  latestProgress: {
    progressId: "progress-14",
    occurredAt: Timestamp("2026-08-18T23:55:00+07:00"),
    text: "Team sedang proses splicing core sisi bandung"
  },

  progressCount: 14,

  createdAt: Timestamp,
  createdBy: "uid-operator",
  updatedAt: Timestamp,
  updatedBy: "uid-operator",

  resolvedAt: null,
  resolvedBy: null,
  archivedAt: null,
  archivedBy: null,

  revision: 7
}
```

No image reference exists in the record.

---

# 36. Example Progress Entry

```js
{
  schemaVersion: 1,
  occurredAt: Timestamp("2026-08-18T23:55:00+07:00"),
  text: "Team sedang proses splicing core sisi bandung",

  createdAt: Timestamp,
  createdBy: "uid-operator",
  updatedAt: Timestamp,
  updatedBy: "uid-operator",
  revision: 1
}
```

---

# 37. Firestore Cost / Quota Guardrails

Because the product targets Spark Plan:

- no per-keystroke writes;
- no duplicated Running Ticket collection;
- no duplicated map-marker collection;
- no stored photos;
- no automatic download of all historical tickets;
- no automatic download of every progress subcollection for list views;
- bounded queries are mandatory;
- use parent `latestProgress` summary for lists;
- use pagination for history;
- avoid unnecessary realtime listeners;
- avoid counter documents until measurements prove they are beneficial;
- audit events are meaningful-operation logs, not verbose snapshots.

A feature that adds materially higher Firestore traffic must be reviewed against these guardrails.

---

# 38. Acceptance Criteria

## Ticket persistence

- Creating a Ticket produces one canonical Ticket record.
- A Running Ticket is represented by `status = RUNNING`, not duplicated elsewhere.
- Resolving a Ticket updates the same document.
- Archiving does not physically delete the Ticket.

## Progress

- Adding progress creates an independent Progress document.
- Adding progress does not rewrite an embedded full timeline array.
- Timeline can correctly span midnight.
- Running Ticket can display latest progress without fetching the complete timeline.

## Coordinates

- Valid latitude/longitude are stored numerically in Firestore.
- `hasCoordinates` reflects coordinate validity.
- Cut Point Tracker can render markers directly from Ticket documents.
- No Cut Point image, URL, thumbnail, base64, or Storage path is persisted.
- OCR failure does not create invalid coordinate data.
- Manual coordinate input can be persisted without an image.

## Audit

- Meaningful mutations can create append-only audit events.
- Audit data does not duplicate entire Ticket snapshots.

## Efficiency

- Running Ticket uses a status query.
- Historical queries are bounded/paginated.
- Normal form typing does not generate Firestore writes.

## Concurrency

- Ticket revision is incremented on meaningful parent document mutations.
- Stale saves can be detected rather than silently overwriting newer revisions.

---

# 39. Data Definition of Done

The Data & Database foundation is considered correctly implemented when:

1. Firestore Emulator can create and retrieve Ticket documents matching schema version 1.
2. Draft and Running lifecycle validation works.
3. Progress entries are stored in a subcollection.
4. Latest progress summary remains synchronized with timeline changes.
5. Progress crossing midnight sorts correctly.
6. Ticket coordinates are numeric, validated, and map-queryable.
7. OCR-derived and manually entered coordinates use the same canonical persisted fields.
8. Cut Point photos never enter Firestore or Cloud Storage.
9. Running Ticket query does not require scanning all history.
10. Cut Point Tracker does not require a duplicate marker database.
11. Archive is implemented as a soft lifecycle state.
12. Audit Events record meaningful mutations.
13. Server timestamps are used for system mutation times.
14. Revision-based stale-write detection exists at repository level.
15. Firestore indexes required by implemented query shapes are committed to source control.
16. Tests use Firebase Emulator rather than production data.

---

# 40. Handoff to API & Integration PRD

The next document must define the application service/repository contracts operating on this data model.

It must specify operations such as:

```text
createTicket()
getTicket()
updateTicket()
listRunningTickets()
appendProgress()
updateProgress()
removeProgress()
listProgress()
updateCoordinate()
resolveTicket()
archiveTicket()
restoreTicket()
listCutPointTickets()
```

The API & Integration PRD must also define:

- request and response shapes;
- runtime validation;
- normalized application errors;
- Firestore transaction/batch boundaries;
- pagination contracts;
- repository behavior;
- external integration boundaries;
- clipboard/OCR/map integration interfaces;
- future webhook rules;
- rate/abuse considerations applicable to a browser-only Firebase architecture.

---

# 41. Final Data Architecture Decision

The MVP canonical persistence model is:

```text
Ticket core data
        ↓
tickets/{ticketId}
        │
        ├── progress/{progressId}
        │
        └── auditEvents/{eventId}

User role/profile
        ↓
users/{uid}
```

Cut Point photo workflow is explicitly:

```text
Local browser photo
        ↓
Local OCR
        ↓
Coordinate parsing
        ↓
Human verification/correction
        ↓
Firestore stores latitude/longitude metadata only
        ↓
Local image is discarded from application memory when no longer required
```

No Cloud Storage dependency and no persistent photo record is part of the MVP.