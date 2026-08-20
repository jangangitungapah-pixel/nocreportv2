# NOC Report Template Generator — Master Product PRD

**Document ID:** NOCREPORT-MPRD-001  
**Version:** 0.1  
**Status:** Baseline / Source of Truth  
**Product:** NOC Report Template Generator (working name: `nocreportv2`)  
**Repository:** `jangangitungapah-pixel/nocreportv2`  
**Primary platform:** Web application  
**Primary stack constraint:** JavaScript + React + Vite + Tailwind CSS ecosystem  
**Cloud constraint:** Firebase Spark Plan only for MVP; Firebase Hosting and Firestore are the intended production services, with deployment configured in a later phase.

---

## 1. Purpose of This Document

This Master Product PRD is the product-level source of truth for NOC Report Template Generator. It defines what the application must solve, who it serves, the product scope, core workflows, required modules, business rules, roles, MVP boundaries, and acceptance criteria.

This document intentionally does not define detailed UI styling, component structure, database schema, API contracts, Firebase Security Rules, or CI/CD implementation. Those topics belong to the supporting PRDs/TDDs that will follow this document.

If a later supporting document conflicts with this Master Product PRD, this document takes precedence unless it is explicitly revised.

---

# 2. Product Vision

NOC Report Template Generator is an internal operational web application designed to help Network Operations Center personnel create, maintain, and track standardized incident/trouble-ticket reports quickly and consistently.

The product replaces repetitive manual report formatting with a structured workflow. Operators fill in incident information once, continuously append progress updates as troubleshooting proceeds, optionally extract cut-point coordinates from geotagged field photos, and generate a clean text report that can be copied directly into operational communication channels.

The application also acts as a lightweight operational database: running tickets are visible in one place, historical ticket data is retained, and known cable cut points can be visualized on a map.

The product should feel like an operational tool rather than a generic form builder: fast to open, fast to update, easy to scan, forgiving of incomplete running incidents, and optimized for repeated daily use.

---

# 3. Problem Statement

Current NOC incident reporting commonly involves manually composing text from information distributed across alarms, chat updates, field-team messages, tickets, and geotagged photos.

This produces several recurring problems:

1. Report structure and wording can become inconsistent between operators.
2. The same data is often retyped multiple times.
3. Running progress updates are difficult to maintain in chronological order.
4. Important fields such as Occur Time, Dispatch Time, PIC, Rootcause, and Cut Point can be missed.
5. Impact List information is sometimes needed and sometimes irrelevant, creating unnecessary blank sections in reports.
6. Coordinates contained in geotag photo watermarks must often be read and converted manually.
7. Cut-point locations become buried inside old reports instead of becoming reusable operational location data.
8. Operators have no single view of currently running tickets and their latest progress.
9. Historical incident data is difficult to search and reuse when reports are maintained only as plain chat text.

NOC Report Template Generator solves these problems by treating each incident report as structured operational data first and formatted text second.

---

# 4. Product Goals

## 4.1 Primary Goals

The MVP must:

- Reduce the time required to create and update an NOC incident report.
- Standardize report output without forcing operators to manually format text.
- Support tickets that evolve over time and initially have incomplete information.
- Maintain a chronological Progress Timeline for each ticket.
- Store all recorded tickets in Firestore when Firebase integration is enabled.
- Provide a Running Ticket workspace for active incidents.
- Extract coordinate text from cut-point photo watermarks and normalize supported coordinate formats.
- Allow coordinates to be entered or corrected manually.
- Plot tickets with valid cut-point coordinates on a Cut Point Tracker map.
- Produce a clean copy-ready plain-text report compatible with operational chat workflows.
- Remain compatible with a Firebase Spark Plan architecture for the MVP.

## 4.2 Secondary Goals

The product should also:

- Reduce typographical and formatting mistakes.
- Make the latest status of a running ticket visible at a glance.
- Preserve historical incident and cut-point knowledge.
- Minimize the number of clicks required for frequent updates.
- Work well on desktop while remaining fully usable on mobile/tablet.
- Allow later expansion into analytics, SLA tracking, integrations, and automation without requiring the MVP to implement them now.

## 4.3 Non-Goals for MVP

The MVP will not attempt to become:

- A complete enterprise ticketing platform.
- A replacement for the official upstream incident-management or trouble-ticket system.
- A multi-tenant SaaS product.
- A billing/subscription platform.
- A WhatsApp bot or automatic WhatsApp sender.
- An automated ticket-ingestion system from external NMS/OSS platforms.
- A full GIS/network-topology platform.
- A cloud photo archive.
- A server-side OCR service requiring paid compute.
- An AI root-cause analysis engine.
- A real-time team chat system.
- A comprehensive SLA/MTTR analytics platform.

These may be considered in later product phases.

---

# 5. Target Users

## 5.1 Primary User — NOC Operator

A NOC Operator is the main daily user of the application.

Typical responsibilities:

