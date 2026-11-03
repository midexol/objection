import { defineAction, NoWriteError } from "@agent-native/core/action";
import { z } from "zod";

import { loadCaseFile } from "../server/lib/court/store.js";
import { recordMarkdown } from "../server/lib/court/verdict.js";

export default defineAction({
  description:
    "Export a ruled case's decision record as Markdown in Architecture Decision Record form: decision, strongest case for and against, dissent, revisit conditions, evidence and objections.",
  schema: z.object({ id: z.string().describe("Case id") }),
  http: { method: "GET" },
  readOnly: true,
  mcpTool: true,
  outputSchema: z.object({ filename: z.string(), markdown: z.string() }),
  run: async ({ id }) => {
    const file = await loadCaseFile(id);
    if (file.case.status !== "ruled") {
      throw new NoWriteError("There is no record to export until the judge rules.", {
        errorCode: "not_ruled",
        statusCode: 409,
      });
    }
    const slug = file.case.motion.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    return { filename: `decision-${slug}.md`, markdown: recordMarkdown(file) };
  },
});
