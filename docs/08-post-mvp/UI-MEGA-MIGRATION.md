# Mega UI Migration Compatibility Notes

**Branch:** `feature/ui-density-system`  
**Purpose:** keep the application shippable while the Mega UI Overhaul migrates from bespoke primitives to the new dependency-backed design system.

## Active foundation

MEGA-0 activates these canonical foundations:

- `src/shared/lib/cn.js` — canonical class composition via `clsx` + `tailwind-merge`;
- `src/shared/ui/variants.js` — CVA contracts for buttons, panels, and badges;
- `src/shared/ui/icon.jsx` — canonical Lucide icon adapter;
- `src/shared/motion/index.js` — shared Motion timing/easing presets;
- `src/styles/tokens.css` — dense semantic spacing, radius, control, panel, shell, and motion tokens.

## Temporary legacy compatibility

The following legacy implementations remain intentionally available during migration:

- `UiIcon` in `src/shared/ui/index.jsx`;
- bespoke `ConfirmDialog`;
- bespoke `SelectField` listbox;
- current Toast provider/rendering;
- page-level button/action class strings;
- legacy spatial panel helpers;
- Generator workspace CSS overrides.

They are compatibility code, not the final architecture.

## Migration rule

New Mega-overhaul work should use the new foundation first. Existing pages may continue importing legacy primitives until their owning MEGA phase migrates them. Do not introduce new duplicated bespoke primitives when an activated dependency already owns that concern.

## Planned removals

- MEGA-1: Radix wrappers begin replacing bespoke overlay/listbox interaction code.
- MEGA-2: Sonner and shell primitives replace custom notification/shell interaction plumbing.
- MEGA-3+: data/workspace pages migrate to TanStack/Resizable Panels.
- MEGA-9: explicit repository-wide legacy elimination audit removes dead compatibility paths.

## Safety

Compatibility removal must not weaken RBAC, Ticket revision protection, Firestore security, OCR privacy, lifecycle semantics, canonical report formatting, or keyboard/accessibility behavior.
