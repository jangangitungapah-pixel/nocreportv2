# Mega UI Migration Closure Notes

**Branch:** `feature/ui-density-system`  
**Purpose:** record the final canonical UI ownership model after the staged Mega migration and the MEGA-9 legacy-elimination audit.

## Canonical ownership

The migration is no longer operating with parallel legacy and replacement implementations. The following ownership contracts are canonical:

- `src/shared/lib/cn.js` — class composition through `clsx` + `tailwind-merge`.
- `src/shared/ui/variants.js` — shared CVA button, panel, and badge variants.
- `src/shared/ui/icon.jsx` — the only application icon adapter, backed by Lucide.
- `src/shared/ui/primitives.jsx` — shared Radix interaction wrappers for Dialog, Dropdown Menu, Popover, Tooltip, Tabs, Scroll Area, Separator, Checkbox, Switch, Toggle Group, and Slot-powered Button composition.
- `src/app/providers/ToastProvider.jsx` — compatibility `useToast()` API with Sonner as the single toast-rendering owner.
- `src/shared/data-workspace/` — TanStack Table v9 and TanStack Virtual ownership for operational datasets and meaningful long lists.
- `src/shared/ui/ResizableWorkspace.jsx` — `react-resizable-panels` ownership for desktop Generator and Cut Point split workspaces.
- `src/app/components/CommandPalette.jsx` — cmdk ownership for the global role-aware command palette.
- Template Generator validation — React Hook Form with Zod resolver ownership.
- `src/shared/motion/index.js` plus Motion React where used — restrained motion contracts with reduced-motion support.
- `src/styles/tokens.css` — semantic density, control, radius, panel, shell, status, and motion tokens.

## Closed migration debt

MEGA-9 removed or converged the remaining competing implementations:

- Manual SVG `UiIcon` was removed; runtime icon rendering now goes through `AppIcon`.
- The duplicate legacy Button implementation was removed; compatibility exports delegate to the canonical CVA Button.
- `SelectField` retains its product-facing form API, but overlay/outside-dismiss/Escape ownership now comes from Radix Popover instead of document-level bespoke listeners.
- `ConfirmDialog` retains its compatibility API while Dialog portal, focus trap, Escape, dismiss, and focus-return behavior are Radix-owned.
- Sonner remains the only toast renderer; the existing `useToast()` interface is retained solely as an application API boundary.
- The compatibility `/generator/:ticketId` route and `TicketRoutePage` permission delegator were removed. Read-only review is `/tickets/:ticketId`; explicit mutation entry is `/generator/:ticketId/edit`.
- The obsolete Generator density override stylesheet and its `!important` layout patches were removed.
- Obsolete global elevated/hero compatibility selectors and stale Generator-specific global styling were removed from `src/styles/app.css`.
- The migration-only dependency registry was removed. Production dependencies must be justified by real application-source responsibility rather than artificial imports.
- Shell-level Radix Separator, Switch, and Tooltip now have real product responsibilities rather than wrapper-only presence.

## Intentional compatibility APIs

Some compatibility exports remain because they are useful product APIs, not competing rendering engines:

- `useToast()` remains the application notification API while Sonner owns rendering.
- `src/shared/ui/index.jsx` still exports form controls, `StatusBadge`, state surfaces, and `ConfirmDialog` for feature compatibility. These surfaces delegate icon, button, overlay, and class-composition concerns to the canonical ownership layer.

Compatibility APIs may remain when they provide a stable feature boundary. They must not reintroduce a second implementation owner for icons, buttons, overlays, notifications, or focus management.

## Static migration guard

`scripts/t7-security-hygiene.mjs` now prevents reintroduction of the major eliminated patterns in application UI source, including:

- `UiIcon`;
- `spatial-panel-elevated`;
- routine `hover:-translate-y` movement;
- visible raw `<select>` controls;
- compatibility `/generator/:ticketId` routing;
- `TicketRoutePage`;
- legacy `!important` patches outside the explicit global accessibility exception.

The same gate also verifies that every declared production dependency is referenced by application source.

## Intentional exceptions

Two classes of CSS override are not migration debt:

- `src/infrastructure/map/leafletMap.css` is integration CSS for Leaflet and may use specificity/`!important` where required to override third-party stylesheet behavior. Infrastructure integration CSS is outside the application UI legacy guard.
- `src/styles/app.css` retains `!important` only inside the global `prefers-reduced-motion` enforcement block so animation/transition suppression wins consistently for users requesting reduced motion.

These exceptions must remain narrow and may not be used as a path for routine product-surface overrides.

## Protected contracts

Migration closure does not change Ticket meaning, RBAC outcomes, optimistic revision protection, Firestore Security Rules, OCR local-only privacy, lifecycle transitions, canonical report formatting, bounded Firestore access, or read-only versus mutation route separation.

Future page-specific overhaul PRDs should build on this ownership model rather than reopening app-wide primitive migration decisions.
