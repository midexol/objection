import { createGetDb } from "@agent-native/core/db";
import { registerShareableResource } from "@agent-native/core/sharing";

import * as schema from "./schema.js";

export const getDb = createGetDb(schema);
export { schema };

registerShareableResource({
  type: "court-case",
  resourceTable: schema.cases,
  sharesTable: schema.caseShares,
  displayName: "Case",
  titleColumn: "motion",
  getResourcePath: (row) => `/court/${row.id}`,
  getDb,
});
