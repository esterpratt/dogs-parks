-- Move dog photos toward immutable dog-scoped private objects while keeping
-- legacy user-scoped sources available throughout the rollback window.

create type public.dog_image_upload_state as enum (
  'RESERVED',
  'ACTIVE',
  'DELETING'
);

create type public.dog_storage_job_operation as enum (
  'COPY_LEGACY_DOG_IMAGE',
  'DELETE_DOG_ASSETS',
  'DELETE_ORPHAN_UPLOAD'
);

create type public.dog_storage_job_state as enum (
  'PENDING',
  'PROCESSING',
  'COMPLETED'
);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.dog_images
  add column uploader_member_id uuid,
  add column upload_state public.dog_image_upload_state not null default 'ACTIVE',
  add column reservation_expires_at timestamptz,
  add column deleted_at timestamptz;

alter table public.dog_images
  add constraint dog_images_uploader_member_id_fkey
    foreign key (uploader_member_id)
    references public.dog_members(id)
    on delete set null,
  add constraint dog_images_reservation_lifecycle_consistent
    check (
      (
        upload_state = 'RESERVED'
        and reservation_expires_at is not null
        and deleted_at is null
      )
      or (
        upload_state = 'ACTIVE'
        and reservation_expires_at is null
        and deleted_at is null
      )
      or (
        upload_state = 'DELETING'
        and reservation_expires_at is null
        and deleted_at is not null
      )
    );

create unique index dog_images_storage_path_unique
on public.dog_images (storage_path);

create index dog_images_active_gallery_idx
on public.dog_images (dog_id, created_at desc, id desc)
where upload_state = 'ACTIVE' and deleted_at is null;

create index dog_images_live_reservation_idx
on public.dog_images (dog_id, reservation_expires_at)
where upload_state = 'RESERVED' and deleted_at is null;

alter table public.dogs
  add column primary_image_id uuid;

alter table public.dogs
  add constraint dogs_primary_image_id_fkey
    foreign key (primary_image_id)
    references public.dog_images(id)
    on delete set null
    deferrable initially deferred;

update public.dogs as dog
set primary_image_id = image.id
from public.dog_images as image
where image.dog_id = dog.id
  and image.is_primary = true;

drop index public.dog_images_one_primary;
alter table public.dog_images drop column is_primary;

create table private.storage_jobs (
  id uuid primary key default gen_random_uuid(),
  operation public.dog_storage_job_operation not null,
  dog_id uuid,
  image_id uuid,
  source_bucket text,
  source_path text,
  destination_bucket text,
  destination_path text,
  expected_size bigint,
  checksum text,
  state public.dog_storage_job_state not null default 'PENDING',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  finished_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storage_jobs_operation_paths_consistent check (
    (
      operation = 'COPY_LEGACY_DOG_IMAGE'
      and image_id is not null
      and source_bucket is not null
      and source_path is not null
      and destination_bucket is not null
      and destination_path is not null
    )
    or operation in ('DELETE_DOG_ASSETS', 'DELETE_ORPHAN_UPLOAD')
  )
);

create unique index storage_jobs_pending_copy_unique
on private.storage_jobs (image_id, operation)
where operation = 'COPY_LEGACY_DOG_IMAGE' and state <> 'COMPLETED';

create index storage_jobs_claim_idx
on private.storage_jobs (available_at, created_at, id)
where state = 'PENDING';

revoke all on table private.storage_jobs from public, anon, authenticated;

insert into private.storage_jobs (
  operation,
  dog_id,
  image_id,
  source_bucket,
  source_path,
  destination_bucket,
  destination_path
)
select
  'COPY_LEGACY_DOG_IMAGE',
  image.dog_id,
  image.id,
  image.bucket_id,
  image.storage_path,
  'dogs',
  image.dog_id::text || '/' || image.id::text || '.' ||
    case
      when lower(substring(image.storage_path from '\\.([a-zA-Z0-9]+)$'))
        in ('jpg', 'jpeg', 'png', 'webp', 'gif', 'heic')
      then lower(substring(image.storage_path from '\\.([a-zA-Z0-9]+)$'))
      else 'bin'
    end
from public.dog_images as image
where image.bucket_id = 'users';

