import { Capacitor } from '@capacitor/core';
import { v4 as uuidv4 } from 'uuid';
import {
  DogOwnershipActionType,
  DogOwnershipCapabilities,
  DogDeletionProposal,
  DogOwnershipMember,
  DogOwnershipResult,
} from '../types/dog-ownership';
import { Json } from '../types/supabase';
import { supabase } from './supabase-client';

const SHARED_OWNERSHIP_CLIENT_BUILD = 1;
const ownershipOutcomes = new Set([
  'ACCEPTED',
  'APPLIED',
  'ACTION_ALREADY_PENDING',
  'ALREADY_MEMBER',
  'APPROVED',
  'CANCELED',
  'CAPACITY_REACHED',
  'CREATED',
  'DECLINED',
  'DELETION_PREPARED',
  'DISCLOSURE_REQUIRED',
  'DOG_UNAVAILABLE',
  'EXPIRED',
  'FORBIDDEN',
  'INVALID_TARGET',
  'LEFT',
  'NOT_FOUND',
  'NOT_FRIENDS',
  'NO_CHANGE',
  'OK',
  'RATE_LIMITED',
  'REJECTED',
  'STALE_VERSION',
  'UPGRADE_REQUIRED',
]);

const getClientCompatibility = () => {
  const platform = Capacitor.getPlatform().toUpperCase();
  return {
    p_client_build: SHARED_OWNERSHIP_CLIENT_BUILD,
    p_client_platform:
      platform === 'IOS' || platform === 'ANDROID' ? platform : 'WEB',
  } as const;
};

const parseOwnershipResult = (data: Json | null): DogOwnershipResult => {
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new Error('Ownership action returned no result');
  }
  const outcome = data.outcome;
  if (typeof outcome !== 'string' || !ownershipOutcomes.has(outcome)) {
    throw new Error('Ownership action returned an invalid outcome');
  }
  return {
    action_id: typeof data.action_id === 'string' ? data.action_id : undefined,
    outcome: outcome as DogOwnershipResult['outcome'],
    ownership_version:
      typeof data.ownership_version === 'number'
        ? data.ownership_version
        : undefined,
    proposal_id:
      typeof data.proposal_id === 'string' ? data.proposal_id : undefined,
    retry_after:
      typeof data.retry_after === 'string' ? data.retry_after : undefined,
    successor_user_id:
      typeof data.successor_user_id === 'string'
        ? data.successor_user_id
        : undefined,
    used_fallback:
      typeof data.used_fallback === 'boolean' ? data.used_fallback : undefined,
  };
};

const parseOwnershipCapabilities = (
  data: Json | null,
): DogOwnershipCapabilities => {
  const result = parseOwnershipResult(data);
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new Error('Ownership capabilities returned no result');
  }
  return {
    active_owner_count:
      typeof data.active_owner_count === 'number'
        ? data.active_owner_count
        : undefined,
    can_invite:
      typeof data.can_invite === 'boolean' ? data.can_invite : undefined,
    can_leave: typeof data.can_leave === 'boolean' ? data.can_leave : undefined,
    can_request:
      typeof data.can_request === 'boolean' ? data.can_request : undefined,
    can_transfer:
      typeof data.can_transfer === 'boolean' ? data.can_transfer : undefined,
    enabled: data.enabled === true,
    is_owner: typeof data.is_owner === 'boolean' ? data.is_owner : undefined,
    outcome: result.outcome,
    ownership_version:
      typeof data.ownership_version === 'number'
        ? data.ownership_version
        : undefined,
    pending_action:
      typeof data.pending_action === 'boolean'
        ? data.pending_action
        : undefined,
    role:
      data.role === 'PRIMARY_OWNER' || data.role === 'CO_OWNER'
        ? data.role
        : null,
  };
};

const unwrapOwnershipResult = (data: Json | null, error: Error | null) => {
  if (error) {
    throw error;
  }
  return parseOwnershipResult(data);
};

const fetchDogOwnershipCapabilities = async (dogId: string) => {
  const { data, error } = await supabase.rpc(
    'api_get_dog_ownership_capabilities',
    {
      ...getClientCompatibility(),
      p_dog_id: dogId,
    },
  );
  if (error) {
    throw error;
  }
  return parseOwnershipCapabilities(data);
};

const createDogInvite = async (
  dogId: string,
  inviteeUserId: string,
  idempotencyKey = uuidv4(),
) => {
  const { data, error } = await supabase.rpc('api_create_dog_invite', {
    ...getClientCompatibility(),
    p_dog_id: dogId,
    p_idempotency_key: idempotencyKey,
    p_invitee_user_id: inviteeUserId,
  });
  return unwrapOwnershipResult(data, error);
};

