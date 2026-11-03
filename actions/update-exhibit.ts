import { defineAction, NoWriteError } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { actorOf, logTranscript, requireCase, viaOf } from "../server/lib/court/store.js";

export default defineAction({
  description:
    'Strike an exhibit from the record or reinstate it. A struck exhibit can no longer be cited; citations to it fail verification. status: "struck" or "admitted".',
  schema: z.object({
    caseId: z.string().describe("Case id"),
    letter: z.string().min(1).max(3).describe("Exhibit letter, e.g. 'C'"),
    status: z.enum(["struck", "admitted"]).describe('"struck" to strike, "admitted" to reinstate'),
  }),
  outputSchema: z.object({ letter: z.string(), status: z.string(), message: z.string() }),
  run: async (args, ctx) => {
    await requireCase(args.caseId, "editor");
    const letter = args.letter.toUpperCase();
    const db = getDb();
    const [row] = await db
      .select()
      .from(schema.exhibits)
      .where(and(eq(schema.exhibits.caseId, args.caseId), eq(schema.exhibits.letter, letter)))
      .limit(1);
    if (!row) {
      throw new NoWriteError(`There is no Exhibit ${letter} on this case.`, {
        errorCode: "exhibit_not_found",
        statusCode: 404,
      });
    }
    await db.update(schema.exhibits).set({ status: args.status }).where(eq(schema.exhibits.id, row.id));
    await logTranscript(
      args.caseId,
      actorOf(ctx),
      viaOf(ctx),
      `${args.status === "struck" ? "struck" : "reinstated"} Exhibit ${letter}`,
    );
    return {
      letter,
      status: args.status,
      message: `Exhibit ${letter} ${args.status === "struck" ? "struck from the record" : "reinstated"}.`,
    };
  },
});