- Receive network alarms or ticket information.
- Create a new incident report.
- Record Occur Time and Dispatch Time.
- Record the assigned field-team PIC.
- Add Impact List entries when applicable.
- Update Rootcause and Cut Point information as troubleshooting progresses.
- Append new progress updates throughout the incident.
- Upload/drop a cut-point photo to extract coordinate text.
- Verify or correct coordinates.
- Copy the formatted report for operational communication.
- Monitor running tickets.

The NOC Operator workflow must be optimized for speed and frequent repeated edits.

## 5.2 Secondary User — NOC Admin / Supervisor

An Admin or Supervisor needs all normal operator capabilities plus administrative visibility.

Typical responsibilities:

- View all tickets.
- Correct ticket information.
- Archive or restore records where permitted.
- Review ticket history.
- Review map data and cut-point locations.
- Manage users/roles when authentication administration is implemented.
- Access product settings that are restricted from normal operators.

## 5.3 Optional Read-Only User — Viewer

A Viewer role may be enabled when role-based access is implemented.

Typical responsibilities:

- View Dashboard.
- View Running Tickets.
- View ticket details.
- View Cut Point Tracker.
- Copy generated reports.

A Viewer cannot change ticket data.

---

# 6. Product Model

The central product entity is a **Ticket Report**.

A Ticket Report is not merely generated text. It is a structured record representing one operational incident.

A Ticket Report may contain:

- Title
- Derived/extracted external TT number when detectable
- Impact List
- Occur Time
- Dispatch Time
- PIC
- Rootcause
- Cut Point
- Latitude
- Longitude
- Progress Timeline
- Ticket status
- Created/updated metadata
- Coordinate extraction metadata

The rendered NOC report is generated from this structured data.

This design enables the same ticket record to power:

- Template Generator
- Running Ticket
- Dashboard
- Cut Point Tracker
- Future historical search and analytics

---

# 7. Core Information Fields

## 7.1 Title

Purpose: store the complete incident title used in the final report.

Example:

`[MANDAU] LINK DOWN AT DWDM UJB 109202_BANDUNG_PETA <> 100109_MAJALENGKA, [TT : INC-20260818-00015849]`

Rules:

- Title is required before a ticket can be considered an active/running ticket.
- The application must preserve user-entered capitalization, punctuation, site names, and TT notation in output.
- The application should attempt to detect an external TT identifier from recognizable title patterns such as `[TT : INC-...]` for indexing/search purposes.
- Failure to detect a TT identifier must not prevent saving or running the ticket.
- The user-entered Title remains the source of truth for rendered output.

## 7.2 Impact List

Purpose: record impacted services/sites/items when applicable.

Rules:

- Impact List is optional.
- The user may add one or multiple impact entries.
- Empty impact entries must not be rendered.
- If no valid Impact List entry exists, the entire `Impact List` section must be hidden from generated output.
- The user can add, edit, reorder, or remove entries.

## 7.3 Occur Time

Purpose: represent the alarm/incident start time.

Canonical output label:

`Occur Time = DD/MM/YYYY HH:mm`

Example:

`Occur Time = 18/08/2026 14:20`

Rules:

- Required before a ticket is marked Running.
- Stored internally as a full date-time value.
- Display/output uses 24-hour time.

## 7.4 Dispatch Time

Purpose: represent when the incident was dispatched to the responsible party/team.

Canonical output label:

`Dispatch Time = DD/MM/YYYY HH:mm`

Rules:

- May be temporarily unknown while a ticket is still Draft.
- Required before the report is considered operationally complete for standard generation.
- Must support the same date/time format as Occur Time.

## 7.5 PIC

Purpose: store the field team/person responsible for troubleshooting.

Example:

`Agus (majalengka)`

Rules:

- Free-text in MVP.
- May be unknown at initial incident creation.
- Editable while the ticket is running.

## 7.6 Rootcause

Purpose: store the latest known root cause.

Example:

`impact forest burning`

Rules:

- May be blank/unknown when a ticket is first created.
- Can be updated as investigation progresses.
- The latest saved value is used in the generated report.
- The application must not invent or auto-complete an operational root cause.

## 7.7 Cut Point

Purpose: describe the cable cut/fault location in operational language.

Example:

`OTDR FO CUT at KM 24 from majalengka (FD fibeerstar)`

Rules:

- May be blank until a cut/fault location is confirmed.
- Free-text in MVP.
- Coordinates are stored separately from the Cut Point narrative so the text description can remain operationally expressive.

## 7.8 Progress Timeline / Update Progress

Purpose: maintain chronological troubleshooting updates.

Each entry contains at minimum:

- timestamp
- update text

Example entries:

`14:21 we have open TT MDU-20260818-0000036711`

`14:47 team OTW ke lokasi CP, ETA 75 menit`

`23:55 Team sedang proses splicing core sisi bandung`

Rules:

