import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { counselAvailable } from "../server/lib/court/llm.js";
import { loadCaseFile } from "../server/lib/court/store.js";

export default defineAction({
  description:
    "Read one case in full: the motion, every exhibit (letter, text, admitted or struck), every counsel argument with its verified citations, objections and rulings, open questions to counsel, the court transcript and the current weight of argument.",
  schema: z.object({
    id: z.string().describe("Case id, e.g. case_ab12cd34ef56"),
  }),
  http: { method: "GET" },
  readOnly: true,
  mcpTool: true,
  outputSchema: z
    .object({
      case: z.object({ id: z.string(), motion: z.string(), status: z.string() }).passthrough(),
      exhibits: z.array(z.any()),
      arguments: z.array(z.any()),
      objections: z.array(z.any()),
      questions: z.array(z.any()),
      transcript: z.array(z.any()),
      weight: z.object({
        defense: z.number(),
        prosecution: z.number(),
        defensePct: z.number(),
      }),
      counsel: z.object({ live: z.boolean(), providers: z.array(z.string()) }),
    })
    .passthrough(),
  run: async ({ id }) => {
    const file = await loadCaseFile(id);
    return { ...file, counsel: counselAvailable() };
  },
});