const cancelDogInvite = async (inviteId: string) => {
  const { data, error } = await supabase.rpc('api_cancel_dog_invite', {
    ...getClientCompatibility(),
    p_invite_id: inviteId,
  });
  return unwrapOwnershipResult(data, error);
};

const respondToDogInvite = async (
  inviteId: string,
  accept: boolean,
  disclosureAccepted: boolean,
) => {
  const { data, error } = await supabase.rpc('api_respond_dog_invite', {
    ...getClientCompatibility(),
    p_accept: accept,
    p_disclosure_accepted: disclosureAccepted,
    p_invite_id: inviteId,
  });
  return unwrapOwnershipResult(data, error);
};

const createDogOwnershipRequest = async (
  dogId: string,
  idempotencyKey = uuidv4(),
) => {
  const { data, error } = await supabase.rpc(
    'api_create_dog_ownership_request',
    {
      ...getClientCompatibility(),
      p_dog_id: dogId,
      p_idempotency_key: idempotencyKey,
    },
  );
  return unwrapOwnershipResult(data, error);
};

const cancelDogOwnershipRequest = async (requestId: string) => {
  const { data, error } = await supabase.rpc(
    'api_cancel_dog_ownership_request',
    {
      ...getClientCompatibility(),
      p_request_id: requestId,
    },
  );
  return unwrapOwnershipResult(data, error);
};

const respondToDogOwnershipRequest = async (
  requestId: string,
  approve: boolean,
) => {
  const { data, error } = await supabase.rpc(
    'api_respond_dog_ownership_request',
    {
      ...getClientCompatibility(),
      p_approve: approve,
      p_request_id: requestId,
    },
  );
  return unwrapOwnershipResult(data, error);
};

const fetchDogOwnershipMembers = async (
  dogId: string,
): Promise<DogOwnershipMember[]> => {
  const { data, error } = await supabase
    .from('dog_members')
    .select(
      'id,user_id,role,joined_at,user:users!dog_members_user_id_fkey(name)',
    )
    .eq('dog_id', dogId)
    .is('left_at', null)
    .order('joined_at');
  if (error) {
    throw error;
  }
  return data.map((member) => ({
    id: member.id,
    joined_at: member.joined_at,
    role: member.role as DogOwnershipMember['role'],
    user_id: member.user_id!,
    user_name: member.user[0]?.name ?? null,
  }));
};

const fetchPendingPrimaryTransfers = async (dogId: string) => {
  const { data, error } = await supabase
    .from('dog_primary_transfers')
    .select('id,to_member_id,status,created_at,expires_at')
    .eq('dog_id', dogId)
    .eq('status', 'PENDING')
    .order('created_at');
  if (error) {
    throw error;
  }
  return data;
};

const createPrimaryTransfer = async (
  dogId: string,
  toMemberId: string,
  idempotencyKey = uuidv4(),
) => {
  const { data, error } = await supabase.rpc('api_create_primary_transfer', {
    ...getClientCompatibility(),
    p_dog_id: dogId,
    p_idempotency_key: idempotencyKey,
    p_to_member_id: toMemberId,
  });
  return unwrapOwnershipResult(data, error);
};

const cancelPrimaryTransfer = async (transferId: string) => {
  const { data, error } = await supabase.rpc('api_cancel_primary_transfer', {
    ...getClientCompatibility(),
    p_transfer_id: transferId,
  });
  return unwrapOwnershipResult(data, error);
};

const respondToPrimaryTransfer = async (
  transferId: string,
  accept: boolean,
) => {
  const { data, error } = await supabase.rpc('api_respond_primary_transfer', {
    ...getClientCompatibility(),
    p_accept: accept,
    p_transfer_id: transferId,
  });
  return unwrapOwnershipResult(data, error);
};

const fetchDogDeletionProposal = async (
  dogId?: string,
  proposalId?: string,
): Promise<DogDeletionProposal | null> => {
  if (!dogId && proposalId) {
    // Notification deep links resolve through a capability-gated RPC because
    // the notification target intentionally contains only the proposal ID.
    const { data, error } = await supabase.rpc(
      'api_get_dog_deletion_proposal',
      {
        ...getClientCompatibility(),
        p_proposal_id: proposalId,
      },
    );
    if (error) {
      throw error;
    }
    if (
      !data ||
      Array.isArray(data) ||
      typeof data !== 'object' ||
      'outcome' in data
    ) {
      return null;
    }
    return data as unknown as DogDeletionProposal;
  }
  if (!dogId) {
    return null;
  }
  // Owner-page reads also use a lifecycle RPC so exact expiry is persisted by
  // the server rather than inferred from the client clock.
  const { data: proposal, error } = await supabase.rpc(
    'api_get_current_dog_deletion_proposal',
    {
      ...getClientCompatibility(),
      p_dog_id: dogId,
    },
  );
  if (error) {
    throw error;
  }
  if (
    !proposal ||
    Array.isArray(proposal) ||
    typeof proposal !== 'object' ||
    'outcome' in proposal
  ) {
    return null;
  }
  return proposal as unknown as DogDeletionProposal;
};

