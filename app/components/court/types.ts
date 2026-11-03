import type { Citation } from "@shared/court";

export interface CourtCase {
  id: string;
  motion: string;
  context: string;
  caseType: string;
  status: string;
  turn: number;
  rehearsed: boolean;
  decision: string | null;
  ruling: string | null;
  appealConditions: string[];
  ruledAt: string | null;
  createdAt: string;
}

export interface Exhibit {
  id: string;
  caseId: string;
  letter: string;
  title: string;
  content: string;
  source: string;
  status: string;
  addedBy: string;
  addedVia: string;
  createdAt: string;
  citedBy: { defense: number; prosecution: number };
}

export interface Argument {
  id: string;
  caseId: string;
  turn: number;
  side: "defense" | "prosecution";
  stage: "opening" | "rebuttal" | "closing";
  claim: string;
  body: string;
  reasoning: string;
  basis: "record" | "inference" | "general";
  citations: Citation[];
  answersQuestionId: string | null;
  status: string;
  author: string;
  authorVia: string;
  createdAt: string;
}

export interface Objection {
  id: string;
  caseId: string;
  raisedBy: "defense" | "prosecution";
  targetArgumentId: string;
  grounds: string;
  explanation: string;
  origin: string;
  status: string;
  ruledAt: string | null;
  createdAt: string;
}

export interface Question {
  id: string;
  caseId: string;
  side: "defense" | "prosecution";
  question: string;
  answered: boolean;
  createdAt: string;
}

export interface TranscriptEntry {
  id: string;
  caseId: string;
  actor: string;
  via: string;
  entry: string;
  createdAt: string;
}

export interface CaseFile {
  case: CourtCase;
  exhibits: Exhibit[];
  arguments: Argument[];
  objections: Objection[];
  questions: Question[];
  transcript: TranscriptEntry[];
  weight: { defense: number; prosecution: number; defensePct: number };
  counsel: { live: boolean; providers: string[] };
}
