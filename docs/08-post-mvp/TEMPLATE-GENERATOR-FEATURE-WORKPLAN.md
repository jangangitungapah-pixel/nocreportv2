# Template Generator Feature Expansion — Detailed Workplan

**Status:** PLANNING — APPROVED DIRECTION, IMPLEMENTATION NOT STARTED  
**Primary page:** `/generator/new` and `/generator/:ticketId/edit`  
**Repository:** `jangangitungapah-pixel/nocreportv2`  
**Planning branch:** `feature/ui-density-system`  
**Baseline:** Mega UI foundation through MEGA-10 automated QA; Quality #742 full green.  
**Planning date:** 2026-08-26  
**Source context:** current deterministic Smart Import, Ticket/Progress persistence, OCR coordinate workflow, canonical report output, revision protection, RBAC, and 20 user-provided FLP/MANDAU Outlook `.msg` incident emails analyzed locally for format discovery.

---

## 1. Purpose

Evolve Template Generator from a form/report editor into a high-speed NOC incident authoring workstation.

The feature expansion must optimize for:

1. less manual typing;
2. fewer copy/paste mistakes;
3. safer import from operational sources;
4. faster progress updates;
5. early detection of duplicate/related incidents;
6. better continuity across operator shifts;
7. explicit data-quality checks before lifecycle transitions;
8. strong recovery from refresh/network/browser interruptions;
9. useful history without weakening optimistic revision protection;
10. preserving the current deterministic, local-first and bounded-query architecture.

This workplan intentionally defines **feature behavior and data contracts before any page-level UI overhaul**.

---

## 2. Protected contracts

The following behavior is non-negotiable unless a later dedicated product decision explicitly changes it:

- `/tickets/:ticketId` remains read-only review.
- `/generator/:ticketId/edit` remains the explicit mutation workspace.
- Ticket lifecycle semantics remain Draft → Running → Resolved → Archived as currently defined.
- Admin/Operator/Viewer capability outcomes remain unchanged.
- Firestore Security Rules remain authoritative.
- optimistic `revision` checks remain mandatory for Ticket and Progress mutations.
- canonical report output remains deterministic.
- OCR remains browser-local and images are not silently uploaded.
- Smart Import and Email Import never auto-write to Firestore.
- no AI/API is required for parsing operational reports or email.
- no imported source may silently overwrite the live Generator form.
- all Firestore list/search operations remain bounded.
- raw operational email transport headers, recipient lists, HTML and attachment bytes are not persisted by default.

---

## 3. Current baseline

Existing Generator already provides:

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

The new work must **extend these foundations rather than create parallel implementations**.

---

# 4. Feature inventory

All features below are in scope.

## F1 — Smart Template Profiles

Provide deterministic formatting profiles that define how operational data becomes a report/title.

Initial profile:

- `MANDAU_DEFAULT`

Profile contract should support:

- profile ID;
- display name;
- operational timezone;
- title template;
- report section ordering;
- optional/required sections;
- alarm normalization map;
- snippet collection;
- default copy format;
- per-profile parser adapters when required.

Do not hardcode all behavior directly inside `TicketGeneratorPage.jsx`.

Future profiles must be addable without rebuilding the entire Generator.

---

## F2 — Unified Smart Import 2.0

Replace the idea of “one Smart Paste parser” with a unified import pipeline.

Supported sources:

1. existing NOC report text;
2. raw alarm text;
3. pasted email body;
4. Outlook `.msg` file;
5. optional `.eml` adapter after `.msg` parity.

Every adapter returns the same normalized preview model.

No adapter writes directly to the form.

Target flow:

`source -> source adapter -> normalized import candidate -> conflict/warning analysis -> selective preview -> explicit apply -> live form`

---

## F3 — Outlook Email Auto Extract

### Required behavior

Operator can drag/drop or choose a `.msg` file.

Parsing must happen locally in the browser.

The parser extracts only operationally useful content.

Target extraction from FLP/MANDAU samples:

- source profile / dispatch queue;
- source state;
- source severity;
- condition (`DOWN`, etc.);
- TT number;
- endpoint A;
- endpoint B;
- Site ID;
- Site Name;
- Alarm;
- Alarm Source;
- EMS Alarm No;
- Alarm Location Info;
- Occur Time;
- Dispatch To;
- Region;
- Description;
- Last Link Flapped;
- Status;
- subject text as provenance.

### `.msg` dependency spike

Browser JavaScript cannot natively decode Outlook Compound File `.msg`.

