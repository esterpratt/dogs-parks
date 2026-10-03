-- Add the typed invitation/request slice behind the disabled compatibility gate.
-- Shared ownership remains disabled in deployment data until the later rollout.

create type public.dog_action_cancellation_reason as enum (
  'CANCELED_BY_ACTOR',
  'FRIENDSHIP_ENDED',
  'PRIMARY_CHANGED',
  'DOG_UNAVAILABLE'
);

alter type public.notification_target_type
  add value if not exists 'DOG_OWNERSHIP_ACTION';
alter type public.notification_target_type
  add value if not exists 'DOG';

alter type public.notification_type
  add value if not exists 'dog_ownership_invite_received';
alter type public.notification_type
  add value if not exists 'dog_ownership_invite_accepted';
alter type public.notification_type
  add value if not exists 'dog_ownership_invite_declined';
alter type public.notification_type
  add value if not exists 'dog_ownership_invite_canceled';
alter type public.notification_type
  add value if not exists 'dog_ownership_request_received';
alter type public.notification_type
  add value if not exists 'dog_ownership_request_approved';
alter type public.notification_type
  add value if not exists 'dog_ownership_request_declined';
alter type public.notification_type
  add value if not exists 'dog_ownership_request_canceled';
alter type public.notification_type
  add value if not exists 'dog_owner_joined';

drop trigger if exists dog_invite_notify_trigger on public.dog_invites;
drop function if exists public.notify_dog_invite_change();
drop function if exists public.accept_dog_invite(uuid);
drop function if exists public.cancel_dog_invite(uuid);
drop function if exists public.create_dog_invite(uuid, uuid, public.dog_member_role);
drop function if exists public.decline_dog_invite(uuid);
drop function if exists public.accept_primary_transfer(uuid);
drop function if exists public.create_primary_transfer_invite(uuid, uuid);
drop index if exists public.dog_invites_pending_unique;

-- Rebuild this prototype enum so EXPIRED can be used by constraints in the same
-- atomic migration; PostgreSQL cannot otherwise use a newly-added enum label.
alter table public.dog_invites alter column status drop default;
alter table public.dog_invites
  alter column status type text using status::text;
drop type public.dog_invite_status;
create type public.dog_invite_status as enum (
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'CANCELED',
  'EXPIRED'
);
alter table public.dog_invites
  alter column status type public.dog_invite_status
    using status::public.dog_invite_status,
  alter column status set default 'PENDING';

drop policy if exists dog_invites_insert_primary on public.dog_invites;
drop policy if exists dog_invites_select_parties on public.dog_invites;

alter table public.dog_invites
  drop constraint if exists dog_invites_no_primary_offer,
  drop constraint if exists dog_invites_no_self_invite,
  drop constraint if exists dog_invites_invitee_user_id_fkey,
  drop constraint if exists dog_invites_inviter_user_id_fkey,
  add column inviter_member_id uuid references public.dog_members(id) on delete set null,
  add column primary_user_id_at_creation uuid references public.users(id) on delete set null,
  add column ownership_version_at_creation bigint,
  add column idempotency_key uuid,
  add column expires_at timestamptz,
  add column cancellation_reason public.dog_action_cancellation_reason;

update public.dog_invites as invite
set inviter_member_id = member.id,
    primary_user_id_at_creation = invite.inviter_user_id,
    ownership_version_at_creation = dog.ownership_version,
    idempotency_key = gen_random_uuid(),
    expires_at = invite.created_at + interval '30 days'
from public.dogs as dog
left join public.dog_members as member
  on member.dog_id = dog.id
  and member.role = 'PRIMARY_OWNER'
  and member.left_at is null
where dog.id = invite.dog_id;

alter table public.dog_invites
  alter column invitee_user_id drop not null,
  alter column ownership_version_at_creation set not null,
  alter column idempotency_key set not null,
  alter column expires_at set not null,
  alter column expires_at set default (now() + interval '30 days'),
  add constraint dog_invites_invitee_user_id_fkey
    foreign key (invitee_user_id) references public.users(id) on delete set null,
  add constraint dog_invites_fixed_expiry
    check (expires_at = created_at + interval '30 days'),
  add constraint dog_invites_response_consistent
    check (
      (status = 'PENDING' and responded_at is null and cancellation_reason is null)
      or (status in ('ACCEPTED', 'DECLINED', 'EXPIRED') and responded_at is not null)
      or (status = 'CANCELED' and responded_at is not null and cancellation_reason is not null)
    );

