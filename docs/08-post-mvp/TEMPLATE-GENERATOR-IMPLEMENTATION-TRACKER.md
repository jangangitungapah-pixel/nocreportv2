# Template Generator Feature Expansion — Implementation Tracker

**Source workplan:** `docs/08-post-mvp/TEMPLATE-GENERATOR-FEATURE-WORKPLAN.md`  
**Evidence annex:** `docs/08-post-mvp/TEMPLATE-GENERATOR-EMAIL-IMPORT-ADDENDUM.md`  
**Branch:** `feature/template-generator-features`  
**PR:** #7  
**Status:** GEN-F0 IN PROGRESS

## GEN-F0 — Baseline, contracts and feature skeleton

- [x] Dedicated implementation branch created from the validated Mega UI foundation.
- [x] Dedicated draft PR created; no merge authorized.
- [x] Normalized Import Candidate contract added.
- [x] Explicit candidate source/confidence vocabulary added.
- [x] `message_metadata` candidate source reserved for Outlook top-level metadata.
- [x] Operational text normalization handles NBSP/whitespace and literal `undefined`.
- [x] Raw external TT normalization preserves the source reference.
- [x] Canonical `incidentKey` normalizes `INC-`, `DWDM-INC-`, and `DATACOM-INC-` variants to the embedded `INC-YYYYMMDD-NNN...` identity.
- [x] Raw alarm preservation + deterministic alarm-family normalization added.
- [x] Ordered `pathEndpoints[]` parsing added.
- [x] Canonical endpoint normalization treats spaces/underscores equivalently for identity.
- [x] Orientation-equivalent `pathKey` added: `A<>B<>C == C<>B<>A` while interior reordering remains distinct.
- [x] `MANDAU_DEFAULT` Template Profile contract added.
- [x] `MANDAU_DEFAULT` timezone locked to `Asia/Jakarta`.
- [x] Email Dispatch Time contract locked to `PR_CLIENT_SUBMIT_TIME` / `0x00390040`.
- [x] Delivery Time fallback explicitly disabled in profile contract.
- [x] Quoted body `Sent:` fallback explicitly disabled in profile contract.
- [x] Non-persisted Ticket schema-v2 feature contract proposal added.
- [x] Schema-v1 compatibility defaults covered without changing production mapper/persistence.
- [x] Sanitized corpus-inspired fixtures added with fake node/TT data only.
- [x] Sanitized fixtures cover multi-point path, reverse orientation, TT prefixes, and quoted `Sent:` risk.
- [x] Pure unit regression coverage added for GEN-F0 contracts.
- [x] Production Generator form behavior unchanged.
- [x] Firestore persistence/schema behavior unchanged.
- [x] RBAC/Security Rules/lifecycle/OCR/canonical report behavior unchanged.
- [ ] Prettier formatting committed.
- [ ] ESLint green.
- [ ] Unit/component suite green.
- [ ] Firebase Emulator repository tests green.
- [ ] Firestore Security Rules matrix green.
- [ ] Repository/dependency hygiene green.
- [ ] Release preflight green.
- [ ] Generic + Firebase-configured production builds green.
- [ ] Dev smoke green.
- [ ] Real-browser viewport/touch QA green.
- [ ] Playwright lifecycle/RBAC/keyboard/overflow/axe green.
- [ ] Final committed-format verifier green on clean head.
- [ ] PR returned to stacked base `feature/ui-density-system` after clean integration QA.

### GEN-F0 exit criterion

GEN-F0 is complete only when the contracts above remain non-invasive to production behavior and the full repository Quality workflow is green on a clean committed head.

## Remaining phases

- [ ] GEN-F1 — Unified Import + Outlook `.msg`
- [ ] GEN-F2 — Structured alarm metadata + Template Profile + Smart Title
- [ ] GEN-F3 — Impact Builder + Progress acceleration
- [ ] GEN-F4 — Validation Center + Time Intelligence
- [ ] GEN-F5 — Duplicate Detection + Related Tickets
- [ ] GEN-F6 — Draft Recovery + Revision Diff
- [ ] GEN-F7 — Handover + Copy Center + Presets + Commands
- [ ] GEN-F8 — Evidence workspace
- [ ] GEN-F9 — Integrated hardening / feature-release readiness

## Protected contracts

- Ticket lifecycle meaning remains unchanged.
- `/tickets/:ticketId` remains read-only.
- `/generator/:ticketId/edit` remains explicit mutation entry.
- optimistic revision checks remain authoritative.
- Firebase Security Rules/RBAC remain authoritative.
- OCR remains local-only.
- Email/Smart Import never auto-write Firestore.
- Outlook `.msg` bytes, raw body/HTML, recipient lists, Exchange headers and attachments are not persisted.
- all future duplicate/related-Ticket reads remain bounded.
