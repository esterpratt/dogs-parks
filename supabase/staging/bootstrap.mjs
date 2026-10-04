import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  PRIVATE_DIR,
  queryStaging,
  readPrivate,
  savePrivate,
} from "./runtime.mjs";

// Bootstrap is deliberately one-shot. Existing permanent staging data must
// never be reset or overwritten by a normal startup or a bootstrap retry.
const status = queryStaging(
  "SELECT (SELECT count(*) FROM pg_tables WHERE schemaname='public') AS tables, (SELECT count(*) FROM auth.users) AS users;",
)[0];
if (Number(status.tables) || Number(status.users)) {
  throw new Error("Bootstrap requires an empty staging project");
}
const fixture = readPrivate("source-fixture.json");
let schema = readFileSync(`${PRIVATE_DIR}/bootstrap-candidate.sql`, "utf8");
if (/https?:\/\/|Bearer\s+eyJ|kbsjdfzpeianxhidguam|http_request/.test(schema)) {
  throw new Error("Bootstrap contains an external destination or credential");
}
// The application does not use these crypto/network extensions. Leave them out
// of staging rather than copying production integration infrastructure.
schema = schema.replace(
  /^CREATE EXTENSION IF NOT EXISTS "(?:pg_net|pgsodium|http|pgjwt|supabase_vault)"[^;]*;\s*/gm,
  "",
);
const authTriggers = fixture.authTriggers
  .map((trigger) => {
    if (!["add_user_trigger", "on_user_deleted"].includes(trigger.name)) {
      throw new Error("Unexpected Auth trigger requires review");
    }
    // Hosted SQL access cannot ALTER the Auth-owned table to disable a trigger.
    // An absent legacy deletion trigger has the same inactive behavior and keeps
    // staging cleanup exclusively in the reviewed delete-user Edge Function.
    if (trigger.enabled === "D") {
      return "";
    }
    const definition = trigger.definition
      .replace(
        "EXECUTE FUNCTION add_user()",
        "EXECUTE FUNCTION public.add_user()",
      )
      .replace(
        "EXECUTE FUNCTION delete_user_folder()",
        "EXECUTE FUNCTION public.delete_user_folder()",
      );
    return `${definition};`;
  })
  .join("\n");
const storagePolicies = fixture.storagePolicies
  .map((policy) => {
    const roles = policy.roles
      .map((role) => (role === "public" ? "PUBLIC" : `"${role}"`))
      .join(",");
    return `CREATE POLICY "${policy.name}" ON storage.objects FOR ${policy.command} TO ${roles}${policy.using ? ` USING (${policy.using})` : ""}${policy.check ? ` WITH CHECK (${policy.check})` : ""};`;
  })
  .join("\n");
const sql = `BEGIN;\n${schema}\nSET search_path=public,extensions;\n${authTriggers}\n${storagePolicies}\nCOMMIT;`;
const filename = savePrivate("bootstrap-reviewed.sql", sql);
queryStaging(sql);
const verified = queryStaging(
  "SELECT (SELECT count(*) FROM pg_tables WHERE schemaname='public') AS tables,(SELECT count(*) FROM pg_policies WHERE schemaname='storage' AND tablename='objects') AS storage_policies,(SELECT count(*) FROM pg_trigger WHERE tgname='add_user_trigger') AS profile_triggers;",
)[0];
if (
  Number(verified.tables) !== 23 ||
  Number(verified.storage_policies) !== fixture.storagePolicies.length ||
  Number(verified.profile_triggers) !== 1
) {
  throw new Error("Bootstrap verification failed; do not mark history applied");
}
// Only the six source ledger entries are reconciled after verified baseline
// creation. Feature migrations are recorded only after executing their SQL.
queryStaging(`CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (version text PRIMARY KEY, statements text[], name text);
INSERT INTO supabase_migrations.schema_migrations(version,name) VALUES ${fixture.migrations.map((migration) => `('${migration.version}','${migration.name.replaceAll("'", "''")}')`).join(",")};`);
savePrivate("bootstrap-evidence.json", {
  filename,
  sha256: createHash("sha256").update(sql).digest("hex"),
  verified,
  sourceLedger: fixture.migrations,
});
console.log(
  "Staging baseline, Auth triggers, Storage policies and six source-ledger entries verified.",
);
