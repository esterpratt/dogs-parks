# Fix Map Buttons in Landscape Mode

## Problem
The buttons on the map in the home screen are not shown in landscape mode. They need to be smaller and closer to the top so all buttons will be shown.

## Current Implementation
- List view button (AlignJustify): positioned at `top: calc(12px + var(--safe-area-inset-top, 0px))`
- Center location button (Locate): positioned at `top: calc(120px + var(--safe-area-inset-top, 0px))`
- Weather button: positioned at `top: calc(320px + var(--safe-area-inset-top, 0px))`
- All buttons are 54px in size (from WeatherButton)

## Issues in Landscape
- The weather button at 320px top position gets cut off in landscape mode where vertical space is limited
- Buttons are relatively large (54px) which takes up significant vertical space
- The spacing between buttons is too large (108px between list view and center, 200px between center and weather)

## Solution Plan

### Todo Items
- [ ] Add media query for landscape orientation in WeatherButton.module.scss
- [ ] Add media query for landscape orientation in NewMap.tsx for the inline button styles
- [ ] Reduce button size in landscape mode (54px → 44px)
- [ ] Reduce top spacing in landscape mode to bring buttons closer together
- [ ] Test in both portrait and landscape modes to ensure all buttons are visible

## Implementation Details

### Changes to WeatherButton.module.scss
- Add landscape media query: `@media (orientation: landscape)`
- Reduce top position from 320px to something smaller (e.g., 160px)
- Reduce button size from 54px to 44px
- Reduce inner circle from 48px to 38px
- Reduce icon size from 28 to 24

### Changes to NewMap.tsx
- Add landscape-specific styles for list view button (reduce top from 12px to 8px)
- Add landscape-specific styles for center button (reduce top from 120px to 60px)
- Could potentially reduce button size, but Button component might need updating

## Review

### Changes Made

#### 1. WeatherButton.module.scss
Added landscape media query that:
- Reduced top position from `320px` to `160px`
- Reduced button size from `54px` to `44px`
- Reduced inner circle from `48px` to `38px`
- Reduced icon size from `28px` to `24px`

#### 2. App.scss
Added landscape media query for zoom control buttons (+/-):
- Moved top position from `160px` to `112px`
- Reduced button size from `48px` to `44px`
- Reduced margin-top from `6px` to `4px`

#### 3. NewMap.module.scss
Added landscape media query for center location button only:
- Moved top position from `120px` to `60px`
- Reduced button size from `48px` to `44px`
- Reduced icon size to `20px`
- **Note:** List view button was intentionally NOT changed to stay aligned with search input

### Final Button Positions in Landscape Mode (Final)
- List view button: `12px` (unchanged - aligned with search)
- Center location button: `60px` (40px size)
- Zoom controls (+/-): `104px` (40px size)
- Weather button: `196px` (40px size)

All buttons are now smaller (40px instead of 44px) with optimal spacing to prevent any overlap. The list view button remains unchanged to maintain alignment with the search input.

### Button Spacing
- List view → Center: 48px gap
- Center → Zoom controls: 44px gap
- Zoom controls → Weather: ~52px gap (accounting for two 40px zoom buttons with 3px margin)

### Fixes Applied
- Removed `font-size: 18px` from zoom controls to fix icon centering in regular mode
- Adjusted positions to prevent overlap between center button and parks link
- Adjusted weather button position to prevent overlap with zoom minus button
