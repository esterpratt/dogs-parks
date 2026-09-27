-- Harden the undocumented ownership prototype before adding shared-ownership features.
-- The feature remains disabled; these changes preserve compatible solo-dog operations.

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
      and dog.deleted_at is null
      and member.dog_id::text = split_part(p_object_name, '/', 1)
  );
$$;

revoke all on function public.is_active_dog_member(uuid) from public, anon;
revoke all on function public.is_solo_primary_dog_owner(uuid) from public, anon;
revoke all on function public.can_access_dog_storage_object(text) from public, anon;
grant execute on function public.is_active_dog_member(uuid) to authenticated, service_role;
grant execute on function public.is_solo_primary_dog_owner(uuid) to authenticated, service_role;
grant execute on function public.can_access_dog_storage_object(text) to authenticated, service_role;

drop policy if exists "dog_members_delete_primary" on public.dog_members;
drop policy if exists "dog_members_insert_primary" on public.dog_members;
drop policy if exists "dog_members_select_public" on public.dog_members;
drop policy if exists "dog_members_update_primary" on public.dog_members;

create policy "dog_members_select_active_owners"
on public.dog_members
for select
to authenticated
using (public.is_active_dog_member(dog_id));

revoke insert, update, delete on table public.dog_members from anon, authenticated;

drop policy if exists "dog_invites_insert_primary" on public.dog_invites;
revoke insert, update, delete on table public.dog_invites from anon, authenticated;

drop policy if exists "dog_images_insert_owner_editor" on public.dog_images;
drop policy if exists "dog_images_update_owner_editor" on public.dog_images;
drop policy if exists "dog_images_delete_owner_editor" on public.dog_images;
revoke insert, update, delete on table public.dog_images from anon, authenticated;

drop policy if exists "Enable read access for all users" on public.dogs;
drop policy if exists "Enable insert for authenticated users only" on public.dogs;
drop policy if exists "enable update for dog's owner only" on public.dogs;
drop policy if exists "enable delete for dog's owner only" on public.dogs;
drop policy if exists "dogs_update_owner_editor" on public.dogs;

create policy "dogs_insert_self_legacy"
on public.dogs
for insert
to authenticated
with check (owner = auth.uid() and deleted_at is null);

create policy "dogs_update_solo_primary_legacy"
on public.dogs
for update
to authenticated
using (public.is_solo_primary_dog_owner(id))
with check (public.is_solo_primary_dog_owner(id) and owner = auth.uid());

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
    on conflict (dog_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists bootstrap_legacy_dog_primary_member_trigger on public.dogs;
create trigger bootstrap_legacy_dog_primary_member_trigger
after insert on public.dogs
for each row execute function public.bootstrap_legacy_dog_primary_member();

revoke all on function public.bootstrap_legacy_dog_primary_member() from public, anon, authenticated;

drop policy if exists "all users can select 1u7jr_0" on storage.objects;
drop policy if exists "only auth can insert update delete 1u7jr_0" on storage.objects;
drop policy if exists "only auth can insert update delete 1u7jr_1" on storage.objects;
drop policy if exists "only auth can insert update delete 1u7jr_3" on storage.objects;

create policy "dog objects select active owners"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'dogs'
  and public.can_access_dog_storage_object(name)
);

create policy "dog objects insert active owners"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'dogs'
  and public.can_access_dog_storage_object(name)
);

create policy "dog objects update active owners"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'dogs'
  and public.can_access_dog_storage_object(name)
)
with check (
  bucket_id = 'dogs'
  and public.can_access_dog_storage_object(name)
);

create policy "dog objects delete active owners"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'dogs'
  and public.can_access_dog_storage_object(name)
);

create or replace function public.notify_dog_invite_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_primary_owner uuid;
  v_notification_type public.notification_type;
  v_target_type constant public.notification_target_type := 'DOG_INVITE';
