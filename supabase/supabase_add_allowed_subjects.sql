-- Migration: Add allowed_subjects to children table
ALTER TABLE children ADD COLUMN IF NOT EXISTS allowed_subjects text[] DEFAULT '{Mathématiques, Français, Sciences, Histoire, Géographie, Anglais, Nature, Art, Code, Espace}';

-- Update documentation entry in schema logic if needed
COMMENT ON COLUMN children.allowed_subjects IS 'List of subjects allowed for this child profile.';