Before implementation:

- evaluate a maintained browser-compatible `.msg` reader;
- confirm it accepts `ArrayBuffer`;
- confirm no Node-only `fs/path` runtime requirement;
- confirm subject/plain text/HTML body extraction;
- verify package license;
- verify bundle impact;
- verify malformed-file behavior;
- pin exact version;
- add dependency ownership test/hygiene evidence.

The selected parser is only a **file decoding adapter**. Operational field recognition stays in app-owned deterministic code.

### Security/privacy

The `.msg` file must:

- never be uploaded to Firebase or an external parsing service;
- never be sent to AI/API;
- be held only in browser memory while parsing;
- have object URLs/references released after use;
- not render source HTML with `dangerouslySetInnerHTML`;
- convert HTML bodies to safe plain text before field parsing;
- reject unsupported/corrupt files with a local error;
- not persist recipient lists or Exchange transport headers.

### Source-priority rules

When the same field is available from multiple locations:

1. structured body label;
2. subject;
3. sanitized filename fallback;
4. inferred value.

Do **not** silently resolve conflicts.

Example:

- subject TT != body `TT = ...` → blocking import warning;
- subject Severity != body Severity → conflict warning;
- Site ID inferred from endpoint but body Site ID differs → warning.

The operator selects which value to apply.

---

# 5. Evidence from the supplied email corpus

Twenty `.msg` samples were analyzed locally. The original files must **not** be committed to the repository because they contain operational email metadata and recipient information.

## 5.1 Stable fields observed

Present in 20/20 samples:

- `TT`
- `Alarm`
- `Alarm Source`
- `EMS Alarm No`
- `Site ID`
- `Site Name`
- `Severity`
- `Occur Time`
- `Dispatch to`
- `Region`
- `Status`

Observed optional fields:

- `Description`: 17/20
- `Last link flapped`: 4/20

## 5.2 Alarm variants observed

- `LINK_DOWN`: 13
- `Link Down`: 3
- `ETH_LOS`: 2
- `MUT_LOS`: 1
- `Physical Port Down`: 1

Required parser behavior:

- preserve `rawAlarm`;
- provide a normalized alarm family separately;
- never destroy the raw value;
- treat literal `undefined` / blank as missing, not legitimate operational text.

Recommended first normalization:

- `LINK_DOWN`
- `Link Down`
- `Physical Port Down`

may map into a broad `LINK_DOWN` family for duplicate/title logic, while raw alarm remains available.

`ETH_LOS` and `MUT_LOS` remain distinct raw alarm values and may map to their own family until operational rules are explicitly defined.

## 5.3 Region variants observed

- `WEST JAVA & CENTRAL JAVA`: 14
- `JABOTABEK`: 6

The parser must not hardcode a single region.

## 5.4 Subject contract observed

Typical form:

```text
[FLP_3rd_MANDAU][Open - Critical] DOWN - <ENDPOINT_A><><ENDPOINT_B> - DATACOM-INC-YYYYMMDD-NNNNNNNN
```

Subject parser target:

```text
dispatchProfile = FLP_3rd_MANDAU
sourceStatus = Open
severity = Critical
condition = DOWN
endpointA = ...
endpointB = ...
externalTtNumber = DATACOM-INC-...
```

The parser must tolerate:

- endpoint B missing;
- spacing differences;
- underscore/slash transformations in saved filenames;
- subject text recovered from body/MSG properties when filenames are sanitized by Windows;
- endpoint A/B being reversed across related alarm emails.

## 5.5 Repeated-link evidence

The sample set contains multiple distinct TTs for the same physical/logical link.

Examples in the corpus include canonical link pairs appearing 2–3 times, including pairs where the endpoint order is reversed.

This is critical for duplicate detection:

- same link key does **not** mean the Ticket is definitely a duplicate;
- duplicate detection must be a scored suggestion;
- exact TT can be treated as strongest evidence;
- link + time proximity is strong but non-blocking evidence;
- endpoint order must be canonicalized before comparison.

## 5.6 Email parser fixtures

Do not commit the real `.msg` corpus.

Instead create sanitized synthetic fixtures that reproduce these structures:

1. standard LINK_DOWN with complete body;
2. `Link Down` casing/spacing variant;
3. `ETH_LOS`;
4. `MUT_LOS` with `undefined` alarm source/EMS number;
5. `Physical Port Down`;
6. missing Description;
7. missing Last Link Flapped;
8. endpoint B missing;
9. reversed endpoint pair;
10. same link pair + different TT;
11. same link pair + near-identical occurrence time;
12. subject/body TT mismatch;
13. malformed Occur Time;
14. corrupt `.msg`;
15. oversized file rejection;
16. HTML-only body converted to safe plain text.

