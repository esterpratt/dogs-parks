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
    email: `ownership-actions-${label}@example.test`,
    password: `Ownership-actions-${label}-password-2026!`,
  });
  assertNoError(error, `create ${label} Auth user`);
  assert.ok(data.user?.id);
  assert.ok(data.session?.access_token);
  fixture.authUserIds.push(data.user.id);

  const { error: profileError } = await serviceClient.from('users').insert({
    id: data.user.id,
    name: `Ownership Actions ${label}`,
    private: false,
  });
  assertNoError(profileError, `create ${label} profile`);

  return {
    client: createClientWithToken(anonKey, data.session.access_token),
    id: data.user.id,
  };
};

const createDog = async (ownerId, name) => {
  const { data, error } = await serviceClient
    .from('dogs')
    .insert({ birthday: '2020-01-01', name, owner: ownerId })
    .select('id')
    .single();
  assertNoError(error, `create ${name}`);
  fixture.dogIds.push(data.id);
  return data.id;
};

const createFriendship = async (firstUserId, secondUserId) => {
  const { data, error } = await serviceClient
    .from('friendships')
    .insert({
      requestee_id: secondUserId,
      requester_id: firstUserId,
      status: 'APPROVED',
    })
    .select('id')
    .single();
  assertNoError(error, 'create approved friendship');
  return data.id;
};

const clientArguments = { p_client_build: 1, p_client_platform: 'WEB' };

const cleanupFixture = async () => {
  if (fixture.dogIds.length > 0) {
    await serviceClient.from('dogs').delete().in('id', fixture.dogIds);
  }
  for (const authUserId of fixture.authUserIds) {
    await serviceClient.auth.admin.deleteUser(authUserId);
  }
};

