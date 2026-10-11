# Person-first user card

Design agreed on 2026-10-11. Implementation is deferred; this document records the scope for a later task.

Shared dogs can appear on several people's cards. Make the person the primary identity while preserving the familiar dog photo and existing card layout.

## Agreed design

- Show the person's name as the main title.
- Keep the first dog's photo and the current dog-placeholder fallback. Do not add a user icon or personal-avatar feature.
- Show dog names as secondary text, prefixed with “Human of”: for example, “Human of Luna, Milo”. Omit this line when the person has no dogs.
- Keep the existing card measurements, spacing, image dimensions, navigation, login gating and friendship actions.
- Preserve existing privacy/discoverability rules. Do not expose other owners or distinguish primary owners from co-owners on these cards.

## Implementation scope

- Update the shared `src/components/users/UserPreview.tsx` and its styles so the person's name takes the current title position and the dog information takes the secondary position.
- Add natural English, Hebrew and Arabic translations for “Human of {{dogNames}}”, including correct RTL rendering.
- Apply consistently wherever `UserPreview` is used: user search, friends, incoming/outgoing friend requests and friends at a park.
- Leave `DogPreview` and dog cards unchanged. No database changes are needed.

## Verification when implemented

- Check one dog, several dogs, no dogs, missing dog photo and long person/dog names at mobile widths in LTR and RTL. Preserve the card dimensions and constrain long text within the existing layout.
- Verify profile navigation, anonymous login gating and friend-request actions still behave as before.
- Run relevant existing tests, `npm run lint`, `npm run build` and `git diff --check`.