The synthetic fixtures must use fake node/site/TT/address data.

---

# 6. Normalized Import Candidate contract

Create an app-owned normalized candidate instead of allowing source adapters to modify form state directly.

Suggested shape:

```js
{
  source: {
    kind: 'report_text' | 'raw_alarm' | 'email_text' | 'outlook_msg' | 'eml',
    profileId: 'MANDAU_DEFAULT',
    parserVersion: 1,
    sourceName: null,
    subject: null
  },
  fields: {
    title: candidateField,
    externalTtNumber: candidateField,
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
    endpointA: candidateField,
    endpointB: candidateField,
    linkKey: candidateField
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
  source: 'body' | 'subject' | 'filename' | 'inference',
  confidence: 'exact' | 'strong' | 'weak',
  sourceLine: null,
  selected: true
}
```

This contract enables selective apply and future source adapters without rewriting Generator form logic.

---

# 7. Selective Apply / Import Review

Smart Import 2.0 must stop being “all detected fields or nothing”.

Provide per-field selection.

Example categories:

- Identity
- Time
- Link / alarm metadata
- Impact
- Progress
- Optional context

Operator can:

- Apply all safe fields;
- uncheck fields;
- choose between conflicting candidates;
- leave existing form values untouched;
- preview what will be replaced.

Rules:

- applying a candidate into a non-empty live form value must be visually identified as a replacement;
- import must not overwrite dirty fields without explicit selection;
- progress import must show count and time range;
- duplicate impact lines are de-duplicated only when exact-normalized equality is safe;
- imported Progress remains local until normal Save/create persistence;
- source metadata is not persisted until Ticket Save.

---

# 8. Smart Title Builder

Support:

- `Generated`
- `Manual override`

Generated title uses a profile template.

Suggested MANDAU title inputs:

- profile/region tag;
- alarm family/condition;
- endpoint A;
- endpoint B;
- external TT.

The implementation must:

- keep current manual title editing available;
- show when the title is generated vs manually overridden;
- regenerate only on explicit operator action after a manual override;
- never unexpectedly rewrite a title while the operator is typing;
- preserve the canonical TT extraction behavior.

Title builder must use normalized endpoint/link metadata rather than reparsing its own output.

---

# 9. Impact Auto Builder

Impact generation must be evidence-based.

Sources may include:

- imported `Impact` block from report text;
- explicitly labeled impact lines in email/raw alarm;
- user-pasted service/node list.

Do not invent impact from Site ID alone.

Features:

- parse multiline pasted impact;
- normalize bullets/numbers;
- exact duplicate removal;
- preserve operator order;
- preview proposed impact items;
- Apply selected items;
- allow normal manual edit afterward.

Future network-topology lookup is out of scope until an authoritative topology source exists.

---

# 10. Progress Quick Update

Generator needs a fast path for common operational updates.

Required:

- quick add without navigating away;
- current timestamp default;
- explicit editable event time;
- submit through the existing revision-safe Progress mutation;
- pending/error state;
- stale-revision recovery;
- keyboard shortcut.

For a new unsaved Ticket:

- quick updates remain local draft Progress;
- normal initial Ticket create persists them using the existing creation contract.

For a persisted Ticket:

- use `persistProgressAppend`;
- never bypass revision protection.

---

# 11. Reusable Progress Snippets

Create deterministic snippet definitions.

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

Example:

```text
FO team menuju lokasi, ETA {eta}.
```

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

- selecting a snippet fills the Progress editor; it does not auto-submit;
- placeholders must be resolved before Add Update;
- operator may freely edit generated text;
- snippets may be profile defaults or user presets;
- no hidden text generation.

---

# 12. Operator Presets

Start with browser-local preferences.

Candidate preferences:

- default template profile;
- preferred Progress snippets;
- default PIC text if operationally allowed;
- default Copy action;
- collapsed/expanded utility state;
- default event-time behavior.

Storage:

- versioned localStorage;
- resilient to invalid/stale JSON;
- easy Reset to defaults.

Do not put role/permission state in local preferences.

A future cloud-synced preference subcollection can be considered separately.

---

# 13. Report Validation Center

Build one derived validation model that complements field-level Zod errors.

Categories:

### Blocking

Examples:

- invalid coordinate pair;
- lifecycle-required Title missing;
- Occur Time missing before Running;
- TT conflict from imported sources;
- impossible timestamps.

### Warning

Examples:

- coordinate detected by OCR but not verified;
- no Progress for a long-running Ticket;
- PIC empty;
- Rootcause empty;
- imported source conflict not applied;
- suspected duplicate incident.

### Informational

Examples:

- no coordinate recorded;
- Description unavailable in email source;
- optional Impact empty.

Validation Center must:

- reuse domain validation where available;
- not duplicate lifecycle rules with divergent logic;
- link/focus the relevant input;
- recompute from current form + Ticket state;
- expose a compact summary count;
- never block Save for warning-only findings.

---

# 14. Time Intelligence

Derived values:

- incident elapsed time;
- dispatch delay;
- time since latest Progress;
- time from Occur to Resolve;
- latest update age.

Rules:

- calculations use persisted/form timestamps;
- no SLA breach semantics until an authoritative SLA definition is provided;
- clocks are display-only and do not create writes;
- avoid second-by-second React rerenders; update at a sensible minute cadence.

Profile timezone must be explicit.

For current MANDAU profile, use `Asia/Jakarta` unless a source includes an explicit timezone offset.

---

# 15. Duplicate Incident Detection

Duplicate detection is advisory, never a blind hard block.

## 15.1 Indexed metadata

Persist normalized/indexable operational keys:

- `externalTtNumber`
- `linkKey`
- optional `siteKey`
- optional `alarmFingerprint`

Recommended canonical `linkKey`:

1. normalize endpoint IDs/names;
2. remove transport-reference parentheses from key material while preserving raw endpoint text separately;
3. sort A/B lexically;
4. join with `<>`.

This makes A<>B and B<>A equivalent for comparison.

## 15.2 Scoring

Suggested model:

- exact external TT match: critical duplicate signal;
- same linkKey + occurrence within ±15 minutes: high;
- same linkKey + active status: high;
- same Site ID + same alarm family + occurrence near time: medium;
- normalized title similarity: weak fallback only.

Do not treat different EMS Alarm Numbers as proof of different incidents.

## 15.3 Query constraints

All checks must be bounded.

Priority:

1. exact TT indexed lookup;
2. indexed linkKey active/recent lookup with small limit;
3. optional bounded recent-ticket fallback.

No collection-wide client scan.

## 15.4 UX semantics

Show:

- candidate TT;
- status;
- occur time;
- latest update;
- similarity reasons.

Actions:

- Review existing Ticket;
- Create anyway;
- Link as related incident where appropriate.

---

# 16. Related Tickets / Incident Groups

Introduce an optional incident grouping model.

Recommended:

```text
incidentGroups/{groupId}
  title
  normalizedLinkKey
  createdAt
  createdBy
  updatedAt

tickets/{ticketId}
  incidentGroupId
```

Alternative denormalized model may be used if it gives simpler bounded reads, but relationship ownership must be explicit.

Capabilities:

- link existing Ticket;
- create group from duplicate suggestion;
- unlink;
- show related TT list;
- group must not merge Ticket lifecycle or revisions.

Each Ticket remains independently resolvable/archiveable.

Security rules must restrict mutation to Admin/Operator capability as appropriate.

---

# 17. Auto Save Draft Recovery

This is browser-local recovery, not hidden Firestore auto-save.

## New Ticket

Persist a versioned local draft containing:

- form values;
- local Progress draft;
- selected template profile;
- import candidate metadata needed for recovery;
- dirty timestamp.

Do not store:

- OCR image bytes;
- `.msg` bytes;
- raw email body/HTML;
- attachment file blobs.

Restore flow:

- detect recoverable draft on `/generator/new`;
- show timestamp;
- Restore or Discard;
- clear draft after successful Ticket creation;
- expire old drafts after a defined TTL.

## Existing Ticket

Do not silently auto-save to Firestore.

Optionally keep an ephemeral local recovery snapshot keyed by `ticketId + baseRevision`.

If base revision changed before restore:

- never apply automatically;
- show stale recovery warning;
- require manual review.

---

# 18. Revision Diff / Audit History

Reuse the existing immutable `auditEvents` subcollection rather than creating an unrelated history system.

Current audit events already record mutation type and actor but `TICKET_UPDATED` does not contain useful field diffs.

Enhance new audit events with compact structured change metadata.

Example:

