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
const fixture = { authUserIds: [], dogIds: [], dogObjectPaths: [] };

const assertNoError = (error, operation) => {
  assert.equal(error, null, `${operation}: ${error?.message ?? 'unknown error'}`);
};

const createUser = async (label) => {
  const signupClient = createLocalClient(anonKey);
  const { data, error } = await signupClient.auth.signUp({
    email: `dog-deletion-${label}-${crypto.randomUUID()}@example.test`,
    password: `Dog-deletion-${label}-password-2026!`,
  });
  assertNoError(error, `create ${label} Auth user`);
  fixture.authUserIds.push(data.user.id);
  const { error: profileError } = await serviceClient.from('users').insert({
    id: data.user.id,
    name: `Dog Deletion ${label}`,
    private: false,
  });
  assertNoError(profileError, `create ${label} profile`);
  return {
    client: createLocalClient(anonKey, data.session.access_token),
    id: data.user.id,
  };
};

const createSharedDog = async (primary, coOwners, name) => {
  const { data: dog, error } = await serviceClient
    .from('dogs')
    .insert({ birthday: '2020-01-01', name, owner: primary.id })
    .select('id,ownership_version')
    .single();
  assertNoError(error, `create ${name}`);
  fixture.dogIds.push(dog.id);
  const members = [];
  for (const [index, coOwner] of coOwners.entries()) {
    const { data: member, error: memberError } = await serviceClient
      .from('dog_members')
      .insert({
        dog_id: dog.id,
        joined_at: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
        role: 'CO_OWNER',
        user_id: coOwner.id,
      })
      .select('id')
      .single();
    assertNoError(memberError, 'add deletion co-owner');
    members.push(member.id);
  }
  return { ...dog, memberIds: members };
};

const proposeDeletion = async (primary, dogId, idempotencyKey = crypto.randomUUID()) =>
  primary.client.rpc('api_propose_dog_deletion', {
    ...clientArguments,
    p_dog_id: dogId,
    p_idempotency_key: idempotencyKey,
  });

const respondToDeletion = async (owner, proposalId, approve) =>
  owner.client.rpc('api_respond_dog_deletion', {
    ...clientArguments,
    p_approve: approve,
    p_proposal_id: proposalId,
  });

const cleanupFixture = async () => {
  if (fixture.dogObjectPaths.length > 0) {
    await serviceClient.storage.from('dogs').remove(fixture.dogObjectPaths);
  }
  if (fixture.dogIds.length > 0) {
    await serviceClient.from('dogs').delete().in('id', fixture.dogIds);
  }
  for (const authUserId of fixture.authUserIds) {
    await serviceClient.auth.admin.deleteUser(authUserId);
  }
};

