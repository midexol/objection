import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { BASES, GROUNDS, SIDES } from "../shared/court.js";
import { recordArgument } from "../server/lib/court/record.js";
import { viaOf } from "../server/lib/court/store.js";

export default defineAction({
  description:
    "Argue as counsel yourself: enter one statement for the side whose turn it is. Each citation quote must be copied word for word from an admitted exhibit; the court checks every quote in code, and a quote that is not in the record draws an automatic objection that can get the statement struck. Optionally object to the opponent's latest argument. Use get-case first to read the exhibits and whose turn it is.",
  schema: z.object({
    caseId: z.string().describe("Case id"),
    side: z.enum(SIDES).describe('"defense" (argues for the motion) or "prosecution" (argues against); must be the side whose turn it is'),
    claim: z.string().min(4).max(220).describe("One-sentence headline of the point"),
    body: z.string().min(10).max(1400).describe("What counsel says to the judge, 2 to 4 sentences"),
    reasoning: z.string().max(900).default("").describe("How the evidence leads to the claim"),
    basis: z
      .enum(BASES)
      .describe('"record" (rests on quoted exhibits), "inference" (reasoned from them) or "general" (general knowledge, no exhibit)'),
    citations: z
      .array(
        z.object({
          exhibit: z.string().describe("Exhibit letter, e.g. 'A'"),
          quote: z.string().min(3).describe("Words copied exactly from that exhibit"),
        }),
      )
      .max(4)
      .default([])
      .describe("Up to 4 verbatim quotes; defaults to none"),
    objection: z
      .object({
        grounds: z.enum(GROUNDS).describe("Grounds for the objection"),
        explanation: z.string().min(4).max(600).describe("One sentence on the flaw"),
      })
      .nullable()
      .default(null)
      .describe("Objection to the opponent's latest standing argument, or null"),
  }),
  mcpTool: true,
  outputSchema: z.object({
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
  }),
  run: async (args, ctx) =>
    recordArgument({
      caseId: args.caseId,
      side: args.side,
      claim: args.claim,
      body: args.body,
      reasoning: args.reasoning,
      basis: args.basis,
      citations: args.citations,
      objection: args.objection,
      author: "agent",
      authorVia: viaOf(ctx),
    }),
});
