-- Capability-backed dog reads and writes replace client assumptions that a
-- dog's compatibility owner is its complete authorization model.

create or replace function public.api_create_dog(p_dog jsonb)
returns jsonb
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
  if nullif(btrim(p_dog->>'name'), '') is null or nullif(p_dog->>'birthday', '') is null then
    raise exception 'invalid_dog_profile';
  end if;

  insert into public.dogs (
    birthday, breed, description, dislikes, energy, gender, likes, name,
    owner, possessive, size, temperament
  )
  values (
    (p_dog->>'birthday')::date,
    p_dog->>'breed',
    p_dog->>'description',
    case when p_dog ? 'dislikes' and jsonb_typeof(p_dog->'dislikes') = 'array'
      then array(select jsonb_array_elements_text(p_dog->'dislikes')) else null end,
    p_dog->>'energy',
    p_dog->>'gender',
    case when p_dog ? 'likes' and jsonb_typeof(p_dog->'likes') = 'array'
      then array(select jsonb_array_elements_text(p_dog->'likes')) else null end,
    btrim(p_dog->>'name'),
    auth.uid(),
    p_dog->>'possessive',
    p_dog->>'size',
    p_dog->>'temperament'
  )
  returning id into v_dog_id;

  -- The existing insert trigger creates the matching primary tenure in the
  -- same transaction and deferred invariants verify the mirror at commit.
  return jsonb_build_object('dog_id', v_dog_id, 'outcome', 'CREATED');
end;
$$;

