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
const createClientWithToken = (key, token) =>
  createClient(apiUrl, key, {
    auth: authOptions,
    ...(token
      ? { global: { headers: { Authorization: `Bearer ${token}` } } }
      : {}),
  });
const anonymousClient = createClientWithToken(anonKey);
const serviceClient = createClientWithToken(serviceRoleKey);
const clientArguments = { p_client_build: 1, p_client_platform: 'WEB' };
const fixture = { authUserIds: [], dogIds: [] };

const assertNoError = (error, operation) => {
  assert.equal(
    error,
    null,
    `${operation}: ${error?.message ?? 'unknown error'}`,
  );
};

const createUser = async (label) => {
  const signupClient = createClientWithToken(anonKey);
  const { data, error } = await signupClient.auth.signUp({
    email: `transfer-departure-${label}-${crypto.randomUUID()}@example.test`,
    password: `Transfer-departure-${label}-password-2026!`,
  });
  assertNoError(error, `create ${label} Auth user`);
  assert.ok(data.user?.id);
  assert.ok(data.session?.access_token);
  fixture.authUserIds.push(data.user.id);

  const { error: profileError } = await serviceClient.from('users').insert({
    id: data.user.id,
    name: `Transfer Departure ${label}`,
    private: false,
  });
  assertNoError(profileError, `create ${label} profile`);
  return {
    accessToken: data.session.access_token,
    client: createClientWithToken(anonKey, data.session.access_token),
    id: data.user.id,
  };
};

const createDog = async (ownerId, name) => {
  const { data, error } = await serviceClient
    .from('dogs')
    .insert({ birthday: '2020-01-01', name, owner: ownerId })
    .select('id,ownership_version')
    .single();
  assertNoError(error, `create ${name}`);
  fixture.dogIds.push(data.id);
  return data;
};

const addCoOwner = async (dogId, userId, joinedAt) => {
  const { data, error } = await serviceClient
    .from('dog_members')
    .insert({
      dog_id: dogId,
      joined_at: joinedAt,
      role: 'CO_OWNER',
      user_id: userId,
    })
    .select('id')
    .single();
  assertNoError(error, 'add co-owner fixture');
  return data.id;
};

const createSharedDog = async (primary, coOwners, name) => {
  const dog = await createDog(primary.id, name);
  const memberIds = [];
  for (const [index, coOwner] of coOwners.entries()) {
    memberIds.push(
      await addCoOwner(
        dog.id,
        coOwner.id,
        new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
      ),
    );
  }
  return { ...dog, memberIds };
};

const createTransfer = async (
  primary,
  dogId,
  targetMemberId,
  idempotencyKey = crypto.randomUUID(),
) => {
  return primary.client.rpc('api_create_primary_transfer', {
    ...clientArguments,
    p_dog_id: dogId,
    p_idempotency_key: idempotencyKey,
    p_to_member_id: targetMemberId,
  });
};

const getDogVersion = async (dogId) => {
  const { data, error } = await serviceClient
    .from('dogs')
    .select('ownership_version')
    .eq('id', dogId)
    .single();
  assertNoError(error, 'read dog ownership version');
  return data.ownership_version;
};

const cleanupFixture = async () => {
  if (fixture.dogIds.length > 0) {
    await serviceClient.from('dogs').delete().in('id', fixture.dogIds);
  }
  for (const authUserId of fixture.authUserIds) {
    await serviceClient.auth.admin.deleteUser(authUserId);
  }
};