- A ticket can contain zero or many progress entries.
- New entries can be appended while the ticket is running.
- Existing entries can be corrected when the user has edit permission.
- Internally, each entry must retain a full date-time value even though generated output may show only `HH:mm`.
- The timeline must preserve chronological ordering across midnight/date changes.
- Duplicate timestamps are allowed because multiple events may occur in the same minute.
- If two entries share the same timestamp, creation order must remain deterministic.
- Blank updates must not be saved.
- Generated output must list progress entries in chronological order.

---

# 8. Coordinate and Geotag Extraction

## 8.1 Purpose

Field cut-point photos often contain a visible geotag/location watermark. The application must help the operator extract coordinate text from the image instead of manually reading and converting it.

This capability is focused on **visible watermark text**, not solely on EXIF metadata.

## 8.2 Photo Input

The Template Generator must provide a drag-and-drop/photo-selection area for cut-point images.

MVP requirements:

- Accept common browser-supported image formats such as JPEG/JPG, PNG, and WebP where supported by the selected OCR approach.
- Show processing state and extraction result.
- Do not require the photo itself to be permanently uploaded to cloud storage for coordinate extraction.
- Photo processing should be designed so the MVP can remain compatible with Firebase Spark Plan constraints.
- The extracted coordinate value is saved as ticket data only after validation/user confirmation according to the final UI workflow.

## 8.3 Supported Coordinate Representations

The coordinate parser must be designed to recognize common formats including at least:

1. Decimal Degrees (DD)
   - `-6.12345, 107.12345`
   - `Lat: -6.12345 Long: 107.12345`
   - `Latitude -6.12345 Longitude 107.12345`

2. Degrees Minutes Seconds (DMS)
   - `6° 07' 24.42" S, 107° 07' 24.42" E`
   - Equivalent variants using different spacing and symbols.

3. Degrees Decimal Minutes (DDM)
   - `6° 07.407' S, 107° 07.407' E`

4. Hemisphere-based variants
   - N / S for latitude
   - E / W for longitude

5. Common watermark formatting variations
   - labels before or after values
   - line breaks
   - comma or whitespace separators
   - degree/minute/second symbols with minor OCR imperfections where safe to normalize

The parser may support additional formats later, but the above are minimum requirements.

## 8.4 Canonical Coordinate Format

After successful extraction and parsing, coordinates must be normalized to:

`<latitude>, <longitude>`

with five decimal places for standard display/output.

Example:

`-6.12345, 107.12345`

Rules:

- Latitude range: `-90` to `90`.
- Longitude range: `-180` to `180`.
- South and West coordinates must be converted to negative values.
- North and East coordinates use positive values.
- Internal storage may preserve higher precision if available, but the standard displayed normalized format is five decimal places.
- The application must never silently accept coordinates outside valid geographic ranges.

## 8.5 Ambiguous Coordinate Handling

If OCR extracts two numeric values but the application cannot safely determine which value is latitude and which is longitude:

- The application must not silently guess when the result is materially ambiguous.
- It must present the candidate values for operator review/correction.
- Clear `Lat`, `Latitude`, `Long`, `Lng`, `Longitude`, N/S/E/W labels should be used to resolve order when available.
- Geographic heuristics may assist but must not override explicit text labels.

## 8.6 Manual Coordinate Input

The Template Generator must expose manual latitude and longitude input fields.

Rules:

- The user can enter coordinates without uploading a photo.
- OCR-derived coordinates populate the same underlying coordinate fields.
- The user can correct OCR results manually.
- Manual edits take precedence over the OCR candidate once confirmed/saved.
- Invalid values must produce a validation error and must not create a map marker.

---

# 9. Generated Report Format

The primary output is plain text intended to be copied into existing operational communication channels.

The canonical report ordering for MVP is:

1. Title
2. Impact List — only when at least one impact exists
3. Occur Time
4. Dispatch Time
5. PIC
6. Rootcause
7. Cut Point
8. Update Progress

Representative output:

```text
Title : *[MANDAU] LINK DOWN AT DWDM UJB 109202_BANDUNG_PETA <> 100109_MAJALENGKA, [TT : INC-20260818-00015849]*
Impact List : <render only when impact exists>
Occur Time = 18/08/2026 14:20
Dispatch Time = 18/08/2026 14:20
PIC = Agus (majalengka)
Rootcause = impact forest burning
Cut Point = OTDR FO CUT at KM 24 from majalengka (FD fibeerstar)

Update Progress :
14:21 we have open TT MDU-20260818-0000036711
14:36 team prepare tools & plan OTW ke lokasi CP, ETA 75 minutes?
14:47 team OTW ke lokasi CP, ETA 75 menit
...
23:55 Team sedang proses splicing core sisi bandung
```

## 9.1 Output Rules

- Generated report must be deterministic: the same saved ticket data generates the same report text.
- The application must not rewrite operational wording unless the user explicitly edits it.
- Empty optional sections must not leave awkward blank labels.
- Impact List section is completely omitted when empty.
- Progress entries are rendered chronologically.
- Report preview must reflect the current form state.
- The user must be able to copy the generated report to clipboard.
- Whitespace/newline formatting must remain readable when pasted into common messaging applications.
- Latitude/longitude are structured ticket metadata for MVP and are not automatically inserted into the canonical report text unless a later product revision explicitly defines a coordinate output line.

