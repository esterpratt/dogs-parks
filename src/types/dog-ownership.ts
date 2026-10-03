type DogOwnershipOutcome =
  | 'ACCEPTED'
  | 'ACTION_ALREADY_PENDING'
  | 'ALREADY_MEMBER'
  | 'APPROVED'
  | 'CANCELED'
  | 'CAPACITY_REACHED'
  | 'CREATED'
  | 'DECLINED'
  | 'DISCLOSURE_REQUIRED'
  | 'DOG_UNAVAILABLE'
  | 'EXPIRED'
  | 'FORBIDDEN'
  | 'INVALID_TARGET'
  | 'NOT_FOUND'
  | 'NOT_FRIENDS'
  | 'OK'
  | 'RATE_LIMITED'
  | 'STALE_VERSION'
  | 'UPGRADE_REQUIRED';

interface DogOwnershipResult {
  action_id?: string;
  outcome: DogOwnershipOutcome;
  retry_after?: string;
}

interface DogOwnershipCapabilities {
  active_owner_count?: number;
  can_invite?: boolean;
  can_request?: boolean;
  enabled: boolean;
  is_owner?: boolean;
  outcome: DogOwnershipOutcome;
  pending_action?: boolean;
  role?: 'PRIMARY_OWNER' | 'CO_OWNER' | null;
}

type DogOwnershipActionType = 'invite' | 'request';

export type {
  DogOwnershipActionType,
  DogOwnershipCapabilities,
  DogOwnershipOutcome,
  DogOwnershipResult,
};
