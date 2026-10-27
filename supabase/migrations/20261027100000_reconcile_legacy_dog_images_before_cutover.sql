-- Run this service-only reconciliation during the release write pause, after
-- legacy clients have stopped changing dog photos and before copy jobs drain.
-- It is additive because earlier ownership migrations are already on staging.
create table private.legacy_dog_photo_write_control (
  singleton boolean primary key default true check (singleton),
  writes_enabled boolean not null default true
);
insert into private.legacy_dog_photo_write_control (singleton, writes_enabled)
values (true, true);
revoke all on private.legacy_dog_photo_write_control from public, anon, authenticated;

create or replace function public.set_legacy_dog_photo_writes_enabled(p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if auth.role() is distinct from 'service_role' or p_enabled is null then
    raise exception 'service_role_required' using errcode = '42501';
  end if;

  -- The row lock serializes the switch with Storage writes and reconciliation.
  update private.legacy_dog_photo_write_control
  set writes_enabled = p_enabled
  where singleton = true;
  return p_enabled;
end;
$$;
revoke all on function public.set_legacy_dog_photo_writes_enabled(boolean)
  from public, anon, authenticated;
grant execute on function public.set_legacy_dog_photo_writes_enabled(boolean)
  to service_role;

create or replace function public.guard_legacy_dog_photo_storage_write()
returns trigger
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  v_path text;
  v_owner_id uuid;
  v_dog_id uuid;
  v_writes_enabled boolean;
begin
  if auth.role() = 'service_role' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  -- A Storage move checks both its source and destination.
  if tg_op in ('UPDATE', 'DELETE') and old.bucket_id = 'users' then
    v_path := old.name;
    if v_path ~ '^[0-9a-f-]{36}/dogs/[0-9a-f-]{36}/(primary|other)/[^/]+$' then
      select writes_enabled into v_writes_enabled
      from private.legacy_dog_photo_write_control where singleton = true
      for share;
      if not v_writes_enabled then
        raise exception 'legacy_dog_photo_writes_paused' using errcode = '42501';
      end if;
      v_owner_id := split_part(v_path, '/', 1)::uuid;
      v_dog_id := split_part(v_path, '/', 3)::uuid;
      if auth.uid() is distinct from v_owner_id or not exists (
        select 1 from public.dogs as dog
        where dog.id = v_dog_id and dog.owner = v_owner_id
          and dog.lifecycle_state = 'ACTIVE' and dog.deleted_at is null
          and (select count(*) from public.dog_members as member
               where member.dog_id = dog.id and member.left_at is null) = 1
      ) then
        raise exception 'legacy_dog_photo_write_forbidden' using errcode = '42501';
      end if;
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.bucket_id = 'users' then
    v_path := new.name;
    if v_path ~ '^[0-9a-f-]{36}/dogs/[0-9a-f-]{36}/(primary|other)/[^/]+$' then
      select writes_enabled into v_writes_enabled
      from private.legacy_dog_photo_write_control where singleton = true
      for share;
      if not v_writes_enabled then
        raise exception 'legacy_dog_photo_writes_paused' using errcode = '42501';
      end if;
      v_owner_id := split_part(v_path, '/', 1)::uuid;
      v_dog_id := split_part(v_path, '/', 3)::uuid;
      if auth.uid() is distinct from v_owner_id or not exists (
        select 1 from public.dogs as dog
        where dog.id = v_dog_id and dog.owner = v_owner_id
          and dog.lifecycle_state = 'ACTIVE' and dog.deleted_at is null
          and (select count(*) from public.dog_members as member
               where member.dog_id = dog.id and member.left_at is null) = 1
      ) then
        raise exception 'legacy_dog_photo_write_forbidden' using errcode = '42501';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_legacy_dog_photo_storage_write_trigger on storage.objects;
create trigger guard_legacy_dog_photo_storage_write_trigger
before insert or update or delete on storage.objects
for each row execute function public.guard_legacy_dog_photo_storage_write();

revoke all on function public.guard_legacy_dog_photo_storage_write()
  from public, anon, authenticated;

create or replace function public.reconcile_legacy_dog_images_before_cutover()
returns jsonb
language plpgsql
security definer
set search_path = public, private, storage, pg_temp
as $$
declare
  v_dog public.dogs%rowtype;
  v_object record;
  v_image_id uuid;
  v_old_image record;
  v_primary_image_id uuid;
  v_added integer := 0;
  v_retired integer := 0;
  v_primary_changed integer := 0;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;

  perform 1 from private.legacy_dog_photo_write_control
  where singleton = true and writes_enabled = false
  for share;
  if not found then
    raise exception 'legacy_dog_photo_writes_must_be_paused';
  end if;

  -- A concurrent worker could finish a copy after its source was retired.
  if exists (
    select 1 from private.storage_jobs
    where operation = 'COPY_LEGACY_DOG_IMAGE' and state = 'PROCESSING'
  ) then
    raise exception 'legacy_copy_job_in_progress';
  end if;

  for v_dog in
    select dog.*
    from public.dogs as dog
    where dog.lifecycle_state = 'ACTIVE'
      and dog.deleted_at is null
      and dog.owner is not null
      and (select count(*) from public.dog_members as member
           where member.dog_id = dog.id and member.left_at is null) = 1
    order by dog.id
    for update
  loop
    -- Reject dog objects in another user's folder rather than assigning them
    -- silently to a dog or overlooking an unauthorized legacy write.
    if exists (
      select 1 from storage.objects as object
      where object.bucket_id = 'users'
        and object.name ~ ('^[0-9a-f-]+/dogs/' || v_dog.id::text || '/(primary|other)/[^/]+$')
        and split_part(object.name, '/', 1) <> v_dog.owner::text
    ) then
      raise exception 'legacy_dog_image_owner_path_mismatch for dog %', v_dog.id;
    end if;

    for v_object in
      select object.name, object.created_at
      from storage.objects as object
      where object.bucket_id = 'users'
        and object.name ~ ('^' || v_dog.owner::text || '/dogs/' || v_dog.id::text || '/(primary|other)/[^/]+$')
      order by object.created_at, object.name
    loop
      select image.id into v_image_id
      from public.dog_images as image
      where image.dog_id = v_dog.id
        and (
          (image.bucket_id = 'users' and image.storage_path = v_object.name)
          or exists (
            select 1 from private.storage_jobs as job
            where job.image_id = image.id
              and job.operation = 'COPY_LEGACY_DOG_IMAGE'
              and job.source_bucket = 'users'
              and job.source_path = v_object.name
          )
        )
      limit 1;

      -- A photo intentionally deleted in the new client must not be revived
      -- merely because its retained legacy source is still present.
      if v_image_id is null then
        insert into public.dog_images (
          dog_id, bucket_id, storage_path, uploader_member_id, created_at
        ) values (
          v_dog.id, 'users', v_object.name, null, v_object.created_at
        ) returning id into v_image_id;

        insert into private.storage_jobs (
          operation, dog_id, image_id, source_bucket, source_path,
          destination_bucket, destination_path
        ) values (
          'COPY_LEGACY_DOG_IMAGE', v_dog.id, v_image_id, 'users', v_object.name,
          'dogs', v_dog.id::text || '/' || v_image_id::text || '.' ||
            case
              when lower(substring(v_object.name from '\.([a-zA-Z0-9]+)$'))
                in ('jpg', 'jpeg', 'png', 'webp', 'gif', 'heic')
              then lower(substring(v_object.name from '\.([a-zA-Z0-9]+)$'))
              else 'bin'
            end
        );
        v_added := v_added + 1;
      end if;
    end loop;

    -- A legacy move or delete removes the original object. Retire its copied
    -- metadata and private copy so the new gallery reflects the old client.
    for v_old_image in
      select image.id, image.bucket_id, image.storage_path
      from public.dog_images as image
      where image.dog_id = v_dog.id
        and image.upload_state = 'ACTIVE'
        and image.deleted_at is null
        and exists (
          select 1 from private.storage_jobs as job
          where job.image_id = image.id
            and job.operation = 'COPY_LEGACY_DOG_IMAGE'
            and job.source_bucket = 'users'
            and not exists (
              select 1 from storage.objects as object
              where object.bucket_id = 'users'
                and object.name = job.source_path
            )
        )
    loop
      delete from private.storage_jobs
      where image_id = v_old_image.id
        and operation = 'COPY_LEGACY_DOG_IMAGE'
        and state = 'PENDING';

      update public.dog_images
      set upload_state = 'DELETING', deleted_at = now()
      where id = v_old_image.id;

      if v_old_image.bucket_id = 'dogs' then
        insert into private.storage_jobs (
          operation, dog_id, image_id, destination_bucket, destination_path
        ) values (
          'DELETE_ORPHAN_UPLOAD', v_dog.id, v_old_image.id,
          v_old_image.bucket_id, v_old_image.storage_path
        );
      end if;
      v_retired := v_retired + 1;
    end loop;

    -- The old app expresses main-photo choice through the primary directory.
    select image.id into v_primary_image_id
    from storage.objects as object
    join public.dog_images as image on image.dog_id = v_dog.id
      and image.upload_state = 'ACTIVE' and image.deleted_at is null
      and (
        (image.bucket_id = 'users' and image.storage_path = object.name)
        or exists (
          select 1 from private.storage_jobs as job
          where job.image_id = image.id
            and job.operation = 'COPY_LEGACY_DOG_IMAGE'
            and job.source_path = object.name
        )
      )
    where object.bucket_id = 'users'
      and object.name like v_dog.owner::text || '/dogs/' || v_dog.id::text || '/primary/%'
    order by object.created_at desc, image.id desc
    limit 1;

    if v_primary_image_id is null then
      select image.id into v_primary_image_id
      from public.dog_images as image
      where image.dog_id = v_dog.id
        and image.upload_state = 'ACTIVE' and image.deleted_at is null
      order by image.created_at desc, image.id desc
      limit 1;
    end if;

    if v_dog.primary_image_id is distinct from v_primary_image_id then
      update public.dogs set primary_image_id = v_primary_image_id
      where id = v_dog.id;
      v_primary_changed := v_primary_changed + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'added', v_added, 'retired', v_retired,
    'primary_changed', v_primary_changed
  );
end;
$$;

revoke all on function public.reconcile_legacy_dog_images_before_cutover()
  from public, anon, authenticated;
grant execute on function public.reconcile_legacy_dog_images_before_cutover()
  to service_role;
