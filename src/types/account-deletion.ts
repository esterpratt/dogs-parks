import type { DogOwnershipMember } from './dog-ownership';

type AccountDeletionEffect =
  | 'DELETE_SOLO_DOG'
  | 'LEAVE_SHARED_DOG'
  | 'TRANSFER_SHARED_DOG';

interface AccountDeletionReviewItem {
  dogId: string;
  dogName: string;
  effect: AccountDeletionEffect;
  eligibleSuccessors: DogOwnershipMember[];
  selectedSuccessorMemberId: string | null;
}

interface AccountDeletionResult {
  outcome: 'DELETED' | 'DELETED_WITH_CLEANUP_PENDING';
  recoveryReference?: string;
}

export type {
  AccountDeletionEffect,
  AccountDeletionResult,
  AccountDeletionReviewItem,
};
