import { defineAction, NoWriteError } from "@agent-native/core/action";
import { z } from "zod";

import { SIDE_LABEL, SIDES } from "../shared/court.js";
import { getDb, schema } from "../server/db/index.js";
import { actorOf, logTranscript, newId, requireCase, viaOf } from "../server/lib/court/store.js";

export default defineAction({
  description:
    'Put a question to counsel. The addressed side must answer it at the start of its next statement. side: "defense", "prosecution" or "both".',
  schema: z.object({
    caseId: z.string().describe("Case id"),
    side: z.enum([...SIDES, "both"]).describe('"defense", "prosecution" or "both"'),
    question: z.string().min(4).max(400).describe("The question, e.g. 'Who runs the migration if Tola is away?'"),
  }),
  outputSchema: z.object({ ids: z.array(z.string()), message: z.string() }),
  run: async (args, ctx) => {
    const kase = await requireCase(args.caseId, "editor");
    if (kase.status === "ruled" || kase.status === "deliberation") {
      throw new NoWriteError("Counsel has finished arguing; there is no next statement to answer in.", {
        errorCode: "no_turns_left",
        statusCode: 409,
      });
    }
    const sides = args.side === "both" ? [...SIDES] : [args.side];
    const ids: string[] = [];
    for (const side of sides) {
      const id = newId("q");
      ids.push(id);
      await getDb().insert(schema.questions).values({
        id,
        caseId: args.caseId,
        side,
        question: args.question.trim(),
        createdAt: new Date().toISOString(),
      });
    }
    const to = args.side === "both" ? "both counsel" : SIDE_LABEL[args.side];
    await logTranscript(args.caseId, actorOf(ctx), viaOf(ctx), `asked ${to}: ${args.question.trim()}`);
    return { ids, message: `Question put to ${to}. They answer on their next statement.` };
  },
});
