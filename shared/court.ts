/** Isomorphic court vocabulary shared by actions, the engine and the UI. */

export const SIDES = ["defense", "prosecution"] as const;
export type Side = (typeof SIDES)[number];

export const STAGES = ["opening", "rebuttal", "closing"] as const;
export type Stage = (typeof STAGES)[number];

/** Six turns: each side opens, rebuts and closes. Defense always speaks first. */
export const SCHEDULE: { side: Side; stage: Stage; round: number }[] = [
  { side: "defense", stage: "opening", round: 1 },
  { side: "prosecution", stage: "opening", round: 1 },
  { side: "defense", stage: "rebuttal", round: 2 },
  { side: "prosecution", stage: "rebuttal", round: 2 },
  { side: "defense", stage: "closing", round: 3 },
  { side: "prosecution", stage: "closing", round: 3 },
];
export const TOTAL_TURNS = SCHEDULE.length;

export const GROUNDS = [
  "facts_not_in_evidence",
  "misquotes_the_record",
  "hearsay",
  "speculation",
  "relevance",
] as const;
export type Grounds = (typeof GROUNDS)[number];

export const GROUNDS_LABEL: Record<Grounds, string> = {
  facts_not_in_evidence: "Claims something the evidence does not show",
  misquotes_the_record: "Quote does not match the evidence",
  hearsay: "Second-hand claim",
  speculation: "Guesswork",
  relevance: "Off topic",
};

export const BASES = ["record", "inference", "general"] as const;
export type Basis = (typeof BASES)[number];

export const BASIS_LABEL: Record<Basis, string> = {
  record: "From the evidence",
  inference: "Reasoned from the evidence",
  general: "General knowledge, no source",
};

export const CASE_TYPES = [
  "architecture",
  "ship",
  "build_vs_buy",
  "hire",
  "custom",
] as const;
export type CaseType = (typeof CASE_TYPES)[number];

export const CASE_TYPE_META: Record<
  CaseType,
  { label: string; prompt: string; example: string }
> = {
  architecture: {
    label: "Architecture decision",
    prompt: "A technical choice the team will live with for years.",
    example: "Should we move from REST to GraphQL for the mobile app?",
  },
  ship: {
    label: "Ship or wait",
    prompt: "A release that could go out now or hold for more work.",
    example: "Should we ship the new checkout on Friday?",
  },
  build_vs_buy: {
    label: "Build vs buy",
    prompt: "Make it in-house or pay for a vendor.",
    example: "Should we build our own auth instead of paying for Auth0?",
  },
  hire: {
    label: "Hire or hold",
    prompt: "A headcount or a specific candidate.",
    example: "Should we hire a second backend engineer this quarter?",
  },
  custom: {
    label: "Anything else",
    prompt: "Any decision that is expensive to get wrong.",
    example: "Should I accept the offer from the Lagos fintech?",
  },
};

export const DECISIONS = ["granted", "granted_in_part", "denied"] as const;
export type Decision = (typeof DECISIONS)[number];

export const DECISION_LABEL: Record<Decision, string> = {
  granted: "Yes",
  granted_in_part: "Yes, with conditions",
  denied: "No",
};

export const SIDE_LABEL: Record<Side, string> = {
  defense: "Defense",
  prosecution: "Prosecution",
};

export function opposing(side: Side): Side {
  return side === "defense" ? "prosecution" : "defense";
}

export interface Citation {
  exhibit: string;
  quote: string;
  verified: boolean;
}

/** Plain-language name for the surface that performed an act. */
export function surfaceLabel(via: string): string {
  switch (via) {
    case "frontend":
    case "ui":
      return "ui";
    case "tool":
      return "agent";
    case "mcp":
    case "webmcp":
      return "mcp";
    case "a2a":
      return "a2a";
    case "cli":
      return "cli";
    case "automation":
      return "automation";
    case "engine":
      return "counsel";
    case "court":
      return "court";
    default:
      return via;
  }
}