create or replace function public.prevent_dog_image_storage_identity_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if coalesce(current_setting('app.allow_dog_image_storage_move', true), '') <> 'on'
    and (
      new.dog_id is distinct from old.dog_id
      or new.bucket_id is distinct from old.bucket_id
      or new.storage_path is distinct from old.storage_path
      or new.uploader_member_id is distinct from old.uploader_member_id
    ) then
    raise exception 'dog_image_storage_identity_is_immutable' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger prevent_dog_image_storage_identity_change_trigger
before update on public.dog_images
for each row execute function public.prevent_dog_image_storage_identity_change();

revoke all on function public.prevent_dog_image_storage_identity_change()
  from public, anon, authenticated;

create or replace function public.remove_erased_dog_image_attribution()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.user_id is not null and new.user_id is null then
    perform set_config('app.allow_dog_image_storage_move', 'on', true);

    update public.dog_images
    set uploader_member_id = null
    where uploader_member_id = new.id;
  end if;

  return new;
end;
$$;

create trigger remove_erased_dog_image_attribution_trigger
after update of user_id on public.dog_members
for each row execute function public.remove_erased_dog_image_attribution();

revoke all on function public.remove_erased_dog_image_attribution()
  from public, anon, authenticated;

create or replace function public.can_view_dog_image_object(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.dog_images as image
    join public.dogs as dog on dog.id = image.dog_id
    where image.bucket_id = 'dogs'
      and image.storage_path = p_object_name
      and image.upload_state = 'ACTIVE'
      and image.deleted_at is null
      and dog.lifecycle_state = 'ACTIVE'
      and dog.deleted_at is null
  );
$$;

create or replace function public.can_upload_reserved_dog_image_object(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.dog_images as image
    join public.dog_members as member
      on member.id = image.uploader_member_id
    join public.dogs as dog on dog.id = image.dog_id
    where image.bucket_id = 'dogs'
      and image.storage_path = p_object_name
      and image.upload_state = 'RESERVED'
      and image.deleted_at is null
      and image.reservation_expires_at > now()
      and member.user_id = auth.uid()
      and member.left_at is null
      and dog.lifecycle_state = 'ACTIVE'
      and dog.deleted_at is null
  );
$$;

revoke all on function public.can_view_dog_image_object(text)
  from public, anon, authenticated;
revoke all on function public.can_upload_reserved_dog_image_object(text)
  from public, anon, authenticated;
grant execute on function public.can_view_dog_image_object(text)
  to authenticated, service_role;
grant execute on function public.can_upload_reserved_dog_image_object(text)
  to authenticated, service_role;

drop policy if exists dog_images_select_public on public.dog_images;
create policy dog_images_select_active
on public.dog_images
for select
to anon, authenticated
using (
  upload_state = 'ACTIVE'
  and deleted_at is null
  and exists (
    select 1
    from public.dogs as dog
    where dog.id = dog_images.dog_id
      and dog.lifecycle_state = 'ACTIVE'
      and dog.deleted_at is null
  )
);

drop policy if exists "dog objects select active owners" on storage.objects;
drop policy if exists "dog objects insert active owners" on storage.objects;
drop policy if exists "dog objects update active owners" on storage.objects;
drop policy if exists "dog objects delete active owners" on storage.objects;

create policy "dog objects select authorized viewers"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'dogs'
  and public.can_view_dog_image_object(name)
);

create policy "dog objects insert exact active reservation"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'dogs'
  and public.can_upload_reserved_dog_image_object(name)
);

