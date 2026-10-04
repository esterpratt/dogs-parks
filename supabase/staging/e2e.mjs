import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { STAGING_REF, readPrivate } from "./runtime.mjs";

// Existing tests run with explicit staging credentials and a staging server;
// dotenv's production .env.local cannot replace these process variables.
const configuration = parse(readFileSync(".env.staging.local"));
const account = readPrivate("synthetic-fixtures.json").accounts.primary;
if (configuration.VITE_SUPABASE_URL !== `https://${STAGING_REF}.supabase.co`) {
  throw new Error("Staging e2e URL does not match the verified project");
}
const result = spawnSync(
  "npm",
  ["run", "test:e2e:headless", "--", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ...configuration,
      STAGING_E2E: "true",
      TEST_EMAIL: account.email,
      TEST_PASSWORD: account.password,
    },
  },
);
process.exitCode = result.status ?? 1;
