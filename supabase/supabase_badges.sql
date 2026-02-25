-- Add badges column to children table if it doesn't exist
ALTER TABLE children ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}';

-- Update RLS if needed (usually already allows updates by parent)
-- Ensure only the parent can modify their child's badges
DROP POLICY IF EXISTS "Parents can update their children's badges" ON children;
CREATE POLICY "Parents can update their children's badges"
  ON children
  FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());