create or replace function public.api_reserve_dog_image(
  p_dog_id uuid,
  p_extension text
)
returns table (
  id uuid,
  bucket_id text,
  storage_path text,
  upload_state public.dog_image_upload_state,
  reservation_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_extension text := lower(trim(leading '.' from p_extension));
  v_image_id uuid := gen_random_uuid();
  v_member_id uuid;
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  if v_extension not in ('jpg', 'jpeg', 'png', 'webp', 'gif', 'heic') then
    raise exception 'unsupported_image_extension' using errcode = '22023';
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

  select member.id
  into v_member_id
  from public.dog_members as member
  where member.dog_id = p_dog_id
    and member.user_id = auth.uid()
    and member.left_at is null;

  if v_member_id is null then
    raise exception 'not_active_dog_owner' using errcode = '42501';
  end if;

  insert into private.storage_jobs (
    operation,
    dog_id,
    image_id,
    destination_bucket,
    destination_path
  )
  select
    'DELETE_ORPHAN_UPLOAD',
    expired.dog_id,
    expired.id,
    expired.bucket_id,
    expired.storage_path
  from public.dog_images as expired
  where expired.dog_id = p_dog_id
    and expired.upload_state = 'RESERVED'
    and expired.deleted_at is null
    and expired.reservation_expires_at <= v_now
  on conflict do nothing;

  update public.dog_images as expired
  set upload_state = 'DELETING',
      reservation_expires_at = null,
      deleted_at = v_now
  where expired.dog_id = p_dog_id
    and expired.upload_state = 'RESERVED'
    and expired.deleted_at is null
    and expired.reservation_expires_at <= v_now;

  if (
    select count(*)
    from public.dog_images as image
    where image.dog_id = p_dog_id
      and image.deleted_at is null
      and (
        image.upload_state = 'ACTIVE'
        or (
          image.upload_state = 'RESERVED'
          and image.reservation_expires_at > v_now
        )
      )
  ) >= 6 then
    raise exception 'dog_image_capacity_reached' using errcode = '23514';
  end if;

  return query
  insert into public.dog_images (
    id,
    dog_id,
    bucket_id,
    storage_path,
    uploader_member_id,
    upload_state,
    reservation_expires_at
  )
  values (
    v_image_id,
    p_dog_id,
    'dogs',
    p_dog_id::text || '/' || v_image_id::text || '.' || v_extension,
    v_member_id,
    'RESERVED',
    v_now + interval '15 minutes'
  )
  returning
    dog_images.id,
    dog_images.bucket_id,
    dog_images.storage_path,
    dog_images.upload_state,
    dog_images.reservation_expires_at;
end;
$$;

create or replace function public.api_finalize_dog_image(p_image_id uuid)
returns void
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  v_image public.dog_images%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  select image.*
  into v_image
  from public.dog_images as image
  where image.id = p_image_id
  for update;

  if not found then
    raise exception 'dog_image_not_found';
  end if;

  if v_image.upload_state = 'ACTIVE' and v_image.deleted_at is null then
    return;
  end if;

  if v_image.upload_state <> 'RESERVED'
    or v_image.deleted_at is not null
    or v_image.reservation_expires_at <= now() then
    raise exception 'dog_image_reservation_expired';
  end if;

  if not exists (
    select 1
    from public.dog_members as member
    where member.id = v_image.uploader_member_id
      and member.user_id = auth.uid()
      and member.left_at is null
  ) then
    raise exception 'not_image_reserver' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from storage.objects as object
    where object.bucket_id = v_image.bucket_id
      and object.name = v_image.storage_path
      and coalesce((object.metadata ->> 'size')::bigint, 0) > 0
      and coalesce(object.metadata ->> 'mimetype', '') like 'image/%'
  ) then
    raise exception 'reserved_object_missing' using errcode = '23514';
  end if;

  update public.dog_images
  set upload_state = 'ACTIVE',
      reservation_expires_at = null
  where id = v_image.id;

  update public.dogs
  set primary_image_id = v_image.id
  where id = v_image.dog_id
    and primary_image_id is null;
end;
$$;

