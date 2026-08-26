# Template Generator Feature Expansion — Detailed Workplan

**Status:** COMPLETE — GEN-F0 THROUGH GEN-F9 RELEASE READINESS ACCEPTED  
**Version:** 2 — consolidated after 39-email corpus analysis  
**Primary page:** `/generator/new` and `/generator/:ticketId/edit`  
**Repository:** `jangangitungapah-pixel/nocreportv2`  
**Planning branch:** `feature/ui-density-system`  
**Baseline:** Mega UI foundation through MEGA-10 automated QA; Quality #742 full green.  
**Planning date:** 2026-08-26  
**Evidence annex:** `docs/08-post-mvp/TEMPLATE-GENERATOR-EMAIL-IMPORT-ADDENDUM.md`  
**Source context:** current deterministic Smart Import, Ticket/Progress persistence, OCR coordinate workflow, canonical report output, revision protection, RBAC, and **39 user-provided Outlook `.msg` incident emails** analyzed locally for format discovery: 20 FLP/MANDAU structured alarm emails + 19 direct MANDAU link-down emails.

---

# 1. Purpose

Evolve Template Generator from a form/report editor into a high-speed NOC incident authoring workstation.

The feature program must optimize for:

1. less manual typing;
2. fewer copy/paste mistakes;
3. deterministic extraction from operational reports and email;
4. faster Progress updates;
5. explicit conflict review before applying imported data;
6. early duplicate/related-incident awareness;
7. stronger continuity across operator shifts;
8. report-readiness validation before lifecycle actions;
9. safe recovery from browser/network interruption;
10. meaningful revision history;
11. local-first privacy;
12. bounded Firestore reads/writes;
13. feature completeness before any dedicated visual/UI overhaul.

This workplan defines **feature behavior, data contracts, parser rules, persistence boundaries, QA and execution order**. A dedicated Template Generator visual-overhaul PRD is intentionally deferred until this feature program is stable.

---

# 2. Protected contracts

The following remain non-negotiable unless a later explicit product decision changes them:

- `/tickets/:ticketId` remains read-only review.
- `/generator/:ticketId/edit` remains the explicit mutation workspace.
- Ticket lifecycle semantics remain Draft → Running → Resolved → Archived.
- Admin/Operator/Viewer capability outcomes remain unchanged.
- Firestore Security Rules remain authoritative.
- optimistic `revision` checks remain mandatory for Ticket and Progress mutations.
- canonical report output remains deterministic.
- OCR remains browser-local and image bytes are not silently uploaded.
- Smart Import / Email Import never auto-write to Firestore.
- no AI/API is required for operational parsing.
- no imported source may silently overwrite the live Generator form.
- all Firestore list/search operations remain bounded.
- raw operational email body, HTML, recipient lists, Exchange headers and attachment bytes are not persisted.
- real `.msg` samples supplied by the user are analysis-only and must not be committed to the repository.

---

# 3. Current baseline

Generator already provides:

- React Hook Form + Zod validation;
- deterministic local `parseSmartReport(...)`;
- Smart Import preview + explicit `Fill generator`;
- Impact List editor;
- Progress composer/timeline;
- local OCR coordinate extraction + explicit verification;
- canonical report preview/copy;
- Draft/Running/Resolved transitions;
- stale-revision protection;
- explicit persisted-ticket edit route;
- unsaved navigation blocker;
- desktop `ResizableWorkspace`;
- mobile single-column fallback.

New work must extend these foundations instead of creating competing form, toast, parser, persistence or validation systems.

---

# 4. Feature inventory

All items below are in scope:

1. Smart Template Profiles
2. Unified Smart Import 2.0
3. Outlook `.msg` Auto Extract
4. Selective Apply / Import Review
5. Smart Title Builder
6. Impact Auto Builder
7. Progress Quick Update
8. Reusable Progress Snippets
9. Operator Presets
10. Report Validation Center
11. Time Intelligence
12. Duplicate Incident Detection
13. Related Tickets / Incident Groups
14. Auto Save Draft Recovery
15. Revision Diff / Audit History
16. Shift Handover Summary
17. Copy Center / Copy Sections
18. Generator Quick Actions + Keyboard
19. Evidence / Attachment Workspace local-only

---

# 5. Smart Template Profiles

Create deterministic profile definitions instead of hardcoding operational formatting in `TicketGeneratorPage.jsx`.

Initial profile:

```text
MANDAU_DEFAULT
```

Profile contract must support:

- profile ID;
- display name;
- operational timezone;
- title template/formatter;
- report section ordering;
- optional/required sections;
- alarm-family normalization rules;
- Progress snippet collection;
- default copy format;
- parser adapter hints;
- transport/family labels where relevant.

Current MANDAU operational timezone:

```text
Asia/Jakarta
```

Future profiles must be addable without rewriting the Generator page.

---

# 6. Unified Smart Import 2.0

Replace the concept of one Smart Paste parser with a shared import pipeline.

Supported sources:

1. existing NOC report text;
2. raw alarm text;
3. pasted email body;
4. Outlook `.msg` file;
5. optional `.eml` adapter after `.msg` parity.

Pipeline:

```text
source
  -> source adapter
  -> normalized Import Candidate
  -> conflict/warning analysis
  -> selective preview
  -> explicit operator Apply
  -> live Generator form
```

