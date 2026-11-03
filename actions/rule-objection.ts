import { defineAction, NoWriteError } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { GROUNDS_LABEL, SIDE_LABEL, type Grounds, type Side } from "../shared/court.js";
import { getDb, schema } from "../server/db/index.js";
import { actorOf, logTranscript, requireCase, viaOf } from "../server/lib/court/store.js";

export default defineAction({
  description:
    'Rule on a pending objection. "sustained" strikes the challenged argument from the record; "overruled" lets it stand. Only the judge rules: when an agent calls this, a person must approve the ruling first.',
  schema: z.object({
    id: z.string().describe("Objection id"),
    ruling: z.enum(["sustained", "overruled"]).describe('"sustained" or "overruled"'),
  }),
  needsApproval: (_args, ctx) => ctx?.caller !== "frontend" && ctx?.caller !== "cli",
  outputSchema: z.object({
    id: z.string(),
    ruling: z.string(),
    struckArgumentId: z.string().nullable(),
    message: z.string(),
  }),
  run: async (args, ctx) => {
    const db = getDb();
    const [obj] = await db.select().from(schema.objections).where(eq(schema.objections.id, args.id)).limit(1);
    if (!obj) {
      throw new NoWriteError(`No objection ${args.id}.`, { errorCode: "objection_not_found", statusCode: 404 });
    }
    await requireCase(obj.caseId, "editor");
    if (obj.status !== "pending") {
      throw new NoWriteError(`That objection was already ${obj.status}.`, {
        errorCode: "already_ruled",
        statusCode: 409,
      });
    }
    await db
      .update(schema.objections)
      .set({ status: args.ruling, ruledAt: new Date().toISOString() })
      .where(eq(schema.objections.id, obj.id));
    let struck: string | null = null;
    if (args.ruling === "sustained") {
      await db
        .update(schema.counselArguments)
        .set({ status: "struck" })
        .where(eq(schema.counselArguments.id, obj.targetArgumentId));
      struck = obj.targetArgumentId;
    }
    const grounds = GROUNDS_LABEL[obj.grounds as Grounds] ?? obj.grounds;
    await logTranscript(
      obj.caseId,
      actorOf(ctx),
      viaOf(ctx),
      `${args.ruling} ${SIDE_LABEL[obj.raisedBy as Side]}'s objection (${grounds.toLowerCase()})`,
    );
    return {
      id: obj.id,
      ruling: args.ruling,
      struckArgumentId: struck,
      message:
        args.ruling === "sustained"
          ? "Sustained. The statement is struck from the record."
          : "Overruled. The statement stands.",
    };
  },
});
