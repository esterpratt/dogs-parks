import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { queryStaging, savePrivate } from "./runtime.mjs";

// Apply the feature files separately so enum additions commit before dependent
// SQL. History is recorded atomically with each successful migration.
const migrations = readdirSync("supabase/migrations")
  .filter((filename) => filename.slice(0, 14) >= "20260927193000")
  .concat(readdirSync("supabase/staging/migrations"))
  .sort();
// Staging-only platform configuration stays outside the production ledger.
function migrationPath(filename) {
  return filename.endsWith("_enable_staging_api_aggregates.sql")
    ? `supabase/staging/migrations/${filename}`
    : `supabase/migrations/${filename}`;
}
const history = queryStaging(
  "SELECT version,name,statements FROM supabase_migrations.schema_migrations ORDER BY version;",
);
for (const filename of migrations) {
  const applied = history.find(
    (entry) => entry.version === filename.slice(0, 14),
  );
  if (
    applied &&
    applied.statements?.join("\n") !==
      readFileSync(migrationPath(filename), "utf8")
  ) {
    throw new Error(`Applied migration differs from repository: ${filename}`);
  }
}
const pending = migrations.filter(
  (filename) =>
    !history.some((entry) => entry.version === filename.slice(0, 14)),
);
console.log(
  JSON.stringify({
    mode: process.argv.includes("--apply") ? "apply" : "dry-run",
    pending,
  }),
);
if (process.argv.includes("--apply")) {
  for (const filename of pending) {
    const sql = readFileSync(migrationPath(filename), "utf8");
    const sha256 = createHash("sha256").update(sql).digest("hex");
    const version = filename.slice(0, 14);
    const name = filename.slice(15, -4);
    queryStaging(
      `BEGIN;\n${sql}\nINSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES ('${version}','${name}',ARRAY['${sql.replaceAll("'", "''")}']);\nCOMMIT;`,
    );
    savePrivate(`migration-${version}.json`, {
      filename,
      sha256,
      appliedAt: new Date().toISOString(),
    });
    console.log(`Applied ${filename}`);
  }
}
