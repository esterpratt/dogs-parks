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
  dogIds: [],
};

const assertNoError = (error, operation) => {
  assert.equal(error, null, `${operation}: ${error?.message ?? 'unknown error'}`);
};

const signInFixtureUser = async (index) => {
  const label = String(index).padStart(2, '0');
  const client = createClient(apiUrl, anonKey, { auth: authOptions });
  const { data, error } = await client.auth.signInWithPassword({
    email: `membership-foundation-${label}@example.test`,
    password: `Membership-${label}-password-2026!`,
  });

  assertNoError(error, `sign in membership user ${label}`);
  assert.ok(data.user?.id, `membership user ${label} should have an id`);
  assert.ok(data.session?.access_token, `membership user ${label} should have a local session`);

  return {
    client,
    id: data.user.id,
  };
};

const cleanupFixture = async () => {
  if (fixture.dogIds.length > 0) {
    await serviceClient.from('dogs').delete().in('id', fixture.dogIds);
  }

  for (const authUserId of fixture.authUserIds) {
    await serviceClient.auth.admin.deleteUser(authUserId);
  }
};

test('membership foundation contract', async (suite) => {
  let owner;
  let coOwner;
  let reconciliationDogId;

  try {
    const users = [];
    for (let index = 1; index <= 9; index += 1) {
      users.push(await signInFixtureUser(index));
    }
    fixture.authUserIds.push(...users.map(({ id }) => id));
    [owner, coOwner] = users;

    const { data: dogs, error: dogsError } = await serviceClient
      .from('dogs')
      .select('id,name,owner,ownership_version,lifecycle_state,deleted_at')
      .like('name', 'Membership % dog');
    assertNoError(dogsError, 'read reconciled dogs');
    fixture.dogIds.push(...dogs.map(({ id }) => id));

    const dogByName = new Map(dogs.map((dog) => [dog.name, dog]));
    const reconciliationDog = dogByName.get('Membership reconciliation dog');
    const backfillDog = dogByName.get('Membership backfill dog');
    const deletedDog = dogByName.get('Membership deleted prototype dog');
    assert.ok(reconciliationDog);
    assert.ok(backfillDog);
    assert.ok(deletedDog);
    reconciliationDogId = reconciliationDog.id;

    await suite.test('reconciles prototype rows and backfills lifecycle authority', async () => {
      assert.equal(reconciliationDog.lifecycle_state, 'ACTIVE');
      assert.equal(reconciliationDog.ownership_version, 1);
      assert.equal(backfillDog.lifecycle_state, 'ACTIVE');
      assert.equal(backfillDog.ownership_version, 1);
      assert.equal(deletedDog.lifecycle_state, 'DELETED');

      const { data: reconciliationMembers, error: reconciliationError } = await serviceClient
        .from('dog_members')
        .select('user_id,role,joined_at,left_at,departure_reason')
        .eq('dog_id', reconciliationDog.id)
        .order('joined_at');
      assertNoError(reconciliationError, 'read reconciled membership rows');
      assert.deepEqual(reconciliationMembers, [
        {
          departure_reason: null,
          joined_at: '2024-03-01T00:00:00+00:00',
          left_at: null,
          role: 'PRIMARY_OWNER',
          user_id: owner.id,
        },
        {
          departure_reason: null,
          joined_at: '2025-06-01T00:00:00+00:00',
          left_at: null,
          role: 'CO_OWNER',
          user_id: coOwner.id,
        },
      ]);

      const { data: backfilledPrimary, error: backfillError } = await serviceClient
        .from('dog_members')
        .select('user_id,role,left_at')
        .eq('dog_id', backfillDog.id)
        .single();
      assertNoError(backfillError, 'read backfilled primary membership');
      assert.deepEqual(backfilledPrimary, {
        left_at: null,
        role: 'PRIMARY_OWNER',
        user_id: backfillDog.owner,
      });

      const { data: deletedMembers, error: deletedMemberError } = await serviceClient
        .from('dog_members')
        .select('left_at,departure_reason')
        .eq('dog_id', deletedDog.id);
      assertNoError(deletedMemberError, 'read closed deleted-dog memberships');
      assert.equal(deletedMembers.length, 1);
      assert.equal(deletedMembers[0].departure_reason, 'DOG_DELETED');
      assert.ok(deletedMembers[0].left_at);
    });

    await suite.test('preserves historical tenures and permits a new tenure after leaving', async () => {
      const { data: originalMembership, error: originalError } = await serviceClient
        .from('dog_members')
        .select('id,joined_at')
        .eq('dog_id', reconciliationDogId)
        .eq('user_id', coOwner.id)
        .is('left_at', null)
        .single();
      assertNoError(originalError, 'read original co-owner tenure');

      const leftAt = '2026-09-28T08:00:00.000Z';
      const { error: closeError } = await serviceClient
        .from('dog_members')
        .update({ departure_reason: 'LEFT', left_at: leftAt })
        .eq('id', originalMembership.id);
      assertNoError(closeError, 'close co-owner tenure');

      const { data: rejoinedMembership, error: rejoinError } = await serviceClient
        .from('dog_members')
        .insert({
          dog_id: reconciliationDogId,
          role: 'CO_OWNER',
          user_id: coOwner.id,
        })
        .select('id,joined_at,left_at')
        .single();
      assertNoError(rejoinError, 'create new co-owner tenure');
      assert.notEqual(rejoinedMembership.id, originalMembership.id);
      assert.equal(rejoinedMembership.left_at, null);

      const { data: tenures, error: tenuresError } = await serviceClient
        .from('dog_members')
        .select('id,left_at,departure_reason')
        .eq('dog_id', reconciliationDogId)
        .eq('user_id', coOwner.id)
        .order('joined_at');
      assertNoError(tenuresError, 'read co-owner tenure history');
      assert.equal(tenures.length, 2);
      assert.equal(tenures[0].departure_reason, 'LEFT');
      assert.ok(tenures[0].left_at);
      assert.equal(tenures[1].departure_reason, null);

      const { error: immutableError } = await serviceClient
        .from('dog_members')
        .update({ joined_at: '2020-01-01T00:00:00.000Z' })
        .eq('id', rejoinedMembership.id);
      assert.match(immutableError?.message ?? '', /joined_at_is_immutable/u);
    });

    await suite.test('preserves lifecycle-aware solo dog deletion', async () => {
      const soloOwner = users[2];
      const { error: deleteError } = await soloOwner.client.rpc('delete_dog', {
        dog_id: backfillDog.id,
      });
      assertNoError(deleteError, 'delete backfilled solo dog');

      const { data: deletedSoloDog, error: deletedDogError } = await serviceClient
        .from('dogs')
        .select('lifecycle_state,deleted_at')
        .eq('id', backfillDog.id)
        .single();
      assertNoError(deletedDogError, 'read deleted solo dog lifecycle');
      assert.equal(deletedSoloDog.lifecycle_state, 'DELETED');
      assert.ok(deletedSoloDog.deleted_at);

      const { data: closedMembership, error: closedMembershipError } = await serviceClient
        .from('dog_members')
        .select('left_at,departure_reason')
        .eq('dog_id', backfillDog.id)
        .single();
      assertNoError(closedMembershipError, 'read deleted solo dog membership');
      assert.equal(closedMembership.departure_reason, 'DOG_DELETED');
      assert.ok(closedMembership.left_at);
    });

    await suite.test('defers and enforces active primary and owner-mirror invariants', async () => {
      const { error: deletePrimaryError } = await serviceClient
        .from('dog_members')
        .delete()
        .eq('dog_id', reconciliationDogId)
        .eq('role', 'PRIMARY_OWNER');
      assert.match(
        deletePrimaryError?.message ?? '',
        /active_dog_requires_exactly_one_primary/u,
      );

      const { error: mismatchError } = await serviceClient
        .from('dogs')
        .update({ owner: coOwner.id })
        .eq('id', reconciliationDogId);
      assert.match(mismatchError?.message ?? '', /dog_owner_must_match_primary/u);
    });

    await suite.test('keeps legacy co-owner invitation RPCs compatible with the renamed role', async () => {
      const invitedCoOwner = users[2];
      const { data: inviteId, error: createError } = await owner.client.rpc(
        'create_dog_invite',
        {
          p_dog_id: reconciliationDogId,
          p_invitee_user_id: invitedCoOwner.id,
          p_role_offered: 'CO_OWNER',
        },
      );
      assertNoError(createError, 'create legacy co-owner invite');

      const { error: acceptError } = await invitedCoOwner.client.rpc('accept_dog_invite', {
        p_invite_id: inviteId,
      });
      assertNoError(acceptError, 'accept legacy co-owner invite');

      const { data: membership, error: membershipError } = await serviceClient
        .from('dog_members')
        .select('role,left_at')
        .eq('dog_id', reconciliationDogId)
        .eq('user_id', invitedCoOwner.id)
        .single();
      assertNoError(membershipError, 'read invited co-owner membership');
      assert.deepEqual(membership, { left_at: null, role: 'CO_OWNER' });
    });

    await suite.test('enforces at most eight active owners', async () => {
      const additionalMembers = users.slice(3, 8).map(({ id }) => ({
        dog_id: reconciliationDogId,
        role: 'CO_OWNER',
        user_id: id,
      }));
      const { error: fillError } = await serviceClient.from('dog_members').insert(additionalMembers);
      assertNoError(fillError, 'fill all eight ownership slots');

      const { error: ninthOwnerError } = await serviceClient.from('dog_members').insert({
        dog_id: reconciliationDogId,
        role: 'CO_OWNER',
        user_id: users[8].id,
      });
      assert.match(ninthOwnerError?.message ?? '', /dog_owner_capacity_exceeded/u);
    });

    await suite.test('synchronizes the compatibility owner and version during transfer', async () => {
      const { data: inviteId, error: createError } = await owner.client.rpc(
        'create_primary_transfer_invite',
        {
          p_dog_id: reconciliationDogId,
          p_invitee_user_id: coOwner.id,
        },
      );
      assertNoError(createError, 'create foundation transfer invite');

      const { error: acceptError } = await coOwner.client.rpc('accept_primary_transfer', {
        p_invite_id: inviteId,
      });
      assertNoError(acceptError, 'accept foundation transfer invite');

      const { data: dog, error: dogError } = await serviceClient
        .from('dogs')
        .select('owner,ownership_version')
        .eq('id', reconciliationDogId)
        .single();
      assertNoError(dogError, 'read transferred dog authority');
      assert.equal(dog.owner, coOwner.id);
      assert.equal(dog.ownership_version, 2);
    });

    await suite.test('keeps shared ownership disabled by default', async () => {
      const { data, error } = await owner.client
        .from('app_feature_compatibility')
        .select('platform,minimum_build,enabled')
        .eq('feature', 'SHARED_DOG_OWNERSHIP')
        .order('platform');
      assertNoError(error, 'read shared ownership compatibility gate');
      assert.equal(data.length, 3);
      assert.ok(data.every(({ enabled, minimum_build: minimumBuild }) => !enabled && minimumBuild === 0));
    });
  } finally {
    await cleanupFixture();
  }
});
