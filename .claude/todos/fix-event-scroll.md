# Fix Event Page Scroll Issue

## Problem
The fixed `.actions` button container is inside the scrollable content, causing scroll issues in landscape mode.

## Solution (Revised)
Move the scroll layout responsibility into EventDetails component while keeping queries colocated with their usage in OrganizerEvent and InvitedEvent.

## Todo Items

- [x] Move scrollable-content and actions styles from Event.module.scss to EventDetails.module.scss
- [x] Update EventDetails to accept eventActions prop and handle scroll layout
- [x] Restore InvitedEvent to fetch invitee data and pass actions to EventDetails
- [x] Restore OrganizerEvent to pass actions to EventDetails
- [x] Simplify Event.tsx back to original structure

## Review

### Final Architecture

The solution maintains the original separation of concerns:

**Event.tsx** - Simple router component
- Fetches shared data (event, park, parkImage)
- Determines user role (organizer vs invitee)
- Delegates to appropriate variant component

**OrganizerEvent / InvitedEvent** - Role-specific components
- Each fetches their own role-specific queries
- OrganizerEvent: fetches friends data
- InvitedEvent: fetches friends data AND invitee status
- Each passes eventActions to EventDetails

**EventDetails** - Layout component
- Handles the scroll layout structure
- `.scrollable-content` wraps header + body
- `.actions` renders as fixed element (outside scroll container)
- Solves the scroll problem by design

### Changes Made

1. **EventDetails.module.scss** - Now owns all layout styles:
   - `.scrollable-content` - Scrollable container with proper padding-bottom (80px portrait, 58px landscape)
   - `.actions` - Fixed positioning at bottom of viewport
   - `.body-container` - Content padding unchanged

2. **EventDetails.tsx** - Layout responsibility:
   - Accepts `eventActions` prop
   - Wraps header + body in `.scrollable-content`
   - Renders actions in fixed `.actions` container
   - Creates proper hierarchy: scrollable content + fixed actions

3. **Event.module.scss** - Cleaned up:
   - Removed `.scrollable-content` and `.actions` styles (moved to EventDetails)
   - Only retains page-level container styles

4. **Event.tsx** - Simplified back to original:
   - Removed `fetchInvitee` query (moved back to InvitedEvent)
   - Removed action component imports
   - Removed `isEventEnded` calculation (moved to child components)
   - Just renders OrganizerEvent or InvitedEvent

5. **OrganizerEvent.tsx** - Restored actions:
   - Added `OrganizerActions` import
   - Passes `eventActions` prop to EventDetails
   - Queries stay colocated with component

6. **InvitedEvent.tsx** - Restored invitee query and actions:
   - Added `fetchInvitee` query (back from Event.tsx)
   - Added `InviteeActions` import
   - Restored dynamic title based on `inviteeStatus`
   - Passes `eventActions` prop to EventDetails
   - All invitee-related logic is now colocated

### Why This Is Better

**Maintains Original Design Principles:**
- ✅ Queries are colocated with their usage (invitee query in InvitedEvent, not Event.tsx)
- ✅ Separation of concerns (Event = routing, variants = logic, EventDetails = layout)
- ✅ No unnecessary query execution (invitee query only runs for invitees)

**Solves the Scroll Problem:**
- ✅ Fixed actions are outside the scrollable container
- ✅ Padding-bottom accounts for fixed action height in both orientations
- ✅ Works correctly in landscape mode

**Clean Component Hierarchy:**
```
Event.tsx (routing)
  → OrganizerEvent (organizer logic + queries)
    → EventDetails (layout)
      → .scrollable-content (header + body)
      → .actions (fixed, outside scroll)
  OR
  → InvitedEvent (invitee logic + queries)
    → EventDetails (layout)
      → .scrollable-content (header + body)
      → .actions (fixed, outside scroll)
```