alter table public.dog_invites
  drop column inviter_user_id,
  drop column role_offered,
  drop column is_primary_transfer;

create unique index dog_invites_actor_idempotency_unique
on public.dog_invites (primary_user_id_at_creation, idempotency_key);

create unique index dog_invites_pending_candidate_unique
on public.dog_invites (dog_id, invitee_user_id)
where status = 'PENDING';

create index dog_invites_pending_expiry_idx
on public.dog_invites (expires_at)
where status = 'PENDING';

create table public.dog_ownership_requests (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  requester_user_id uuid references public.users(id) on delete set null,
  primary_user_id_at_creation uuid references public.users(id) on delete set null,
  ownership_version_at_creation bigint not null,
  idempotency_key uuid not null,
  status public.dog_invite_status not null default 'PENDING',
  disclosure_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  responded_at timestamptz,
  cancellation_reason public.dog_action_cancellation_reason,
  constraint dog_ownership_requests_fixed_expiry
    check (expires_at = created_at + interval '30 days'),
  constraint dog_ownership_requests_response_consistent
    check (
      (status = 'PENDING' and responded_at is null and cancellation_reason is null)
      or (status in ('ACCEPTED', 'DECLINED', 'EXPIRED') and responded_at is not null)
      or (status = 'CANCELED' and responded_at is not null and cancellation_reason is not null)
    )
);

create unique index dog_ownership_requests_actor_idempotency_unique
on public.dog_ownership_requests (requester_user_id, idempotency_key);

create unique index dog_ownership_requests_pending_candidate_unique
on public.dog_ownership_requests (dog_id, requester_user_id)
where status = 'PENDING';

create index dog_ownership_requests_rate_limit_idx
on public.dog_ownership_requests (requester_user_id, created_at desc);

create index dog_ownership_requests_pending_expiry_idx
on public.dog_ownership_requests (expires_at)
where status = 'PENDING';

alter table public.dog_ownership_requests enable row level security;

-- Action rows are readable only by their parties and the current primary.
create policy dog_invites_select_parties
on public.dog_invites
for select
to authenticated
using (
  invitee_user_id = auth.uid()
  or primary_user_id_at_creation = auth.uid()
  or exists (
    select 1
    from public.dog_members as member
    where member.dog_id = dog_invites.dog_id
      and member.user_id = auth.uid()
      and member.role = 'PRIMARY_OWNER'
      and member.left_at is null
  )
);

create policy dog_ownership_requests_select_parties
on public.dog_ownership_requests
for select
to authenticated
using (
  requester_user_id = auth.uid()
  or primary_user_id_at_creation = auth.uid()
  or exists (
    select 1
    from public.dog_members as member
    where member.dog_id = dog_ownership_requests.dog_id
      and member.user_id = auth.uid()
      and member.role = 'PRIMARY_OWNER'
      and member.left_at is null
  )
);

revoke all on table public.dog_invites from public, anon, authenticated;
revoke all on table public.dog_ownership_requests from public, anon, authenticated;
grant select on table public.dog_invites to authenticated;
grant select on table public.dog_ownership_requests to authenticated;
grant all on table public.dog_invites to service_role;
grant all on table public.dog_ownership_requests to service_role;

-- Ownership lifecycle functions, not clients, are the only notification writers.
drop policy if exists "Enable insert for authenticated users only" on public.notifications;
revoke insert on table public.notifications from authenticated;

alter table public.notifications
  drop constraint notifications_sender_id_fkey,
  add constraint notifications_sender_id_fkey
    foreign key (sender_id) references public.users(id) on update cascade on delete set null;

create or replace function public.dog_ownership_feature_outcome(
  p_client_platform public.app_platform,
  p_client_build integer
)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when auth.uid() is null then 'AUTH_REQUIRED'
    else coalesce((
      select case
        when compatibility.enabled
          and p_client_build >= compatibility.minimum_build then 'OK'
        else 'UPGRADE_REQUIRED'
      end
      from public.app_feature_compatibility as compatibility
      where compatibility.feature = 'SHARED_DOG_OWNERSHIP'
        and compatibility.platform = p_client_platform
    ), 'UPGRADE_REQUIRED')
  end;
$$;

