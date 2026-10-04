import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  PRIVATE_DIR,
  readPrivate,
  stagingKeys,
  stagingClient,
  requireSuccess,
} from './runtime.mjs';

// Only disposable dogs created by the browser journey are eligible. Deletion
// uses normal participant RPCs and the worker; no personal/durable fixture resets.
const fixtures = readPrivate('synthetic-fixtures.json');
const { anon, service } = stagingKeys();
const admin = stagingClient(service);
const browserRuns = existsSync(`${PRIVATE_DIR}/browser-runs.json`)
  ? readPrivate('browser-runs.json')
  : [];
const accounts = ['primary', 'friend', 'coowner']
  .map((role) => fixtures.accounts[role])
  .concat(browserRuns.flatMap((run) => Object.values(run.accounts)));
const accountIds = new Set(accounts.map((account) => account.id));
const candidates = requireSuccess(
  await admin
    .from('dogs')
    .select('id,owner,lifecycle_state')
    .like('name', 'Browser journey %')
    .is('deleted_at', null),
  'Disposable browser inventory',
);
const dogs = [];
for (const dog of candidates) {
  const members = requireSuccess(
    await admin
      .from('dog_members')
      .select('id,user_id,role')
      .eq('dog_id', dog.id)
      .is('left_at', null),
    'Disposable membership inventory',
  );
  if (
    !accountIds.has(dog.owner) ||
    !members.length ||
    members.some((member) => !accountIds.has(member.user_id))
  ) {
    throw new Error(
      'Browser cleanup found an unexpected owner; review manually',
    );
  }
  dogs.push({ ...dog, members });
}
console.log(
  JSON.stringify({
    mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
    disposableDogs: dogs.map((dog) => dog.id),
  }),
);
if (!process.argv.includes('--apply')) {
  process.exit(0);
}
const clients = new Map();
for (const account of accounts) {
  const client = stagingClient(anon);
  const login = requireSuccess(
    await client.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    }),
    'Synthetic cleanup login',
  );
  if (
    login.user.id !== account.id ||
    !['synthetic', 'browser-journey'].includes(
      login.user.app_metadata.staging_fixture,
    )
  ) {
    throw new Error(
      'Browser cleanup login is not the expected synthetic identity',
    );
  }
  clients.set(account.id, client);
}
const compatibility = { p_client_platform: 'WEB', p_client_build: 1 };
for (const dog of dogs) {
  const primary = clients.get(dog.owner);
  if (dog.members.length === 1) {
    requireSuccess(
      await primary.rpc('delete_dog', { dog_id: dog.id }),
      'Solo disposable deletion',
    );
    continue;
  }
  const current = requireSuccess(
    await primary.rpc('api_get_current_dog_deletion_proposal', {
      ...compatibility,
      p_dog_id: dog.id,
    }),
    'Read disposable proposal',
  );
  const proposal = current?.id
    ? { proposal_id: current.id }
    : requireSuccess(
        await primary.rpc('api_propose_dog_deletion', {
          ...compatibility,
          p_dog_id: dog.id,
          p_idempotency_key: randomUUID(),
        }),
        'Propose disposable cleanup',
      );
  if (!proposal.proposal_id) {
    throw new Error('Disposable cleanup did not obtain a proposal');
  }
  for (const member of dog.members.filter(
    (member) => member.role !== 'PRIMARY_OWNER',
  )) {
    const result = requireSuccess(
      await clients.get(member.user_id).rpc('api_respond_dog_deletion', {
        ...compatibility,
        p_proposal_id: proposal.proposal_id,
        p_approve: true,
      }),
      'Approve disposable cleanup',
    );
    if (
      !['APPROVED', 'NO_CHANGE', 'DELETION_PREPARED'].includes(result.outcome)
    ) {
      throw new Error(
        `Unexpected disposable cleanup outcome: ${result.outcome}`,
      );
    }
  }
}
await Promise.all([...clients.values()].map((client) => client.auth.signOut()));
console.log(
  'Disposable browser cleanup prepared; run drain-storage.mjs to finish queued jobs.',
);
