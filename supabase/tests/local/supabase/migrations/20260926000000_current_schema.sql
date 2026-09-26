--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- The remote public schema depends on this extension-owned trigger function.
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: app_language; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."app_language" AS ENUM (
    'en',
    'he',
    'ar'
);


ALTER TYPE "public"."app_language" OWNER TO "postgres";

--
-- Name: condition_observed_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."condition_observed_status" AS ENUM (
    'PRESENT',
    'NOT_PRESENT'
);


ALTER TYPE "public"."condition_observed_status" OWNER TO "postgres";

--
-- Name: dog_invite_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."dog_invite_status" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'DECLINED',
    'CANCELED'
);


ALTER TYPE "public"."dog_invite_status" OWNER TO "postgres";

--
-- Name: dog_member_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."dog_member_role" AS ENUM (
    'PRIMARY_OWNER',
    'EDITOR',
    'VIEWER'
);


ALTER TYPE "public"."dog_member_role" OWNER TO "postgres";

--
-- Name: friendship_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."friendship_status" AS ENUM (
    'APPROVED',
    'PENDING'
);


ALTER TYPE "public"."friendship_status" OWNER TO "postgres";

--
-- Name: invite_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."invite_status" AS ENUM (
    'INVITED',
    'ACCEPTED',
    'DECLINED',
    'REMOVED'
);


ALTER TYPE "public"."invite_status" OWNER TO "postgres";

--
-- Name: notification_target_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."notification_target_type" AS ENUM (
    'USER',
    'PARK_EVENT',
    'PARK',
    'SYSTEM',
    'DOG_INVITE'
);