test('unanimous shared-dog deletion and purge contract', async (suite) => {
  try {
    const [primary, coOwner, secondCoOwner, outsider] = await Promise.all([
      createUser('primary'),
      createUser('co-owner'),
      createUser('second-co-owner'),
      createUser('outsider'),
    ]);

    await suite.test('keeps deletion disabled until compatibility enables it', async () => {
      const dog = await createSharedDog(primary, [coOwner], 'Disabled deletion dog');
      const { error: disableError } = await serviceClient
        .from('app_feature_compatibility')
        .update({ enabled: false })
        .eq('feature', 'SHARED_DOG_OWNERSHIP')
        .eq('platform', 'WEB');
      assertNoError(disableError, 'disable isolated Web fixture');
      const { data, error } = await proposeDeletion(primary, dog.id);
      assertNoError(error, 'return disabled deletion result');
      assert.equal(data.outcome, 'UPGRADE_REQUIRED');
      const { error: enableError } = await serviceClient
        .from('app_feature_compatibility')
        .update({ enabled: true, minimum_build: 1 })
        .eq('feature', 'SHARED_DOG_OWNERSHIP')
        .eq('platform', 'WEB');
      assertNoError(enableError, 'enable isolated Web fixture');
    });

    await suite.test('denies anonymous RPCs, non-primary proposals, and direct writes', async () => {
      const dog = await createSharedDog(primary, [coOwner], 'Deletion authorization dog');
      const { error: anonymousError } = await anonymousClient.rpc('api_propose_dog_deletion', {
        ...clientArguments,
        p_dog_id: dog.id,
        p_idempotency_key: crypto.randomUUID(),
      });
      assert.match(anonymousError?.message ?? '', /permission denied/u);
      const { error: anonymousReadError } = await anonymousClient.rpc(
        'api_get_dog_deletion_proposal',
        {
          ...clientArguments,
          p_proposal_id: crypto.randomUUID(),
        },
      );
      assert.match(anonymousReadError?.message ?? '', /permission denied/u);
      const { error: coOwnerError } = await proposeDeletion(coOwner, dog.id);
      assert.match(coOwnerError?.message ?? '', /forbidden/u);
      const { error: directError } = await primary.client.from('dog_deletion_proposals').insert({
        dog_id: dog.id,
        idempotency_key: crypto.randomUUID(),
        ownership_version_at_creation: dog.ownership_version,
        proposed_by_member_id: dog.memberIds[0],
      });
      assert.match(directError?.message ?? '', /row-level security|permission denied/u);
      const { data: proposal } = await proposeDeletion(primary, dog.id);
      const { error: directConsentError } = await coOwner.client
        .from('dog_deletion_consents')
        .insert({
          decision: 'APPROVED',
          member_id: dog.memberIds[0],
          proposal_id: proposal.proposal_id,
        });
      assert.match(
        directConsentError?.message ?? '',
        /row-level security|permission denied/u,
      );
    });

    await suite.test('creates one idempotent proposal and snapshots unanimous consent', async () => {
      const dog = await createSharedDog(primary, [coOwner, secondCoOwner], 'Deletion proposal dog');
      const idempotencyKey = crypto.randomUUID();
      const { data: created, error } = await proposeDeletion(primary, dog.id, idempotencyKey);
      assertNoError(error, 'create deletion proposal');
      assert.equal(created.outcome, 'CREATED');
      const { data: replay } = await proposeDeletion(primary, dog.id, idempotencyKey);
      assert.equal(replay.proposal_id, created.proposal_id);
      assert.equal(replay.outcome, 'CREATED');
      const { data: duplicate } = await proposeDeletion(primary, dog.id);
      assert.equal(duplicate.outcome, 'ACTION_ALREADY_PENDING');

      const { data: proposal, error: proposalError } = await coOwner.client
        .from('dog_deletion_proposals')
        .select('status,required_consent_count,approved_consent_count,expires_at')
        .eq('id', created.proposal_id)
        .single();
      assertNoError(proposalError, 'read owner-visible proposal');
      assert.equal(proposal.status, 'PENDING');
      assert.equal(proposal.required_consent_count, 3);
      assert.equal(proposal.approved_consent_count, 1);
      assert.ok(Date.parse(proposal.expires_at) > Date.now());
      const { data: consents } = await serviceClient
        .from('dog_deletion_consents')
        .select('decision,member_id')
        .eq('proposal_id', created.proposal_id);
      assert.deepEqual(consents.map(({ decision }) => decision), ['APPROVED']);
      const { data: requestedNotifications, error: notificationsError } =
        await serviceClient
          .from('notifications')
          .select('receiver_id,type,target_type,target_id')
          .eq('target_id', created.proposal_id)
          .eq('type', 'dog_deletion_consent_requested');
      assertNoError(notificationsError, 'read deletion-consent notifications');
      assert.deepEqual(
        requestedNotifications.map(({ receiver_id: receiverId }) => receiverId).sort(),
        [coOwner.id, secondCoOwner.id].sort(),
      );
    });

    await suite.test('rejection, withdrawal, cancellation, and exact expiry are terminal', async () => {
      const rejectedDog = await createSharedDog(primary, [coOwner], 'Rejected deletion dog');
      const { data: rejectedProposal } = await proposeDeletion(primary, rejectedDog.id);
      const { data: rejected, error: rejectError } = await respondToDeletion(
        coOwner,
        rejectedProposal.proposal_id,
        false,
      );
      assertNoError(rejectError, 'reject deletion');
      assert.equal(rejected.outcome, 'REJECTED');

      const withdrawnDog = await createSharedDog(primary, [coOwner, secondCoOwner], 'Withdrawn deletion dog');
      const { data: withdrawnProposal } = await proposeDeletion(primary, withdrawnDog.id);
      const { data: approved } = await respondToDeletion(coOwner, withdrawnProposal.proposal_id, true);
      assert.equal(approved.outcome, 'APPROVED');
      const { data: withdrawn, error: withdrawError } = await coOwner.client.rpc(
        'api_withdraw_dog_deletion',
        { ...clientArguments, p_proposal_id: withdrawnProposal.proposal_id },
      );
      assertNoError(withdrawError, 'withdraw deletion approval');
      assert.equal(withdrawn.outcome, 'CANCELED');

      const canceledDog = await createSharedDog(primary, [coOwner], 'Canceled deletion dog');
      const { data: canceledProposal } = await proposeDeletion(primary, canceledDog.id);
      const { data: canceled, error: cancelError } = await primary.client.rpc(
        'api_cancel_dog_deletion',
        { ...clientArguments, p_proposal_id: canceledProposal.proposal_id },
      );
      assertNoError(cancelError, 'cancel deletion proposal');
      assert.equal(canceled.outcome, 'CANCELED');

      const expiredDog = await createSharedDog(primary, [coOwner], 'Expired deletion dog');
      const { data: expiredProposal } = await proposeDeletion(primary, expiredDog.id);
      const expiredAt = new Date().toISOString();
      const expiredCreatedAt = new Date(
        Date.parse(expiredAt) - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { error: expireFixtureError } = await serviceClient
        .from('dog_deletion_proposals')
        .update({ created_at: expiredCreatedAt, expires_at: expiredAt })
        .eq('id', expiredProposal.proposal_id);
      assertNoError(expireFixtureError, 'set exact proposal expiry boundary');
      const { data: expiredRead, error: expiredReadError } =
        await coOwner.client.rpc('api_get_dog_deletion_proposal', {
          ...clientArguments,
          p_proposal_id: expiredProposal.proposal_id,
        });
      assertNoError(expiredReadError, 'lazily expire proposal during read');
      assert.equal(expiredRead.status, 'EXPIRED');
      const { data: expired, error: expiredError } = await respondToDeletion(
        coOwner,
        expiredProposal.proposal_id,
        true,
      );
      assertNoError(expiredError, 'persist exact expiry');
      assert.equal(expired.outcome, 'EXPIRED');
    });

    await suite.test('owner-set and primary changes cancel pending proposals', async () => {
      const departureDog = await createSharedDog(primary, [coOwner], 'Departure cancels deletion dog');
      const { data: departureProposal } = await proposeDeletion(primary, departureDog.id);
      const { data: left, error: leaveError } = await coOwner.client.rpc('api_leave_dog', {
        ...clientArguments,
        p_dog_id: departureDog.id,
        p_expected_ownership_version: departureDog.ownership_version,
        p_selected_successor_member_id: null,
      });
      assertNoError(leaveError, 'leave while deletion pending');
      assert.equal(left.outcome, 'LEFT');
      const { data: canceledAfterLeave } = await serviceClient
        .from('dog_deletion_proposals')
        .select('status,cancellation_reason')
        .eq('id', departureProposal.proposal_id)
        .single();
      assert.equal(canceledAfterLeave.status, 'CANCELED');
      assert.equal(canceledAfterLeave.cancellation_reason, 'OWNER_SET_CHANGED');

      const transferDog = await createSharedDog(primary, [coOwner], 'Transfer cancels deletion dog');
      const { data: transferProposal } = await proposeDeletion(primary, transferDog.id);
      const { data: transfer } = await primary.client.rpc('api_create_primary_transfer', {
        ...clientArguments,
        p_dog_id: transferDog.id,
        p_idempotency_key: crypto.randomUUID(),
        p_to_member_id: transferDog.memberIds[0],
      });
      const { data: accepted, error: acceptError } = await coOwner.client.rpc(
        'api_respond_primary_transfer',
        { ...clientArguments, p_accept: true, p_transfer_id: transfer.action_id },
      );
      assertNoError(acceptError, 'accept transfer while deletion pending');
      assert.equal(accepted.outcome, 'ACCEPTED');
      const { data: canceledAfterTransfer } = await serviceClient
        .from('dog_deletion_proposals')
        .select('status,cancellation_reason')
        .eq('id', transferProposal.proposal_id)
        .single();
      assert.equal(canceledAfterTransfer.status, 'CANCELED');
      assert.equal(canceledAfterTransfer.cancellation_reason, 'PRIMARY_CHANGED');
    });

    await suite.test('final consent atomically hides the dog and queues deterministic cleanup', async () => {
      const dog = await createSharedDog(primary, [coOwner], 'Unanimously deleted dog');
      const imagePath = `${dog.id}/${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await serviceClient.storage
        .from('dogs')
        .upload(imagePath, new TextEncoder().encode('delete me'), { contentType: 'image/webp' });
      assertNoError(uploadError, 'upload deletion fixture object');
      fixture.dogObjectPaths.push(imagePath);
      const { data: transfer, error: transferError } = await primary.client.rpc(
        'api_create_primary_transfer',
        {
          ...clientArguments,
          p_dog_id: dog.id,
          p_idempotency_key: crypto.randomUUID(),
          p_to_member_id: dog.memberIds[0],
        },
      );
      assertNoError(transferError, 'create conflicting transfer');
      const { data: proposal } = await proposeDeletion(primary, dog.id);
      const { data: completed, error } = await respondToDeletion(coOwner, proposal.proposal_id, true);
      assertNoError(error, 'apply final deletion consent');
      assert.equal(completed.outcome, 'DELETION_PREPARED');
      const { data: hiddenDog } = await serviceClient
        .from('dogs')
        .select('lifecycle_state,deleted_at,owner,ownership_version')
        .eq('id', dog.id)
        .single();
      assert.equal(hiddenDog.lifecycle_state, 'DELETING');
      assert.ok(hiddenDog.deleted_at);
      assert.equal(hiddenDog.owner, null);
      const { data: canceledTransfer } = await serviceClient
        .from('dog_primary_transfers')
        .select('status,cancellation_reason')
        .eq('id', transfer.action_id)
        .single();
      assert.deepEqual(canceledTransfer, {
        cancellation_reason: 'DOG_UNAVAILABLE',
        status: 'CANCELED',
      });
      const { data: ownerRead } = await primary.client.from('dogs').select('id').eq('id', dog.id);
      assert.deepEqual(ownerRead, []);
      const workerResponse = await fetch(`${apiUrl}/functions/v1/process-dog-storage-jobs`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      const workerResult = await workerResponse.json();
      assert.equal(workerResponse.status, 200, JSON.stringify(workerResult));
      assert.equal(workerResult.failed, 0, JSON.stringify(workerResult));
      assert.ok(workerResult.completed >= 1);
      const { data: purgedDog } = await serviceClient.from('dogs').select('id').eq('id', dog.id);
      assert.deepEqual(purgedDog, []);
      const { data: retainedAudit } = await serviceClient
        .from('dog_ownership_audit')
        .select('event,dog_id')
        .eq('dog_id', dog.id);
      assert.ok(retainedAudit.some(({ event }) => event === 'DOG_DELETION_COMPLETED'));
    });

    await suite.test('serializes duplicate final responses so deletion happens once', async () => {
      const dog = await createSharedDog(primary, [coOwner], 'Concurrent deletion dog');
      const { data: proposal } = await proposeDeletion(primary, dog.id);
      const responses = await Promise.all([
        respondToDeletion(coOwner, proposal.proposal_id, true),
        respondToDeletion(coOwner, proposal.proposal_id, true),
      ]);
      for (const response of responses) {
        assertNoError(response.error, 'serialize duplicate final consent');
      }
      assert.deepEqual(
        responses.map(({ data }) => data.outcome).sort(),
        ['DELETION_PREPARED', 'NO_CHANGE'],
      );
      const { data: jobs, error: jobsError } = await serviceClient.rpc(
        'claim_dog_storage_jobs',
        { p_limit: 100 },
      );
      assertNoError(jobsError, 'claim concurrent deletion cleanup');
      assert.equal(
        jobs.filter(
          ({ dog_id: jobDogId, operation }) =>
            jobDogId === dog.id && operation === 'DELETE_DOG_ASSETS',
        ).length,
        1,
      );
    });

    await suite.test('serializes final consent against primary departure', async () => {
      const dog = await createSharedDog(primary, [coOwner], 'Deletion departure race dog');
      const { data: proposal } = await proposeDeletion(primary, dog.id);
      const [responseResult, leaveResult] = await Promise.all([
        respondToDeletion(coOwner, proposal.proposal_id, true),
        primary.client.rpc('api_leave_dog', {
          ...clientArguments,
          p_dog_id: dog.id,
          p_expected_ownership_version: dog.ownership_version,
          p_selected_successor_member_id: dog.memberIds[0],
        }),
      ]);
      assertNoError(responseResult.error, 'serialize deletion response race');
      assertNoError(leaveResult.error, 'serialize primary departure race');
      const outcomes = [responseResult.data.outcome, leaveResult.data.outcome];
      assert.ok(
        (outcomes.includes('DELETION_PREPARED') && outcomes.includes('DOG_UNAVAILABLE')) ||
          (outcomes.includes('CANCELED') && outcomes.includes('LEFT')),
      );
    });
  } finally {
    await cleanupFixture();
  }
});
