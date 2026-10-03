import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const apiUrl = process.env.SUPABASE_LOCAL_URL;
const anonKey = process.env.SUPABASE_LOCAL_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY;

assert.ok(apiUrl, 'SUPABASE_LOCAL_URL is required');
assert.ok(anonKey, 'SUPABASE_LOCAL_ANON_KEY is required');
assert.ok(serviceRoleKey, 'SUPABASE_LOCAL_SERVICE_ROLE_KEY is required');
assert.match(apiUrl, /^http:\/\/(127\.0\.0\.1|localhost):/u, 'Tests must target local Supabase');

const authOptions = {
  autoRefreshToken: false,
  detectSessionInUrl: false,
  persistSession: false,
};
const createLocalClient = (key, token) =>
  createClient(apiUrl, key, {
    auth: authOptions,
    ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
  });
const anonymousClient = createLocalClient(anonKey);
const serviceClient = createLocalClient(serviceRoleKey);
const clientArguments = { p_client_build: 1, p_client_platform: 'WEB' };
const fixture = { authUserIds: [], dogIds: [] };

const assertNoError = (error, operation) => {
  assert.equal(error, null, `${operation}: ${error?.message ?? 'unknown error'}`);
};

const createUser = async (label, isPrivate = false) => {
  const signupClient = createLocalClient(anonKey);
  const { data, error } = await signupClient.auth.signUp({
    email: `client-capability-${label}-${crypto.randomUUID()}@example.test`,
    password: `Client-capability-${label}-password-2026!`,
  });
  assertNoError(error, `create ${label} Auth user`);
  fixture.authUserIds.push(data.user.id);
  const { error: profileError } = await serviceClient.from('users').insert({
    id: data.user.id,
    name: `Client Capability ${label}`,
    private: isPrivate,
  });
  assertNoError(profileError, `create ${label} profile`);
  return {
    client: createLocalClient(anonKey, data.session.access_token),
    id: data.user.id,
  };
};

const createDog = async (owner, name) => {
  const { data, error } = await serviceClient
    .from('dogs')
    .insert({ birthday: '2020-01-01', name, owner: owner.id })
    .select('id')
    .single();
  assertNoError(error, `create ${name}`);
  fixture.dogIds.push(data.id);
  return data;
};

const addCoOwner = async (dogId, coOwner) => {
  const { error } = await serviceClient.from('dog_members').insert({
    dog_id: dogId,
    role: 'CO_OWNER',
    user_id: coOwner.id,
  });
  assertNoError(error, 'add co-owner');
};

const setFeatureEnabled = async (enabled) => {
  const { error } = await serviceClient
    .from('app_feature_compatibility')
    .update({ enabled, minimum_build: 1 })
    .eq('feature', 'SHARED_DOG_OWNERSHIP')
    .eq('platform', 'WEB');
  assertNoError(error, `${enabled ? 'enable' : 'disable'} isolated Web fixture`);
};

const cleanupFixture = async () => {
  if (fixture.dogIds.length > 0) {
    await serviceClient.from('dogs').delete().in('id', fixture.dogIds);
  }
  for (const authUserId of fixture.authUserIds) {
    await serviceClient.auth.admin.deleteUser(authUserId);
  }
};

