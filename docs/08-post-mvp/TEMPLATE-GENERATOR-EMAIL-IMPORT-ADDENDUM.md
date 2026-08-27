# Template Generator — Email Import Evidence & Dispatch-Time Addendum

**Status:** NORMATIVE PLANNING ADDENDUM  
**Applies to:** `docs/08-post-mvp/TEMPLATE-GENERATOR-FEATURE-WORKPLAN.md`  
**Planning date:** 2026-08-26  
**Corpus:** 39 user-provided Outlook `.msg` incident emails analyzed locally — 20 FLP/MANDAU structured alarm emails + 19 additional direct MANDAU link-down emails.  

> This addendum is authoritative for Email Import behavior. Where it conflicts with the earlier workplan, this document wins until the main workplan is consolidated during GEN-F0.

---

# 1. Critical product rule — Dispatch Time

For an Outlook `.msg` import:

**Generator `Dispatch Time` MUST be autofilled from the current email's Sent Time.**

It must **not** be derived from:

- `Dispatch to` / `Dispatch To` in the body;
- the message Delivery/Received time;
- a quoted `Sent:` line inside the body;
- forwarded/replied message headers embedded in the body;
- file creation/modification time;
- Occur Time;
- filename timestamp.

For Outlook `.msg`, the canonical source is the top-level MAPI property:

```text
PR_CLIENT_SUBMIT_TIME
property tag: 0x00390040
property id: 0x0039
property type: PT_SYSTIME (0x0040)
```

Implementation naming:

```text
messageSentAt -> Generator dispatchAt
```

`PR_MESSAGE_DELIVERY_TIME` (`0x0E060040`) is explicitly **not** Dispatch Time.

---

# 2. Time conversion contract

MAPI `PT_SYSTIME` is an absolute FILETIME/UTC instant.

Required flow:

```text
MSG PR_CLIENT_SUBMIT_TIME
    -> decode FILETIME as UTC instant
    -> retain normalized instant internally
    -> render/import into Generator timezone
    -> MANDAU_DEFAULT timezone = Asia/Jakarta
    -> fill datetime-local dispatchAt
```

Example semantic conversion:

```text
Sent metadata: 2026-08-26T00:59:26Z
Generator Dispatch Time (Asia/Jakarta): 2026-08-26 07:59:26
```

The UI may display minute precision if the existing form remains minute-based, but the import candidate should retain the source instant/seconds where practical.

Do not add seven hours by hand. Use timezone-aware conversion.

---

# 3. Missing Sent Time behavior

If `PR_CLIENT_SUBMIT_TIME` is absent or malformed:

1. do not invent Dispatch Time;
2. leave `dispatchAt` unapplied/blank unless the operator already entered a value;
3. add an import warning: `Email Sent Time was not available; Dispatch Time needs review.`;
4. allow manual Dispatch Time entry.

Do **not** silently fall back to `PR_MESSAGE_DELIVERY_TIME`.

For a future `.eml` adapter, top-level RFC message `Date` may represent the current message sent timestamp, but it must be implemented as a source-specific equivalent and must never parse a quoted `Date:`/`Sent:` line from the body.

For pasted email body text without message metadata, Dispatch Time is not safely derivable from the body and should remain manual unless the user explicitly supplies a current-message header block that the adapter can identify unambiguously.

---

# 4. Evidence from the additional 19 MANDAU emails

The new batch was inspected from the actual Compound File `.msg` data, including top-level MAPI properties, subject and plain-text body.

## 4.1 Sent metadata

Observed:

- `PR_CLIENT_SUBMIT_TIME`: 19/19
- `PR_MESSAGE_DELIVERY_TIME`: 19/19
- Delivery occurred about 7.7–26.4 seconds after Submit/Sent in the samples, median about 13.1 seconds.

This proves they are separate timestamps and supports the rule that only Sent/Submit is Dispatch Time.

## 4.2 Quoted body header risk

`Sent:` text from quoted/replied email history appears in **10/19** bodies.

Some bodies contain more than one quoted `Sent:` line.

Therefore:

- generic regex over the body for `Sent:` is forbidden for Dispatch Time;
- message metadata must be decoded before operational body parsing;
- HTML-to-text conversion must not promote quoted `Sent:` text into message metadata.

## 4.3 Subject transport/family variants

Observed across 19 subjects:

- generic `DWDM`: 12
- `DWDM ZTE`: 3
- `DWDM 1800`: 2
- `DWDM UJB`: 1
- `OSN 3500`: 1

Parser must model this as transport/equipment context rather than assuming every MANDAU link is a generic DWDM pair.

Suggested field:

```js
transportContext: {
  family: 'DWDM' | 'OSN' | null,
  variant: 'ZTE' | '1800' | 'UJB' | '3500' | null,
  rawLabel: 'DWDM ZTE'
}
```

Do not infer vendor semantics beyond what the source explicitly states.

## 4.4 TT variants

Subject TT values in the 19-email batch:

- `DWDM-INC-...`: 10
- `INC-...`: 9

Body values often use canonical `INC-...` even when subject uses `DWDM-INC-...`.

Required model:

```js
rawExternalTtNumber
incidentKey
```

Rules:

- preserve the source/raw TT exactly after whitespace cleanup;
- `incidentKey` may normalize a known transport prefix only for equality/duplicate detection when the terminal value is a valid `INC-YYYYMMDD-NNN...`;
- do not silently rewrite the user-visible TT/report value simply to satisfy duplicate matching;
- subject/body raw-format difference with the same terminal INC key is a normalization note, not necessarily a conflict;
- different terminal INC keys are a real conflict.

Example:

```text
Subject: DWDM-INC-20260826-00005247
Body:    INC-20260826-00005247
incidentKey: INC-20260826-00005247
```

## 4.5 Body TT label variants

Observed:

- `IOH TT`: 14
- `TT`: 3
- `H3I TT`: 2

Email body parser must support all three labels case-insensitively and with blank lines/leading spaces between label and value.

## 4.6 Link/path cardinality

Observed:

- 18/19 emails: two-point path (`A <> B`)
- 1/19 email: three-point path (`A <> B <> C`)

Therefore the previous endpoint-A/endpoint-B-only model is insufficient.

The canonical model must become an ordered path:

```js
pathEndpoints: [
  { raw: '...', normalized: '...' },
  { raw: '...', normalized: '...' }
]
```

Two-endpoint fields may be derived for compatibility/display, but must not be the source of truth.

---

# 5. Revised path identity contract

Use `pathKey`, not a pair-only `linkKey`, as the durable duplicate-detection key for imported MANDAU paths.

## 5.1 Normalization

For each endpoint:

- Unicode/NBSP -> ordinary space;
- trim outer whitespace;
- collapse repeated internal whitespace where safe;
- normalize delimiter spacing;
- preserve meaningful equipment/site identifiers;
- preserve raw value separately;
- do not remove arbitrary words merely to make strings match.

## 5.2 Orientation equivalence

For a two-point path:

```text
A <> B
B <> A
```

must produce the same `pathKey`.

For a multi-hop path:

```text
A <> B <> C
C <> B <> A
```

must also produce the same `pathKey`.

But this must **not** be achieved by sorting every node independently because that destroys path topology.

Recommended algorithm:

1. normalize the ordered endpoint list;
2. create `forward = A<>B<>C`;
3. create `reverse = C<>B<>A`;
4. choose lexically smaller of `forward` and `reverse` as `pathKey`.

This preserves internal sequence while treating reverse orientation as equivalent.

---

# 6. Revised MANDAU subject parser

Direct MANDAU subjects resemble:

```text
[MANDAU] LINK DOWN AT <TRANSPORT_LABEL> <PATH>, [TT ...]
```

Examples represented in the corpus include:

```text
DWDM A <> B
DWDM A <> B <> C
DWDM 1800 A <> B
DWDM UJB A <> B
DWDM ZTE A <> B
OSN 3500 A <> B
```

Subject parser must extract independently:

```js
{
  profileTag: 'MANDAU',
  eventKind: 'LINK_DOWN',
  transportRawLabel,
  pathEndpoints,
  rawExternalTtNumber,
  incidentKey
}
```

Do not parse by one giant regex that assumes exactly two endpoints.

Recommended approach:

1. identify `[MANDAU]` prefix;
2. isolate TT bracket from the right side;
3. isolate `LINK DOWN AT` prefix;
4. detect known transport prefix through a table/profile rule;
5. split remaining path by `<>`;
6. normalize each path element independently.

Unknown transport label must not make the whole email unparseable. Preserve the raw segment and lower confidence.

---

# 7. Revised body parser for direct MANDAU email

The direct MANDAU batch commonly contains a table-like body rendered into plain text with blank lines between labels and values.

Observed operational labels include:

```text
Remark
Description
TT / IOH TT / H3I TT
Vendor
Segment / Link
Link Status
Occur Time
Power status
Impact
```

Parser requirements:

- tolerate CRLF + repeated blank lines;
- support label/value separation by one or more blank lines;
- treat `Segment / Link` as a full path expression;
- parse `Occur Time` independently from Sent Time;
- parse Impact as potentially multiline content;
- stop Impact at signature/reply boundaries using deterministic structural markers;
- do not parse quoted reply metadata into current-message fields;
- retain raw field text for review.

