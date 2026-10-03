import { Capacitor } from '@capacitor/core';
import { v4 as uuidv4 } from 'uuid';
import {
  DogOwnershipActionType,
  DogOwnershipCapabilities,
  DogOwnershipResult,
} from '../types/dog-ownership';
import { Json } from '../types/supabase';
import { supabase } from './supabase-client';

const SHARED_OWNERSHIP_CLIENT_BUILD = 1;
const ownershipOutcomes = new Set([
  'ACCEPTED',
  'ACTION_ALREADY_PENDING',
  'ALREADY_MEMBER',
  'APPROVED',
  'CANCELED',
  'CAPACITY_REACHED',
  'CREATED',
  'DECLINED',
  'DISCLOSURE_REQUIRED',
  'DOG_UNAVAILABLE',
  'EXPIRED',
  'FORBIDDEN',
  'INVALID_TARGET',
  'NOT_FOUND',
  'NOT_FRIENDS',
  'OK',
  'RATE_LIMITED',
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
    retry_after:
      typeof data.retry_after === 'string' ? data.retry_after : undefined,
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
    can_request:
      typeof data.can_request === 'boolean' ? data.can_request : undefined,
    enabled: data.enabled === true,
    is_owner: typeof data.is_owner === 'boolean' ? data.is_owner : undefined,
    outcome: result.outcome,
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

const fetchPendingDogInvites = async (dogId: string) => {
  const { data, error } = await supabase
    .from('dog_invites')
    .select('id,invitee_user_id,status,created_at,expires_at')
    .eq('dog_id', dogId)
    .eq('status', 'PENDING')
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
  cancelDogInvite,
  cancelDogOwnershipRequest,
  createDogInvite,
  createDogOwnershipRequest,
  fetchDogOwnershipAction,
  fetchDogOwnershipCapabilities,
  fetchPendingDogInvites,
  fetchPendingDogOwnershipRequests,
  respondToDogInvite,
  respondToDogOwnershipRequest,
};
