# ADR-001 — Browser OCR Engine Upgrade for Field Geotag Watermarks

**Status:** Accepted  
**Date:** 2026-08-21  
**Related:** `TECHNICAL-ARCHITECTURE-TDD.md`, T4 Local OCR & Coordinate Extraction

## Context

Field validation with real NOC geotag photos exposed a practical accuracy limit in the original Tesseract.js-only OCR pipeline. Small geotag watermarks compete with equipment labels, timestamps, logos, UI text, high-contrast flash reflections, dark backgrounds, and mixed text colors.

A real sample containing a DMS coordinate such as:

```text
6°35'39,258"S 106°39'58,086"E
```

was incorrectly reduced by OCR/parser noise into a low-confidence false coordinate such as:

```text
8.00000, 7.00000
```

This demonstrated two independent requirements:

1. the OCR engine needs proper text detection before recognition;
2. the coordinate parser must reject low-information numeric false positives.

## Decision

The browser-local OCR architecture is revised to:

```text
PaddleOCR.js (primary)
        ↓
PP-OCRv5 mobile text detection + recognition
        ↓
coordinate parser / validation
        ↓
Tesseract.js fallback when PaddleOCR is unavailable or yields no candidate
        ↓
manual operator verification remains mandatory
```

Primary package:

```text
@paddleocr/paddleocr-js 0.4.2
```

Fallback package:

```text
tesseract.js 7.0.0
```

PaddleOCR is isolated behind the OCR infrastructure adapter. Product features do not import PaddleOCR directly.

## Why PaddleOCR

PaddleOCR's browser SDK runs text detection and text recognition as a pipeline. This is better suited to field photographs where geotag text occupies a small region within a much larger image.

The implementation uses PP-OCRv5 mobile detection/recognition models and a browser WASM inference backend. OCR stays entirely client-side.

## Parser hardening

Unlabeled decimal coordinate pairs must no longer accept arbitrary short numbers merely because they are geographically in range.

Examples that must be rejected:

```text
8,7
12,31
20,08
```

unless explicit coordinate context exists such as `Lat`, `Lng`, or hemisphere markers.

An unlabeled numeric coordinate pair must have GPS-like decimal precision. Labeled or hemisphere-based coordinate formats remain authoritative.

## Fallback behavior

If PaddleOCR:

- cannot initialize;
- cannot load its runtime/models;
- is unsupported in a browser;
- or produces no coordinate candidate;

then the application runs the existing Tesseract.js multi-region fallback.

No OCR engine may auto-save a candidate.

All candidates remain editable and require explicit operator verification.

## Privacy invariant

This ADR does not change the privacy architecture:

- source images remain local to the browser session;
- no photo bytes are uploaded to Firebase;
- no Firebase Storage dependency is introduced;
- no OCR image is committed to GitHub as an application asset;
- only confirmed coordinate metadata may be persisted to Firestore.

## Performance

OCR libraries and models must remain lazy-loaded. Dashboard, Running Ticket, and other non-OCR routes must not eagerly load OCR engines.

PaddleOCR instances may be cached for the current browser session to avoid repeated model initialization.

## Quality requirements

T4 must include regression coverage for:

- DMS with decimal commas;
- Decimal Degrees with hemisphere suffixes;
- signed DD + hemisphere combinations;
- compact DMS recovery when OCR drops punctuation;
- false-positive numeric pairs such as `8,7`;
- address-only watermarks that contain no coordinate;
- explicit operator verification before applying any OCR candidate.

## Consequences

Positive:

- stronger small-text detection;
- better fit for mixed-content field photos;
- keeps OCR browser-local;
- preserves Tesseract as graceful fallback;
- no paid OCR/cloud service required.

Costs:

- larger OCR runtime/model payload;
- first OCR scan may require model initialization/download;
- package lock must include PaddleOCR and its transitive dependencies;
- browser compatibility/performance must be measured during T7 hardening.

## Superseded baseline

The TDD statement that Tesseract.js is the sole baseline OCR engine is superseded by this ADR. Tesseract.js remains supported as the fallback engine.