---

# 10. Ticket Lifecycle

The MVP uses the following product-level ticket states:

## 10.1 Draft

Used while the incident record is incomplete or being prepared.

Characteristics:

- May contain incomplete fields.
- Does not have to appear in the Running Ticket default view.
- Can be edited freely by authorized users.

## 10.2 Running

Represents an active incident/troubleshooting process.

Minimum information required to mark Running:

- Title
- Occur Time

Dispatch Time may be captured immediately or added shortly afterward, but the UI must visibly indicate when expected operational fields remain incomplete.

Running tickets appear in the Running Ticket page.

## 10.3 Resolved / Closed

Represents a ticket whose active troubleshooting is complete.

Characteristics:

- Removed from the default Running Ticket list.
- Remains stored as historical data.
- Remains available to map/history features when it contains valid coordinates.
- Can still be viewed according to user permission.

## 10.4 Archived

Administrative state for records that should not appear in normal operational views but should not be hard-deleted.

Hard-delete behavior is intentionally not part of normal MVP operator workflow.

---

# 11. Application Modules / Pages

The MVP contains four primary application pages.

---

## 11.1 Dashboard

### Purpose

Provide an operational overview immediately after opening the application.

### Minimum MVP Information

Dashboard should surface at least:

- number of currently Running tickets
- number of tickets created/recorded today
- latest recently updated tickets
- quick access to create a new report
- quick access to Running Ticket
- indication of tickets that have known cut-point coordinates where useful

Exact card layout, charts, visual hierarchy, and responsive behavior belong to the UI/UX PRD.

### Dashboard Product Rules

- Dashboard data must derive from ticket records rather than separate manually maintained counters.
- Clicking a recent/running ticket should open its detail/edit workflow according to permission.
- Dashboard must not be blocked by nonessential analytics in MVP.

---

## 11.2 Template Generator

### Purpose

Primary workspace for creating and updating NOC reports.

### Required Input Areas

The page must contain controls for:

- Title
- Impact List
- Occur Time
- Dispatch Time
- PIC
- Rootcause
- Cut Point
- Progress Timeline / Update Progress
- Cut-point photo drag-and-drop / image selection
- OCR/geotag extraction result
- Latitude
- Longitude
- Generated report preview
- Copy report action
- Save/update ticket action
- Ticket status action

### Product Behavior

- The form must support both creation of new tickets and editing of existing tickets.
- Unsaved/incomplete tickets should be treated carefully to prevent accidental loss; exact autosave strategy is defined later.
- Operators must be able to add progress updates repeatedly without recreating the entire report.
- Generated preview must update from current ticket data.
- Coordinate extraction must not prevent normal report generation when no photo is available.
- Uploading a photo is optional.
- Coordinates are optional unless required by a future operational policy.

---

## 11.3 Running Ticket

### Purpose

Provide a focused list/datagrid of active incidents.

### Minimum MVP Columns / Information

The grid should be able to present the most operationally useful subset of:

- TT/external ticket identifier when detected
- Title
- Occur Time
- Dispatch Time
- PIC
- Rootcause
- Cut Point
- latest progress update
- last updated time
- coordinate availability
- ticket status

Exact visible columns at each viewport are defined in the UI/UX PRD.

### Required Capabilities

- Search running tickets.
- Filter running tickets where practical.
- Sort by relevant fields, with latest activity being a primary use case.
- Open a ticket for detailed review/editing.
- Resume adding progress to an existing ticket.
- Mark a ticket resolved/closed when authorized.
- Clearly distinguish tickets with missing key information.

### Product Rule

The Running Ticket page must be derived from persisted Ticket Reports whose status is `Running`; operators should not maintain a second independent running-ticket dataset.

---

## 11.4 Cut Point Tracker

### Purpose

Visualize known cut-point locations from recorded tickets on an interactive map.

### Minimum MVP Capabilities

- Display a marker for tickets containing valid coordinates.
- Exclude tickets with invalid or missing coordinates.
- Allow the user to inspect a marker.
- Marker details should identify the related ticket and relevant cut-point information.
- Allow navigation from a marker to its ticket detail when permitted.
- Support basic filtering so operators can reduce map clutter as data grows.

Useful marker detail includes:

- ticket identifier/title
- ticket status
- Cut Point description
- coordinates
- PIC
- Rootcause
- latest update or last-updated timestamp where practical

### Map Provider Constraint

The final map technology/provider must be selected in the Technical Architecture PRD with priority given to a solution that does not force the application out of its intended free-tier/Spark-plan operating model.

---

# 12. Search and Retrieval Requirements

The product must make stored ticket data practically retrievable.

MVP search should support at minimum matching against useful ticket-identifying text such as:

- external TT identifier when available
- Title
- PIC
- Cut Point

Additional filtering may include:

- status
- date range
- coordinate availability

Firestore query limitations and implementation strategy are defined in the Data & Database PRD and Technical Architecture PRD.

