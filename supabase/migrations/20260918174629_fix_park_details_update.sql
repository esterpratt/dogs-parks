-- Added to let authenticated users fill only missing park details without granting direct table updates.
create or replace function public.api_update_missing_park_details(
  p_park_id uuid,
  p_size_category public.park_size_category default null,
  p_materials text[] default null,
  p_shade numeric default null,
  p_has_facilities boolean default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_updated_count integer;
begin
  if v_uid is null then
    raise exception 'auth.uid() is null';
  end if;

  if p_park_id is null then
    raise exception 'p_park_id is required';
  end if;

  if p_size_category is null
    and p_materials is null
    and p_shade is null
    and p_has_facilities is null
  then
    raise exception 'At least one park detail is required';
  end if;

  if p_materials is not null then
    if cardinality(p_materials) = 0 then
      raise exception 'p_materials cannot be empty';
    end if;

    if exists (
      select 1
      from unnest(p_materials) as material(value)
      where value is null
        or value not in (
          'grass',
          'Synthetic grass',
          'sand',
          'dirt'
        )
    ) then
      raise exception 'p_materials contains an invalid value';
    end if;
  end if;

  if p_shade is not null and (p_shade < 0 or p_shade > 100) then
    raise exception 'p_shade must be between 0 and 100';
  end if;

  -- Added conditions keep existing park information from being overwritten.
  update public.parks
  set
    size_category = case
      when size_category is null and p_size_category is not null
        then p_size_category
      else size_category
    end,
    materials = case
      when (
        materials is null
        or cardinality(materials) = 0
      ) and p_materials is not null
        then p_materials
      else materials
    end,
    shade = case
      when shade is null and p_shade is not null
        then p_shade
      else shade
    end,
    has_facilities = case
      when has_facilities is null and p_has_facilities is not null
        then p_has_facilities
      else has_facilities
    end,
    updated_at = now()
  where id = p_park_id
    and (
      (size_category is null and p_size_category is not null)
      or (
        (
          materials is null
          or cardinality(materials) = 0
        )
        and p_materials is not null
      )
      or (shade is null and p_shade is not null)
      or (has_facilities is null and p_has_facilities is not null)
    );

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> 1 then
    raise exception 'Park was not found or its details are no longer missing';
  end if;
end;
$function$;

-- Added so only authenticated application users can call the park update RPC.
revoke all
on function public.api_update_missing_park_details(
  uuid,
  public.park_size_category,
  text[],
  numeric,
  boolean
)
from public;

grant execute
on function public.api_update_missing_park_details(
  uuid,
  public.park_size_category,
  text[],
  numeric,
  boolean
)
to authenticated;
