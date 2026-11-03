import { defineAction } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { actorOf, logTranscript, requireCase, viaOf } from "../server/lib/court/store.js";

export default defineAction({
  description:
    "Restart a case's trial from the opening statements. Keeps the motion and exhibits; clears arguments, objections, questions and any verdict.",
  schema: z.object({ caseId: z.string().describe("Case id") }),
  agentTool: false,
  outputSchema: z.object({ id: z.string(), message: z.string() }),
  run: async ({ caseId }, ctx) => {
    await requireCase(caseId, "editor");
    const db = getDb();
    await db.delete(schema.counselArguments).where(eq(schema.counselArguments.caseId, caseId));
    await db.delete(schema.objections).where(eq(schema.objections.caseId, caseId));
    await db.delete(schema.questions).where(eq(schema.questions.caseId, caseId));
    await db
      .update(schema.cases)
      .set({ status: "filed", turn: 0, decision: null, ruling: null, appealConditions: "[]", ruledAt: null })
      .where(eq(schema.cases.id, caseId));
    await logTranscript(caseId, actorOf(ctx), viaOf(ctx), "restarted the trial");
    return { id: caseId, message: "The trial is reset to opening statements." };
  },
});