---

# 13. Roles and Permission Model

Detailed Firebase Auth and Security Rules are deferred to the Security & Access Control PRD, but product behavior assumes the following logical roles.

## 13.1 Admin

Allowed product actions:

- view all permitted tickets
- create tickets
- edit tickets
- append/edit progress
- update status
- use coordinate extraction
- correct coordinates
- view Cut Point Tracker
- archive records
- access administrative settings
- manage users/roles when that feature is enabled

## 13.2 Operator

Allowed product actions:

- view operational tickets
- create tickets
- edit operational ticket fields
- append/edit progress
- update ticket status within allowed workflow
- use coordinate extraction
- correct coordinates
- view Cut Point Tracker
- copy reports

Operator does not receive unrestricted administrative user-management privileges.

## 13.3 Viewer

Allowed product actions:

- view permitted Dashboard data
- view permitted tickets
- view generated report
- copy report
- view Cut Point Tracker

Viewer cannot modify ticket data.

## 13.4 MVP Organization Model

The MVP is a **single-organization internal application**, not multi-tenant SaaS.

Tenant isolation, customer billing, organization switching, and per-customer data partitions are outside MVP scope.

---

# 14. Business Rules

## BR-001 — Structured Data Is the Source of Truth

The stored Ticket Report fields are the source of truth. Generated text is a rendering of those fields and must not become a separately edited conflicting copy.

## BR-002 — Incomplete Running Incidents Are Valid Operational States

Rootcause, PIC, Cut Point, Impact List, and coordinates may initially be unknown. The application must allow the ticket to evolve rather than forcing operators to invent placeholder values.

## BR-003 — Impact List Is Conditional

When Impact List contains no valid item, its label and section are omitted from output.

## BR-004 — Progress Is Append-Oriented

The common operation is adding a new progress entry to an existing running ticket. This action must be simple and must not require rebuilding the report.

## BR-005 — Timeline Order Is Deterministic

Progress output is chronological. Full internal timestamps must support incidents that continue past midnight.

## BR-006 — Coordinate Validation Is Mandatory

Latitude and longitude must pass range validation before they are treated as usable geographic data or plotted on the map.

## BR-007 — OCR Is Assistive, Not Authoritative

OCR/geotag extraction provides a candidate coordinate. The application must allow operator verification/correction and must not treat low-confidence or ambiguous text as unquestionable truth.

## BR-008 — Normalized Coordinate Display

Canonical display format is latitude first, longitude second, with five decimal places:

`-6.12345, 107.12345`

## BR-009 — Manual Coordinate Entry Always Exists

Photo extraction must never be the only way to populate coordinates.

## BR-010 — Ticket Coordinates Drive the Map

Cut Point Tracker markers are generated from Ticket Reports with valid coordinate fields. The map must not require operators to maintain a separate duplicate marker database.

## BR-011 — Running Ticket Is a View, Not a Duplicate Dataset

Running Ticket is a filtered operational view of Ticket Reports whose status is Running.

## BR-012 — Preserve Operator Wording

Title, PIC, Rootcause, Cut Point, Impact List entries, and Progress text must preserve user wording unless the user intentionally edits them.

## BR-013 — No Silent Data Loss

Status changes, navigation, refresh behavior, and editing flows must be designed to minimize accidental loss of operator-entered incident data.

## BR-014 — No Hard Dependency on Paid Cloud Compute for MVP

Core report generation, ticket CRUD, Running Ticket, coordinate input, and Cut Point Tracker must be architected so they can operate without requiring a Firebase Blaze subscription.

## BR-015 — Photo Storage Is Not Required for Core MVP

The MVP requires photo input for coordinate extraction, but does not require permanent cloud storage of the original photo. This protects the Spark-plan constraint and keeps photo archiving outside the core product scope.

---

# 15. Example Reference Incident

This example is used as a product-level acceptance reference for output behavior.

### Input

**Title**  
`[MANDAU] LINK DOWN AT DWDM UJB 109202_BANDUNG_PETA <> 100109_MAJALENGKA, [TT : INC-20260818-00015849]`

**Impact List**  
Optional; omitted when no items exist.

**Occur Time**  
`18/08/2026 14:20`

**Dispatch Time**  
`18/08/2026 14:20`

**PIC**  
`Agus (majalengka)`

**Rootcause**  
`impact forest burning`

**Cut Point**  
`OTDR FO CUT at KM 24 from majalengka (FD fibeerstar)`

**Update Progress**

```text
14:21 we have open TT MDU-20260818-0000036711
14:36 team prepare tools & plan OTW ke lokasi CP, ETA 75 minutes?
14:47 team OTW ke lokasi CP, ETA 75 menit
16:17 team sudah di lokasi CP, suspect CP impact lahan perhutani terbakar
17:11 team support OTW ke lokasi CP, ETA 75 menit
17:51 team plan jumper kabel 200m
19:16 team masih progress jumper kabel crossing jalan
20:10 team masih progress jumper kabel crossing jalan
20:39 team progress kupas kabel sisi majalengka
22:12 Team sendang proses kupas kabel jumper sisi Majalengka
22:51 Team sedang proses kupas kabel sisi bandung
23:00 Team sedang proses setting closure sisi Majalengka
23:07 Team sedang proses setting closure sisi Bandung
23:55 Team sedang proses splicing core sisi bandung
```