```js
{
  type: 'TICKET_UPDATED',
  actorUid,
  revisionFrom: 8,
  revisionTo: 9,
  details: {
    changes: {
      pic: { from: 'FO Regional', to: 'FO Bandung' },
      cutPoint: { from: 'KM 12', to: 'KM 12.4' }
    }
  }
}
```

Rules:

- store diffs only for operational fields;
- do not store raw imported email;
- bound history read, e.g. latest 50;
- older audit events remain valid but display without a detailed diff;
- Progress add/update/remove keep their own audit event semantics;
- coordinate/status mutations retain dedicated audit types.

Revision History UI can then show:

- actor;
- timestamp;
- revision;
- event type;
- changed fields.

---

# 19. Shift Handover Summary

Generate a deterministic summary from current Ticket state.

Inputs:

- TT;
- status;
- occur time;
- duration;
- PIC;
- rootcause if available;
- cut point;
- latest Progress;
- recent Progress context;
- pending warnings from Validation Center;
- related Ticket count.

Output is preview/copy only by default.

Do not persist generated prose unless a later requirement explicitly asks for a saved handover note.

Provide:

- Copy Handover;
- Copy compact variant;
- deterministic template per profile.

---

# 20. Copy Sections

Expand Copy Report into a structured action menu.

Required copy targets:

- Full Report;
- Title;
- Impact;
- Latest Progress;
- Full Progress Timeline;
- Coordinate;
- TT number;
- Handover Summary;
- operational source/alarm summary where present.

All copied text must come from canonical formatters, not ad-hoc JSX string construction.

Clipboard failure must surface through existing toast/feedback infrastructure.

---

# 21. Generator Quick Actions and Keyboard

Required shortcuts:

- `Ctrl/Cmd + S` → Save;
- `Ctrl/Cmd + Enter` → Add Progress when Progress editor owns focus;
- command-palette action → Copy Report;
- command-palette action → focus Smart Import;
- command-palette action → focus Progress;
- command-palette action → Validation Center.

Safety:

- never trigger lifecycle transitions with an easy accidental shortcut;
- no shortcut should fire while a modal/dialog owns keyboard scope unless intended;
- use canonical app command architecture;
- show shortcut hints in accessible text.

Quick actions menu:

- Copy submenu;
- View Revision History;
- Open read-only Ticket Detail;
- Restore/reset unsaved changes where safe;
- Duplicate as New Ticket only after its data-copy semantics are explicitly defined.

---

# 22. Evidence / Attachment Workspace

This feature must respect the existing no-cloud-image direction.

Initial scope:

- local file queue;
- image thumbnail/filename/size/type;
- OCR coordinate action for eligible image;
- extracted coordinate metadata;
- operator note;
- ability to remove the local evidence item.

Persistence:

- no binary file upload;
- persisted Ticket may store only approved metadata such as coordinate/source note;
- no fake attachment state implying a file is available after reload when it was never uploaded.

After reload, metadata may remain but the UI must clearly state that the local file must be reattached if needed.

---

# 23. Proposed Ticket schema extension

Avoid a disruptive whole-database migration.

Readers must remain compatible with existing schema-v1 Tickets.

Suggested optional fields for new/updated Tickets:

```js
{
  schemaVersion: 2,

  templateProfileId: 'MANDAU_DEFAULT',

  linkKey: null,

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
    endpointA: '',
    endpointB: ''
  },

  importProvenance: {
    kind: 'outlook_msg',
    parserVersion: 1,
    sourceSubject: '',
    importedAt: Timestamp,
    importedBy: uid
  },

  incidentGroupId: null
}
```

Important:

- `importProvenance` must remain compact.
- no raw body;
- no recipient list;
- no Exchange headers;
- no email attachment bytes.
- existing v1 mapper defaults all new fields to `null`/empty safely.
- migration occurs lazily when a Ticket is later saved; no mandatory bulk backfill.

Before adopting `schemaVersion: 2`, update:

- entity normalizer;
- form mapper;
- Firestore mapper;
- creation mutation;
- save mutation;
- Security Rules allowed keys/types;
- emulator tests;
- report formatter compatibility.

---

# 24. Firestore query/index plan

Potential indexes must be added only when the feature that requires them lands.

Expected query patterns:

### Duplicate by TT

```text
tickets
where externalTtNumber == X
limit small
```

### Duplicate by active link

```text
tickets
where linkKey == X
where status in [DRAFT, RUNNING]
orderBy occurAt desc
limit 10
```

### Related group

```text
tickets
where incidentGroupId == X
orderBy updatedAt desc
limit 50
```

