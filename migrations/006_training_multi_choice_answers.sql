CREATE TABLE IF NOT EXISTS quiz_answer_multi_choices (
  answer_id UUID NOT NULL REFERENCES quiz_answers(id) ON DELETE CASCADE,
  choice_id UUID NOT NULL REFERENCES question_choices(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (answer_id, choice_id)
);

CREATE INDEX IF NOT EXISTS quiz_answer_multi_choices_choice_idx
  ON quiz_answer_multi_choices (choice_id);