create or replace function public.api_update_dog(
  p_dog_id uuid,
  p_changes jsonb,
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
  v_owner_count integer;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  select dog.* into v_dog
  from public.dogs as dog
  where dog.id = p_dog_id
    and dog.lifecycle_state = 'ACTIVE'
    and dog.deleted_at is null
  for update;
  if not found then
    raise exception 'not_found';
  end if;
  if not exists (
    select 1 from public.dog_members as member
    where member.dog_id = p_dog_id
      and member.user_id = auth.uid()
      and member.left_at is null
  ) then
    raise exception 'forbidden';
  end if;

  select count(*)::integer into v_owner_count
  from public.dog_members
  where dog_id = p_dog_id and left_at is null;
  if v_owner_count > 1 then
    v_feature_outcome := public.dog_ownership_feature_outcome(
      p_client_platform,
      p_client_build
    );
    if v_feature_outcome <> 'OK' then
      return jsonb_build_object('outcome', v_feature_outcome);
    end if;
  end if;

  update public.dogs as dog
  set birthday = case when p_changes ? 'birthday'
        then (p_changes->>'birthday')::date else dog.birthday end,
      breed = case when p_changes ? 'breed' then p_changes->>'breed' else dog.breed end,
      description = case when p_changes ? 'description'
        then p_changes->>'description' else dog.description end,
      dislikes = case when p_changes ? 'dislikes'
        then case when jsonb_typeof(p_changes->'dislikes') = 'array'
          then array(select jsonb_array_elements_text(p_changes->'dislikes')) else null end
        else dog.dislikes end,
      energy = case when p_changes ? 'energy' then p_changes->>'energy' else dog.energy end,
      gender = case when p_changes ? 'gender' then p_changes->>'gender' else dog.gender end,
      likes = case when p_changes ? 'likes'
        then case when jsonb_typeof(p_changes->'likes') = 'array'
          then array(select jsonb_array_elements_text(p_changes->'likes')) else null end
        else dog.likes end,
      name = case when p_changes ? 'name'
        then nullif(btrim(p_changes->>'name'), '') else dog.name end,
      possessive = case when p_changes ? 'possessive'
        then p_changes->>'possessive' else dog.possessive end,
      size = case when p_changes ? 'size' then p_changes->>'size' else dog.size end,
      temperament = case when p_changes ? 'temperament'
        then p_changes->>'temperament' else dog.temperament end
  where dog.id = p_dog_id;

  return jsonb_build_object('dog_id', p_dog_id, 'outcome', 'APPLIED');
end;
$$;

create or replace function public.api_get_user_dogs(p_user_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;
  select coalesce(jsonb_agg(to_jsonb(dog) order by member.joined_at, dog.id), '[]'::jsonb)
  into v_result
  from public.dog_members as member
  join public.dogs as dog on dog.id = member.dog_id
  where member.user_id = p_user_id
    and member.left_at is null
    and dog.lifecycle_state = 'ACTIVE'
    and dog.deleted_at is null;
  return v_result;
end;
$$;

create or replace function public.api_get_users_dogs(p_user_ids uuid[])
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;
  select coalesce(
    jsonb_agg(
      jsonb_build_object('profile_user_id', member.user_id, 'dog', to_jsonb(dog))
      order by member.user_id, member.joined_at, dog.id
    ),
    '[]'::jsonb
  )
  into v_result
  from public.dog_members as member
  join public.dogs as dog on dog.id = member.dog_id
  where member.user_id = any(p_user_ids)
    and member.left_at is null
    and dog.lifecycle_state = 'ACTIVE'
    and dog.deleted_at is null;
  return v_result;
end;
$$;

create or replace function public.api_get_dog_page(
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
  v_capabilities jsonb;
  v_dog public.dogs%rowtype;
  v_member public.dog_members%rowtype;
  v_members jsonb;
  v_owner_count integer;
  v_pending_actions jsonb;
  v_primary_user public.users%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;
  select dog.* into v_dog
  from public.dogs as dog
  where dog.id = p_dog_id
    and dog.lifecycle_state = 'ACTIVE'
    and dog.deleted_at is null;
  if not found then
    return jsonb_build_object('outcome', 'NOT_FOUND');
  end if;

  select member.* into v_member
  from public.dog_members as member
  where member.dog_id = p_dog_id
    and member.user_id = auth.uid()
    and member.left_at is null;
  select count(*)::integer into v_owner_count
  from public.dog_members where dog_id = p_dog_id and left_at is null;
  select profile.* into v_primary_user
  from public.users as profile where profile.id = v_dog.owner;
  v_capabilities := public.api_get_dog_ownership_capabilities(
    p_dog_id,
    p_client_platform,
    p_client_build
  );

  if v_member.id is not null then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', member.id,
          'joined_at', member.joined_at,
          'role', member.role,
          'user_id', member.user_id,
          'user_name', profile.name
        ) order by member.joined_at, member.id
      ),
      '[]'::jsonb
    ) into v_members
    from public.dog_members as member
    left join public.users as profile on profile.id = member.user_id
    where member.dog_id = p_dog_id and member.left_at is null;

    select jsonb_build_object(
      'deletion_proposal', (
        select to_jsonb(proposal) from public.dog_deletion_proposals as proposal
        where proposal.dog_id = p_dog_id and proposal.status = 'PENDING'
        order by proposal.created_at desc limit 1
      ),
      'invites', (
        select coalesce(jsonb_agg(to_jsonb(invite) order by invite.created_at), '[]'::jsonb)
        from public.dog_invites as invite
        where invite.dog_id = p_dog_id
          and invite.status = 'PENDING'
          and v_member.role = 'PRIMARY_OWNER'
      ),
      'requests', (
        select coalesce(jsonb_agg(to_jsonb(request) order by request.created_at), '[]'::jsonb)
        from public.dog_ownership_requests as request
        where request.dog_id = p_dog_id
          and request.status = 'PENDING'
          and v_member.role = 'PRIMARY_OWNER'
      ),
      'transfers', (
        select coalesce(jsonb_agg(to_jsonb(transfer) order by transfer.created_at), '[]'::jsonb)
        from public.dog_primary_transfers as transfer
        where transfer.dog_id = p_dog_id
          and transfer.status = 'PENDING'
          and (
            v_member.role = 'PRIMARY_OWNER'
            or transfer.to_member_id = v_member.id
          )
      )
    ) into v_pending_actions;
  end if;

  return jsonb_strip_nulls(jsonb_build_object(
    'capabilities', v_capabilities,
    'dog', to_jsonb(v_dog),
    'members', v_members,
    'outcome', 'OK',
    'pending_actions', v_pending_actions,
    'profile_user', jsonb_build_object('id', v_primary_user.id, 'name', v_primary_user.name),
    'viewer', jsonb_build_object(
      'can_edit', v_member.id is not null and (
        v_owner_count = 1 or v_capabilities->>'outcome' = 'OK'
      ),
      'is_owner', v_member.id is not null,
      'role', v_member.role
    )
  ));
end;
$$;

revoke all on function public.api_create_dog(jsonb) from public, anon, authenticated;
revoke all on function public.api_update_dog(
  uuid, jsonb, public.app_platform, integer
) from public, anon, authenticated;
revoke all on function public.api_get_user_dogs(uuid) from public, anon, authenticated;
revoke all on function public.api_get_users_dogs(uuid[]) from public, anon, authenticated;
revoke all on function public.api_get_dog_page(
  uuid, public.app_platform, integer
) from public, anon, authenticated;

grant execute on function public.api_create_dog(jsonb) to authenticated, service_role;
grant execute on function public.api_update_dog(
  uuid, jsonb, public.app_platform, integer
) to authenticated, service_role;
grant execute on function public.api_get_user_dogs(uuid) to authenticated, service_role;
grant execute on function public.api_get_users_dogs(uuid[]) to authenticated, service_role;
grant execute on function public.api_get_dog_page(
  uuid, public.app_platform, integer
) to authenticated, service_role;
