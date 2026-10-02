-- Reconcile the unused ownership prototype into the approved membership authority.
-- Shared ownership remains disabled until later RPC, client, and rollout slices land.

alter type public.dog_member_role rename value 'EDITOR' to 'CO_OWNER';

create type public.dog_member_departure_reason as enum (
  'LEFT',
  'ACCOUNT_ERASED',
  'DOG_DELETED'
);

create type public.dog_lifecycle_state as enum (
  'ACTIVE',
  'DELETING',
  'DELETED'
);

create type public.app_feature as enum (
  'SHARED_DOG_OWNERSHIP'
);

create type public.app_platform as enum (
  'IOS',
  'ANDROID',
  'WEB'
);

alter table public.dogs
  add column ownership_version bigint not null default 1,
  add column lifecycle_state public.dog_lifecycle_state not null default 'ACTIVE';

update public.dogs
set lifecycle_state = 'DELETED'
where deleted_at is not null;

alter table public.dogs
  add constraint dogs_active_owner_required
    check (lifecycle_state <> 'ACTIVE' or owner is not null),
  add constraint dogs_lifecycle_deleted_at_consistent
    check (
      (lifecycle_state = 'ACTIVE' and deleted_at is null)
      or (lifecycle_state <> 'ACTIVE' and deleted_at is not null)
    );

alter table public.dog_members
  rename column created_at to joined_at;

alter table public.dog_members
  add column left_at timestamptz,
  add column departure_reason public.dog_member_departure_reason,
  alter column user_id drop not null;

alter table public.dog_members
  drop constraint dog_members_user_id_fkey,
  add constraint dog_members_user_id_fkey
    foreign key (user_id) references public.users(id) on delete set null;

-- Existing soft-deleted dogs are terminal history, so their prototype membership
-- rows must not count as active tenures after reconciliation.
update public.dog_members as member
set left_at = dog.deleted_at,
    departure_reason = 'DOG_DELETED'
from public.dogs as dog
where dog.id = member.dog_id
  and dog.lifecycle_state = 'DELETED'
  and member.left_at is null;

-- Membership is authoritative when the prototype already has a primary.
update public.dogs as dog
set owner = primary_member.user_id
from public.dog_members as primary_member
where primary_member.dog_id = dog.id
  and primary_member.role = 'PRIMARY_OWNER'
  and primary_member.left_at is null
  and dog.lifecycle_state = 'ACTIVE'
  and dog.owner is distinct from primary_member.user_id;

-- Repair active prototype dogs that have a legacy owner but no primary row.
update public.dog_members as member
set role = 'PRIMARY_OWNER'
from public.dogs as dog
where dog.id = member.dog_id
  and dog.lifecycle_state = 'ACTIVE'
  and dog.owner = member.user_id
  and member.left_at is null
  and not exists (
    select 1
    from public.dog_members as primary_member
    where primary_member.dog_id = dog.id
      and primary_member.role = 'PRIMARY_OWNER'
      and primary_member.left_at is null
  );

insert into public.dog_members (dog_id, user_id, role)
select dog.id, dog.owner, 'PRIMARY_OWNER'
from public.dogs as dog
where dog.lifecycle_state = 'ACTIVE'
  and dog.owner is not null
  and not exists (
    select 1
    from public.dog_members as primary_member
    where primary_member.dog_id = dog.id
      and primary_member.role = 'PRIMARY_OWNER'
      and primary_member.left_at is null
  );

drop index public.dog_members_unique_dog_user;
drop index public.dog_members_one_primary;
drop index public.dog_members_user_id_idx;

create unique index dog_members_active_dog_user_unique
on public.dog_members (dog_id, user_id)
where left_at is null;

create unique index dog_members_one_active_primary
on public.dog_members (dog_id)
where role = 'PRIMARY_OWNER' and left_at is null;

create index dog_members_active_user_id_idx
on public.dog_members (user_id)
where left_at is null;

create index dog_members_active_tenure_idx
on public.dog_members (dog_id, joined_at, id)
where left_at is null;

alter table public.dog_members
  add constraint dog_members_active_user_required
    check (left_at is not null or user_id is not null),
  add constraint dog_members_departure_consistent
    check (
      (left_at is null and departure_reason is null)
      or (left_at is not null and departure_reason is not null)
    ),
  add constraint dog_members_active_role_supported
    check (
      left_at is not null
      or role in ('PRIMARY_OWNER', 'CO_OWNER')
    );

-- The current Auth -> profile -> solo dog cascade can null user_id before the
-- dog cascade removes its memberships. Close those tenures first so the new
-- active-user constraint does not break account deletion during this rollout.
create or replace function public.close_dog_memberships_before_user_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.dog_members as member
  set left_at = now(),
      departure_reason = 'ACCOUNT_ERASED'
  where member.user_id = old.id
    and member.left_at is null;

  return old;
