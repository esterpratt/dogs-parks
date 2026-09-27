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
  const signupClient = createLocalClient(anonKey);
  const { data, error } = await signupClient.auth.signUp({
    email: `dog-hardening-${label}@example.test`,
    password: `Hardening-${label}-password-2026!`,
  });

  assertNoError(error, `create ${label} Auth user`);
  assert.ok(data.user?.id, `${label} Auth user should have an id`);
  assert.ok(data.session?.access_token, `${label} signup should return a real local session`);
  fixture.authUserIds.push(data.user.id);

  const { error: profileError } = await serviceClient.from('users').insert({
    id: data.user.id,
    name: `Hardening ${label}`,
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

test('ownership security hardening contract', async (suite) => {
  let owner;
  let coOwner;
  let outsider;
  let dogId;
  let soloDogId;

  try {
    owner = await createAuthenticatedUser('owner');
    coOwner = await createAuthenticatedUser('co-owner');
    outsider = await createAuthenticatedUser('outsider');

    const { data: dog, error: dogError } = await serviceClient
      .from('dogs')
      .insert({
        birthday: '2020-01-01T00:00:00.000Z',
        name: 'Hardened ownership dog',
        owner: owner.id,
      })
      .select('id')
      .single();
    assertNoError(dogError, 'create hardened dog fixture');
    dogId = dog.id;
    fixture.dogIds.push(dogId);

    const { error: memberError } = await serviceClient.from('dog_members').upsert(
      [
        { dog_id: dogId, role: 'PRIMARY_OWNER', user_id: owner.id },
        { dog_id: dogId, role: 'EDITOR', user_id: coOwner.id },
      ],
      { onConflict: 'dog_id,user_id' },
    );
    assertNoError(memberError, 'create hardened membership fixtures');

    await suite.test('membership rosters are owner-only', async () => {
      const { data: anonymousRows, error: anonymousError } = await anonymousClient
        .from('dog_members')
        .select('user_id')
        .eq('dog_id', dogId);
      assertNoError(anonymousError, 'anonymous membership query');
      assert.deepEqual(anonymousRows, []);

      const { data: outsiderRows, error: outsiderError } = await outsider.client
        .from('dog_members')
        .select('user_id')
        .eq('dog_id', dogId);
      assertNoError(outsiderError, 'outsider membership query');
      assert.deepEqual(outsiderRows, []);

      const { data: ownerRows, error: ownerError } = await owner.client
        .from('dog_members')
        .select('user_id')
        .eq('dog_id', dogId);
      assertNoError(ownerError, 'owner membership query');
      assert.deepEqual(
        new Set(ownerRows.map(({ user_id: userId }) => userId)),
        new Set([owner.id, coOwner.id]),
      );
    });

    await suite.test('legacy dog creation is restricted to the caller', async () => {
      const { data: forgedDog, error: forgedDogError } = await outsider.client
        .from('dogs')
        .insert({
          birthday: '2021-01-01T00:00:00.000Z',
          name: 'Forged owner dog',
          owner: owner.id,
        })
        .select('id')
        .maybeSingle();
      assert.equal(forgedDog, null);
      assert.ok(forgedDogError);

      const { data: ownDog, error: ownDogError } = await outsider.client
        .from('dogs')
        .insert({
          birthday: '2021-01-01T00:00:00.000Z',
          name: 'Valid solo dog',
          owner: outsider.id,
        })
        .select('id')
        .single();
      assertNoError(ownDogError, 'create caller-owned solo dog');
      soloDogId = ownDog.id;
      fixture.dogIds.push(ownDog.id);

      const { data: primaryMember, error: primaryMemberError } = await outsider.client
        .from('dog_members')
        .select('user_id,role')
        .eq('dog_id', ownDog.id)
        .single();
      assertNoError(primaryMemberError, 'read bootstrapped solo membership');
      assert.deepEqual(primaryMember, { user_id: outsider.id, role: 'PRIMARY_OWNER' });
    });

    await suite.test('legacy direct edits are limited to solo primary owners', async () => {
      const { data: sharedUpdate, error: sharedUpdateError } = await owner.client
        .from('dogs')
        .update({ description: 'shared direct edit must not apply' })
        .eq('id', dogId)
        .select('id');
      assertNoError(sharedUpdateError, 'attempt shared legacy dog edit');
      assert.deepEqual(sharedUpdate, []);

      const { data: soloUpdate, error: soloUpdateError } = await outsider.client
        .from('dogs')
        .update({ description: 'solo direct edit remains compatible' })
        .eq('id', soloDogId)
        .select('id');
      assertNoError(soloUpdateError, 'update solo legacy dog');
      assert.deepEqual(soloUpdate, [{ id: soloDogId }]);
    });

    await suite.test('membership mutations are RPC-only without recursive RLS', async () => {
      const { error } = await owner.client.from('dog_members').insert({
        dog_id: dogId,
        role: 'EDITOR',
        user_id: outsider.id,
      });

      assert.equal(error?.code, '42501');
      assert.doesNotMatch(error.message, /infinite recursion/u);
    });

    await suite.test('ownership RPCs reject anonymous execution at the grant boundary', async () => {
      const { error } = await anonymousClient.rpc('create_dog_invite', {
        p_dog_id: dogId,
        p_invitee_user_id: outsider.id,
        p_role_offered: 'EDITOR',
      });

      assert.equal(error?.code, '42501');
      assert.match(error.message, /permission denied for function/u);
    });

    await suite.test('legacy deletion is authenticated and limited to solo primary owners', async () => {
      const { error: outsiderDeleteError } = await outsider.client.rpc('delete_dog', {
        dog_id: dogId,
      });
      assert.match(outsiderDeleteError?.message ?? '', /solo_primary_owner_required/u);

      const { error: sharedDeleteError } = await owner.client.rpc('delete_dog', {
        dog_id: dogId,
      });
      assert.match(sharedDeleteError?.message ?? '', /solo_primary_owner_required/u);

      const { error: soloDeleteError } = await outsider.client.rpc('delete_dog', {
        dog_id: soloDogId,
      });
      assertNoError(soloDeleteError, 'delete caller-owned solo dog');

      const { data: anonymousDeletedRows, error: anonymousDeletedError } = await anonymousClient
        .from('dogs')
        .select('id')
        .eq('id', soloDogId);
      assertNoError(anonymousDeletedError, 'query soft-deleted dog anonymously');
      assert.deepEqual(anonymousDeletedRows, []);
    });

    await suite.test('dog storage is private and owner-scoped', async () => {
      const storagePath = `${dogId}/hardened-object.txt`;
      fixture.storagePaths.push(storagePath);

      const { error: uploadError } = await owner.client.storage
        .from('dogs')
        .upload(storagePath, new TextEncoder().encode('owner content'), {
          contentType: 'text/plain',
        });
      assertNoError(uploadError, 'owner storage upload');

      const { error: updateError } = await outsider.client.storage
        .from('dogs')
        .update(storagePath, new TextEncoder().encode('outsider content'), {
          contentType: 'text/plain',
        });
      assert.ok(updateError);

      const { data: anonymousDownload, error: anonymousDownloadError } =
        await anonymousClient.storage.from('dogs').download(storagePath);
      assert.equal(anonymousDownload, null);
      assert.ok(anonymousDownloadError);

      const { error: deleteError } = await outsider.client.storage
        .from('dogs')
        .remove([storagePath]);
      assertNoError(deleteError, 'outsider storage delete request');

      const { data: ownerDownload, error: ownerDownloadError } = await owner.client.storage
        .from('dogs')
        .download(storagePath);
      assertNoError(ownerDownloadError, 'owner storage download after outsider delete attempt');
      assert.equal(await ownerDownload.text(), 'owner content');
    });

    await suite.test('primary transfer is functional and synchronizes legacy authority', async () => {
      const { data: inviteId, error: createError } = await owner.client.rpc(
        'create_primary_transfer_invite',
        {
          p_dog_id: dogId,
          p_invitee_user_id: coOwner.id,
        },
      );
      assertNoError(createError, 'create primary transfer invite');

      const { error: acceptError } = await coOwner.client.rpc('accept_primary_transfer', {
        p_invite_id: inviteId,
      });
      assertNoError(acceptError, 'accept primary transfer');

      const { data: primaryMember, error: primaryError } = await serviceClient
        .from('dog_members')
        .select('user_id')
        .eq('dog_id', dogId)
        .eq('role', 'PRIMARY_OWNER')
        .single();
      assertNoError(primaryError, 'read transferred primary membership');

      const { data: transferredDog, error: dogOwnerError } = await serviceClient
        .from('dogs')
        .select('owner')
        .eq('id', dogId)
        .single();
      assertNoError(dogOwnerError, 'read synchronized legacy dog owner');
      assert.equal(primaryMember.user_id, coOwner.id);
      assert.equal(transferredDog.owner, coOwner.id);
    });
  } finally {
    await cleanupFixture();
  }
});
