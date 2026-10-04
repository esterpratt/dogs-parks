import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { parse } from "dotenv";

// Read only this mode's explicit public configuration and supply it as process
// environment so production .env.local cannot win Vite's environment precedence.
const STAGING_REF = "uhdzwzuyiztktxthwdfp";
const configuration = parse(readFileSync(".env.staging.local"));
if (configuration.VITE_SUPABASE_URL !== `https://${STAGING_REF}.supabase.co`) {
  throw new Error("Staging URL must match the verified staging project");
}
const key = configuration.VITE_SUPABASE_ANON_KEY;
let claims;
try {
  claims = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
} catch {
  throw new Error("Staging requires its own public anon JWT");
}
if (claims.ref !== STAGING_REF || claims.role !== "anon") {
  throw new Error(
    "Staging key must be an anon key from the verified staging project",
  );
}
if (
  Object.keys(configuration).some(
    (name) => name.startsWith("VITE_") && /SERVICE|SECRET|PASSWORD/i.test(name),
  )
) {
  throw new Error("Privileged credentials must never enter Vite configuration");
}
console.log(`KlavHub staging → ${STAGING_REF} (independent test backend)`);
const child = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--mode",
    "staging",
    "--host",
    "127.0.0.1",
    "--strictPort",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_SUPABASE_URL: configuration.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: key,
    },
  },
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
