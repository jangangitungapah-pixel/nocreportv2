# Smart Parsing — Template Generator

**Status:** IMPLEMENTED — AUTOMATED QA COMPLETE  
**Branch:** `feature/smart-template-parser`  
**Parent:** `feature/ui-overhaul-v2`

## Goal

Allow an operator to paste an already-written NOC report into **New Ticket** and use deterministic local parsing to prefill the Template Generator without calling an AI/API service.

## Parsed sections

- Title
- Impact / Impact List
- Occur Time
- Dispatch Time, including the observed `Dispacth Time` typo
- PIC, including an explicitly empty value
- Rootcause / Root Cause
- Cut Point
- Update Progress / Progress Update

## Supported date formats

- `YYYY-MM-DD HH:mm`
- `DD/MM/YYYY HH:mm`

The parser converts dates to `datetime-local` form values (`YYYY-MM-DDTHH:mm`). Progress rows use `HH:mm text`. Their calendar date is inferred from Occur Time and rolls forward when the time crosses midnight.

## Impact behavior

Impact is optional. When present, every non-empty line between the Impact header and the next known field is retained as a separate Impact List item. Structural numeric or dash bullets are removed while meaningful content such as status emoji remains.

## Progress behavior

Progress rows are imported into the new Ticket draft with generated local IDs and normal Progress entity fields. They are not persisted when the user clicks **Fill generator**. The existing Save/create path remains authoritative and persists the imported Progress Timeline together with the new Ticket.

## Safety / scope

- Smart Paste is exposed only on `/generator/new`.
- It does not appear on an existing persisted Ticket route.
- It never automatically writes to Firestore.
- It does not change Ticket, Progress, coordinate, RBAC, OCR, or report-format data contracts.
- Existing Ticket bulk overwrite is intentionally excluded because Progress uses revision-aware mutation semantics.

## UX

The Smart Import panel provides:

1. paste textarea;
2. live detection summary;
3. detected-field chips;
4. Title preview;
5. parser warnings;
6. explicit **Fill generator** action;
7. Clear action.

## QA contract

- parser fixtures cover ISO-like and Indonesian date formats;
- `Dispacth Time` typo tolerance is tested;
- midnight rollover is tested;
- optional/no Impact is tested;
- one numbered Impact is tested;
- multiline Impact is tested;
- blank PIC is tested;
- long Progress Timeline is tested;
- canonical `Title :`, `Impact List :`, `Dispatch Time`, and `Root Cause` labels are tested;
- Template Generator integration verifies parsed values populate the live form, Impact editor, Progress Timeline, and report preview.

## QA evidence

Quality **#622** passed on code head `ca4c0a9fef3455e6adeee947ed1964d8b953f6b5` after the temporary formatter/QA helper workflow was removed.

Passed gates:

- source formatting + committed-format verification;
- lint;
- unit and component tests including smart parser fixtures and Generator integration;
- Firebase Emulator integration and Security Rules;
- repository/security hygiene;
- Firebase release preflight;
- generic and Firebase-configured production builds;
- dev smoke;
- real-browser responsive/touch QA;
- Playwright Ticket lifecycle/RBAC/keyboard/accessibility QA.
