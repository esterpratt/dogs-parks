-- Add ordinary primary transfer, departure succession, and atomic account
-- erasure preparation while all shared-ownership compatibility rows stay off.

create table public.dog_primary_transfers (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  from_member_id uuid references public.dog_members(id) on delete set null,
  to_member_id uuid references public.dog_members(id) on delete set null,
  ownership_version_at_creation bigint not null,
  idempotency_key uuid not null,
  status public.dog_invite_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  responded_at timestamptz,
  cancellation_reason public.dog_action_cancellation_reason,
  constraint dog_primary_transfers_distinct_members
    check (from_member_id is distinct from to_member_id),
  constraint dog_primary_transfers_fixed_expiry
    check (expires_at = created_at + interval '30 days'),
  constraint dog_primary_transfers_response_consistent
    check (
      (status = 'PENDING' and responded_at is null and cancellation_reason is null)
      or (status in ('ACCEPTED', 'DECLINED', 'EXPIRED') and responded_at is not null)
      or (status = 'CANCELED' and responded_at is not null and cancellation_reason is not null)
    )
);

create unique index dog_primary_transfers_actor_idempotency_unique
on public.dog_primary_transfers (from_member_id, idempotency_key);

create unique index dog_primary_transfers_one_pending_per_dog
on public.dog_primary_transfers (dog_id)
where status = 'PENDING';

create index dog_primary_transfers_pending_expiry_idx
on public.dog_primary_transfers (expires_at)
where status = 'PENDING';

alter table public.dog_primary_transfers enable row level security;

create policy dog_primary_transfers_select_owners_and_parties
on public.dog_primary_transfers
for select
to authenticated
using (
  exists (
    select 1
    from public.dog_members as caller_member
    where caller_member.dog_id = dog_primary_transfers.dog_id
      and caller_member.user_id = auth.uid()
      and caller_member.left_at is null
  )
  or exists (
    select 1
    from public.dog_members as party_member
    where party_member.id in (
      dog_primary_transfers.from_member_id,
      dog_primary_transfers.to_member_id
    )
      and party_member.user_id = auth.uid()
  )
);

revoke all on table public.dog_primary_transfers from public, anon, authenticated;
grant select on table public.dog_primary_transfers to authenticated;
grant all on table public.dog_primary_transfers to service_role;

create table public.dog_ownership_audit (
  id bigserial primary key,
  dog_id uuid,
  actor_member_id uuid references public.dog_members(id) on delete set null,
  event public.dog_ownership_audit_event not null,
  ownership_version bigint not null,
  occurred_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  constraint dog_ownership_audit_bounded_details
    check (jsonb_typeof(details) = 'object')
);

alter table public.dog_ownership_audit enable row level security;
revoke all on table public.dog_ownership_audit from public, anon, authenticated;
revoke all on sequence public.dog_ownership_audit_id_seq from public, anon, authenticated;
grant all on table public.dog_ownership_audit to service_role;
grant all on sequence public.dog_ownership_audit_id_seq to service_role;

-- Account erasure now owns the complete compatibility-owner transition, so the
-- profile cascade must wait until every affected dog is prepared successfully.
alter table public.dogs drop constraint dogs_owner_fkey;
alter table public.dogs
  add constraint dogs_owner_fkey
  foreign key (owner) references public.users(id) on delete restrict;

create unique index storage_jobs_pending_dog_delete_unique
on private.storage_jobs (dog_id, operation)
where operation = 'DELETE_DOG_ASSETS' and state <> 'COMPLETED';

