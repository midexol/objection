import { sql } from "drizzle-orm";
import { integer, pgTable, text } from "drizzle-orm/pg-core";
import {
  createSharesTable,
  ownableColumns,
} from "@agent-native/core/db/schema";

/** A decision put on trial. Status walks filed → in_session → deliberation → ruled. */
export const cases = pgTable("court_cases", {
  id: text("id").primaryKey(),
  motion: text("motion").notNull(),
  context: text("context").notNull().default(""),
  caseType: text("case_type").notNull().default("custom"),
  status: text("status").notNull().default("filed"),
  turn: integer("turn").notNull().default(0),
  rehearsed: integer("rehearsed").notNull().default(0),
  decision: text("decision"),
  ruling: text("ruling"),
  appealConditions: text("appeal_conditions").notNull().default("[]"),
  ruledAt: text("ruled_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  ...ownableColumns(),
});

export const caseShares = createSharesTable("court_case_shares");

/** Evidence on the board. Nothing counts unless it is admitted here. */
export const exhibits = pgTable("court_exhibits", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  letter: text("letter").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull().default(""),
  status: text("status").notNull().default("admitted"),
  addedBy: text("added_by").notNull().default("judge"),
  addedVia: text("added_via").notNull().default("ui"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});

/** One statement by counsel. Citations are verified against exhibit text in code. */
export const counselArguments = pgTable("court_arguments", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  turn: integer("turn").notNull(),
  side: text("side").notNull(),
  stage: text("stage").notNull(),
  claim: text("claim").notNull(),
  body: text("body").notNull(),
  reasoning: text("reasoning").notNull().default(""),
  basis: text("basis").notNull().default("record"),
  citations: text("citations").notNull().default("[]"),
  answersQuestionId: text("answers_question_id"),
  status: text("status").notNull().default("standing"),
  author: text("author").notNull().default("counsel"),
  authorVia: text("author_via").notNull().default("engine"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});

export const objections = pgTable("court_objections", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  raisedBy: text("raised_by").notNull(),
  targetArgumentId: text("target_argument_id").notNull(),
  grounds: text("grounds").notNull(),
  explanation: text("explanation").notNull(),
  origin: text("origin").notNull().default("counsel"),
  status: text("status").notNull().default("pending"),
  ruledAt: text("ruled_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});

/** Questions the judge puts to counsel; the addressed side answers on its next turn. */
export const questions = pgTable("court_questions", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  side: text("side").notNull(),
  question: text("question").notNull(),
  answered: integer("answered").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});

/** Court transcript: every act, who did it and from which surface. */
export const transcript = pgTable("court_transcript", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  actor: text("actor").notNull(),
  via: text("via").notNull(),
  entry: text("entry").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});
