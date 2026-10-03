-- Add unanimous shared-dog deletion and verified storage-driven hard purge.
-- Compatibility rows remain disabled; these contracts are additive only.

create type public.dog_deletion_proposal_status as enum (
  'PENDING',
  'REJECTED',
  'CANCELED',
  'EXPIRED',
  'COMPLETED'
);

create type public.dog_deletion_consent_decision as enum (
  'APPROVED',
  'REJECTED'
);

create table public.dog_deletion_proposals (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  proposed_by_member_id uuid references public.dog_members(id) on delete set null,
  ownership_version_at_creation bigint not null,
  idempotency_key uuid not null,
  required_consent_count integer not null check (required_consent_count >= 2),
  approved_consent_count integer not null default 1 check (approved_consent_count >= 1),
  status public.dog_deletion_proposal_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  responded_at timestamptz,
  cancellation_reason public.dog_action_cancellation_reason,
  constraint dog_deletion_proposals_fixed_expiry
    check (expires_at = created_at + interval '30 days'),
  constraint dog_deletion_proposals_counts_bounded
    check (approved_consent_count <= required_consent_count),
  constraint dog_deletion_proposals_terminal_consistent
    check (
      (status = 'PENDING' and responded_at is null and cancellation_reason is null)
      or (status in ('REJECTED', 'EXPIRED', 'COMPLETED') and responded_at is not null)
      or (status = 'CANCELED' and responded_at is not null and cancellation_reason is not null)
    )
);

create unique index dog_deletion_proposals_actor_idempotency_unique
on public.dog_deletion_proposals (proposed_by_member_id, idempotency_key);

create unique index dog_deletion_proposals_one_pending_per_dog
on public.dog_deletion_proposals (dog_id)
where status = 'PENDING';

create index dog_deletion_proposals_pending_expiry_idx
on public.dog_deletion_proposals (expires_at)
where status = 'PENDING';

create table public.dog_deletion_consents (
  proposal_id uuid not null references public.dog_deletion_proposals(id) on delete cascade,
  member_id uuid not null references public.dog_members(id) on delete restrict,
  decision public.dog_deletion_consent_decision not null,
  decided_at timestamptz not null default now(),
  primary key (proposal_id, member_id)
);

create or replace function public.can_read_dog_deletion_proposal(
  p_proposal_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.dog_deletion_proposals as proposal
    join public.dog_members as member on member.dog_id = proposal.dog_id
    where proposal.id = p_proposal_id
      and member.user_id = auth.uid()
      and (
        member.left_at is null
        or member.id = proposal.proposed_by_member_id
        or exists (
          select 1
          from public.dog_deletion_consents as consent
          where consent.proposal_id = proposal.id
            and consent.member_id = member.id
        )
      )
  );
$$;

revoke all on function public.can_read_dog_deletion_proposal(uuid)
  from public, anon, authenticated;
grant execute on function public.can_read_dog_deletion_proposal(uuid)
  to authenticated;

alter table public.dog_deletion_proposals enable row level security;
alter table public.dog_deletion_consents enable row level security;

create policy dog_deletion_proposals_select_participants
on public.dog_deletion_proposals
for select
to authenticated
using (
  public.can_read_dog_deletion_proposal(dog_deletion_proposals.id)
);

create policy dog_deletion_consents_select_participants
on public.dog_deletion_consents
for select
to authenticated
using (
  public.can_read_dog_deletion_proposal(dog_deletion_consents.proposal_id)
);

revoke all on table public.dog_deletion_proposals from public, anon, authenticated;
revoke all on table public.dog_deletion_consents from public, anon, authenticated;
grant select on table public.dog_deletion_proposals to authenticated;
grant select on table public.dog_deletion_consents to authenticated;
grant all on table public.dog_deletion_proposals to service_role;
grant all on table public.dog_deletion_consents to service_role;