`Dispatch to` from the earlier FLP corpus remains operational routing metadata only. It is **not** Generator Dispatch Time.

---

# 8. Revised import-source priority

General operational field priority remains source-specific, but time fields have an explicit exception.

## Occur Time

Priority:

1. current-message structured body `Occur Time`;
2. source-specific structured alarm property if later implemented;
3. otherwise unresolved/manual.

## Dispatch Time

Priority:

1. **current-message Sent metadata (`PR_CLIENT_SUBMIT_TIME`) only for `.msg`**;
2. source-equivalent top-level sent timestamp for future adapters;
3. otherwise unresolved/manual.

Forbidden Dispatch sources:

- body `Dispatch to`;
- quoted body `Sent:`;
- delivery time;
- inferred Occur + offset.

## Title

For a direct MANDAU email:

1. current top-level Subject is a strong title candidate;
2. body `Segment / Link` may validate/construct the link portion;
3. filename is fallback only.

Subject still requires preview/selective apply and must not silently overwrite a dirty Title.

---

# 9. Revised normalized Import Candidate

The normalized candidate should be amended to support message metadata and multi-hop paths.

```js
{
  source: {
    kind: 'outlook_msg',
    profileId: 'MANDAU_DEFAULT',
    parserVersion: 1,
    sourceName: null,
    subject: null,
    sentAt: {
      instant: '2026-08-26T00:59:26Z',
      source: 'mapi:PR_CLIENT_SUBMIT_TIME',
      confidence: 'exact'
    }
  },

  fields: {
    title: candidateField,
    externalTtNumber: candidateField,
    occurAt: candidateField,
    dispatchAt: {
      value: '2026-08-26T07:59',
      rawValue: '2026-08-26T00:59:26Z',
      source: 'message_metadata',
      confidence: 'exact',
      selected: true
    },
    impactList: candidateField
  },

  transportContext: {
    family: candidateField,
    variant: candidateField,
    rawLabel: candidateField
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
    lastLinkFlapped: candidateField
  },

  pathContext: {
    pathEndpoints: [],
    pathKey: candidateField,
    rawSegment: candidateField
  },

  identity: {
    rawExternalTtNumber: candidateField,
    incidentKey: candidateField
  },

  warnings: [],
  conflicts: []
}
```

Extend `candidateField.source` with:

```text
message_metadata
body
subject
filename
inference
```

`message_metadata` is highest-confidence for Sent/Dispatch Time.

---

# 10. Smart Title Builder amendment

Generated MANDAU title must not assume `endpointA` + `endpointB`.

Inputs become:

- profile tag;
- event kind;
- transport raw/normalized label;
- ordered `pathEndpoints`;
- user-visible external TT/raw TT;
- optional region/profile policy.

The path renders as:

```text
A <> B
```

or:

```text
A <> B <> C
```

without losing endpoint order.

Direct MANDAU Subject may be offered as an exact source title candidate when it is structurally valid.

---

# 11. Duplicate detection amendment

Indexed identity becomes:

```text
externalTtNumber
incidentKey
pathKey
```

Scoring update:

- exact `incidentKey`: critical duplicate signal;
- exact raw external TT: critical duplicate signal;
- same `pathKey` + occur time proximity: high;
- same `pathKey` + active status: high;
- same Site ID/alarm family/time proximity: medium for FLP structured alarm sources;
- title similarity remains weak fallback.

The sample corpus demonstrates repeated paths with different TTs. Same path alone must never hard-block creation.

Multi-hop path comparison must use orientation-equivalent `pathKey`, not unordered endpoint sorting.

---

# 12. Proposed schema-v2 amendment

Replace pair-only imported path fields with structured path metadata.

Suggested delta:

```js
{
  templateProfileId: 'MANDAU_DEFAULT',

  incidentKey: null,
  pathKey: null,

  transportContext: {
    family: '',
    variant: '',
    rawLabel: ''
  },

  pathContext: {
    endpoints: [
      { raw: '', normalized: '' }
    ],
    rawSegment: ''
  },

  alarmContext: {
    // existing FLP structured-alarm fields
  },

  importProvenance: {
    kind: 'outlook_msg',
    parserVersion: 1,
    sourceSubject: '',
    messageSentAt: Timestamp,
    sentTimeSource: 'PR_CLIENT_SUBMIT_TIME',
    importedAt: Timestamp,
    importedBy: uid
  }
}
```

Do not persist:

- delivery time unless a future feature explicitly needs it;
- quoted body Sent timestamps;
- raw body;
- mail recipients;
- Exchange transport headers.

