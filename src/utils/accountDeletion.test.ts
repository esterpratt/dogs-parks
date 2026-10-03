import { describe, expect, it } from 'vitest';
import type { DogPageData } from '../types/dog-ownership';
import {
  buildAccountDeletionReview,
  getSuccessorSelections,
} from './accountDeletion';

const currentUserId = '00000000-0000-0000-0000-000000000001';

const createDogPage = (
  dogId: string,
  name: string,
  role: 'PRIMARY_OWNER' | 'CO_OWNER',
  members: DogPageData['members']
): DogPageData => ({
  capabilities: { enabled: false, outcome: 'UPGRADE_REQUIRED' },
  dog: { id: dogId, name, owner: currentUserId },
  members,
  outcome: 'OK',
  profile_user: { id: currentUserId, name: 'Current user' },
  viewer: { can_edit: false, is_owner: true, role },
});

describe('account deletion review', () => {
  it('classifies solo, shared-primary, and shared-co-owner effects', () => {
    const sharedPrimary = createDogPage(
      'dog-shared-primary',
      'Milo',
      'PRIMARY_OWNER',
      [
        {
          id: 'member-current-primary',
          joined_at: '2026-01-01T00:00:00.000Z',
          role: 'PRIMARY_OWNER',
          user_id: currentUserId,
          user_name: 'Current user',
        },
        {
          id: 'member-oldest-co-owner',
          joined_at: '2026-02-01T00:00:00.000Z',
          role: 'CO_OWNER',
          user_id: '00000000-0000-0000-0000-000000000002',
          user_name: 'Oldest co-owner',
        },
        {
          id: 'member-newest-co-owner',
          joined_at: '2026-03-01T00:00:00.000Z',
          role: 'CO_OWNER',
          user_id: '00000000-0000-0000-0000-000000000003',
          user_name: 'Newest co-owner',
        },
      ]
    );
    const review = buildAccountDeletionReview(
      [
        createDogPage('dog-solo', 'Solo', 'PRIMARY_OWNER', [
          {
            id: 'member-solo',
            joined_at: '2026-01-01T00:00:00.000Z',
            role: 'PRIMARY_OWNER',
            user_id: currentUserId,
            user_name: 'Current user',
          },
        ]),
        sharedPrimary,
        createDogPage('dog-shared-co-owner', 'Luna', 'CO_OWNER', [
          ...(sharedPrimary.members ?? []),
          {
            id: 'member-current-co-owner',
            joined_at: '2026-04-01T00:00:00.000Z',
            role: 'CO_OWNER',
            user_id: currentUserId,
            user_name: 'Current user',
          },
        ]),
      ],
      currentUserId
    );

    expect(review.map(({ effect }) => effect)).toEqual([
      'DELETE_SOLO_DOG',
      'TRANSFER_SHARED_DOG',
      'LEAVE_SHARED_DOG',
    ]);
    expect(review[1].selectedSuccessorMemberId).toBe('member-oldest-co-owner');
  });

  it('submits successor selections only for shared dogs led by the user', () => {
    const review = buildAccountDeletionReview(
      [
        createDogPage('dog-solo', 'Solo', 'PRIMARY_OWNER', []),
        createDogPage('dog-shared', 'Milo', 'PRIMARY_OWNER', [
          {
            id: 'member-current',
            joined_at: '2026-01-01T00:00:00.000Z',
            role: 'PRIMARY_OWNER',
            user_id: currentUserId,
            user_name: 'Current user',
          },
          {
            id: 'member-successor',
            joined_at: '2026-02-01T00:00:00.000Z',
            role: 'CO_OWNER',
            user_id: '00000000-0000-0000-0000-000000000002',
            user_name: 'Successor',
          },
        ]),
      ],
      currentUserId
    );

    expect(getSuccessorSelections(review)).toEqual({
      'dog-shared': 'member-successor',
    });
  });
});