create or replace function public.notify_dog_deletion_participants(
  p_proposal_id uuid,
  p_sender_id uuid,
  p_type public.notification_type,
  p_excluded_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_dog_id uuid;
begin
  select dog_id into v_dog_id
  from public.dog_deletion_proposals
  where id = p_proposal_id;

  insert into public.notifications (
    receiver_id, sender_id, type, target_type, target_id, data, is_ready
  )
  select distinct
    member.user_id,
    p_sender_id,
    p_type,
    'DOG_OWNERSHIP_ACTION'::public.notification_target_type,
    p_proposal_id,
    jsonb_build_object('dog_id', v_dog_id, 'action_id', p_proposal_id),
    false
  from public.dog_members as member
  where member.dog_id = v_dog_id
    and member.user_id is not null
    and (member.left_at is null or exists (
      select 1
      from public.dog_deletion_consents as consent
      where consent.proposal_id = p_proposal_id
        and consent.member_id = member.id
    ))
    and member.user_id is distinct from p_excluded_user_id;
end;
$$;

create or replace function public.expire_dog_deletion_proposal(p_proposal_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expired boolean := false;
begin
  update public.dog_deletion_proposals
  set status = 'EXPIRED',
      responded_at = expires_at
  where id = p_proposal_id
    and status = 'PENDING'
    and expires_at <= now();
  v_expired := found;

  if v_expired then
    perform public.notify_dog_deletion_participants(
      p_proposal_id,
      null,
      'dog_deletion_proposal_expired',
      null
    );
  end if;
  return v_expired;
end;
$$;

create or replace function public.cancel_pending_dog_deletion_proposals(
  p_dog_id uuid,
  p_reason public.dog_action_cancellation_reason,
  p_actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_proposal record;
begin
  for v_proposal in
    select id, expires_at
    from public.dog_deletion_proposals
    where dog_id = p_dog_id and status = 'PENDING'
    for update
  loop
    if v_proposal.expires_at <= now() then
      update public.dog_deletion_proposals
      set status = 'EXPIRED', responded_at = v_proposal.expires_at
      where id = v_proposal.id;
      perform public.notify_dog_deletion_participants(
        v_proposal.id, p_actor_user_id, 'dog_deletion_proposal_expired', null
      );
    else
      update public.dog_deletion_proposals
      set status = 'CANCELED', responded_at = now(), cancellation_reason = p_reason
      where id = v_proposal.id;
      perform public.notify_dog_deletion_participants(
        v_proposal.id, p_actor_user_id, 'dog_deletion_proposal_canceled', p_actor_user_id
      );
    end if;
  end loop;
end;
$$;

create or replace function public.cancel_pending_dog_actions_for_deletion(
  p_dog_id uuid,
  p_actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite record;
  v_request record;
begin
  perform public.expire_dog_join_actions(p_dog_id);

  for v_invite in
    select * from public.dog_invites
    where dog_id = p_dog_id and status = 'PENDING'
    for update
  loop
    update public.dog_invites
    set status = 'CANCELED', responded_at = now(), cancellation_reason = 'DOG_UNAVAILABLE'
    where id = v_invite.id;
    perform public.insert_dog_ownership_notification(
      v_invite.invitee_user_id,
      p_actor_user_id,
      'dog_ownership_invite_canceled',
      v_invite.id,
      p_dog_id
    );
  end loop;

  for v_request in
    select * from public.dog_ownership_requests
    where dog_id = p_dog_id and status = 'PENDING'
    for update
  loop
    update public.dog_ownership_requests
    set status = 'CANCELED', responded_at = now(), cancellation_reason = 'DOG_UNAVAILABLE'
    where id = v_request.id;
    perform public.insert_dog_ownership_notification(
      v_request.requester_user_id,
      p_actor_user_id,
      'dog_ownership_request_canceled',
      v_request.id,
      p_dog_id
    );
  end loop;

  perform public.cancel_pending_primary_transfers(
    p_dog_id,
    'DOG_UNAVAILABLE',
    p_actor_user_id
  );
end;
$$;

revoke all on function public.notify_dog_deletion_participants(
  uuid, uuid, public.notification_type, uuid
) from public, anon, authenticated;
revoke all on function public.expire_dog_deletion_proposal(uuid)
  from public, anon, authenticated;
revoke all on function public.cancel_pending_dog_deletion_proposals(
  uuid, public.dog_action_cancellation_reason, uuid
) from public, anon, authenticated;
revoke all on function public.cancel_pending_dog_actions_for_deletion(uuid, uuid)
  from public, anon, authenticated;

create or replace function public.cancel_deletion_proposal_after_member_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid;
  v_dog_id uuid;
  v_reason public.dog_action_cancellation_reason;
begin
  if tg_op = 'INSERT' then
    v_dog_id := new.dog_id;
    v_actor_user_id := new.user_id;
    v_reason := 'OWNER_SET_CHANGED';
  elsif old.left_at is null and new.left_at is not null then
    v_dog_id := new.dog_id;
    v_actor_user_id := new.user_id;
    v_reason := 'OWNER_SET_CHANGED';
  elsif old.role is distinct from new.role then
    v_dog_id := new.dog_id;
    v_actor_user_id := new.user_id;
    v_reason := 'PRIMARY_CHANGED';
  else
    return new;
  end if;

  perform public.cancel_pending_dog_deletion_proposals(
    v_dog_id,
    v_reason,
    v_actor_user_id
  );
  return new;
end;
$$;

create trigger cancel_deletion_proposal_after_member_insert_trigger
after insert on public.dog_members
for each row execute function public.cancel_deletion_proposal_after_member_change();

create trigger cancel_deletion_proposal_after_member_update_trigger
after update of left_at, role on public.dog_members
for each row execute function public.cancel_deletion_proposal_after_member_change();

revoke all on function public.cancel_deletion_proposal_after_member_change()
  from public, anon, authenticated;

create or replace function public.api_get_dog_deletion_proposal(
  p_proposal_id uuid,
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
  v_result jsonb;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(
    p_client_platform, p_client_build
  );
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;
  if not public.can_read_dog_deletion_proposal(p_proposal_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform public.expire_dog_deletion_proposal(p_proposal_id);

  select to_jsonb(proposal) || jsonb_build_object(
    'consents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'member_id', consent.member_id,
        'decision', consent.decision
      ) order by consent.decided_at, consent.member_id)
      from public.dog_deletion_consents as consent
      where consent.proposal_id = proposal.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.dog_deletion_proposals as proposal
  where proposal.id = p_proposal_id;

  return v_result;
end;
$$;

create or replace function public.api_get_current_dog_deletion_proposal(
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
  v_feature_outcome text;
  v_proposal_id uuid;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(
    p_client_platform, p_client_build
  );
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;
  if not exists (
    select 1
    from public.dog_members
    where dog_id = p_dog_id and user_id = auth.uid() and left_at is null
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select id into v_proposal_id
  from public.dog_deletion_proposals
  where dog_id = p_dog_id and status = 'PENDING'
  order by created_at desc, id desc
  limit 1;
  if v_proposal_id is null then
    return null;
  end if;
  if public.expire_dog_deletion_proposal(v_proposal_id) then
    return null;
  end if;
  return public.api_get_dog_deletion_proposal(
    v_proposal_id,
    p_client_platform,
    p_client_build
  );
end;
$$;

create or replace function public.api_propose_dog_deletion(
  p_dog_id uuid,
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
  v_existing public.dog_deletion_proposals%rowtype;
  v_feature_outcome text;
  v_owner_count integer;
  v_primary_member public.dog_members%rowtype;
  v_proposal public.dog_deletion_proposals%rowtype;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(
    p_client_platform, p_client_build
  );
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;

  select * into v_dog
  from public.dogs
  where id = p_dog_id and lifecycle_state = 'ACTIVE' and deleted_at is null
  for update;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_primary_member
  from public.dog_members
  where dog_id = p_dog_id
    and user_id = auth.uid()
    and role = 'PRIMARY_OWNER'
    and left_at is null;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_existing
  from public.dog_deletion_proposals
  where proposed_by_member_id = v_primary_member.id
    and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'outcome', 'CREATED',
      'proposal_id', v_existing.id,
      'status', v_existing.status,
      'ownership_version', v_existing.ownership_version_at_creation,
      'expires_at', v_existing.expires_at
    );
  end if;

  perform public.expire_dog_deletion_proposal(proposal.id)
  from public.dog_deletion_proposals as proposal
  where proposal.dog_id = p_dog_id and proposal.status = 'PENDING';

  select * into v_existing
  from public.dog_deletion_proposals
  where dog_id = p_dog_id and status = 'PENDING';
  if found then
    return jsonb_build_object(
      'outcome', 'ACTION_ALREADY_PENDING',
      'proposal_id', v_existing.id,
      'status', v_existing.status,
      'ownership_version', v_existing.ownership_version_at_creation,
      'expires_at', v_existing.expires_at
    );
  end if;

  select count(*)::integer into v_owner_count
  from public.dog_members
  where dog_id = p_dog_id and left_at is null;
  if v_owner_count < 2 then
    return jsonb_build_object(
      'outcome', 'NOT_ELIGIBLE',
      'ownership_version', v_dog.ownership_version
    );
  end if;

  insert into public.dog_deletion_proposals (
    dog_id,
    proposed_by_member_id,
    ownership_version_at_creation,
    idempotency_key,
    required_consent_count
  ) values (
    p_dog_id,
    v_primary_member.id,
    v_dog.ownership_version,
    p_idempotency_key,
    v_owner_count
  ) returning * into v_proposal;

  insert into public.dog_deletion_consents (proposal_id, member_id, decision)
  values (v_proposal.id, v_primary_member.id, 'APPROVED');

  perform public.notify_dog_deletion_participants(
    v_proposal.id,
    auth.uid(),
    'dog_deletion_consent_requested',
    auth.uid()
  );
  perform public.record_dog_ownership_audit(
    p_dog_id,
    v_primary_member.id,
    'DOG_DELETION_PROPOSED',
    v_dog.ownership_version,
    jsonb_build_object('proposal_id', v_proposal.id)
  );

  return jsonb_build_object(
    'outcome', 'CREATED',
    'proposal_id', v_proposal.id,
    'status', v_proposal.status,
    'ownership_version', v_dog.ownership_version,
    'expires_at', v_proposal.expires_at
  );
end;
$$;

create or replace function public.api_respond_dog_deletion(
  p_proposal_id uuid,
  p_approve boolean,
  p_client_platform public.app_platform,
  p_client_build integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_approved_count integer;
  v_caller_member public.dog_members%rowtype;
  v_dog public.dogs%rowtype;
  v_existing_consent public.dog_deletion_consents%rowtype;
  v_feature_outcome text;
  v_proposal public.dog_deletion_proposals%rowtype;
  v_transition_at timestamptz := now();
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(
    p_client_platform, p_client_build
  );
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;

  select * into v_proposal
  from public.dog_deletion_proposals
  where id = p_proposal_id
  for update;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_dog
  from public.dogs
  where id = v_proposal.dog_id
  for update;

  select * into v_caller_member
  from public.dog_members
  where dog_id = v_proposal.dog_id
    and user_id = auth.uid()
    and left_at is null;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_existing_consent
  from public.dog_deletion_consents
  where proposal_id = p_proposal_id and member_id = v_caller_member.id;

  if v_proposal.status = 'COMPLETED' and v_existing_consent.decision = 'APPROVED' then
    return jsonb_build_object(
      'outcome', 'NO_CHANGE',
      'proposal_id', v_proposal.id,
      'status', v_proposal.status,
      'ownership_version', v_dog.ownership_version
    );
  end if;
  if v_proposal.status <> 'PENDING' then
    return jsonb_build_object(
      'outcome', v_proposal.status,
      'proposal_id', v_proposal.id,
      'status', v_proposal.status,
      'ownership_version', v_dog.ownership_version
    );
  end if;
  if v_proposal.expires_at <= now() then
    update public.dog_deletion_proposals
    set status = 'EXPIRED', responded_at = v_proposal.expires_at
    where id = v_proposal.id;
    perform public.notify_dog_deletion_participants(
      v_proposal.id, null, 'dog_deletion_proposal_expired', null
    );
    return jsonb_build_object(
      'outcome', 'EXPIRED',
      'proposal_id', v_proposal.id,
      'status', 'EXPIRED',
      'ownership_version', v_dog.ownership_version
    );
  end if;
  if v_dog.lifecycle_state <> 'ACTIVE'
    or v_dog.ownership_version <> v_proposal.ownership_version_at_creation then
    update public.dog_deletion_proposals
    set status = 'CANCELED',
        responded_at = now(),
        cancellation_reason = 'OWNER_SET_CHANGED'
    where id = v_proposal.id;
    return jsonb_build_object(
      'outcome', 'STALE_VERSION',
      'proposal_id', v_proposal.id,
      'status', 'CANCELED',
      'ownership_version', v_dog.ownership_version
    );
  end if;
  if v_existing_consent.member_id is not null then
    return jsonb_build_object(
      'outcome', 'NO_CHANGE',
      'proposal_id', v_proposal.id,
      'status', v_proposal.status,
      'ownership_version', v_dog.ownership_version
    );
  end if;

  insert into public.dog_deletion_consents (proposal_id, member_id, decision)
  values (
    v_proposal.id,
    v_caller_member.id,
    (case when p_approve then 'APPROVED' else 'REJECTED' end)::public.dog_deletion_consent_decision
  );

  if not p_approve then
    update public.dog_deletion_proposals
    set status = 'REJECTED', responded_at = v_transition_at
    where id = v_proposal.id;
    perform public.notify_dog_deletion_participants(
      v_proposal.id,
      auth.uid(),
      'dog_deletion_proposal_rejected',
      auth.uid()
    );
    perform public.record_dog_ownership_audit(
      v_proposal.dog_id,
      v_caller_member.id,
      'DOG_DELETION_REJECTED',
      v_dog.ownership_version,
      jsonb_build_object('proposal_id', v_proposal.id)
    );
    return jsonb_build_object(
      'outcome', 'REJECTED',
      'proposal_id', v_proposal.id,
      'status', 'REJECTED',
      'ownership_version', v_dog.ownership_version
    );
  end if;

  select count(*)::integer into v_approved_count
  from public.dog_deletion_consents
  where proposal_id = v_proposal.id and decision = 'APPROVED';

  update public.dog_deletion_proposals
  set approved_consent_count = v_approved_count
  where id = v_proposal.id;

  if v_approved_count < v_proposal.required_consent_count then
    return jsonb_build_object(
      'outcome', 'APPROVED',
      'proposal_id', v_proposal.id,
      'status', 'PENDING',
      'ownership_version', v_dog.ownership_version
    );
  end if;

  update public.dog_deletion_proposals
  set status = 'COMPLETED',
      approved_consent_count = v_approved_count,
      responded_at = v_transition_at
  where id = v_proposal.id;

  perform public.cancel_pending_dog_actions_for_deletion(
    v_proposal.dog_id,
    auth.uid()
  );

  update public.dogs
  set lifecycle_state = 'DELETING',
      deleted_at = v_transition_at,
      owner = null,
      ownership_version = ownership_version + 1
  where id = v_proposal.dog_id;

  insert into private.storage_jobs (operation, dog_id)
  values ('DELETE_DOG_ASSETS', v_proposal.dog_id)
  on conflict (dog_id, operation)
    where operation = 'DELETE_DOG_ASSETS' and state <> 'COMPLETED'
    do nothing;

  insert into public.notifications (
    receiver_id, sender_id, type, target_type, target_id, data, is_ready
  )
  select member.user_id,
         auth.uid(),
         'dog_deletion_completed',
         'DOG'::public.notification_target_type,
         v_proposal.dog_id,
         jsonb_build_object('dog_id', v_proposal.dog_id),
         false
  from public.dog_members as member
  where member.dog_id = v_proposal.dog_id
    and member.left_at is null
    and member.user_id is not null;

  perform public.record_dog_ownership_audit(
    v_proposal.dog_id,
    v_caller_member.id,
    'DOG_DELETION_PREPARED',
    v_dog.ownership_version + 1,
    jsonb_build_object('proposal_id', v_proposal.id)
  );

  return jsonb_build_object(
    'outcome', 'DELETION_PREPARED',
    'proposal_id', v_proposal.id,
    'status', 'COMPLETED',
    'ownership_version', v_dog.ownership_version + 1
  );
end;
$$;

create or replace function public.api_withdraw_dog_deletion(
  p_proposal_id uuid,
  p_client_platform public.app_platform,
  p_client_build integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller_member public.dog_members%rowtype;
  v_feature_outcome text;
  v_proposal public.dog_deletion_proposals%rowtype;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(
    p_client_platform, p_client_build
  );
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;

  select * into v_proposal
  from public.dog_deletion_proposals
  where id = p_proposal_id
  for update;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select member.* into v_caller_member
  from public.dog_members as member
  join public.dog_deletion_consents as consent
    on consent.member_id = member.id
    and consent.proposal_id = v_proposal.id
    and consent.decision = 'APPROVED'
  where member.user_id = auth.uid();
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_proposal.status <> 'PENDING' then
    return jsonb_build_object(
      'outcome', 'NO_CHANGE', 'proposal_id', v_proposal.id, 'status', v_proposal.status
    );
  end if;
  if v_proposal.expires_at <= now() then
    perform public.expire_dog_deletion_proposal(v_proposal.id);
    return jsonb_build_object(
      'outcome', 'EXPIRED', 'proposal_id', v_proposal.id, 'status', 'EXPIRED'
    );
  end if;

  update public.dog_deletion_proposals
  set status = 'CANCELED',
      responded_at = now(),
      cancellation_reason = 'APPROVAL_WITHDRAWN'
  where id = v_proposal.id;
  perform public.notify_dog_deletion_participants(
    v_proposal.id, auth.uid(), 'dog_deletion_proposal_canceled', auth.uid()
  );
  perform public.record_dog_ownership_audit(
    v_proposal.dog_id,
    v_caller_member.id,
    'DOG_DELETION_CANCELED',
    v_proposal.ownership_version_at_creation,
    jsonb_build_object('proposal_id', v_proposal.id)
  );
  return jsonb_build_object(
    'outcome', 'CANCELED', 'proposal_id', v_proposal.id, 'status', 'CANCELED'
  );
end;
$$;

create or replace function public.api_cancel_dog_deletion(
  p_proposal_id uuid,
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
  v_primary_member public.dog_members%rowtype;
  v_proposal public.dog_deletion_proposals%rowtype;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(
    p_client_platform, p_client_build
  );
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;

  select * into v_proposal
  from public.dog_deletion_proposals
  where id = p_proposal_id
  for update;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into v_primary_member
  from public.dog_members
  where dog_id = v_proposal.dog_id
    and user_id = auth.uid()
    and role = 'PRIMARY_OWNER'
    and left_at is null;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_proposal.status <> 'PENDING' then
    return jsonb_build_object(
      'outcome', 'NO_CHANGE', 'proposal_id', v_proposal.id, 'status', v_proposal.status
    );
  end if;
  if v_proposal.expires_at <= now() then
    perform public.expire_dog_deletion_proposal(v_proposal.id);
    return jsonb_build_object(
      'outcome', 'EXPIRED', 'proposal_id', v_proposal.id, 'status', 'EXPIRED'
    );
  end if;

  update public.dog_deletion_proposals
  set status = 'CANCELED',
      responded_at = now(),
      cancellation_reason = 'CANCELED_BY_ACTOR'
  where id = v_proposal.id;
  perform public.notify_dog_deletion_participants(
    v_proposal.id, auth.uid(), 'dog_deletion_proposal_canceled', auth.uid()
  );
  perform public.record_dog_ownership_audit(
    v_proposal.dog_id,
    v_primary_member.id,
    'DOG_DELETION_CANCELED',
    v_proposal.ownership_version_at_creation,
    jsonb_build_object('proposal_id', v_proposal.id)
  );
  return jsonb_build_object(
    'outcome', 'CANCELED', 'proposal_id', v_proposal.id, 'status', 'CANCELED'
  );
end;
$$;

revoke all on function public.api_propose_dog_deletion(
  uuid, uuid, public.app_platform, integer
) from public, anon;
revoke all on function public.api_get_dog_deletion_proposal(
  uuid, public.app_platform, integer
) from public, anon;
revoke all on function public.api_get_current_dog_deletion_proposal(
  uuid, public.app_platform, integer
) from public, anon;
revoke all on function public.api_respond_dog_deletion(
  uuid, boolean, public.app_platform, integer
) from public, anon;
revoke all on function public.api_withdraw_dog_deletion(
  uuid, public.app_platform, integer
) from public, anon;
revoke all on function public.api_cancel_dog_deletion(
  uuid, public.app_platform, integer
) from public, anon;
grant execute on function public.api_propose_dog_deletion(
  uuid, uuid, public.app_platform, integer
) to authenticated, service_role;
grant execute on function public.api_get_dog_deletion_proposal(
  uuid, public.app_platform, integer
) to authenticated, service_role;
grant execute on function public.api_get_current_dog_deletion_proposal(
  uuid, public.app_platform, integer
) to authenticated, service_role;
grant execute on function public.api_respond_dog_deletion(
  uuid, boolean, public.app_platform, integer
) to authenticated, service_role;
grant execute on function public.api_withdraw_dog_deletion(
  uuid, public.app_platform, integer
) to authenticated, service_role;
grant execute on function public.api_cancel_dog_deletion(
  uuid, public.app_platform, integer
) to authenticated, service_role;

-- Completing a verified DELETE_DOG_ASSETS job is the only hard-purge path.
create or replace function public.complete_dog_storage_job(
  p_job_id uuid,
  p_verified_size bigint default null,
  p_checksum text default null
)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_dog_version bigint;
  v_job private.storage_jobs%rowtype;
begin
  select job.* into v_job
  from private.storage_jobs as job
  where job.id = p_job_id and job.state = 'PROCESSING'
  for update;
  if not found then
    raise exception 'storage_job_not_processing';
  end if;

  if v_job.operation = 'COPY_LEGACY_DOG_IMAGE' then
    perform set_config('app.allow_dog_image_storage_move', 'on', true);
    update public.dog_images
    set bucket_id = v_job.destination_bucket,
        storage_path = v_job.destination_path
    where id = v_job.image_id
      and bucket_id = v_job.source_bucket
      and storage_path = v_job.source_path;
    if not found then
      raise exception 'legacy_image_metadata_changed';
    end if;
  elsif v_job.operation = 'DELETE_DOG_ASSETS' then
    select ownership_version into v_dog_version
    from public.dogs
    where id = v_job.dog_id and lifecycle_state = 'DELETING'
    for update;
    if not found then
      raise exception 'dog_not_ready_for_hard_purge';
    end if;
    perform public.record_dog_ownership_audit(
      v_job.dog_id,
      null,
      'DOG_DELETION_COMPLETED',
      v_dog_version,
      jsonb_build_object('storage_job_id', v_job.id)
    );
    -- Consent membership references are deliberately restrictive while a
    -- proposal exists. Purge the proposal first so its consent cascade closes
    -- that evidence graph before dog membership rows cascade away.
    delete from public.dog_deletion_proposals where dog_id = v_job.dog_id;
    delete from public.dogs where id = v_job.dog_id;
  end if;

  update private.storage_jobs
  set state = 'COMPLETED',
      expected_size = coalesce(p_verified_size, expected_size),
      checksum = coalesce(p_checksum, checksum),
      locked_at = null,
      finished_at = now(),
      error_code = null,
      updated_at = now()
  where id = v_job.id;
end;
$$;

revoke all on function public.complete_dog_storage_job(uuid, bigint, text)
  from public, anon, authenticated;
grant execute on function public.complete_dog_storage_job(uuid, bigint, text)
  to service_role;
