import { defineAction } from "@agent-native/core/action";
import { accessFilter } from "@agent-native/core/sharing";
import { desc } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { counselAvailable } from "../server/lib/court/llm.js";

export default defineAction({
  description:
    "List the cases on the docket the current user can see, newest first, with each case's motion, status and turn. Also reports whether live counsel (a model key) is configured.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  mcpTool: true,
  outputSchema: z.object({
    cases: z.array(
      z.object({
        id: z.string(),
        motion: z.string(),
        caseType: z.string(),
        status: z.string(),
        turn: z.number(),
        decision: z.string().nullable(),
        rehearsed: z.boolean(),
        createdAt: z.string(),
      }),
    ),
    counsel: z.object({ live: z.boolean(), providers: z.array(z.string()) }),
  }),
  run: async () => {
    const { cases, caseShares } = schema;
    const rows = await getDb()
      .select({
        id: cases.id,
        motion: cases.motion,
        caseType: cases.caseType,
        status: cases.status,
        turn: cases.turn,
        decision: cases.decision,
        rehearsed: cases.rehearsed,
        createdAt: cases.createdAt,
      })
      .from(cases)
      .where(accessFilter(cases, caseShares))
      .orderBy(desc(cases.createdAt))
      .limit(100);
    return {
      cases: rows.map((r) => ({ ...r, rehearsed: r.rehearsed === 1 })),
      counsel: counselAvailable(),
    };
  },
});
