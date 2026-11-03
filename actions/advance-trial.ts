import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { advanceTrial } from "../server/lib/court/counsel.js";

const resultSchema = z.object({
  id: z.string(),
  side: z.string(),
  stage: z.string(),
  verifiedCitations: z.number(),
  failedCitations: z.array(z.string()),
  objection: z
    .object({ id: z.string(), grounds: z.string(), raisedBy: z.string(), origin: z.string() })
    .nullable(),
  nextTurn: z.number(),
  status: z.string(),
  message: z.string(),
});

export default defineAction({
  description:
    "Call the next counsel to speak. The court's counsel writes one statement (Defense and Prosecution alternate through opening, rebuttal and closing), its citations are verified against the exhibits, and any objection pauses the court until the judge rules. Fails with objection_pending while an objection awaits a ruling, and awaiting_ruling after closings.",
  schema: z.object({
    caseId: z.string().describe("Case id"),
  }),
  mcpTool: true,
  outputSchema: resultSchema,
  run: async ({ caseId }) => advanceTrial(caseId),
});
