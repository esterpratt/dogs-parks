import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const apiUrl = process.env.SUPABASE_LOCAL_URL;
const anonKey = process.env.SUPABASE_LOCAL_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY;

assert.ok(apiUrl);
assert.ok(anonKey);
assert.ok(serviceRoleKey);
assert.match(apiUrl, /^http:\/\/(127\.0\.0\.1|localhost):/u);

const authOptions = {
  autoRefreshToken: false,
  detectSessionInUrl: false,
  persistSession: false,
};
const createLocalClient = (key, token) => createClient(apiUrl, key, {
  auth: authOptions,
  ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
});
const serviceClient = createLocalClient(serviceRoleKey);
const anonymousClient = createLocalClient(anonKey);

const assertNoError = (error, operation) => {
  assert.equal(error, null, `${operation}: ${error?.message ?? 'unknown error'}`);
};

test('legacy dog images reconcile once at cutover', async (suite) => {
  const signupClient = createLocalClient(anonKey);
  const { data: signup, error: signupError } = await signupClient.auth.signUp({
    email: `legacy-cutover-${crypto.randomUUID()}@example.test`,
    password: 'Legacy-cutover-password-2026!',
  });
  assertNoError(signupError, 'create owner');
  const ownerId = signup.user.id;
  const ownerClient = createLocalClient(anonKey, signup.session.access_token);

  const { error: profileError } = await serviceClient.from('users').insert({
    id: ownerId,
    name: 'Legacy cutover owner',
    private: false,
  });
  assertNoError(profileError, 'create profile');

  const { data: dog, error: dogError } = await serviceClient.from('dogs')
    .insert({ name: 'Legacy cutover dog', birthday: '2020-01-01', owner: ownerId })
    .select('id').single();
  assertNoError(dogError, 'create dog');

  const primaryPath = `${ownerId}/dogs/${dog.id}/primary/primary-original.jpg`;
  const otherPath = `${ownerId}/dogs/${dog.id}/other/gallery.jpg`;
  const movedPath = `${ownerId}/dogs/${dog.id}/other/original.jpg`;
  const bytes = new Blob(['legacy dog photo'], { type: 'image/jpeg' });
  let coOwnerId;
  const copiedPaths = [];

  try {
    await suite.test('keeps old Storage uploads visible and creates copy jobs', async () => {
      for (const path of [primaryPath, otherPath]) {
        const { error } = await ownerClient.storage.from('users').upload(path, bytes);
        assertNoError(error, `legacy upload ${path}`);
      }

      const { error: anonymousError } = await anonymousClient.rpc(
        'reconcile_legacy_dog_images_before_cutover',
      );
      assert.match(anonymousError?.message ?? '', /permission denied/u);

      const { error: unpausedError } = await serviceClient.rpc(
        'reconcile_legacy_dog_images_before_cutover',
      );
      assert.match(unpausedError?.message ?? '', /legacy_dog_photo_writes_must_be_paused/u);

      const { error: pauseError } = await serviceClient.rpc(
        'set_legacy_dog_photo_writes_enabled', { p_enabled: false },
      );
      assertNoError(pauseError, 'pause old photo writes');
      const { error: pausedUploadError } = await ownerClient.storage.from('users')
        .upload(`${ownerId}/dogs/${dog.id}/other/paused.jpg`, bytes);
      assert.match(pausedUploadError?.message ?? '', /legacy_dog_photo_writes_paused/u);

      const { data, error } = await serviceClient.rpc(
        'reconcile_legacy_dog_images_before_cutover',
      );
      assertNoError(error, 'reconcile initial photos');
      assert.equal(data.added, 2);
      assert.equal(data.primary_changed, 1);

      const { data: images, error: imagesError } = await serviceClient
        .from('dog_images').select('id,storage_path,bucket_id').eq('dog_id', dog.id);
      assertNoError(imagesError, 'read reconciled images');
      assert.equal(images.length, 2);
      assert.ok(images.every((image) => image.bucket_id === 'users'));
      const { data: refreshedDog } = await serviceClient.from('dogs')
        .select('primary_image_id').eq('id', dog.id).single();
      assert.equal(refreshedDog.primary_image_id,
        images.find((image) => image.storage_path === primaryPath).id);
    });

    await suite.test('copies the initial photo metadata while retaining legacy files', async () => {
      const { data: jobs, error: claimError } = await serviceClient.rpc(
        'claim_dog_storage_jobs', { p_limit: 100 },
      );
      assertNoError(claimError, 'claim legacy copy jobs');
      const ownJobs = jobs.filter((job) => job.dog_id === dog.id);
      assert.equal(ownJobs.length, 2);
      for (const job of jobs) {
        if (job.dog_id !== dog.id) {
          const { error } = await serviceClient.rpc('fail_dog_storage_job', {
            p_job_id: job.id, p_error_code: 'test_deferred',
          });
          assertNoError(error, 'release unrelated job');
          continue;
        }
        const { data: source, error: downloadError } = await serviceClient.storage
          .from('users').download(job.source_path);
        assertNoError(downloadError, 'download legacy photo');
        const { error: uploadError } = await serviceClient.storage.from('dogs')
          .upload(job.destination_path, source);
        assertNoError(uploadError, 'copy legacy photo');
        copiedPaths.push(job.destination_path);
        const { error: completeError } = await serviceClient.rpc(
          'complete_dog_storage_job', { p_job_id: job.id },
        );
        assertNoError(completeError, 'complete copy job');
      }
      const { data: images } = await serviceClient.from('dog_images')
        .select('bucket_id').eq('dog_id', dog.id);
      assert.ok(images.every((image) => image.bucket_id === 'dogs'));
    });

    await suite.test('retires moved and deleted legacy objects, then is idempotent', async () => {
      const { error: resumeError } = await serviceClient.rpc(
        'set_legacy_dog_photo_writes_enabled', { p_enabled: true },
      );
      assertNoError(resumeError, 'resume old photo writes for overlap');
      const { error: moveError } = await ownerClient.storage.from('users')
        .move(primaryPath, movedPath);
      assertNoError(moveError, 'legacy move to gallery');
      const { error: removeError } = await ownerClient.storage.from('users')
        .remove([otherPath]);
      assertNoError(removeError, 'legacy delete gallery photo');

      const { error: pauseError } = await serviceClient.rpc(
        'set_legacy_dog_photo_writes_enabled', { p_enabled: false },
      );
      assertNoError(pauseError, 'pause old photo writes for final cutover');

      const { data, error } = await serviceClient.rpc(
        'reconcile_legacy_dog_images_before_cutover',
      );
      assertNoError(error, 'reconcile legacy changes');
      assert.equal(data.added, 1);
      assert.equal(data.retired, 2);

      const { data: images } = await serviceClient.from('dog_images')
        .select('id,storage_path,bucket_id,upload_state').eq('dog_id', dog.id);
      assert.equal(images.filter((image) => image.upload_state === 'ACTIVE').length, 1);
      assert.equal(images.find((image) => image.upload_state === 'ACTIVE').storage_path,
        movedPath);
      assert.equal(images.filter((image) => image.upload_state === 'DELETING'
        && image.bucket_id === 'dogs').length, 2);

      const { data: repeated, error: repeatError } = await serviceClient.rpc(
        'reconcile_legacy_dog_images_before_cutover',
      );
      assertNoError(repeatError, 'repeat reconciliation');
      assert.deepEqual(repeated, { added: 0, retired: 0, primary_changed: 0 });
    });

    await suite.test('denies old direct photo writes after the dog becomes shared', async () => {
      const { error: resumeError } = await serviceClient.rpc(
        'set_legacy_dog_photo_writes_enabled', { p_enabled: true },
      );
      assertNoError(resumeError, 'resume old writes for shared-dog guard test');
      const { data: coOwnerSignup, error: signupError } = await signupClient.auth.signUp({
        email: `legacy-cutover-coowner-${crypto.randomUUID()}@example.test`,
        password: 'Legacy-cutover-password-2026!',
      });
      assertNoError(signupError, 'create co-owner');
      coOwnerId = coOwnerSignup.user.id;
      const { error: coOwnerProfileError } = await serviceClient.from('users').insert({
        id: coOwnerId, name: 'Legacy cutover co-owner', private: false,
      });
      assertNoError(coOwnerProfileError, 'create co-owner profile');
      const { error: memberError } = await serviceClient.from('dog_members').insert({
        dog_id: dog.id, role: 'CO_OWNER', user_id: coOwnerId,
      });
      assertNoError(memberError, 'share dog');

      const { error: uploadError } = await ownerClient.storage.from('users')
        .upload(`${ownerId}/dogs/${dog.id}/other/unsafe.jpg`, bytes);
      assert.match(uploadError?.message ?? '', /legacy_dog_photo_write_forbidden/u);
      const { error: deleteError } = await ownerClient.storage.from('users')
        .remove([movedPath]);
      assert.match(deleteError?.message ?? '', /legacy_dog_photo_write_forbidden/u);
    });
  } finally {
    await serviceClient.storage.from('users').remove([primaryPath, otherPath, movedPath]);
    if (copiedPaths.length > 0) {
      await serviceClient.storage.from('dogs').remove(copiedPaths);
    }
    await serviceClient.from('dogs').delete().eq('id', dog.id);
    await serviceClient.auth.admin.deleteUser(ownerId);
    if (coOwnerId) {
      await serviceClient.auth.admin.deleteUser(coOwnerId);
    }
  }
});
