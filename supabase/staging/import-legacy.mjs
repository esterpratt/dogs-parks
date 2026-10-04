import { randomBytes, createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  SOURCE_REF,
  STAGING_REF,
  PRIVATE_DIR,
  readPrivate,
  savePrivate,
  queryStaging,
  stagingKeys,
  stagingClient,
  requireSuccess,
} from "./runtime.mjs";

const fixture = readPrivate("source-fixture.json");
const apply = process.argv.includes("--apply");
if (fixture.sourceRef !== SOURCE_REF || fixture.stagingRef !== STAGING_REF) {
  throw new Error("Fixture target mismatch");
}
const counts = Object.fromEntries(
  [
    "users",
    "dogs",
    "dog_members",
    "dog_images",
    "friendships",
    "parks",
    "park_translations",
    "favorites",
  ].map((table) => [table, fixture[table].length]),
);
console.log(
  JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    stagingRef: STAGING_REF,
    counts,
    files: fixture.objects.filter(
      (object) => !object.path.endsWith(".emptyFolderPlaceholder"),
    ).length,
  }),
);
if (!apply) {
  process.exit(0);
}
const upgraded = queryStaging(
  "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dogs' AND column_name='ownership_version') AS upgraded;",
)[0].upgraded;
if (upgraded) {
  throw new Error(
    "Legacy import is closed after upgrade; use verification or separate synthetic fixtures",
  );
}
const { service } = stagingKeys();
const client = stagingClient(service);
const credentials = existsSync(`${PRIVATE_DIR}/logins.json`)
  ? readPrivate("logins.json")
  : { stagingRef: STAGING_REF, accounts: [] };
if (credentials.stagingRef !== STAGING_REF) {
  throw new Error("Login manifest target mismatch");
}
for (const user of fixture.authUsers) {
  let account = credentials.accounts.find(
    (candidate) => candidate.sourceId === user.id,
  );
  if (account?.stagingId) {
    const existing = requireSuccess(
      await client.auth.admin.getUserById(account.stagingId),
      "Existing staging account",
    );
    if (existing.user.app_metadata.staging_fixture !== "selected-import") {
      throw new Error("Existing account lacks selected-import marker");
    }
    continue;
  }
  if (!account) {
    account = {
      sourceId: user.id,
      email: user.email,
      password: randomBytes(24).toString("base64url"),
    };
    credentials.accounts.push(account);
    savePrivate("logins.json", credentials);
  }
  const { users } = requireSuccess(
    await client.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    "Check account retry",
  );
  const existing = users.find((candidate) => candidate.email === account.email);
  if (existing && existing.app_metadata.staging_fixture !== "selected-import") {
    throw new Error("Refusing to reuse an unrelated staging account");
  }
  const created =
    existing ??
    requireSuccess(
      await client.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: fixture.users.find((profile) => profile.id === user.id)
            .name,
        },
        app_metadata: { staging_fixture: "selected-import" },
      }),
      "Create confirmed staging account",
    ).user;
  account.stagingId = created.id;
  savePrivate("logins.json", credentials);
}
const mapping = Object.fromEntries(
  credentials.accounts.map((account) => [account.sourceId, account.stagingId]),
);
function remap(value) {
  if (typeof value === "string") {
    let mapped = value.replaceAll(SOURCE_REF, STAGING_REF);
    for (const [sourceId, stagingId] of Object.entries(mapping)) {
      mapped = mapped.replaceAll(sourceId, stagingId);
    }
    return mapped;
  }
  if (Array.isArray(value)) {
    return value.map(remap);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, remap(item)]),
    );
  }
  return value;
}
const imported = remap(fixture);
// Generated friendship keys sort the new UUIDs, whose order can differ from the
// source pair. Do not insert generated columns or compare their old ordering.
for (const friendship of imported.friendships) {
  [friendship.user_low, friendship.user_high] = [
    friendship.requester_id,
    friendship.requestee_id,
  ].sort();
}
const evidence = existsSync(`${PRIVATE_DIR}/import-evidence.json`)
  ? readPrivate("import-evidence.json")
  : { stagingRef: STAGING_REF, mapping, files: [], relationalComplete: false };
if (evidence.stagingRef !== STAGING_REF) {
  throw new Error("Import evidence target mismatch");
}
const sourceHash = createHash("sha256")
  .update(JSON.stringify(fixture))
  .digest("hex");
if (evidence.sourceHash && evidence.sourceHash !== sourceHash) {
  throw new Error(
    "Source selection changed; review a new scoped import manifest first",
  );
}
evidence.sourceHash = sourceHash;
savePrivate("import-evidence.json", evidence);
queryStaging(`CREATE SCHEMA IF NOT EXISTS staging_admin;
REVOKE ALL ON SCHEMA staging_admin FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS staging_admin.fixture_imports (id text PRIMARY KEY, source_hash text NOT NULL, imported_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON staging_admin.fixture_imports FROM PUBLIC,anon,authenticated;`);
const checkpoint = queryStaging(
  "SELECT source_hash FROM staging_admin.fixture_imports WHERE id='selected-legacy';",
);
if (checkpoint.length && checkpoint[0].source_hash !== sourceHash) {
  throw new Error("Committed import belongs to a different source manifest");
}
if (checkpoint.length) {
  evidence.relationalComplete = true;
}
// Backfill the checkpoint for the initial successful import recorded privately.
if (evidence.relationalComplete && !checkpoint.length) {
  queryStaging(
    `INSERT INTO staging_admin.fixture_imports(id,source_hash) VALUES ('selected-legacy','${sourceHash}');`,
  );
}

