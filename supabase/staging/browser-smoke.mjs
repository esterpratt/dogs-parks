import { execFileSync } from "node:child_process";
import {
  PRIVATE_DIR,
  STAGING_REF,
  SOURCE_REF,
  readPrivate,
  savePrivate,
} from "./runtime.mjs";

// Credentials enter the browser through local child-process arguments, never
// shell interpolation or chat output. Snapshots stay in the private evidence.
function browser(session, argumentsList) {
  return execFileSync(
    "npm",
    [
      "exec",
      "--yes",
      "--package=agent-browser@0.38.2",
      "--",
      "agent-browser",
      "--session",
      session,
      ...argumentsList,
    ],
    {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, AGENT_BROWSER_SCREENSHOT_DIR: PRIVATE_DIR },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}
const fixtures = readPrivate("synthetic-fixtures.json");
const imported = readPrivate("mapped-fixture.json");
const credentials = readPrivate("logins.json");
const selection = readPrivate("selection.json");
const checks = [];
for (const [index, sourceId] of selection.userIds.entries()) {
  const account = credentials.accounts.find(
    (candidate) => candidate.sourceId === sourceId,
  );
  const session = `klavhub-import-${index}`;
  browser(session, ["open", "http://127.0.0.1:5173/login?mode=login"]);
  browser(session, ["fill", '[data-test="login-email"]', account.email]);
  browser(session, ["fill", '[data-test="login-password"]', account.password]);
  browser(session, ["click", '[data-test="login-submit"]']);
  browser(session, ["wait", '[data-test="navbar-notifications-link"]']);
  const dog = imported.dogs.find(
    (candidate) =>
      candidate.owner === account.stagingId && !candidate.deleted_at,
  );
  if (dog) {
    browser(session, [
      "open",
      `http://127.0.0.1:5173/dogs/${dog.id}/ownership`,
    ]);
    browser(session, ["wait", "--load", "networkidle"]);
    savePrivate(
      `browser-import-${index}.txt`,
      browser(session, ["snapshot", "-i"]),
    );
    browser(session, ["screenshot"]);
  }
  browser(session, [
    "open",
    `http://127.0.0.1:5173/profile/${account.stagingId}/settings/delete-account`,
  ]);
  browser(session, ["wait", "--load", "networkidle"]);
  savePrivate(
    `browser-account-review-${index}.txt`,
    browser(session, ["snapshot", "-i"]),
  );
  const requests = browser(session, ["network", "requests"]);
  if (requests.includes(SOURCE_REF)) {
    throw new Error("Browser contacted production");
  }
  if (!requests.includes(STAGING_REF)) {
    throw new Error("No staging requests recorded");
  }
  const errors = browser(session, ["errors"]).trim();
  if (errors) {
    savePrivate(`browser-errors-${index}.txt`, errors);
    throw new Error("Browser page errors were recorded");
  }
  checks.push({
    account: index === 0 ? "own-import" : "test-import",
    login: true,
    ownershipRoute: Boolean(dog),
    accountReview: true,
    productionRequests: false,
  });
  browser(session, ["close"]);
}
for (const role of ["primary", "private"]) {
  const account = fixtures.accounts[role];
  const session = `klavhub-synthetic-${role}`;
  browser(session, ["open", "http://127.0.0.1:5173/login?mode=login"]);
  browser(session, ["fill", '[data-test="login-email"]', account.email]);
  browser(session, ["fill", '[data-test="login-password"]', account.password]);
  browser(session, ["click", '[data-test="login-submit"]']);
  browser(session, ["wait", '[data-test="navbar-notifications-link"]']);
  browser(session, [
    "open",
    `http://127.0.0.1:5173/dogs/${fixtures.dogs.shared}/ownership`,
  ]);
  browser(session, ["wait", "--load", "networkidle"]);
  const snapshot = browser(session, ["snapshot", "-i"]);
  savePrivate(`browser-shared-${role}.txt`, snapshot);
  if (
    !snapshot.includes("Staging private") ||
    !snapshot.includes("Staging primary")
  ) {
    throw new Error(
      "Owner-only shared roster did not display the private co-owner",
    );
  }
  browser(session, ["screenshot"]);
  checks.push({ role, sharedRoster: true });
  browser(session, ["close"]);
}
savePrivate("browser-verification.json", checks);
console.log(JSON.stringify(checks));