test('primary transfer, departure, and account-erasure contract', async (suite) => {
  try {
    const [primary, oldest, newest, outsider] = await Promise.all([
      createUser('primary'),
      createUser('oldest'),
      createUser('newest'),
      createUser('outsider'),
    ]);

    await suite.test(
      'keeps slice-7 capabilities disabled until server rollout data enables them',
      async () => {
        const dog = await createSharedDog(
          primary,
          [oldest],
          'Disabled transfer dog',
        );
        const { error: disableError } = await serviceClient
          .from('app_feature_compatibility')
          .update({ enabled: false })
          .eq('feature', 'SHARED_DOG_OWNERSHIP')
          .eq('platform', 'WEB');
        assertNoError(disableError, 'disable isolated Web fixture');

        const { data, error } = await createTransfer(
          primary,
          dog.id,
          dog.memberIds[0],
        );
        assertNoError(error, 'return disabled transfer result');
        assert.equal(data.outcome, 'UPGRADE_REQUIRED');

        const { error: enableError } = await serviceClient
          .from('app_feature_compatibility')
          .update({ enabled: true, minimum_build: 1 })
          .eq('feature', 'SHARED_DOG_OWNERSHIP')
          .eq('platform', 'WEB');
        assertNoError(enableError, 'enable isolated Web fixture');
      },
    );

    await suite.test(
      'denies anonymous lifecycle calls and authenticated direct writes',
      async () => {
        const dog = await createSharedDog(
          primary,
          [oldest],
          'Transfer authorization dog',
        );
        const { error: anonymousError } = await anonymousClient.rpc(
          'api_create_primary_transfer',
          {
            ...clientArguments,
            p_dog_id: dog.id,
            p_idempotency_key: crypto.randomUUID(),
            p_to_member_id: dog.memberIds[0],
          },
        );
        assert.match(anonymousError?.message ?? '', /permission denied/u);

        const { error: helperError } = await anonymousClient.rpc(
          'expire_primary_transfers',
          { p_dog_id: dog.id },
        );
        assert.match(helperError?.message ?? '', /permission denied/u);

        const { error: directWriteError } = await primary.client
          .from('dog_primary_transfers')
          .insert({
            dog_id: dog.id,
            from_member_id: dog.memberIds[0],
            idempotency_key: crypto.randomUUID(),
            ownership_version_at_creation: dog.ownership_version,
            to_member_id: dog.memberIds[0],
          });
        assert.match(
          directWriteError?.message ?? '',
          /row-level security|permission denied/u,
        );
      },
    );

    await suite.test(
      'creates one idempotent pending transfer for an active co-owner only',
      async () => {
        const dog = await createSharedDog(
          primary,
          [oldest, newest],
          'Transfer creation dog',
        );
        const idempotencyKey = crypto.randomUUID();
        const { data: created, error: createError } = await createTransfer(
          primary,
          dog.id,
          dog.memberIds[0],
          idempotencyKey,
        );
        assertNoError(createError, 'create primary transfer');
        assert.equal(created.outcome, 'CREATED');

        const { data: offeredNotification, error: offeredNotificationError } =
          await serviceClient
            .from('notifications')
            .select('receiver_id,sender_id,type,target_type,target_id')
            .eq('target_id', created.action_id)
            .single();
        assertNoError(
          offeredNotificationError,
          'read transfer-offered notification',
        );
        assert.deepEqual(offeredNotification, {
          receiver_id: oldest.id,
          sender_id: primary.id,
          target_id: created.action_id,
          target_type: 'DOG_OWNERSHIP_ACTION',
          type: 'dog_primary_transfer_offered',
        });

        const { data: ownerRows, error: ownerRowsError } = await oldest.client
          .from('dog_primary_transfers')
          .select('id')
          .eq('id', created.action_id);
        assertNoError(ownerRowsError, 'read transfer as active owner');
        assert.equal(ownerRows.length, 1);
        const { data: outsiderRows, error: outsiderRowsError } =
          await outsider.client
            .from('dog_primary_transfers')
            .select('id')
            .eq('id', created.action_id);
        assertNoError(outsiderRowsError, 'read transfer as outsider');
        assert.deepEqual(outsiderRows, []);

        const { data: forbiddenResponse, error: forbiddenResponseError } =
          await outsider.client.rpc('api_respond_primary_transfer', {
            ...clientArguments,
            p_accept: false,
            p_transfer_id: created.action_id,
          });
        assertNoError(
          forbiddenResponseError,
          'return unauthorized transfer response',
        );
        assert.equal(forbiddenResponse.outcome, 'FORBIDDEN');

        const { data: replayed, error: replayError } = await createTransfer(
          primary,
          dog.id,
          dog.memberIds[0],
          idempotencyKey,
        );
        assertNoError(replayError, 'replay primary transfer');
        assert.equal(replayed.action_id, created.action_id);

        const { data: duplicate, error: duplicateError } = await createTransfer(
          primary,
          dog.id,
          dog.memberIds[1],
        );
        assertNoError(duplicateError, 'return pending-transfer conflict');
        assert.equal(duplicate.outcome, 'ACTION_ALREADY_PENDING');

        const outsiderDog = await createDog(outsider.id, 'Outsider target dog');
        const { data: outsiderMember, error: outsiderMemberError } =
          await serviceClient
            .from('dog_members')
            .select('id')
            .eq('dog_id', outsiderDog.id)
            .eq('user_id', outsider.id)
            .single();
        assertNoError(outsiderMemberError, 'read outsider membership');
        const otherDog = await createDog(
          primary.id,
          'Invalid transfer target dog',
        );
        const { data: invalid, error: invalidError } = await createTransfer(
          primary,
          otherDog.id,
          outsiderMember.id,
        );
        assertNoError(invalidError, 'return invalid transfer target');
        assert.equal(invalid.outcome, 'NOT_ELIGIBLE');
      },
    );

    await suite.test(
      'supports cancellation, decline, exact expiry, and idempotent terminal responses',
      async () => {
        const cancelDog = await createSharedDog(
          primary,
          [oldest],
          'Canceled transfer dog',
        );
        const { data: pending } = await createTransfer(
          primary,
          cancelDog.id,
          cancelDog.memberIds[0],
        );
        const { data: canceled, error: cancelError } = await primary.client.rpc(
          'api_cancel_primary_transfer',
          { ...clientArguments, p_transfer_id: pending.action_id },
        );
        assertNoError(cancelError, 'cancel transfer');
        assert.equal(canceled.outcome, 'CANCELED');
        const { data: canceledAgain, error: cancelAgainError } =
          await primary.client.rpc('api_cancel_primary_transfer', {
            ...clientArguments,
            p_transfer_id: pending.action_id,
          });
        assertNoError(cancelAgainError, 'repeat transfer cancellation');
        assert.equal(canceledAgain.outcome, 'CANCELED');

        const declineDog = await createSharedDog(
          primary,
          [oldest],
          'Declined transfer dog',
        );
        const { data: offered } = await createTransfer(
          primary,
          declineDog.id,
          declineDog.memberIds[0],
        );
        const { data: declined, error: declineError } = await oldest.client.rpc(
          'api_respond_primary_transfer',
          {
            ...clientArguments,
            p_accept: false,
            p_transfer_id: offered.action_id,
          },
        );
        assertNoError(declineError, 'decline transfer');
        assert.equal(declined.outcome, 'DECLINED');

        const expiryDog = await createSharedDog(
          primary,
          [oldest],
          'Expired transfer dog',
        );
        const { data: expiring } = await createTransfer(
          primary,
          expiryDog.id,
          expiryDog.memberIds[0],
        );
        const boundary = new Date(Date.now() - 1000).toISOString();
        const createdAt = new Date(
          Date.parse(boundary) - 30 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const { error: ageError } = await serviceClient
          .from('dog_primary_transfers')
          .update({ created_at: createdAt, expires_at: boundary })
          .eq('id', expiring.action_id);
        assertNoError(ageError, 'age transfer to exact expiry boundary');
        const { data: expired, error: expiryError } = await oldest.client.rpc(
          'api_respond_primary_transfer',
          {
            ...clientArguments,
            p_accept: true,
            p_transfer_id: expiring.action_id,
          },
        );
        assertNoError(expiryError, 'expire transfer lazily');
        assert.equal(expired.outcome, 'EXPIRED');
      },
    );

    await suite.test(
      'accepts atomically and cancels conflicting pending actions',
      async () => {
        const dog = await createSharedDog(
          primary,
          [oldest, newest],
          'Accepted transfer dog',
        );
        const { data: primaryMember } = await serviceClient
          .from('dog_members')
          .select('id')
          .eq('dog_id', dog.id)
          .eq('user_id', primary.id)
          .single();
        const { data: pendingInvite, error: inviteError } = await serviceClient
          .from('dog_invites')
          .insert({
            dog_id: dog.id,
            idempotency_key: crypto.randomUUID(),
            invitee_user_id: outsider.id,
            inviter_member_id: primaryMember.id,
            ownership_version_at_creation: dog.ownership_version,
            primary_user_id_at_creation: primary.id,
          })
          .select('id')
          .single();
        assertNoError(inviteError, 'seed conflicting invitation');

        const { data: transfer } = await createTransfer(
          primary,
          dog.id,
          dog.memberIds[0],
        );
        const { data: accepted, error: acceptError } = await oldest.client.rpc(
          'api_respond_primary_transfer',
          {
            ...clientArguments,
            p_accept: true,
            p_transfer_id: transfer.action_id,
          },
        );
        assertNoError(acceptError, 'accept transfer');
        assert.equal(accepted.outcome, 'ACCEPTED');
        const { data: acceptedAgain, error: acceptAgainError } =
          await oldest.client.rpc('api_respond_primary_transfer', {
            ...clientArguments,
            p_accept: true,
            p_transfer_id: transfer.action_id,
          });
        assertNoError(acceptAgainError, 'replay accepted transfer response');
        assert.equal(acceptedAgain.outcome, 'ACCEPTED');

        const [
          { data: currentDog },
          { data: members },
          { data: canceledInvite },
        ] = await Promise.all([
          serviceClient
            .from('dogs')
            .select('owner,ownership_version')
            .eq('id', dog.id)
            .single(),
          serviceClient
            .from('dog_members')
            .select('user_id,role,left_at')
            .eq('dog_id', dog.id)
            .is('left_at', null)
            .order('role'),
          serviceClient
            .from('dog_invites')
            .select('status,cancellation_reason')
            .eq('id', pendingInvite.id)
            .single(),
        ]);
        assert.equal(currentDog.owner, oldest.id);
        assert.equal(currentDog.ownership_version, dog.ownership_version + 1);
        assert.equal(
          members.find((member) => member.user_id === primary.id).role,
          'CO_OWNER',
        );
        assert.equal(
          members.find((member) => member.user_id === oldest.id).role,
          'PRIMARY_OWNER',
        );
        assert.deepEqual(canceledInvite, {
          cancellation_reason: 'PRIMARY_CHANGED',
          status: 'CANCELED',
        });
      },
    );

    await suite.test(
      'retains co-owner tenure and uses selected or deterministic fallback succession',
      async () => {
        const leaveDog = await createSharedDog(
          primary,
          [oldest],
          'Co-owner leave dog',
        );
        const leaveVersion = await getDogVersion(leaveDog.id);
        const { data: left, error: leaveError } = await oldest.client.rpc(
          'api_leave_dog',
          {
            ...clientArguments,
            p_dog_id: leaveDog.id,
            p_expected_ownership_version: leaveVersion,
            p_selected_successor_member_id: null,
          },
        );
        assertNoError(leaveError, 'leave as co-owner');
        assert.equal(left.outcome, 'LEFT');
        const { data: historical } = await serviceClient
          .from('dog_members')
          .select('left_at,departure_reason,user_id')
          .eq('id', leaveDog.memberIds[0])
          .single();
        assert.equal(historical.departure_reason, 'LEFT');
        assert.equal(historical.user_id, oldest.id);
        assert.ok(historical.left_at);

        const selectedDog = await createSharedDog(
          primary,
          [oldest, newest],
          'Selected successor dog',
        );
        const selectedVersion = await getDogVersion(selectedDog.id);
        const { data: selected, error: selectedError } =
          await primary.client.rpc('api_leave_dog', {
            ...clientArguments,
            p_dog_id: selectedDog.id,
            p_expected_ownership_version: selectedVersion,
            p_selected_successor_member_id: selectedDog.memberIds[1],
          });
        assertNoError(selectedError, 'leave with selected successor');
        assert.equal(selected.successor_user_id, newest.id);
        const {
          data: successorNotification,
          error: successorNotificationError,
        } = await serviceClient
          .from('notifications')
          .select('receiver_id,type,target_type,target_id')
          .eq('receiver_id', newest.id)
          .eq('target_id', selectedDog.id)
          .eq('type', 'dog_primary_changed')
          .single();
        assertNoError(
          successorNotificationError,
          'read successor notification',
        );
        assert.deepEqual(successorNotification, {
          receiver_id: newest.id,
          target_id: selectedDog.id,
          target_type: 'DOG',
          type: 'dog_primary_changed',
        });

        const fallbackDog = await createSharedDog(
          primary,
          [oldest, newest],
          'Fallback successor dog',
        );
        const { data: departedTarget } = await newest.client.rpc(
          'api_leave_dog',
          {
            ...clientArguments,
            p_dog_id: fallbackDog.id,
            p_expected_ownership_version: await getDogVersion(fallbackDog.id),
            p_selected_successor_member_id: null,
          },
        );
        assert.equal(departedTarget.outcome, 'LEFT');
        const { data: fallback, error: fallbackError } =
          await primary.client.rpc('api_leave_dog', {
            ...clientArguments,
            p_dog_id: fallbackDog.id,
            p_expected_ownership_version: await getDogVersion(fallbackDog.id),
            p_selected_successor_member_id: fallbackDog.memberIds[1],
          });
        assertNoError(
          fallbackError,
          'leave with invalidated selected successor',
        );
        assert.equal(fallback.successor_user_id, oldest.id);
        assert.equal(fallback.used_fallback, true);
      },
    );

    await suite.test(
      'cancels transfers on target departure and makes the first concurrent commit win',
      async () => {
        const canceledDog = await createSharedDog(
          primary,
          [oldest],
          'Departure cancels transfer dog',
        );
        const { data: pending } = await createTransfer(
          primary,
          canceledDog.id,
          canceledDog.memberIds[0],
        );
        const { data: left } = await oldest.client.rpc('api_leave_dog', {
          ...clientArguments,
          p_dog_id: canceledDog.id,
          p_expected_ownership_version: await getDogVersion(canceledDog.id),
          p_selected_successor_member_id: null,
        });
        assert.equal(left.outcome, 'LEFT');
        const { data: canceled } = await serviceClient
          .from('dog_primary_transfers')
          .select('status,cancellation_reason')
          .eq('id', pending.action_id)
          .single();
        assert.deepEqual(canceled, {
          cancellation_reason: 'MEMBER_DEPARTED',
          status: 'CANCELED',
        });

        const sourceDog = await createSharedDog(
          primary,
          [oldest, newest],
          'Source departure transfer dog',
        );
        const { data: sourceTransfer } = await createTransfer(
          primary,
          sourceDog.id,
          sourceDog.memberIds[0],
        );
        const { data: sourceLeft, error: sourceLeaveError } =
          await primary.client.rpc('api_leave_dog', {
            ...clientArguments,
            p_dog_id: sourceDog.id,
            p_expected_ownership_version: await getDogVersion(sourceDog.id),
            p_selected_successor_member_id: sourceDog.memberIds[1],
          });
        assertNoError(sourceLeaveError, 'leave as transfer source');
        assert.equal(sourceLeft.outcome, 'LEFT');
        const { data: sourceCanceled } = await serviceClient
          .from('dog_primary_transfers')
          .select('status,cancellation_reason')
          .eq('id', sourceTransfer.action_id)
          .single();
        assert.deepEqual(sourceCanceled, {
          cancellation_reason: 'MEMBER_DEPARTED',
          status: 'CANCELED',
        });

        const raceDog = await createSharedDog(
          primary,
          [oldest],
          'Transfer departure race dog',
        );
        const { data: raceTransfer } = await createTransfer(
          primary,
          raceDog.id,
          raceDog.memberIds[0],
        );
        const expectedVersion = await getDogVersion(raceDog.id);
        const [transferResponse, leaveResponse] = await Promise.all([
          oldest.client.rpc('api_respond_primary_transfer', {
            ...clientArguments,
            p_accept: true,
            p_transfer_id: raceTransfer.action_id,
          }),
          oldest.client.rpc('api_leave_dog', {
            ...clientArguments,
            p_dog_id: raceDog.id,
            p_expected_ownership_version: expectedVersion,
            p_selected_successor_member_id: null,
          }),
        ]);
        assertNoError(transferResponse.error, 'race transfer response');
        assertNoError(leaveResponse.error, 'race departure response');
        const outcomes = [
          transferResponse.data.outcome,
          leaveResponse.data.outcome,
        ];
        assert.equal(
          outcomes.filter((outcome) => ['ACCEPTED', 'LEFT'].includes(outcome))
            .length,
          1,
        );
        assert.equal(
          outcomes.filter((outcome) => outcome === 'STALE_VERSION').length,
          1,
        );

        const responseDog = await createSharedDog(
          primary,
          [oldest],
          'Concurrent response dog',
        );
        const { data: responseTransfer } = await createTransfer(
          primary,
          responseDog.id,
          responseDog.memberIds[0],
        );
        const [acceptResponse, declineResponse] = await Promise.all([
          oldest.client.rpc('api_respond_primary_transfer', {
            ...clientArguments,
            p_accept: true,
            p_transfer_id: responseTransfer.action_id,
          }),
          oldest.client.rpc('api_respond_primary_transfer', {
            ...clientArguments,
            p_accept: false,
            p_transfer_id: responseTransfer.action_id,
          }),
        ]);
        assertNoError(acceptResponse.error, 'concurrent accept response');
        assertNoError(declineResponse.error, 'concurrent decline response');
        const responseOutcomes = [
          acceptResponse.data.outcome,
          declineResponse.data.outcome,
        ];
        assert.equal(
          responseOutcomes.filter((outcome) =>
            ['ACCEPTED', 'DECLINED'].includes(outcome),
          ).length,
          1,
        );
        assert.equal(
          responseOutcomes.filter((outcome) => outcome === 'STALE_VERSION')
            .length,
          1,
        );
      },
    );

    await suite.test(
      'prepares all account-erasure dog transitions atomically',
      async () => {
        const erasing = await createUser('erasing');
        const successor = await createUser('successor');
        const otherPrimary = await createUser('other-primary');
        const sharedPrimaryDog = await createSharedDog(
          erasing,
          [successor],
          'Erasure shared primary dog',
        );
        const sharedCoOwnerDog = await createSharedDog(
          otherPrimary,
          [erasing],
          'Erasure shared co-owner dog',
        );
        const soloDog = await createDog(erasing.id, 'Erasure solo dog');

        const { data: prepared, error: prepareError } =
          await erasing.client.rpc('api_prepare_account_erasure', {
            ...clientArguments,
            p_successor_selections: {
              [sharedPrimaryDog.id]: sharedPrimaryDog.memberIds[0],
            },
          });
        assertNoError(prepareError, 'prepare account erasure');
        assert.equal(prepared.outcome, 'PREPARED');
        assert.equal(prepared.transitions.length, 3);

        const [
          { data: sharedPrimary },
          { data: sharedCoOwner },
          { data: solo },
        ] = await Promise.all([
          serviceClient
            .from('dogs')
            .select('owner,lifecycle_state')
            .eq('id', sharedPrimaryDog.id)
            .single(),
          serviceClient
            .from('dogs')
            .select('owner,lifecycle_state')
            .eq('id', sharedCoOwnerDog.id)
            .single(),
          serviceClient
            .from('dogs')
            .select('owner,lifecycle_state,deleted_at')
            .eq('id', soloDog.id)
            .single(),
        ]);
        assert.equal(sharedPrimary.owner, successor.id);
        assert.equal(sharedCoOwner.owner, otherPrimary.id);
        assert.equal(solo.owner, null);
        assert.equal(solo.lifecycle_state, 'DELETING');
        assert.ok(solo.deleted_at);
        const { data: claimedJobs, error: claimError } =
          await serviceClient.rpc('claim_dog_storage_jobs', { p_limit: 100 });
        assertNoError(claimError, 'claim prepared cleanup jobs');
        assert.ok(
          claimedJobs.some(
            (job) =>
              job.dog_id === soloDog.id &&
              job.operation === 'DELETE_DOG_ASSETS',
          ),
        );

        const { data: closedTenures } = await serviceClient
          .from('dog_members')
          .select('dog_id,departure_reason,left_at')
          .eq('user_id', erasing.id)
          .in('dog_id', [sharedPrimaryDog.id, sharedCoOwnerDog.id, soloDog.id]);
        assert.equal(closedTenures.length, 3);
        assert.ok(
          closedTenures.every(
            (member) =>
              member.departure_reason === 'ACCOUNT_ERASED' && member.left_at,
          ),
        );
      },
    );
  } finally {
    await cleanupFixture();
  }
});
