import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  STAGING_REF,
  readPrivate,
  savePrivate,
  stagingKeys,
  stagingClient,
  queryStaging,
  requireSuccess,
} from './runtime.mjs';

// This fixture preparation is opt-in and creates only disposable browser dogs.
// The expiry operation validates the exact run, dog and actor identities first.
if (!process.argv.includes('--apply')) {
  console.log(
    'Dry-run: create a disposable shared dog, unknown-uploader PNG and pending invitation.',
  );
  process.exit(0);
}
if (!process.argv.includes('--expire-invite')) {
  execFileSync(
    process.execPath,
    ['supabase/staging/prepare-browser.mjs', '--apply'],
    { stdio: 'pipe' },
  );
}
const { anon, service } = stagingKeys();
const admin = stagingClient(service);
const run = readPrivate(
  process.argv.includes('--expire-invite')
    ? 'browser-edges.json'
    : 'browser-run.json',
);
if (run.stagingRef !== STAGING_REF) {
  throw new Error('Browser fixture target mismatch');
}
for (const account of Object.values(run.accounts)) {
  const { user } = requireSuccess(
    await admin.auth.admin.getUserById(account.id),
    'Verify disposable actor',
  );
  if (
    user.app_metadata.staging_fixture !== 'browser-journey' ||
    user.app_metadata.staging_run !== run.runId
  ) {
    throw new Error('Refusing to alter an unrelated actor');
  }
}
if (process.argv.includes('--expire-invite')) {
  const dog = requireSuccess(
    await admin.from('dogs').select('owner,name').eq('id', run.dogId).single(),
    'Verify disposable dog',
  );
  const invitation = requireSuccess(
    await admin
      .from('dog_invites')
      .select('dog_id,invitee_user_id,status')
      .eq('id', run.inviteId)
      .single(),
    'Verify disposable invitation',
  );
  if (
    dog.owner !== run.accounts.primary.id ||
    !dog.name.startsWith('Browser journey ') ||
    invitation.dog_id !== run.dogId ||
    invitation.invitee_user_id !== run.accounts.friend.id ||
    invitation.status !== 'PENDING'
  ) {
    throw new Error('Refusing to expire an unrelated or completed invitation');
  }
  // Preserve the enforced 30-day interval while placing this synthetic action
  // in the past. The normal server RPC must perform lazy expiry itself.
  queryStaging(
    `BEGIN; UPDATE public.dog_invites SET created_at=now()-interval '31 days', expires_at=now()-interval '1 day' WHERE id='${run.inviteId}'; COMMIT;`,
  );
  console.log(
    'The exact disposable pending invitation is now past its expiry.',
  );
  process.exit(0);
}
const clients = {};
for (const role of ['primary', 'coowner', 'friend']) {
  const client = stagingClient(anon);
  requireSuccess(
    await client.auth.signInWithPassword(run.accounts[role]),
    'Disposable login',
  );
  clients[role] = client;
}
const compatibility = { p_client_platform: 'WEB', p_client_build: 1 };
const created = requireSuccess(
  await clients.primary.rpc('api_create_dog', {
    p_dog: {
      name: `Browser journey edges ${run.runId}`,
      birthday: '2020-01-01',
    },
  }),
  'Create edge-case dog',
);
run.dogId = created.dog_id;
run.imageId = randomUUID();
savePrivate('browser-edges.json', run);
for (const role of ['coowner', 'friend']) {
  const invitation = requireSuccess(
    await clients.primary.rpc('api_create_dog_invite', {
      ...compatibility,
      p_dog_id: run.dogId,
      p_invitee_user_id: run.accounts[role].id,
      p_idempotency_key: randomUUID(),
    }),
    'Create edge-case invitation',
  );
  if (role === 'coowner') {
    requireSuccess(
      await clients.coowner.rpc('api_respond_dog_invite', {
        ...compatibility,
        p_invite_id: invitation.action_id,
        p_accept: true,
        p_disclosure_accepted: true,
      }),
      'Join disposable dog',
    );
  } else {
    run.inviteId = invitation.action_id;
    savePrivate('browser-edges.json', run);
  }
}
const path = `${run.dogId}/${run.imageId}.png`;
const bytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8r8AAAAASUVORK5CYII=',
  'base64',
);
requireSuccess(
  await admin.storage
    .from('dogs')
    .upload(path, bytes, { contentType: 'image/png', upsert: false }),
  'Upload unknown-uploader fixture',
);
// Match legacy attribution without assigning a real or synthetic uploader.
queryStaging(
  `BEGIN; INSERT INTO public.dog_images(id,dog_id,bucket_id,storage_path,uploader_member_id) VALUES ('${run.imageId}','${run.dogId}','dogs','${path}',NULL); UPDATE public.dogs SET primary_image_id='${run.imageId}' WHERE id='${run.dogId}'; COMMIT;`,
);
await Promise.all(
  Object.values(clients).map((client) => client.auth.signOut()),
);
console.log(
  'Disposable edge fixtures ready; credentials remain in the protected manifest.',
);
