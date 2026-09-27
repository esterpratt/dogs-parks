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

const createLocalClient = (key, accessToken) => {
  const options = { auth: authOptions };

  if (accessToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  return createClient(apiUrl, key, options);
};

const anonymousClient = createLocalClient(anonKey);
const serviceClient = createLocalClient(serviceRoleKey);
const fixture = {
  authUserIds: [],
  dogIds: [],
  storagePaths: [],
};

const assertNoError = (error, operation) => {
  assert.equal(error, null, `${operation}: ${error?.message ?? 'unknown error'}`);
};

const createAuthenticatedUser = async (label) => {
  const email = `dog-ownership-${label}@example.test`;
  const password = `Local-${label}-password-2026!`;
  const signupClient = createLocalClient(anonKey);
  const { data, error } = await signupClient.auth.signUp({ email, password });

  assertNoError(error, `create ${label} Auth user`);
  assert.ok(data.user?.id, `${label} Auth user should have an id`);
  assert.ok(data.session?.access_token, `${label} signup should return a real local session`);

  fixture.authUserIds.push(data.user.id);

  const { error: profileError } = await serviceClient.from('users').insert({
    id: data.user.id,
    name: `Ownership ${label}`,
    private: false,
  });

  assertNoError(profileError, `create ${label} public profile`);

  return {
    client: createLocalClient(anonKey, data.session.access_token),
    id: data.user.id,
  };
};

const cleanupFixture = async () => {
  if (fixture.storagePaths.length > 0) {
    await serviceClient.storage.from('dogs').remove(fixture.storagePaths);
  }

  if (fixture.dogIds.length > 0) {
    await serviceClient.from('dogs').delete().in('id', fixture.dogIds);
  }

  for (const authUserId of fixture.authUserIds) {
    await serviceClient.auth.admin.deleteUser(authUserId);
  }
};

test('current local Supabase ownership baseline', async (suite) => {
  let owner;
  let invitee;
  let outsider;
  let dogId;

  try {
    owner = await createAuthenticatedUser('owner');
    invitee = await createAuthenticatedUser('invitee');
    outsider = await createAuthenticatedUser('outsider');

    const { data: dog, error: dogError } = await serviceClient
      .from('dogs')
      .insert({
        birthday: '2020-01-01T00:00:00.000Z',
        name: 'Local ownership baseline dog',
        owner: owner.id,
      })
      .select('id')
      .single();

    assertNoError(dogError, 'create baseline dog');
    dogId = dog.id;
    fixture.dogIds.push(dogId);

    const { error: memberError } = await serviceClient.from('dog_members').insert({
      dog_id: dogId,
      role: 'PRIMARY_OWNER',
      user_id: owner.id,
    });

    assertNoError(memberError, 'create baseline primary membership');

    await suite.test('uses real local Auth sessions', async () => {
      const { data: ownerData, error: ownerError } = await owner.client.auth.getUser();
      const { data: outsiderData, error: outsiderError } = await outsider.client.auth.getUser();

      assertNoError(ownerError, 'read owner session');
      assertNoError(outsiderError, 'read outsider session');
      assert.equal(ownerData.user.id, owner.id);
      assert.equal(outsiderData.user.id, outsider.id);
    });

    await suite.test('characterizes public membership enumeration', async () => {
      // Unsafe baseline: an unauthenticated caller can enumerate active dog memberships.
      const { data, error } = await anonymousClient
        .from('dog_members')
        .select('dog_id,user_id,role')
        .eq('dog_id', dogId);

      assertNoError(error, 'anonymous membership query');
      assert.deepEqual(data, [{ dog_id: dogId, user_id: owner.id, role: 'PRIMARY_OWNER' }]);
    });

    await suite.test('characterizes permissive authenticated dog creation', async () => {
      // Unsafe baseline: any signed-in user can create a dog assigned to another account.
      const { data, error } = await outsider.client
        .from('dogs')
        .insert({
          birthday: '2021-01-01T00:00:00.000Z',
          name: 'Dog created by an unrelated user',
          owner: owner.id,
        })
        .select('id,owner')
        .single();

      assertNoError(error, 'outsider dog creation');
      assert.equal(data.owner, owner.id);
      fixture.dogIds.push(data.id);
    });

    await suite.test('characterizes recursively broken direct membership policies', async () => {
      // The current self-referencing RLS policy fails before it can authorize the primary.
      const { error: insertError } = await owner.client.from('dog_members').insert({
        dog_id: dogId,
        role: 'EDITOR',
        user_id: invitee.id,
      });

      assert.equal(insertError?.code, '42P17');
      assert.match(insertError.message, /infinite recursion/u);

      // Service setup supplies the existing co-owner state required by later RPC checks.
      const { error: fixtureMemberError } = await serviceClient.from('dog_members').insert({
        dog_id: dogId,
        role: 'EDITOR',
        user_id: invitee.id,
      });
      assertNoError(fixtureMemberError, 'create invitee membership fixture');
    });

    await suite.test('characterizes public EXECUTE on ownership RPCs', async () => {
      // The function reaches its business check for anon, proving PUBLIC/anon EXECUTE remains granted.
      const { error } = await anonymousClient.rpc('create_dog_invite', {
        p_dog_id: dogId,
        p_invitee_user_id: outsider.id,
        p_role_offered: 'EDITOR',
      });

      assert.ok(error);
      assert.match(error.message, /not_primary_owner/u);
    });

    await suite.test('characterizes unrestricted authenticated dog storage writes', async () => {
      const storagePath = `${dogId}/baseline-object.txt`;
      fixture.storagePaths.push(storagePath);

      const { error: uploadError } = await owner.client.storage
        .from('dogs')
        .upload(storagePath, new TextEncoder().encode('owner content'), {
          contentType: 'text/plain',
        });
      assertNoError(uploadError, 'owner storage upload');

      // Unsafe baseline: an unrelated signed-in user can overwrite any dogs-bucket object.
      const { error: updateError } = await outsider.client.storage
        .from('dogs')
        .update(storagePath, new TextEncoder().encode('outsider content'), {
          contentType: 'text/plain',
        });
      assertNoError(updateError, 'outsider storage update');

      // Unsafe baseline: the private bucket's SELECT policy lets anon download the object.
      const { data: downloadedObject, error: downloadError } = await anonymousClient.storage
        .from('dogs')
        .download(storagePath);
      assertNoError(downloadError, 'anonymous storage download');
      assert.equal(await downloadedObject.text(), 'outsider content');

      // Unsafe baseline: the unrelated user can also delete the object.
      const { error: deleteError } = await outsider.client.storage
        .from('dogs')
        .remove([storagePath]);
      assertNoError(deleteError, 'outsider storage delete');
      fixture.storagePaths = fixture.storagePaths.filter((path) => path !== storagePath);
    });

    await suite.test('characterizes the broken primary-transfer RPC path', async () => {
      const { error: createError } = await owner.client.rpc(
        'create_primary_transfer_invite',
        {
          p_dog_id: dogId,
          p_invitee_user_id: invitee.id,
        },
      );

      assert.equal(createError?.code, '42804');
      assert.match(createError.message, /notification_type/u);

      const { data: primaryMember, error: primaryError } = await serviceClient
        .from('dog_members')
        .select('user_id')
        .eq('dog_id', dogId)
        .eq('role', 'PRIMARY_OWNER')
        .single();
      assertNoError(primaryError, 'read unchanged primary membership');

      const { data: transferredDog, error: transferredDogError } = await serviceClient
        .from('dogs')
        .select('owner')
        .eq('id', dogId)
        .single();
      assertNoError(transferredDogError, 'read legacy dog owner after failed transfer');

      assert.equal(primaryMember.user_id, owner.id);
      assert.equal(transferredDog.owner, owner.id);
    });
  } finally {
    await cleanupFixture();
  }
});
