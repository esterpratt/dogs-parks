-- Added to register device tokens atomically and resolve the user through auth.uid().
create or replace function public.api_upsert_device_token(
  p_device_id text,
  p_platform public.platform,
  p_token text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'auth.uid() is null';
  end if;

  if p_device_id is null or btrim(p_device_id) = '' then
    raise exception 'p_device_id is required';
  end if;

  if p_platform is null then
    raise exception 'p_platform is required';
  end if;

  if p_token is null or btrim(p_token) = '' then
    raise exception 'p_token is required';
  end if;

  -- Added to serialize concurrent registrations for the same token or device.
  perform pg_advisory_xact_lock(
    hashtextextended('token:' || p_token, 0)
  );

  perform pg_advisory_xact_lock(
    hashtextextended('device:' || p_device_id, 0)
  );

  -- Added to remove a stale association when the same token gets a new device ID.
  delete from public.device_tokens
  where token = p_token
    and device_id <> p_device_id;

  insert into public.device_tokens (
    user_id,
    device_id,
    platform,
    token,
    updated_at
  )
  values (
    v_uid,
    p_device_id,
    p_platform,
    p_token,
    now()
  )
  on conflict (device_id)
  do update set
    user_id = excluded.user_id,
    platform = excluded.platform,
    token = excluded.token,
    updated_at = now();
end;
$function$;

-- Added so only authenticated application users can call the RPC.
revoke all
on function public.api_upsert_device_token(
  text,
  public.platform,
  text
)
from public;

grant execute
on function public.api_upsert_device_token(
  text,
  public.platform,
  text
)
to authenticated;