The application must be able to represent this incident without loss of meaningful text and generate the updates in chronological order.

---

# 16. Functional Requirements

## FR-001 — Create Ticket Report

An authorized operator can create a new structured Ticket Report.

## FR-002 — Edit Ticket Report

An authorized operator can reopen an existing ticket and update its current operational fields.

## FR-003 — Save Draft

Incomplete incident information can be stored without requiring fake placeholder values.

## FR-004 — Mark Running

A valid ticket can be marked Running and then appears in Running Ticket.

## FR-005 — Resolve/Close Ticket

An authorized operator can mark an active ticket Resolved/Closed without deleting its historical data.

## FR-006 — Manage Impact List

The operator can add multiple impact entries and remove/reorder them.

## FR-007 — Manage Timeline

The operator can add multiple timestamped progress updates and correct entries according to permission.

## FR-008 — Generate Text Report

The app generates standardized plain text from the current structured ticket data.

## FR-009 — Copy Report

The generated report can be copied to clipboard with usable line breaks.

## FR-010 — Photo Drop/Input

The operator can select/drop a cut-point image for coordinate extraction.

## FR-011 — OCR Coordinate Candidate

The application can read candidate coordinate text from supported visible image watermark formats using the chosen client-compatible extraction approach.

## FR-012 — Coordinate Parsing

The application can parse and convert supported DD, DMS, DDM, and hemisphere coordinate formats into decimal degrees.

## FR-013 — Coordinate Normalization

Valid coordinates are displayed canonically as latitude/longitude with five decimal places.

## FR-014 — Manual Coordinate Override

The operator can manually input or correct latitude and longitude.

## FR-015 — Coordinate Validation

Invalid geographic values cannot be committed as valid map coordinates.

## FR-016 — Persist Tickets

When Firebase data integration is enabled, Ticket Reports are persisted in Firestore.

## FR-017 — Running Ticket View

The application lists active Running tickets from the same Ticket Report dataset.

## FR-018 — Search Running Tickets

Operators can locate running incidents using practical identifying text.

## FR-019 — Resume Ticket Update

Opening a running ticket allows the operator to continue adding progress and update report fields.

## FR-020 — Map Valid Cut Points

Tickets with valid coordinates appear as markers in Cut Point Tracker.

## FR-021 — Marker-to-Ticket Navigation

An operator can identify and open the ticket associated with a marker.

## FR-022 — Dashboard Summary

The Dashboard summarizes current operational ticket information from persisted data.

---

# 17. Non-Functional Product Requirements

Detailed measurable engineering budgets will be finalized in the TDD, but the product requires the following characteristics.

## 17.1 Performance

- Frequent operator actions must feel immediate.
- Adding a progress update must not require a full-page reload.
- Report preview generation should occur locally and promptly from current form state.
- Large historical datasets must not force the initial Running Ticket view to load every ticket ever created.

## 17.2 Reliability

- Saved ticket data must remain consistent across Dashboard, Generator, Running Ticket, and Tracker.
- The application must not create duplicate ticket records merely because a user edits an existing report.
- Failure to extract coordinates must not block ticket editing or report generation.

## 17.3 Usability

- Common actions must be obvious to NOC operators without requiring technical knowledge.
- The product must prioritize scanability and rapid data entry.
- Desktop is a primary operational target, but mobile/tablet use must remain fully functional.

## 17.4 Accessibility

- Core workflows must be keyboard usable.
- Inputs require programmatic labels.
- Status and validation cannot rely only on color.
- Interactive controls require accessible states/focus behavior.

Detailed accessibility rules belong to the UI/UX PRD.

## 17.5 Maintainability

The project must be structured so feature modules can evolve independently without becoming a single monolithic React component.

Detailed module/folder architecture belongs to the TDD.

---

# 18. Technology and Platform Constraints

These are product-level constraints already decided for the project.

## 18.1 Frontend

Required direction:

- JavaScript
- React
- Vite
- JSX-based application structure
- CSS and Tailwind CSS ecosystem

The project should use normal React/Vite conventions such as `.jsx`, `.js`, and stylesheet/config files as appropriate.

## 18.2 Explicit Exclusion

- Do not use Next.js for the MVP.

The product intentionally prefers a simpler client-side React/Vite architecture.

## 18.3 Firebase

Intended services:

- Firestore for ticket data
- Firebase Hosting (`*.web.app`) for deployment later
- Firebase Authentication when authentication is implemented

Constraint:

- MVP architecture should target Firebase Spark Plan and avoid unnecessary dependencies that force Blaze billing.

