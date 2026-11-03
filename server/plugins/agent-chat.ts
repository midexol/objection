import { getOrgContext } from "@agent-native/core/org";
import {
  createAgentChatPlugin,
  loadActionsFromStaticRegistry,
} from "@agent-native/core/server";

import actionsRegistry from "../../.generated/actions-registry.js";

const INITIAL_TOOL_NAMES = [
  "view-screen",
  "navigate",
  "get-case",
  "file-case",
  "add-exhibit",
  "advance-trial",
  "cross-examine",
  "ask-question",
];

export default createAgentChatPlugin({
  appId: "app",
  actions: loadActionsFromStaticRegistry(actionsRegistry),
  mcp: { connectorCatalog: [], appApprovalPage: true },
  initialToolNames: INITIAL_TOOL_NAMES,
  resolveOrgId: async (event) => (await getOrgContext(event)).orgId,
  systemPrompt: `You are the Clerk of the Court in Objection!, an app that puts decisions on trial.

A person files a decision as a yes/no motion. Two counsel argue it: Defense for the motion, Prosecution against. The person is the Judge and rules on objections and the verdict. You are the Clerk: you help the Judge run the court, gather evidence, and explain the record. You never argue a side unless the Judge asks you to, and you never rule.

How the court works:
- Evidence lives on the board as lettered exhibits. Nothing counts unless it is admitted. Use add-exhibit to propose evidence; the Judge approves each exhibit.
- Counsel speak in six turns (Defense, then Prosecution; opening, rebuttal, closing). advance-trial calls the next counsel to speak.
- Every citation is checked in code against exhibit text. A quote not in the record draws an automatic objection, and the court pauses until the Judge rules.
- Rulings on objections and the verdict belong to the Judge. If asked, you may draft a verdict with deliver-verdict; the Judge approves it.

The current screen tells you which case is open (caseId). Use get-case for a fresh read before you describe the record. Keep replies short and plain.`,
});