No source adapter can mutate form state or Firestore directly.

The current report parser becomes the `report_text` adapter and must retain behavior parity.

---

# 7. Outlook `.msg` Auto Extract

## 7.1 Local file behavior

Operator may drag/drop or choose a `.msg` file.

Parsing occurs locally in the browser.

A browser-compatible `.msg` decoder is only responsible for decoding Outlook Compound File/MAPI data. Operational recognition stays in app-owned deterministic code.

Before locking a dependency:

- verify browser `ArrayBuffer` support;
- reject Node-only runtime requirements;
- verify subject/plain-text/HTML extraction;
- verify MAPI timestamp extraction;
- verify package license;
- verify bundle impact;
- test corrupt/malformed files;
- pin exact dependency version;
- document dependency ownership;
- dynamically import the decoder where practical.

## 7.2 Critical Dispatch Time rule

For Outlook `.msg` import:

> **Generator `Dispatch Time` MUST come from the current email's Sent Time.**

Canonical source:

```text
PR_CLIENT_SUBMIT_TIME
MAPI tag: 0x00390040
property id: 0x0039
property type: PT_SYSTIME
```

Mapping:

```text
messageSentAt -> dispatchAt
```

Do **not** derive Dispatch Time from:

- `Dispatch to` / `Dispatch To` body field;
- Delivery/Received timestamp;
- `PR_MESSAGE_DELIVERY_TIME`;
- quoted `Sent:` lines inside the body;
- forwarded/replied email header blocks;
- file creation/modification time;
- Occur Time;
- filename timestamps.

The 19 direct MANDAU samples contained top-level Sent metadata in 19/19 messages. Delivery Time was also present but was a distinct later instant, confirming that Sent and Delivery must not be conflated.

Quoted `Sent:` text appeared in 10/19 direct MANDAU bodies, sometimes more than once. Therefore generic body regex for Dispatch Time is forbidden.

## 7.3 Sent Time conversion

MAPI `PT_SYSTIME` is an absolute FILETIME/UTC instant.

Required conversion:

```text
PR_CLIENT_SUBMIT_TIME
  -> decode absolute UTC instant
  -> retain normalized instant internally
  -> convert to profile timezone
  -> MANDAU_DEFAULT = Asia/Jakarta
  -> fill Generator datetime-local dispatchAt
```

Do not manually add seven hours.

Use timezone-aware date conversion.

If the current form remains minute precision, UI may display minute precision while provenance retains source instant/seconds where practical.

## 7.4 Missing Sent Time

If Sent metadata is missing or malformed:

- leave imported Dispatch Time unresolved;
- do not replace an existing form value;
- show warning: `Email Sent Time was not available; Dispatch Time needs review.`;
- allow manual entry;
- never silently fall back to Delivery Time.

For future `.eml`, the current top-level RFC `Date` header may act as source-specific Sent Time, but quoted body headers remain invalid sources.

For plain pasted email body without trustworthy message metadata, Dispatch Time remains manual.

## 7.5 Extracted operational fields

Target extraction across FLP/MANDAU and direct MANDAU variants:

- source/profile identifier;
- source state/status;
- severity;
- condition (`DOWN`, etc.);
- TT values;
- canonical incident key;
- transport/family label;
- ordered path endpoints;
- Site ID;
- Site Name;
- Alarm;
- Alarm Source;
- EMS Alarm No;
- Alarm Location Info;
- Occur Time;
- message Sent Time;
- Dispatch To;
- Region;
- Description;
- Last Link Flapped;
- status;
- safe subject provenance.

`Dispatch To` remains operational metadata only. It is **not** Generator Dispatch Time.

---

# 8. Corpus findings — 39 real emails

The corpus consists of:

- 20 FLP/MANDAU structured alarm emails;
- 19 direct MANDAU link-down emails.

Real files stay outside the repo. Sanitized synthetic fixtures reproduce their structures.

## 8.1 FLP/MANDAU body field stability

Observed consistently in the first 20 samples:

- TT
- Alarm
- Alarm Source
- EMS Alarm No
- Site ID
- Site Name
- Severity
- Occur Time
- Dispatch To
- Region
- Status

Observed optional:

- Description: 17/20
- Last Link Flapped: 4/20

Literal `undefined` and blank values must normalize to missing values, not legitimate text.

## 8.2 Alarm variants

Observed:

- `LINK_DOWN`
- `Link Down`
- `ETH_LOS`
- `MUT_LOS`
- `Physical Port Down`

Rules:

- preserve `rawAlarm`;
- derive `alarmFamily` separately;
- never destroy raw source text;
- normalization is used only for title/duplicate/business logic.

Initial broad normalization may map `LINK_DOWN`, `Link Down`, and `Physical Port Down` into a `LINK_DOWN` family while keeping raw values intact.

`ETH_LOS` and `MUT_LOS` remain distinct until an explicit operational rule says otherwise.

## 8.3 Region variants

Observed examples include:

- `WEST JAVA & CENTRAL JAVA`
- `JABOTABEK`

No single region may be hardcoded into the parser.

## 8.4 Direct MANDAU subject families

The 19 direct MANDAU subjects proved that a single `DWDM A <> B` parser is insufficient.

Observed transport/family variants include:

- DWDM
- DWDM ZTE
- DWDM 1800
- DWDM UJB
- OSN 3500

