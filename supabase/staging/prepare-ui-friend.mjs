import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  PRIVATE_DIR,
  STAGING_REF,
  readPrivate,
  savePrivate,
  stagingKeys,
  stagingClient,
  requireSuccess,
} from './runtime.mjs';

// A durable, synthetic friend makes the picker reviewable from both imported
// staging accounts. Never change existing friendships, dogs, or production data.
const logins = readPrivate('logins.json');
const fixtures = readPrivate('synthetic-fixtures.json');
if (
  logins.stagingRef !== STAGING_REF ||
  fixtures.stagingRef !== STAGING_REF
) {
  throw new Error('Staging identity mismatch');
}
const participantIds = [
  ...new Set([
    ...logins.accounts.map((account) => account.stagingId),
    fixtures.accounts.primary.id,
  ]),
];
console.log(
  JSON.stringify({
    mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
    friendsForAccounts: participantIds.length,
  }),
);
if (!process.argv.includes('--apply')) {
  process.exit(0);
}
const admin = stagingClient(stagingKeys().service);
const manifest = existsSync(`${PRIVATE_DIR}/ui-friend.json`)
  ? readPrivate('ui-friend.json')
  : {
      stagingRef: STAGING_REF,
      email: 'klavhub-ui-friend@example.test',
      password: randomBytes(24).toString('base64url'),
    };
if (manifest.stagingRef !== STAGING_REF) {
  throw new Error('UI friend manifest mismatch');
}
savePrivate('ui-friend.json', manifest);
const { users } = requireSuccess(
  await admin.auth.admin.listUsers({ perPage: 1000 }),
  'Find UI friend',
);
let friend = users.find((user) => user.email === manifest.email);
if (friend && friend.app_metadata.staging_fixture !== 'ownership-ui') {
  throw new Error('Refusing to reuse an unrelated identity');
}
if (!friend) {
  friend = requireSuccess(
    await admin.auth.admin.createUser({
      email: manifest.email,
      password: manifest.password,
      email_confirm: true,
      app_metadata: { staging_fixture: 'ownership-ui' },
    }),
    'Create UI friend',
  ).user;
  requireSuccess(
    await admin
      .from('users')
      .update({ name: 'Noa (staging)' })
      .eq('id', friend.id),
    'Name UI friend',
  );
}
manifest.id = friend.id;
savePrivate('ui-friend.json', manifest);
for (const participantId of participantIds) {
  const pairs = requireSuccess(
    await admin
      .from('friendships')
      .select('id')
      .eq('user_low', [participantId, friend.id].sort()[0])
      .eq('user_high', [participantId, friend.id].sort()[1]),
    'Check existing friendship',
  );
  if (!pairs.length) {
    requireSuccess(
      await admin.from('friendships').insert({
        requester_id: participantId,
        requestee_id: friend.id,
        status: 'APPROVED',
      }),
      'Add staging friendship',
    );
  }
}
console.log(
  'Noa (staging) is available to both staging logins and the synthetic primary. Credentials stay in .private/staging/ui-friend.json.',
);
