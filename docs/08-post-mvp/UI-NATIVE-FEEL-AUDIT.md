# UI Native-Feel Elimination Audit

**Status:** TEMPLATE GENERATOR COMPACT PASS — AUTOMATED QA RUNNING  
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

### Template Generator compact workspace

- [x] Smart Import reduced from hero treatment to a compact utility module.
- [x] Smart Import textarea and detection summary reduced in vertical footprint.
- [x] Generator command surface padding and decorative weight reduced.
- [x] Core form cards tightened into one dense editor rhythm.
- [x] Redundant section descriptions suppressed where field-level hints already carry the requirement.
- [x] Impact editor and empty state compacted.
- [x] OCR utility visual weight and dropzone footprint reduced.
- [x] Progress composer/history and zero state compacted.
- [x] Desktop Report Preview converted to a fixed-width sticky utility rail.
- [x] Desktop editor/preview ratio rebalanced in favor of input work.
- [x] Mobile remains single-column with tighter spacing and the same interaction contracts.

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

### Dashboard compact workspace

- [x] Oversized Operational overview hero panel removed.
- [x] Redundant Workspace signal card removed.
- [x] Duplicate Local preview banner removed.
- [x] Dashboard intro copy reduced to one short operational status line.
- [x] New Ticket action moved into a compact page header.
- [x] KPI cards moved directly under the page header and reduced in vertical footprint.
- [x] Recently updated header and empty state spacing tightened.

## Automated QA evidence

Previous compact Dashboard code head passed **Quality #638 — FULL GREEN**.

Template Generator compact-editor pass is now running a fresh full repository Quality gate. Required checks remain:

- [ ] Formatting committed.
- [ ] Lint green.
- [ ] Unit/component tests green.
- [ ] Firebase Emulator / Security Rules green.
- [ ] Release preflight green.
- [ ] Generic production build green.
- [ ] Firebase-configured production build green.
- [ ] Dev smoke green.
- [ ] Responsive/touch browser QA green.
- [ ] Playwright Admin lifecycle / RBAC / keyboard / axe green.
- [ ] Source formatting verification green.

## Release gate

- [ ] Template Generator compact pass automated QA complete.
- [ ] Manual Light/Dark desktop/mobile micro-polish and branding acceptance.

PR #4 remains draft. It is temporarily targeted to `main` only to execute the repository Quality workflow and will be retargeted to `feature/smart-template-parser` after validation.
