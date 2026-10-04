import { createHash } from "node:crypto";
import {
  readPrivate,
  savePrivate,
  queryStaging,
  stagingKeys,
  stagingClient,
  requireSuccess,
} from "./runtime.mjs";

// Compare only the imported fixture IDs, allowing documented feature changes.
// This verification never resets staging or contacts production.
const fixture = readPrivate("mapped-fixture.json");
for (const friendship of fixture.friendships) {
  [friendship.user_low, friendship.user_high] = [
    friendship.requester_id,
    friendship.requestee_id,
  ].sort();
}
const evidence = readPrivate("import-evidence.json");
const tableNames = [
  "users",
  "parks",
  "park_translations",
  "park_condition_rules",
  "dogs",
  "dog_members",
  "dog_images",
  "notifications_preferences",
  "favorites",
  "friendships",
];
const expressions = tableNames.map((table) => {
  const rows = fixture[table];
  if (table === "park_condition_rules") {
    return `'${table}',(SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public.park_condition_rules t)`;
  }
  const ids = rows.map((row) => `'${row.id}'::uuid`).join(",");
  return `'${table}',(SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM public."${table}" t WHERE ${ids ? `id IN (${ids})` : "false"})`;
});
const actual = queryStaging(
  `SELECT jsonb_build_object(${expressions.join(",")}) AS fixture;`,
)[0].fixture;
const upgraded = actual.dogs.some((dog) =>
  Object.hasOwn(dog, "ownership_version"),
);
let checkedRecords = 0;
for (const table of tableNames) {
  if (actual[table].length !== fixture[table].length) {
    throw new Error(`Imported record count differs: ${table}`);
  }
  for (const expected of fixture[table]) {
    const record = actual[table].find((candidate) =>
      table === "park_condition_rules"
        ? candidate.condition === expected.condition
        : candidate.id === expected.id,
    );
    for (const [field, value] of Object.entries(expected)) {
      if (upgraded && table === "dog_members" && field === "created_at") {
        if (record.joined_at !== value) {
          throw new Error("Membership tenure timestamp differs after rename");
        }
        continue;
      }
      if (
        upgraded &&
        table === "dog_images" &&
        ["is_primary", "bucket_id", "storage_path"].includes(field)
      ) {
        continue;
      }
      if (JSON.stringify(record[field]) !== JSON.stringify(value)) {
        throw new Error(
          `Imported ${table}.${field} differs; inspect private fixture evidence`,
        );
      }
    }
    checkedRecords += 1;
  }
}
const { anon, service } = stagingKeys();
const admin = stagingClient(service);
const logins = readPrivate("logins.json");
for (const account of logins.accounts) {
  const client = stagingClient(anon);
  const login = requireSuccess(
    await client.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    }),
    "Confirmed password login",
  );
  if (login.user.id !== account.stagingId || !login.user.email_confirmed_at) {
    throw new Error("Confirmed staging identity differs");
  }
  if (upgraded) {
    requireSuccess(
      await client.rpc("api_get_user_dogs", { p_user_id: account.stagingId }),
      "Imported user pack",
    );
  }
  requireSuccess(
    await client.auth.signOut({ scope: "local" }),
    "Password logout",
  );
}
let checkedFiles = 0;
for (const file of evidence.files) {
  const downloaded = requireSuccess(
    await admin.storage.from(file.bucket).download(file.destinationPath),
    "Retained legacy file",
  );
  const bytes = Buffer.from(await downloaded.arrayBuffer());
  if (
    bytes.length !== file.size ||
    createHash("sha256").update(bytes).digest("hex") !== file.checksum
  ) {
    throw new Error("Imported legacy file checksum differs");
  }
  checkedFiles += 1;
}
if (upgraded) {
  for (const image of actual.dog_images) {
    const expected = fixture.dog_images.find(
      (candidate) => candidate.id === image.id,
    );
    const file = evidence.files.find(
      (candidate) =>
        candidate.bucket === expected.bucket_id &&
        candidate.destinationPath === expected.storage_path,
    );
    if (
      !file ||
      image.uploader_member_id !== null ||
      image.bucket_id !== "dogs"
    ) {
      throw new Error("Legacy image attribution or file mapping differs");
    }
    const bytes = Buffer.from(
      await requireSuccess(
        await admin.storage.from("dogs").download(image.storage_path),
        "Migrated dog file",
      ).arrayBuffer(),
    );
    if (
      createHash("sha256").update(bytes).digest("hex") !== file.checksum ||
      bytes.length !== file.size
    ) {
      throw new Error("Migrated dog file checksum differs");
    }
  }
  for (const dog of actual.dogs) {
    const expectedPrimary = fixture.dog_images.find(
      (image) => image.dog_id === dog.id && image.is_primary,
    );
    if (dog.primary_image_id !== (expectedPrimary?.id ?? null)) {
      throw new Error("Primary image selection differs");
    }
  }
}
const result = {
  phase: upgraded ? "post-upgrade" : "legacy",
  checkedRecords,
  retainedLegacyFiles: checkedFiles,
  migratedDogFiles: upgraded ? actual.dog_images.length : 0,
  confirmedLogins: logins.accounts.length,
};
savePrivate(`verification-${result.phase}.json`, result);
console.log(JSON.stringify(result));
