import { defineAction, fail } from "@agent-native/core/action";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { REHEARSAL } from "../server/lib/court/rehearsal.js";
import { actorOf, logTranscript, newId, viaOf } from "../server/lib/court/store.js";

export default defineAction({
  description:
    "Open a fresh copy of the rehearsed sample case (MongoDB to Postgres before launch). It needs no model key: counsel's statements are rehearsed, but every citation is still verified and objections still pause for the judge.",
  schema: z.object({}),
  outputSchema: z.object({ id: z.string(), path: z.string(), message: z.string() }),
  link: ({ result }) => ({ url: result.path, label: "Open the courtroom" }),
  run: async (_args, ctx) => {
    const ownerEmail = ctx?.userEmail ?? fail("Sign in to open a case.", { statusCode: 401 });
    const orgId = ctx?.orgId ?? null;
    const id = newId("case");
    const db = getDb();
    const now = Date.now();
    await db.insert(schema.cases).values({
      id,
      motion: REHEARSAL.motion,
      context: REHEARSAL.context,
      caseType: REHEARSAL.caseType,
      status: "filed",
      rehearsed: 1,
      ownerEmail,
      orgId,
      visibility: orgId ? "org" : "private",
      createdAt: new Date(now).toISOString(),
    });
    await logTranscript(id, actorOf(ctx), viaOf(ctx), "opened the rehearsed sample case");
    for (const [i, e] of REHEARSAL.exhibits.entries()) {
      const letter = String.fromCharCode(65 + i);
      await db.insert(schema.exhibits).values({
        id: newId("ex"),
        caseId: id,
        letter,
        title: e.title,
        content: e.content,
        source: e.source,
        addedBy: "clerk",
        addedVia: "sample",
        createdAt: new Date(now + i + 1).toISOString(),
      });
      await logTranscript(id, "clerk", "sample", `filed Exhibit ${letter}`);
    }
    return { id, path: `/court/${id}`, message: "The sample case is ready. Begin the trial when you are." };
  },
});
