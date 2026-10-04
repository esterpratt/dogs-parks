import { queryStaging } from "./runtime.mjs";

// Feature enablement is restricted to the tested staging browser build. Native
// rows stay disabled until their own builds have been rehearsed.
queryStaging(
  "UPDATE public.app_feature_compatibility SET enabled=true,minimum_build=1 WHERE feature='SHARED_DOG_OWNERSHIP' AND platform='WEB';",
);
const rows = queryStaging(
  "SELECT feature,platform,enabled,minimum_build FROM public.app_feature_compatibility ORDER BY platform;",
);
if (
  rows.some((row) => row.platform !== "WEB" && row.enabled) ||
  !rows.some(
    (row) => row.platform === "WEB" && row.enabled && row.minimum_build === 1,
  )
) {
  throw new Error(
    "Staging compatibility rows differ from the browser-only plan",
  );
}
console.log(JSON.stringify(rows));
