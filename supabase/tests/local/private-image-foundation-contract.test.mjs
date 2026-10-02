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
    options.global = { headers: { Authorization: `Bearer ${accessToken}` } };
  }

  return createClient(apiUrl, key, options);
};

const anonymousClient = createLocalClient(anonKey);
const serviceClient = createLocalClient(serviceRoleKey);
const fixture = { authUserIds: [], dogIds: [], dogObjectPaths: [] };

const assertNoError = (error, operation) => {
  assert.equal(error, null, `${operation}: ${error?.message ?? 'unknown error'}`);
};

const createAuthenticatedUser = async (label) => {
  const signupClient = createLocalClient(anonKey);
  const { data, error } = await signupClient.auth.signUp({
    email: `private-image-${label}@example.test`,
    password: `Private-image-${label}-password-2026!`,
  });
  assertNoError(error, `create ${label} Auth user`);
  assert.ok(data.user?.id);
  assert.ok(data.session?.access_token);
  fixture.authUserIds.push(data.user.id);

  const { error: profileError } = await serviceClient.from('users').insert({
    id: data.user.id,
    name: `Private Image ${label}`,
    private: false,
  });
  assertNoError(profileError, `create ${label} profile`);

  return {
    client: createLocalClient(anonKey, data.session.access_token),
    id: data.user.id,
  };
};

const reserveImage = async (client, dogId, extension = 'webp') => {
  const { data, error } = await client.rpc('api_reserve_dog_image', {
    p_dog_id: dogId,
    p_extension: extension,
  });
  assertNoError(error, 'reserve dog image');
  assert.equal(data.length, 1);
  return data[0];
};

const cleanupFixture = async () => {
  if (fixture.dogObjectPaths.length > 0) {
    await serviceClient.storage.from('dogs').remove(fixture.dogObjectPaths);
  }

  if (fixture.dogIds.length > 0) {
    await serviceClient.from('dogs').delete().in('id', fixture.dogIds);
  }

  const { data: legacyDog } = await serviceClient
    .from('dogs')
    .select('id,owner')
    .eq('name', 'Private image legacy dog')
    .maybeSingle();
  if (legacyDog) {
    await serviceClient.storage
      .from('users')
      .remove([`${legacyDog.owner}/dogs/${legacyDog.id}/primary/primary-legacy.jpg`]);
    await serviceClient.from('dogs').delete().eq('id', legacyDog.id);
    await serviceClient.auth.admin.deleteUser(legacyDog.owner);
  }

  for (const authUserId of fixture.authUserIds) {
    await serviceClient.auth.admin.deleteUser(authUserId);
  }
};

