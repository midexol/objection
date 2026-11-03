import { defineAction, fail } from "@agent-native/core/action";
import { z } from "zod";

import { CASE_TYPES } from "../shared/court.js";
import { getDb, schema } from "../server/db/index.js";
import { actorOf, logTranscript, newId, viaOf } from "../server/lib/court/store.js";

export default defineAction({
  description:
    "File a new case: put a yes/no decision on trial. Give the motion as a question (e.g. 'Should we ship the new checkout on Friday?'), optional background, and optional initial exhibits (documents, notes, numbers) that counsel may cite. Returns the case id and its courtroom path.",
  schema: z.object({
    motion: z
      .string()
      .min(8)
      .max(240)
      .describe("The decision as a yes/no question, e.g. 'Should we hire a second backend engineer?'"),
    context: z
      .string()
      .max(2000)
      .default("")
      .describe("Background the court should know; defaults to empty"),
    caseType: z
      .enum(CASE_TYPES)
      .default("custom")
      .describe('One of "architecture", "ship", "build_vs_buy", "hire", "custom"; defaults to "custom"'),
    exhibits: z
      .array(
        z.object({
          title: z.string().min(1).max(140).describe("Short exhibit title"),
          content: z.string().min(1).max(20000).describe("Full text of the evidence"),
          source: z.string().max(400).default("").describe("File name or URL it came from"),
        }),
      )
      .max(12)
      .default([])
      .describe("Initial evidence, lettered A, B, C... in order; defaults to none"),
  }),
  mcpTool: true,
  outputSchema: z.object({
    id: z.string(),
    motion: z.string(),
    path: z.string(),
    exhibits: z.number(),
    message: z.string(),
  }),
  link: ({ result }) => ({ url: result.path, label: "Open the courtroom" }),
  run: async (args, ctx) => {
    const ownerEmail =
      ctx?.userEmail ?? fail("Sign in to file a case.", { statusCode: 401 });
    const orgId = ctx?.orgId ?? null;
    const id = newId("case");
    const db = getDb();
    const now = Date.now();
    await db.insert(schema.cases).values({
      id,
      motion: args.motion.trim(),
      context: args.context.trim(),
      caseType: args.caseType,
      status: "filed",
      ownerEmail,
      orgId,
      visibility: orgId ? "org" : "private",
      createdAt: new Date(now).toISOString(),
    });
    const actor = actorOf(ctx);
    const via = viaOf(ctx);
    await logTranscript(id, actor, via, "filed the case");
    for (const [i, e] of args.exhibits.entries()) {
      const letter = String.fromCharCode(65 + i);
      await db.insert(schema.exhibits).values({
        id: newId("ex"),
        caseId: id,
        letter,
        title: e.title.trim(),
        content: e.content,
        source: e.source,
        addedBy: actor,
        addedVia: via,
        createdAt: new Date(now + i + 1).toISOString(),
      });
      await logTranscript(id, actor, via, `entered Exhibit ${letter}`);
    }
    return {
      id,
      motion: args.motion.trim(),
      path: `/court/${id}`,
      exhibits: args.exhibits.length,
      message: `Filed. ${args.exhibits.length} exhibit(s) on the board.`,
    };
  },
});
