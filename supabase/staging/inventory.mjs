import {
  SOURCE_REF,
  STAGING_REF,
  assertStaging,
  querySource,
  savePrivate,
  readPrivate,
} from "./runtime.mjs";

// Only explicitly selected users enter the export; unrelated private profiles,
// device tokens, live visits and notification history are intentionally omitted.
const selection = readPrivate("selection.json");
assertStaging();
if (
  selection.userIds.length !== 2 ||
  selection.userIds.some((userId) => !/^[a-f0-9-]{36}$/.test(userId))
) {
  throw new Error("Select exactly two valid user UUIDs");
}
const selectedUsers = selection.userIds
  .map((userId) => `'${userId}'::uuid`)
  .join(",");
const result = querySource(`BEGIN READ ONLY;
WITH selected_dogs AS (
  SELECT DISTINCT d.* FROM public.dogs d
  LEFT JOIN public.dog_members m ON m.dog_id=d.id
  WHERE d.owner IN (${selectedUsers}) OR m.user_id IN (${selectedUsers})
)
SELECT jsonb_build_object(
  'sourceRef','${SOURCE_REF}', 'stagingRef','${STAGING_REF}',
  'authUsers',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'email',email,'email_confirmed_at',email_confirmed_at)), '[]') FROM auth.users WHERE id IN (${selectedUsers})),
  'users',(SELECT coalesce(jsonb_agg(to_jsonb(u)), '[]') FROM public.users u WHERE id IN (${selectedUsers})),
  'dogs',(SELECT coalesce(jsonb_agg(to_jsonb(d)), '[]') FROM selected_dogs d),
  'dog_members',(SELECT coalesce(jsonb_agg(to_jsonb(m)), '[]') FROM public.dog_members m WHERE dog_id IN (SELECT id FROM selected_dogs)),
  'dog_images',(SELECT coalesce(jsonb_agg(to_jsonb(i)), '[]') FROM public.dog_images i WHERE dog_id IN (SELECT id FROM selected_dogs)),
  'friendships',(SELECT coalesce(jsonb_agg(to_jsonb(f)), '[]') FROM public.friendships f WHERE requester_id IN (${selectedUsers}) AND requestee_id IN (${selectedUsers})),
  'notifications_preferences',(SELECT coalesce(jsonb_agg(to_jsonb(p)), '[]') FROM public.notifications_preferences p WHERE user_id IN (${selectedUsers})),
  'favorites',(SELECT coalesce(jsonb_agg(to_jsonb(f)), '[]') FROM public.favorites f WHERE user_id IN (${selectedUsers})),
  'parks',(SELECT coalesce(jsonb_agg(to_jsonb(p)), '[]') FROM public.parks p),
  'park_translations',(SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.park_translations t),
  'park_condition_rules',(SELECT coalesce(jsonb_agg(to_jsonb(r)), '[]') FROM public.park_condition_rules r),
  'objects',(SELECT coalesce(jsonb_agg(jsonb_build_object('bucket',bucket_id,'path',name,'metadata',metadata)), '[]') FROM storage.objects WHERE bucket_id='parks' OR (bucket_id='users' AND split_part(name,'/',1) IN (${selection.userIds.map((userId) => `'${userId}'`).join(",")})) OR (bucket_id='dogs' AND split_part(name,'/',1) IN (SELECT id::text FROM selected_dogs))),
  'foreignKeys',(SELECT jsonb_agg(jsonb_build_object('table',conrelid::regclass::text,'definition',pg_get_constraintdef(oid))) FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace),
  'authTriggers',(SELECT jsonb_agg(jsonb_build_object('name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid))) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE c.relnamespace='auth'::regnamespace AND NOT t.tgisinternal),
  'storagePolicies',(SELECT jsonb_agg(jsonb_build_object('name',policyname,'command',cmd,'roles',roles,'using',qual,'check',with_check)) FROM pg_policies WHERE schemaname='storage' AND tablename='objects'),
  'migrations',(SELECT jsonb_agg(jsonb_build_object('version',version,'name',name)) FROM supabase_migrations.schema_migrations)
) AS fixture;`);
const fixture = result[0].fixture;
if (fixture.authUsers.length !== 2 || fixture.users.length !== 2) {
  throw new Error("Both selected Auth/profile pairs must exist");
}
if (
  fixture.dog_members.some(
    (member) => !selection.userIds.includes(member.user_id),
  ) ||
  fixture.dogs.some(
    (dog) => dog.owner && !selection.userIds.includes(dog.owner),
  )
) {
  throw new Error(
    "Selected dogs reference an unselected owner; resolve selection before import",
  );
}
savePrivate("source-fixture.json", fixture);
console.log(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(fixture)
        .filter(([, value]) => Array.isArray(value))
        .map(([name, rows]) => [name, rows.length]),
    ),
    null,
    2,
  ),
);