Subject recognition must separate:

```text
brand/profile marker
condition
transport/family
path endpoints
TT
```

without relying on one fixed vendor/technology prefix.

## 8.5 Multi-endpoint path

The corpus contains mostly two-endpoint paths but also a three-point path.

Therefore the canonical model is:

```js
pathEndpoints: [endpoint1, endpoint2, ...endpointN]
```

not only:

```js
endpointA
endpointB
```

Compatibility helpers may expose first/last endpoint, but persisted/import contracts must support N >= 1.

## 8.6 Path orientation equivalence

For duplicate matching:

```text
A <> B <> C
```

and

```text
C <> B <> A
```

represent the same path orientation-equivalent sequence.

Do **not** lexically sort every endpoint, because that destroys topology order.

Canonical `pathKey` rule:

1. normalize each endpoint token;
2. build forward sequence;
3. build reversed sequence;
4. serialize both;
5. choose lexically smaller serialized sequence as `pathKey`.

This preserves topology while making reverse orientation equivalent.

## 8.7 Repeated links and multiple TTs

The corpus includes repeated physical/logical paths with distinct TTs.

Therefore:

- same `pathKey` is not a hard duplicate;
- duplicate detection is scored/advisory;
- exact incident identity is strongest evidence;
- path + time proximity is strong but not blocking;
- multiple alarms/TTs may legitimately refer to one physical incident.

## 8.8 TT namespace variants

Observed ticket identifiers include variants such as:

```text
INC-YYYYMMDD-NNNNNNNN
DWDM-INC-YYYYMMDD-NNNNNNNN
DATACOM-INC-YYYYMMDD-NNNNNNNN
```

Preserve the raw `externalTtNumber` exactly/canonically uppercased.

Also derive an `incidentKey` based on the core `INC-YYYYMMDD-NNNNNNNN` portion where present.

Example semantic relationship:

```text
DWDM-INC-20260826-00000001
INC-20260826-00000001
```

may share:

```text
incidentKey = INC-20260826-00000001
```

This is a duplicate/relationship signal, not permission to rewrite the raw TT.

## 8.9 Additional TT labels

Direct MANDAU bodies may contain multiple TT-related labels, including operational labels such as:

- TT
- IOH TT
- H3I TT

The parser must retain source label + value rather than assuming there is only one ticket-number field.

One value may become the primary `externalTtNumber`; others remain structured related identifiers.

Conflicting primary TT candidates require review.

---

# 9. Normalized Import Candidate

Create one app-owned candidate contract used by every adapter.

Suggested shape:

```js
{
  source: {
    kind: 'report_text' | 'raw_alarm' | 'email_text' | 'outlook_msg' | 'eml',
    profileId: 'MANDAU_DEFAULT',
    parserVersion: 1,
    sourceName: null,
    subject: null,
    messageSentAt: null
  },

  fields: {
    title: candidateField,
    externalTtNumber: candidateField,
    incidentKey: candidateField,
    occurAt: candidateField,
    dispatchAt: candidateField,
    pic: candidateField,
    rootcause: candidateField,
    cutPoint: candidateField,
    impactList: candidateField
  },

  alarmContext: {
    rawAlarm: candidateField,
    alarmFamily: candidateField,
    alarmSource: candidateField,
    emsAlarmNo: candidateField,
    siteId: candidateField,
    siteName: candidateField,
    severity: candidateField,
    sourceStatus: candidateField,
    dispatchTo: candidateField,
    region: candidateField,
    description: candidateField,
    lastLinkFlapped: candidateField,
    transportFamily: candidateField,
    pathEndpoints: [],
    pathKey: candidateField,
    relatedIdentifiers: []
  },

  progress: [],
  warnings: [],
  conflicts: [],
  stats: {}
}
```

`candidateField`:

```js
{
  value,
  rawValue,
  source: 'mapi' | 'body' | 'subject' | 'filename' | 'inference',
  confidence: 'exact' | 'strong' | 'weak',
  sourceLine: null,
  selected: true
}
```

For `.msg` Dispatch Time:

```text
source = mapi
confidence = exact
```

when `PR_CLIENT_SUBMIT_TIME` is successfully decoded.

---

# 10. Source priority and conflict rules

General source priority for operational text fields:

1. trusted structured body label;
2. subject;
3. sanitized filename fallback;
4. inference.

Exceptions:

- Dispatch Time from `.msg`: top-level Sent/MAPI metadata is authoritative.
- filename must never override a trustworthy subject/body/MAPI field.

Do not silently resolve conflicts.

Examples:

- subject TT != body primary TT → blocking import conflict;
- subject Severity != body Severity → review warning;
- subject path vs body Site/path mismatch → warning;
- imported field replacing non-empty dirty form value → explicit selection required.

---

# 11. Selective Apply / Import Review

Smart Import 2.0 becomes selective rather than all-or-nothing.

Review categories:

- Identity
- Time
- Path / Alarm
- Impact
- Progress
- Optional context

Operator can:

- Apply all safe fields;
- uncheck individual fields;
- choose between conflicting candidates;
- retain current form values;
- preview replacements.

Rules:

- dirty form values are never replaced without explicit selection;
- imported Progress shows count/time range;
- Impact de-duplication only uses safe exact-normalized equality;
- source metadata is persisted only through normal Ticket Save;
- import preview itself causes no Firestore write.

