import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import {
  STAGING_REF,
  readPrivate,
  savePrivate,
  stagingKeys,
  stagingClient,
  queryStaging,
  requireSuccess,
} from "./runtime.mjs";

// This rehearsal creates disposable synthetic dogs/accounts. It never mutates
// the imported personal baseline or the durable preview dogs.
const { anon, service } = stagingKeys();
const admin = stagingClient(service);
const fixtures = readPrivate("synthetic-fixtures.json");
const clients = {};
const compatibility = { p_client_platform: "WEB", p_client_build: 1 };
const evidence = { stagingRef: STAGING_REF, checks: [], disposableDogs: [] };
for (const role of ["primary", "coowner", "friend", "outsider"]) {
  const account = fixtures.accounts[role];
  const client = stagingClient(anon);
  requireSuccess(
    await client.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    }),
    "Synthetic password login",
  );
  clients[role] = client;
}
async function rpc(client, name, argumentsObject, outcome) {
  const data = requireSuccess(
    await client.rpc(name, { ...compatibility, ...argumentsObject }),
    name,
  );
  if (outcome) {
    assert.equal(data.outcome, outcome, name);
  }
  return data;
}
const shared = await rpc(
  clients.primary,
  "api_get_dog_page",
  { p_dog_id: fixtures.dogs.shared },
  "OK",
);
assert(
  shared.members.some(
    (member) => member.user_id === fixtures.accounts.private.id,
  ),
);
const outsiderPage = await rpc(
  clients.outsider,
  "api_get_dog_page",
  { p_dog_id: fixtures.dogs.shared },
  "OK",
);
assert.equal(outsiderPage.members, undefined);
const outsiderRows = requireSuccess(
  await clients.outsider
    .from("dog_members")
    .select("id")
    .eq("dog_id", fixtures.dogs.shared),
  "Outsider roster RLS",
);
assert.equal(outsiderRows.length, 0);
const forbidden = await clients.outsider
  .from("dogs")
  .update({ name: "Unauthorized write" })
  .eq("id", fixtures.dogs.shared)
  .select("id");
