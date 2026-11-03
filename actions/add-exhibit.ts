import { defineAction, NoWriteError } from "@agent-native/core/action";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import {
  actorOf,
  logTranscript,
  newId,
  nextExhibitLetter,
  requireCase,
  viaOf,
} from "../server/lib/court/store.js";

export default defineAction({
  description:
    "Enter a new exhibit (evidence) on a case's board. Counsel may then cite it word for word. When an agent enters evidence, the judge must approve the specific exhibit first; nothing counts unless the judge lets it in.",
  schema: z.object({
    caseId: z.string().describe("Case id"),
    title: z.string().min(1).max(140).describe("Short exhibit title, e.g. 'Q3 incident log'"),
    content: z.string().min(1).max(20000).describe("Full text of the evidence"),
    source: z.string().max(400).default("").describe("File name or URL it came from; defaults to empty"),
  }),
  // The judge admits evidence. An agent may propose it, but a person approves each one.
  needsApproval: (_args, ctx) => ctx?.caller !== "frontend" && ctx?.caller !== "cli",
  outputSchema: z.object({
    id: z.string(),
    letter: z.string(),
    message: z.string(),
  }),
  run: async (args, ctx) => {
    const kase = await requireCase(args.caseId, "editor");
    if (kase.status === "ruled") {
      throw new NoWriteError("The record is closed; this case has been ruled on.", {
        errorCode: "case_closed",
        statusCode: 409,
      });
    }
    const letter = await nextExhibitLetter(args.caseId);
    const id = newId("ex");
    const actor = actorOf(ctx);
    const via = viaOf(ctx);
    await getDb().insert(schema.exhibits).values({
      id,
      caseId: args.caseId,
      letter,
      title: args.title.trim(),
      content: args.content,
      source: args.source,
      addedBy: actor,
      addedVia: via,
      createdAt: new Date().toISOString(),
    });
    await logTranscript(args.caseId, actor, via, `entered Exhibit ${letter}: ${args.title.trim()}`);
    return { id, letter, message: `Exhibit ${letter} admitted. Both counsel can now cite it.` };
  },
});
