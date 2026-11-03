import { NoWriteError } from "@agent-native/core/action";
import { and, desc, eq } from "drizzle-orm";

import {
  GROUNDS_LABEL,
  opposing,
  SCHEDULE,
  SIDE_LABEL,
  TOTAL_TURNS,
  type Basis,
  type Citation,
  type Grounds,
  type Side,
} from "../../../shared/court.js";
import { getDb, schema } from "../../db/index.js";
import {
  logTranscript,
  newId,
  pendingObjection,
  requireCase,
} from "./store.js";
import { quoteAppearsIn } from "./verify.js";

export interface ArgumentInput {
  caseId: string;
  side: Side;
  claim: string;
  body: string;
  reasoning: string;
  basis: Basis;
  citations: { exhibit: string; quote: string }[];
  objection?: { grounds: Grounds; explanation: string } | null;
  author: string;
  authorVia: string;
}

/** Throws unless it is `side`'s turn and the court is not paused. */
export async function assertTurn(caseId: string, side?: Side) {
  const kase = await requireCase(caseId, "editor");
  if (kase.status === "ruled") {
    throw new NoWriteError("This case has been ruled on. The record is closed.", {
      errorCode: "case_closed",
      statusCode: 409,
    });
  }
  if (kase.turn >= TOTAL_TURNS) {
    throw new NoWriteError(
      "Closing statements are done. The court awaits the judge's ruling.",
      { errorCode: "awaiting_ruling", statusCode: 409 },
    );
  }
  const pending = await pendingObjection(caseId);
  if (pending) {
    throw new NoWriteError(
      "The court is paused: an objection is pending. The judge must sustain or overrule it before counsel continues.",
      { errorCode: "objection_pending", statusCode: 409, details: { objectionId: pending.id } },
    );
  }
  const slot = SCHEDULE[kase.turn]!;
  if (side && slot.side !== side) {
    throw new NoWriteError(
      `It is ${SIDE_LABEL[slot.side]}'s turn (${slot.stage}), not ${SIDE_LABEL[side]}'s.`,
      { errorCode: "not_your_turn", statusCode: 409, details: { expectedSide: slot.side } },
    );
  }
  return { kase, slot };
}

/**
 * Enter one counsel statement into the record. Every citation is checked
 * against the exhibit text; a quote that is not in the record draws an
 * automatic objection from opposing counsel.
 */
export async function recordArgument(input: ArgumentInput) {
  const db = getDb();
  const { kase, slot } = await assertTurn(input.caseId, input.side);

  const exhibitRows = await db
    .select()
    .from(schema.exhibits)
    .where(eq(schema.exhibits.caseId, input.caseId));
  const byLetter = new Map(exhibitRows.map((e) => [e.letter.toUpperCase(), e]));

  const failures: string[] = [];
  const citations: Citation[] = input.citations.slice(0, 4).map((c) => {
    const letter = c.exhibit.replace(/^exhibit\s+/i, "").trim().toUpperCase();
    const exhibit = byLetter.get(letter);
    let verified = false;
    if (!exhibit) failures.push(`Exhibit ${letter} is not on the board`);
    else if (exhibit.status !== "admitted")
      failures.push(`Exhibit ${letter} was struck by the judge`);
    else if (!quoteAppearsIn(c.quote, `${exhibit.title}\n${exhibit.content}`))
      failures.push(`"${c.quote.slice(0, 90)}" does not appear in Exhibit ${letter}`);
    else verified = true;
    return { exhibit: letter, quote: c.quote, verified };
  });

  const [openQuestion] = await db
    .select()
    .from(schema.questions)
    .where(
      and(
        eq(schema.questions.caseId, input.caseId),
        eq(schema.questions.side, input.side),
        eq(schema.questions.answered, 0),
      ),
    )
    .orderBy(desc(schema.questions.createdAt))
    .limit(1);

  const argumentId = newId("arg");
  const now = new Date().toISOString();
  await db.insert(schema.counselArguments).values({
    id: argumentId,
    caseId: input.caseId,
    turn: kase.turn,
    side: input.side,
    stage: slot.stage,
    claim: input.claim.slice(0, 220),
    body: input.body.slice(0, 1400),
    reasoning: input.reasoning.slice(0, 900),
    basis: input.basis,
    citations: JSON.stringify(citations),
    answersQuestionId: openQuestion?.id ?? null,
    author: input.author,
    authorVia: input.authorVia,
    createdAt: now,
  });
  if (openQuestion) {
    await db
      .update(schema.questions)
      .set({ answered: 1 })
      .where(eq(schema.questions.id, openQuestion.id));
  }

  await logTranscript(
    input.caseId,
    input.side,
    input.authorVia,
    `${slot.stage} statement${citations.length ? `, citing ${[...new Set(citations.map((c) => `Exhibit ${c.exhibit}`))].join(", ")}` : ""}`,
  );

  // Objections: the court's own citation check outranks counsel's.
  let objection: { id: string; grounds: Grounds; raisedBy: Side; origin: string } | null =
    null;
  const opponent = opposing(input.side);
  if (failures.length > 0) {
    const grounds: Grounds = failures.some((f) => f.includes("does not appear"))
      ? "misquotes_the_record"
      : "facts_not_in_evidence";
    objection = { id: newId("obj"), grounds, raisedBy: opponent, origin: "court" };
    await db.insert(schema.objections).values({
      id: objection.id,
      caseId: input.caseId,
      raisedBy: opponent,
      targetArgumentId: argumentId,
      grounds,
      explanation: `Citation check failed. ${failures.join(". ")}.`,
      origin: "court",
      createdAt: new Date(Date.now() + 1).toISOString(),
    });
  } else if (input.objection) {
    const [target] = await db
      .select()
      .from(schema.counselArguments)
      .where(
        and(
          eq(schema.counselArguments.caseId, input.caseId),
          eq(schema.counselArguments.side, opponent),
          eq(schema.counselArguments.status, "standing"),
        ),
      )
      .orderBy(desc(schema.counselArguments.turn))
      .limit(1);
    if (target) {
      objection = {
        id: newId("obj"),
        grounds: input.objection.grounds,
        raisedBy: input.side,
        origin: "counsel",
      };
      await db.insert(schema.objections).values({
        id: objection.id,
        caseId: input.caseId,
        raisedBy: input.side,
        targetArgumentId: target.id,
        grounds: input.objection.grounds,
        explanation: input.objection.explanation.slice(0, 600),
        origin: "counsel",
        createdAt: new Date(Date.now() + 1).toISOString(),
      });
    }
  }
  if (objection) {
    await logTranscript(
      input.caseId,
      objection.raisedBy,
      objection.origin === "court" ? "court" : input.authorVia,
      `objection: ${GROUNDS_LABEL[objection.grounds].toLowerCase()}`,
    );
  }

  const nextTurn = kase.turn + 1;
  const status = nextTurn >= TOTAL_TURNS ? "deliberation" : "in_session";
  await db
    .update(schema.cases)
    .set({ turn: nextTurn, status })
    .where(eq(schema.cases.id, input.caseId));

  return {
    id: argumentId,
    side: input.side,
    stage: slot.stage,
    verifiedCitations: citations.filter((c) => c.verified).length,
    failedCitations: failures,
    objection,
    nextTurn,
    status,
    message: objection
      ? `Recorded. ${SIDE_LABEL[objection.raisedBy]} objects: ${GROUNDS_LABEL[objection.grounds]}. The court pauses for the judge.`
      : `Recorded the ${SIDE_LABEL[input.side]} ${slot.stage} statement.`,
  };
}