### Revision history

```text
tickets/{ticketId}/auditEvents
orderBy createdAt desc
limit 50
```

Do not add speculative indexes that have no production query.

---

# 25. Feature phase execution plan

Implementation is intentionally split so every phase can be independently Quality-green.

## GEN-F0 — Baseline, contracts and feature skeleton

- [ ] Close MEGA-10 tracker/PR metadata using Quality #742 and human sign-off.
- [ ] Create dedicated Generator feature branch from the validated UI foundation.
- [ ] Add this workplan as the source of truth.
- [ ] Define normalized Import Candidate.
- [ ] Define alarm/link normalization helpers.
- [ ] Define Template Profile contract + `MANDAU_DEFAULT`.
- [ ] Define schema-v2 compatibility approach.
- [ ] Add pure-unit fixtures for link key, alarm normalization and candidate conflict logic.
- [ ] No production behavior change yet.
- [ ] Full Quality green.

Exit criterion: architecture contracts exist and old Generator behavior is unchanged.

---

## GEN-F1 — Unified Import + Outlook `.msg`

- [ ] Refactor current Smart Report parser behind a source adapter.
- [ ] Add `report_text` adapter parity tests.
- [ ] Dependency spike and lock browser `.msg` parser.
- [ ] Add local `.msg` file decoder.
- [ ] Add email subject parser.
- [ ] Add FLP/MANDAU structured-body parser.
- [ ] Add sanitized HTML-to-text fallback.
- [ ] Add `undefined`/blank normalization.
- [ ] Add field source/confidence metadata.
- [ ] Add subject/body conflict detection.
- [ ] Add filename fallback with lowest confidence.
- [ ] Add selective Apply model.
- [ ] Preserve existing `Fill generator` semantics until selective UI is enabled.
- [ ] Add sanitized synthetic email fixtures covering the supplied corpus variations.
- [ ] Verify no file/network upload.
- [ ] Bundle-size/dependency hygiene review.
- [ ] Full Quality green.

Exit criterion: `.msg` can deterministically populate an import preview without changing Firestore.

---

## GEN-F2 — Structured alarm metadata + Template Profile + Smart Title

- [ ] Extend entity model with optional template/alarm/link/provenance fields.
- [ ] Make mapper backward compatible with v1.
- [ ] Update Firestore writes.
- [ ] Update Security Rules and emulator matrix.
- [ ] Persist canonical `linkKey`.
- [ ] Persist compact import provenance.
- [ ] Add `MANDAU_DEFAULT` title generator.
- [ ] Add generated/manual title mode.
- [ ] Add explicit regenerate behavior.
- [ ] Verify canonical report output remains unchanged unless operator adopts generated values.
- [ ] Full Quality green.

Exit criterion: imported operational metadata survives Save safely and title generation is deterministic.

---

## GEN-F3 — Impact Builder + Progress acceleration

- [ ] Add Impact candidate parser.
- [ ] Add multiline Impact import.
- [ ] Add exact duplicate detection.
- [ ] Add selected Impact apply.
- [ ] Add Quick Progress action.
- [ ] Add snippet library.
- [ ] Add placeholder resolver.
- [ ] Add user-local favorite snippets.
- [ ] Add `Ctrl/Cmd+Enter` scoped Progress submit.
- [ ] Verify persisted Progress remains revision safe.
- [ ] Verify unsaved Ticket Progress stays local until create.
- [ ] Full Quality green.

Exit criterion: common incident updates require materially fewer keystrokes without bypassing domain semantics.

---

## GEN-F4 — Validation Center + Time Intelligence

- [ ] Create derived Validation Center model.
- [ ] Bridge Zod errors.
- [ ] Bridge domain lifecycle validation.
- [ ] Add source conflict findings.
- [ ] Add coordinate verification finding.
- [ ] Add missing optional context warnings.
- [ ] Add incident elapsed time.
- [ ] Add dispatch delay.
- [ ] Add last-progress age.
- [ ] Add resolved duration.
- [ ] Add focus-to-field actions.
- [ ] No SLA judgement.
- [ ] Full Quality green.

Exit criterion: operator can understand report readiness from one deterministic validation source.

---

## GEN-F5 — Duplicate Detection + Related Tickets

