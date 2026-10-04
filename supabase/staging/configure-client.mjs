import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { parse } from "dotenv";
import { STAGING_REF, stagingKeys } from "./runtime.mjs";

// Write only the separate ignored staging configuration. Existing production
// .env.local and unrelated variables are never rewritten.
const { anon } = stagingKeys();
const filename = ".env.staging.local";
if (existsSync(filename)) {
  const existing = parse(readFileSync(filename));
  if (
    existing.VITE_SUPABASE_URL !== `https://${STAGING_REF}.supabase.co` ||
    existing.VITE_SUPABASE_ANON_KEY !== anon
  ) {
    throw new Error(
      "Existing staging configuration differs; review it before replacement",
    );
  }
} else {
  writeFileSync(
    filename,
    `VITE_SUPABASE_URL=https://${STAGING_REF}.supabase.co\nVITE_SUPABASE_ANON_KEY=${anon}\n`,
    { mode: 0o600 },
  );
}
chmodSync(filename, 0o600);
console.log(
  "Separate .env.staging.local is configured; production .env.local is preserved.",
);
