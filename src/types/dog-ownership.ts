import type { Dog } from './dog';
import type { User } from './user';

type DogOwnershipOutcome =
  | 'APPLIED'
  | 'ACCEPTED'
  | 'ACTION_ALREADY_PENDING'
  | 'ALREADY_MEMBER'
  | 'APPROVED'
  | 'CANCELED'
  | 'CAPACITY_REACHED'
  | 'CREATED'
  | 'DECLINED'
  | 'DELETION_PREPARED'
  | 'DISCLOSURE_REQUIRED'
  | 'DOG_UNAVAILABLE'
  | 'EXPIRED'
  | 'FORBIDDEN'
  | 'INVALID_TARGET'
  | 'LEFT'
  | 'NOT_FOUND'
  | 'NOT_FRIENDS'
  | 'NO_CHANGE'
  | 'OK'
  | 'RATE_LIMITED'
  | 'REJECTED'
  | 'STALE_VERSION'
  | 'UPGRADE_REQUIRED';

interface DogOwnershipResult {
  action_id?: string;
  outcome: DogOwnershipOutcome;
  ownership_version?: number;
  proposal_id?: string;
  retry_after?: string;
  successor_user_id?: string;
  used_fallback?: boolean;
}

interface DogOwnershipCapabilities {
  active_owner_count?: number;
  can_invite?: boolean;
  can_leave?: boolean;
  can_request?: boolean;
  can_transfer?: boolean;
  enabled: boolean;
  is_owner?: boolean;
  outcome: DogOwnershipOutcome;
  ownership_version?: number;
  pending_action?: boolean;
  role?: 'PRIMARY_OWNER' | 'CO_OWNER' | null;
}

interface DogDeletionConsent {
  decision: 'APPROVED' | 'REJECTED';
  member_id: string;
}

interface DogDeletionProposal {
  approved_consent_count: number;
  consents: DogDeletionConsent[];
  dog_id: string;
  expires_at: string;
  id: string;
  required_consent_count: number;
  status: 'PENDING' | 'REJECTED' | 'CANCELED' | 'EXPIRED' | 'COMPLETED';
}

interface DogOwnershipMember {
  id: string;
  joined_at: string;
  role: 'PRIMARY_OWNER' | 'CO_OWNER';
  user_id: string;
  user_name: string | null;
}

interface DogPageData {
  capabilities: DogOwnershipCapabilities;
  dog: Dog;
  members?: DogOwnershipMember[];
  outcome: 'OK';
  profile_user: Pick<User, 'id' | 'name'>;
  viewer: {
    can_edit: boolean;
    is_owner: boolean;
    role: 'PRIMARY_OWNER' | 'CO_OWNER' | null;
  };
}

interface UserDogAssociation {
  dog: Dog;
  profile_user_id: string;
}

type DogOwnershipActionType = 'invite' | 'request' | 'transfer';

export type {
  DogOwnershipActionType,
  DogOwnershipCapabilities,
  DogDeletionProposal,
  DogPageData,
  DogOwnershipMember,
  DogOwnershipOutcome,
  DogOwnershipResult,
  UserDogAssociation,
};