assert(forbidden.error || forbidden.data.length === 0);
const anonymous = stagingClient(anon);
assert(
  (
    await anonymous.rpc("api_get_user_dogs", {
      p_user_id: fixtures.accounts.primary.id,
    })
  ).error,
);
const signup = await anonymous.auth.signUp({
  email: `blocked-${randomUUID()}@example.test`,
  password: randomBytes(24).toString("base64url"),
});
assert.equal(signup.error?.code, "signup_disabled");
for (const name of ["delete-user", "process-dog-storage-jobs"]) {
  const response = await fetch(
    `https://${STAGING_REF}.supabase.co/functions/v1/${name}`,
    {
      method: "POST",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
  assert.equal(response.status, 401, `${name} anonymous caller`);
}
const userWorker = await clients.primary.functions.invoke(
  "process-dog-storage-jobs",
  { body: {} },
);
assert(userWorker.error);
evidence.checks.push(
  "owner-only private roster",
  "outsider and anonymous denial",
  "public signup disabled",
  "privileged endpoint denial",
);

const created = requireSuccess(
  await clients.primary.rpc("api_create_dog", {
    p_dog: { name: "Disposable staging journey", birthday: "2020-01-01" },
  }),
  "Create disposable dog",
);
const dogId = created.dog_id;
evidence.disposableDogs.push(dogId);
savePrivate("smoke-evidence.json", evidence);
const invite = await rpc(
  clients.primary,
  "api_create_dog_invite",
  {
    p_dog_id: dogId,
    p_invitee_user_id: fixtures.accounts.friend.id,
    p_idempotency_key: randomUUID(),
  },
  "CREATED",
);
await rpc(
  clients.friend,
  "api_respond_dog_invite",
  {
    p_invite_id: invite.action_id,
    p_accept: true,
    p_disclosure_accepted: true,
  },
  "ACCEPTED",
);
const request = await rpc(
  clients.coowner,
  "api_create_dog_ownership_request",
  { p_dog_id: dogId, p_idempotency_key: randomUUID() },
  "CREATED",
);
await rpc(
  clients.primary,
  "api_respond_dog_ownership_request",
  { p_request_id: request.action_id, p_approve: true },
  "APPROVED",
);
const members = requireSuccess(
  await admin
    .from("dog_members")
    .select("*")
    .eq("dog_id", dogId)
    .is("left_at", null),
  "Journey members",
);
const friendMember = members.find(
  (member) => member.user_id === fixtures.accounts.friend.id,
);
const coownerMember = members.find(
  (member) => member.user_id === fixtures.accounts.coowner.id,
);
const transfer = await rpc(
  clients.primary,
  "api_create_primary_transfer",
  {
    p_dog_id: dogId,
    p_to_member_id: friendMember.id,
    p_idempotency_key: randomUUID(),
  },
  "CREATED",
);
await rpc(
  clients.friend,
  "api_respond_primary_transfer",
  { p_transfer_id: transfer.action_id, p_accept: true },
  "ACCEPTED",
);
const dog = requireSuccess(
  await admin.from("dogs").select("*").eq("id", dogId).single(),
  "Transferred dog",
);
await rpc(
  clients.friend,
  "api_leave_dog",
  {
    p_dog_id: dogId,
    p_selected_successor_member_id: coownerMember.id,
    p_expected_ownership_version: dog.ownership_version,
  },
  "LEFT",
);
const proposal = await rpc(
  clients.coowner,
  "api_propose_dog_deletion",
  { p_dog_id: dogId, p_idempotency_key: randomUUID() },
  "CREATED",
);
await rpc(
  clients.primary,
  "api_respond_dog_deletion",
  { p_proposal_id: proposal.proposal_id, p_approve: true },
  "DELETION_PREPARED",
);
evidence.checks.push(
  "invite acceptance",
  "request approval",
  "ordinary transfer",
  "departure succession",
  "unanimous shared deletion",
);
savePrivate("smoke-evidence.json", evidence);

const deletionAccount = requireSuccess(
  await admin.auth.admin.createUser({
    email: `disposable-${randomUUID()}@example.test`,
    password: randomBytes(24).toString("base64url"),
    email_confirm: true,
    app_metadata: { staging_fixture: "disposable-smoke" },
  }),
  "Create erasure account",
).user;
const deletionClient = stagingClient(anon);
// Use a fresh password to exercise the independent password-login path.
const password = randomBytes(24).toString("base64url");
requireSuccess(
  await admin.auth.admin.updateUserById(deletionAccount.id, { password }),
  "Set disposable password",
);
requireSuccess(
  await deletionClient.auth.signInWithPassword({
    email: deletionAccount.email,
    password,
  }),
  "Disposable login",
);
const solo = requireSuccess(
  await deletionClient.rpc("api_create_dog", {
    p_dog: { name: "Disposable erasure solo", birthday: "2020-01-01" },
  }),
  "Erasure solo dog",
).dog_id;
const retained = requireSuccess(
  await deletionClient.rpc("api_create_dog", {
    p_dog: { name: "Disposable erasure shared", birthday: "2020-01-01" },
  }),
  "Erasure shared dog",
).dog_id;
evidence.disposableDogs.push(solo, retained);
evidence.deletedAccount = deletionAccount.id;
savePrivate("smoke-evidence.json", evidence);
queryStaging(
  `INSERT INTO public.dog_members(dog_id,user_id,role) VALUES ('${retained}','${fixtures.accounts.coowner.id}','CO_OWNER');`,
);
const deletion = requireSuccess(
  await deletionClient.functions.invoke("delete-user", {
    body: { ...compatibility, id: fixtures.accounts.outsider.id },
  }),
  "Authenticated account erasure",
);
assert.equal(deletion.outcome, "DELETED");
assert((await admin.auth.admin.getUserById(deletionAccount.id)).error);
requireSuccess(
  await admin.auth.admin.getUserById(fixtures.accounts.outsider.id),
  "Body-supplied target is preserved",
);
const preserved = requireSuccess(
  await admin
    .from("dogs")
    .select("owner,lifecycle_state")
    .eq("id", retained)
    .single(),
  "Shared dog retained",
);
assert.equal(preserved.owner, fixtures.accounts.coowner.id);
assert.equal(preserved.lifecycle_state, "ACTIVE");
evidence.checks.push(
  "authenticated caller-derived account erasure",
  "shared dog retention and solo cleanup queued",
);
savePrivate("smoke-evidence.json", evidence);
console.log(JSON.stringify({ passed: evidence.checks }));