test('private dog image foundation contract', async (suite) => {
  let owner;
  let coOwner;
  let outsider;
  let dogId;

  try {
    owner = await createAuthenticatedUser('owner');
    coOwner = await createAuthenticatedUser('co-owner');
    outsider = await createAuthenticatedUser('outsider');

    const { data: dog, error: dogError } = await serviceClient
      .from('dogs')
      .insert({ birthday: '2020-01-01', name: 'Private image shared dog', owner: owner.id })
      .select('id')
      .single();
    assertNoError(dogError, 'create image test dog');
    dogId = dog.id;
    fixture.dogIds.push(dogId);

    const { error: memberError } = await serviceClient.from('dog_members').insert({
      dog_id: dogId,
      role: 'CO_OWNER',
      user_id: coOwner.id,
    });
    assertNoError(memberError, 'create image test co-owner');

    await suite.test('reconciles legacy metadata and queues a resumable copy', async () => {
      const { data: legacyDog, error: legacyDogError } = await serviceClient
        .from('dogs')
        .select('id,primary_image_id')
        .eq('name', 'Private image legacy dog')
        .single();
      assertNoError(legacyDogError, 'read reconciled legacy dog');

      const { data: legacyImage, error: legacyImageError } = await serviceClient
        .from('dog_images')
        .select('id,bucket_id,storage_path,uploader_member_id,upload_state,deleted_at')
        .eq('dog_id', legacyDog.id)
        .single();
      assertNoError(legacyImageError, 'read reconciled legacy image');
      assert.equal(legacyImage.bucket_id, 'users');
      assert.equal(legacyImage.upload_state, 'ACTIVE');
      assert.equal(legacyImage.uploader_member_id, null);
      assert.equal(legacyImage.deleted_at, null);
      assert.equal(legacyDog.primary_image_id, legacyImage.id);

      const unauthorizedResponse = await fetch(
        `${apiUrl}/functions/v1/process-dog-storage-jobs`,
        {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
        },
      );
      assert.equal(unauthorizedResponse.status, 401);

      const response = await fetch(`${apiUrl}/functions/v1/process-dog-storage-jobs`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      const responseBody = await response.json();
      assert.equal(response.status, 200, JSON.stringify(responseBody));
      assert.equal(responseBody.failed, 0);
      assert.ok(responseBody.completed >= 1);

      const { data: migratedImage, error: migratedImageError } = await serviceClient
        .from('dog_images')
        .select('bucket_id,storage_path')
        .eq('id', legacyImage.id)
        .single();
      assertNoError(migratedImageError, 'read copied legacy image metadata');
      assert.equal(migratedImage.bucket_id, 'dogs');
      assert.match(migratedImage.storage_path, new RegExp(`^${legacyDog.id}/${legacyImage.id}\\.`));
      fixture.dogObjectPaths.push(migratedImage.storage_path);

      const { data: legacySource, error: legacySourceError } = await serviceClient.storage
        .from('users')
        .download(legacyImage.storage_path);
      assertNoError(legacySourceError, 'retain legacy source object');
      const { data: copiedObject, error: copiedObjectError } = await serviceClient.storage
        .from('dogs')
        .download(migratedImage.storage_path);
      assertNoError(copiedObjectError, 'download verified copied object');
      assert.equal(await copiedObject.text(), await legacySource.text());

      const { data: remainingJobs, error: jobsError } = await serviceClient.rpc(
        'claim_dog_storage_jobs',
        { p_limit: 10 },
      );
      assertNoError(jobsError, 'confirm legacy copy job completion');
      assert.equal(
        remainingJobs.some(({ image_id: imageId }) => imageId === legacyImage.id),
        false,
      );
    });

    await suite.test('allows only active owners to reserve canonical immutable paths', async () => {
      const reservation = await reserveImage(coOwner.client, dogId, 'jpeg');
      assert.equal(reservation.bucket_id, 'dogs');
      assert.equal(reservation.upload_state, 'RESERVED');
      assert.equal(reservation.storage_path, `${dogId}/${reservation.id}.jpeg`);
      assert.ok(Date.parse(reservation.reservation_expires_at) > Date.now());

      const { error: outsiderError } = await outsider.client.rpc('api_reserve_dog_image', {
        p_dog_id: dogId,
        p_extension: 'webp',
      });
      assert.match(outsiderError?.message ?? '', /not_active_dog_owner/u);

      const { error: directError } = await owner.client.from('dog_images').insert({
        bucket_id: 'dogs',
        dog_id: dogId,
        storage_path: `${dogId}/forged.webp`,
      });
      assert.equal(directError?.code, '42501');

      const { error: mutationError } = await serviceClient
        .from('dog_images')
        .update({ storage_path: `${dogId}/changed.jpeg` })
        .eq('id', reservation.id);
      assert.match(mutationError?.message ?? '', /dog_image_storage_identity_is_immutable/u);
    });

    await suite.test('restricts uploads to an owner reservation and verifies finalization', async () => {
      const reservation = await reserveImage(owner.client, dogId);
      const bytes = new TextEncoder().encode('reserved image bytes');
      const { error: forgedUploadError } = await owner.client.storage
        .from('dogs')
        .upload(`${dogId}/forged.webp`, bytes, { contentType: 'image/webp' });
      assert.ok(forgedUploadError);

      const { error: outsiderUploadError } = await outsider.client.storage
        .from('dogs')
        .upload(reservation.storage_path, bytes, { contentType: 'image/webp' });
      assert.ok(outsiderUploadError);

      const { error: missingFinalizeError } = await owner.client.rpc(
        'api_finalize_dog_image',
        { p_image_id: reservation.id },
      );
      assert.match(missingFinalizeError?.message ?? '', /reserved_object_missing/u);

      const { error: uploadError } = await owner.client.storage
        .from('dogs')
        .upload(reservation.storage_path, bytes, { contentType: 'image/webp' });
      assertNoError(uploadError, 'upload reserved dog object');
      fixture.dogObjectPaths.push(reservation.storage_path);

      const { error: finalizeError } = await owner.client.rpc('api_finalize_dog_image', {
        p_image_id: reservation.id,
      });
      assertNoError(finalizeError, 'finalize reserved dog image');

      const { data: dogAfterFinalize } = await serviceClient
        .from('dogs')
        .select('primary_image_id')
        .eq('id', dogId)
        .single();
      assert.equal(dogAfterFinalize.primary_image_id, reservation.id);

      const { data: signedUrl, error: signedUrlError } = await outsider.client.storage
        .from('dogs')
        .createSignedUrl(reservation.storage_path, 900);
      assertNoError(signedUrlError, 'create authenticated gallery signed URL');
      assert.ok(signedUrl.signedUrl);

      const { error: anonymousSignedUrlError } = await anonymousClient.storage
        .from('dogs')
        .createSignedUrl(reservation.storage_path, 900);
      assert.ok(anonymousSignedUrlError);
    });

    await suite.test('counts live reservations toward the six-image capacity', async () => {
      const { data: existingImages } = await serviceClient
        .from('dog_images')
        .select('id')
        .eq('dog_id', dogId)
        .is('deleted_at', null);
      const remainingSlots = 6 - existingImages.length;
      for (let index = 0; index < remainingSlots; index += 1) {
        await reserveImage(owner.client, dogId);
      }

      const { error: capacityError } = await owner.client.rpc('api_reserve_dog_image', {
        p_dog_id: dogId,
        p_extension: 'webp',
      });
      assert.match(capacityError?.message ?? '', /dog_image_capacity_reached/u);

      const { data: oneReservation } = await serviceClient
        .from('dog_images')
        .select('id')
        .eq('dog_id', dogId)
        .eq('upload_state', 'RESERVED')
        .limit(1)
        .single();
      const { error: expireError } = await serviceClient
        .from('dog_images')
        .update({ reservation_expires_at: '2020-01-01T00:00:00.000Z' })
        .eq('id', oneReservation.id);
      assertNoError(expireError, 'expire one reservation');
      await reserveImage(owner.client, dogId);

      const { data: claimedJobs, error: claimError } = await serviceClient.rpc(
        'claim_dog_storage_jobs',
        { p_limit: 100 },
      );
      assertNoError(claimError, 'claim expired-reservation cleanup');
      const cleanupJob = claimedJobs.find(
        ({ image_id: imageId, operation }) =>
          imageId === oneReservation.id && operation === 'DELETE_ORPHAN_UPLOAD',
      );
      assert.ok(cleanupJob);

      const { error: retryError } = await serviceClient.rpc('fail_dog_storage_job', {
        p_error_code: 'TEST_RETRY',
        p_job_id: cleanupJob.id,
      });
      assertNoError(retryError, 'schedule bounded storage retry');

      const { data: immediateRetryJobs, error: immediateRetryError } =
        await serviceClient.rpc('claim_dog_storage_jobs', { p_limit: 100 });
      assertNoError(immediateRetryError, 'check retry backoff');
      assert.equal(
        immediateRetryJobs.some(({ id }) => id === cleanupJob.id),
        false,
      );
    });

    await suite.test('enforces uploader deletion rights and deterministic primary fallback', async () => {
      const { error: cleanupReservationsError } = await serviceClient
        .from('dog_images')
        .delete()
        .eq('dog_id', dogId)
        .eq('upload_state', 'RESERVED');
      assertNoError(cleanupReservationsError, 'remove capacity-test reservations');

      const first = await reserveImage(owner.client, dogId);
      const second = await reserveImage(coOwner.client, dogId);
      for (const reservation of [first, second]) {
        const { error: uploadError } = await (reservation.id === first.id
          ? owner.client
          : coOwner.client
        ).storage
          .from('dogs')
          .upload(reservation.storage_path, new TextEncoder().encode(reservation.id), {
            contentType: 'image/webp',
          });
        assertNoError(uploadError, 'upload deletion-rights fixture');
        fixture.dogObjectPaths.push(reservation.storage_path);
        const actor = reservation.id === first.id ? owner.client : coOwner.client;
        const { error: finalizeError } = await actor.rpc('api_finalize_dog_image', {
          p_image_id: reservation.id,
        });
        assertNoError(finalizeError, 'finalize deletion-rights fixture');
      }

      const { error: setPrimaryError } = await owner.client.rpc('api_set_primary_dog_image', {
        p_image_id: first.id,
      });
      assertNoError(setPrimaryError, 'set primary deletion fixture');

      const { error: forbiddenDeleteError } = await coOwner.client.rpc('api_delete_dog_image', {
        p_image_id: first.id,
      });
      assert.match(forbiddenDeleteError?.message ?? '', /dog_image_delete_forbidden/u);

      const { error: ownDeleteError } = await coOwner.client.rpc('api_delete_dog_image', {
        p_image_id: second.id,
      });
      assertNoError(ownDeleteError, 'co-owner deletes own image');

      const { error: primaryDeleteError } = await owner.client.rpc('api_delete_dog_image', {
        p_image_id: first.id,
      });
      assertNoError(primaryDeleteError, 'primary deletes any image');

      const { data: dogAfterDelete } = await serviceClient
        .from('dogs')
        .select('primary_image_id')
        .eq('id', dogId)
        .single();
      const { data: fallbackImage } = await serviceClient
        .from('dog_images')
        .select('id')
        .eq('id', dogAfterDelete.primary_image_id)
        .eq('upload_state', 'ACTIVE')
        .is('deleted_at', null)
        .single();
      assert.ok(fallbackImage.id);
    });

    await suite.test('removes uploader identity when an account is erased', async () => {
      const erasedUploader = await createAuthenticatedUser('erased-uploader');
      const { error: addMemberError } = await serviceClient.from('dog_members').insert({
        dog_id: dogId,
        role: 'CO_OWNER',
        user_id: erasedUploader.id,
      });
      assertNoError(addMemberError, 'add uploader membership');
      const reservation = await reserveImage(erasedUploader.client, dogId);
      const { error: uploadError } = await erasedUploader.client.storage
        .from('dogs')
        .upload(reservation.storage_path, new TextEncoder().encode('erased uploader image'), {
          contentType: 'image/webp',
        });
      assertNoError(uploadError, 'upload erased-uploader image');
      fixture.dogObjectPaths.push(reservation.storage_path);
      const { error: finalizeError } = await erasedUploader.client.rpc('api_finalize_dog_image', {
        p_image_id: reservation.id,
      });
      assertNoError(finalizeError, 'finalize erased-uploader image');

      const { error: eraseError } = await serviceClient.auth.admin.deleteUser(erasedUploader.id);
      assertNoError(eraseError, 'erase uploader account');
      fixture.authUserIds = fixture.authUserIds.filter((id) => id !== erasedUploader.id);

      const { data: imageAfterErasure } = await serviceClient
        .from('dog_images')
        .select('uploader_member_id')
        .eq('id', reservation.id)
        .single();
      assert.equal(imageAfterErasure.uploader_member_id, null);
    });
  } finally {
    await cleanupFixture();
  }
});
