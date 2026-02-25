-- Table for friendly competitions between siblings
CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenger_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    opponent_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    activity_type TEXT NOT NULL, -- 'quiz_score', 'stars_earned', 'time_studied'
    goal_value INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending_acceptance', -- 'pending_acceptance', 'pending_approval', 'active', 'completed', 'canceled'
    winner_id UUID REFERENCES children(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    CONSTRAINT different_children CHECK (challenger_id <> opponent_id)
);

-- RLS for competitions
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can manage family competitions" ON competitions;
CREATE POLICY "Parents can manage family competitions"
    ON competitions
    FOR ALL
    TO authenticated
    USING (parent_id = auth.uid())
    WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Children can see their own competitions" ON competitions;
CREATE POLICY "Children can see their own competitions"
    ON competitions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id IN (challenger_id, opponent_id) 
            AND children.parent_id = auth.uid()
        )
    );

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_competitions_parent ON competitions(parent_id);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
