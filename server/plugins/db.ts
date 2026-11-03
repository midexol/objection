import { runMigrations } from "@agent-native/core/db";

export default runMigrations(
  [
    {
      version: 1,
      name: "court-core",
      sql: `CREATE TABLE IF NOT EXISTS court_cases (
  id TEXT PRIMARY KEY,
  motion TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT '',
  case_type TEXT NOT NULL DEFAULT 'custom',
  status TEXT NOT NULL DEFAULT 'filed',
  turn INTEGER NOT NULL DEFAULT 0,
  rehearsed INTEGER NOT NULL DEFAULT 0,
  decision TEXT,
  ruling TEXT,
  appeal_conditions TEXT NOT NULL DEFAULT '[]',
  ruled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (now()),
  owner_email TEXT NOT NULL DEFAULT 'local@localhost',
  org_id TEXT,
  visibility TEXT NOT NULL DEFAULT 'private'
);
CREATE TABLE IF NOT EXISTS court_case_shares (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  principal_type TEXT NOT NULL,
  principal_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (now()),
  notified_at TEXT
);
CREATE TABLE IF NOT EXISTS court_exhibits (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  letter TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'admitted',
  added_by TEXT NOT NULL DEFAULT 'judge',
  added_via TEXT NOT NULL DEFAULT 'ui',
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE TABLE IF NOT EXISTS court_arguments (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  turn INTEGER NOT NULL,
  side TEXT NOT NULL,
  stage TEXT NOT NULL,
  claim TEXT NOT NULL,
  body TEXT NOT NULL,
  reasoning TEXT NOT NULL DEFAULT '',
  basis TEXT NOT NULL DEFAULT 'record',
  citations TEXT NOT NULL DEFAULT '[]',
  answers_question_id TEXT,
  status TEXT NOT NULL DEFAULT 'standing',
  author TEXT NOT NULL DEFAULT 'counsel',
  author_via TEXT NOT NULL DEFAULT 'engine',
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE TABLE IF NOT EXISTS court_objections (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  raised_by TEXT NOT NULL,
  target_argument_id TEXT NOT NULL,
  grounds TEXT NOT NULL,
  explanation TEXT NOT NULL,
  origin TEXT NOT NULL DEFAULT 'counsel',
  status TEXT NOT NULL DEFAULT 'pending',
  ruled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE TABLE IF NOT EXISTS court_questions (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  side TEXT NOT NULL,
  question TEXT NOT NULL,
  answered INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE TABLE IF NOT EXISTS court_transcript (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  via TEXT NOT NULL,
  entry TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE INDEX IF NOT EXISTS court_cases_owner_idx ON court_cases (owner_email, org_id, created_at);
CREATE INDEX IF NOT EXISTS court_case_shares_resource_idx ON court_case_shares (resource_id, principal_type, principal_id);
CREATE INDEX IF NOT EXISTS court_exhibits_case_idx ON court_exhibits (case_id, letter);
CREATE INDEX IF NOT EXISTS court_arguments_case_idx ON court_arguments (case_id, turn);
CREATE INDEX IF NOT EXISTS court_objections_case_idx ON court_objections (case_id, status);
CREATE INDEX IF NOT EXISTS court_questions_case_idx ON court_questions (case_id, answered);
CREATE INDEX IF NOT EXISTS court_transcript_case_idx ON court_transcript (case_id, created_at)`,
    },
  ],
  { table: "court_app_migrations" },
);
