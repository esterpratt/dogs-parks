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
const serviceClient = createClient(apiUrl, serviceRoleKey, { auth: authOptions });
const fixture = {
  authUserIds: [],
  storagePaths: [],
};

const assertNoError = (error, operation) => {
  assert.equal(error, null, `${operation}: ${error?.message ?? 'unknown error'}`);
};

const createAuthenticatedUser = async (label) => {
  const client = createClient(apiUrl, anonKey, { auth: authOptions });
  const { data, error } = await client.auth.signUp({
    email: `delete-user-${label}@example.test`,
    password: `Delete-${label}-password-2026!`,
  });

  assertNoError(error, `create ${label} Auth user`);
  assert.ok(data.user?.id, `${label} Auth user should have an id`);
  assert.ok(data.session?.access_token, `${label} signup should return a local session`);
  fixture.authUserIds.push(data.user.id);

  const { error: profileError } = await serviceClient.from('users').insert({
    id: data.user.id,
    name: `Delete ${label}`,
    private: false,
  });
  assertNoError(profileError, `create ${label} profile`);

  return {
    accessToken: data.session.access_token,
    id: data.user.id,
  };
};

const cleanupFixture = async () => {
  if (fixture.storagePaths.length > 0) {
    await serviceClient.storage.from('users').remove(fixture.storagePaths);
  }

  for (const authUserId of fixture.authUserIds) {
    await serviceClient.auth.admin.deleteUser(authUserId);
  }
};

const invokeDeleteUser = async ({ accessToken, body }) => {
  return fetch(`${apiUrl}/functions/v1/delete-user`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

test('delete-user verifies and deletes only the caller', async (suite) => {
  try {
    const attacker = await createAuthenticatedUser('attacker');
    const victim = await createAuthenticatedUser('victim');

    await suite.test('rejects a request without a user session', async () => {
      const response = await invokeDeleteUser({
        accessToken: anonKey,
        body: { id: victim.id },
      });

      assert.equal(response.status, 401);
    });

    await suite.test('ignores a supplied target and paginates caller storage cleanup', async () => {
      // Current solo-owned dogs must retain their existing account-deletion cascade
      // until the later shared-dog erasure transition replaces it atomically.
      const { data: callerDog, error: callerDogError } = await serviceClient
        .from('dogs')
        .insert({
          birthday: '2020-01-01T00:00:00.000Z',
          name: 'Delete-user solo dog',
          owner: attacker.id,
        })
        .select('id')
        .single();
      assertNoError(callerDogError, 'create caller solo dog');

      const objectCount = 105;
      const uploadResults = await Promise.all(
        Array.from({ length: objectCount }, async (_, index) => {
          const storagePath = `${attacker.id}/edge-cleanup/file-${String(index).padStart(3, '0')}.txt`;
          fixture.storagePaths.push(storagePath);
          return serviceClient.storage
            .from('users')
            .upload(storagePath, new TextEncoder().encode(`file ${index}`), {
              contentType: 'text/plain',
            });
        }),
      );

      for (const { error } of uploadResults) {
        assertNoError(error, 'seed paginated storage fixture');
      }

      const response = await invokeDeleteUser({
        accessToken: attacker.accessToken,
        body: { id: victim.id },
      });
      const responseBody = await response.json();

      assert.equal(response.status, 200, JSON.stringify(responseBody));

      const { data: deletedCaller } = await serviceClient.auth.admin.getUserById(attacker.id);
      const { data: survivingVictim, error: victimError } =
        await serviceClient.auth.admin.getUserById(victim.id);
      assert.equal(deletedCaller.user, null);
      assertNoError(victimError, 'read surviving victim');
      assert.equal(survivingVictim.user.id, victim.id);

      const { data: deletedDogs, error: deletedDogsError } = await serviceClient
        .from('dogs')
        .select('id')
        .eq('id', callerDog.id);
      assertNoError(deletedDogsError, 'read caller dog after account deletion');
      assert.deepEqual(deletedDogs, []);

      const { data: remainingObjects, error: listError } = await serviceClient.storage
        .from('users')
        .list(`${attacker.id}/edge-cleanup`, { limit: objectCount + 1 });
      assertNoError(listError, 'list caller storage after deletion');
      assert.deepEqual(remainingObjects, []);
      fixture.storagePaths = [];
    });
  } finally {
    await cleanupFixture();
  }
});