---

# 12. Smart Title Builder

Modes:

```text
Generated
Manual override
```

Suggested MANDAU inputs:

- profile/region tag;
- condition/alarm family;
- transport/family;
- ordered `pathEndpoints`;
- primary external TT.

Rules:

- title stays manually editable;
- manual edit switches to override mode;
- later metadata changes do not unexpectedly rewrite manual text;
- explicit Regenerate returns to generated title;
- title formatter consumes normalized metadata instead of reparsing the title itself;
- existing TT extraction compatibility remains supported.

---

# 13. Impact Auto Builder

Sources:

- imported Impact block from report text;
- explicitly labeled impact/service data;
- operator-pasted service/node list.

Do not invent impact solely from Site ID or topology.

Capabilities:

- parse multiline Impact;
- normalize bullets/numbers;
- exact duplicate removal;
- preserve meaningful order;
- preview/select proposed items;
- manual edit afterward.

Network-topology auto-impact is out of scope until an authoritative topology source exists.

---

# 14. Progress Quick Update

Provide a fast path for routine updates.

Requirements:

- quick add without leaving Generator;
- current timestamp default;
- editable event time;
- pending/error state;
- stale-revision handling;
- keyboard shortcut.

Persisted Ticket:

- use existing revision-safe `persistProgressAppend` path.

New unsaved Ticket:

- Progress remains local draft state until initial create.

No bypass of current mutation semantics.

---

# 15. Reusable Progress Snippets

Initial categories:

- Dispatch
- Arrival
- Investigation
- OTDR
- Material
- Jointing
- Monitoring
- Clearance
- Escalation

Snippet model:

```js
{
  id,
  label,
  category,
  template,
  placeholders: [
    { key: 'eta', label: 'ETA', type: 'time', required: true }
  ]
}
```

Rules:

- snippet fills editor only;
- no auto-submit;
- required placeholders must resolve;
- operator can edit generated text;
- profile defaults and user-local favorites are supported.

---

# 16. Operator Presets

Start browser-local and versioned.

Candidate preferences:

- default Template Profile;
- favorite Progress snippets;
- default PIC where operationally allowed;
- default Copy action;
- expanded/collapsed utility state;
- default event-time behavior.

Do not store RBAC or permission state in preferences.

Invalid/stale localStorage must fail safely and support Reset to defaults.

---

# 17. Report Validation Center

Create one derived validation model that complements field-level Zod messages.

## Blocking

Examples:

- invalid coordinate pair;
- Running-required Title missing;
- Occur Time missing before Running;
- unresolved primary TT conflict;
- impossible time ordering.

## Warning

Examples:

- OCR coordinate not verified;
- no recent Progress;
- PIC empty;
- Rootcause empty;
- unresolved import conflict not applied;
- suspected duplicate;
- email Sent Time unavailable so Dispatch Time requires review.

## Informational

Examples:

- no coordinate;
- optional Impact empty;
- optional email Description unavailable.

Rules:

- reuse domain lifecycle validation;
- do not duplicate rules with divergent logic;
- findings link/focus relevant field;
- warning-only findings do not block Save.

---

# 18. Time Intelligence

Derived values:

- incident elapsed time;
- dispatch delay = Dispatch Time - Occur Time;
- time since latest Progress;
- resolved duration;
- latest update age.

Rules:

- use normalized timestamps;
- no SLA breach semantics yet;
- minute-level refresh is sufficient;
- no second-by-second global rerender;
- profile timezone is explicit.

For email-imported Dispatch Time, calculations use the normalized Sent instant, not Delivery Time.

---

# 19. Duplicate Incident Detection

Duplicate detection is advisory, never a blind hard block.

## 19.1 Indexed metadata

Persist/index where justified:

- `externalTtNumber`
- `incidentKey`
- `pathKey`
- optional `siteKey`
- optional `alarmFingerprint`

## 19.2 Scoring

Suggested evidence:

- exact external TT match: critical;
- same `incidentKey`: critical/high;
- same `pathKey` + occurrence within ±15 minutes: high;
- same active `pathKey`: high;
- same Site ID + alarm family + close Occur Time: medium;
- normalized title similarity: weak fallback.

Different EMS Alarm Numbers do not prove different physical incidents.

## 19.3 Query constraints

Priority:

1. exact external TT lookup;
2. incidentKey lookup;
3. active/recent pathKey lookup;
4. bounded recent fallback if absolutely necessary.

No collection-wide client scan.

## 19.4 UX

Show:

- candidate TT;
- status;
- occur time;
- latest update;
- matching reasons.

Actions:

- Review existing Ticket;
- Create anyway;
- Link as related incident.

---

# 20. Related Tickets / Incident Groups

Recommended model:

```text
incidentGroups/{groupId}
  title
  pathKey
  createdAt
  createdBy
  updatedAt

tickets/{ticketId}
  incidentGroupId
```

Capabilities:

- create group from duplicate suggestion;
- link existing Ticket;
- unlink;
- show bounded related-Ticket list.

Each Ticket retains independent lifecycle, revision and Progress state.

---

# 21. Auto Save Draft Recovery

This is local recovery, not hidden Firestore auto-save.

## New Ticket

Persist versioned local draft containing:

