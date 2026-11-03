import type { ActionRunContext } from "@agent-native/core/action";
import { NoWriteError } from "@agent-native/core/action";
import { assertAccess } from "@agent-native/core/sharing";
import { and, asc, eq } from "drizzle-orm";

import { surfaceLabel, type Citation } from "../../../shared/court.js";
import { getDb, schema } from "../../db/index.js";
import { computeWeight } from "./weight.js";

export const RESOURCE_TYPE = "court-case";

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

/** The surface that called an action, in transcript vocabulary. */
export function viaOf(ctx?: ActionRunContext): string {
  return surfaceLabel(ctx?.caller ?? "engine");
}

/** Who performed an act. A person in the UI is the judge; agents are the clerk. */
export function actorOf(ctx?: ActionRunContext): string {
  const caller = ctx?.caller;
  if (caller === "frontend" || caller === "cli") return "judge";
  return "clerk";
}

export async function requireCase(
  caseId: string,
  minRole: "viewer" | "editor" = "viewer",
) {
  try {
    await assertAccess(RESOURCE_TYPE, caseId, minRole);
  } catch {
    throw new NoWriteError(`No case with id ${caseId} is open to you.`, {
      errorCode: "case_not_found",
      statusCode: 404,
    });
  }
  // guard:allow-unscoped — access to this case id was checked by assertAccess above
  const [row] = await getDb()
    .select()
    .from(schema.cases)
    .where(eq(schema.cases.id, caseId))
    .limit(1);
  if (!row) {
    throw new NoWriteError(`No case with id ${caseId} exists.`, {
      errorCode: "case_not_found",
      statusCode: 404,
    });
  }
  return row;
}

export async function logTranscript(
  caseId: string,
  actor: string,
  via: string,
  entry: string,
) {
  await getDb().insert(schema.transcript).values({
    id: newId("tr"),
    caseId,
    actor,
    via,
    entry,
    createdAt: new Date().toISOString(),
  });
}

export async function nextExhibitLetter(caseId: string): Promise<string> {
  const rows = await getDb()
    .select({ letter: schema.exhibits.letter })
    .from(schema.exhibits)
    .where(eq(schema.exhibits.caseId, caseId));
  const n = rows.length;
  // A..Z, then AA, AB...
  return n < 26
    ? String.fromCharCode(65 + n)
    : String.fromCharCode(64 + Math.floor(n / 26)) +
        String.fromCharCode(65 + (n % 26));
}

export function parseCitations(raw: string): Citation[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function parseList(raw: string): string[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

/** Everything a courtroom screen, agent or export needs about one case. */
export async function loadCaseFile(caseId: string) {
  const db = getDb();
  const kase = await requireCase(caseId);
  const [exhibitRows, argRows, objRows, questionRows, transcriptRows] =
    await Promise.all([
      db
        .select()
        .from(schema.exhibits)
        .where(eq(schema.exhibits.caseId, caseId))
        .orderBy(asc(schema.exhibits.createdAt)),
      db
        .select()
        .from(schema.counselArguments)
        .where(eq(schema.counselArguments.caseId, caseId))
        .orderBy(asc(schema.counselArguments.turn), asc(schema.counselArguments.createdAt)),
      db
        .select()
        .from(schema.objections)
        .where(eq(schema.objections.caseId, caseId))
        .orderBy(asc(schema.objections.createdAt)),
      db
        .select()
        .from(schema.questions)
        .where(eq(schema.questions.caseId, caseId))
        .orderBy(asc(schema.questions.createdAt)),
      db
        .select()
        .from(schema.transcript)
        .where(eq(schema.transcript.caseId, caseId))
        .orderBy(asc(schema.transcript.createdAt))
        .limit(400),
    ]);

  const args = argRows.map((a) => ({
    ...a,
    citations: parseCitations(a.citations),
  }));
  const weight = computeWeight(args, objRows);
  const citeCounts: Record<string, { defense: number; prosecution: number }> =
    {};
  for (const a of args) {
    for (const c of a.citations) {
      if (!c.verified) continue;
      const counts = (citeCounts[c.exhibit] ??= { defense: 0, prosecution: 0 });
      counts[a.side as "defense" | "prosecution"]++;
    }
  }

  return {
    case: {
      ...kase,
      appealConditions: parseList(kase.appealConditions),
      rehearsed: kase.rehearsed === 1,
    },
    exhibits: exhibitRows.map((e) => ({
      ...e,
      citedBy: citeCounts[e.letter] ?? { defense: 0, prosecution: 0 },
    })),
    arguments: args,
    objections: objRows,
    questions: questionRows.map((q) => ({ ...q, answered: q.answered === 1 })),
    transcript: transcriptRows,
    weight,
  };
}

export type CaseFile = Awaited<ReturnType<typeof loadCaseFile>>;

export async function pendingObjection(caseId: string) {
  const [row] = await getDb()
    .select()
    .from(schema.objections)
    .where(
      and(
        eq(schema.objections.caseId, caseId),
        eq(schema.objections.status, "pending"),
      ),
    )
    .limit(1);
  return row ?? null;
}
