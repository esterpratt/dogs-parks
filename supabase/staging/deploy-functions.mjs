import {
  cli,
  STAGING_REF,
  assertStaging,
  queryStaging,
  savePrivate,
} from "./runtime.mjs";

// Deploy only the two required handlers with gateway JWT checks enabled. They
// also authenticate internally: delete-user verifies the session with Auth;
// the storage worker requires the exact staging service-role bearer credential.
assertStaging();
const ready = queryStaging(
  "SELECT to_regprocedure('public.api_prepare_account_erasure(jsonb,public.app_platform,integer)') IS NOT NULL AS ready;",
)[0].ready;
if (!ready) {
  throw new Error("Account-erasure migration must exist before deployment");
}
cli([
  "functions",
  "deploy",
  "delete-user",
  "process-dog-storage-jobs",
  "--project-ref",
  STAGING_REF,
  "--use-api",
  "--output-format",
  "json",
]);
const result = cli([
  "functions",
  "list",
  "--project-ref",
  STAGING_REF,
  "--output-format",
  "json",
]);
if (
  result.functions.length !== 2 ||
  result.functions.some((handler) => !handler.verify_jwt)
) {
  throw new Error(
    "Unexpected staging function inventory or gateway authentication",
  );
}
savePrivate("function-deployment.json", result.functions);
console.log(
  "Only delete-user and process-dog-storage-jobs are deployed; gateway JWT checks remain enabled.",
);