- form values;
- local Progress draft;
- selected Template Profile;
- compact import candidate metadata required for recovery;
- dirty timestamp.

Never store:

- `.msg` bytes;
- raw email body/HTML;
- OCR image bytes;
- attachment blobs.

Restore flow:

- detect draft;
- show timestamp;
- Restore or Discard;
- clear after successful Ticket creation;
- expire by TTL.

## Existing Ticket

Optional recovery snapshot may be keyed by:

```text
ticketId + baseRevision
```

If revision changed, do not auto-restore; require manual review.

---

# 22. Revision Diff / Audit History

Reuse immutable `auditEvents`.

Enhance future `TICKET_UPDATED` audit events with compact field diffs.

Example:

```js
{
  type: 'TICKET_UPDATED',
  revisionFrom: 8,
  revisionTo: 9,
  details: {
    changes: {
      pic: { from: 'A', to: 'B' },
      cutPoint: { from: 'X', to: 'Y' }
    }
  }
}
```

Rules:

- operational fields only;
- no raw email content;
- bounded history, e.g. latest 50;
- old audit events without diff remain readable;
- Progress/status/coordinate keep dedicated event semantics.

---

# 23. Shift Handover Summary

Generate deterministic copyable summary from current Ticket state.

Inputs:

- TT;
- status;
- Occur Time;
- duration;
- PIC;
- Rootcause;
- Cut Point;
- latest/recent Progress;
- Validation Center warnings;
- related Ticket count.

Output is preview/copy only by default.

No AI generation is required.

---

# 24. Copy Center

Required copy targets:

- Full Report;
- Title;
- Impact;
- Latest Progress;
- Full Progress Timeline;
- Coordinate;
- primary TT;
- Handover Summary;
- operational source/alarm summary.

All output must use canonical formatter functions, not ad-hoc JSX strings.

---

# 25. Generator Quick Actions and Keyboard

Shortcuts:

- `Ctrl/Cmd + S` → Save;
- `Ctrl/Cmd + Enter` → Add Progress when Progress editor owns focus;
- Command Palette → Copy Report;
- Command Palette → focus Smart Import;
- Command Palette → focus Progress;
- Command Palette → Validation Center.

Do not assign an easy accidental shortcut to lifecycle transitions.

Dialog/menu keyboard scopes must remain safe.

---

# 26. Evidence / Attachment Workspace

Initial scope remains local-only:

- local file queue;
- thumbnail/filename/size/type;
- OCR coordinate action;
- extracted coordinate metadata;
- operator note;
- remove/re-attach.

No binary cloud persistence.

After reload, persisted metadata may remain, but UI must not pretend the original local file is still available.

---

# 27. Proposed Ticket schema v2

Avoid bulk migration.

Suggested optional structure:

```js
{
  schemaVersion: 2,

  templateProfileId: 'MANDAU_DEFAULT',

  externalTtNumber: null,
  incidentKey: null,
  pathKey: null,

  alarmContext: {
    rawAlarm: '',
    alarmFamily: '',
    alarmSource: '',
    emsAlarmNo: '',
    siteId: '',
    siteName: '',
    severity: '',
    sourceStatus: '',
    dispatchTo: '',
    region: '',
    description: '',
    lastLinkFlapped: '',
    transportFamily: '',
    pathEndpoints: [],
    relatedIdentifiers: []
  },

  importProvenance: {
    kind: 'outlook_msg',
    parserVersion: 1,
    sourceSubject: '',
    messageSentAt: null,
    importedAt: Timestamp,
    importedBy: uid
  },

  incidentGroupId: null
}
```

Rules:

- provenance remains compact;
- no raw body;
- no recipients;
- no Exchange transport headers;
- no email attachment bytes;
- v1 readers/writers remain backward compatible until v2 phase lands;
- existing Tickets upgrade lazily on later save where appropriate;
- no mandatory bulk backfill.

Before schema v2 is enabled, update:

- entity normalizer;
- form mapper;
- Firestore mapper;
- create mutation;
- save mutation;
- Security Rules allowed keys/types;
- emulator tests;
- report compatibility.

---

# 28. Firestore query/index plan

Add indexes only for production queries that actually land.

## Exact TT

```text
tickets
where externalTtNumber == X
limit small
```

## Incident key

```text
tickets
where incidentKey == X
orderBy updatedAt desc
limit 10
```

## Active/recent path

```text
tickets
where pathKey == X
where status in [DRAFT, RUNNING]
orderBy occurAt desc
limit 10
```

## Related group

```text
tickets
where incidentGroupId == X
orderBy updatedAt desc
limit 50
```

## Revision history

```text
tickets/{ticketId}/auditEvents
orderBy createdAt desc
limit 50
```

---

# 29. Synthetic email fixture matrix

Never commit the 39 real emails.

Create fake/sanitized fixtures for at least:

