# UI Native-Feel Elimination Audit

**Status:** IN PROGRESS  
**Branch:** `feature/ui-native-polish`  
**Parent:** `feature/smart-template-parser`

## Goal

Remove remaining browser/library-default visual cues from the NOC Report application without changing Firebase, Ticket lifecycle, OCR, parsing, report formatting, or RBAC behavior.

The target is a cohesive custom product surface where every visible control belongs to the same spatial design system.

## Audit checklist

### Shared controls

- [ ] Custom select/listbox replaces visible native `<select>` controls.
- [ ] Date/time controls hide browser chrome and use a product-owned picker trigger.
- [ ] Text fields normalize autofill, caret, placeholder, disabled, readonly, focus, and invalid states.
- [ ] Textareas remove the native resize grip and use the shared scrollbar language.
- [ ] Buttons and icon buttons have consistent hover / pressed / disabled / focus motion.
- [ ] Common glyphs use one vector icon language instead of mixed Unicode symbols.

### Navigation and shell

- [ ] Sidebar and mobile navigation use product-owned vector icons rather than letter placeholders.
- [ ] Theme control uses product-owned sun/moon artwork.
- [ ] Touch press feedback is deliberate on mobile navigation.
- [ ] Scrollable navigation uses the shared custom scrollbar treatment.

### Feedback and overlays

- [ ] Toasts use tone-aware accents, a custom close affordance, and entrance motion.
- [ ] Confirm dialog surface/overlay/close behavior remains fully custom and focus-safe.
- [ ] Skeleton shimmer looks deliberate rather than a generic pulse placeholder.
- [ ] Empty/error states use the same icon language as the rest of the product.

### Generator details

- [ ] Smart Paste, report preview, progress editor, Impact editor, and coordinate controls share one micro-interaction language.
- [ ] OCR disclosures remove the native `<summary>` marker and use a custom chevron.
- [ ] OCR file input remains visually hidden behind the product-owned drop zone / buttons.
- [ ] Timeline edit/remove/reorder actions use product-owned icons.
- [ ] Long report/OCR text scroll surfaces use custom scrollbars and edge treatment.

### Operational list pages

- [ ] Running Tickets filters use custom selects.
- [ ] Cut Point Tracker filter uses custom select.
- [ ] Desktop table headers/scrolling feel intentional and not like an unstyled HTML table.
- [ ] Row/card action controls use consistent pressed/focus states.

### Map

- [ ] Leaflet zoom controls are fully reskinned.
- [ ] Leaflet popup, close button, tip, and typography use application tokens.
- [ ] Leaflet attribution is integrated into the visual system while keeping required attribution visible.
- [ ] Marker hover/focus/selected treatment matches the application.

### Browser-level polish

- [ ] Scrollbars use product tokens on Chromium/Firefox.
- [ ] Browser autofill does not inject a foreign yellow/blue field surface.
- [ ] Calendar-picker indicator is visually replaced.
- [ ] Native disclosure markers are removed from styled disclosures.
- [ ] Default tap highlight and default outlines remain suppressed only where a custom accessible focus state exists.
- [ ] `prefers-reduced-motion` continues to disable nonessential animation.

## Release gate

- [ ] Formatting committed.
- [ ] Lint green.
- [ ] Unit/component tests green.
- [ ] Firebase Emulator / Security Rules green.
- [ ] Production builds green.
- [ ] Responsive/touch browser QA green.
- [ ] Playwright lifecycle / RBAC / keyboard / axe green.
- [ ] Manual Light/Dark desktop/mobile micro-polish acceptance.
