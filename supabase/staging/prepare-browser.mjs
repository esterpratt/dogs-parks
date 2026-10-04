import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  STAGING_REF,
  PRIVATE_DIR,
  readPrivate,
  savePrivate,
  stagingKeys,
  stagingClient,
  queryStaging,
  requireSuccess,
} from './runtime.mjs';

// Each browser rehearsal gets fresh synthetic identities, preserving the real
// rolling request limit and the durable fixtures used for manual exploration.
console.log('Preparing three disposable browser accounts in isolated staging.');
if (!process.argv.includes('--apply')) {
  process.exit(0);
}
const admin = stagingClient(stagingKeys().service);
const run = { stagingRef: STAGING_REF, runId: randomUUID(), accounts: {} };
const runs = existsSync(`${PRIVATE_DIR}/browser-runs.json`)
  ? readPrivate('browser-runs.json')
  : [];
runs.push(run);
for (const role of ['primary', 'friend', 'coowner']) {
  const email = `browser-${role}-${run.runId}@example.test`;
  const password = randomBytes(24).toString('base64url');
  const { user } = requireSuccess(
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        staging_fixture: 'browser-journey',
        staging_run: run.runId,
        staging_role: role,
      },
    }),
    'Create disposable browser identity',
  );
  run.accounts[role] = { id: user.id, email, password };
  savePrivate('browser-runs.json', runs);
  requireSuccess(
    await admin
      .from('users')
      .update({ name: `Staging ${role}` })
      .eq('id', user.id),
    'Name disposable profile',
  );
}
const primaryId = run.accounts.primary.id;
queryStaging(`BEGIN; INSERT INTO public.friendships(requester_id,requestee_id,status) VALUES
('${primaryId}','${run.accounts.friend.id}','APPROVED'),
('${primaryId}','${run.accounts.coowner.id}','APPROVED'); COMMIT;`);
savePrivate('browser-run.json', run);
console.log(
  'Disposable browser accounts ready; credentials remain in the protected local manifest.',
);