1. FLP standard LINK_DOWN complete body;
2. `Link Down` casing variant;
3. `ETH_LOS`;
4. `MUT_LOS` with literal `undefined` fields;
5. `Physical Port Down`;
6. missing Description;
7. missing Last Link Flapped;
8. missing endpoint;
9. reversed two-endpoint path;
10. same path + different TT;
11. same path + near-identical Occur Time;
12. subject/body TT mismatch;
13. malformed Occur Time;
14. corrupt `.msg`;
15. oversized file;
16. HTML-only body;
17. valid top-level Sent Time;
18. missing Sent Time;
19. conflicting Delivery Time proving Delivery is ignored;
20. quoted `Sent:` body line proving quoted time is ignored;
21. multiple quoted `Sent:` lines;
22. DWDM subject;
23. DWDM ZTE subject;
24. DWDM 1800 subject;
25. DWDM UJB subject;
26. OSN 3500 subject;
27. three-endpoint path;
28. reverse three-endpoint path;
29. `INC-...` TT;
30. `DWDM-INC-...` TT;
31. `DATACOM-INC-...` TT;
32. same incidentKey with different TT prefix;
33. multiple TT body labels such as primary TT + related identifiers.

---

# 30. Feature execution phases

Every phase must finish Quality-green before the next.

## GEN-F0 — Contracts and feature skeleton

- [ ] Close MEGA-10 tracker/PR metadata using Quality #742 and human sign-off.
- [ ] Create dedicated Generator feature branch from validated foundation.
- [x] Maintain this workplan as source of truth.
- [ ] Define normalized Import Candidate.
- [ ] Define Template Profile contract.
- [ ] Define alarm normalization helper.
- [ ] Define TT normalization + `incidentKey` helper.
- [ ] Define ordered `pathEndpoints` parser.
- [ ] Define orientation-equivalent `pathKey` helper.
- [ ] Define timezone conversion contract.
- [ ] Define `.msg` Sent Time → `dispatchAt` contract.
- [ ] Define schema-v2 compatibility proposal.
- [ ] Add sanitized corpus-inspired pure-unit fixtures.
- [ ] No production behavior change yet.
- [ ] Full Quality green.

**Exit:** contracts are stable and current Generator behavior is unchanged.

---

## GEN-F1 — Unified Import + Outlook `.msg`

- [ ] Refactor current report parser behind `report_text` adapter.
- [ ] Preserve current report parser parity.
- [ ] Dependency spike + pin browser `.msg` reader.
- [ ] Decode top-level MAPI properties.
- [ ] Extract `PR_CLIENT_SUBMIT_TIME`.
- [ ] Explicitly ignore `PR_MESSAGE_DELIVERY_TIME` for Dispatch Time.
- [ ] Add safe timezone-aware Sent Time conversion.
- [ ] Add email subject parser for observed transport families.
- [ ] Add FLP structured-body parser.
- [ ] Add direct MANDAU body parser.
- [ ] Parse multiple TT labels/related identifiers.
- [ ] Add sanitized HTML-to-text fallback.
- [ ] Normalize blank/`undefined` fields.
- [ ] Add source/confidence metadata.
- [ ] Add subject/body conflict detection.
- [ ] Add filename fallback at lowest confidence.
- [ ] Add selective Apply model.
- [ ] Verify quoted body `Sent:` lines never populate Dispatch Time.
- [ ] Verify `.msg` bytes never leave browser.
- [ ] Bundle/dependency hygiene review.
- [ ] Full Quality green.

**Exit:** `.msg` deterministically produces safe import preview including Dispatch Time from current-message Sent metadata only.

---

## GEN-F2 — Structured metadata + Template Profile + Smart Title

- [ ] Extend Ticket entity with v2 optional metadata.
- [ ] Backward-compatible v1 mapper.
- [ ] Update Firestore writes.
- [ ] Update Security Rules + emulator matrix.
- [ ] Persist `incidentKey`.
- [ ] Persist `pathKey` + ordered `pathEndpoints`.
- [ ] Persist compact Sent-time provenance.
- [ ] Add `MANDAU_DEFAULT` title generator.
- [ ] Support transport/family variants.
- [ ] Support N-endpoint paths in generated titles.
- [ ] Add Generated / Manual override state.
- [ ] Add explicit Regenerate.
- [ ] Full Quality green.

**Exit:** imported operational metadata survives Save safely and title generation is deterministic.

---

## GEN-F3 — Impact + Progress acceleration

- [ ] Impact candidate parser.
- [ ] multiline Impact import.
- [ ] exact duplicate filtering.
- [ ] selective Impact apply.
- [ ] Quick Progress.
- [ ] snippet library.
- [ ] placeholder resolver.
- [ ] local favorite snippets.
- [ ] `Ctrl/Cmd+Enter` scoped Progress submit.
- [ ] revision-safe persisted Progress.
- [ ] local-only Progress before initial create.
- [ ] Full Quality green.

**Exit:** routine operator updates require materially fewer keystrokes.

---

## GEN-F4 — Validation Center + Time Intelligence

- [ ] derived Validation model.
- [ ] bridge Zod errors.
- [ ] bridge domain lifecycle validation.
- [ ] source conflict findings.
- [ ] missing Sent Time/Dispatch review finding.
- [ ] coordinate verification finding.
- [ ] duplicate warning integration.
- [ ] incident elapsed time.
- [ ] dispatch delay.
- [ ] last-progress age.
- [ ] resolved duration.
- [ ] focus-to-field actions.
- [ ] no SLA judgement.
- [ ] Full Quality green.

**Exit:** one deterministic readiness source explains blockers/warnings/info.

---

## GEN-F5 — Duplicate Detection + Related Tickets