test('dog ownership invitation and request contract', async (suite) => {
  let owner;
  let invitee;
  let requester;
  let outsider;
  let inviteDogId;
  let requestDogId;

  try {
    [owner, invitee, requester, outsider] = await Promise.all([
      createUser('owner'),
      createUser('invitee'),
      createUser('requester'),
      createUser('outsider'),
    ]);
    await createFriendship(owner.id, invitee.id);
    await createFriendship(owner.id, requester.id);
    inviteDogId = await createDog(owner.id, 'Ownership invite dog');
    requestDogId = await createDog(owner.id, 'Ownership request dog');

    await suite.test(
      'keeps capabilities and mutations disabled by compatibility data',
      async () => {
        const { data: capability, error: capabilityError } =
          await requester.client.rpc('api_get_dog_ownership_capabilities', {
            ...clientArguments,
            p_dog_id: requestDogId,
          });
        assertNoError(capabilityError, 'read disabled capability');
        assert.equal(capability.outcome, 'UPGRADE_REQUIRED');
        assert.equal(capability.enabled, false);

        const { data: createResult, error: createError } =
          await requester.client.rpc('api_create_dog_ownership_request', {
            ...clientArguments,
            p_dog_id: requestDogId,
            p_idempotency_key: crypto.randomUUID(),
          });
        assertNoError(createError, 'return disabled mutation outcome');
        assert.equal(createResult.outcome, 'UPGRADE_REQUIRED');

        const { error: enableError } = await serviceClient
          .from('app_feature_compatibility')
          .update({ enabled: true, minimum_build: 1 })
          .eq('feature', 'SHARED_DOG_OWNERSHIP')
          .eq('platform', 'WEB');
        assertNoError(enableError, 'enable isolated Web ownership fixture');
      },
    );

    await suite.test(
      'denies anonymous RPCs and all authenticated direct writes',
      async () => {
        const { error: anonymousError } = await anonymousClient.rpc(
          'api_create_dog_invite',
          {
            ...clientArguments,
            p_dog_id: inviteDogId,
            p_idempotency_key: crypto.randomUUID(),
            p_invitee_user_id: invitee.id,
          },
        );
        assert.match(anonymousError?.message ?? '', /permission denied/u);

        const { error: retiredLegacyError } = await owner.client.rpc(
          'cancel_dog_invite',
          { p_invite_id: crypto.randomUUID() },
        );
        assert.match(
          retiredLegacyError?.message ?? '',
          /Could not find the function|schema cache/u,
        );

        const { error: inviteWriteError } = await owner.client
          .from('dog_invites')
          .insert({
            dog_id: inviteDogId,
            idempotency_key: crypto.randomUUID(),
            invitee_user_id: invitee.id,
            ownership_version_at_creation: 1,
          });
        assert.match(
          inviteWriteError?.message ?? '',
          /row-level security|permission denied/u,
        );

        const { error: requestWriteError } = await requester.client
          .from('dog_ownership_requests')
          .insert({
            disclosure_accepted_at: new Date().toISOString(),
            dog_id: requestDogId,
            idempotency_key: crypto.randomUUID(),
            ownership_version_at_creation: 1,
            requester_user_id: requester.id,
          });
        assert.match(
          requestWriteError?.message ?? '',
          /row-level security|permission denied/u,
        );
      },
    );

    await suite.test(
      'creates idempotent friend-only invitations and blocks crossed actions',
      async () => {
        const idempotencyKey = crypto.randomUUID();
        const args = {
          ...clientArguments,
          p_dog_id: inviteDogId,
          p_idempotency_key: idempotencyKey,
          p_invitee_user_id: invitee.id,
        };
        const { data: created, error: createError } = await owner.client.rpc(
          'api_create_dog_invite',
          args,
        );
        assertNoError(createError, 'create invitation');
        assert.equal(created.outcome, 'CREATED');

        const { data: replayed, error: replayError } = await owner.client.rpc(
          'api_create_dog_invite',
          args,
        );
        assertNoError(replayError, 'replay invitation');
        assert.equal(replayed.outcome, 'CREATED');
        assert.equal(replayed.action_id, created.action_id);

        const { data: crossed, error: crossedError } = await invitee.client.rpc(
          'api_create_dog_ownership_request',
          {
            ...clientArguments,
            p_dog_id: inviteDogId,
            p_idempotency_key: crypto.randomUUID(),
          },
        );
        assertNoError(crossedError, 'return crossed-action result');
        assert.equal(crossed.outcome, 'ACTION_ALREADY_PENDING');

        const { data: outsiderResult, error: outsiderError } =
          await owner.client.rpc('api_create_dog_invite', {
            ...clientArguments,
            p_dog_id: inviteDogId,
            p_idempotency_key: crypto.randomUUID(),
            p_invitee_user_id: outsider.id,
          });
        assertNoError(outsiderError, 'return non-friend result');
        assert.equal(outsiderResult.outcome, 'NOT_FRIENDS');

        const { data: notification, error: notificationError } =
          await serviceClient
            .from('notifications')
            .select('receiver_id,sender_id,type,target_type,target_id')
            .eq('target_id', created.action_id)
            .single();
        assertNoError(notificationError, 'read invitation notification');
        assert.deepEqual(notification, {
          receiver_id: invitee.id,
          sender_id: owner.id,
          target_id: created.action_id,
          target_type: 'DOG_OWNERSHIP_ACTION',
          type: 'dog_ownership_invite_received',
        });
      },
    );

    await suite.test(
      'accepts only with disclosure and adds one co-owner atomically',
      async () => {
        const { data: invite, error: inviteError } = await invitee.client
          .from('dog_invites')
          .select('id')
          .eq('dog_id', inviteDogId)
          .single();
        assertNoError(inviteError, 'read own invite');

        const { data: forbidden, error: forbiddenError } =
          await outsider.client.rpc('api_respond_dog_invite', {
            ...clientArguments,
            p_accept: false,
            p_disclosure_accepted: false,
            p_invite_id: invite.id,
          });
        assertNoError(forbiddenError, 'return unauthorized response outcome');
        assert.equal(forbidden.outcome, 'FORBIDDEN');

        const { data: missingDisclosure, error: missingDisclosureError } =
          await invitee.client.rpc('api_respond_dog_invite', {
            ...clientArguments,
            p_accept: true,
            p_disclosure_accepted: false,
            p_invite_id: invite.id,
          });
        assertNoError(missingDisclosureError, 'return disclosure result');
        assert.equal(missingDisclosure.outcome, 'DISCLOSURE_REQUIRED');

        const { data: accepted, error: acceptError } = await invitee.client.rpc(
          'api_respond_dog_invite',
          {
            ...clientArguments,
            p_accept: true,
            p_disclosure_accepted: true,
            p_invite_id: invite.id,
          },
        );
        assertNoError(acceptError, 'accept invite');
        assert.equal(accepted.outcome, 'ACCEPTED');

        const { data: member, error: memberError } = await serviceClient
          .from('dog_members')
          .select('role,left_at')
          .eq('dog_id', inviteDogId)
          .eq('user_id', invitee.id)
          .single();
        assertNoError(memberError, 'read accepted membership');
        assert.deepEqual(member, { left_at: null, role: 'CO_OWNER' });
      },
    );

    await suite.test(
      'supports request cancellation, immediate recreation and primary approval',
      async () => {
        const createRequest = (idempotencyKey) =>
          requester.client.rpc('api_create_dog_ownership_request', {
            ...clientArguments,
            p_dog_id: requestDogId,
            p_idempotency_key: idempotencyKey,
          });

        const { data: first, error: firstError } = await createRequest(
          crypto.randomUUID(),
        );
        assertNoError(firstError, 'create ownership request');
        assert.equal(first.outcome, 'CREATED');

        const { data: canceled, error: cancelError } =
          await requester.client.rpc('api_cancel_dog_ownership_request', {
            ...clientArguments,
            p_request_id: first.action_id,
          });
        assertNoError(cancelError, 'cancel ownership request');
        assert.equal(canceled.outcome, 'CANCELED');

        const { data: replacement, error: replacementError } =
          await createRequest(crypto.randomUUID());
        assertNoError(
          replacementError,
          'recreate ownership request immediately',
        );
        assert.equal(replacement.outcome, 'CREATED');
        assert.notEqual(replacement.action_id, first.action_id);

        const { data: approved, error: approveError } = await owner.client.rpc(
          'api_respond_dog_ownership_request',
          {
            ...clientArguments,
            p_approve: true,
            p_request_id: replacement.action_id,
          },
        );
        assertNoError(approveError, 'approve ownership request');
        assert.equal(approved.outcome, 'APPROVED');

        const { data: member, error: memberError } = await serviceClient
          .from('dog_members')
          .select('role')
          .eq('dog_id', requestDogId)
          .eq('user_id', requester.id)
          .single();
        assertNoError(memberError, 'read approved requester membership');
        assert.equal(member.role, 'CO_OWNER');
      },
    );

    await suite.test(
      'expires at the exact boundary and cancels actions when friendship ends',
      async () => {
        const expiryUser = await createUser('expiry');
        const friendshipId = await createFriendship(owner.id, expiryUser.id);
        const expiryDogId = await createDog(owner.id, 'Ownership expiry dog');
        const { data: created, error: createError } = await owner.client.rpc(
          'api_create_dog_invite',
          {
            ...clientArguments,
            p_dog_id: expiryDogId,
            p_idempotency_key: crypto.randomUUID(),
            p_invitee_user_id: expiryUser.id,
          },
        );
        assertNoError(createError, 'create expiring invite');

        const expiryBoundary = new Date();
        const createdAt = new Date(
          expiryBoundary.getTime() - 30 * 24 * 60 * 60 * 1000,
        );
        const { error: expireError } = await serviceClient
          .from('dog_invites')
          .update({
            created_at: createdAt.toISOString(),
            expires_at: expiryBoundary.toISOString(),
          })
          .eq('id', created.action_id);
        assertNoError(expireError, 'move invite to exact expiry boundary');

        const { data: expired, error: respondError } =
          await expiryUser.client.rpc('api_respond_dog_invite', {
            ...clientArguments,
            p_accept: false,
            p_disclosure_accepted: false,
            p_invite_id: created.action_id,
          });
        assertNoError(respondError, 'respond to expired invite');
        assert.equal(expired.outcome, 'EXPIRED');

        const { data: replacement, error: replacementError } =
          await owner.client.rpc('api_create_dog_invite', {
            ...clientArguments,
            p_dog_id: expiryDogId,
            p_idempotency_key: crypto.randomUUID(),
            p_invitee_user_id: expiryUser.id,
          });
        assertNoError(replacementError, 'create replacement invite');
        assert.equal(replacement.outcome, 'CREATED');

        const { error: endFriendshipError } = await serviceClient
          .from('friendships')
          .delete()
          .eq('id', friendshipId);
        assertNoError(endFriendshipError, 'end friendship');

        const { data: canceledInvite, error: canceledInviteError } =
          await serviceClient
            .from('dog_invites')
            .select('status,cancellation_reason')
            .eq('id', replacement.action_id)
            .single();
        assertNoError(canceledInviteError, 'read friendship-canceled invite');
        assert.deepEqual(canceledInvite, {
          cancellation_reason: 'FRIENDSHIP_ENDED',
          status: 'CANCELED',
        });

        const {
          data: cancellationNotification,
          error: cancellationNotificationError,
        } = await serviceClient
          .from('notifications')
          .select('receiver_id,type,target_id')
          .eq('target_id', replacement.action_id)
          .eq('type', 'dog_ownership_invite_canceled')
          .single();
        assertNoError(
          cancellationNotificationError,
          'read friendship-cancellation notification',
        );
        assert.deepEqual(cancellationNotification, {
          receiver_id: expiryUser.id,
          target_id: replacement.action_id,
          type: 'dog_ownership_invite_canceled',
        });
      },
    );

    await suite.test(
      'enforces invitation capacity and the rolling request rate limit',
      async () => {
        const capacityDogId = await createDog(
          owner.id,
          'Ownership capacity dog',
        );
        const capacityUsers = [];
        for (let index = 0; index < 7; index += 1) {
          capacityUsers.push(await createUser(`capacity-${index}`));
        }
        const { error: memberError } = await serviceClient
          .from('dog_members')
          .insert(
            capacityUsers.map(({ id }) => ({
              dog_id: capacityDogId,
              role: 'CO_OWNER',
              user_id: id,
            })),
          );
        assertNoError(memberError, 'fill dog owner capacity');

        const fullCandidate = await createUser('full-candidate');
        await createFriendship(owner.id, fullCandidate.id);
        const { data: fullResult, error: fullError } = await owner.client.rpc(
          'api_create_dog_invite',
          {
            ...clientArguments,
            p_dog_id: capacityDogId,
            p_idempotency_key: crypto.randomUUID(),
            p_invitee_user_id: fullCandidate.id,
          },
        );
        assertNoError(fullError, 'return full-capacity result');
        assert.equal(fullResult.outcome, 'CAPACITY_REACHED');

        const limitedRequester = await createUser('rate-limited-requester');
        await createFriendship(owner.id, limitedRequester.id);
        const rateDogId = await createDog(
          owner.id,
          'Ownership request rate dog',
        );
        for (let index = 0; index < 10; index += 1) {
          const { data: created, error: createError } =
            await limitedRequester.client.rpc(
              'api_create_dog_ownership_request',
              {
                ...clientArguments,
                p_dog_id: rateDogId,
                p_idempotency_key: crypto.randomUUID(),
              },
            );
          assertNoError(createError, `create rate request ${index}`);
          assert.equal(created.outcome, 'CREATED');
          const { error: cancelError } = await limitedRequester.client.rpc(
            'api_cancel_dog_ownership_request',
            { ...clientArguments, p_request_id: created.action_id },
          );
          assertNoError(cancelError, `cancel rate request ${index}`);
        }

        const { data: limited, error: limitedError } =
          await limitedRequester.client.rpc(
            'api_create_dog_ownership_request',
            {
              ...clientArguments,
              p_dog_id: rateDogId,
              p_idempotency_key: crypto.randomUUID(),
            },
          );
        assertNoError(limitedError, 'return rate-limited result');
        assert.equal(limited.outcome, 'RATE_LIMITED');
        assert.ok(Date.parse(limited.retry_after) > Date.now());
      },
    );
  } finally {
    await cleanupFixture();
  }
});
