import { defineAction, NoWriteError } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { DECISION_LABEL, DECISIONS } from "../shared/court.js";
import { getDb, schema } from "../server/db/index.js";
import {
  actorOf,
  logTranscript,
  pendingObjection,
  requireCase,
  viaOf,
} from "../server/lib/court/store.js";

export default defineAction({
  description:
    'Deliver the judge\'s verdict and close the record. decision: "granted" (do it), "granted_in_part" or "denied" (do not, or not now). ruling: the judge\'s words. appealConditions: events that should reopen the case. Only the judge rules: an agent may draft a verdict, but a person must approve it.',
  schema: z.object({
    caseId: z.string().describe("Case id"),
    decision: z.enum(DECISIONS).describe('"granted", "granted_in_part" or "denied"'),
    ruling: z.string().min(4).max(1200).describe("The ruling in the judge's words"),
    appealConditions: z
      .array(z.string().min(3).max(200))
      .max(6)
      .default([])
      .describe("Conditions under which the case should reopen; defaults to none"),
  }),
  needsApproval: (_args, ctx) => ctx?.caller !== "frontend" && ctx?.caller !== "cli",
  outputSchema: z.object({ id: z.string(), decision: z.string(), path: z.string(), message: z.string() }),
  link: ({ result }) => ({ url: result.path, label: "Open the decision record" }),
  run: async (args, ctx) => {
    const kase = await requireCase(args.caseId, "editor");
    if (kase.status === "ruled") {
      throw new NoWriteError("This case already has a verdict.", { errorCode: "already_ruled", statusCode: 409 });
    }
    if (await pendingObjection(args.caseId)) {
      throw new NoWriteError("Rule on the pending objection before delivering a verdict.", {
        errorCode: "objection_pending",
        statusCode: 409,
      });
    }
    await getDb()
      .update(schema.cases)
      .set({
        status: "ruled",
        decision: args.decision,
        ruling: args.ruling.trim(),
        appealConditions: JSON.stringify(args.appealConditions.map((c) => c.trim())),
        ruledAt: new Date().toISOString(),
      })
      .where(eq(schema.cases.id, args.caseId));
    await logTranscript(args.caseId, actorOf(ctx), viaOf(ctx), `delivered the verdict: ${DECISION_LABEL[args.decision].toLowerCase()}`);
    return {
      id: args.caseId,
      decision: args.decision,
      path: `/court/${args.caseId}/record`,
      message: `${DECISION_LABEL[args.decision]}. The decision record is ready.`,
    };
  },
});