begin
  if tg_op = 'INSERT' then
    if new.status = 'PENDING' then
      v_notification_type := case
        when new.is_primary_transfer then 'dog_primary_transfer_invite'
        else 'dog_invite'
      end;

      insert into public.notifications (
        receiver_id, sender_id, type, target_type, target_id, data, is_ready
      )
      values (
        new.invitee_user_id,
        new.inviter_user_id,
        v_notification_type,
        v_target_type,
        new.id,
        jsonb_build_object(
          'dog_id', new.dog_id,
          'invite_id', new.id,
          'role_offered', new.role_offered,
          'is_primary_transfer', new.is_primary_transfer
        ),
        false
      );
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'PENDING' and new.status in ('ACCEPTED', 'DECLINED') then
    select member.user_id
    into v_primary_owner
    from public.dog_members as member
    where member.dog_id = new.dog_id
      and member.role = 'PRIMARY_OWNER'
    limit 1;

    v_notification_type := case
      when new.status = 'ACCEPTED' then 'dog_invite_accept'
      else 'dog_invite_decline'
    end;

    insert into public.notifications (
      receiver_id, sender_id, type, target_type, target_id, data, is_ready
    )
    values (
      new.inviter_user_id,
      new.invitee_user_id,
      v_notification_type,
      v_target_type,
      new.id,
      jsonb_build_object(
        'dog_id', new.dog_id,
        'invite_id', new.id,
        'role_offered', new.role_offered,
        'is_primary_transfer', new.is_primary_transfer
      ),
      false
    );

    if v_primary_owner is not null and v_primary_owner <> new.inviter_user_id then
      insert into public.notifications (
        receiver_id, sender_id, type, target_type, target_id, data, is_ready
      )
      values (
        v_primary_owner,
        new.invitee_user_id,
        v_notification_type,
        v_target_type,
        new.id,
        jsonb_build_object(
          'dog_id', new.dog_id,
          'invite_id', new.id,
          'role_offered', new.role_offered,
          'is_primary_transfer', new.is_primary_transfer
        ),
        false
      );
    end if;

    if new.status = 'ACCEPTED' and new.is_primary_transfer then
      insert into public.notifications (
        receiver_id, sender_id, type, target_type, target_id, data, is_ready
      )
      values (
        new.invitee_user_id,
        new.inviter_user_id,
        'dog_primary_transfer_accept',
        v_target_type,
        new.id,
        jsonb_build_object(
          'dog_id', new.dog_id,
          'invite_id', new.id,
          'role_offered', new.role_offered,
          'is_primary_transfer', new.is_primary_transfer
        ),
        false
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.notify_dog_invite_change() from public, anon, authenticated;

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
  ) then
    raise exception 'not_primary_owner';
  end if;

  if not exists (
    select 1
    from public.dog_members as member
    where member.dog_id = p_dog_id
      and member.user_id = p_invitee_user_id
      and member.role = 'EDITOR'
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
  values (p_dog_id, auth.uid(), p_invitee_user_id, 'EDITOR', true)
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
      and member.role = 'EDITOR'
  ) then
    raise exception 'invitee_not_co_owner';
  end if;

  update public.dog_members
  set role = 'EDITOR'
  where dog_id = v_invite.dog_id
    and user_id = v_current_primary;

  update public.dog_members
  set role = 'PRIMARY_OWNER'
  where dog_id = v_invite.dog_id
    and user_id = v_invite.invitee_user_id;

  update public.dogs
  set owner = v_invite.invitee_user_id
  where id = v_invite.dog_id;

  update public.dog_invites
  set status = 'ACCEPTED',
      responded_at = now()
  where id = v_invite.id;
end;
$$;

create or replace function public.delete_dog(dog_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_dog_id uuid := dog_id;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  perform 1
  from public.dogs as dog
  where dog.id = v_dog_id
    and dog.deleted_at is null
  for update;

  if not found then
    raise exception 'dog_not_found';
  end if;

  if not public.is_solo_primary_dog_owner(v_dog_id) then
    raise exception 'solo_primary_owner_required';
  end if;

  update public.dogs
  set deleted_at = now()
  where id = v_dog_id;
end;
$$;

revoke all on function public.accept_dog_invite(uuid) from public, anon;
revoke all on function public.accept_primary_transfer(uuid) from public, anon;
revoke all on function public.cancel_dog_invite(uuid) from public, anon;
revoke all on function public.create_dog_invite(uuid, uuid, public.dog_member_role) from public, anon;
revoke all on function public.create_primary_transfer_invite(uuid, uuid) from public, anon;
revoke all on function public.decline_dog_invite(uuid) from public, anon;
revoke all on function public.delete_dog(uuid) from public, anon;

grant execute on function public.accept_dog_invite(uuid) to authenticated, service_role;
grant execute on function public.accept_primary_transfer(uuid) to authenticated, service_role;
grant execute on function public.cancel_dog_invite(uuid) to authenticated, service_role;
grant execute on function public.create_dog_invite(uuid, uuid, public.dog_member_role) to authenticated, service_role;
grant execute on function public.create_primary_transfer_invite(uuid, uuid) to authenticated, service_role;
grant execute on function public.decline_dog_invite(uuid) to authenticated, service_role;
grant execute on function public.delete_dog(uuid) to authenticated, service_role;
