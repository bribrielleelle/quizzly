// QuizWhiz database schema — all tables for all five phases.
// Fields for Phase 5 features (explanation, time_limit_seconds) exist from day one,
// so Phase 5 needs no migrations — it just activates them.

CREATE TABLE IF NOT EXISTS users (
  id            serial PRIMARY KEY,
  username      text NOT NULL UNIQUE,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,                 -- bcryptjs hash, never plain text
  role          text NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'teacher')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id                 serial PRIMARY KEY,
  title              text NOT NULL UNIQUE,
  subject            text NOT NULL,
  description        text NOT NULL DEFAULT '',
  time_limit_seconds int NOT NULL DEFAULT 30 CHECK (time_limit_seconds BETWEEN 15 AND 90),
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id            serial PRIMARY KEY,
  quiz_id       int NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  explanation   text,                           -- Phase 5: shown after each question
  position      int NOT NULL,                   -- order within the quiz
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS choices (
  id          serial PRIMARY KEY,
  question_id int NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label       char(1) NOT NULL CHECK (label IN ('A', 'B', 'C', 'D')),
  choice_text text NOT NULL,
  is_correct  boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS attempts (
  id             serial PRIMARY KEY,
  user_id        int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id        int NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score          int,                           -- frozen at completion time
  question_count int,                           -- frozen at completion time
  started_at     timestamptz NOT NULL DEFAULT now(),
  completed_at   timestamptz                    -- NULL while in progress:
                                                -- the single source of truth for "completed"
);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id          serial PRIMARY KEY,
  attempt_id  int NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id int NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  choice_id   int REFERENCES choices(id),       -- NULL on timeouts
  is_correct  boolean NOT NULL,
  timed_out   boolean NOT NULL DEFAULT false,
  answered_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for the queries we know are coming (history, leaderboards).
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions (quiz_id);
CREATE INDEX IF NOT EXISTS idx_choices_question ON choices (question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_user_completed
  ON attempts (quiz_id, user_id) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers (attempt_id);

-- Database-level guarantees:
-- 1. A question can have at most ONE correct choice (no app bug can break this).
CREATE UNIQUE INDEX IF NOT EXISTS idx_choices_one_correct
  ON choices (question_id) WHERE is_correct;

-- 2. A question's labels A-D are unique.
CREATE UNIQUE INDEX IF NOT EXISTS idx_choices_label
  ON choices (question_id, label);