create or replace function public.are_accepted_friends(
  p_first_user_id uuid,
  p_second_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.friendships as friendship
    where friendship.status = 'APPROVED'
      and (
        (friendship.requester_id = p_first_user_id and friendship.requestee_id = p_second_user_id)
        or (friendship.requester_id = p_second_user_id and friendship.requestee_id = p_first_user_id)
      )
  );
$$;

create or replace function public.expire_dog_join_actions(p_dog_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.dog_invites
  set status = 'EXPIRED',
      responded_at = expires_at
  where dog_id = p_dog_id
    and status = 'PENDING'
    and expires_at <= now();

  update public.dog_ownership_requests
  set status = 'EXPIRED',
      responded_at = expires_at
  where dog_id = p_dog_id
    and status = 'PENDING'
    and expires_at <= now();
end;
$$;

create or replace function public.insert_dog_ownership_notification(
  p_receiver_id uuid,
  p_sender_id uuid,
  p_type public.notification_type,
  p_action_id uuid,
  p_dog_id uuid
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
    )
    values (
      p_receiver_id,
      p_sender_id,
      p_type,
      'DOG_OWNERSHIP_ACTION',
      p_action_id,
      jsonb_build_object('dog_id', p_dog_id, 'action_id', p_action_id),
      false
    );
  end if;
end;
$$;

create or replace function public.notify_existing_co_owners_of_join(
  p_dog_id uuid,
  p_joined_user_id uuid,
  p_primary_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (
    receiver_id, sender_id, type, target_type, target_id, data, is_ready
  )
  select
    member.user_id,
    p_joined_user_id,
    'dog_owner_joined',
    'DOG',
    p_dog_id,
    jsonb_build_object('dog_id', p_dog_id),
    false
  from public.dog_members as member
  where member.dog_id = p_dog_id
    and member.left_at is null
    and member.user_id is not null
    and member.user_id <> p_joined_user_id
    and member.user_id <> p_primary_user_id;
end;
$$;

revoke all on function public.dog_ownership_feature_outcome(public.app_platform, integer)
  from public, anon, authenticated;
revoke all on function public.are_accepted_friends(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.expire_dog_join_actions(uuid)
  from public, anon, authenticated;
revoke all on function public.insert_dog_ownership_notification(
  uuid, uuid, public.notification_type, uuid, uuid
) from public, anon, authenticated;
revoke all on function public.notify_existing_co_owners_of_join(uuid, uuid, uuid)
  from public, anon, authenticated;

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
  v_pending_action boolean;
  v_primary_user_id uuid;
  v_role public.dog_member_role;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(
    p_client_platform,
    p_client_build
  );
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('enabled', false, 'outcome', v_feature_outcome);
  end if;

  select primary_member.user_id,
         caller_member.role,
         count(all_members.id)::integer
  into v_primary_user_id, v_role, v_active_owner_count
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
    on all_members.dog_id = dog.id
    and all_members.left_at is null
  where dog.id = p_dog_id
    and dog.lifecycle_state = 'ACTIVE'
    and dog.deleted_at is null
  group by primary_member.user_id, caller_member.role;

  if v_primary_user_id is null then
    return jsonb_build_object('enabled', true, 'outcome', 'NOT_FOUND');
  end if;

  perform public.expire_dog_join_actions(p_dog_id);
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
    'can_request', v_role is null
      and v_active_owner_count < 8
      and not v_pending_action
      and public.are_accepted_friends(auth.uid(), v_primary_user_id),
    'enabled', true,
    'is_owner', v_role is not null,
    'outcome', 'OK',
    'pending_action', v_pending_action,
    'role', v_role
  );
end;
$$;

create or replace function public.api_create_dog_invite(
  p_dog_id uuid,
  p_invitee_user_id uuid,
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
  v_active_owner_count integer;
  v_dog public.dogs%rowtype;
  v_existing_id uuid;
  v_invite_id uuid;
  v_inviter_member_id uuid;
  v_pending_invite_count integer;
  v_feature_outcome text;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(p_client_platform, p_client_build);
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;

  select id into v_existing_id
  from public.dog_invites
  where primary_user_id_at_creation = auth.uid()
    and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('action_id', v_existing_id, 'outcome', 'CREATED');
  end if;

  select * into v_dog
  from public.dogs
  where id = p_dog_id
    and lifecycle_state = 'ACTIVE'
    and deleted_at is null
  for update;
  if not found then
    return jsonb_build_object('outcome', 'NOT_FOUND');
  end if;

  perform public.expire_dog_join_actions(p_dog_id);
  select id into v_inviter_member_id
  from public.dog_members
  where dog_id = p_dog_id
    and user_id = auth.uid()
    and role = 'PRIMARY_OWNER'
    and left_at is null;
  if v_inviter_member_id is null then
    return jsonb_build_object('outcome', 'FORBIDDEN');
  end if;
  if p_invitee_user_id = auth.uid() then
    return jsonb_build_object('outcome', 'INVALID_TARGET');
  end if;
  if not public.are_accepted_friends(auth.uid(), p_invitee_user_id) then
    return jsonb_build_object('outcome', 'NOT_FRIENDS');
  end if;
  if exists (
    select 1 from public.dog_members
    where dog_id = p_dog_id and user_id = p_invitee_user_id and left_at is null
  ) then
    return jsonb_build_object('outcome', 'ALREADY_MEMBER');
  end if;
  if exists (
    select 1 from public.dog_invites
    where dog_id = p_dog_id and invitee_user_id = p_invitee_user_id and status = 'PENDING'
    union all
    select 1 from public.dog_ownership_requests
    where dog_id = p_dog_id and requester_user_id = p_invitee_user_id and status = 'PENDING'
  ) then
    return jsonb_build_object('outcome', 'ACTION_ALREADY_PENDING');
  end if;

  select count(*)::integer into v_active_owner_count
  from public.dog_members where dog_id = p_dog_id and left_at is null;
  select count(*)::integer into v_pending_invite_count
  from public.dog_invites where dog_id = p_dog_id and status = 'PENDING';
  if v_active_owner_count >= 8 or v_pending_invite_count >= 8 - v_active_owner_count then
    return jsonb_build_object('outcome', 'CAPACITY_REACHED');
  end if;

  insert into public.dog_invites (
    dog_id,
    inviter_member_id,
    invitee_user_id,
    primary_user_id_at_creation,
    ownership_version_at_creation,
    idempotency_key
  ) values (
    p_dog_id,
    v_inviter_member_id,
    p_invitee_user_id,
    auth.uid(),
    v_dog.ownership_version,
    p_idempotency_key
  ) returning id into v_invite_id;

  perform public.insert_dog_ownership_notification(
    p_invitee_user_id,
    auth.uid(),
    'dog_ownership_invite_received',
    v_invite_id,
    p_dog_id
  );
  return jsonb_build_object('action_id', v_invite_id, 'outcome', 'CREATED');
end;
$$;

create or replace function public.api_cancel_dog_invite(
  p_invite_id uuid,
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
  v_invite public.dog_invites%rowtype;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(p_client_platform, p_client_build);
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;
  select * into v_invite from public.dog_invites where id = p_invite_id for update;
  if not found then
    return jsonb_build_object('outcome', 'NOT_FOUND');
  end if;
  perform 1 from public.dogs where id = v_invite.dog_id for update;
  if not exists (
    select 1 from public.dog_members
    where dog_id = v_invite.dog_id
      and user_id = auth.uid()
      and role = 'PRIMARY_OWNER'
      and left_at is null
  ) then
    return jsonb_build_object('outcome', 'FORBIDDEN');
  end if;
  perform public.expire_dog_join_actions(v_invite.dog_id);
  select * into v_invite from public.dog_invites where id = p_invite_id;
  if v_invite.status <> 'PENDING' then
    return jsonb_build_object('outcome', v_invite.status::text);
  end if;
  update public.dog_invites
  set status = 'CANCELED', responded_at = now(), cancellation_reason = 'CANCELED_BY_ACTOR'
  where id = p_invite_id;
  perform public.insert_dog_ownership_notification(
    v_invite.invitee_user_id, auth.uid(), 'dog_ownership_invite_canceled',
    v_invite.id, v_invite.dog_id
  );
  return jsonb_build_object('action_id', v_invite.id, 'outcome', 'CANCELED');
end;
$$;

create or replace function public.api_respond_dog_invite(
  p_invite_id uuid,
  p_accept boolean,
  p_disclosure_accepted boolean,
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
  v_invite public.dog_invites%rowtype;
  v_primary_user_id uuid;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(p_client_platform, p_client_build);
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;
  select * into v_invite from public.dog_invites where id = p_invite_id for update;
  if not found then
    return jsonb_build_object('outcome', 'NOT_FOUND');
  end if;
  if v_invite.invitee_user_id is distinct from auth.uid() then
    return jsonb_build_object('outcome', 'FORBIDDEN');
  end if;
  perform 1 from public.dogs
  where id = v_invite.dog_id and lifecycle_state = 'ACTIVE' and deleted_at is null
  for update;
  if not found then
    return jsonb_build_object('outcome', 'DOG_UNAVAILABLE');
  end if;
  perform public.expire_dog_join_actions(v_invite.dog_id);
  select * into v_invite from public.dog_invites where id = p_invite_id;
  if v_invite.status <> 'PENDING' then
    return jsonb_build_object('outcome', v_invite.status::text);
  end if;
  select user_id into v_primary_user_id
  from public.dog_members
  where dog_id = v_invite.dog_id and role = 'PRIMARY_OWNER' and left_at is null;
  if v_primary_user_id is distinct from v_invite.primary_user_id_at_creation then
    return jsonb_build_object('outcome', 'STALE_VERSION');
  end if;
  if not p_accept then
    update public.dog_invites set status = 'DECLINED', responded_at = now()
    where id = p_invite_id;
    perform public.insert_dog_ownership_notification(
      v_primary_user_id, auth.uid(), 'dog_ownership_invite_declined',
      v_invite.id, v_invite.dog_id
    );
    return jsonb_build_object('action_id', v_invite.id, 'outcome', 'DECLINED');
  end if;
  if not p_disclosure_accepted then
    return jsonb_build_object('outcome', 'DISCLOSURE_REQUIRED');
  end if;
  if not public.are_accepted_friends(v_primary_user_id, auth.uid()) then
    return jsonb_build_object('outcome', 'NOT_FRIENDS');
  end if;
  select count(*)::integer into v_active_owner_count
  from public.dog_members where dog_id = v_invite.dog_id and left_at is null;
  if v_active_owner_count >= 8 then
    return jsonb_build_object('outcome', 'CAPACITY_REACHED');
  end if;
  if exists (
    select 1 from public.dog_members
    where dog_id = v_invite.dog_id and user_id = auth.uid() and left_at is null
  ) then
    return jsonb_build_object('outcome', 'ALREADY_MEMBER');
  end if;

  insert into public.dog_members (dog_id, user_id, role)
  values (v_invite.dog_id, auth.uid(), 'CO_OWNER');
  update public.dog_invites set status = 'ACCEPTED', responded_at = now()
  where id = p_invite_id;
  update public.dogs set ownership_version = ownership_version + 1
  where id = v_invite.dog_id;
  perform public.insert_dog_ownership_notification(
    v_primary_user_id, auth.uid(), 'dog_ownership_invite_accepted',
    v_invite.id, v_invite.dog_id
  );
  perform public.notify_existing_co_owners_of_join(
    v_invite.dog_id, auth.uid(), v_primary_user_id
  );
  return jsonb_build_object('action_id', v_invite.id, 'outcome', 'ACCEPTED');
end;
$$;

create or replace function public.api_create_dog_ownership_request(
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
  v_active_owner_count integer;
  v_dog public.dogs%rowtype;
  v_existing_id uuid;
  v_feature_outcome text;
  v_primary_user_id uuid;
  v_request_count integer;
  v_request_id uuid;
  v_retry_after timestamptz;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(p_client_platform, p_client_build);
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;
  select id into v_existing_id
  from public.dog_ownership_requests
  where requester_user_id = auth.uid() and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('action_id', v_existing_id, 'outcome', 'CREATED');
  end if;

  select * into v_dog from public.dogs
  where id = p_dog_id and lifecycle_state = 'ACTIVE' and deleted_at is null
  for update;
  if not found then
    return jsonb_build_object('outcome', 'NOT_FOUND');
  end if;
  perform public.expire_dog_join_actions(p_dog_id);
  select user_id into v_primary_user_id
  from public.dog_members
  where dog_id = p_dog_id and role = 'PRIMARY_OWNER' and left_at is null;
  if v_primary_user_id = auth.uid() then
    return jsonb_build_object('outcome', 'ALREADY_MEMBER');
  end if;
  if exists (
    select 1 from public.dog_members
    where dog_id = p_dog_id and user_id = auth.uid() and left_at is null
  ) then
    return jsonb_build_object('outcome', 'ALREADY_MEMBER');
  end if;
  if not public.are_accepted_friends(v_primary_user_id, auth.uid()) then
    return jsonb_build_object('outcome', 'NOT_FRIENDS');
  end if;
  if exists (
    select 1 from public.dog_invites
    where dog_id = p_dog_id and invitee_user_id = auth.uid() and status = 'PENDING'
    union all
    select 1 from public.dog_ownership_requests
    where dog_id = p_dog_id and requester_user_id = auth.uid() and status = 'PENDING'
  ) then
    return jsonb_build_object('outcome', 'ACTION_ALREADY_PENDING');
  end if;
  select count(*)::integer into v_active_owner_count
  from public.dog_members where dog_id = p_dog_id and left_at is null;
  if v_active_owner_count >= 8 then
    return jsonb_build_object('outcome', 'CAPACITY_REACHED');
  end if;

  select count(*)::integer, min(created_at) + interval '24 hours'
  into v_request_count, v_retry_after
  from public.dog_ownership_requests
  where requester_user_id = auth.uid()
    and created_at > now() - interval '24 hours';
  if v_request_count >= 10 then
    return jsonb_build_object('outcome', 'RATE_LIMITED', 'retry_after', v_retry_after);
  end if;

  insert into public.dog_ownership_requests (
    dog_id,
    requester_user_id,
    primary_user_id_at_creation,
    ownership_version_at_creation,
    idempotency_key,
    disclosure_accepted_at
  ) values (
    p_dog_id,
    auth.uid(),
    v_primary_user_id,
    v_dog.ownership_version,
    p_idempotency_key,
    now()
  ) returning id into v_request_id;
  perform public.insert_dog_ownership_notification(
    v_primary_user_id, auth.uid(), 'dog_ownership_request_received',
    v_request_id, p_dog_id
  );
  return jsonb_build_object('action_id', v_request_id, 'outcome', 'CREATED');
end;
$$;

create or replace function public.api_cancel_dog_ownership_request(
  p_request_id uuid,
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
  v_request public.dog_ownership_requests%rowtype;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(p_client_platform, p_client_build);
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;
  select * into v_request from public.dog_ownership_requests
  where id = p_request_id for update;
  if not found then
    return jsonb_build_object('outcome', 'NOT_FOUND');
  end if;
  if v_request.requester_user_id is distinct from auth.uid() then
    return jsonb_build_object('outcome', 'FORBIDDEN');
  end if;
  perform 1 from public.dogs where id = v_request.dog_id for update;
  perform public.expire_dog_join_actions(v_request.dog_id);
  select * into v_request from public.dog_ownership_requests where id = p_request_id;
  if v_request.status <> 'PENDING' then
    return jsonb_build_object('outcome', v_request.status::text);
  end if;
  update public.dog_ownership_requests
  set status = 'CANCELED', responded_at = now(), cancellation_reason = 'CANCELED_BY_ACTOR'
  where id = p_request_id;
  perform public.insert_dog_ownership_notification(
    v_request.primary_user_id_at_creation,
    auth.uid(),
    'dog_ownership_request_canceled',
    v_request.id,
    v_request.dog_id
  );
  return jsonb_build_object('action_id', v_request.id, 'outcome', 'CANCELED');
end;
$$;

create or replace function public.api_respond_dog_ownership_request(
  p_request_id uuid,
  p_approve boolean,
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
  v_primary_user_id uuid;
  v_request public.dog_ownership_requests%rowtype;
begin
  v_feature_outcome := public.dog_ownership_feature_outcome(p_client_platform, p_client_build);
  if v_feature_outcome <> 'OK' then
    return jsonb_build_object('outcome', v_feature_outcome);
  end if;
  select * into v_request from public.dog_ownership_requests
  where id = p_request_id for update;
  if not found then
    return jsonb_build_object('outcome', 'NOT_FOUND');
  end if;
  if v_request.primary_user_id_at_creation is distinct from auth.uid() then
    return jsonb_build_object('outcome', 'FORBIDDEN');
  end if;
  perform 1 from public.dogs
  where id = v_request.dog_id and lifecycle_state = 'ACTIVE' and deleted_at is null
  for update;
  if not found then
    return jsonb_build_object('outcome', 'DOG_UNAVAILABLE');
  end if;
  select user_id into v_primary_user_id
  from public.dog_members
  where dog_id = v_request.dog_id and role = 'PRIMARY_OWNER' and left_at is null;
  if v_primary_user_id is distinct from auth.uid()
    or v_primary_user_id is distinct from v_request.primary_user_id_at_creation then
    return jsonb_build_object('outcome', 'FORBIDDEN');
  end if;
  perform public.expire_dog_join_actions(v_request.dog_id);
  select * into v_request from public.dog_ownership_requests where id = p_request_id;
  if v_request.status <> 'PENDING' then
    return jsonb_build_object('outcome', v_request.status::text);
  end if;
  if not p_approve then
    update public.dog_ownership_requests set status = 'DECLINED', responded_at = now()
    where id = p_request_id;
    perform public.insert_dog_ownership_notification(
      v_request.requester_user_id, auth.uid(), 'dog_ownership_request_declined',
      v_request.id, v_request.dog_id
    );
    return jsonb_build_object('action_id', v_request.id, 'outcome', 'DECLINED');
  end if;
  if not public.are_accepted_friends(auth.uid(), v_request.requester_user_id) then
    return jsonb_build_object('outcome', 'NOT_FRIENDS');
  end if;
  select count(*)::integer into v_active_owner_count
  from public.dog_members where dog_id = v_request.dog_id and left_at is null;
  if v_active_owner_count >= 8 then
    return jsonb_build_object('outcome', 'CAPACITY_REACHED');
  end if;
  if exists (
    select 1 from public.dog_members
    where dog_id = v_request.dog_id
      and user_id = v_request.requester_user_id
      and left_at is null
  ) then
    return jsonb_build_object('outcome', 'ALREADY_MEMBER');
  end if;

  insert into public.dog_members (dog_id, user_id, role)
  values (v_request.dog_id, v_request.requester_user_id, 'CO_OWNER');
  update public.dog_ownership_requests set status = 'ACCEPTED', responded_at = now()
  where id = p_request_id;
  update public.dogs set ownership_version = ownership_version + 1
  where id = v_request.dog_id;
  perform public.insert_dog_ownership_notification(
    v_request.requester_user_id,
    auth.uid(),
    'dog_ownership_request_approved',
    v_request.id,
    v_request.dog_id
  );
  perform public.notify_existing_co_owners_of_join(
    v_request.dog_id, v_request.requester_user_id, v_primary_user_id
  );
  return jsonb_build_object('action_id', v_request.id, 'outcome', 'APPROVED');
end;
$$;

-- Friendship removal invalidates authority without affecting existing ownership.
create or replace function public.cancel_dog_join_actions_after_friendship_end()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_first_user_id uuid;
  v_invite public.dog_invites%rowtype;
  v_request public.dog_ownership_requests%rowtype;
  v_second_user_id uuid;
begin
  if tg_op = 'UPDATE' and new.status = 'APPROVED' then
    return new;
  end if;
  v_first_user_id := old.requester_id;
  v_second_user_id := old.requestee_id;

  for v_invite in
    select * from public.dog_invites
    where status = 'PENDING'
      and (
        (primary_user_id_at_creation = v_first_user_id and invitee_user_id = v_second_user_id)
        or (primary_user_id_at_creation = v_second_user_id and invitee_user_id = v_first_user_id)
      )
    for update
  loop
    if v_invite.expires_at <= now() then
      update public.dog_invites
      set status = 'EXPIRED', responded_at = v_invite.expires_at
      where id = v_invite.id;
    else
      update public.dog_invites
      set status = 'CANCELED', responded_at = now(), cancellation_reason = 'FRIENDSHIP_ENDED'
      where id = v_invite.id;
      perform public.insert_dog_ownership_notification(
        v_invite.invitee_user_id,
        v_invite.primary_user_id_at_creation,
        'dog_ownership_invite_canceled',
        v_invite.id,
        v_invite.dog_id
      );
    end if;
  end loop;

  for v_request in
    select * from public.dog_ownership_requests
    where status = 'PENDING'
      and (
        (primary_user_id_at_creation = v_first_user_id and requester_user_id = v_second_user_id)
        or (primary_user_id_at_creation = v_second_user_id and requester_user_id = v_first_user_id)
      )
    for update
  loop
    if v_request.expires_at <= now() then
      update public.dog_ownership_requests
      set status = 'EXPIRED', responded_at = v_request.expires_at
      where id = v_request.id;
    else
      update public.dog_ownership_requests
      set status = 'CANCELED', responded_at = now(), cancellation_reason = 'FRIENDSHIP_ENDED'
      where id = v_request.id;
      perform public.insert_dog_ownership_notification(
        v_request.primary_user_id_at_creation,
        v_request.requester_user_id,
        'dog_ownership_request_canceled',
        v_request.id,
        v_request.dog_id
      );
    end if;
  end loop;

  return coalesce(new, old);
end;
$$;

create trigger cancel_dog_join_actions_after_friendship_end_trigger
after delete or update of status on public.friendships
for each row execute function public.cancel_dog_join_actions_after_friendship_end();

create or replace function public.cancel_dog_join_actions_after_primary_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite public.dog_invites%rowtype;
  v_request public.dog_ownership_requests%rowtype;
begin
  if new.owner is not distinct from old.owner then
    return new;
  end if;
  for v_invite in
    select * from public.dog_invites
    where dog_id = new.id and status = 'PENDING'
    for update
  loop
    if v_invite.expires_at <= now() then
      update public.dog_invites
      set status = 'EXPIRED', responded_at = v_invite.expires_at
      where id = v_invite.id;
    else
      update public.dog_invites
      set status = 'CANCELED', responded_at = now(), cancellation_reason = 'PRIMARY_CHANGED'
      where id = v_invite.id;
      perform public.insert_dog_ownership_notification(
        v_invite.invitee_user_id,
        old.owner,
        'dog_ownership_invite_canceled',
        v_invite.id,
        v_invite.dog_id
      );
    end if;
  end loop;
  for v_request in
    select * from public.dog_ownership_requests
    where dog_id = new.id and status = 'PENDING'
    for update
  loop
    if v_request.expires_at <= now() then
      update public.dog_ownership_requests
      set status = 'EXPIRED', responded_at = v_request.expires_at
      where id = v_request.id;
    else
      update public.dog_ownership_requests
      set status = 'CANCELED', responded_at = now(), cancellation_reason = 'PRIMARY_CHANGED'
      where id = v_request.id;
      perform public.insert_dog_ownership_notification(
        v_request.requester_user_id,
        old.owner,
        'dog_ownership_request_canceled',
        v_request.id,
        v_request.dog_id
      );
    end if;
  end loop;
  return new;
end;
$$;

create trigger cancel_dog_join_actions_after_primary_change_trigger
after update of owner on public.dogs
for each row execute function public.cancel_dog_join_actions_after_primary_change();

revoke all on function public.cancel_dog_join_actions_after_friendship_end()
  from public, anon, authenticated;
revoke all on function public.cancel_dog_join_actions_after_primary_change()
  from public, anon, authenticated;

revoke all on function public.api_get_dog_ownership_capabilities(
  uuid, public.app_platform, integer
) from public, anon;
revoke all on function public.api_create_dog_invite(
  uuid, uuid, uuid, public.app_platform, integer
) from public, anon;
revoke all on function public.api_cancel_dog_invite(
  uuid, public.app_platform, integer
) from public, anon;
revoke all on function public.api_respond_dog_invite(
  uuid, boolean, boolean, public.app_platform, integer
) from public, anon;
revoke all on function public.api_create_dog_ownership_request(
  uuid, uuid, public.app_platform, integer
) from public, anon;
revoke all on function public.api_cancel_dog_ownership_request(
  uuid, public.app_platform, integer
) from public, anon;
revoke all on function public.api_respond_dog_ownership_request(
  uuid, boolean, public.app_platform, integer
) from public, anon;

grant execute on function public.api_get_dog_ownership_capabilities(
  uuid, public.app_platform, integer
) to authenticated;
grant execute on function public.api_create_dog_invite(
  uuid, uuid, uuid, public.app_platform, integer
) to authenticated;
grant execute on function public.api_cancel_dog_invite(
  uuid, public.app_platform, integer
) to authenticated;
grant execute on function public.api_respond_dog_invite(
  uuid, boolean, boolean, public.app_platform, integer
) to authenticated;
grant execute on function public.api_create_dog_ownership_request(
  uuid, uuid, public.app_platform, integer
) to authenticated;
grant execute on function public.api_cancel_dog_ownership_request(
  uuid, public.app_platform, integer
) to authenticated;
grant execute on function public.api_respond_dog_ownership_request(
  uuid, boolean, public.app_platform, integer
) to authenticated;