end;
$$;

create trigger close_dog_memberships_before_user_delete_trigger
before delete on public.users
for each row execute function public.close_dog_memberships_before_user_delete();

revoke all on function public.close_dog_memberships_before_user_delete()
  from public, anon, authenticated;

create or replace function public.bootstrap_legacy_dog_primary_member()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.owner is not null then
    insert into public.dog_members (dog_id, user_id, role)
    values (new.id, new.owner, 'PRIMARY_OWNER')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.bootstrap_legacy_dog_primary_member()
  from public, anon, authenticated;

create or replace function public.prevent_dog_member_joined_at_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.joined_at is distinct from old.joined_at then
    raise exception 'joined_at_is_immutable' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger prevent_dog_member_joined_at_change_trigger
before update on public.dog_members
for each row execute function public.prevent_dog_member_joined_at_change();

revoke all on function public.prevent_dog_member_joined_at_change() from public, anon, authenticated;

create or replace function public.assert_dog_ownership_invariants(p_dog_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_active_member_count integer;
  v_dog public.dogs%rowtype;
  v_primary_count integer;
  v_primary_user_id uuid;
begin
  select *
  into v_dog
  from public.dogs
  where id = p_dog_id;

  if not found then
    return;
  end if;

  select
    count(*) filter (where member.left_at is null),
    count(*) filter (
      where member.left_at is null
        and member.role = 'PRIMARY_OWNER'
    ),
    (array_agg(member.user_id) filter (
      where member.left_at is null
        and member.role = 'PRIMARY_OWNER'
    ))[1]
  into v_active_member_count, v_primary_count, v_primary_user_id
  from public.dog_members as member
  where member.dog_id = p_dog_id;

  if v_active_member_count > 8 then
    raise exception 'dog_owner_capacity_exceeded' using errcode = '23514';
  end if;

  if v_dog.lifecycle_state = 'ACTIVE' and v_primary_count <> 1 then
    raise exception 'active_dog_requires_exactly_one_primary' using errcode = '23514';
  end if;

  if v_dog.lifecycle_state = 'ACTIVE'
    and v_primary_user_id is distinct from v_dog.owner then
    raise exception 'dog_owner_must_match_primary' using errcode = '23514';
  end if;
end;
$$;

create or replace function public.enforce_dog_member_invariants()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform public.assert_dog_ownership_invariants(old.dog_id);
    return old;
  end if;

  perform public.assert_dog_ownership_invariants(new.dog_id);

  if tg_op = 'UPDATE' and old.dog_id is distinct from new.dog_id then
    perform public.assert_dog_ownership_invariants(old.dog_id);
  end if;

  return new;
end;
$$;

create or replace function public.enforce_dog_row_ownership_invariants()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_dog_ownership_invariants(new.id);
  return new;
end;
$$;

create constraint trigger enforce_dog_member_invariants_trigger
after insert or update or delete on public.dog_members
deferrable initially deferred
for each row execute function public.enforce_dog_member_invariants();

create constraint trigger enforce_dog_row_ownership_invariants_trigger
after insert or update on public.dogs
deferrable initially deferred
for each row execute function public.enforce_dog_row_ownership_invariants();

revoke all on function public.assert_dog_ownership_invariants(uuid)
  from public, anon, authenticated;
revoke all on function public.enforce_dog_member_invariants()
  from public, anon, authenticated;
revoke all on function public.enforce_dog_row_ownership_invariants()
  from public, anon, authenticated;

create or replace function public.is_active_dog_member(p_dog_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.dog_members as member
    join public.dogs as dog on dog.id = member.dog_id
    where member.dog_id = p_dog_id
      and member.user_id = auth.uid()
      and member.left_at is null
      and dog.lifecycle_state = 'ACTIVE'
      and dog.deleted_at is null
  );
$$;

create or replace function public.is_solo_primary_dog_owner(p_dog_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    count(*) = 1
    and bool_and(
      member.user_id = auth.uid()
      and member.role = 'PRIMARY_OWNER'::public.dog_member_role
    )
  from public.dog_members as member
  join public.dogs as dog on dog.id = member.dog_id
  where member.dog_id = p_dog_id
    and member.left_at is null
    and dog.lifecycle_state = 'ACTIVE'
    and dog.deleted_at is null;
$$;

create or replace function public.can_access_dog_storage_object(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage, pg_temp
as $$
  select exists (
    select 1
    from public.dog_members as member
    join public.dogs as dog on dog.id = member.dog_id
    where member.user_id = auth.uid()
      and member.left_at is null
      and dog.lifecycle_state = 'ACTIVE'
      and dog.deleted_at is null
      and member.dog_id::text = split_part(p_object_name, '/', 1)
  );
$$;

drop policy dog_members_select_active_owners on public.dog_members;
create policy dog_members_select_active_owners
on public.dog_members
for select
to authenticated
using (
  left_at is null
  and public.is_active_dog_member(dog_id)
);

-- Keep the solo-dog compatibility RPC operational while moving its state change
-- onto the lifecycle model introduced by this migration.
create or replace function public.delete_dog(dog_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_dog_id uuid := dog_id;
  v_deleted_at timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  perform 1
  from public.dogs as dog
  where dog.id = v_dog_id
    and dog.lifecycle_state = 'ACTIVE'
    and dog.deleted_at is null
  for update;

  if not found then
    raise exception 'dog_not_found';
  end if;

  if not public.is_solo_primary_dog_owner(v_dog_id) then
    raise exception 'solo_primary_owner_required';
  end if;

  update public.dog_members as member
  set left_at = v_deleted_at,
      departure_reason = 'DOG_DELETED'
  where member.dog_id = v_dog_id
    and member.left_at is null;

  update public.dogs
  set deleted_at = v_deleted_at,
      lifecycle_state = 'DELETED'
  where id = v_dog_id;
end;
$$;

-- PostgreSQL enum renames do not rewrite string literals inside PL/pgSQL
-- bodies, so replace both legacy invitation functions with CO_OWNER-aware SQL.
create or replace function public.create_dog_invite(
  p_dog_id uuid,
  p_invitee_user_id uuid,
  p_role_offered public.dog_member_role
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  if p_role_offered <> 'CO_OWNER' then
    raise exception 'invalid_role_offered';
  end if;

  if p_invitee_user_id = auth.uid() then
    raise exception 'self_invite_not_allowed';
  end if;

  if not exists (
    select 1
    from public.dog_members as member
    join public.dogs as dog on dog.id = member.dog_id
    where member.dog_id = p_dog_id
      and member.user_id = auth.uid()
      and member.role = 'PRIMARY_OWNER'
      and member.left_at is null
      and dog.lifecycle_state = 'ACTIVE'
      and dog.deleted_at is null
  ) then
    raise exception 'not_primary_owner';
  end if;

  if exists (
    select 1
    from public.dog_members as member
    where member.dog_id = p_dog_id
      and member.user_id = p_invitee_user_id
      and member.left_at is null
  ) then
    raise exception 'already_member';
  end if;

  if exists (
    select 1
    from public.dog_invites as invite
    where invite.dog_id = p_dog_id
      and invite.invitee_user_id = p_invitee_user_id
      and invite.status = 'PENDING'
  ) then
    raise exception 'pending_invite_exists';
  end if;

  insert into public.dog_invites (
    dog_id, inviter_user_id, invitee_user_id, role_offered, is_primary_transfer
  )
  values (p_dog_id, auth.uid(), p_invitee_user_id, p_role_offered, false)
  returning id into v_invite_id;

  return v_invite_id;
end;
$$;

create or replace function public.accept_dog_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite public.dog_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  select *
  into v_invite
  from public.dog_invites
  where id = p_invite_id
  for update;

  if not found then
    raise exception 'invite_not_found';
  end if;

  if v_invite.status <> 'PENDING' then
    raise exception 'invite_not_pending';
  end if;

  if v_invite.invitee_user_id <> auth.uid() then
    raise exception 'not_invited_user';
  end if;

  if v_invite.is_primary_transfer then
    raise exception 'invite_is_primary_transfer';
  end if;

  if v_invite.role_offered <> 'CO_OWNER' then
    raise exception 'invalid_role_offered';
  end if;

  if not exists (
    select 1
    from public.dogs as dog
    where dog.id = v_invite.dog_id
      and dog.lifecycle_state = 'ACTIVE'
      and dog.deleted_at is null
  ) then
    raise exception 'dog_not_found';
  end if;

  insert into public.dog_members (dog_id, user_id, role)
  values (v_invite.dog_id, v_invite.invitee_user_id, v_invite.role_offered)
  on conflict (dog_id, user_id) where left_at is null
  do update set role = excluded.role;

  update public.dog_invites
  set status = 'ACCEPTED',
      responded_at = now()
  where id = v_invite.id;
end;
$$;

-- Preserve the hardened prototype transfer until the typed transfer slice replaces it.
create or replace function public.create_primary_transfer_invite(
  p_dog_id uuid,
  p_invitee_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  if p_invitee_user_id = auth.uid() then
    raise exception 'self_invite_not_allowed';
  end if;

  perform 1
  from public.dogs as dog
  where dog.id = p_dog_id
    and dog.lifecycle_state = 'ACTIVE'
    and dog.deleted_at is null
  for update;

  if not found then
    raise exception 'dog_not_found';
  end if;

  if not exists (
    select 1
    from public.dog_members as member
    where member.dog_id = p_dog_id
      and member.user_id = auth.uid()
      and member.role = 'PRIMARY_OWNER'
      and member.left_at is null
  ) then
    raise exception 'not_primary_owner';
  end if;

  if not exists (
    select 1
    from public.dog_members as member
    where member.dog_id = p_dog_id
      and member.user_id = p_invitee_user_id
      and member.role = 'CO_OWNER'
      and member.left_at is null
  ) then
    raise exception 'invitee_not_co_owner';
  end if;

  if exists (
    select 1
    from public.dog_invites as invite
    where invite.dog_id = p_dog_id
      and invite.status = 'PENDING'
  ) then
    raise exception 'pending_invite_exists';
  end if;

  insert into public.dog_invites (
    dog_id, inviter_user_id, invitee_user_id, role_offered, is_primary_transfer
  )
  values (p_dog_id, auth.uid(), p_invitee_user_id, 'CO_OWNER', true)
  returning id into v_invite_id;

  return v_invite_id;
end;
$$;

create or replace function public.accept_primary_transfer(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite public.dog_invites%rowtype;
  v_current_primary uuid;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  select *
  into v_invite
  from public.dog_invites
  where id = p_invite_id
  for update;

  if not found then
    raise exception 'invite_not_found';
  end if;

  if v_invite.status <> 'PENDING' then
    raise exception 'invite_not_pending';
  end if;

  if v_invite.invitee_user_id <> auth.uid() then
    raise exception 'not_invited_user';
  end if;

  if not v_invite.is_primary_transfer then
    raise exception 'invite_not_primary_transfer';
  end if;

  perform 1
  from public.dogs as dog
  where dog.id = v_invite.dog_id
    and dog.lifecycle_state = 'ACTIVE'
    and dog.deleted_at is null
  for update;

  if not found then
    raise exception 'dog_not_found';
  end if;

  select member.user_id
  into v_current_primary
  from public.dog_members as member
  where member.dog_id = v_invite.dog_id
    and member.role = 'PRIMARY_OWNER'
    and member.left_at is null
  for update;

  if v_current_primary is null then
    raise exception 'primary_owner_missing';
  end if;

  if v_current_primary <> v_invite.inviter_user_id then
    raise exception 'inviter_not_primary';
  end if;

  if not exists (
    select 1
    from public.dog_members as member
    where member.dog_id = v_invite.dog_id
      and member.user_id = v_invite.invitee_user_id
      and member.role = 'CO_OWNER'
      and member.left_at is null
  ) then
    raise exception 'invitee_not_co_owner';
  end if;

  update public.dog_members
  set role = 'CO_OWNER'
  where dog_id = v_invite.dog_id
    and user_id = v_current_primary
    and left_at is null;

  update public.dog_members
  set role = 'PRIMARY_OWNER'
  where dog_id = v_invite.dog_id
    and user_id = v_invite.invitee_user_id
    and left_at is null;

  update public.dogs
  set owner = v_invite.invitee_user_id,
      ownership_version = ownership_version + 1
  where id = v_invite.dog_id;

  update public.dog_invites
  set status = 'ACCEPTED',
      responded_at = now()
  where id = v_invite.id;
end;
$$;

create table public.app_feature_compatibility (
  feature public.app_feature not null,
  platform public.app_platform not null,
  minimum_build integer not null check (minimum_build >= 0),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (feature, platform)
);

insert into public.app_feature_compatibility (feature, platform, minimum_build, enabled)
values
  ('SHARED_DOG_OWNERSHIP', 'IOS', 0, false),
  ('SHARED_DOG_OWNERSHIP', 'ANDROID', 0, false),
  ('SHARED_DOG_OWNERSHIP', 'WEB', 0, false);

alter table public.app_feature_compatibility enable row level security;

create policy app_feature_compatibility_select_authenticated
on public.app_feature_compatibility
for select
to authenticated
using (true);

revoke all on table public.app_feature_compatibility from public, anon, authenticated;
grant select on table public.app_feature_compatibility to authenticated;
grant all on table public.app_feature_compatibility to service_role;

do $$
begin
  if exists (
    select 1
    from public.dogs as dog
    left join public.dog_members as primary_member
      on primary_member.dog_id = dog.id
      and primary_member.role = 'PRIMARY_OWNER'
      and primary_member.left_at is null
    where dog.lifecycle_state = 'ACTIVE'
    group by dog.id, dog.owner
    having count(primary_member.id) <> 1
      or (array_agg(primary_member.user_id))[1] is distinct from dog.owner
  ) then
    raise exception 'active_dog_ownership_reconciliation_failed';
  end if;

  if exists (
    select 1
    from public.dog_members as member
    where member.left_at is null
    group by member.dog_id
    having count(*) > 8
  ) then
    raise exception 'dog_owner_capacity_reconciliation_failed';
  end if;
end;
$$;
