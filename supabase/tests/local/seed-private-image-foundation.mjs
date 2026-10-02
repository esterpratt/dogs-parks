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

const signupClient = createClient(apiUrl, anonKey, { auth: authOptions });
const { data: signupData, error: signupError } = await signupClient.auth.signUp({
  email: 'private-image-legacy-owner@example.test',
  password: 'Private-image-legacy-password-2026!',
});
assertNoError(signupError, 'create legacy image owner');
assert.ok(signupData.user?.id, 'legacy image owner should have an id');

const ownerId = signupData.user.id;
const { error: profileError } = await serviceClient.from('users').insert({
  id: ownerId,
  name: 'Private Image Legacy Owner',
  private: false,
});
assertNoError(profileError, 'create legacy image owner profile');

const { data: dog, error: dogError } = await serviceClient
  .from('dogs')
  .insert({
    birthday: '2020-01-01T00:00:00.000Z',
    name: 'Private image legacy dog',
    owner: ownerId,
  })
  .select('id')
  .single();
assertNoError(dogError, 'create legacy image dog');

const legacyPath = `${ownerId}/dogs/${dog.id}/primary/primary-legacy.jpg`;
const { error: uploadError } = await serviceClient.storage
  .from('users')
  .upload(legacyPath, new TextEncoder().encode('legacy dog image bytes'), {
    contentType: 'image/jpeg',
  });
assertNoError(uploadError, 'upload legacy dog image object');

const { error: imageError } = await serviceClient.from('dog_images').insert({
  bucket_id: 'users',
  dog_id: dog.id,
  is_primary: true,
  storage_path: legacyPath,
});
assertNoError(imageError, 'create legacy dog image metadata');