- [ ] exact TT repository query.
- [ ] incidentKey query.
- [ ] pathKey active/recent query.
- [ ] bounded queries only.
- [ ] duplicate scoring.
- [ ] reverse-path equivalence tests.
- [ ] three-endpoint path tests.
- [ ] duplicate suggestion preview.
- [ ] Review Existing.
- [ ] Create Anyway.
- [ ] incident group entity/rules.
- [ ] create/link/unlink relationship.
- [ ] bounded related-Ticket query.
- [ ] Full Quality green.

**Exit:** duplicate risk is visible without blocking legitimate multi-TT incidents.

---

## GEN-F6 — Draft Recovery + Revision Diff

- [ ] versioned local new-Ticket draft.
- [ ] TTL.
- [ ] Restore / Discard.
- [ ] clear after successful create.
- [ ] exclude `.msg`, raw email and OCR bytes.
- [ ] optional persisted-Ticket recovery keyed by base revision.
- [ ] no auto-restore over stale revision.
- [ ] compact audit field diffs.
- [ ] bounded audit query.
- [ ] Revision History model.
- [ ] legacy audit compatibility.
- [ ] Full Quality green.

**Exit:** interrupted work is recoverable and revisions are understandable.

---

## GEN-F7 — Handover + Copy + Presets + Commands

- [ ] deterministic handover formatter.
- [ ] compact handover variant.
- [ ] Copy Full Report.
- [ ] Copy Title.
- [ ] Copy Impact.
- [ ] Copy Latest Progress.
- [ ] Copy Full Progress.
- [ ] Copy Coordinate.
- [ ] Copy TT.
- [ ] Copy Handover.
- [ ] versioned local presets.
- [ ] Reset preferences.
- [ ] `Ctrl/Cmd+S`.
- [ ] Command Palette Generator actions.
- [ ] keyboard/focus regression.
- [ ] Full Quality green.

**Exit:** recurring copy/handover/power-user actions use canonical formatters.

---

## GEN-F8 — Evidence workspace

- [ ] local file queue.
- [ ] image metadata.
- [ ] local thumbnail.
- [ ] OCR coordinate action.
- [ ] evidence note.
- [ ] remove/re-attach.
- [ ] no binary cloud persistence.
- [ ] reload clearly distinguishes metadata from unavailable local file.
- [ ] memory/object URL cleanup.
- [ ] file type/size validation.
- [ ] Full Quality green.

**Exit:** evidence assists operator without weakening storage/privacy architecture.

---

## GEN-F9 — Integrated hardening / release readiness

- [ ] Prettier + committed-format verification.
- [ ] ESLint.
- [ ] all unit/component tests.
- [ ] Firebase Emulator repository tests.
- [ ] Firestore Security Rules.
- [ ] dependency/security/legacy hygiene.
- [ ] release preflight.
- [ ] generic production build.
- [ ] Firebase-configured production build.
- [ ] real-browser responsive/touch matrix.
- [ ] Admin lifecycle E2E.
- [ ] Operator/Viewer RBAC.
- [ ] `.msg` import E2E with sanitized fixture.
- [ ] Sent Time → Dispatch Time E2E.
- [ ] quoted `Sent:` rejection E2E.
- [ ] selective overwrite-safety E2E.
- [ ] multi-endpoint path E2E.
- [ ] duplicate detection E2E.
- [ ] draft restore E2E.
- [ ] revision diff E2E.
- [ ] keyboard shortcut E2E.
- [ ] Light/Dark serious/critical axe.
- [ ] mobile no-horizontal-overflow.
- [ ] human NOC workflow acceptance.
- [ ] workplan closed with final evidence.

**Exit:** feature program is production-ready and visual overhaul may start afterward.

---

## GEN-F9 final closure evidence

- Focused GEN-F9 browser QA: **7/7 passed** (run `33010779128`).
- Canonical Quality **#807 FULL GREEN** (run `33013473856`) on automated-gate head `6bd6485ebf8c19e7aa6ab419b6f2e5965bd764bb`.
- Human NOC workflow acceptance explicitly recorded on **2026-08-27** from the user instruction to proceed to the next phase.
- Feature-program protected contracts remain unchanged.
- Dedicated Template Generator visual overhaul is now authorized to start on top of the completed feature-program head.

---
# 31. Test strategy

## Pure unit

- report adapter parity;
- MAPI Sent Time decode/normalization adapter contract;
- timezone conversion;
- quoted `Sent:` rejection;
- subject parsing;
- FLP body parsing;
- direct MANDAU body parsing;
- multiple TT labels;
- `incidentKey` normalization;
- alarm normalization;
- `pathEndpoints` parsing;
- forward/reverse `pathKey` equivalence;
- three-endpoint path;
- import conflict resolver;
- Smart Title formatter;
- Impact parser;
- snippet placeholders;
- Validation model;
- time calculations;
- duplicate scoring;
- handover/copy formatters;
- local draft serialization/version migration.

## Component

- Import Review selective apply;
- dirty-field overwrite protection;
- missing Sent Time warning;
- Smart Title manual override;
- Progress Quick Update;
- snippets;
- Validation Center focus actions;
- duplicate suggestions;
- Restore Draft;
- Revision History;
- Related Tickets;
- Copy menu;
- evidence local queue.

## Emulator

- schema-v2 create/save;
- schema-v1 read/save compatibility;
- alarm/path metadata types;
- incidentGroup permissions;
- duplicate query bounds;
- audit diff immutability;
- related-Ticket query bounds.