- [ ] Implement link-key query repository method.
- [ ] Implement exact-TT query.
- [ ] Keep queries bounded.
- [ ] Add duplicate scoring.
- [ ] Add duplicate suggestion preview.
- [ ] Add Review Existing action.
- [ ] Add Create Anyway action.
- [ ] Define incident group entity/rules.
- [ ] Create/link/unlink related Ticket.
- [ ] Add bounded related-Ticket query.
- [ ] Treat reverse endpoint order as same link.
- [ ] Regression-test corpus-inspired repeated links.
- [ ] Full Quality green.

Exit criterion: duplicate risk is visible before creation while legitimate multi-TT incidents remain possible.

---

## GEN-F6 — Draft Recovery + Revision Diff

- [ ] Add versioned new-Ticket local draft.
- [ ] Add TTL.
- [ ] Restore/discard flow.
- [ ] Clear draft after successful create.
- [ ] Exclude email/OCR/file bytes.
- [ ] Optional persisted-Ticket recovery keyed by base revision.
- [ ] Reject auto-restore on stale revision.
- [ ] Extend `TICKET_UPDATED` audit with compact changed-field diff.
- [ ] Add bounded audit query.
- [ ] Add Revision History model.
- [ ] Handle legacy audit events without diff details.
- [ ] Full Quality green.

Exit criterion: browser interruption does not destroy new work and operators can inspect meaningful revision changes.

---

## GEN-F7 — Handover + Copy Center + Presets + Commands

- [ ] Deterministic handover formatter.
- [ ] Compact handover variant.
- [ ] Copy Full Report.
- [ ] Copy Title.
- [ ] Copy Impact.
- [ ] Copy latest Progress.
- [ ] Copy full Progress.
- [ ] Copy coordinate.
- [ ] Copy TT.
- [ ] Copy handover.
- [ ] Versioned operator-local presets.
- [ ] Reset preferences.
- [ ] `Ctrl/Cmd+S`.
- [ ] Command palette Generator actions.
- [ ] Keyboard/focus regression.
- [ ] Full Quality green.

Exit criterion: all recurring copy/handover/power-user actions have canonical formatters and accessible controls.

---

## GEN-F8 — Evidence workspace

- [ ] Local file queue.
- [ ] image metadata.
- [ ] local thumbnail.
- [ ] coordinate OCR action.
- [ ] optional operator evidence note.
- [ ] remove/re-attach behavior.
- [ ] no binary cloud persistence.
- [ ] reload state clearly distinguishes persisted metadata from unavailable local file.
- [ ] memory cleanup/object URL cleanup.
- [ ] image size/type validation.
- [ ] Full Quality green.

Exit criterion: evidence assists the operator without changing the current privacy/storage architecture.

---

## GEN-F9 — Integrated hardening / feature-release readiness

- [ ] Full formatter verification.
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
- [ ] email import E2E with sanitized fixture.
- [ ] selective import overwrite-safety E2E.
- [ ] duplicate detection E2E.
- [ ] draft restore E2E.
- [ ] revision diff E2E.
- [ ] keyboard shortcut E2E.
- [ ] Light/Dark serious/critical axe.
- [ ] mobile no-horizontal-overflow.
- [ ] human workflow acceptance.
- [ ] workplan/checklist closed with final evidence.

Exit criterion: feature expansion is production-ready; page-level visual overhaul can begin afterward.

---

# 26. Test strategy

## Pure unit

- subject parsing;
- body field parsing;
- `.msg` decoded text normalization;
- import conflict resolver;
- alarm normalizer;
- endpoint parser;
- canonical link key;
- title formatter;
- impact parser;
- snippet placeholders;
- validation model;
- time calculations;
- duplicate scoring;
- handover formatter;
- copy formatters;
- local draft serialization/version migration.

## Component

- Import Review selective apply;
- dirty-field overwrite protection;
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
- old schema-v1 read/save;
- alarm metadata validation;
- incidentGroup permissions;
- duplicate repository queries;
- audit diff immutability;
- related-ticket query bounds.

## Real browser

- `.msg` File input/drag-drop;
- local-only behavior;
- theme parity;
- keyboard;
- popovers/dialog focus;
- desktop/mobile geometry;
- no horizontal overflow;
- axe.

---

# 27. Data migration strategy

Do not bulk rewrite all existing Tickets.

Plan:

1. mapper reads schema v1 and v2;
2. v1 Ticket behaves exactly as today;
3. new Tickets use v2 after schema phase lands;
4. editing a v1 Ticket may upgrade it to v2 on successful save;
5. new optional metadata defaults safely;
6. legacy audit events remain readable;
7. no backfill job is required for release.

