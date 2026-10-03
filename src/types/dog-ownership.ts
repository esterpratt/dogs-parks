type DogOwnershipOutcome =
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
  | 'OK'
  | 'RATE_LIMITED'
  | 'STALE_VERSION'
  | 'UPGRADE_REQUIRED';

interface DogOwnershipResult {
  action_id?: string;
  outcome: DogOwnershipOutcome;
  ownership_version?: number;
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

interface DogOwnershipMember {
  id: string;
  joined_at: string;
  role: 'PRIMARY_OWNER' | 'CO_OWNER';
  user_id: string;
  user_name: string | null;
}

type DogOwnershipActionType = 'invite' | 'request' | 'transfer';

export type {
  DogOwnershipActionType,
  DogOwnershipCapabilities,
  DogOwnershipMember,
  DogOwnershipOutcome,
  DogOwnershipResult,
};
