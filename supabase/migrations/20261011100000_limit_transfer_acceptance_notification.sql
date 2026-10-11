-- Acceptance is reported only to the owner who offered the transfer.
-- Preserve the existing participant checks, row locks and function grants.
create or replace function public.api_respond_primary_transfer(
  p_transfer_id uuid,
  p_accept boolean,
  p_client_platform public.app_platform,
  p_client_build integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_dog public.dogs%rowtype;
  v_feature_outcome text;
  v_from_member public.dog_members%rowtype;
  v_to_member public.dog_members%rowtype;
  v_transfer public.dog_primary_transfers%rowtype;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(p_client_platform, p_client_build);
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;

  select * into v_transfer from public.dog_primary_transfers where id = p_transfer_id;
  if not found then
    return jsonb_build_object('outcome', 'NOT_FOUND');
  end if;
  select * into v_dog
  from public.dogs
  where id = v_transfer.dog_id and lifecycle_state = 'ACTIVE' and deleted_at is null
  for update;
  if not found then
    return jsonb_build_object('outcome', 'DOG_UNAVAILABLE');
  end if;
  select * into v_transfer from public.dog_primary_transfers where id = p_transfer_id for update;
  select * into v_from_member from public.dog_members where id = v_transfer.from_member_id;
  select * into v_to_member from public.dog_members where id = v_transfer.to_member_id;
  if v_to_member.user_id is distinct from auth.uid() then
    return jsonb_build_object('outcome', 'FORBIDDEN');
  end if;
  if v_transfer.status <> 'PENDING' then
    if (v_transfer.status = 'ACCEPTED' and not p_accept)
      or (v_transfer.status = 'DECLINED' and p_accept) then
      return jsonb_build_object(
        'action_id', v_transfer.id,
        'outcome', 'STALE_VERSION',
        'ownership_version', v_dog.ownership_version,
        'status', v_transfer.status
      );
    end if;
    if v_transfer.status = 'CANCELED'
      and v_dog.ownership_version <> v_transfer.ownership_version_at_creation then
      return jsonb_build_object(
        'action_id', v_transfer.id,
        'outcome', 'STALE_VERSION',
        'ownership_version', v_dog.ownership_version,
        'status', v_transfer.status
      );
    end if;
    return jsonb_build_object(
      'action_id', v_transfer.id,
      'outcome', v_transfer.status,
      'ownership_version', v_dog.ownership_version,
      'status', v_transfer.status
    );
  end if;
  if v_dog.ownership_version <> v_transfer.ownership_version_at_creation then
    return jsonb_build_object(
      'action_id', v_transfer.id,
      'outcome', 'STALE_VERSION',
      'ownership_version', v_dog.ownership_version,
      'status', v_transfer.status
    );
  end if;

  perform public.expire_primary_transfers(v_transfer.dog_id);
  select * into v_transfer from public.dog_primary_transfers where id = p_transfer_id;
  if v_transfer.status <> 'PENDING' then
    return jsonb_build_object(
      'action_id', v_transfer.id,
      'outcome', v_transfer.status,
      'ownership_version', v_dog.ownership_version,
      'status', v_transfer.status
    );
  end if;
  if not p_accept then
    update public.dog_primary_transfers set status = 'DECLINED', responded_at = now()
    where id = p_transfer_id;
    perform public.insert_dog_ownership_notification(
      v_from_member.user_id, auth.uid(), 'dog_primary_transfer_declined',
      v_transfer.id, v_transfer.dog_id
    );
    perform public.record_dog_ownership_audit(
      v_transfer.dog_id, v_to_member.id, 'PRIMARY_TRANSFER_DECLINED',
      v_dog.ownership_version, jsonb_build_object('transfer_id', v_transfer.id)
    );
    return jsonb_build_object('action_id', v_transfer.id, 'outcome', 'DECLINED', 'status', 'DECLINED');
  end if;
  if v_from_member.left_at is not null
    or v_from_member.role <> 'PRIMARY_OWNER'
    or v_from_member.user_id is distinct from v_dog.owner
    or v_to_member.left_at is not null
    or v_to_member.role <> 'CO_OWNER' then
    return jsonb_build_object('action_id', v_transfer.id, 'outcome', 'STALE_VERSION');
  end if;

  update public.dog_primary_transfers set status = 'ACCEPTED', responded_at = now()
  where id = p_transfer_id;
  update public.dog_members set role = 'CO_OWNER' where id = v_from_member.id;
  update public.dog_members set role = 'PRIMARY_OWNER' where id = v_to_member.id;
  perform public.cancel_pending_primary_transfers(
    v_transfer.dog_id, 'PRIMARY_CHANGED', auth.uid(), v_transfer.id
  );
  update public.dogs
  set owner = v_to_member.user_id,
      ownership_version = ownership_version + 1
  where id = v_transfer.dog_id;

  perform public.insert_dog_ownership_notification(
    v_from_member.user_id, auth.uid(), 'dog_primary_transfer_accepted',
    v_transfer.id, v_transfer.dog_id
  );
  perform public.record_dog_ownership_audit(
    v_transfer.dog_id, v_to_member.id, 'PRIMARY_TRANSFER_ACCEPTED',
    v_dog.ownership_version + 1,
    jsonb_build_object('transfer_id', v_transfer.id, 'from_member_id', v_from_member.id)
  );
  return jsonb_build_object(
    'action_id', v_transfer.id,
    'outcome', 'ACCEPTED',
    'ownership_version', v_dog.ownership_version + 1,
    'status', 'ACCEPTED'
  );
end;
$$;
