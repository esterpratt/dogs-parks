### 0002 — RTL Exceptions Whitelist

Purpose: Track intentional physical left/right usages that must remain physical (not converted to logical properties) due to platform/device constraints or explicit UX requirements.

Guidelines:

- Prefer logical properties everywhere else.
- Only whitelist when physical edges are required (e.g., device safe areas, absolute centering pairs, third‑party overrides).
- Keep entries concise and actionable. Include selector, file, reason, and scope.

How to add an entry

Copy this template and fill in the details:

```
- File: `path/to/file.scss`
- Selector: `.your-selector` (or component/element description)
- Lines: optional line refs or pattern description
- Reason: why physical sides are required
- Scope: page/component specific, or global
- Notes: optional additional context
```

Global allowances (pre-approved patterns)

1. Page/container safe‑area paddings

- File: `src/pages/Login.module.scss`
- Selector: `.container`
- Lines: padding shorthand values using `var(--safe-area-inset-left|right)`
- Reason: Safe area CSS variables are physical device edges. Mapping them to logical inline sides would misalign padding on RTL devices. Keep physical left/right to respect device insets.
- Scope: Keep physical in all page containers where safe‑area variables are used.

2. Absolute centering pairs

- Files: various
- Pattern: `left: 50%` with `transform: translateX(-50%)`
- Reason: Symmetric centering; keep as-is. No logical conversion needed.
- Scope: Global

3. Third‑party component overrides (as needed)

- Files: TBA
- Reason: Some vendor styles require physical overrides; convert only if proven safe.
- Scope: Add specific selectors/files when encountered.

Specific entries

1. Login page — Social sign‑in buttons (Google, Apple)

- File: `src/pages/Login.module.scss`
- Selector: `.container .google-login-button`, `.container .apple-login-button`, `.container .apple-login-button svg`
- Lines: Keep icon left of label; preserve gap and alignment identical to English.
- Reason: Brand compliance and consistent UX; do not mirror icon/text order in RTL; do not flip Apple/Google icons.
- Scope: Login page only.
- Notes: Allowed to use `direction: ltr` and physical left/right spacing if needed to preserve English layout across locales.

2. Navbar — Keep English ordering and anchoring

- File: `src/components/NavbarBottom.module.scss`
- Selector: `.navbar`, `.icons-container`, `.menu-container`, `.notification-badge`
- Lines: Preserve item order, right-anchored menu, and top-right notification badge as in English.
- Reason: Consistent navigation muscle memory and affordance; navbar should not mirror in RTL.
- Scope: Global component (bottom navbar across the app).
- Notes: Allowed to set `direction: ltr` on navbar containers and keep physical `right` positioning where used (e.g., `.menu-container`, `.notification-badge`).

3. Header navigation arrows — Keep original direction

- File: `src/components/Header.module.scss`, `src/components/park/ParkHeader.tsx`
- Selector: `.prev-links a`, `MoveLeft` and `MoveRight` icons
- Lines: Back/forward arrows in header navigation should maintain their original left/right direction.
- Reason: Navigation arrows represent directional movement; flipping them would confuse users about actual page flow.
- Scope: All header components with navigation arrows (ParkHeader, etc.).
- Notes: Do not apply `scaleX(-1)` or flip `MoveLeft`/`MoveRight` icons; keep them as-is for consistent navigation UX.

Categories to populate (pending entries)

1. Icons and imagery

- Pending

2. Carousels and horizontal scrollers

- Pending

3. Maps (Leaflet controls, attributions, popups)

- File: `src/components/map/NewMap.tsx`
- Selector: All map buttons (list view, center location, weather)
- Lines: Inline styles with direction-aware positioning
- Reason: All map buttons should mirror to left side in RTL for better UX
- Scope: All map buttons
- Notes: Uses dynamic positioning `[isRTL ? 'left' : 'right']` to adapt to language direction

4. Text and fields (force LTR where required)

- Pending

5. Shadows and motion (directional box-shadows, slide animations)

- Pending

6. Component-specific (tabs, indicators, modal close buttons)

- Pending

7. Other

- Pending

Notes

- Do not flip logos/brand imagery.
- Directional icons may be flipped later under Phase 2.
