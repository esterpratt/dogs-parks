import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const apiUrl = process.env.SUPABASE_LOCAL_URL;
const anonKey = process.env.SUPABASE_LOCAL_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY;

assert.ok(apiUrl, 'SUPABASE_LOCAL_URL is required');
assert.ok(anonKey, 'SUPABASE_LOCAL_ANON_KEY is required');
assert.ok(serviceRoleKey, 'SUPABASE_LOCAL_SERVICE_ROLE_KEY is required');
assert.match(
  apiUrl,
  /^http:\/\/(127\.0\.0\.1|localhost):/u,
  'Tests must target local Supabase',
);

const authOptions = {
  autoRefreshToken: false,
  detectSessionInUrl: false,
  persistSession: false,
};
const serviceClient = createClient(apiUrl, serviceRoleKey, {
  auth: authOptions,
});
const fixture = {
  authUserIds: [],
  dogIds: [],
  storagePaths: [],
};

const assertNoError = (error, operation) => {
  assert.equal(
    error,
    null,
    `${operation}: ${error?.message ?? 'unknown error'}`,
  );
};

const createAuthenticatedUser = async (label) => {
  const client = createClient(apiUrl, anonKey, { auth: authOptions });
  const { data, error } = await client.auth.signUp({
    email: `delete-user-${label}@example.test`,
    password: `Delete-${label}-password-2026!`,
  });

  assertNoError(error, `create ${label} Auth user`);
  assert.ok(data.user?.id, `${label} Auth user should have an id`);
  assert.ok(
    data.session?.access_token,
    `${label} signup should return a local session`,
  );
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
  if (fixture.dogIds.length > 0) {
    await serviceClient.from('dogs').delete().in('id', fixture.dogIds);
  }
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

    await suite.test(
      'ignores a supplied target and paginates caller storage cleanup',
      async () => {
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
        fixture.dogIds.push(callerDog.id);

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

        const { data: deletedCaller } =
          await serviceClient.auth.admin.getUserById(attacker.id);
        const { data: survivingVictim, error: victimError } =
          await serviceClient.auth.admin.getUserById(victim.id);
        assert.equal(deletedCaller.user, null);
        assertNoError(victimError, 'read surviving victim');
        assert.equal(survivingVictim.user.id, victim.id);

        const { data: preparedDog, error: preparedDogError } =
          await serviceClient
            .from('dogs')
            .select('id,owner,lifecycle_state,deleted_at')
            .eq('id', callerDog.id)
            .single();
        assertNoError(
          preparedDogError,
          'read caller dog after account deletion',
        );
        assert.equal(preparedDog.owner, null);
        assert.equal(preparedDog.lifecycle_state, 'DELETING');
        assert.ok(preparedDog.deleted_at);

        const { data: cleanupJobs, error: cleanupJobError } =
          await serviceClient.rpc('claim_dog_storage_jobs', { p_limit: 100 });
        assertNoError(cleanupJobError, 'claim solo-dog cleanup job');
        assert.ok(
          cleanupJobs.some(
            (job) =>
              job.dog_id === callerDog.id &&
              job.operation === 'DELETE_DOG_ASSETS',
          ),
        );

        const { data: remainingObjects, error: listError } =
          await serviceClient.storage
            .from('users')
            .list(`${attacker.id}/edge-cleanup`, { limit: objectCount + 1 });
        assertNoError(listError, 'list caller storage after deletion');
        assert.deepEqual(remainingObjects, []);
        fixture.storagePaths = [];
      },
    );

    await suite.test(
      'prepares shared-dog succession before deleting Auth',
      async () => {
        const departingPrimary =
          await createAuthenticatedUser('shared-primary');
        const successor = await createAuthenticatedUser('shared-successor');
        const { data: sharedDog, error: sharedDogError } = await serviceClient
          .from('dogs')
          .insert({
            birthday: '2020-01-01T00:00:00.000Z',
            name: 'Delete-user shared dog',
            owner: departingPrimary.id,
          })
          .select('id')
          .single();
        assertNoError(sharedDogError, 'create shared account-erasure dog');
        fixture.dogIds.push(sharedDog.id);
        const { data: successorMember, error: successorMemberError } =
          await serviceClient
            .from('dog_members')
            .insert({
              dog_id: sharedDog.id,
              role: 'CO_OWNER',
              user_id: successor.id,
            })
            .select('id')
            .single();
        assertNoError(successorMemberError, 'add shared-dog successor');

        // This contract owns its compatibility precondition instead of relying
        // on an earlier suite to leave the isolated feature row enabled.
        const { error: compatibilityError } = await serviceClient
          .from('app_feature_compatibility')
          .update({ enabled: true, minimum_build: 1 })
          .eq('feature', 'SHARED_DOG_OWNERSHIP')
          .eq('platform', 'WEB');
        assertNoError(compatibilityError, 'enable isolated account-erasure fixture');

        const response = await invokeDeleteUser({
          accessToken: departingPrimary.accessToken,
          body: {
            successorSelections: { [sharedDog.id]: successorMember.id },
          },
        });
        const responseBody = await response.json();
        assert.equal(response.status, 200, JSON.stringify(responseBody));

        const { data: transitionedDog, error: transitionedDogError } =
          await serviceClient
            .from('dogs')
            .select('owner,lifecycle_state')
            .eq('id', sharedDog.id)
            .single();
        assertNoError(transitionedDogError, 'read transitioned shared dog');
        assert.deepEqual(transitionedDog, {
          lifecycle_state: 'ACTIVE',
          owner: successor.id,
        });

        const { data: erasedTenure, error: erasedTenureError } =
          await serviceClient
            .from('dog_members')
            .select('user_id,left_at,departure_reason')
            .eq('dog_id', sharedDog.id)
            .eq('role', 'PRIMARY_OWNER')
            .not('left_at', 'is', null)
            .single();
        assertNoError(erasedTenureError, 'read erased shared-dog tenure');
        assert.equal(erasedTenure.user_id, null);
        assert.equal(erasedTenure.departure_reason, 'ACCOUNT_ERASED');
        assert.ok(erasedTenure.left_at);
      },
    );
  } finally {
    await cleanupFixture();
  }
});