Exact current service quotas, Firebase configuration, Security Rules, and any feature that could require billing must be verified and documented in the Technical Architecture and Security PRDs before implementation.

## 18.4 Development Priority

Current priority is product design and application development.

Firebase Hosting deployment and production-domain configuration are explicitly deferred until later.

---

# 19. MVP Scope

A feature belongs to MVP only when it supports one of the four main operational workflows.

## 19.1 Included in MVP

### Dashboard

- running ticket count
- ticket activity summary
- recent tickets
- shortcut to create/update operational reports

### Template Generator

- required incident fields
- dynamic Impact List
- date/time inputs
- Progress Timeline
- report preview
- copy-to-clipboard
- draft/running/closed lifecycle support
- cut-point image drop/input
- client-compatible visible-watermark coordinate extraction
- coordinate parsing/normalization
- manual latitude/longitude input
- coordinate validation

### Running Ticket

- running ticket list/datagrid
- search
- useful filters/sorting
- open/edit ticket
- continue progress updates
- status change

### Cut Point Tracker

- interactive map
- markers from valid ticket coordinates
- useful marker details
- navigate to ticket
- basic filtering

### Persistence

- Firestore-backed ticket data in the Firebase integration phase

### Roles

- logical Admin
- Operator
- Viewer/read-only role where implemented

## 19.2 Explicitly Deferred After MVP

- automatic ingestion from external TT/NMS systems
- WhatsApp sending or bot integration
- Telegram/Slack integration
- e-mail report delivery
- multi-organization tenancy
- billing/subscription
- sophisticated SLA calculations
- predictive/AI root-cause analysis
- AI rewriting of progress text
- permanent field-photo cloud archive
- advanced GIS layers/network topology
- route navigation to field locations
- offline-first synchronization
- native mobile application
- public ticket links
- customer-facing portal
- complex audit/approval workflow
- real-time collaborative editing by multiple users

---

# 20. Acceptance Criteria by Module

## AC-DASH-001

Given persisted Running tickets, when the Dashboard is opened, then it shows the correct number of Running tickets derived from ticket records.

## AC-DASH-002

Given recently updated tickets, when the Dashboard loads, then the user can identify and open recent ticket activity without visiting a separate history tool first.

## AC-GEN-001

Given the reference MANDAU incident data, when the user fills the Generator, then the application can render the required report fields without losing the supplied operational text.

## AC-GEN-002

Given an empty Impact List, when the report is generated, then no `Impact List` label/blank section is included.

## AC-GEN-003

Given one or more valid Impact List entries, when the report is generated, then the Impact List section is rendered in the correct position.

## AC-GEN-004

Given multiple progress updates entered out of order, when the report is generated, then the output is rendered chronologically based on stored timestamps.

## AC-GEN-005

Given a ticket that continues past midnight, when progress entries are added on both dates, then the application preserves correct chronological order even though output lines may display only `HH:mm`.

## AC-GEN-006

Given a valid report preview, when the operator uses Copy Report, then the clipboard contains the complete report with readable line breaks.

## AC-GEN-007

Given a ticket with unknown Rootcause or Cut Point, when it is saved as Draft or used as an evolving running incident, then the application does not require the operator to enter fabricated values.

## AC-GEO-001

Given a photo watermark containing recognizable decimal-degree coordinates, when extraction succeeds, then the application produces a candidate latitude and longitude.

## AC-GEO-002

Given DMS coordinates with S/E hemisphere indicators, when parsed, then the application converts S latitude to a negative decimal value and E longitude to a positive decimal value.

## AC-GEO-003

Given DDM coordinates, when parsed, then the application converts them into valid decimal degrees.

## AC-GEO-004

Given valid coordinate values, when normalized for display, then they use `<latitude>, <longitude>` with five decimal places.

## AC-GEO-005

Given an invalid latitude above 90 or longitude above 180, when validation runs, then the coordinates are rejected and no Cut Point Tracker marker is produced from them.

## AC-GEO-006

Given an ambiguous OCR result, when coordinate order cannot be safely determined, then the application asks for operator verification/correction rather than silently committing a guessed location.

## AC-GEO-007

Given failed OCR, when the operator manually enters valid latitude and longitude, then the ticket can still save the coordinates and appear on the map.

## AC-RUN-001

Given a ticket with status Running, when Running Ticket is opened, then the ticket appears in the active list.

## AC-RUN-002

Given a ticket changed from Running to Resolved/Closed, when Running Ticket refreshes/reacts to the change, then the ticket no longer appears in the default Running list.

## AC-RUN-003

Given an existing Running ticket, when an authorized operator opens it, then the operator can append a new Progress Timeline entry without creating a duplicate ticket.

## AC-RUN-004

Given multiple running incidents, when the user searches using a matching TT identifier/title/PIC/Cut Point term supported by the MVP search implementation, then relevant tickets can be located.

## AC-MAP-001

Given a ticket with valid latitude and longitude, when Cut Point Tracker opens, then the application can represent the ticket as a map marker.

## AC-MAP-002

