# Fix Weather Button Popup Click Outside

## Problem
The weather button popup doesn't close when clicking outside of it.

## Plan
- [x] Import the existing `useClickOutside` hook
- [x] Add a ref to the weather button wrapper element using `useRef`
- [x] Use the `useClickOutside` hook to close the popup when clicking outside

## Review

### Changes Made
1. Imported `useRef` from React and `useClickOutside` hook from hooks
2. Created a `wrapperRef` using `useRef<HTMLDivElement>(null)`
3. Added the `useClickOutside` hook with the wrapper ref and a handler that sets `open` to `false`
4. Attached the ref to the weather button wrapper div

The weather popup now closes when clicking anywhere outside of it, following the same pattern used in other components like NavbarBottom.
