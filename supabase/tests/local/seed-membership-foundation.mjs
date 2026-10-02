import assert from 'node:assert/strict';
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

const assertNoError = (error, operation) => {
  assert.equal(error, null, `${operation}: ${error?.message ?? 'unknown error'}`);
};

const createAuthenticatedUser = async (index) => {
  const client = createClient(apiUrl, anonKey, { auth: authOptions });
  const label = String(index).padStart(2, '0');
  const email = `membership-foundation-${label}@example.test`;
  const password = `Membership-${label}-password-2026!`;
  const { data, error } = await client.auth.signUp({ email, password });

  assertNoError(error, `create membership user ${label}`);
  assert.ok(data.user?.id, `membership user ${label} should have an id`);
  assert.ok(data.session?.access_token, `membership user ${label} should have a local session`);

  const { error: profileError } = await serviceClient.from('users').insert({
    id: data.user.id,
    name: `Membership Foundation ${label}`,
    private: false,
  });
  assertNoError(profileError, `create membership profile ${label}`);

  return data.user.id;
};

// Seed the exact prototype shape before the additive migration so the contract
// verifies reconciliation rather than only validating newly-created rows.
const userIds = [];
for (let index = 1; index <= 9; index += 1) {
  userIds.push(await createAuthenticatedUser(index));
}

const { data: dogs, error: dogError } = await serviceClient
  .from('dogs')
  .insert([
    {
      birthday: '2020-01-01T00:00:00.000Z',
      name: 'Membership reconciliation dog',
      owner: userIds[0],
    },
    {
      birthday: '2021-01-01T00:00:00.000Z',
      name: 'Membership backfill dog',
      owner: userIds[2],
    },
    {
      birthday: '2019-01-01T00:00:00.000Z',
      deleted_at: '2026-01-01T00:00:00.000Z',
      name: 'Membership deleted prototype dog',
      owner: userIds[3],
    },
  ])
  .select('id,name');
assertNoError(dogError, 'create prototype dog fixtures');

const dogIdByName = new Map(dogs.map(({ id, name }) => [name, id]));
const reconciliationDogId = dogIdByName.get('Membership reconciliation dog');
const backfillDogId = dogIdByName.get('Membership backfill dog');
const deletedDogId = dogIdByName.get('Membership deleted prototype dog');

const { error: primaryDateError } = await serviceClient
  .from('dog_members')
  .update({ created_at: '2024-03-01T00:00:00.000Z' })
  .eq('dog_id', reconciliationDogId)
  .eq('role', 'PRIMARY_OWNER');
assertNoError(primaryDateError, 'set prototype primary tenure date');

const { error: deletedDateError } = await serviceClient
  .from('dog_members')
  .update({ created_at: '2025-01-01T00:00:00.000Z' })
  .eq('dog_id', deletedDogId)
  .eq('role', 'PRIMARY_OWNER');
assertNoError(deletedDateError, 'set deleted prototype tenure date');

// Remove one bootstrapped row to prove the additive migration repairs a live dog
// that has a legacy owner but no prototype membership.
const { error: removeBackfillMemberError } = await serviceClient
  .from('dog_members')
  .delete()
  .eq('dog_id', backfillDogId);
assertNoError(removeBackfillMemberError, 'remove backfill dog prototype membership');

const { error: memberError } = await serviceClient.from('dog_members').insert({
  created_at: '2025-06-01T00:00:00.000Z',
  dog_id: reconciliationDogId,
  role: 'EDITOR',
  user_id: userIds[1],
});
assertNoError(memberError, 'create prototype membership fixtures');