## Real browser

- `.msg` File input / drag-drop;
- Sent metadata drives Dispatch Time;
- quoted body Sent is ignored;
- no network upload of file bytes;
- selective apply;
- keyboard/focus;
- desktop/mobile geometry;
- Light/Dark;
- no horizontal overflow;
- axe.

---

# 32. Failure-state matrix

| Failure | Expected behavior |
|---|---|
| corrupt `.msg` | local parse error; form untouched |
| unsupported `.msg` | explain unsupported source; no upload |
| missing Sent metadata | Dispatch unresolved; warning; manual entry |
| malformed Sent metadata | no Delivery fallback; manual review |
| Delivery differs from Sent | Sent wins for Dispatch Time |
| quoted body `Sent:` exists | ignored for Dispatch Time |
| subject/body TT conflict | blocking import conflict; operator decides |
| multiple TT labels | preserve identifiers; primary selection rules apply |
| literal `undefined` | missing value |
| malformed Occur Time | warning + raw value visible |
| no useful extracted fields | Apply disabled |
| dirty form + import | replacements require explicit selection |
| reverse path | same pathKey |
| same path + different TT | advisory duplicate only |
| Firestore network error | live form remains intact |
| stale revision | reload/review; no blind retry |
| draft schema changed | safe migrate or discard |
| clipboard failure | toast/error |
| local evidence lost after reload | metadata may remain; file unavailable |

---

# 33. Performance budget

- parse common `.msg` asynchronously;
- avoid UI blocking;
- release raw file buffers after parsing;
- do not parse file again on each React render;
- dynamically import heavy `.msg` decoder where practical;
- memoize derived validation/time models where useful;
- debounce duplicate lookup;
- do not query duplicate candidates on every character;
- all Firestore queries have explicit limits;
- no second-by-second global timers.

---

# 34. Security / privacy QA

Required guarantees:

- `.msg` bytes never sent to Firebase/external parser/AI;
- no recipient addresses persisted;
- no Exchange transport headers persisted;
- no raw email body persisted;
- no raw HTML injection;
- imported text treated as untrusted input;
- provenance is compact and operational only;
- evidence bytes never uploaded;
- local presets cannot alter RBAC;
- Viewer cannot mutate import/save/group/history state;
- audit events remain immutable;
- schema-v2 rules reject unexpected field types/keys.

---

# 35. Data migration strategy

Do not bulk rewrite existing Tickets.

Plan:

1. mapper reads schema v1 and v2;
2. v1 Ticket behaves as today;
3. new Tickets use v2 after schema phase lands;
4. editing v1 may lazily upgrade on successful save;
5. new optional metadata defaults safely;
6. legacy audit events remain readable;
7. no mandatory backfill.

Old Tickets without `pathKey`/`incidentKey` use bounded fallback behavior rather than collection-wide migration.

---

# 36. Definition of Done

The Template Generator feature program is complete only when:

1. GEN-F0 through GEN-F9 are complete;
2. existing report/lifecycle behavior remains backward compatible;
3. all 39-email structural findings are represented by sanitized fixtures;
4. `.msg` parsing is browser-local;
5. Dispatch Time from email is proven to come from current-message Sent metadata;
6. Delivery Time and quoted Sent lines are proven not to populate Dispatch Time;
7. multi-endpoint and reverse-path behavior is covered;
8. raw private email is never committed/persisted;
9. duplicate detection is bounded/advisory;
10. related Tickets retain independent lifecycle/revision;
11. draft recovery respects stale revisions;
12. revision history is meaningful/immutable;
13. copy/handover output is deterministic;
14. new features are keyboard-accessible;
15. Light/Dark + mobile/desktop acceptance passes;
16. final clean-head Quality is fully green;
17. manual NOC workflow acceptance is complete.

Only then should the dedicated **Template Generator visual/UI overhaul PRD** begin.

---

# 37. Recommended implementation order

```text
Contracts / normalization
    ↓
TT incidentKey + ordered path/pathKey
    ↓
Unified import pipeline
    ↓
MSG decoder + Sent Time metadata
    ↓
FLP + direct MANDAU parsers
    ↓
Selective Import Review
    ↓
Schema v2 + structured alarm/path metadata
    ↓
Template Profiles / Smart Title
    ↓
Impact + Progress acceleration
    ↓
Validation / Time Intelligence
    ↓
Duplicate Detection
    ↓
Related Tickets
    ↓
Draft Recovery / Revision History
    ↓
Handover / Copy / Commands / Presets
    ↓
Evidence Workspace
    ↓
Integrated QA
```

This order prevents visible UI work from inventing data contracts that later need to be rewritten.

---

# 38. First implementation task after plan approval

Start with **GEN-F0 only**.

Do not start by adding the `.msg` upload button.

First implementation set must establish:

1. normalized Import Candidate;
2. alarm normalization;
3. TT namespace normalization + `incidentKey`;
4. ordered `pathEndpoints` parser;
5. orientation-equivalent `pathKey`;
6. Template Profile interface;
7. timezone/Sent-Time contract;
8. sanitized 39-corpus-inspired fixtures;
9. schema-v2 proposal tests without production persistence change.

After those contracts are Quality-green, proceed to GEN-F1 `.msg` decoding and Email Import.
