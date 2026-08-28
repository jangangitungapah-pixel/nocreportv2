# ADR-001 — Gemini Coordinate OCR

**Status:** Accepted / Current implementation revision  
**Date:** 29 August 2026  
**Scope:** Cut Point coordinate extraction, browser data flow, privacy disclosure, API-key handling, and related architecture/security documentation

## Context

The original MVP architecture used browser-local OCR (Tesseract/Paddle-style processing) and documented that Cut Point source images never left the browser.

The current production code has intentionally evolved. Coordinate extraction now uses `gemini-3.6-flash` through the Google Generative Language `generateContent` endpoint. The browser converts the selected image to inline base64 data and sends it directly to Gemini only after the operator explicitly presses **Scan coordinates**.

Keeping the old "image never leaves the browser" documentation would therefore be incorrect and would create a privacy/security contract mismatch even though NOCReport still does not persist source images.

## Decision

The current Coordinate OCR integration is defined as follows:

```text
Operator selects Cut Point image
        ↓
Image remains browser-local while idle/reviewing
        ↓
Operator explicitly presses Scan coordinates
        ↓
Browser encodes image for the request
        ↓
Browser sends image + coordinate-only prompt directly to Gemini API
        ↓
Gemini returns structured coordinate result
        ↓
Application validates/normalizes candidate(s)
        ↓
Operator reviews/applies coordinate
        ↓
Only verified coordinate metadata may be persisted to Firestore
```

NOCReport does **not**:

- upload source images to Firebase Storage;
- persist source images or image base64 in Firestore;
- introduce Cloud Functions, Cloud Run, or a custom image-processing backend;
- persist the original image as Ticket evidence;
- ask Gemini to infer coordinates from landmarks, scenery, addresses, or other context when no visible coordinate text exists.

The Gemini prompt is constrained to coordinates visibly present in the image. Ambiguous results remain reviewable and are not silently promoted into authoritative persisted coordinates.

## API-key handling

The current client integration lets an Admin/Operator configure a Gemini API key from Settings.

The key:

- is stored in the current browser profile using `localStorage`;
- is not written to Firestore;
- is not committed to GitHub;
- is not embedded into the production bundle by the application;
- is sent from the browser with direct Gemini requests.

Browser `localStorage` is **not** a protected server-side secret store. JavaScript executing on the same origin can theoretically access it, so the key must be treated as a browser-scoped credential. Users should remove it from shared or untrusted browser profiles.

## Privacy contract

The accurate user-facing privacy statement is now:

> NOCReport does not persist Cut Point source images. A selected image stays local until the operator explicitly starts Coordinate OCR. When Scan coordinates is pressed, that image is transmitted directly from the browser to the Gemini API for analysis. Only verified coordinate metadata is persisted by NOCReport.

The UI must not state or imply that OCR is fully local while this integration is active.

## Firebase/Spark boundary

This decision does not add Firebase Cloud Storage, Cloud Functions, Cloud Run, App Hosting, or a custom backend, so the application's Firebase architecture can remain on its Spark-oriented path.

Gemini is an external API integration with its own quota, availability, API-key, and possible billing contract. Firebase Spark limits must not be presented as covering Gemini usage.

## Security consequences

1. Source images remain outside the application's persisted data model.
2. The browser is now an outbound data boundary for selected images when Scan is invoked.
3. Privacy disclosure must be visible before or at the OCR action and in Settings/documentation.
4. API-key compromise risk is materially different from Firebase public Web App configuration because the Gemini key authorizes an external API request.
5. XSS prevention and avoiding untrusted script execution on the application origin remain important because browser storage is readable from same-origin JavaScript.
6. Raw image contents and API keys must never be printed to production logs or audit data.

## Documentation precedence

This ADR is an explicit post-MVP architecture/security revision and supersedes the historical baseline **only where those documents describe Coordinate OCR as fully browser-local or prohibit external AI OCR**.

Specifically, until the baseline documents are folded forward into a new consolidated version, this ADR takes precedence over conflicting wording in:

- `docs/02-architecture/TECHNICAL-ARCHITECTURE-TDD.md`, including the OCR technology/pipeline, local-image-only statements, local Tesseract requirements, and Technical Definition of Done items tied to a fully local OCR engine;
- `docs/04-api/API-INTEGRATION-PRD.md`, including the BrowserOcrAdapter/Tesseract-only example, local-only OCR integration statements, external-AI exclusions, and API Definition of Done wording that requires OCR to execute locally;
- `docs/05-security/SECURITY-ACCESS-CONTROL-PRD.md`, including statements that Cut Point image processing is entirely local or that source images never leave the browser.

The following baseline rules remain unchanged:

- source images are not persisted by NOCReport;
- no Firebase Storage image archive is introduced;
- coordinate candidates remain untrusted until validated;
- only authorized operational roles may persist verified coordinates;
- no privileged Firebase service-account credential is placed in frontend code;
- report generation remains local and deterministic.

## Quality-gate implication

Repository hygiene rules should continue rejecting routine production `!important` styling overrides. Accessibility declarations inside `@media (prefers-reduced-motion: reduce)` are not legacy styling hacks and may use the narrowly allowed motion-suppression properties needed to reliably honor the user's reduced-motion preference.

## Follow-up

A future documentation consolidation may fold this ADR into new versions of the Architecture, API, and Security PRDs. Until then, this ADR is the current decision record for Coordinate OCR behavior.