create or replace function public.insert_dog_information_notification(
  p_receiver_id uuid,
  p_sender_id uuid,
  p_type public.notification_type,
  p_dog_id uuid,
  p_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_receiver_id is not null then
    insert into public.notifications (
      receiver_id, sender_id, type, target_type, target_id, data, is_ready
    ) values (
      p_receiver_id,
      p_sender_id,
      p_type,
      'DOG',
      p_dog_id,
      jsonb_build_object('dog_id', p_dog_id) || coalesce(p_data, '{}'::jsonb),
      false
    );
  end if;
end;
$$;

create or replace function public.expire_primary_transfers(p_dog_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.dog_primary_transfers
  set status = 'EXPIRED',
      responded_at = expires_at
  where dog_id = p_dog_id
    and status = 'PENDING'
    and expires_at <= now();
end;
$$;

create or replace function public.cancel_pending_primary_transfers(
  p_dog_id uuid,
  p_reason public.dog_action_cancellation_reason,
  p_actor_user_id uuid,
  p_except_transfer_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_transfer record;
begin
  perform public.expire_primary_transfers(p_dog_id);

  for v_transfer in
    select transfer.id,
           from_member.user_id as from_user_id,
           to_member.user_id as to_user_id
    from public.dog_primary_transfers as transfer
    left join public.dog_members as from_member on from_member.id = transfer.from_member_id
    left join public.dog_members as to_member on to_member.id = transfer.to_member_id
    where transfer.dog_id = p_dog_id
      and transfer.status = 'PENDING'
      and transfer.id is distinct from p_except_transfer_id
    for update of transfer
  loop
    update public.dog_primary_transfers
    set status = 'CANCELED',
        responded_at = now(),
        cancellation_reason = p_reason
    where id = v_transfer.id;

    perform public.insert_dog_ownership_notification(
      v_transfer.to_user_id,
      p_actor_user_id,
      'dog_primary_transfer_canceled',
      v_transfer.id,
      p_dog_id
    );
  end loop;
end;
$$;

create or replace function public.record_dog_ownership_audit(
  p_dog_id uuid,
  p_actor_member_id uuid,
  p_event public.dog_ownership_audit_event,
  p_ownership_version bigint,
  p_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.dog_ownership_audit (
    dog_id, actor_member_id, event, ownership_version, details
  ) values (
    p_dog_id,
    p_actor_member_id,
    p_event,
    p_ownership_version,
    coalesce(p_details, '{}'::jsonb)
  );
$$;

revoke all on function public.insert_dog_information_notification(
  uuid, uuid, public.notification_type, uuid, jsonb
) from public, anon, authenticated;
revoke all on function public.expire_primary_transfers(uuid)
  from public, anon, authenticated;
revoke all on function public.cancel_pending_primary_transfers(
  uuid, public.dog_action_cancellation_reason, uuid, uuid
) from public, anon, authenticated;
revoke all on function public.record_dog_ownership_audit(
  uuid, uuid, public.dog_ownership_audit_event, bigint, jsonb
) from public, anon, authenticated;

-- Defensive triggers keep transfer state deterministic even when a trusted
-- migration or account cascade performs the underlying lifecycle update.
create or replace function public.cancel_primary_transfer_after_member_departure()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.left_at is null
    and new.left_at is not null
    and exists (
      select 1
      from public.dog_primary_transfers as transfer
      where transfer.dog_id = new.dog_id
        and transfer.status = 'PENDING'
        and new.id in (transfer.from_member_id, transfer.to_member_id)
    ) then
    perform public.cancel_pending_primary_transfers(
      new.dog_id,
      (case
        when new.departure_reason = 'ACCOUNT_ERASED' then 'ACCOUNT_ERASURE'
        else 'MEMBER_DEPARTED'
      end)::public.dog_action_cancellation_reason,
      new.user_id
    );
  end if;
  return new;
end;
$$;

create trigger cancel_primary_transfer_after_member_departure_trigger
after update of left_at on public.dog_members
for each row execute function public.cancel_primary_transfer_after_member_departure();

create or replace function public.cancel_primary_transfer_after_primary_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.owner is distinct from old.owner then
    perform public.cancel_pending_primary_transfers(
      new.id,
      'PRIMARY_CHANGED',
      old.owner
    );
  end if;
  return new;
end;
$$;

create trigger cancel_primary_transfer_after_primary_change_trigger
after update of owner on public.dogs
for each row execute function public.cancel_primary_transfer_after_primary_change();

revoke all on function public.cancel_primary_transfer_after_member_departure()
  from public, anon, authenticated;
revoke all on function public.cancel_primary_transfer_after_primary_change()
  from public, anon, authenticated;

create or replace function public.api_create_primary_transfer(
  p_dog_id uuid,
  p_to_member_id uuid,
  p_idempotency_key uuid,
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
  v_existing public.dog_primary_transfers%rowtype;
  v_feature_outcome text;
  v_from_member public.dog_members%rowtype;
  v_to_member public.dog_members%rowtype;
  v_transfer public.dog_primary_transfers%rowtype;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(p_client_platform, p_client_build);
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;

  select transfer.* into v_existing
  from public.dog_primary_transfers as transfer
  join public.dog_members as source_member on source_member.id = transfer.from_member_id
  where source_member.user_id = auth.uid()
    and transfer.idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'action_id', v_existing.id,
      'expires_at', v_existing.expires_at,
      'outcome', 'CREATED',
      'ownership_version', v_existing.ownership_version_at_creation,
      'status', v_existing.status
    );
  end if;

  select * into v_dog
  from public.dogs
  where id = p_dog_id and lifecycle_state = 'ACTIVE' and deleted_at is null
  for update;
  if not found then
    return jsonb_build_object('outcome', 'NOT_FOUND');
  end if;

  perform public.expire_primary_transfers(p_dog_id);
  select * into v_from_member
  from public.dog_members
  where dog_id = p_dog_id
    and user_id = auth.uid()
    and role = 'PRIMARY_OWNER'
    and left_at is null;
  if not found then
    return jsonb_build_object('outcome', 'FORBIDDEN');
  end if;

  select * into v_to_member
  from public.dog_members
  where id = p_to_member_id
    and dog_id = p_dog_id
    and role = 'CO_OWNER'
    and left_at is null;
  if not found then
    return jsonb_build_object('outcome', 'NOT_ELIGIBLE');
  end if;
  if exists (
    select 1 from public.dog_primary_transfers
    where dog_id = p_dog_id and status = 'PENDING'
  ) then
    return jsonb_build_object('outcome', 'ACTION_ALREADY_PENDING');
  end if;

  insert into public.dog_primary_transfers (
    dog_id,
    from_member_id,
    to_member_id,
    ownership_version_at_creation,
    idempotency_key
  ) values (
    p_dog_id,
    v_from_member.id,
    v_to_member.id,
    v_dog.ownership_version,
    p_idempotency_key
  ) returning * into v_transfer;

  perform public.insert_dog_ownership_notification(
    v_to_member.user_id,
    v_from_member.user_id,
    'dog_primary_transfer_offered',
    v_transfer.id,
    p_dog_id
  );
  perform public.record_dog_ownership_audit(
    p_dog_id,
    v_from_member.id,
    'PRIMARY_TRANSFER_CREATED',
    v_dog.ownership_version,
    jsonb_build_object('transfer_id', v_transfer.id, 'to_member_id', v_to_member.id)
  );

  return jsonb_build_object(
    'action_id', v_transfer.id,
    'expires_at', v_transfer.expires_at,
    'outcome', 'CREATED',
    'ownership_version', v_dog.ownership_version,
    'status', v_transfer.status
  );
end;
$$;

create or replace function public.api_cancel_primary_transfer(
  p_transfer_id uuid,
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
  v_from_user_id uuid;
  v_to_user_id uuid;
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
  select * into v_dog from public.dogs where id = v_transfer.dog_id for update;
  select * into v_transfer from public.dog_primary_transfers where id = p_transfer_id for update;
  select user_id into v_from_user_id from public.dog_members where id = v_transfer.from_member_id;
  select user_id into v_to_user_id from public.dog_members where id = v_transfer.to_member_id;
  if v_from_user_id is distinct from auth.uid() or v_dog.owner is distinct from auth.uid() then
    return jsonb_build_object('outcome', 'FORBIDDEN');
  end if;

  perform public.expire_primary_transfers(v_transfer.dog_id);
  select * into v_transfer from public.dog_primary_transfers where id = p_transfer_id;
  if v_transfer.status <> 'PENDING' then
    return jsonb_build_object(
      'action_id', v_transfer.id,
      'outcome', v_transfer.status,
      'status', v_transfer.status
    );
  end if;

  update public.dog_primary_transfers
  set status = 'CANCELED', responded_at = now(), cancellation_reason = 'CANCELED_BY_ACTOR'
  where id = p_transfer_id;
  perform public.insert_dog_ownership_notification(
    v_to_user_id, auth.uid(), 'dog_primary_transfer_canceled',
    v_transfer.id, v_transfer.dog_id
  );
  perform public.record_dog_ownership_audit(
    v_transfer.dog_id, v_transfer.from_member_id, 'PRIMARY_TRANSFER_CANCELED',
    v_dog.ownership_version, jsonb_build_object('transfer_id', v_transfer.id)
  );
  return jsonb_build_object('action_id', v_transfer.id, 'outcome', 'CANCELED', 'status', 'CANCELED');
end;
$$;

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
  perform public.insert_dog_information_notification(
    v_to_member.user_id, v_from_member.user_id, 'dog_primary_changed',
    v_transfer.dog_id, jsonb_build_object('previous_primary_user_id', v_from_member.user_id)
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

create or replace function public.transition_dog_member_departure(
  p_dog_id uuid,
  p_user_id uuid,
  p_reason public.dog_member_departure_reason,
  p_selected_successor_member_id uuid,
  p_expected_ownership_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_active_owner_count integer;
  v_dog public.dogs%rowtype;
  v_member public.dog_members%rowtype;
  v_selected_was_eligible boolean := false;
  v_successor public.dog_members%rowtype;
  v_transition_at timestamptz := now();
begin
  select * into v_dog
  from public.dogs
  where id = p_dog_id and lifecycle_state = 'ACTIVE' and deleted_at is null
  for update;
  if not found then
    return jsonb_build_object('outcome', 'DOG_UNAVAILABLE');
  end if;
  if v_dog.ownership_version <> p_expected_ownership_version then
    return jsonb_build_object('outcome', 'STALE_VERSION', 'ownership_version', v_dog.ownership_version);
  end if;

  select * into v_member
  from public.dog_members
  where dog_id = p_dog_id and user_id = p_user_id and left_at is null;
  if not found then
    return jsonb_build_object('outcome', 'STALE_VERSION', 'ownership_version', v_dog.ownership_version);
  end if;
  select count(*)::integer into v_active_owner_count
  from public.dog_members where dog_id = p_dog_id and left_at is null;

  if v_member.role = 'CO_OWNER' then
    update public.dog_members
    set left_at = v_transition_at, departure_reason = p_reason
    where id = v_member.id;
    perform public.cancel_pending_primary_transfers(
      p_dog_id,
      (case when p_reason = 'ACCOUNT_ERASED' then 'ACCOUNT_ERASURE' else 'MEMBER_DEPARTED' end)::public.dog_action_cancellation_reason,
      p_user_id
    );
    update public.dogs set ownership_version = ownership_version + 1 where id = p_dog_id;
    perform public.record_dog_ownership_audit(
      p_dog_id, v_member.id,
      (case when p_reason = 'ACCOUNT_ERASED' then 'ACCOUNT_ERASURE_PREPARED' else 'OWNER_LEFT' end)::public.dog_ownership_audit_event,
      v_dog.ownership_version + 1,
      jsonb_build_object('departed_member_id', v_member.id)
    );
    return jsonb_build_object(
      'outcome', 'LEFT',
      'ownership_version', v_dog.ownership_version + 1,
      'successor_user_id', null,
      'used_fallback', false
    );
  end if;

  if v_active_owner_count = 1 then
    if p_reason <> 'ACCOUNT_ERASED' then
      return jsonb_build_object('outcome', 'NOT_ELIGIBLE', 'ownership_version', v_dog.ownership_version);
    end if;
    update public.dog_members
    set left_at = v_transition_at, departure_reason = 'ACCOUNT_ERASED'
    where id = v_member.id;
    perform public.cancel_pending_primary_transfers(p_dog_id, 'ACCOUNT_ERASURE', p_user_id);
    update public.dogs
    set deleted_at = v_transition_at,
        lifecycle_state = 'DELETING',
        owner = null,
        ownership_version = ownership_version + 1
    where id = p_dog_id;
    insert into private.storage_jobs (operation, dog_id)
    values ('DELETE_DOG_ASSETS', p_dog_id)
    on conflict (dog_id, operation)
      where operation = 'DELETE_DOG_ASSETS' and state <> 'COMPLETED'
      do nothing;
    perform public.record_dog_ownership_audit(
      p_dog_id, v_member.id, 'SOLO_DOG_DELETION_PREPARED',
      v_dog.ownership_version + 1, jsonb_build_object('departed_member_id', v_member.id)
    );
    return jsonb_build_object(
      'outcome', 'DELETION_PREPARED',
      'ownership_version', v_dog.ownership_version + 1,
      'successor_user_id', null,
      'used_fallback', false
    );
  end if;

  if p_selected_successor_member_id is not null then
    select * into v_successor
    from public.dog_members
    where id = p_selected_successor_member_id
      and dog_id = p_dog_id
      and role = 'CO_OWNER'
      and left_at is null
      and user_id is not null
      and user_id <> p_user_id;
    v_selected_was_eligible := found;
  end if;
  if not v_selected_was_eligible then
    select * into v_successor
    from public.dog_members
    where dog_id = p_dog_id
      and role = 'CO_OWNER'
      and left_at is null
      and user_id is not null
      and user_id <> p_user_id
    order by joined_at, id
    limit 1;
  end if;
  if v_successor.id is null then
    raise exception 'active_primary_departure_requires_successor' using errcode = '23514';
  end if;

  update public.dog_members
  set left_at = v_transition_at, departure_reason = p_reason
  where id = v_member.id;
  update public.dog_members set role = 'PRIMARY_OWNER' where id = v_successor.id;
  perform public.cancel_pending_primary_transfers(
    p_dog_id,
    (case when p_reason = 'ACCOUNT_ERASED' then 'ACCOUNT_ERASURE' else 'MEMBER_DEPARTED' end)::public.dog_action_cancellation_reason,
    p_user_id
  );
  update public.dogs
  set owner = v_successor.user_id,
      ownership_version = ownership_version + 1
  where id = p_dog_id;

  perform public.insert_dog_information_notification(
    v_successor.user_id,
    p_user_id,
    'dog_primary_changed',
    p_dog_id,
    jsonb_build_object('departed_user_id', p_user_id)
  );
  insert into public.notifications (
    receiver_id, sender_id, type, target_type, target_id, data, is_ready
  )
  select member.user_id,
         p_user_id,
         'dog_owner_left',
         'DOG',
         p_dog_id,
         jsonb_build_object('dog_id', p_dog_id, 'successor_user_id', v_successor.user_id),
         false
  from public.dog_members as member
  where member.dog_id = p_dog_id
    and member.left_at is null
    and member.user_id is not null
    and member.user_id <> v_successor.user_id;
  perform public.record_dog_ownership_audit(
    p_dog_id,
    v_member.id,
    (case when p_reason = 'ACCOUNT_ERASED' then 'ACCOUNT_ERASURE_PREPARED' else 'OWNER_LEFT' end)::public.dog_ownership_audit_event,
    v_dog.ownership_version + 1,
    jsonb_build_object('departed_member_id', v_member.id, 'successor_member_id', v_successor.id)
  );
  return jsonb_build_object(
    'outcome', 'LEFT',
    'ownership_version', v_dog.ownership_version + 1,
    'successor_user_id', v_successor.user_id,
    'used_fallback', not v_selected_was_eligible
  );
end;
$$;

revoke all on function public.transition_dog_member_departure(
  uuid, uuid, public.dog_member_departure_reason, uuid, bigint
) from public, anon, authenticated;

create or replace function public.api_leave_dog(
  p_dog_id uuid,
  p_selected_successor_member_id uuid,
  p_expected_ownership_version bigint,
  p_client_platform public.app_platform,
  p_client_build integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_feature_outcome text;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(p_client_platform, p_client_build);
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;
  return public.transition_dog_member_departure(
    p_dog_id,
    auth.uid(),
    'LEFT',
    p_selected_successor_member_id,
    p_expected_ownership_version
  );
end;
$$;

create or replace function public.api_prepare_account_erasure(
  p_successor_selections jsonb,
  p_client_platform public.app_platform,
  p_client_build integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_dog record;
  v_feature_outcome text;
  v_result jsonb;
  v_selected_successor_member_id uuid;
  v_transitions jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;
  v_feature_outcome := public.dog_ownership_feature_outcome(p_client_platform, p_client_build);
  if v_feature_outcome <> 'OK' and exists (
    select 1
    from public.dog_members as caller_member
    where caller_member.user_id = auth.uid()
      and caller_member.left_at is null
      and exists (
        select 1 from public.dog_members as other_member
        where other_member.dog_id = caller_member.dog_id
          and other_member.left_at is null
          and other_member.user_id <> auth.uid()
      )
  ) then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;

  for v_dog in
    select dog.id, dog.ownership_version
    from public.dogs as dog
    join public.dog_members as member on member.dog_id = dog.id
    where member.user_id = auth.uid()
      and member.left_at is null
      and dog.lifecycle_state = 'ACTIVE'
      and dog.deleted_at is null
    order by dog.id
    for update of dog
  loop
    begin
      v_selected_successor_member_id := nullif(
        coalesce(p_successor_selections, '{}'::jsonb) ->> v_dog.id::text,
        ''
      )::uuid;
    exception when invalid_text_representation then
      raise exception 'invalid_successor_selection' using errcode = '22023';
    end;

    v_result := public.transition_dog_member_departure(
      v_dog.id,
      auth.uid(),
      'ACCOUNT_ERASED',
      v_selected_successor_member_id,
      v_dog.ownership_version
    );
    if v_result ->> 'outcome' in ('STALE_VERSION', 'DOG_UNAVAILABLE', 'NOT_ELIGIBLE') then
      raise exception 'account_erasure_transition_failed:%', v_result ->> 'outcome'
        using errcode = '40001';
    end if;
    v_transitions := v_transitions || jsonb_build_array(
      jsonb_build_object('dog_id', v_dog.id) || v_result
    );
  end loop;

  return jsonb_build_object('outcome', 'PREPARED', 'transitions', v_transitions);
end;
$$;

revoke all on function public.api_create_primary_transfer(
  uuid, uuid, uuid, public.app_platform, integer
) from public, anon;
revoke all on function public.api_cancel_primary_transfer(
  uuid, public.app_platform, integer
) from public, anon;
revoke all on function public.api_respond_primary_transfer(
  uuid, boolean, public.app_platform, integer
) from public, anon;
revoke all on function public.api_leave_dog(
  uuid, uuid, bigint, public.app_platform, integer
) from public, anon;
revoke all on function public.api_prepare_account_erasure(
  jsonb, public.app_platform, integer
) from public, anon;

grant execute on function public.api_create_primary_transfer(
  uuid, uuid, uuid, public.app_platform, integer
) to authenticated;
grant execute on function public.api_cancel_primary_transfer(
  uuid, public.app_platform, integer
) to authenticated;
grant execute on function public.api_respond_primary_transfer(
  uuid, boolean, public.app_platform, integer
) to authenticated;
grant execute on function public.api_leave_dog(
  uuid, uuid, bigint, public.app_platform, integer
) to authenticated;
grant execute on function public.api_prepare_account_erasure(
  jsonb, public.app_platform, integer
) to authenticated;

-- Extend the existing capability payload without exposing any controls while
-- the service-managed compatibility rows remain disabled.
create or replace function public.api_get_dog_ownership_capabilities(
  p_dog_id uuid,
  p_client_platform public.app_platform,
  p_client_build integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_active_owner_count integer;
  v_feature_outcome text;
  v_ownership_version bigint;
  v_pending_action boolean;
  v_primary_user_id uuid;
  v_role public.dog_member_role;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(p_client_platform, p_client_build);
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('enabled', false, 'outcome', v_feature_outcome);
  end if;

  select primary_member.user_id,
         caller_member.role,
         dog.ownership_version,
         count(all_members.id)::integer
  into v_primary_user_id, v_role, v_ownership_version, v_active_owner_count
  from public.dogs as dog
  join public.dog_members as primary_member
    on primary_member.dog_id = dog.id
    and primary_member.role = 'PRIMARY_OWNER'
    and primary_member.left_at is null
  left join public.dog_members as caller_member
    on caller_member.dog_id = dog.id
    and caller_member.user_id = auth.uid()
    and caller_member.left_at is null
  join public.dog_members as all_members
    on all_members.dog_id = dog.id and all_members.left_at is null
  where dog.id = p_dog_id
    and dog.lifecycle_state = 'ACTIVE'
    and dog.deleted_at is null
  group by primary_member.user_id, caller_member.role, dog.ownership_version;

  if v_primary_user_id is null then
    return jsonb_build_object('enabled', true, 'outcome', 'NOT_FOUND');
  end if;
  perform public.expire_dog_join_actions(p_dog_id);
  perform public.expire_primary_transfers(p_dog_id);
  select exists (
    select 1 from public.dog_invites
    where dog_id = p_dog_id and invitee_user_id = auth.uid() and status = 'PENDING'
    union all
    select 1 from public.dog_ownership_requests
    where dog_id = p_dog_id and requester_user_id = auth.uid() and status = 'PENDING'
  ) into v_pending_action;

  return jsonb_build_object(
    'active_owner_count', v_active_owner_count,
    'can_invite', v_role = 'PRIMARY_OWNER' and v_active_owner_count < 8,
    'can_leave', v_role is not null and v_active_owner_count > 1,
    'can_request', v_role is null
      and v_active_owner_count < 8
      and not v_pending_action
      and public.are_accepted_friends(auth.uid(), v_primary_user_id),
    'can_transfer', v_role = 'PRIMARY_OWNER' and v_active_owner_count > 1,
    'enabled', true,
    'is_owner', v_role is not null,
    'outcome', 'OK',
    'ownership_version', v_ownership_version,
    'pending_action', v_pending_action,
    'role', v_role
  );
end;
$$;
