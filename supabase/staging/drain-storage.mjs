import {
  stagingKeys,
  STAGING_REF,
  queryStaging,
  savePrivate,
} from "./runtime.mjs";

// A manual service-authenticated drain is explicit and opt-in. Normal client
// startup never invokes it, and no production credentials are accepted.
const { workerService } = stagingKeys();
let finished = false;
for (let batch = 0; batch < 20; batch += 1) {
  const response = await fetch(
    `https://${STAGING_REF}.supabase.co/functions/v1/process-dog-storage-jobs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${workerService}`,
        apikey: workerService,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
  if (!response.ok) {
    savePrivate("worker-error.json", {
      status: response.status,
      body: await response.json(),
    });
    throw new Error(`Staging worker returned ${response.status}`);
  }
  const result = await response.json();
  console.log(JSON.stringify(result));
  if (result.failed) {
    throw new Error(
      "Storage worker reported failures; inspect private job evidence",
    );
  }
  if (!result.claimed) {
    finished = true;
    break;
  }
}
if (!finished) {
  throw new Error(
    "Drain batch limit reached; invoke again after reviewing the backlog",
  );
}
// SQL metadata confirms that a
// temporarily unavailable/retry-delayed job is not mistaken for a drained queue.
const states = queryStaging(
  "SELECT state,count(*) FROM private.storage_jobs GROUP BY state ORDER BY state;",
);
console.log(JSON.stringify(states));
if (states.some((row) => row.state !== "COMPLETED")) {
  throw new Error("Storage jobs remain incomplete");
}
