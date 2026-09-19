-- Added because Supabase granted the anonymous role direct execution access.
revoke all
on function public.api_update_missing_park_details(
  uuid,
  public.park_size_category,
  text[],
  numeric,
  boolean
)
from public, anon;

-- Keep execution available only to authenticated application users.
grant execute
on function public.api_update_missing_park_details(
  uuid,
  public.park_size_category,
  text[],
  numeric,
  boolean
)
to authenticated;
