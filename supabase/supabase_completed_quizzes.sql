CREATE TABLE IF NOT EXISTS completed_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  questions JSONB NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  stars_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE completed_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their children's completed quizzes."
  ON completed_quizzes
  FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their children's completed quizzes."
  ON completed_quizzes
  FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );
