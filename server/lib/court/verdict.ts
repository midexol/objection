import {
  BASIS_LABEL,
  DECISION_LABEL,
  GROUNDS_LABEL,
  SIDE_LABEL,
  type Basis,
  type Decision,
  type Grounds,
  type Side,
} from "../../../shared/court.js";
import type { CaseFile } from "./store.js";

type Arg = CaseFile["arguments"][number];

function strength(a: Arg): number {
  const base = a.basis === "record" ? 3 : a.basis === "inference" ? 2 : 1;
  return base + Math.min(3, a.citations.filter((c) => c.verified).length);
}

export function strongest(file: CaseFile, side: Side): Arg | null {
  const standing = file.arguments.filter((a) => a.side === side && a.status === "standing");
  if (standing.length === 0) return null;
  return standing.reduce((best, a) => (strength(a) >= strength(best) ? a : best));
}

/** The side whose strongest point is printed as the dissent. */
export function dissentingSide(file: CaseFile, decision: Decision): Side {
  if (decision === "granted") return "prosecution";
  if (decision === "denied") return "defense";
  return file.weight.defense >= file.weight.prosecution ? "prosecution" : "defense";
}

/** The decision record as an Architecture Decision Record in Markdown. */
export function recordMarkdown(file: CaseFile): string {
  const k = file.case;
  const decision = (k.decision ?? "denied") as Decision;
  const forArg = strongest(file, "defense");
  const againstArg = strongest(file, "prosecution");
  const dissentSide = dissentingSide(file, decision);
  const shown = dissentSide === "defense" ? forArg : againstArg;
  const pool = file.arguments.filter(
    (a) => a.side === dissentSide && a.status === "standing" && a.id !== shown?.id,
  );
  const dissent = pool.length ? pool.reduce((b, a) => (a.turn > b.turn ? a : b)) : null;
  const ex = (letter: string) => file.exhibits.find((e) => e.letter === letter);
  const cite = (a: Arg | null) =>
    a && a.citations.length
      ? a.citations
          .filter((c) => c.verified)
          .map((c) => `  - Exhibit ${c.exhibit} (${ex(c.exhibit)?.title ?? ""}): "${c.quote}"`)
          .join("\n")
      : "  - (no verified citations)";
  const lines = [
    `# Decision record: ${k.motion}`,
    "",
    `- Status: ${DECISION_LABEL[decision]}`,
    `- Ruled: ${k.ruledAt ? new Date(k.ruledAt).toUTCString() : "pending"}`,
    `- Weight of argument at ruling: Defense ${file.weight.defensePct}% / Prosecution ${100 - file.weight.defensePct}%`,
    "",
    "## Context",
    "",
    k.context || "(none given)",
    "",
    "## Decision",
    "",
    k.ruling ?? "",
    "",
    "## Strongest case for",
    "",
    forArg ? `${forArg.claim} (${BASIS_LABEL[forArg.basis as Basis]})` : "(none standing)",
    cite(forArg),
    "",
    "## Strongest case against",
    "",
    againstArg ? `${againstArg.claim} (${BASIS_LABEL[againstArg.basis as Basis]})` : "(none standing)",
    cite(againstArg),
    "",
    `## Dissent (${SIDE_LABEL[dissentSide]})`,
    "",
    dissent ? dissent.body : "(none)",
    "",
    "## Revisit this decision if",
    "",
    ...(k.appealConditions.length ? k.appealConditions.map((c) => `- ${c}`) : ["- (no conditions set)"]),
    "",
    "## Evidence",
    "",
    ...file.exhibits.map(
      (e) => `- Exhibit ${e.letter}: ${e.title}${e.status !== "admitted" ? " (struck)" : ""}${e.source ? ` [${e.source}]` : ""}`,
    ),
    "",
    "## Objections on the record",
    "",
    ...(file.objections.length
      ? file.objections.map(
          (o) =>
            `- ${SIDE_LABEL[o.raisedBy as Side]}: ${GROUNDS_LABEL[o.grounds as Grounds] ?? o.grounds}, ${o.status}`,
        )
      : ["- (none)"]),
    "",
    "_Argued and recorded in Objection!_",
  ];
  return lines.join("\n");
}