Given a ticket without valid coordinates, when the map opens, then it does not create a misleading marker for that ticket.

## AC-MAP-003

Given a marker, when the operator inspects it, then the application provides enough ticket/cut-point context to identify the related incident.

## AC-MAP-004

Given a marker tied to a ticket, when the authorized user chooses to open the ticket, then the application navigates to the corresponding ticket detail/edit flow.

## AC-DATA-001

Given a saved ticket, when it is later opened from another product view, then Title, operational fields, progress entries, status, and coordinates are consistent with the saved record.

## AC-PERM-001

Given a Viewer role, when the user attempts to modify ticket data, then the action is blocked by the eventual authorization model.

---

# 21. MVP Success Criteria

The MVP is considered product-complete when an NOC Operator can perform this complete workflow:

1. Open the application.
2. Create a new incident.
3. Enter Title, Occur Time, Dispatch Time, PIC, Rootcause, Cut Point, and optional Impact List data.
4. Add multiple Progress Timeline entries over time.
5. Save the ticket and mark it Running.
6. Find it in Running Ticket.
7. Reopen it and append later progress without duplicating the record.
8. Drop/select a cut-point photo containing coordinate watermark text.
9. Receive a parsed coordinate candidate for supported formats.
10. Correct coordinates manually when necessary.
11. Save valid latitude/longitude.
12. See that ticket represented on Cut Point Tracker.
13. Generate a correctly ordered plain-text report.
14. Copy the report for use in the existing operational communication workflow.
15. Mark the ticket Resolved/Closed while retaining the historical record.

If this end-to-end workflow is reliable, fast, understandable, and does not require paid cloud compute beyond the intended Spark-plan constraints, the MVP has achieved its primary product objective.

---

# 22. Product Risks and Guardrails

## 22.1 OCR Accuracy Risk

Photo watermark OCR can fail because of compression, poor lighting, font styling, overlays, or low contrast.

Guardrail:

- OCR is assistive.
- Manual coordinate input is always available.
- Ambiguous coordinates require validation/review.

## 22.2 Incorrect Coordinate Risk

An incorrect marker could mislead field operations.

Guardrail:

- strict coordinate range validation
- operator correction workflow
- no silent acceptance of ambiguous OCR output

## 22.3 Overengineering Risk

The tool could become too complex if it attempts to replicate enterprise OSS/ticketing systems.

Guardrail:

- focus MVP on report creation, running tickets, cut-point extraction, and map tracking
- defer integrations and advanced analytics

## 22.4 Firebase Free-Tier Risk

Some Firebase capabilities, quotas, or billing requirements can change.

Guardrail:

- architecture must be verified against current Firebase Spark constraints in the TDD before implementation decisions are locked
- core MVP should favor client-side processing and Firestore-friendly data access patterns

## 22.5 Data Quality Risk

Operators may use inconsistent wording or incomplete records.

Guardrail:

- structured fields
- clear missing-field states
- validation where values are objectively verifiable
- do not over-constrain operational free text

---

# 23. Future Product Opportunities

These items are not commitments but the architecture should avoid unnecessarily blocking them:

- report template variants by region/team
- auto-parse pasted legacy incident reports into structured fields
- historical ticket archive/search page
- SLA/MTTR analytics
- recurring cut-point hotspot analysis
- map clustering and heatmaps
- image/photo attachment archive
- external NMS/OSS integration
- automatic incident import
- WhatsApp/Telegram/Slack delivery
- alert/notification workflow
- field-team mobile workflow
- export to PDF/CSV
- configurable report templates
- saved PIC/team directory
- root-cause taxonomy
- site/link inventory integration
- ticket activity audit trail
- offline/poor-network support

---

# 24. Supporting Documents to Follow

This Master Product PRD is document 1 of the planned specification set.

The following documents should be produced separately, one at a time:

1. **Master Product PRD** — this document.
2. **UI/UX PRD** — design system, layout, responsive behavior, navigation, flows, interaction states, accessibility, mobile/desktop rules.
3. **Technical Architecture PRD / TDD** — React/Vite architecture, project structure, modules, Firebase services, OCR strategy, map provider, environment, build/testing/CI strategy.
4. **Data & Database PRD** — Firestore collections/documents, relationships, indexes, lifecycle, audit fields, retention, query patterns, data validation.
5. **API & Integration PRD** — client/service boundaries, external integrations, contracts, validation, rate limiting, future integration strategy.
6. **Security & Access Control PRD** — Firebase Auth, RBAC, session behavior, Security Rules, secrets, abuse prevention, audit/security requirements.

No supporting document should redefine the product scope silently. Any product-scope change must update this Master Product PRD or explicitly record an approved deviation.

---

# 25. Final MVP Product Definition

**NOC Report Template Generator is a React/Vite web application for NOC operators to create standardized incident reports from structured fields, continuously update running incident timelines, extract and normalize cut-point coordinates from geotag photo watermarks, track active tickets, and visualize known cut points on a map, while persisting operational ticket records in a Firebase Spark-compatible architecture.**