test('client capability migration contract', async (suite) => {
  try {
    const [primary, coOwner, outsider] = await Promise.all([
      createUser('primary'),
      createUser('co-owner'),
      createUser('outsider'),
    ]);

    await suite.test('denies anonymous capability reads and mutations', async () => {
      const dog = await createDog(primary, 'Anonymous denial dog');
      for (const [functionName, argumentsValue] of [
        ['api_get_dog_page', { ...clientArguments, p_dog_id: dog.id }],
        ['api_get_user_dogs', { p_user_id: primary.id }],
        ['api_create_dog', { p_dog: { birthday: '2020-01-01', name: 'Denied' } }],
        ['api_update_dog', { ...clientArguments, p_changes: { name: 'Denied' }, p_dog_id: dog.id }],
      ]) {
        const { error } = await anonymousClient.rpc(functionName, argumentsValue);
        assert.match(error?.message ?? '', /permission denied/u, functionName);
      }
    });

    await suite.test('creates a solo dog and its primary tenure atomically while disabled', async () => {
      await setFeatureEnabled(false);
      const { data, error } = await primary.client.rpc('api_create_dog', {
        p_dog: {
          birthday: '2021-02-03',
          name: 'Capability-created dog',
          owner: outsider.id,
          ownership_version: 999,
        },
      });
      assertNoError(error, 'create dog through client RPC');
      assert.equal(data.outcome, 'CREATED');
      fixture.dogIds.push(data.dog_id);
      const { data: dog } = await serviceClient
        .from('dogs')
        .select('owner,ownership_version')
        .eq('id', data.dog_id)
        .single();
      assert.equal(dog.owner, primary.id);
      assert.equal(dog.ownership_version, 1);
      const { data: members } = await serviceClient
        .from('dog_members')
        .select('user_id,role,left_at')
        .eq('dog_id', data.dog_id);
      assert.deepEqual(members, [{ left_at: null, role: 'PRIMARY_OWNER', user_id: primary.id }]);
    });

    await suite.test('returns dog-page identity and server-derived viewer capabilities', async () => {
      const dog = await createDog(primary, 'Direct route dog');
      const { data: ownerPage, error: ownerError } = await primary.client.rpc(
        'api_get_dog_page',
        { ...clientArguments, p_dog_id: dog.id },
      );
      assertNoError(ownerError, 'read owner dog page');
      assert.equal(ownerPage.viewer.is_owner, true);
      assert.equal(ownerPage.viewer.can_edit, true);
      assert.equal(ownerPage.viewer.role, 'PRIMARY_OWNER');
      assert.equal(ownerPage.profile_user.id, primary.id);
      assert.equal(ownerPage.members.length, 1);

      const { data: outsiderPage, error: outsiderError } = await outsider.client.rpc(
        'api_get_dog_page',
        { ...clientArguments, p_dog_id: dog.id },
      );
      assertNoError(outsiderError, 'read outsider dog page');
      assert.equal(outsiderPage.viewer.is_owner, false);
      assert.equal(outsiderPage.viewer.can_edit, false);
      assert.equal(outsiderPage.members, undefined);
      assert.equal(outsiderPage.pending_actions, undefined);
    });

    await suite.test('uses active memberships for single and batched pack reads', async () => {
      await setFeatureEnabled(true);
      const sharedDog = await createDog(primary, 'Shared pack dog');
      await addCoOwner(sharedDog.id, coOwner);
      const primaryOnlyDog = await createDog(primary, 'Primary pack dog');

      const { data: coOwnerPack, error: packError } = await outsider.client.rpc(
        'api_get_user_dogs',
        { p_user_id: coOwner.id },
      );
      assertNoError(packError, 'read co-owner pack');
      assert.deepEqual(coOwnerPack.map(({ id }) => id), [sharedDog.id]);

      const { data: grouped, error: groupedError } = await outsider.client.rpc(
        'api_get_users_dogs',
        { p_user_ids: [primary.id, coOwner.id] },
      );
      assertNoError(groupedError, 'read grouped packs');
      assert.deepEqual(
        grouped.filter(({ dog }) => dog.id === sharedDog.id).map(({ profile_user_id }) => profile_user_id).sort(),
        [primary.id, coOwner.id].sort(),
      );
      assert.deepEqual(
        grouped.filter(({ dog }) => dog.id === primaryOnlyDog.id).map(({ profile_user_id }) => profile_user_id),
        [primary.id],
      );
    });

    await suite.test('allows active co-owners to edit but never authority fields', async () => {
      await setFeatureEnabled(true);
      const dog = await createDog(primary, 'Editable shared dog');
      await addCoOwner(dog.id, coOwner);
      const { data: edited, error } = await coOwner.client.rpc('api_update_dog', {
        ...clientArguments,
        p_changes: { name: 'Edited by co-owner', owner: coOwner.id, lifecycle_state: 'DELETED' },
        p_dog_id: dog.id,
      });
      assertNoError(error, 'edit as co-owner');
      assert.equal(edited.outcome, 'APPLIED');
      const { data: storedDog } = await serviceClient
        .from('dogs')
        .select('name,owner,lifecycle_state')
        .eq('id', dog.id)
        .single();
      assert.deepEqual(storedDog, {
        lifecycle_state: 'ACTIVE',
        name: 'Edited by co-owner',
        owner: primary.id,
      });
      const { error: outsiderError } = await outsider.client.rpc('api_update_dog', {
        ...clientArguments,
        p_changes: { name: 'Forbidden edit' },
        p_dog_id: dog.id,
      });
      assert.match(outsiderError?.message ?? '', /forbidden/u);
    });

    await suite.test('keeps solo editing operational but gates shared editing by compatibility', async () => {
      const soloDog = await createDog(primary, 'Disabled solo edit dog');
      const sharedDog = await createDog(primary, 'Disabled shared edit dog');
      await addCoOwner(sharedDog.id, coOwner);
      await setFeatureEnabled(false);
      const { data: soloResult, error: soloError } = await primary.client.rpc('api_update_dog', {
        ...clientArguments,
        p_changes: { name: 'Solo edit still works' },
        p_dog_id: soloDog.id,
      });
      assertNoError(soloError, 'edit solo dog while feature disabled');
      assert.equal(soloResult.outcome, 'APPLIED');
      const { data: sharedResult, error: sharedError } = await primary.client.rpc('api_update_dog', {
        ...clientArguments,
        p_changes: { name: 'Shared edit must be gated' },
        p_dog_id: sharedDog.id,
      });
      assertNoError(sharedError, 'return shared edit compatibility result');
      assert.equal(sharedResult.outcome, 'UPGRADE_REQUIRED');
    });

    await suite.test('omits deleting dogs and historical tenures from client reads', async () => {
      await setFeatureEnabled(true);
      const dog = await createDog(primary, 'Hidden lifecycle dog');
      await addCoOwner(dog.id, coOwner);
      await serviceClient
        .from('dog_members')
        .update({ departure_reason: 'LEFT', left_at: new Date().toISOString() })
        .eq('dog_id', dog.id)
        .eq('user_id', coOwner.id);
      const { data: formerPack } = await outsider.client.rpc('api_get_user_dogs', {
        p_user_id: coOwner.id,
      });
      assert.equal(formerPack.some(({ id }) => id === dog.id), false);
      await serviceClient
        .from('dogs')
        .update({ deleted_at: new Date().toISOString(), lifecycle_state: 'DELETING', owner: null })
        .eq('id', dog.id);
      const { data: page } = await outsider.client.rpc('api_get_dog_page', {
        ...clientArguments,
        p_dog_id: dog.id,
      });
      assert.equal(page.outcome, 'NOT_FOUND');
    });
  } finally {
    await setFeatureEnabled(false);
    await cleanupFixture();
  }
});