If future duplicate detection needs metadata that old Tickets do not possess, use bounded fallback behavior instead of a mass migration.

---

# 28. Failure-state matrix

The implementation must explicitly handle:

| Failure | Expected behavior |
|---|---|
| corrupt `.msg` | local parse error, form untouched |
| unsupported `.msg` | explain unsupported source, no upload |
| subject/body TT conflict | blocking import conflict, operator decides |
| `undefined` source value | treated missing |
| malformed date | warning + raw value visible |
| email parser gets no useful fields | no Apply |
| dirty form + import | replacement fields require explicit selection |
| duplicate detected | warning; review/create anyway |
| Firestore network error | live form remains intact |
| stale revision | reload/review path; no blind retry |
| draft schema changed | safe migrate or discard prompt |
| local evidence file lost after reload | metadata can remain; file marked unavailable |
| clipboard failure | toast/error |
| invalid snippet placeholder | block snippet application/submission |
| related group deleted/stale | Ticket remains valid; relationship can be cleared |

---

# 29. Performance budget

- parse email locally without blocking the UI for common `.msg` sizes;
- use async file read and show parsing state;
- do not retain raw file buffers after parsing;
- avoid re-parsing the `.msg` on every React render;
- derived Validation/Time models should be memoized where useful;
- duplicate queries fire only after sufficient identity exists and must be debounced;
- duplicate lookup must not run on every character keystroke;
- all queries have explicit limits;
- no second-by-second global timer churn;
- large optional source libraries should be dynamically imported from the import feature where practical.

---

# 30. Security / privacy QA

Required checks:

- `.msg` bytes never sent over network;
- no email recipient address persisted;
- no Exchange transport header persisted;
- no raw HTML injection;
- raw email body not persisted;
- imported provenance is compact and operational only;
- evidence bytes never uploaded;
- user presets cannot alter RBAC;
- Viewer cannot mutate import/save/group/history data;
- audit events remain immutable;
- schema-v2 rules reject unexpected field types/keys;
- imported text is treated as untrusted input.

---

# 31. Observability / audit

Useful audit events after feature expansion:

- `TICKET_CREATED`
- `TICKET_UPDATED` with changed-field summary
- `STATUS_CHANGED`
- `COORDINATE_UPDATED`
- `COORDINATE_CLEARED`
- existing Progress audit events
- `INCIDENT_GROUP_LINKED`
- `INCIDENT_GROUP_UNLINKED`

Do not create an audit event simply for previewing/parsing a local email.

Do not audit local draft saves.

---

# 32. Definition of Done for the feature program

The Template Generator feature program is complete only when:

1. all GEN-F phases are checked;
2. existing report/lifecycle behavior remains backward compatible;
3. supplied email patterns are covered by sanitized synthetic fixtures;
4. `.msg` parsing is browser-local;
5. no raw private email is committed or persisted;
6. duplicate detection is bounded and advisory;
7. related Tickets do not share lifecycle state;
8. draft recovery is safe around stale revisions;
9. revision history is meaningful and immutable;
10. all copy/handover output is deterministic;
11. all new features are keyboard-accessible;
12. Light/Dark and mobile/desktop acceptance pass;
13. Quality clean-head is fully green;
14. manual NOC workflow acceptance is complete.

Only after this feature program is stable should a dedicated **Template Generator visual/UI overhaul PRD** be written.

---

# 33. Implementation order recommendation

Do not implement the visible “nice-to-have” surfaces first.

Recommended dependency order:

```text
Contracts / normalization
    ↓
Unified import pipeline
    ↓
MSG email adapter
    ↓
Schema + alarm/link metadata
    ↓
Template profiles / smart title
    ↓
Progress + Impact acceleration
    ↓
Validation / time intelligence
    ↓
Duplicate detection
    ↓
Related tickets
    ↓
Draft recovery / revision history
    ↓
Handover / copy / commands / presets
    ↓
Evidence workspace
    ↓
Integrated QA
```

This ordering prevents UI code from inventing data models that later have to be rewritten.

---

# 34. First implementation task after plan approval

Start with **GEN-F0 only**.

Do not begin by adding the `.msg` upload control.

First commit set should establish:

1. normalized Import Candidate contract;
2. alarm normalization;
3. endpoint parsing;
4. canonical link key;
5. Template Profile interface;
6. sanitized corpus-inspired unit fixtures;
7. schema-v2 proposal tests without production persistence changes.

Once those contracts are Quality-green, proceed to GEN-F1 `.msg` decoding and email extraction.