ALTER TYPE "public"."notification_target_type" OWNER TO "postgres";

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."notification_type" AS ENUM (
    'friend_request',
    'friend_approval',
    'park_invite',
    'park_invite_accept',
    'park_invite_cancelled',
    'park_invite_decline',
    'dog_invite',
    'dog_primary_transfer_invite',
    'dog_invite_accept',
    'dog_invite_decline',
    'dog_primary_transfer_accept'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";

--
-- Name: park_condition; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."park_condition" AS ENUM (
    'MUDDY',
    'BROKEN_FOUNTAIN',
    'GATE_CLOSED',
    'UNDER_CONSTRUCTION'
);


ALTER TYPE "public"."park_condition" OWNER TO "postgres";

--
-- Name: park_event_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."park_event_status" AS ENUM (
    'ACTIVE',
    'CANCELED'
);


ALTER TYPE "public"."park_event_status" OWNER TO "postgres";

--
-- Name: park_event_visibility; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."park_event_visibility" AS ENUM (
    'FRIENDS_ALL',
    'FRIENDS_SELECTED'
);


ALTER TYPE "public"."park_event_visibility" OWNER TO "postgres";

--
-- Name: park_size_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."park_size_category" AS ENUM (
    'small',
    'medium',
    'large',
    'huge'
);


ALTER TYPE "public"."park_size_category" OWNER TO "postgres";

--
-- Name: platform; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."platform" AS ENUM (
    'web',
    'ios',
    'android'
);


ALTER TYPE "public"."platform" OWNER TO "postgres";

--
-- Name: accept_dog_invite("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."accept_dog_invite"("p_invite_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_invite public.dog_invites%rowtype;
BEGIN
  SELECT * INTO v_invite
  FROM public.dog_invites
  WHERE id = p_invite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite_not_found';
  END IF;

  IF v_invite.status <> 'PENDING' THEN
    RAISE EXCEPTION 'invite_not_pending';
  END IF;

  IF v_invite.invitee_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_invited_user';
  END IF;

  IF v_invite.is_primary_transfer THEN
    RAISE EXCEPTION 'invite_is_primary_transfer';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dogs d
    WHERE d.id = v_invite.dog_id AND d.deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'dog_deleted';
  END IF;

  INSERT INTO public.dog_members (dog_id, user_id, role)
  VALUES (v_invite.dog_id, v_invite.invitee_user_id, v_invite.role_offered)
  ON CONFLICT (dog_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.dog_invites
  SET status = 'ACCEPTED',
      responded_at = now()
  WHERE id = v_invite.id;
END;
$$;


ALTER FUNCTION "public"."accept_dog_invite"("p_invite_id" "uuid") OWNER TO "postgres";

--
-- Name: accept_primary_transfer("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."accept_primary_transfer"("p_invite_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_invite public.dog_invites%rowtype;
  v_current_primary uuid;
BEGIN
  SELECT * INTO v_invite
  FROM public.dog_invites
  WHERE id = p_invite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite_not_found';
  END IF;

  IF v_invite.status <> 'PENDING' THEN
    RAISE EXCEPTION 'invite_not_pending';
  END IF;

  IF v_invite.invitee_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_invited_user';
  END IF;

  IF NOT v_invite.is_primary_transfer THEN
    RAISE EXCEPTION 'invite_not_primary_transfer';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dogs d
    WHERE d.id = v_invite.dog_id AND d.deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'dog_deleted';
  END IF;

  SELECT user_id INTO v_current_primary
  FROM public.dog_members
  WHERE dog_id = v_invite.dog_id AND role = 'PRIMARY_OWNER'
  FOR UPDATE;

  IF v_current_primary IS NULL THEN
    RAISE EXCEPTION 'primary_owner_missing';
  END IF;

  IF v_current_primary <> v_invite.inviter_user_id THEN
    RAISE EXCEPTION 'inviter_not_primary';
  END IF;

  UPDATE public.dog_members
  SET role = 'EDITOR'
  WHERE dog_id = v_invite.dog_id AND user_id = v_current_primary;

  INSERT INTO public.dog_members (dog_id, user_id, role)
  VALUES (v_invite.dog_id, v_invite.invitee_user_id, 'PRIMARY_OWNER')
  ON CONFLICT (dog_id, user_id) DO UPDATE SET role = 'PRIMARY_OWNER';

  UPDATE public.dog_invites
  SET status = 'ACCEPTED',
      responded_at = now()
  WHERE id = v_invite.id;
END;
$$;


ALTER FUNCTION "public"."accept_primary_transfer"("p_invite_id" "uuid") OWNER TO "postgres";

--
-- Name: add_event_invitees("uuid", "uuid"[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."add_event_invitees"("p_event_id" "uuid", "p_invitee_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_caller uuid := auth.uid();
  v_event_creator uuid;
  v_is_creator  boolean;
  v_is_accepted boolean;
begin
  if v_caller is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  -- Ensure event exists, fetch creator
  select e.creator_id
    into v_event_creator
  from public.park_events e
  where e.id = p_event_id;

  if v_event_creator is null then
    raise exception using errcode = 'P0001', message = 'EVENT_NOT_FOUND';
  end if;

  v_is_creator := (v_event_creator = v_caller);

  -- Only creator OR ACCEPTED attendee may add invitees
  v_is_accepted := exists (
    select 1
    from public.park_event_invitees i
    where i.event_id = p_event_id
      and i.user_id  = v_caller
      and i.status   = 'ACCEPTED'::invite_status
  );

  if not (v_is_creator or v_is_accepted) then
    raise exception using errcode = 'P0001', message = 'NOT_AUTHORIZED_TO_INVITE';
  end if;

  -- Normalize inputs: distinct, non-null, not self
  with normalized as (
    select distinct uid as user_id
    from unnest(p_invitee_ids) t(uid)
    where uid is not null and uid <> v_caller
  )
  insert into public.park_event_invitees (event_id, user_id, status, added_by, added_at)
  select p_event_id, n.user_id, 'INVITED'::invite_status, v_caller, now()
  from normalized n
  on conflict (event_id, user_id) do nothing;

  -- no result to return
end;
$$;


ALTER FUNCTION "public"."add_event_invitees"("p_event_id" "uuid", "p_invitee_ids" "uuid"[]) OWNER TO "postgres";

--
-- Name: add_park_condition_observation("uuid", "public"."park_condition", "public"."condition_observed_status"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."add_park_condition_observation"("p_park_id" "uuid", "p_condition" "public"."park_condition", "p_status" "public"."condition_observed_status") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO park_condition_observations (park_id, reporter_id, condition, status)
  VALUES (p_park_id, auth.uid(), p_condition, p_status)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."add_park_condition_observation"("p_park_id" "uuid", "p_condition" "public"."park_condition", "p_status" "public"."condition_observed_status") OWNER TO "postgres";

--
-- Name: add_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."add_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$begin
  insert into public.users (id, name)
  values (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'KlavHuber'));

  return new;
end;$$;


ALTER FUNCTION "public"."add_user"() OWNER TO "postgres";

--
-- Name: api_cleanup_device_tokens("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."api_cleanup_device_tokens"("p_device_id" "text" DEFAULT NULL::"text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid uuid := auth.uid();
  v_deleted int;
begin
  if v_uid is null then
    raise exception 'auth.uid() is null';
  end if;

  if p_device_id is null then
    delete from device_tokens where user_id = v_uid;
  else
    delete from device_tokens where user_id = v_uid and device_id = p_device_id;
  end if;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;


ALTER FUNCTION "public"."api_cleanup_device_tokens"("p_device_id" "text") OWNER TO "postgres";

--
-- Name: api_update_missing_park_details("uuid", "public"."park_size_category", "text"[], numeric, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."api_update_missing_park_details"("p_park_id" "uuid", "p_size_category" "public"."park_size_category" DEFAULT NULL::"public"."park_size_category", "p_materials" "text"[] DEFAULT NULL::"text"[], "p_shade" numeric DEFAULT NULL::numeric, "p_has_facilities" boolean DEFAULT NULL::boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."api_update_missing_park_details"("p_park_id" "uuid", "p_size_category" "public"."park_size_category", "p_materials" "text"[], "p_shade" numeric, "p_has_facilities" boolean) OWNER TO "postgres";

--
-- Name: api_upsert_device_token("text", "public"."platform", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."api_upsert_device_token"("p_device_id" "text", "p_platform" "public"."platform", "p_token" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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

  -- Added to remove a stale device association left by reinstalling the app.
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
$$;


ALTER FUNCTION "public"."api_upsert_device_token"("p_device_id" "text", "p_platform" "public"."platform", "p_token" "text") OWNER TO "postgres";

--
-- Name: cancel_dog_invite("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."cancel_dog_invite"("p_invite_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_invite public.dog_invites%rowtype;
BEGIN
  SELECT * INTO v_invite
  FROM public.dog_invites
  WHERE id = p_invite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite_not_found';
  END IF;

  IF v_invite.status <> 'PENDING' THEN
    RAISE EXCEPTION 'invite_not_pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.dog_members m
    WHERE m.dog_id = v_invite.dog_id
      AND m.user_id = auth.uid()
      AND m.role = 'PRIMARY_OWNER'
  ) THEN
    RAISE EXCEPTION 'not_primary_owner';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dogs d
    WHERE d.id = v_invite.dog_id AND d.deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'dog_deleted';
  END IF;

  UPDATE public.dog_invites
  SET status = 'CANCELED',
      responded_at = now()
  WHERE id = v_invite.id;
END;
$$;


ALTER FUNCTION "public"."cancel_dog_invite"("p_invite_id" "uuid") OWNER TO "postgres";

--
-- Name: check_device_token_match("text", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."check_device_token_match"("p_device_id" "text", "p_token" "text") RETURNS TABLE("id" "uuid", "user_id" "uuid", "platform" "text", "token_len" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT id, user_id, platform, length(token) AS token_len, created_at, updated_at
  FROM device_tokens
  WHERE device_id = p_device_id
    AND token = p_token
  LIMIT 5;
$$;


ALTER FUNCTION "public"."check_device_token_match"("p_device_id" "text", "p_token" "text") OWNER TO "postgres";

--
-- Name: count_unseen_notifications(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."count_unseen_notifications"() RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select count(*)::bigint
  from notifications
  where receiver_id = auth.uid()
    and seen_at is null;
$$;


ALTER FUNCTION "public"."count_unseen_notifications"() OWNER TO "postgres";

--
-- Name: create_dog_invite("uuid", "uuid", "public"."dog_member_role"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_dog_invite"("p_dog_id" "uuid", "p_invitee_user_id" "uuid", "p_role_offered" "public"."dog_member_role") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_invite_id uuid;
BEGIN
  IF p_role_offered NOT IN ('EDITOR','VIEWER') THEN
    RAISE EXCEPTION 'invalid_role_offered';
  END IF;

  IF p_invitee_user_id = auth.uid() THEN
    RAISE EXCEPTION 'self_invite_not_allowed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.dog_members m
    WHERE m.dog_id = p_dog_id
      AND m.user_id = auth.uid()
      AND m.role = 'PRIMARY_OWNER'
  ) THEN
    RAISE EXCEPTION 'not_primary_owner';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dog_members m2
    WHERE m2.dog_id = p_dog_id
      AND m2.user_id = p_invitee_user_id
  ) THEN
    RAISE EXCEPTION 'already_member';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dog_invites di
    WHERE di.dog_id = p_dog_id
      AND di.invitee_user_id = p_invitee_user_id
      AND di.status = 'PENDING'
  ) THEN
    RAISE EXCEPTION 'pending_invite_exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dogs d
    WHERE d.id = p_dog_id AND d.deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'dog_deleted';
  END IF;

  INSERT INTO public.dog_invites (
    dog_id, inviter_user_id, invitee_user_id, role_offered, is_primary_transfer
  )
  VALUES (p_dog_id, auth.uid(), p_invitee_user_id, p_role_offered, false)
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$;


ALTER FUNCTION "public"."create_dog_invite"("p_dog_id" "uuid", "p_invitee_user_id" "uuid", "p_role_offered" "public"."dog_member_role") OWNER TO "postgres";

--
-- Name: create_park_event("uuid", "public"."park_event_visibility", "text", "uuid"[], integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_park_event"("park_id" "uuid", "visibility" "public"."park_event_visibility", "message" "text" DEFAULT NULL::"text", "invitee_ids" "uuid"[] DEFAULT NULL::"uuid"[], "preset_offset_minutes" integer DEFAULT 0) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_creator_id uuid := auth.uid();
  v_start_at timestamptz;
  v_end_at timestamptz;
  v_duration_minutes integer := 60;
  v_invitees uuid[];
  v_event_id uuid;
begin
  if v_creator_id is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  -- CHANGE (by me): server-side time math
  v_start_at := statement_timestamp() + (preset_offset_minutes * interval '1 minute');
  v_end_at   := v_start_at + (v_duration_minutes * interval '1 minute');

  -- Build invitee list
  if visibility = 'FRIENDS_ALL' then
    select array_agg(distinct friend_id)
      into v_invitees
    from (
      select case
               when f.requester_id = v_creator_id then f.requestee_id
               else f.requester_id
             end as friend_id
      from public.friendships f
      where f.status = 'APPROVED'
        and (f.requester_id = v_creator_id or f.requestee_id = v_creator_id)
    ) s
    where friend_id is not null
      and friend_id <> v_creator_id;

    if v_invitees is null or array_length(v_invitees, 1) is null then
      raise exception using errcode = 'P0001', message = 'EMPTY_INVITEE_LIST';
    end if;

  elsif visibility = 'FRIENDS_SELECTED' then
    if invitee_ids is null or array_length(invitee_ids, 1) is null then
      raise exception using errcode = 'P0001', message = 'EMPTY_INVITEE_LIST';
    end if;

    select coalesce(array_agg(uid), '{}'::uuid[])
      into v_invitees
    from (
      select distinct uid
      from unnest(invitee_ids) as t(uid)
      where uid is not null and uid <> v_creator_id
    ) x;

    if array_length(v_invitees, 1) is null then
      raise exception using errcode = 'P0001', message = 'EMPTY_INVITEE_LIST';
    end if;

  else
    v_invitees := null;
  end if;

  -- Insert event
  insert into public.park_events (
    creator_id, park_id, start_at, end_at, duration_minutes,
    visibility, message, status, created_at, updated_at
  )
  values (
    v_creator_id, park_id, v_start_at, v_end_at, v_duration_minutes,
    visibility, message, 'ACTIVE'::public.park_event_status, now(), now()
  )
  returning id into v_event_id;

  -- CHANGE (by me): centralize invite insertion
  if v_invitees is not null and array_length(v_invitees, 1) is not null then
    perform public.add_event_invitees(v_event_id, v_invitees);
  end if;

  return v_event_id;
end;
$$;


ALTER FUNCTION "public"."create_park_event"("park_id" "uuid", "visibility" "public"."park_event_visibility", "message" "text", "invitee_ids" "uuid"[], "preset_offset_minutes" integer) OWNER TO "postgres";

--
-- Name: create_primary_transfer_invite("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."create_primary_transfer_invite"("p_dog_id" "uuid", "p_invitee_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_invite_id uuid;
BEGIN
  IF p_invitee_user_id = auth.uid() THEN
    RAISE EXCEPTION 'self_invite_not_allowed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.dog_members m
    WHERE m.dog_id = p_dog_id
      AND m.user_id = auth.uid()
      AND m.role = 'PRIMARY_OWNER'
  ) THEN
    RAISE EXCEPTION 'not_primary_owner';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dog_invites di
    WHERE di.dog_id = p_dog_id
      AND di.invitee_user_id = p_invitee_user_id
      AND di.status = 'PENDING'
  ) THEN
    RAISE EXCEPTION 'pending_invite_exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dogs d
    WHERE d.id = p_dog_id AND d.deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'dog_deleted';
  END IF;

  INSERT INTO public.dog_invites (
    dog_id, inviter_user_id, invitee_user_id, role_offered, is_primary_transfer
  )
  VALUES (p_dog_id, auth.uid(), p_invitee_user_id, 'EDITOR', true)
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$;


ALTER FUNCTION "public"."create_primary_transfer_invite"("p_dog_id" "uuid", "p_invitee_user_id" "uuid") OWNER TO "postgres";

--
-- Name: decline_dog_invite("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."decline_dog_invite"("p_invite_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_invite public.dog_invites%rowtype;
BEGIN
  SELECT * INTO v_invite
  FROM public.dog_invites
  WHERE id = p_invite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite_not_found';
  END IF;

  IF v_invite.status <> 'PENDING' THEN
    RAISE EXCEPTION 'invite_not_pending';
  END IF;

  IF v_invite.invitee_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_invited_user';
  END IF;

  UPDATE public.dog_invites
  SET status = 'DECLINED',
      responded_at = now()
  WHERE id = v_invite.id;
END;
$$;


ALTER FUNCTION "public"."decline_dog_invite"("p_invite_id" "uuid") OWNER TO "postgres";

--
-- Name: delete_dog("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."delete_dog"("dog_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  update dogs
  set deleted_at = now()
  where id = dog_id;
END;$$;


ALTER FUNCTION "public"."delete_dog"("dog_id" "uuid") OWNER TO "postgres";

--
-- Name: delete_user_folder(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."delete_user_folder"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    folder_name text;
begin
    folder_name := OLD.id;
    perform storage.delete_folder('users', folder_name);
    return old;
end;
$$;


ALTER FUNCTION "public"."delete_user_folder"() OWNER TO "postgres";

--
-- Name: get_active_park_conditions("uuid", timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_active_park_conditions"("p_park_id" "uuid", "p_now" timestamp with time zone DEFAULT "now"()) RETURNS TABLE("park_id" "uuid", "condition" "public"."park_condition", "last_reported_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  WITH last AS (
    SELECT
      o.park_id,
      o.condition,
      MAX(o.created_at) FILTER (WHERE o.status = 'PRESENT')     AS last_present_at,
      MAX(o.created_at) FILTER (WHERE o.status = 'NOT_PRESENT') AS last_not_present_at
    FROM park_condition_observations o
    WHERE o.park_id = p_park_id
    GROUP BY o.park_id, o.condition
  )
  SELECT
    l.park_id,
    l.condition,
    l.last_present_at AS last_reported_at
  FROM last l
  JOIN park_condition_rules r ON r.condition = l.condition
  WHERE
    l.last_present_at IS NOT NULL
    AND (l.last_not_present_at IS NULL OR l.last_present_at > l.last_not_present_at)
    AND l.last_present_at > p_now - r.ttl
  ORDER BY l.condition;
$$;


ALTER FUNCTION "public"."get_active_park_conditions"("p_park_id" "uuid", "p_now" timestamp with time zone) OWNER TO "postgres";

--
-- Name: get_event_with_invitees("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_event_with_invitees"("p_event_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  _result jsonb;
  _allowed boolean;
begin
  -- Permission: creator OR invitee
  select exists (
           select 1
           from public.park_events pe
           where pe.id = p_event_id
             and pe.creator_id = auth.uid()
         )
       or exists (
           select 1
           from public.park_event_invitees i
           where i.event_id = p_event_id
             and i.user_id = auth.uid()
         )
  into _allowed;

  if not _allowed then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  with e as (
    select pe.*
    from public.park_events pe
    where pe.id = p_event_id
  ),
  inv as (
    select
      i.user_id,
      u.name,
      i.status,
      i.responded_at,
      i.added_by,
      i.added_at
    from public.park_event_invitees i
    left join public.users u on u.id = i.user_id
    where i.event_id = p_event_id
    order by i.added_at asc
  )
  select
    jsonb_build_object(
      -- BASE EVENT
      'event',
        -- event row as json
        to_jsonb(e)
        -- merge in "creator" object (id + name only)
        || jsonb_build_object('creator_name',
     (select u.name from public.users u where u.id = e.creator_id)
   ),
      -- INVITEES ARRAY
      'invitees',
        coalesce((select jsonb_agg(to_jsonb(inv)) from inv), '[]'::jsonb)
    )
  into _result
  from e;

  if _result is null then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;

  return _result;
end;
$$;


ALTER FUNCTION "public"."get_event_with_invitees"("p_event_id" "uuid") OWNER TO "postgres";

--
-- Name: get_favorite_park(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_favorite_park"() RETURNS TABLE("park_id" "uuid")
    LANGUAGE "sql"
    AS $$WITH park_likes AS (
  SELECT
    p.id AS park_id,
    p.city,
    COUNT(f.id) AS likes_count
  FROM parks p
  LEFT JOIN favorites f ON f.park_id = p.id
  GROUP BY p.id, p.city
),
ranked_parks AS (
  SELECT
    park_id,
    city,
    likes_count,
    RANK() OVER (PARTITION BY city ORDER BY likes_count DESC) AS rank
  FROM park_likes
  WHERE likes_count > 0
)
SELECT park_id
FROM ranked_parks
WHERE rank = 1;$$;


ALTER FUNCTION "public"."get_favorite_park"() OWNER TO "postgres";

--
-- Name: get_notifications("uuid", integer, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_notifications"("p_user_id" "uuid", "p_limit" integer DEFAULT 20, "p_cursor" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("id" "uuid", "type" "text", "target_type" "text", "target_id" "uuid", "sender_id" "uuid", "title" "text", "app_message" "text", "push_message" "text", "read_at" timestamp with time zone, "seen_at" timestamp with time zone, "created_at" timestamp with time zone, "sender" "jsonb")
    LANGUAGE "sql" STABLE
    AS $$
  select
    n.id,
    n.type,
    n.target_type,
    n.target_id,
    n.sender_id,
    n.title,
    n.app_message,
    n.push_message,
    n.read_at,
    n.seen_at,
    n.created_at,
    jsonb_build_object(
      'id', u.id,
      'name', u.name
    ) as sender
  from public.notifications n
  left join public.users u
    on u.id = n.sender_id
  where
    n.receiver_id = p_user_id
    and (p_cursor is null or n.created_at < p_cursor)
  order by n.created_at desc
  limit p_limit;
$$;


ALTER FUNCTION "public"."get_notifications"("p_user_id" "uuid", "p_limit" integer, "p_cursor" timestamp with time zone) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: checkins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checkin_timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "checkout_timestamp" timestamp with time zone,
    "park_id" "uuid",
    "user_id" "uuid"
);


ALTER TABLE "public"."checkins" OWNER TO "postgres";

--
-- Name: get_park_checkins("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_park_checkins"("p_park_id" "uuid") RETURNS SETOF "public"."checkins"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM checkins as c
  WHERE c.park_id = p_park_id
  AND c.checkout_timestamp IS NULL
  AND date_trunc('second', c.checkin_timestamp) >= date_trunc('second', NOW() - INTERVAL '2 hours');
END;
$$;


ALTER FUNCTION "public"."get_park_checkins"("p_park_id" "uuid") OWNER TO "postgres";

--
-- Name: get_parks_with_translations("public"."app_language"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_parks_with_translations"("lang" "public"."app_language") RETURNS TABLE("id" "uuid", "name" "text", "city" "text", "address" "text", "base_name" "text", "base_city" "text", "base_address" "text")
    LANGUAGE "sql" STABLE
    AS $$
  with pref as (
    select pt.park_id, pt.name, pt.city, pt.address
    from public.park_translations pt
    where pt.language = lang
  ),
  en as (
    select pt.park_id, pt.name, pt.city, pt.address
    from public.park_translations pt
    where pt.language = 'en'::public.app_language
  )
  select
    p.id,
    coalesce(pref.name, en.name) as name,
    coalesce(pref.city, en.city) as city,
    coalesce(pref.address, en.address) as address,
    en.name as base_name,
    en.city as base_city,
    en.address as base_address
  from public.parks p
  left join pref on pref.park_id = p.id
  left join en on en.park_id = p.id
  order by p.id;
$$;


ALTER FUNCTION "public"."get_parks_with_translations"("lang" "public"."app_language") OWNER TO "postgres";

--
-- Name: get_seen_notifications("uuid", integer, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_seen_notifications"("p_user_id" "uuid", "p_limit" integer DEFAULT 20, "p_cursor" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("id" "uuid", "type" "text", "target_type" "text", "target_id" "uuid", "sender_id" "uuid", "receiver_id" "uuid", "title" "text", "app_message" "text", "push_message" "text", "read_at" timestamp with time zone, "seen_at" timestamp with time zone, "created_at" timestamp with time zone, "sender" "jsonb")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select
    n.id,
    n.type,
    n.target_type,
    n.target_id,
    n.sender_id,
    n.receiver_id,
    n.title,
    n.app_message,
    n.push_message,
    n.read_at,
    n.seen_at,
    n.created_at,
    jsonb_build_object(
      'id', u.id,
      'name', u.name
    ) as sender
  from notifications n
  left join users u
    on u.id = n.sender_id
  where n.receiver_id = p_user_id
    and n.seen_at is not null
    and (p_cursor is null or n.created_at < p_cursor)
  order by n.created_at desc
  limit p_limit;
$$;


ALTER FUNCTION "public"."get_seen_notifications"("p_user_id" "uuid", "p_limit" integer, "p_cursor" timestamp with time zone) OWNER TO "postgres";

--
-- Name: get_unseen_notifications("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_unseen_notifications"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "type" "text", "target_type" "text", "target_id" "uuid", "sender_id" "uuid", "receiver_id" "uuid", "title" "text", "app_message" "text", "push_message" "text", "read_at" timestamp with time zone, "seen_at" timestamp with time zone, "created_at" timestamp with time zone, "sender" "jsonb")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select
    n.id,
    n.type,
    n.target_type,
    n.target_id,
    n.sender_id,
    n.receiver_id,
    n.title,
    n.app_message,
    n.push_message,
    n.read_at,
    n.seen_at,
    n.created_at,
    jsonb_build_object(
      'id', u.id,
      'name', u.name
    ) as sender
  from notifications n
  left join users u
    on u.id = n.sender_id
  where n.receiver_id = p_user_id
    and n.seen_at is null
  order by n.created_at desc;
$$;


ALTER FUNCTION "public"."get_unseen_notifications"("p_user_id" "uuid") OWNER TO "postgres";

--
-- Name: get_user_events_invited(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_user_events_invited"() RETURNS TABLE("id" "uuid", "park_id" "uuid", "start_at" timestamp with time zone, "end_at" timestamp with time zone, "duration_minutes" integer, "visibility" "public"."park_event_visibility", "message" "text", "status" "public"."park_event_status", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "my_invite_status" "public"."invite_status", "my_invite_responded_at" timestamp with time zone, "my_invite_added_by" "uuid", "my_invite_added_at" timestamp with time zone, "my_invite_added_by_name" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
      e.id as id,
      e.park_id,
      e.start_at,
      e.end_at,
      e.duration_minutes,
      e.visibility,
      e.message,
      e.status,
      e.created_at,
      e.updated_at,
      i.status as my_invite_status,
      i.responded_at as my_invite_responded_at,
      i.added_by as my_invite_added_by,
      i.added_at as my_invite_added_at,
      u.name as my_invite_added_by_name
  from public.park_event_invitees i
  join public.park_events e on e.id = i.event_id
  left join public.users u on u.id = i.added_by
  where i.user_id = auth.uid()
    and e.end_at > now()
    -- CHANGE BY CHATGPT: visibility logic for cancelled events
    and (
      e.status <> 'CANCELED'
      or i.status in ('ACCEPTED', 'DECLINED') -- <-- adjust values to match your invite enum
    )
  order by e.start_at asc;
$$;


ALTER FUNCTION "public"."get_user_events_invited"() OWNER TO "postgres";

--
-- Name: get_user_events_organized(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_user_events_organized"() RETURNS TABLE("id" "uuid", "park_id" "uuid", "start_at" timestamp with time zone, "end_at" timestamp with time zone, "duration_minutes" integer, "visibility" "public"."park_event_visibility", "message" "text", "status" "public"."park_event_status", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  select
      e.id as id,
      e.park_id,
      e.start_at,
      e.end_at,
      e.duration_minutes,
      e.visibility,
      e.message,
      e.status,
      e.created_at,
      e.updated_at
  from public.park_events e
  where
      e.creator_id = auth.uid()
      and e.end_at > now()
  order by e.start_at asc;
$$;


ALTER FUNCTION "public"."get_user_events_organized"() OWNER TO "postgres";

--
-- Name: handle_park_event_cancel_notifications(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_park_event_cancel_notifications"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if TG_OP = 'UPDATE' then
    if OLD.status is distinct from NEW.status
       and NEW.status = 'CANCELED'::park_event_status then

      insert into public.notifications (
        receiver_id,
        sender_id,
        type,
        target_type,
        target_id
      )
      select
        i.user_id              as receiver_id,   -- each invitee
        NEW.creator_id         as sender_id,     -- event creator
        'park_invite_cancelled'::notification_type,
        'PARK_EVENT'::notification_target_type,
        NEW.id                 as target_id      -- the cancelled event
      from public.park_event_invitees i
      where i.event_id = NEW.id
        and i.status in (
          'INVITED'::invite_status,
          'ACCEPTED'::invite_status
        );
    end if;
  end if;

  return NEW;
end;
$$;


ALTER FUNCTION "public"."handle_park_event_cancel_notifications"() OWNER TO "postgres";

--
-- Name: handle_park_event_invitation_notifications(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_park_event_invitation_notifications"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- INSERT: new invite → park_invite
  if TG_OP = 'INSERT' then
    if NEW.status is null or NEW.status = 'INVITED'::invite_status then
      insert into public.notifications (
        receiver_id,
        sender_id,
        type,
        target_type,
        target_id
      )
      values (
        NEW.user_id,                     -- invited user (receiver)
        NEW.added_by,                    -- creator / inviter (sender)
        'park_invite'::notification_type,
        'PARK_EVENT'::notification_target_type,
        NEW.event_id                     -- event the invite is for
      );
    end if;

    return NEW;
  end if;

  -- UPDATE: status change → accept / decline
  if TG_OP = 'UPDATE' then
    if OLD.status is distinct from NEW.status then

      -- ACCEPTED → notify creator (sender = user who accepted)
      if NEW.status = 'ACCEPTED'::invite_status then
        insert into public.notifications (
          receiver_id,
          sender_id,
          type,
          target_type,
          target_id
        )
        values (
          NEW.added_by,                  -- creator (receiver)
          NEW.user_id,                   -- user who accepted (sender)
          'park_invite_accept'::notification_type,
          'PARK_EVENT'::notification_target_type,
          NEW.event_id
        );

      -- DECLINED → notify creator (sender = user who declined)
      elsif NEW.status = 'DECLINED'::invite_status then
        insert into public.notifications (
          receiver_id,
          sender_id,
          type,
          target_type,
          target_id
        )
        values (
          NEW.added_by,                  -- creator (receiver)
          NEW.user_id,                   -- user who declined (sender)
          'park_invite_decline'::notification_type,
          'PARK_EVENT'::notification_target_type,
          NEW.event_id
        );
      end if;
    end if;

    return NEW;
  end if;

  return NEW;
end;
$$;


ALTER FUNCTION "public"."handle_park_event_invitation_notifications"() OWNER TO "postgres";

--
-- Name: mark_all_notifications_as_read(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_as_read"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_count int;
begin
  if v_uid is null then
    raise exception 'auth.uid() is null (no user in context)' using errcode = '28000';
  end if;

  update notifications
     set read_at = v_now
   where receiver_id = v_uid
     and read_at is null
     and created_at <= v_now;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  return v_count;
end;$$;


ALTER FUNCTION "public"."mark_all_notifications_as_read"() OWNER TO "postgres";

--
-- Name: mark_all_notifications_as_seen(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_as_seen"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_count int;
begin
  if v_uid is null then
    raise exception 'auth.uid() is null (no user context)' using errcode = '28000';
  end if;

  update notifications
     set seen_at = v_now
   where receiver_id = v_uid
     and seen_at is null
     and created_at <= v_now;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  return v_count;
end;$$;


ALTER FUNCTION "public"."mark_all_notifications_as_seen"() OWNER TO "postgres";

--
-- Name: mark_notification_read("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("notification_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update notifications
     set read_at = now()
   where id = notification_id
     and receiver_id = auth.uid()
     and read_at is null;
end;
$$;


ALTER FUNCTION "public"."mark_notification_read"("notification_id" "uuid") OWNER TO "postgres";

--
-- Name: mark_notifications_seen("uuid"[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."mark_notifications_seen"("p_notification_ids" "uuid"[]) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid   uuid      := auth.uid();
  v_now   timestamptz := now();
  v_count integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth.uid() is null (no user context)'
      USING errcode = '28000';
  END IF;

  -- Nothing to do if array is null or empty
  IF p_notification_ids IS NULL
     OR array_length(p_notification_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.notifications
     SET seen_at = v_now
   WHERE receiver_id = v_uid
     AND seen_at IS NULL
     AND id = ANY(p_notification_ids)
     AND created_at <= v_now;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."mark_notifications_seen"("p_notification_ids" "uuid"[]) OWNER TO "postgres";

--
-- Name: notify_dog_invite_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."notify_dog_invite_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_primary_owner uuid;
  v_target_type text := 'dog_invite';
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status = 'PENDING' THEN
      INSERT INTO public.notifications (
        receiver_id,
        sender_id,
        type,
        target_type,
        target_id,
        data,
        is_ready
      )
      VALUES (
        NEW.invitee_user_id,
        NEW.inviter_user_id,
        CASE
          WHEN NEW.is_primary_transfer THEN 'dog_primary_transfer_invite'
          ELSE 'dog_invite'
        END,
        v_target_type,
        NEW.id,
        jsonb_build_object(
          'dog_id', NEW.dog_id,
          'invite_id', NEW.id,
          'role_offered', NEW.role_offered,
          'is_primary_transfer', NEW.is_primary_transfer
        ),
        false
      );
    END IF;
    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    IF OLD.status = 'PENDING' AND NEW.status IN ('ACCEPTED','DECLINED') THEN
      SELECT user_id INTO v_primary_owner
      FROM public.dog_members
      WHERE dog_id = NEW.dog_id AND role = 'PRIMARY_OWNER'
      LIMIT 1;

      INSERT INTO public.notifications (
        receiver_id,
        sender_id,
        type,
        target_type,
        target_id,
        data,
        is_ready
      )
      VALUES (
        NEW.inviter_user_id,
        NEW.invitee_user_id,
        CASE
          WHEN NEW.status = 'ACCEPTED' THEN 'dog_invite_accept'
          ELSE 'dog_invite_decline'
        END,
        v_target_type,
        NEW.id,
        jsonb_build_object(
          'dog_id', NEW.dog_id,
          'invite_id', NEW.id,
          'role_offered', NEW.role_offered,
          'is_primary_transfer', NEW.is_primary_transfer
        ),
        false
      );

      IF v_primary_owner IS NOT NULL AND v_primary_owner <> NEW.inviter_user_id THEN
        INSERT INTO public.notifications (
          receiver_id,
          sender_id,
          type,
          target_type,
          target_id,
          data,
          is_ready
        )
        VALUES (
          v_primary_owner,
          NEW.invitee_user_id,
          CASE
            WHEN NEW.status = 'ACCEPTED' THEN 'dog_invite_accept'
            ELSE 'dog_invite_decline'
          END,
          v_target_type,
          NEW.id,
          jsonb_build_object(
            'dog_id', NEW.dog_id,
            'invite_id', NEW.id,
            'role_offered', NEW.role_offered,
            'is_primary_transfer', NEW.is_primary_transfer
          ),
          false
        );
      END IF;

      IF NEW.status = 'ACCEPTED' AND NEW.is_primary_transfer THEN
        INSERT INTO public.notifications (
          receiver_id,
          sender_id,
          type,
          target_type,
          target_id,
          data,
          is_ready
        )
        VALUES (
          NEW.invitee_user_id,
          NEW.inviter_user_id,
          'dog_primary_transfer_accept',
          v_target_type,
          NEW.id,
          jsonb_build_object(
            'dog_id', NEW.dog_id,
            'invite_id', NEW.id,
            'role_offered', NEW.role_offered,
            'is_primary_transfer', NEW.is_primary_transfer
          ),
          false
        );
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_dog_invite_change"() OWNER TO "postgres";

--
-- Name: notify_on_friendship_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."notify_on_friendship_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- New friendship request created
  if TG_OP = 'INSERT' then
    insert into public.notifications (
      receiver_id,
      sender_id,
      type,
      target_type,
      target_id
    )
    values (
      NEW.requestee_id,                            -- receiver: the one getting the request
      NEW.requester_id,                            -- sender: the requester
      'friend_request'::notification_type,
      'USER'::notification_target_type,            -- link to user profile
      NEW.requester_id                             -- target: requester profile
    );

    return NEW;
  end if;

  -- Friendship approved
  if TG_OP = 'UPDATE' then
    if (OLD.status <> 'APPROVED')
       and (NEW.status = 'APPROVED') then
      insert into public.notifications (
        receiver_id,
        sender_id,
        type,
        target_type,
        target_id
      )
      values (
        NEW.requester_id,                          -- receiver: original requester
        NEW.requestee_id,                          -- sender: the one who approved
        'friend_approval'::notification_type,
        'USER'::notification_target_type,          -- link to user profile
        NEW.requestee_id                           -- target: approver profile
      );
    end if;

    return NEW;
  end if;

  return NEW;
end
$$;


ALTER FUNCTION "public"."notify_on_friendship_change"() OWNER TO "postgres";

--
-- Name: park_events_set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."park_events_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."park_events_set_updated_at"() OWNER TO "postgres";

--
-- Name: remove_device_token_by_device("text", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."remove_device_token_by_device"("p_device_id" "text", "p_token" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_deleted int := 0;
BEGIN
  -- Log (truncated) inputs to Supabase Postgres logs
  RAISE LOG 'remove_device_token_by_device called. device_id=%, token_prefix=%, token_len=%',
    p_device_id,
    LEFT(COALESCE(p_token, ''), 12),
    COALESCE(length(p_token), 0);

  DELETE FROM device_tokens
  WHERE device_id = p_device_id
    AND token = p_token;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RAISE LOG 'remove_device_token_by_device deleted rows: %', v_deleted;
  RETURN v_deleted;
END;
$$;


ALTER FUNCTION "public"."remove_device_token_by_device"("p_device_id" "text", "p_token" "text") OWNER TO "postgres";

--
-- Name: safe_update_friendship("uuid", timestamp with time zone, "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."safe_update_friendship"("fid" "uuid", "expected_updated_at" timestamp with time zone, "new_status" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  if exists (
    select 1 from friendships
    where id = fid and updated_at = expected_updated_at
  ) then
    update friendships
    set status = new_status,
        updated_at = now()
    where id = fid;
  else
    raise exception 'Friendship was modified by another user';
  end if;
end;
$$;


ALTER FUNCTION "public"."safe_update_friendship"("fid" "uuid", "expected_updated_at" timestamp with time zone, "new_status" "text") OWNER TO "postgres";

--
-- Name: search_users_with_dogs("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."search_users_with_dogs"("input" "text") RETURNS TABLE("id" "uuid", "name" "text", "dogs" "jsonb")
    LANGUAGE "plpgsql"
    AS $$begin
  return query
  select
    u.id,
    u.name,
    jsonb_agg(d) AS dogs
  from
    public.users u
  join
    public.dogs d on u.id = d.owner
  where
    (u.name ilike '%' || input || '%' or d.name ilike '%' || input || '%')
    and (u.private is null or u.private = false)
    and (d.deleted_at is null)
  group by
    u.id, u.name;
end;$$;


ALTER FUNCTION "public"."search_users_with_dogs"("input" "text") OWNER TO "postgres";

--
-- Name: set_parks_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."set_parks_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_parks_updated_at"() OWNER TO "postgres";

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

--
-- Name: tg_bump_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."tg_bump_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."tg_bump_updated_at"() OWNER TO "postgres";

--
-- Name: update_checkout("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_checkout"("checkin_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  update checkins
  set checkout_timestamp = now()
  where id = checkin_id;
END;$$;


ALTER FUNCTION "public"."update_checkout"("checkin_id" "uuid") OWNER TO "postgres";

--
-- Name: update_review_reports_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_review_reports_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO review_reports_count (review_id, count)
    VALUES (NEW.review_id, 1)
    ON CONFLICT (review_id)
    DO UPDATE SET count = review_reports_count.count + 1;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_review_reports_count"() OWNER TO "postgres";

--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."device_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "platform" "public"."platform" NOT NULL,
    "updated_at" timestamp with time zone,
    "device_id" "text" NOT NULL
);


ALTER TABLE "public"."device_tokens" OWNER TO "postgres";

--
-- Name: dog_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."dog_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dog_id" "uuid" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dog_images_bucket_id_check" CHECK (("bucket_id" = ANY (ARRAY['dogs'::"text", 'users'::"text"])))
);


ALTER TABLE "public"."dog_images" OWNER TO "postgres";

--
-- Name: dog_invites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."dog_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dog_id" "uuid" NOT NULL,
    "inviter_user_id" "uuid" NOT NULL,
    "invitee_user_id" "uuid" NOT NULL,
    "role_offered" "public"."dog_member_role" NOT NULL,
    "is_primary_transfer" boolean DEFAULT false NOT NULL,
    "status" "public"."dog_invite_status" DEFAULT 'PENDING'::"public"."dog_invite_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    CONSTRAINT "dog_invites_no_primary_offer" CHECK (("role_offered" = ANY (ARRAY['EDITOR'::"public"."dog_member_role", 'VIEWER'::"public"."dog_member_role"]))),
    CONSTRAINT "dog_invites_no_self_invite" CHECK (("inviter_user_id" <> "invitee_user_id"))
);


ALTER TABLE "public"."dog_invites" OWNER TO "postgres";

--
-- Name: dog_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."dog_members" (
    "dog_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."dog_member_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."dog_members" OWNER TO "postgres";

--
-- Name: dogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."dogs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "birthday" timestamp with time zone DEFAULT "now"() NOT NULL,
    "breed" "text",
    "dislikes" "text"[],
    "likes" "text"[],
    "name" "text",
    "gender" "text",
    "energy" "text",
    "size" "text",
    "temperament" "text",
    "owner" "uuid",
    "description" "text",
    "possessive" "text",
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."dogs" OWNER TO "postgres";

--
-- Name: dogs_count_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."dogs_count_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "count" numeric,
    "park_id" "uuid"
);


ALTER TABLE "public"."dogs_count_reports" OWNER TO "postgres";

--
-- Name: park_event_invitees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."park_event_invitees" (
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."invite_status" DEFAULT 'INVITED'::"public"."invite_status" NOT NULL,
    "responded_at" timestamp with time zone,
    "added_by" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."park_event_invitees" OWNER TO "postgres";

--
-- Name: park_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."park_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "park_id" "uuid" NOT NULL,
    "start_at" timestamp with time zone NOT NULL,
    "end_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60 NOT NULL,
    "visibility" "public"."park_event_visibility" NOT NULL,
    "message" "text",
    "status" "public"."park_event_status" DEFAULT 'ACTIVE'::"public"."park_event_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."park_events" OWNER TO "postgres";

--
-- Name: event_participations_v; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."event_participations_v" WITH ("security_invoker"='on') AS
 SELECT "e"."id" AS "event_id",
    "e"."creator_id" AS "user_id",
    "e"."start_at",
    "e"."end_at",
    "tstzrange"("e"."start_at", "e"."end_at", '[)'::"text") AS "time_range"
   FROM "public"."park_events" "e"
  WHERE ("e"."status" = 'ACTIVE'::"public"."park_event_status")
UNION ALL
 SELECT "i"."event_id",
    "i"."user_id",
    "e"."start_at",
    "e"."end_at",
    "tstzrange"("e"."start_at", "e"."end_at", '[)'::"text") AS "time_range"
   FROM ("public"."park_event_invitees" "i"
     JOIN "public"."park_events" "e" ON (("e"."id" = "i"."event_id")))
  WHERE (("e"."status" = 'ACTIVE'::"public"."park_event_status") AND ("i"."status" = ANY (ARRAY['INVITED'::"public"."invite_status", 'ACCEPTED'::"public"."invite_status"])));


ALTER TABLE "public"."event_participations_v" OWNER TO "postgres";

--
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "park_id" "uuid" NOT NULL
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";

--
-- Name: friendships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."friendships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"public"."friendship_status" NOT NULL,
    "requestee_id" "uuid",
    "requester_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_low" "uuid" GENERATED ALWAYS AS (LEAST("requester_id", "requestee_id")) STORED,
    "user_high" "uuid" GENERATED ALWAYS AS (GREATEST("requester_id", "requestee_id")) STORED
);


ALTER TABLE "public"."friendships" OWNER TO "postgres";

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "delivered_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "sender_id" "uuid",
    "receiver_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "data" "jsonb",
    "title" "text",
    "delivery_attempts" smallint DEFAULT '0'::smallint NOT NULL,
    "seen_at" timestamp with time zone,
    "app_message" "text",
    "push_message" "text",
    "is_ready" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "target_type" "public"."notification_target_type",
    "target_id" "uuid"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";

--
-- Name: notifications_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."notifications_preferences" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "muted" boolean DEFAULT false NOT NULL,
    "friend_request" boolean DEFAULT true NOT NULL,
    "friend_approval" boolean DEFAULT true NOT NULL,
    "park_invite" boolean DEFAULT true NOT NULL,
    "park_invite_accept" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "park_invite_decline" boolean DEFAULT true NOT NULL,
    "park_invite_cancelled" boolean NOT NULL,
    "dog_invite" boolean DEFAULT true,
    "dog_primary_transfer_invite" boolean DEFAULT true,
    "dog_invite_accept" boolean DEFAULT true,
    "dog_invite_decline" boolean DEFAULT true,
    "dog_primary_transfer_accept" boolean DEFAULT true
);


ALTER TABLE "public"."notifications_preferences" OWNER TO "postgres";

--
-- Name: park_condition_observations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."park_condition_observations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "park_id" "uuid" NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "condition" "public"."park_condition" NOT NULL,
    "status" "public"."condition_observed_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."park_condition_observations" OWNER TO "postgres";

--
-- Name: park_condition_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."park_condition_rules" (
    "condition" "public"."park_condition" NOT NULL,
    "ttl" interval NOT NULL
);


ALTER TABLE "public"."park_condition_rules" OWNER TO "postgres";

--
-- Name: park_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."park_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "park_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text"
);


ALTER TABLE "public"."park_reports" OWNER TO "postgres";

--
-- Name: TABLE "park_reports"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."park_reports" IS 'reports of park wrong details';


--
-- Name: park_suggestions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."park_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "address" "text" NOT NULL,
    "city" "text" NOT NULL,
    "location" "jsonb" NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "size_category" "public"."park_size_category"
);


ALTER TABLE "public"."park_suggestions" OWNER TO "postgres";

--
-- Name: COLUMN "park_suggestions"."size_category"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."park_suggestions"."size_category" IS 'Approximate park size category selected when submitting the park.';


--
-- Name: park_translations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."park_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "park_id" "uuid" NOT NULL,
    "language" "public"."app_language" NOT NULL,
    "name" "text" NOT NULL,
    "city" "text" NOT NULL,
    "address" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."park_translations" OWNER TO "postgres";

--
-- Name: parks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."parks" (
    "address" "text",
    "city" "text",
    "materials" "text"[],
    "name" "text",
    "shade" numeric,
    "location" "jsonb",
    "has_facilities" boolean,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "size_category" "public"."park_size_category"
);


ALTER TABLE "public"."parks" OWNER TO "postgres";

--
-- Name: COLUMN "parks"."size_category"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."parks"."size_category" IS 'User-selected approximate park size category.';


--
-- Name: review_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."review_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reason" "text",
    "review_id" "uuid"
);


ALTER TABLE "public"."review_reports" OWNER TO "postgres";

--
-- Name: review_reports_count; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."review_reports_count" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "count" numeric NOT NULL,
    "review_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."review_reports_count" OWNER TO "postgres";

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "rank" real,
    "title" "text",
    "content" "text",
    "user_id" "uuid",
    "park_id" "uuid"
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "private" boolean
);


ALTER TABLE "public"."users" OWNER TO "postgres";

--
-- Name: checkins checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_pkey" PRIMARY KEY ("id");


--
-- Name: device_tokens device_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("device_id");


--
-- Name: device_tokens device_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_token_key" UNIQUE ("token");


--
-- Name: device_tokens device_tokens_user_device_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_user_device_key" UNIQUE ("user_id", "device_id");


--
-- Name: dog_images dog_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dog_images"
    ADD CONSTRAINT "dog_images_pkey" PRIMARY KEY ("id");


--
-- Name: dog_invites dog_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dog_invites"
    ADD CONSTRAINT "dog_invites_pkey" PRIMARY KEY ("id");


--
-- Name: dog_members dog_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dog_members"
    ADD CONSTRAINT "dog_members_pkey" PRIMARY KEY ("id");


--
-- Name: dogs_count_reports dogs_count_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dogs_count_reports"
    ADD CONSTRAINT "dogs_count_reports_pkey" PRIMARY KEY ("id");


--
-- Name: dogs dogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dogs"
    ADD CONSTRAINT "dogs_pkey" PRIMARY KEY ("id");


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("id");


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");


--
-- Name: notifications_preferences notifications_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications_preferences"
    ADD CONSTRAINT "notifications_preferences_pkey" PRIMARY KEY ("id");


--
-- Name: notifications_preferences notifications_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications_preferences"
    ADD CONSTRAINT "notifications_preferences_user_id_key" UNIQUE ("user_id");


--
-- Name: park_condition_observations park_condition_observations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_condition_observations"
    ADD CONSTRAINT "park_condition_observations_pkey" PRIMARY KEY ("id");


--
-- Name: park_condition_rules park_condition_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_condition_rules"
    ADD CONSTRAINT "park_condition_rules_pkey" PRIMARY KEY ("condition");


--
-- Name: park_event_invitees park_event_invitees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_event_invitees"
    ADD CONSTRAINT "park_event_invitees_pkey" PRIMARY KEY ("event_id", "user_id");


--
-- Name: park_events park_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_events"
    ADD CONSTRAINT "park_events_pkey" PRIMARY KEY ("id");


--
-- Name: park_reports park_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_reports"
    ADD CONSTRAINT "park_reports_pkey" PRIMARY KEY ("id");


--
-- Name: park_suggestions park_suggestion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_suggestions"
    ADD CONSTRAINT "park_suggestion_pkey" PRIMARY KEY ("id");


--
-- Name: park_translations park_translations_park_id_language_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_translations"
    ADD CONSTRAINT "park_translations_park_id_language_key" UNIQUE ("park_id", "language");


--
-- Name: park_translations park_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_translations"
    ADD CONSTRAINT "park_translations_pkey" PRIMARY KEY ("id");


--
-- Name: parks parks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."parks"
    ADD CONSTRAINT "parks_pkey" PRIMARY KEY ("id");


--
-- Name: review_reports_count review_reports_count_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."review_reports_count"
    ADD CONSTRAINT "review_reports_count_pkey" PRIMARY KEY ("review_id");


--
-- Name: review_reports review_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."review_reports"
    ADD CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id");


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


--
-- Name: dog_images_bucket_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dog_images_bucket_idx" ON "public"."dog_images" USING "btree" ("dog_id", "bucket_id");


--
-- Name: dog_images_dog_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dog_images_dog_id_idx" ON "public"."dog_images" USING "btree" ("dog_id");


--
-- Name: dog_images_one_primary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "dog_images_one_primary" ON "public"."dog_images" USING "btree" ("dog_id") WHERE ("is_primary" = true);


--
-- Name: dog_invites_dog_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dog_invites_dog_id_idx" ON "public"."dog_invites" USING "btree" ("dog_id");


--
-- Name: dog_invites_invitee_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dog_invites_invitee_id_idx" ON "public"."dog_invites" USING "btree" ("invitee_user_id");


--
-- Name: dog_invites_pending_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "dog_invites_pending_unique" ON "public"."dog_invites" USING "btree" ("dog_id", "invitee_user_id") WHERE ("status" = 'PENDING'::"public"."dog_invite_status");


--
-- Name: dog_members_one_primary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "dog_members_one_primary" ON "public"."dog_members" USING "btree" ("dog_id") WHERE ("role" = 'PRIMARY_OWNER'::"public"."dog_member_role");


--
-- Name: dog_members_unique_dog_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "dog_members_unique_dog_user" ON "public"."dog_members" USING "btree" ("dog_id", "user_id");


--
-- Name: dog_members_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dog_members_user_id_idx" ON "public"."dog_members" USING "btree" ("user_id");


--
-- Name: favorites_user_id_park_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "favorites_user_id_park_id_idx" ON "public"."favorites" USING "btree" ("user_id", "park_id");


--
-- Name: friendships_unique_pair; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "friendships_unique_pair" ON "public"."friendships" USING "btree" ("user_low", "user_high");


--
-- Name: idx_notifications_receiver_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_notifications_receiver_created" ON "public"."notifications" USING "btree" ("receiver_id", "created_at" DESC);


--
-- Name: idx_notifications_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_notifications_target" ON "public"."notifications" USING "btree" ("receiver_id", "target_type");


--
-- Name: idx_notifications_unread_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_notifications_unread_order" ON "public"."notifications" USING "btree" ("receiver_id", "created_at" DESC) WHERE ("read_at" IS NULL);


--
-- Name: idx_notifications_unseen_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_notifications_unseen_order" ON "public"."notifications" USING "btree" ("receiver_id", "created_at" DESC) WHERE ("seen_at" IS NULL);


--
-- Name: idx_park_translations_language_park; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_park_translations_language_park" ON "public"."park_translations" USING "btree" ("language", "park_id");


--
-- Name: idx_pco_not_present_latest; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_pco_not_present_latest" ON "public"."park_condition_observations" USING "btree" ("park_id", "condition", "created_at" DESC) WHERE ("status" = 'NOT_PRESENT'::"public"."condition_observed_status");


--
-- Name: idx_pco_present_latest; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_pco_present_latest" ON "public"."park_condition_observations" USING "btree" ("park_id", "condition", "created_at" DESC) WHERE ("status" = 'PRESENT'::"public"."condition_observed_status");


--
-- Name: idx_pco_reporter_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_pco_reporter_time" ON "public"."park_condition_observations" USING "btree" ("reporter_id", "created_at" DESC);


--
-- Name: ix_device_tokens_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ix_device_tokens_user" ON "public"."device_tokens" USING "btree" ("user_id");


--
-- Name: ix_device_tokens_user_platform; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ix_device_tokens_user_platform" ON "public"."device_tokens" USING "btree" ("user_id", "platform");


--
-- Name: park_event_invitees_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "park_event_invitees_active_idx" ON "public"."park_event_invitees" USING "btree" ("event_id") WHERE ("status" = ANY (ARRAY['INVITED'::"public"."invite_status", 'ACCEPTED'::"public"."invite_status"]));


--
-- Name: park_event_invitees_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "park_event_invitees_user_idx" ON "public"."park_event_invitees" USING "btree" ("user_id", "event_id");


--
-- Name: park_events_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "park_events_active_idx" ON "public"."park_events" USING "btree" ("start_at") WHERE ("status" = 'ACTIVE'::"public"."park_event_status");


--
-- Name: park_events_creator_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "park_events_creator_idx" ON "public"."park_events" USING "btree" ("creator_id", "start_at" DESC);


--
-- Name: park_events_park_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "park_events_park_idx" ON "public"."park_events" USING "btree" ("park_id", "start_at" DESC);


--
-- Name: unique_friendship_request; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "unique_friendship_request" ON "public"."friendships" USING "btree" ("requester_id", "requestee_id");


--
-- Name: unique_open_checkin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "unique_open_checkin" ON "public"."checkins" USING "btree" ("user_id", "park_id") WHERE ("checkout_timestamp" IS NULL);


--
-- Name: dog_invites dog_invite_notify_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "dog_invite_notify_trigger" AFTER INSERT OR UPDATE OF "status" ON "public"."dog_invites" FOR EACH ROW EXECUTE FUNCTION "public"."notify_dog_invite_change"();


--
-- Name: friendships friendship_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "friendship_change" AFTER INSERT OR UPDATE ON "public"."friendships" FOR EACH ROW EXECUTE FUNCTION "public"."notify_on_friendship_change"();


--
-- Name: reviews handle_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');


--
-- Name: park_suggestions newParkHook; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "newParkHook" AFTER INSERT ON "public"."park_suggestions" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('http://host.docker.internal:54321/functions/v1/send-new-park-mail', 'POST', '{"Content-type":"application/json","Authorization":"Bearer LOCAL_TEST_SERVICE_ROLE_KEY"}', '{}', '5000');


--
-- Name: park_reports reportParkHook; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "reportParkHook" AFTER INSERT ON "public"."park_reports" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('http://host.docker.internal:54321/functions/v1/send-report-park-mail', 'POST', '{"Content-type":"application/json","Authorization":"Bearer LOCAL_TEST_SERVICE_ROLE_KEY"}', '{}', '5000');


--
-- Name: review_reports_count reviewReportCountHook; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "reviewReportCountHook" AFTER INSERT OR UPDATE ON "public"."review_reports_count" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('http://host.docker.internal:54321/functions/v1/check-review-reports', 'POST', '{"Content-type":"application/json","Authorization":"Bearer LOCAL_TEST_SERVICE_ROLE_KEY"}', '{}', '5000');


--
-- Name: notifications sendPushNotification; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "sendPushNotification" AFTER INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('http://host.docker.internal:54321/functions/v1/send-push-notification', 'POST', '{"Content-type":"application/json","Authorization":"Bearer LOCAL_TEST_SERVICE_ROLE_KEY"}', '{}', '5000');


--
-- Name: parks set_parks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_parks_updated_at" BEFORE UPDATE ON "public"."parks" FOR EACH ROW EXECUTE FUNCTION "public"."set_parks_updated_at"();


--
-- Name: notifications_preferences set_updated_at_on_notifications_preferences; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_updated_at_on_notifications_preferences" BEFORE UPDATE ON "public"."notifications_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: device_tokens trg_device_tokens_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_device_tokens_updated_at" BEFORE UPDATE ON "public"."device_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: notifications trg_notifications_bump_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_notifications_bump_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."tg_bump_updated_at"();


--
-- Name: park_events trg_park_event_cancel_notifications; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_park_event_cancel_notifications" AFTER UPDATE OF "status" ON "public"."park_events" FOR EACH ROW EXECUTE FUNCTION "public"."handle_park_event_cancel_notifications"();


--
-- Name: park_event_invitees trg_park_event_invitation_notifications; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_park_event_invitation_notifications" AFTER INSERT OR UPDATE OF "status" ON "public"."park_event_invitees" FOR EACH ROW EXECUTE FUNCTION "public"."handle_park_event_invitation_notifications"();


--
-- Name: park_events trg_park_events_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_park_events_updated_at" BEFORE UPDATE ON "public"."park_events" FOR EACH ROW EXECUTE FUNCTION "public"."park_events_set_updated_at"();


--
-- Name: review_reports trigger_update_review_reports_count; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trigger_update_review_reports_count" AFTER INSERT ON "public"."review_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_review_reports_count"();


--
-- Name: checkins checkins_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE CASCADE;


--
-- Name: checkins checkins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: device_tokens device_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: dog_images dog_images_dog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dog_images"
    ADD CONSTRAINT "dog_images_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE CASCADE;


--
-- Name: dog_invites dog_invites_dog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dog_invites"
    ADD CONSTRAINT "dog_invites_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE CASCADE;


--
-- Name: dog_invites dog_invites_invitee_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dog_invites"
    ADD CONSTRAINT "dog_invites_invitee_user_id_fkey" FOREIGN KEY ("invitee_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: dog_invites dog_invites_inviter_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dog_invites"
    ADD CONSTRAINT "dog_invites_inviter_user_id_fkey" FOREIGN KEY ("inviter_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: dog_members dog_members_dog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dog_members"
    ADD CONSTRAINT "dog_members_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE CASCADE;


--
-- Name: dog_members dog_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dog_members"
    ADD CONSTRAINT "dog_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: dogs_count_reports dogs_count_reports_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dogs_count_reports"
    ADD CONSTRAINT "dogs_count_reports_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE CASCADE;


--
-- Name: dogs dogs_owner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."dogs"
    ADD CONSTRAINT "dogs_owner_fkey" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: favorites favorites_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: friendships friendships_requestee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_requestee_id_fkey" FOREIGN KEY ("requestee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: friendships friendships_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: notifications_preferences notifications_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications_preferences"
    ADD CONSTRAINT "notifications_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: park_condition_observations park_condition_observations_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_condition_observations"
    ADD CONSTRAINT "park_condition_observations_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE CASCADE;


--
-- Name: park_condition_observations park_condition_observations_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_condition_observations"
    ADD CONSTRAINT "park_condition_observations_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: park_event_invitees park_event_invitees_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_event_invitees"
    ADD CONSTRAINT "park_event_invitees_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: park_event_invitees park_event_invitees_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_event_invitees"
    ADD CONSTRAINT "park_event_invitees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."park_events"("id") ON DELETE CASCADE;


--
-- Name: park_event_invitees park_event_invitees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_event_invitees"
    ADD CONSTRAINT "park_event_invitees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: park_events park_events_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_events"
    ADD CONSTRAINT "park_events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: park_events park_events_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_events"
    ADD CONSTRAINT "park_events_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE CASCADE;


--
-- Name: park_reports park_reports_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_reports"
    ADD CONSTRAINT "park_reports_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE CASCADE;


--
-- Name: park_reports park_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_reports"
    ADD CONSTRAINT "park_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: park_suggestions park_suggestion_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_suggestions"
    ADD CONSTRAINT "park_suggestion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: park_translations park_translations_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."park_translations"
    ADD CONSTRAINT "park_translations_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE CASCADE;


--
-- Name: review_reports_count review_reports_count_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."review_reports_count"
    ADD CONSTRAINT "review_reports_count_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE;


--
-- Name: review_reports review_reports_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."review_reports"
    ADD CONSTRAINT "review_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE;


--
-- Name: reviews reviews_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: review_reports_count Allow update for authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow update for authenticated users" ON "public"."review_reports_count" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);


--
-- Name: users Enable delete for users based on id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable delete for users based on id" ON "public"."users" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));


--
-- Name: notifications_preferences Enable delete for users based on user_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable delete for users based on user_id" ON "public"."notifications_preferences" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


--
-- Name: users Enable insert for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for all users" ON "public"."users" FOR INSERT WITH CHECK (true);


--
-- Name: checkins Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users only" ON "public"."checkins" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: dogs Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users only" ON "public"."dogs" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: dogs_count_reports Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users only" ON "public"."dogs_count_reports" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: favorites Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users only" ON "public"."favorites" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: friendships Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users only" ON "public"."friendships" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: notifications Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users only" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: notifications_preferences Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users only" ON "public"."notifications_preferences" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: park_reports Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users only" ON "public"."park_reports" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: park_suggestions Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users only" ON "public"."park_suggestions" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: review_reports Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users only" ON "public"."review_reports" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: review_reports_count Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users only" ON "public"."review_reports_count" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: reviews Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users only" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: checkins Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."checkins" FOR SELECT USING (true);


--
-- Name: dogs Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."dogs" FOR SELECT USING (true);


--
-- Name: dogs_count_reports Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."dogs_count_reports" FOR SELECT USING (true);


--
-- Name: favorites Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."favorites" FOR SELECT USING (true);


--
-- Name: parks Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."parks" FOR SELECT USING (true);


--
-- Name: reviews Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."reviews" FOR SELECT USING (true);


--
-- Name: users Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."users" FOR SELECT USING (true);


--
-- Name: parks Enable update for authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable update for authenticated users" ON "public"."parks" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);


--
-- Name: checkins Enable update for users based on id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable update for users based on id" ON "public"."checkins" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


--
-- Name: friendships Enable update for users based on id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable update for users based on id" ON "public"."friendships" FOR UPDATE TO "authenticated" USING ((("requestee_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("requester_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("requestee_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("requester_id" = ( SELECT "auth"."uid"() AS "uid"))));


--
-- Name: users Enable update for users based on id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable update for users based on id" ON "public"."users" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));


--
-- Name: favorites Enable update for users based on user id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable update for users based on user id" ON "public"."favorites" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


--
-- Name: notifications_preferences Enable update for users based on user_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable update for users based on user_id" ON "public"."notifications_preferences" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


--
-- Name: friendships Enable users to view their own data only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable users to view their own data only" ON "public"."friendships" FOR SELECT TO "authenticated" USING ((("requestee_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("requester_id" = ( SELECT "auth"."uid"() AS "uid"))));


--
-- Name: notifications_preferences Enable users to view their own data only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable users to view their own data only" ON "public"."notifications_preferences" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


--
-- Name: device_tokens Users can manage their own device tokens; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own device tokens" ON "public"."device_tokens" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


--
-- Name: notifications Users can read their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "receiver_id"));


--
-- Name: checkins; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."checkins" ENABLE ROW LEVEL SECURITY;

--
-- Name: device_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."device_tokens" ENABLE ROW LEVEL SECURITY;

--
-- Name: dog_images; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."dog_images" ENABLE ROW LEVEL SECURITY;

--
-- Name: dog_images dog_images_delete_owner_editor; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dog_images_delete_owner_editor" ON "public"."dog_images" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."dog_members" "m"
  WHERE (("m"."dog_id" = "dog_images"."dog_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['PRIMARY_OWNER'::"public"."dog_member_role", 'EDITOR'::"public"."dog_member_role"]))))) AND (EXISTS ( SELECT 1
   FROM "public"."dogs" "d"
  WHERE (("d"."id" = "dog_images"."dog_id") AND ("d"."deleted_at" IS NULL))))));


--
-- Name: dog_images dog_images_insert_owner_editor; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dog_images_insert_owner_editor" ON "public"."dog_images" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."dog_members" "m"
  WHERE (("m"."dog_id" = "dog_images"."dog_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['PRIMARY_OWNER'::"public"."dog_member_role", 'EDITOR'::"public"."dog_member_role"]))))) AND (EXISTS ( SELECT 1
   FROM "public"."dogs" "d"
  WHERE (("d"."id" = "dog_images"."dog_id") AND ("d"."deleted_at" IS NULL))))));


--
-- Name: dog_images dog_images_select_public; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dog_images_select_public" ON "public"."dog_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."dogs" "d"
  WHERE (("d"."id" = "dog_images"."dog_id") AND ("d"."deleted_at" IS NULL)))));


--
-- Name: dog_images dog_images_update_owner_editor; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dog_images_update_owner_editor" ON "public"."dog_images" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."dog_members" "m"
  WHERE (("m"."dog_id" = "dog_images"."dog_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['PRIMARY_OWNER'::"public"."dog_member_role", 'EDITOR'::"public"."dog_member_role"])))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."dog_members" "m"
  WHERE (("m"."dog_id" = "dog_images"."dog_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['PRIMARY_OWNER'::"public"."dog_member_role", 'EDITOR'::"public"."dog_member_role"]))))) AND (EXISTS ( SELECT 1
   FROM "public"."dogs" "d"
  WHERE (("d"."id" = "dog_images"."dog_id") AND ("d"."deleted_at" IS NULL))))));


--
-- Name: dog_invites; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."dog_invites" ENABLE ROW LEVEL SECURITY;

--
-- Name: dog_invites dog_invites_insert_primary; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dog_invites_insert_primary" ON "public"."dog_invites" FOR INSERT WITH CHECK ((("auth"."uid"() = "inviter_user_id") AND (EXISTS ( SELECT 1
   FROM "public"."dog_members" "m"
  WHERE (("m"."dog_id" = "dog_invites"."dog_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = 'PRIMARY_OWNER'::"public"."dog_member_role")))) AND (("is_primary_transfer" = true) OR (NOT (EXISTS ( SELECT 1
   FROM "public"."dog_members" "m2"
  WHERE (("m2"."dog_id" = "dog_invites"."dog_id") AND ("m2"."user_id" = "dog_invites"."invitee_user_id")))))) AND (EXISTS ( SELECT 1
   FROM "public"."dogs" "d"
  WHERE (("d"."id" = "dog_invites"."dog_id") AND ("d"."deleted_at" IS NULL))))));


--
-- Name: dog_invites dog_invites_select_parties; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dog_invites_select_parties" ON "public"."dog_invites" FOR SELECT USING ((("auth"."uid"() = "inviter_user_id") OR ("auth"."uid"() = "invitee_user_id")));


--
-- Name: dog_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."dog_members" ENABLE ROW LEVEL SECURITY;

--
-- Name: dog_members dog_members_delete_primary; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dog_members_delete_primary" ON "public"."dog_members" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."dog_members" "m"
  WHERE (("m"."dog_id" = "dog_members"."dog_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = 'PRIMARY_OWNER'::"public"."dog_member_role")))));


--
-- Name: dog_members dog_members_insert_primary; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dog_members_insert_primary" ON "public"."dog_members" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."dog_members" "m"
  WHERE (("m"."dog_id" = "dog_members"."dog_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = 'PRIMARY_OWNER'::"public"."dog_member_role")))));


--
-- Name: dog_members dog_members_select_public; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dog_members_select_public" ON "public"."dog_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."dogs" "d"
  WHERE (("d"."id" = "dog_members"."dog_id") AND ("d"."deleted_at" IS NULL)))));


--
-- Name: dog_members dog_members_update_primary; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dog_members_update_primary" ON "public"."dog_members" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."dog_members" "m"
  WHERE (("m"."dog_id" = "dog_members"."dog_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = 'PRIMARY_OWNER'::"public"."dog_member_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."dog_members" "m"
  WHERE (("m"."dog_id" = "dog_members"."dog_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = 'PRIMARY_OWNER'::"public"."dog_member_role")))));


--
-- Name: dogs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."dogs" ENABLE ROW LEVEL SECURITY;

--
-- Name: dogs_count_reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."dogs_count_reports" ENABLE ROW LEVEL SECURITY;

--
-- Name: dogs dogs_select_public; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dogs_select_public" ON "public"."dogs" FOR SELECT USING (("deleted_at" IS NULL));


--
-- Name: dogs dogs_update_owner_editor; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "dogs_update_owner_editor" ON "public"."dogs" FOR UPDATE USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."dog_members" "m"
  WHERE (("m"."dog_id" = "dogs"."id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['PRIMARY_OWNER'::"public"."dog_member_role", 'EDITOR'::"public"."dog_member_role"]))))))) WITH CHECK (((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."dog_members" "m"
  WHERE (("m"."dog_id" = "dogs"."id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['PRIMARY_OWNER'::"public"."dog_member_role", 'EDITOR'::"public"."dog_member_role"])))))) OR (("deleted_at" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."dog_members" "m"
  WHERE (("m"."dog_id" = "dogs"."id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = 'PRIMARY_OWNER'::"public"."dog_member_role")))))));


--
-- Name: dogs enable delete for dog's owner only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "enable delete for dog's owner only" ON "public"."dogs" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner"));


--
-- Name: friendships enable delete for relevant users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "enable delete for relevant users only" ON "public"."friendships" FOR DELETE TO "authenticated" USING ((("requestee_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("requester_id" = ( SELECT "auth"."uid"() AS "uid"))));


--
-- Name: reviews enable delete for review's owner only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "enable delete for review's owner only" ON "public"."reviews" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


--
-- Name: favorites enable delete for users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "enable delete for users only" ON "public"."favorites" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


--
-- Name: dogs enable update for dog's owner only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "enable update for dog's owner only" ON "public"."dogs" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "owner"));


--
-- Name: reviews enable update for review owner user only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "enable update for review owner user only" ON "public"."reviews" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


--
-- Name: favorites; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;

--
-- Name: friendships; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."friendships" ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications notif_update_by_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "notif_update_by_owner" ON "public"."notifications" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "receiver_id"));


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."notifications_preferences" ENABLE ROW LEVEL SECURITY;

--
-- Name: park_condition_observations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."park_condition_observations" ENABLE ROW LEVEL SECURITY;

--
-- Name: park_condition_rules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."park_condition_rules" ENABLE ROW LEVEL SECURITY;

--
-- Name: park_event_invitees; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."park_event_invitees" ENABLE ROW LEVEL SECURITY;

--
-- Name: park_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."park_events" ENABLE ROW LEVEL SECURITY;

--
-- Name: park_reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."park_reports" ENABLE ROW LEVEL SECURITY;

--
-- Name: park_suggestions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."park_suggestions" ENABLE ROW LEVEL SECURITY;

--
-- Name: park_translations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."park_translations" ENABLE ROW LEVEL SECURITY;

--
-- Name: park_translations park_translations_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "park_translations_read_all" ON "public"."park_translations" FOR SELECT USING (true);


--
-- Name: parks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."parks" ENABLE ROW LEVEL SECURITY;

--
-- Name: park_condition_observations pco_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "pco_insert" ON "public"."park_condition_observations" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "reporter_id"));


--
-- Name: park_condition_observations pco_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "pco_select" ON "public"."park_condition_observations" FOR SELECT USING (true);


--
-- Name: park_events pe_delete_creator; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "pe_delete_creator" ON "public"."park_events" FOR DELETE USING (("creator_id" = "auth"."uid"()));


--
-- Name: park_events pe_insert_creator; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "pe_insert_creator" ON "public"."park_events" FOR INSERT WITH CHECK (("creator_id" = "auth"."uid"()));


--
-- Name: park_events pe_select_participants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "pe_select_participants" ON "public"."park_events" FOR SELECT USING ((("creator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."park_event_invitees" "i"
  WHERE (("i"."event_id" = "park_events"."id") AND ("i"."user_id" = "auth"."uid"()))))));


--
-- Name: park_events pe_update_creator; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "pe_update_creator" ON "public"."park_events" FOR UPDATE USING (("creator_id" = "auth"."uid"())) WITH CHECK (("creator_id" = "auth"."uid"()));


--
-- Name: park_event_invitees pei_delete_by_creator; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "pei_delete_by_creator" ON "public"."park_event_invitees" FOR DELETE TO "authenticated" USING (("added_by" = "auth"."uid"()));


--
-- Name: park_event_invitees pei_insert_by_creator; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "pei_insert_by_creator" ON "public"."park_event_invitees" FOR INSERT TO "authenticated" WITH CHECK (("added_by" = "auth"."uid"()));


--
-- Name: park_event_invitees pei_select_participants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "pei_select_participants" ON "public"."park_event_invitees" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("added_by" = "auth"."uid"())));


--
-- Name: park_event_invitees pei_update_by_creator; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "pei_update_by_creator" ON "public"."park_event_invitees" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."park_events" "e"
  WHERE (("e"."id" = "park_event_invitees"."event_id") AND ("e"."creator_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."park_events" "e"
  WHERE (("e"."id" = "park_event_invitees"."event_id") AND ("e"."creator_id" = "auth"."uid"())))));


--
-- Name: park_event_invitees pei_update_by_invitee; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "pei_update_by_invitee" ON "public"."park_event_invitees" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("added_by" = "auth"."uid"()))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("added_by" = "auth"."uid"())));


--
-- Name: park_condition_rules public read constants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public read constants" ON "public"."park_condition_rules" FOR SELECT TO "authenticated", "anon" USING (true);


--
-- Name: review_reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."review_reports" ENABLE ROW LEVEL SECURITY;

--
-- Name: review_reports_count; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."review_reports_count" ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "accept_dog_invite"("p_invite_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."accept_dog_invite"("p_invite_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_dog_invite"("p_invite_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_dog_invite"("p_invite_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "accept_primary_transfer"("p_invite_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."accept_primary_transfer"("p_invite_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_primary_transfer"("p_invite_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_primary_transfer"("p_invite_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "add_event_invitees"("p_event_id" "uuid", "p_invitee_ids" "uuid"[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."add_event_invitees"("p_event_id" "uuid", "p_invitee_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."add_event_invitees"("p_event_id" "uuid", "p_invitee_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_event_invitees"("p_event_id" "uuid", "p_invitee_ids" "uuid"[]) TO "service_role";


--
-- Name: FUNCTION "add_park_condition_observation"("p_park_id" "uuid", "p_condition" "public"."park_condition", "p_status" "public"."condition_observed_status"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."add_park_condition_observation"("p_park_id" "uuid", "p_condition" "public"."park_condition", "p_status" "public"."condition_observed_status") TO "anon";
GRANT ALL ON FUNCTION "public"."add_park_condition_observation"("p_park_id" "uuid", "p_condition" "public"."park_condition", "p_status" "public"."condition_observed_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_park_condition_observation"("p_park_id" "uuid", "p_condition" "public"."park_condition", "p_status" "public"."condition_observed_status") TO "service_role";


--
-- Name: FUNCTION "add_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."add_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_user"() TO "service_role";


--
-- Name: FUNCTION "api_cleanup_device_tokens"("p_device_id" "text"); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."api_cleanup_device_tokens"("p_device_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."api_cleanup_device_tokens"("p_device_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."api_cleanup_device_tokens"("p_device_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_cleanup_device_tokens"("p_device_id" "text") TO "service_role";


--
-- Name: FUNCTION "api_update_missing_park_details"("p_park_id" "uuid", "p_size_category" "public"."park_size_category", "p_materials" "text"[], "p_shade" numeric, "p_has_facilities" boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."api_update_missing_park_details"("p_park_id" "uuid", "p_size_category" "public"."park_size_category", "p_materials" "text"[], "p_shade" numeric, "p_has_facilities" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."api_update_missing_park_details"("p_park_id" "uuid", "p_size_category" "public"."park_size_category", "p_materials" "text"[], "p_shade" numeric, "p_has_facilities" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_update_missing_park_details"("p_park_id" "uuid", "p_size_category" "public"."park_size_category", "p_materials" "text"[], "p_shade" numeric, "p_has_facilities" boolean) TO "service_role";


--
-- Name: FUNCTION "api_upsert_device_token"("p_device_id" "text", "p_platform" "public"."platform", "p_token" "text"); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."api_upsert_device_token"("p_device_id" "text", "p_platform" "public"."platform", "p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."api_upsert_device_token"("p_device_id" "text", "p_platform" "public"."platform", "p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."api_upsert_device_token"("p_device_id" "text", "p_platform" "public"."platform", "p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_upsert_device_token"("p_device_id" "text", "p_platform" "public"."platform", "p_token" "text") TO "service_role";


--
-- Name: FUNCTION "cancel_dog_invite"("p_invite_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."cancel_dog_invite"("p_invite_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_dog_invite"("p_invite_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_dog_invite"("p_invite_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "check_device_token_match"("p_device_id" "text", "p_token" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."check_device_token_match"("p_device_id" "text", "p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_device_token_match"("p_device_id" "text", "p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_device_token_match"("p_device_id" "text", "p_token" "text") TO "service_role";


--
-- Name: FUNCTION "count_unseen_notifications"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."count_unseen_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_unseen_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_unseen_notifications"() TO "service_role";


--
-- Name: FUNCTION "create_dog_invite"("p_dog_id" "uuid", "p_invitee_user_id" "uuid", "p_role_offered" "public"."dog_member_role"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_dog_invite"("p_dog_id" "uuid", "p_invitee_user_id" "uuid", "p_role_offered" "public"."dog_member_role") TO "anon";
GRANT ALL ON FUNCTION "public"."create_dog_invite"("p_dog_id" "uuid", "p_invitee_user_id" "uuid", "p_role_offered" "public"."dog_member_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_dog_invite"("p_dog_id" "uuid", "p_invitee_user_id" "uuid", "p_role_offered" "public"."dog_member_role") TO "service_role";


--
-- Name: FUNCTION "create_park_event"("park_id" "uuid", "visibility" "public"."park_event_visibility", "message" "text", "invitee_ids" "uuid"[], "preset_offset_minutes" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_park_event"("park_id" "uuid", "visibility" "public"."park_event_visibility", "message" "text", "invitee_ids" "uuid"[], "preset_offset_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_park_event"("park_id" "uuid", "visibility" "public"."park_event_visibility", "message" "text", "invitee_ids" "uuid"[], "preset_offset_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_park_event"("park_id" "uuid", "visibility" "public"."park_event_visibility", "message" "text", "invitee_ids" "uuid"[], "preset_offset_minutes" integer) TO "service_role";


--
-- Name: FUNCTION "create_primary_transfer_invite"("p_dog_id" "uuid", "p_invitee_user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."create_primary_transfer_invite"("p_dog_id" "uuid", "p_invitee_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_primary_transfer_invite"("p_dog_id" "uuid", "p_invitee_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_primary_transfer_invite"("p_dog_id" "uuid", "p_invitee_user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "decline_dog_invite"("p_invite_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."decline_dog_invite"("p_invite_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decline_dog_invite"("p_invite_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decline_dog_invite"("p_invite_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "delete_dog"("dog_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."delete_dog"("dog_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_dog"("dog_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_dog"("dog_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "delete_user_folder"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."delete_user_folder"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_folder"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_folder"() TO "service_role";


--
-- Name: FUNCTION "get_active_park_conditions"("p_park_id" "uuid", "p_now" timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_active_park_conditions"("p_park_id" "uuid", "p_now" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_park_conditions"("p_park_id" "uuid", "p_now" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_park_conditions"("p_park_id" "uuid", "p_now" timestamp with time zone) TO "service_role";


--
-- Name: FUNCTION "get_event_with_invitees"("p_event_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_event_with_invitees"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_with_invitees"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_with_invitees"("p_event_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "get_favorite_park"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_favorite_park"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_favorite_park"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_favorite_park"() TO "service_role";


--
-- Name: FUNCTION "get_notifications"("p_user_id" "uuid", "p_limit" integer, "p_cursor" timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_notifications"("p_user_id" "uuid", "p_limit" integer, "p_cursor" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_notifications"("p_user_id" "uuid", "p_limit" integer, "p_cursor" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_notifications"("p_user_id" "uuid", "p_limit" integer, "p_cursor" timestamp with time zone) TO "service_role";


--
-- Name: TABLE "checkins"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."checkins" TO "anon";
GRANT ALL ON TABLE "public"."checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."checkins" TO "service_role";


--
-- Name: FUNCTION "get_park_checkins"("p_park_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_park_checkins"("p_park_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_park_checkins"("p_park_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_park_checkins"("p_park_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "get_parks_with_translations"("lang" "public"."app_language"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_parks_with_translations"("lang" "public"."app_language") TO "anon";
GRANT ALL ON FUNCTION "public"."get_parks_with_translations"("lang" "public"."app_language") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_parks_with_translations"("lang" "public"."app_language") TO "service_role";


--
-- Name: FUNCTION "get_seen_notifications"("p_user_id" "uuid", "p_limit" integer, "p_cursor" timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_seen_notifications"("p_user_id" "uuid", "p_limit" integer, "p_cursor" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_seen_notifications"("p_user_id" "uuid", "p_limit" integer, "p_cursor" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_seen_notifications"("p_user_id" "uuid", "p_limit" integer, "p_cursor" timestamp with time zone) TO "service_role";


--
-- Name: FUNCTION "get_unseen_notifications"("p_user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_unseen_notifications"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unseen_notifications"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unseen_notifications"("p_user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "get_user_events_invited"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_user_events_invited"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_events_invited"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_events_invited"() TO "service_role";


--
-- Name: FUNCTION "get_user_events_organized"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_user_events_organized"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_events_organized"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_events_organized"() TO "service_role";


--
-- Name: FUNCTION "handle_park_event_cancel_notifications"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_park_event_cancel_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_park_event_cancel_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_park_event_cancel_notifications"() TO "service_role";


--
-- Name: FUNCTION "handle_park_event_invitation_notifications"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_park_event_invitation_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_park_event_invitation_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_park_event_invitation_notifications"() TO "service_role";


--
-- Name: FUNCTION "mark_all_notifications_as_read"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"() TO "service_role";


--
-- Name: FUNCTION "mark_all_notifications_as_seen"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_seen"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_seen"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_seen"() TO "service_role";


--
-- Name: FUNCTION "mark_notification_read"("notification_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mark_notification_read"("notification_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("notification_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("notification_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "mark_notifications_seen"("p_notification_ids" "uuid"[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."mark_notifications_seen"("p_notification_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notifications_seen"("p_notification_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notifications_seen"("p_notification_ids" "uuid"[]) TO "service_role";


--
-- Name: FUNCTION "notify_dog_invite_change"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."notify_dog_invite_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_dog_invite_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_dog_invite_change"() TO "service_role";


--
-- Name: FUNCTION "notify_on_friendship_change"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."notify_on_friendship_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_friendship_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_friendship_change"() TO "service_role";


--
-- Name: FUNCTION "park_events_set_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."park_events_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."park_events_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."park_events_set_updated_at"() TO "service_role";


--
-- Name: FUNCTION "remove_device_token_by_device"("p_device_id" "text", "p_token" "text"); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."remove_device_token_by_device"("p_device_id" "text", "p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_device_token_by_device"("p_device_id" "text", "p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_device_token_by_device"("p_device_id" "text", "p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_device_token_by_device"("p_device_id" "text", "p_token" "text") TO "service_role";


--
-- Name: FUNCTION "safe_update_friendship"("fid" "uuid", "expected_updated_at" timestamp with time zone, "new_status" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."safe_update_friendship"("fid" "uuid", "expected_updated_at" timestamp with time zone, "new_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_update_friendship"("fid" "uuid", "expected_updated_at" timestamp with time zone, "new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_update_friendship"("fid" "uuid", "expected_updated_at" timestamp with time zone, "new_status" "text") TO "service_role";


--
-- Name: FUNCTION "search_users_with_dogs"("input" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."search_users_with_dogs"("input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_users_with_dogs"("input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_users_with_dogs"("input" "text") TO "service_role";


--
-- Name: FUNCTION "set_parks_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."set_parks_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_parks_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_parks_updated_at"() TO "service_role";


--
-- Name: FUNCTION "set_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


--
-- Name: FUNCTION "tg_bump_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."tg_bump_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_bump_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_bump_updated_at"() TO "service_role";


--
-- Name: FUNCTION "update_checkout"("checkin_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_checkout"("checkin_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_checkout"("checkin_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_checkout"("checkin_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "update_review_reports_count"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_review_reports_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_review_reports_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_review_reports_count"() TO "service_role";


--
-- Name: TABLE "device_tokens"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."device_tokens" TO "anon";
GRANT ALL ON TABLE "public"."device_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."device_tokens" TO "service_role";


--
-- Name: TABLE "dog_images"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."dog_images" TO "anon";
GRANT ALL ON TABLE "public"."dog_images" TO "authenticated";
GRANT ALL ON TABLE "public"."dog_images" TO "service_role";


--
-- Name: TABLE "dog_invites"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."dog_invites" TO "anon";
GRANT ALL ON TABLE "public"."dog_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."dog_invites" TO "service_role";


--
-- Name: TABLE "dog_members"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."dog_members" TO "anon";
GRANT ALL ON TABLE "public"."dog_members" TO "authenticated";
GRANT ALL ON TABLE "public"."dog_members" TO "service_role";


--
-- Name: TABLE "dogs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."dogs" TO "anon";
GRANT ALL ON TABLE "public"."dogs" TO "authenticated";
GRANT ALL ON TABLE "public"."dogs" TO "service_role";


--
-- Name: TABLE "dogs_count_reports"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."dogs_count_reports" TO "anon";
GRANT ALL ON TABLE "public"."dogs_count_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."dogs_count_reports" TO "service_role";


--
-- Name: TABLE "park_event_invitees"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."park_event_invitees" TO "anon";
GRANT ALL ON TABLE "public"."park_event_invitees" TO "authenticated";
GRANT ALL ON TABLE "public"."park_event_invitees" TO "service_role";


--
-- Name: TABLE "park_events"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."park_events" TO "anon";
GRANT ALL ON TABLE "public"."park_events" TO "authenticated";
GRANT ALL ON TABLE "public"."park_events" TO "service_role";


--
-- Name: TABLE "event_participations_v"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."event_participations_v" TO "anon";
GRANT ALL ON TABLE "public"."event_participations_v" TO "authenticated";
GRANT ALL ON TABLE "public"."event_participations_v" TO "service_role";


--
-- Name: TABLE "favorites"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";


--
-- Name: TABLE "friendships"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."friendships" TO "anon";
GRANT ALL ON TABLE "public"."friendships" TO "authenticated";
GRANT ALL ON TABLE "public"."friendships" TO "service_role";


--
-- Name: TABLE "notifications"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";


--
-- Name: TABLE "notifications_preferences"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."notifications_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notifications_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications_preferences" TO "service_role";


--
-- Name: TABLE "park_condition_observations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."park_condition_observations" TO "anon";
GRANT ALL ON TABLE "public"."park_condition_observations" TO "authenticated";
GRANT ALL ON TABLE "public"."park_condition_observations" TO "service_role";


--
-- Name: TABLE "park_condition_rules"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."park_condition_rules" TO "anon";
GRANT ALL ON TABLE "public"."park_condition_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."park_condition_rules" TO "service_role";


--
-- Name: TABLE "park_reports"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."park_reports" TO "anon";
GRANT ALL ON TABLE "public"."park_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."park_reports" TO "service_role";


--
-- Name: TABLE "park_suggestions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."park_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."park_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."park_suggestions" TO "service_role";


--
-- Name: TABLE "park_translations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."park_translations" TO "anon";
GRANT ALL ON TABLE "public"."park_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."park_translations" TO "service_role";


--
-- Name: TABLE "parks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."parks" TO "anon";
GRANT ALL ON TABLE "public"."parks" TO "authenticated";
GRANT ALL ON TABLE "public"."parks" TO "service_role";


--
-- Name: TABLE "review_reports"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."review_reports" TO "anon";
GRANT ALL ON TABLE "public"."review_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."review_reports" TO "service_role";


--
-- Name: TABLE "review_reports_count"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."review_reports_count" TO "anon";
GRANT ALL ON TABLE "public"."review_reports_count" TO "authenticated";
GRANT ALL ON TABLE "public"."review_reports_count" TO "service_role";


--
-- Name: TABLE "reviews"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";


--
-- Name: TABLE "users"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."users" TO "authenticator";
GRANT SELECT,INSERT ON TABLE "public"."users" TO "supabase_auth_admin";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- PostgreSQL database dump complete
--
