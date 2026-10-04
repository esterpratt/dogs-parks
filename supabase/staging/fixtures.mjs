import { randomBytes, randomUUID, createHash } from "node:crypto";
import { existsSync } from "node:fs";
import {
  PRIVATE_DIR,
  STAGING_REF,
  readPrivate,
  savePrivate,
  queryStaging,
  stagingKeys,
  stagingClient,
  requireSuccess,
} from "./runtime.mjs";

// Durable synthetic fixtures are separate from the selected personal import.
// --apply only creates missing marked fixtures; it never resets existing ones.
const roles = [
  "primary",
  "coowner",
  "private",
  "friend",
  "outsider",
  "cleanup",
];
console.log(
  JSON.stringify({
    mode: process.argv.includes("--apply") ? "apply" : "dry-run",
    syntheticAccounts: roles,
    dogs: [
      "Solo preview",
      "Shared preview",
      "Legacy attribution preview",
      "Cleanup solo preview",
      "Cleanup shared preview",
    ],
  }),
);
if (!process.argv.includes("--apply")) {
  process.exit(0);
}
const { service } = stagingKeys();
const admin = stagingClient(service);
const fixture = existsSync(`${PRIVATE_DIR}/synthetic-fixtures.json`)
  ? readPrivate("synthetic-fixtures.json")
  : { stagingRef: STAGING_REF, accounts: {}, dogs: {} };
if (fixture.stagingRef !== STAGING_REF) {
  throw new Error("Synthetic manifest target mismatch");
}
for (const role of roles) {
  let account = fixture.accounts[role];
  if (account?.id) {
    const existing = await admin.auth.admin.getUserById(account.id);
    if (
      !existing.error &&
      existing.data.user.app_metadata.staging_fixture === "synthetic"
    ) {
      continue;
    }
    // An account intentionally deleted in a destructive rehearsal receives a
    // fresh Auth identity. The imported accounts are never in this manifest.
    if (
      !existing.error ||
      (existing.error.status !== 404 &&
        existing.error.code !== "user_not_found")
    ) {
      throw new Error("Unexpected synthetic account identity");
    }
  }
  account ??= {
    email: `klavhub-staging-${role}@example.test`,
    password: randomBytes(24).toString("base64url"),
  };
  fixture.accounts[role] = account;
  savePrivate("synthetic-fixtures.json", fixture);
  const { users } = requireSuccess(
    await admin.auth.admin.listUsers({ perPage: 1000 }),
    "Synthetic retry identity",
  );
  const existing = users.find((user) => user.email === account.email);
  if (existing && existing.app_metadata.staging_fixture !== "synthetic") {
    throw new Error("Refusing to reuse an unrelated account");
  }
  const user =
    existing ??
    requireSuccess(
      await admin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: `Staging ${role}` },
        app_metadata: { staging_fixture: "synthetic" },
      }),
      "Create synthetic account",
    ).user;
  account.id = user.id;
  savePrivate("synthetic-fixtures.json", fixture);
}
const account = (role) => fixture.accounts[role].id;
const definitions = [
  { key: "solo", name: "Solo preview", owner: "primary", coowners: [] },
  {
    key: "shared",
    name: "Shared preview",
    owner: "primary",
    coowners: ["coowner", "private"],
  },
  {
    key: "legacy",
    name: "Legacy attribution preview",
    owner: "primary",
    coowners: [],
  },
  {
    key: "cleanupSolo",
    name: "Cleanup solo preview",
    owner: "cleanup",
    coowners: [],
  },
  {
    key: "cleanupShared",
    name: "Cleanup shared preview",
    owner: "cleanup",
    coowners: ["coowner"],
  },
];
const statements = [];
for (const definition of definitions) {
  let id = fixture.dogs[definition.key];
  if (id) {
    const existing = queryStaging(
      `SELECT lifecycle_state FROM public.dogs WHERE id='${id}';`,
    );
    if (existing.length) {
      // Preserve evolved fixtures, including soft-deleted dogs, rather than
      // overwriting ownership changes made during manual exploration.
      continue;
    }
  }
  id = randomUUID();
  fixture.dogs[definition.key] = id;
  savePrivate("synthetic-fixtures.json", fixture);
  statements.push(
    `INSERT INTO public.dogs(id,name,birthday,owner) VALUES ('${id}','${definition.name}','2020-01-01','${account(definition.owner)}');`,
  );
  for (const coowner of definition.coowners) {
    statements.push(
      `INSERT INTO public.dog_members(dog_id,user_id,role) VALUES ('${id}','${account(coowner)}','CO_OWNER');`,
    );
  }
}
statements.push(
  `UPDATE public.users SET private=true WHERE id='${account("private")}';`,
);
for (const role of ["coowner", "private", "friend"]) {
  statements.push(
    `INSERT INTO public.friendships(requester_id,requestee_id,status) SELECT '${account("primary")}','${account(role)}','APPROVED' WHERE NOT EXISTS (SELECT 1 FROM public.friendships WHERE user_low=least('${account("primary")}'::uuid,'${account(role)}'::uuid) AND user_high=greatest('${account("primary")}'::uuid,'${account(role)}'::uuid));`,
  );
  // Repair only the initial fixture's invalid status spelling. Preserve valid
  // friendship changes made later while exploring these synthetic accounts.
  statements.push(
    `UPDATE public.friendships SET status='APPROVED' WHERE requester_id='${account("primary")}' AND requestee_id='${account(role)}' AND status='ACCEPTED';`,
  );
}
if (statements.length) {
  queryStaging(
    `BEGIN; SET search_path=public,extensions; ${statements.join("\n")} COMMIT;`,
  );
}
// A tiny real PNG exercises unknown-uploader permissions without borrowing any
// personal photo. Its immutable dog path is distinct from the imported files.
const bytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8r8AAAAASUVORK5CYII=",
  "base64",
);
fixture.legacyImageId ??= randomUUID();
const imagePath = `${fixture.dogs.legacy}/${fixture.legacyImageId}.png`;
savePrivate("synthetic-fixtures.json", fixture);
const existingImage = requireSuccess(
  await admin.from("dog_images").select("id").eq("id", fixture.legacyImageId),
  "Synthetic image retry",
);
if (!existingImage.length) {
  const existingFile = await admin.storage.from("dogs").download(imagePath);
  if (existingFile.error) {
    requireSuccess(
      await admin.storage
        .from("dogs")
        .upload(imagePath, bytes, { contentType: "image/png", upsert: false }),
      "Synthetic PNG upload",
    );
  } else {
    const downloaded = Buffer.from(await existingFile.data.arrayBuffer());
    if (
      createHash("sha256").update(downloaded).digest("hex") !==
      createHash("sha256").update(bytes).digest("hex")
    ) {
      throw new Error("Synthetic path already contains different bytes");
    }
  }
  queryStaging(
    `BEGIN; INSERT INTO public.dog_images(id,dog_id,bucket_id,storage_path,uploader_member_id) VALUES ('${fixture.legacyImageId}','${fixture.dogs.legacy}','dogs','${imagePath}',NULL); UPDATE public.dogs SET primary_image_id='${fixture.legacyImageId}' WHERE id='${fixture.dogs.legacy}'; COMMIT;`,
  );
}
console.log(
  "Synthetic fixtures created; private credentials and route IDs are in .private/staging/synthetic-fixtures.json.",
);