`dispatchAt` remains the normal Ticket operational field and receives the selected/imported Sent Time value through the ordinary save contract.

---

# 13. Fixture additions

Synthetic fixtures from the additional batch must cover:

1. `.msg` with valid `PR_CLIENT_SUBMIT_TIME`;
2. Sent time and Delivery time intentionally different;
3. quoted body containing a different `Sent:` timestamp;
4. multiple quoted `Sent:` timestamps;
5. missing `PR_CLIENT_SUBMIT_TIME` → Dispatch remains unresolved;
6. generic `DWDM A <> B`;
7. `DWDM A <> B <> C` multi-hop path;
8. `DWDM 1800`;
9. `DWDM UJB`;
10. `DWDM ZTE`;
11. `OSN 3500`;
12. subject raw TT `INC-...`;
13. subject raw TT `DWDM-INC-...` with body `INC-...` same incidentKey;
14. subject/body terminal INC conflict;
15. body `TT` label;
16. body `IOH TT` label;
17. body `H3I TT` label;
18. NBSP around endpoint delimiter;
19. inconsistent spaces/underscores in endpoint display names;
20. Segment/Link path equivalent to reverse orientation;
21. same path + different TT;
22. malformed current-message Sent metadata;
23. pasted body-only source that contains quoted Sent text and must not autofill Dispatch.

---

# 14. GEN-F0 checklist amendment

Add these contract tasks before any `.msg` upload UI:

- [ ] Define `incidentKey` separately from raw external TT.
- [ ] Replace endpoint-pair source-of-truth with ordered `pathEndpoints`.
- [ ] Define orientation-equivalent multi-hop `pathKey` algorithm.
- [ ] Define `transportContext` contract.
- [ ] Define message metadata timestamp contract.
- [ ] Lock `dispatchAt = current-message Sent Time` rule.
- [ ] Unit-test `PR_CLIENT_SUBMIT_TIME` UTC → `Asia/Jakarta` conversion.
- [ ] Unit-test Delivery Time is ignored for Dispatch.
- [ ] Unit-test quoted body `Sent:` is ignored for Dispatch.
- [ ] Add synthetic fixtures for MANDAU direct-link subjects and TT variants.

GEN-F0 exit criterion is expanded: the data contracts must support both the earlier FLP structured alarm corpus and the direct MANDAU link-email corpus before GEN-F1 starts.

---

# 15. GEN-F1 checklist amendment

During `.msg` implementation:

- [ ] decoder must expose top-level Subject;
- [ ] decoder must expose top-level plain/HTML body;
- [ ] decoder must expose `PR_CLIENT_SUBMIT_TIME`;
- [ ] decoder may expose Delivery Time for diagnostic tests but must not map it to Dispatch Time;
- [ ] Sent metadata must become `source.sentAt`;
- [ ] Sent metadata must produce the `dispatchAt` candidate;
- [ ] parser must identify current-message fields before parsing quoted history;
- [ ] direct MANDAU subject adapter must support 2+ path endpoints;
- [ ] body adapter must support `TT`, `IOH TT`, and `H3I TT`;
- [ ] raw `DWDM-INC` vs canonical `INC` identity must be tested;
- [ ] no body `Sent:` fallback;
- [ ] no Delivery Time fallback;
- [ ] no network upload.

---

# 16. QA acceptance for Dispatch Time

The feature cannot be considered correct until all of the following pass:

### Unit

- exact MAPI FILETIME conversion;
- timezone conversion across date boundary;
- seconds handling;
- missing Sent property;
- malformed Sent property;
- Delivery Time ignored;
- quoted `Sent:` ignored.

### Component

- import preview shows Dispatch Time sourced from Email Sent Time;
- source/confidence is visible in review metadata;
- operator can deselect Dispatch before Apply;
- dirty manual Dispatch is not silently overwritten;
- missing Sent property shows warning.

### Browser E2E

Using sanitized `.msg` fixture:

1. select file;
2. decode locally;
3. verify current-message Sent timestamp;
4. preview correct Asia/Jakarta Dispatch Time;
5. confirm a different quoted body `Sent:` does not affect value;
6. confirm different Delivery Time does not affect value;
7. apply selected fields;
8. verify form `dispatchAt`;
9. Save;
10. reload and verify persisted Dispatch Time.

---

# 17. Final source-of-truth rule

For Template Generator Email Import:

```text
Occur Time   = operational Occur Time from current email content
Dispatch Time = current email Sent Time from message metadata
```

These timestamps describe different events and must remain separate.

`Dispatch to` is a routing/team field and must never be confused with `Dispatch Time`.
