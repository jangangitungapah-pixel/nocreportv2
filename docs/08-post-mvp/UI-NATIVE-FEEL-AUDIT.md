# UI Native-Feel Elimination Audit

**Status:** AUTOMATED QA COMPLETE — VISUAL ACCEPTANCE PENDING  
**Branch:** `feature/ui-native-polish`  
**Parent:** `feature/smart-template-parser`

## Goal

Remove remaining browser/library-default visual cues from the NOC Report application without changing Firebase, Ticket lifecycle, OCR, parsing, report formatting, or RBAC behavior.

The target is a cohesive custom product surface where every visible control belongs to the same spatial design system.

## Audit checklist

### Shared controls

- [x] Custom select/listbox replaces visible native `<select>` controls.
- [x] Date/time controls hide browser chrome and use a product-owned picker trigger.
- [x] Text fields normalize autofill, caret, placeholder, disabled, readonly, focus, and invalid states.
- [x] Textareas remove the native resize grip and use the shared scrollbar language.
- [x] Buttons and icon buttons have consistent hover / pressed / disabled / focus motion.
- [x] Common glyphs use one vector icon language instead of mixed Unicode symbols.

### Navigation and shell

- [x] Sidebar and mobile navigation use product-owned vector icons rather than letter placeholders.
- [x] Theme control uses product-owned sun/moon artwork.
- [x] Touch press feedback is deliberate on mobile navigation.
- [x] Scrollable navigation uses the shared custom scrollbar treatment.

### Feedback and overlays

- [x] Toasts use tone-aware accents, a custom close affordance, and entrance motion.
- [x] Confirm dialog surface/overlay/close behavior remains fully custom and focus-safe.
- [x] Skeleton shimmer looks deliberate rather than a generic pulse placeholder.
- [x] Empty/error states use the same icon language as the rest of the product.

### Generator details

- [x] Smart Paste, report preview, progress editor, Impact editor, and coordinate controls share one micro-interaction language.
- [x] OCR disclosures remove the native `<summary>` marker and use a custom chevron.
- [x] OCR file input remains visually hidden behind the product-owned drop zone / buttons.
- [x] Timeline edit/remove/reorder actions use product-owned icons.
- [x] Long report/OCR text scroll surfaces use custom scrollbars and edge treatment.

### Operational list pages

- [x] Running Tickets filters use custom selects.
- [x] Cut Point Tracker filter uses custom select.
- [x] Desktop table headers/scrolling feel intentional and not like an unstyled HTML table.
- [x] Row/card action controls use consistent pressed/focus states.

### Map

- [x] Leaflet zoom controls are fully reskinned.
- [x] Leaflet popup, close button, tip, and typography use application tokens.
- [x] Leaflet attribution is integrated into the visual system while keeping required attribution visible.
- [x] Marker hover/focus/selected treatment matches the application.

### Browser-level polish

- [x] Scrollbars use product tokens on Chromium/Firefox.
- [x] Browser autofill does not inject a foreign yellow/blue field surface.
- [x] Calendar-picker indicator is visually replaced.
- [x] Native disclosure markers are removed from styled disclosures.
- [x] Default tap highlight and default outlines remain suppressed only where a custom accessible focus state exists.
- [x] `prefers-reduced-motion` continues to disable nonessential animation.

### Product branding

- [x] Uploaded logo is promoted to the canonical production asset `public/brand/noc-report-logo.png`.
- [x] Generic root image filename is removed after the canonical asset is registered.
- [x] Shared `BrandMark` / `BrandLockup` primitives own product-logo rendering.
- [x] Desktop sidebar and mobile topbar use the real product logo.
- [x] Login desktop/mobile and authenticated session-loading surfaces are branded.
- [x] Favicon, Apple touch icon, browser title, description, and theme metadata use the product identity.
- [x] Brand asset path is covered by unit regression tests.

## Automated QA evidence

Final product/code head before this documentation-only update: `a34a23219f8945dd07de3bb656ecf40d9ea3dae9`.

**Quality #637: FULL GREEN**

- [x] Formatting committed.
- [x] Lint green.
- [x] Unit/component tests green — 114 passed in the standard suite; emulator-only suites run in their dedicated gate.
- [x] Firebase Emulator / Security Rules green.
- [x] Production builds green.
- [x] Responsive/touch browser QA green.
- [x] Playwright lifecycle / RBAC / keyboard / axe green.
- [x] Source formatting verification green after exact Prettier output was committed.
- [x] Temporary one-shot formatter workflow removed before the final green run.

## Release gate

- [x] Automated QA complete.
- [ ] Manual Light/Dark desktop/mobile micro-polish and branding acceptance.

PR #4 remains a draft stacked on `feature/smart-template-parser` until manual visual acceptance is complete.