create or replace function public.api_set_primary_dog_image(p_image_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_dog_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  select image.dog_id
  into v_dog_id
  from public.dog_images as image
  join public.dogs as dog on dog.id = image.dog_id
  where image.id = p_image_id
    and image.upload_state = 'ACTIVE'
    and image.deleted_at is null
    and dog.lifecycle_state = 'ACTIVE'
    and dog.deleted_at is null;

  if v_dog_id is null then
    raise exception 'dog_image_not_found';
  end if;

  if not public.is_active_dog_member(v_dog_id) then
    raise exception 'not_active_dog_owner' using errcode = '42501';
  end if;

  update public.dogs
  set primary_image_id = p_image_id
  where id = v_dog_id;
end;
$$;

create or replace function public.api_delete_dog_image(p_image_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_caller_member public.dog_members%rowtype;
  v_image public.dog_images%rowtype;
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  select image.*
  into v_image
  from public.dog_images as image
  join public.dogs as dog on dog.id = image.dog_id
  where image.id = p_image_id
    and image.upload_state = 'ACTIVE'
    and image.deleted_at is null
    and dog.lifecycle_state = 'ACTIVE'
    and dog.deleted_at is null
  for update of image;

  if not found then
    raise exception 'dog_image_not_found';
  end if;

  perform 1 from public.dogs where id = v_image.dog_id for update;

  select member.*
  into v_caller_member
  from public.dog_members as member
  where member.dog_id = v_image.dog_id
    and member.user_id = auth.uid()
    and member.left_at is null;

  if v_caller_member.id is null
    or (
      v_caller_member.role <> 'PRIMARY_OWNER'
      and v_image.uploader_member_id is distinct from v_caller_member.id
    ) then
    raise exception 'dog_image_delete_forbidden' using errcode = '42501';
  end if;

  update public.dog_images
  set upload_state = 'DELETING',
      deleted_at = v_now
  where id = v_image.id;

  if exists (
    select 1
    from public.dogs
    where id = v_image.dog_id
      and primary_image_id = v_image.id
  ) then
    update public.dogs
    set primary_image_id = (
      select candidate.id
      from public.dog_images as candidate
      where candidate.dog_id = v_image.dog_id
        and candidate.id <> v_image.id
        and candidate.upload_state = 'ACTIVE'
        and candidate.deleted_at is null
      order by candidate.created_at desc, candidate.id desc
      limit 1
    )
    where id = v_image.dog_id;
  end if;

  insert into private.storage_jobs (
    operation,
    dog_id,
    image_id,
    destination_bucket,
    destination_path
  )
  values (
    'DELETE_ORPHAN_UPLOAD',
    v_image.dog_id,
    v_image.id,
    v_image.bucket_id,
    v_image.storage_path
  );
end;
$$;

revoke all on function public.api_reserve_dog_image(uuid, text) from public, anon;
revoke all on function public.api_finalize_dog_image(uuid) from public, anon;
revoke all on function public.api_set_primary_dog_image(uuid) from public, anon;
revoke all on function public.api_delete_dog_image(uuid) from public, anon;
grant execute on function public.api_reserve_dog_image(uuid, text) to authenticated, service_role;
grant execute on function public.api_finalize_dog_image(uuid) to authenticated, service_role;
grant execute on function public.api_set_primary_dog_image(uuid) to authenticated, service_role;
grant execute on function public.api_delete_dog_image(uuid) to authenticated, service_role;

create or replace function public.claim_dog_storage_jobs(p_limit integer default 10)
returns table (
  id uuid,
  operation public.dog_storage_job_operation,
  dog_id uuid,
  image_id uuid,
  source_bucket text,
  source_path text,
  destination_bucket text,
  destination_path text,
  expected_size bigint,
  checksum text,
  attempts integer
)
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'invalid_storage_job_limit' using errcode = '22023';
  end if;

  return query
  with claimed as (
    select job.id
    from private.storage_jobs as job
    where job.state = 'PENDING'
      and job.available_at <= now()
    order by job.available_at, job.created_at, job.id
    for update skip locked
    limit p_limit
  )
  update private.storage_jobs as job
  set state = 'PROCESSING',
      attempts = job.attempts + 1,
      locked_at = now(),
      updated_at = now(),
      error_code = null
  from claimed
  where job.id = claimed.id
  returning
    job.id,
    job.operation,
    job.dog_id,
    job.image_id,
    job.source_bucket,
    job.source_path,
    job.destination_bucket,
    job.destination_path,
    job.expected_size,
    job.checksum,
    job.attempts;
end;
$$;

create or replace function public.fail_dog_storage_job(
  p_job_id uuid,
  p_error_code text
)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  update private.storage_jobs as job
  set state = 'PENDING',
      available_at = now() + make_interval(
        secs => least(3600, power(2, greatest(job.attempts, 1))::integer)
      ),
      locked_at = null,
      error_code = left(p_error_code, 120),
      updated_at = now()
  where job.id = p_job_id
    and job.state = 'PROCESSING';

  if not found then
    raise exception 'storage_job_not_processing';
  end if;
end;
$$;

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
  v_job private.storage_jobs%rowtype;
begin
  select job.*
  into v_job
  from private.storage_jobs as job
  where job.id = p_job_id
    and job.state = 'PROCESSING'
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

revoke all on function public.claim_dog_storage_jobs(integer)
  from public, anon, authenticated;
revoke all on function public.fail_dog_storage_job(uuid, text)
  from public, anon, authenticated;
revoke all on function public.complete_dog_storage_job(uuid, bigint, text)
  from public, anon, authenticated;
grant execute on function public.claim_dog_storage_jobs(integer) to service_role;
grant execute on function public.fail_dog_storage_job(uuid, text) to service_role;
grant execute on function public.complete_dog_storage_job(uuid, bigint, text) to service_role;
