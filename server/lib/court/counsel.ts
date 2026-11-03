import { NoWriteError } from "@agent-native/core/action";
import { z } from "zod";

import {
  BASES,
  GROUNDS,
  GROUNDS_LABEL,
  SCHEDULE,
  SIDE_LABEL,
  opposing,
  type Side,
} from "../../../shared/court.js";
import { completeJson, counselAvailable } from "./llm.js";
import { recordArgument, assertTurn } from "./record.js";
import { rehearsedTurn, SURPRISE_WITNESS, type CounselTurn } from "./rehearsal.js";
import { loadCaseFile } from "./store.js";

const turnSchema = z.object({
  claim: z.string().min(4),
  body: z.string().min(10),
  reasoning: z.string().default(""),
  basis: z.enum(BASES).catch("inference"),
  citations: z
    .array(z.object({ exhibit: z.string(), quote: z.string() }))
    .default([]),
  objection: z
    .object({ grounds: z.enum(GROUNDS), explanation: z.string() })
    .nullish()
    .catch(null),
});

const BRIEF: Record<Side, string> = {
  defense:
    "You are DEFENSE counsel. You argue FOR the motion: the answer to the question is yes, do it.",
  prosecution:
    "You are PROSECUTION counsel. You argue AGAINST the motion: the answer to the question is no, or not now.",
};

const STAGE_GUIDE = {
  opening: "Opening statement: make your single strongest case from the record.",
  rebuttal:
    "Rebuttal: answer your opponent's latest argument directly, then add one new point.",
  closing:
    "Closing statement: summarise why your side should win, conceding what you cannot defend.",
};

function systemPrompt(side: Side): string {
  return [
    BRIEF[side],
    "A human judge will rule. Argue honestly and persuasively, in plain spoken English, 2 to 4 sentences.",
    "Rules of this court:",
    "1. Argue from the record. The record is the list of admitted exhibits. Do not invent facts.",
    "2. Every citation quote must be copied word for word from the exhibit text. Quotes are checked by code; a quote that is not in the exhibit draws an automatic objection and can get your argument struck.",
    '3. Set basis to "record" when your claim rests on quoted exhibits, "inference" when you reason from them, "general" when you rely on general knowledge with no exhibit.',
    "4. Object only when your opponent's latest argument has a real flaw: it assumes facts not in evidence, misquotes the record, relies on hearsay, speculates, or is irrelevant. Otherwise objection is null.",
    "5. If the judge asked you a question, answer it first.",
    "Reply with one JSON object and nothing else:",
    '{"claim": "one-sentence headline of your point", "body": "what you say to the judge", "reasoning": "how the evidence leads to the claim", "basis": "record|inference|general", "citations": [{"exhibit": "A", "quote": "exact words from Exhibit A"}], "objection": null}',
    `Objection, when used: {"grounds": one of ${GROUNDS.map((g) => `"${g}"`).join(", ")}, "explanation": "one sentence"}`,
  ].join("\n");
}

function casePrompt(file: Awaited<ReturnType<typeof loadCaseFile>>, side: Side): string {
  const slot = SCHEDULE[file.case.turn]!;
  const admitted = file.exhibits.filter((e) => e.status === "admitted");
  const struck = file.exhibits.filter((e) => e.status !== "admitted");
  const record = file.arguments
    .map(
      (a) =>
        `- ${SIDE_LABEL[a.side as Side]} (${a.stage})${a.status === "struck" ? " [STRUCK FROM THE RECORD]" : ""}: ${a.claim} ${a.body}`,
    )
    .join("\n");
  const rulings = file.objections
    .filter((o) => o.status !== "pending")
    .map(
      (o) =>
        `- ${SIDE_LABEL[o.raisedBy as Side]} objected (${GROUNDS_LABEL[o.grounds as keyof typeof GROUNDS_LABEL]}): ${o.status}`,
    )
    .join("\n");
  const question = file.questions.find((q) => q.side === side && !q.answered);
  return [
    `THE MOTION: ${file.case.motion}`,
    file.case.context ? `BACKGROUND: ${file.case.context}` : "",
    "",
    "ADMITTED EXHIBITS:",
    admitted.length
      ? admitted
          .map((e) => `Exhibit ${e.letter}: ${e.title}\n"""\n${e.content.slice(0, 2400)}\n"""`)
          .join("\n\n")
      : "(none yet: you may only argue from general knowledge, basis general)",
    struck.length
      ? `STRUCK EXHIBITS (do not cite): ${struck.map((e) => e.letter).join(", ")}`
      : "",
    "",
    "THE RECORD SO FAR:",
    record || "(no statements yet)",
    rulings ? `\nRULINGS ON OBJECTIONS:\n${rulings}` : "",
    question ? `\nTHE JUDGE ASKS YOU: ${question.question}` : "",
    "",
    `YOUR TASK: ${STAGE_GUIDE[slot.stage]} You speak for the ${SIDE_LABEL[side]}; your opponent is the ${SIDE_LABEL[opposing(side)]}.`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/** Run the next counsel turn and enter it into the record. */
export async function advanceTrial(caseId: string) {
  const { slot } = await assertTurn(caseId);
  const file = await loadCaseFile(caseId);
  const side = slot.side;
  const question = file.questions.find((q) => q.side === side && !q.answered);

  let turn: CounselTurn;
  let authorVia = "engine";
  if (file.case.rehearsed) {
    const witness = file.exhibits.find(
      (e) => e.status === "admitted" && e.title === SURPRISE_WITNESS.title,
    );
    turn = rehearsedTurn(file.case.turn, {
      witness: witness?.letter ?? null,
      question: question?.question ?? null,
    });
    authorVia = "rehearsal";
  } else {
    if (!counselAvailable().live) {
      throw new NoWriteError(
        "Counsel has no model to argue with. Add a free GROQ_API_KEY, GEMINI_API_KEY or OPENROUTER_API_KEY to the environment, or open the rehearsed sample case.",
        { errorCode: "counsel_unavailable", statusCode: 503 },
      );
    }
    const { value } = await completeJson(systemPrompt(side), casePrompt(file, side));
    const parsed = turnSchema.safeParse(value);
    if (!parsed.success) {
      throw new NoWriteError("Counsel's reply could not be read. Try again.", {
        errorCode: "counsel_unreadable",
        statusCode: 502,
      });
    }
    turn = parsed.data;
  }

  return recordArgument({
    caseId,
    side,
    claim: turn.claim,
    body: turn.body,
    reasoning: turn.reasoning,
    basis: turn.basis,
    citations: turn.citations,
    objection: turn.objection ?? null,
    author: "counsel",
    authorVia,
  });
}