const proposeDogDeletion = async (dogId: string, idempotencyKey = uuidv4()) => {
  const { data, error } = await supabase.rpc('api_propose_dog_deletion', {
    ...getClientCompatibility(),
    p_dog_id: dogId,
    p_idempotency_key: idempotencyKey,
  });
  return unwrapOwnershipResult(data, error);
};

const respondToDogDeletion = async (proposalId: string, approve: boolean) => {
  const { data, error } = await supabase.rpc('api_respond_dog_deletion', {
    ...getClientCompatibility(),
    p_approve: approve,
    p_proposal_id: proposalId,
  });
  return unwrapOwnershipResult(data, error);
};

const withdrawDogDeletionApproval = async (proposalId: string) => {
  const { data, error } = await supabase.rpc('api_withdraw_dog_deletion', {
    ...getClientCompatibility(),
    p_proposal_id: proposalId,
  });
  return unwrapOwnershipResult(data, error);
};

const cancelDogDeletion = async (proposalId: string) => {
  const { data, error } = await supabase.rpc('api_cancel_dog_deletion', {
    ...getClientCompatibility(),
    p_proposal_id: proposalId,
  });
  return unwrapOwnershipResult(data, error);
};

const leaveDogOwnership = async (
  dogId: string,
  expectedOwnershipVersion: number,
  selectedSuccessorMemberId: string | null,
) => {
  const { data, error } = await supabase.rpc('api_leave_dog', {
    ...getClientCompatibility(),
    p_dog_id: dogId,
    p_expected_ownership_version: expectedOwnershipVersion,
    p_selected_successor_member_id: selectedSuccessorMemberId,
  });
  return unwrapOwnershipResult(data, error);
};

// Participant RLS also governs declined history; the UI limits administration to the primary owner.
const fetchDogInvites = async (dogId: string) => {
  const { data, error } = await supabase
    .from('dog_invites')
    .select('id,invitee_user_id,status,created_at,expires_at')
    .eq('dog_id', dogId)
    .in('status', ['PENDING', 'DECLINED'])
    .order('created_at');
  if (error) {
    throw error;
  }
  return data;
};

const fetchPendingDogOwnershipRequests = async (dogId: string) => {
  const { data, error } = await supabase
    .from('dog_ownership_requests')
    .select('id,requester_user_id,status,created_at,expires_at')
    .eq('dog_id', dogId)
    .eq('status', 'PENDING')
    .order('created_at');
  if (error) {
    throw error;
  }
  return data;
};

const fetchDogOwnershipAction = async (
  actionType: DogOwnershipActionType,
  actionId: string,
) => {
  if (actionType === 'invite') {
    const { data, error } = await supabase
      .from('dog_invites')
      .select(
        'id,dog_id,status,expires_at,invitee_user_id,primary_user_id_at_creation',
      )
      .eq('id', actionId)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  }

  if (actionType === 'transfer') {
    const { data, error } = await supabase
      .from('dog_primary_transfers')
      .select('id,dog_id,status,expires_at,to_member_id')
      .eq('id', actionId)
      .maybeSingle();
    if (error || !data) {
      if (error) {
        throw error;
      }
      return null;
    }
    const { data: targetMember, error: targetError } = await supabase
      .from('dog_members')
      .select('user_id')
      .eq('id', data.to_member_id!)
      .maybeSingle();
    if (targetError) {
      throw targetError;
    }
    return { ...data, to_user_id: targetMember?.user_id ?? null };
  }

  const { data, error } = await supabase
    .from('dog_ownership_requests')
    .select(
      'id,dog_id,status,expires_at,requester_user_id,primary_user_id_at_creation',
    )
    .eq('id', actionId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
};

export {
  cancelDogDeletion,
  cancelDogInvite,
  cancelDogOwnershipRequest,
  cancelPrimaryTransfer,
  createDogInvite,
  createDogOwnershipRequest,
  createPrimaryTransfer,
  fetchDogDeletionProposal,
  fetchDogOwnershipAction,
  fetchDogOwnershipCapabilities,
  fetchDogOwnershipMembers,
  fetchDogInvites,
  fetchPendingDogOwnershipRequests,
  fetchPendingPrimaryTransfers,
  getClientCompatibility,
  leaveDogOwnership,
  proposeDogDeletion,
  respondToDogInvite,
  respondToDogOwnershipRequest,
  respondToPrimaryTransfer,
  respondToDogDeletion,
  withdrawDogDeletionApproval,
};
