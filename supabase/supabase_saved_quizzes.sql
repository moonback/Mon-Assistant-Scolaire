CREATE TABLE IF NOT EXISTS saved_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  questions JSONB NOT NULL,
  current_question INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  wrong_topics TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saved_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their children's saved quizzes."
  ON saved_quizzes
  FOR ALL
  USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );

-- Function to handle resume correctly
CREATE OR REPLACE FUNCTION handle_updated_at_saved_quizzes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_saved_quiz_updated
  BEFORE UPDATE ON saved_quizzes
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at_saved_quizzes();
