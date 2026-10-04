import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, chmodSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Every remote operation has an explicit target; the normal repository link is
// never used for staging writes. Private records and keys stay outside Git.
const SOURCE_REF = "kbsjdfzpeianxhidguam";
const STAGING_REF = "uhdzwzuyiztktxthwdfp";
const PRIVATE_DIR = resolve(".private/staging");
const STAGING_WORKDIR = resolve(PRIVATE_DIR, "workdir");

function cli(argumentsList) {
  let output;
  try {
    output = execFileSync("supabase", argumentsList, {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return JSON.parse(output);
  } catch (error) {
    // CLI diagnostics can echo SQL containing private records. Keep failures
    // generic; inspect private evidence locally rather than logging the query.
    savePrivate("last-cli-error.txt", String(error.stderr ?? error.message));
    savePrivate("last-cli-output.txt", String(error.stdout ?? output ?? ""));
    throw new Error(
      `Supabase command failed: ${argumentsList.slice(0, 2).join(" ")}`,
    );
  }
}

function savePrivate(name, value) {
  mkdirSync(PRIVATE_DIR, { recursive: true, mode: 0o700 });
  const filename = resolve(PRIVATE_DIR, name);
  writeFileSync(
    filename,
    typeof value === "string" ? value : JSON.stringify(value, null, 2),
    { mode: 0o600 },
  );
  chmodSync(filename, 0o600);
  return filename;
}

function readPrivate(name) {
  return JSON.parse(readFileSync(resolve(PRIVATE_DIR, name), "utf8"));
}

function assertStaging() {
  if (STAGING_REF === SOURCE_REF) {
    throw new Error("Production cannot be a staging destination");
  }
  const { projects } = cli(["projects", "list", "--output-format", "json"]);
  const staging = projects.find((project) => project.ref === STAGING_REF);
  const source = projects.find((project) => project.ref === SOURCE_REF);
  const linkedRef = readFileSync(
    resolve(STAGING_WORKDIR, "supabase/.temp/project-ref"),
    "utf8",
  ).trim();
  if (
    linkedRef !== STAGING_REF ||
    staging?.name !== "klavhub-staging" ||
    staging.status !== "ACTIVE_HEALTHY" ||
    source?.name !== "klavhub"
  ) {
    throw new Error(
      "Project identity or isolated staging workdir check failed",
    );
  }
  return staging;
}

function queryStaging(sql) {
  assertStaging();
  return queryFile(sql, [
    "db",
    "query",
    "--linked",
    "--workdir",
    STAGING_WORKDIR,
  ]);
}

function queryFile(sql, argumentsList) {
  // Overlapping verification/preparation commands must not execute each other's
  // SQL. Each invocation owns a protected file until its CLI process finishes.
  const filename = savePrivate(`query-${randomUUID()}.sql`, sql);
  try {
    return cli([...argumentsList, "--file", filename]).rows;
  } finally {
    unlinkSync(filename);
  }
}

function querySource(sql) {
  const linkedRef = readFileSync("supabase/.temp/project-ref", "utf8").trim();
  if (linkedRef !== SOURCE_REF || !sql.startsWith("BEGIN READ ONLY;")) {
    throw new Error(
      "Source query must target verified production and use a read-only transaction",
    );
  }
  return queryFile(sql, ["db", "query", "--linked"]);
}

function stagingKeys() {
  assertStaging();
  const { keys } = cli([
    "projects",
    "api-keys",
    "--project-ref",
    STAGING_REF,
    "--reveal",
    "--output-format",
    "json",
  ]);
  const anon = keys.find((key) => key.name === "anon")?.api_key;
  const service = keys.find((key) => key.name === "service_role")?.api_key;
  if (!anon || !service) {
    throw new Error("Expected staging legacy keys are unavailable");
  }
  for (const key of [anon, service]) {
    const claims = JSON.parse(
      Buffer.from(key.split(".")[1], "base64url").toString(),
    );
    if (claims.ref !== STAGING_REF) {
      throw new Error("API key belongs to an unexpected project");
    }
  }
  // New projects inject the modern secret key under SERVICE_ROLE_KEY. The
  // worker compares the exact injected credential, rather than accepting any
  // equivalent legacy service-role JWT. Match by digest, without logging keys.
  const { secrets } = cli([
    "secrets",
    "list",
    "--project-ref",
    STAGING_REF,
    "--output-format",
    "json",
  ]);
  const digest = secrets.find(
    (secret) => secret.name === "SUPABASE_SERVICE_ROLE_KEY",
  )?.value;
  const workerService = keys.find(
    (key) =>
      key.api_key &&
      createHash("sha256").update(key.api_key).digest("hex") === digest,
  )?.api_key;
  if (!workerService) {
    throw new Error(
      "Injected worker credential could not be resolved securely",
    );
  }
  return { anon, service, workerService };
}

function stagingClient(key) {
  return createClient(`https://${STAGING_REF}.supabase.co`, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function requireSuccess(result, operation) {
  if (result.error) {
    throw new Error(
      `${operation} failed (${result.error.code ?? result.error.status ?? "unknown"})`,
    );
  }
  return result.data;
}

export {
  SOURCE_REF,
  STAGING_REF,
  PRIVATE_DIR,
  STAGING_WORKDIR,
  cli,
  savePrivate,
  readPrivate,
  assertStaging,
  queryStaging,
  querySource,
  stagingKeys,
  stagingClient,
  requireSuccess,
};