// Bucket limits temporarily accommodate historical oversized park objects;
// final limits return to the source settings after every file is verified.
for (const bucket of ["users", "parks", "dogs"]) {
  const fileSizeLimit = Math.max(
    256000,
    ...fixture.objects
      .filter((object) => object.bucket === bucket)
      .map((object) => Number(object.metadata?.size) || 0),
  );
  const buckets = requireSuccess(
    await client.storage.listBuckets(),
    "List staging buckets",
  );
  if (buckets.some((candidate) => candidate.id === bucket)) {
    requireSuccess(
      await client.storage.updateBucket(bucket, {
        public: true,
        fileSizeLimit,
      }),
      "Configure legacy bucket",
    );
  } else {
    requireSuccess(
      await client.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit,
      }),
      "Create legacy bucket",
    );
  }
}
const filesDir = `${PRIVATE_DIR}/files`;
mkdirSync(filesDir, { recursive: true, mode: 0o700 });
for (const object of fixture.objects) {
  if (object.path.endsWith(".emptyFolderPlaceholder")) {
    continue;
  }
  const localId = createHash("sha256")
    .update(`${object.bucket}/${object.path}`)
    .digest("hex");
  const localPath = `${filesDir}/${localId}`;
  let bytes;
  let contentType = object.metadata?.mimetype;
  if (existsSync(localPath)) {
    bytes = readFileSync(localPath);
  } else {
    const url = `https://${SOURCE_REF}.supabase.co/storage/v1/object/public/${object.bucket}/${object.path.split("/").map(encodeURIComponent).join("/")}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Selected source file is unavailable (${response.status}); see private manifest`,
      );
    }
    bytes = Buffer.from(await response.arrayBuffer());
    contentType ??= response.headers.get("content-type");
    writeFileSync(localPath, bytes, { mode: 0o600 });
  }
  if (bytes.length !== Number(object.metadata.size)) {
    throw new Error("Selected file size differs from source metadata");
  }
  if (object.path.endsWith(".json")) {
    const text = bytes.toString("utf8");
    if (text.includes(SOURCE_REF)) {
      throw new Error(
        "Park catalog embeds production URLs and needs explicit rewriting",
      );
    }
    JSON.parse(text);
  }
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const destinationPath = remap(object.path);
  let existing = await client.storage
    .from(object.bucket)
    .download(destinationPath);
  if (existing.error) {
    const prior = evidence.files.find(
      (file) =>
        file.bucket === object.bucket &&
        file.destinationPath === destinationPath,
    );
    if (prior) {
      throw new Error(
        "Previously imported file is missing; refuse automatic overwrite",
      );
    }
    requireSuccess(
      await client.storage
        .from(object.bucket)
        .upload(destinationPath, bytes, {
          contentType: contentType ?? "application/octet-stream",
          upsert: false,
        }),
      "Upload selected file",
    );
    existing = await client.storage
      .from(object.bucket)
      .download(destinationPath);
  }
  const downloaded = Buffer.from(
    await requireSuccess(existing, "Verify uploaded file").arrayBuffer(),
  );
  if (
    downloaded.length !== bytes.length ||
    createHash("sha256").update(downloaded).digest("hex") !== checksum
  ) {
    throw new Error("Destination file differs; refuse overwrite");
  }
  if (
    !evidence.files.some(
      (file) =>
        file.bucket === object.bucket &&
        file.destinationPath === destinationPath,
    )
  ) {
    evidence.files.push({
      bucket: object.bucket,
      sourcePath: object.path,
      destinationPath,
      size: bytes.length,
      checksum,
      contentType,
    });
    savePrivate("import-evidence.json", evidence);
  }
}
for (const bucket of ["users", "parks", "dogs"]) {
  requireSuccess(
    await client.storage.updateBucket(bucket, {
      public: true,
      fileSizeLimit: 256000,
    }),
    "Restore source bucket limit",
  );
}
if (!evidence.relationalComplete) {
  const tables = [
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
  const statements = tables.map((table) => {
    const records = imported[table];
    if (!records.length) {
      return "";
    }
    const columns = Object.keys(records[0]).filter(
      (column) => !["user_low", "user_high"].includes(column),
    );
    const identifierList = columns.map((column) => `"${column}"`).join(",");
    const json = JSON.stringify(records).replaceAll("'", "''");
    if (table === "users") {
      return `UPDATE public.users target SET name=source.name,private=source.private FROM jsonb_populate_recordset(NULL::public.users,'${json}'::jsonb) source WHERE target.id=source.id;`;
    }
    return `INSERT INTO public."${table}" (${identifierList}) SELECT ${identifierList} FROM jsonb_populate_recordset(NULL::public."${table}",'${json}'::jsonb);`;
  });
  // One transaction preserves FK order. No ON CONFLICT overwrites are used;
  // an unexpected existing record stops the import rather than replacing it.
  queryStaging(
    `BEGIN; SET search_path=public,extensions;\n${statements.join("\n")}\nINSERT INTO staging_admin.fixture_imports(id,source_hash) VALUES ('selected-legacy','${sourceHash}');\nCOMMIT;`,
  );
  evidence.relationalComplete = true;
  evidence.counts = counts;
  savePrivate("import-evidence.json", evidence);
}
savePrivate("mapped-fixture.json", imported);
console.log(
  JSON.stringify({
    imported: counts,
    verifiedFiles: evidence.files.length,
    loginFile: ".private/staging/logins.json",
  }),
);
