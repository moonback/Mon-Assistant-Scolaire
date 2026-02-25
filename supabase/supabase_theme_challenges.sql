-- Migration to add theme support to daily challenges
-- Run this in your Supabase SQL Editor

-- 1. Add theme column
ALTER TABLE public.daily_challenges ADD COLUMN IF NOT EXISTS theme text DEFAULT 'Général';

-- 2. Update unique constraint to include theme
-- First, drop the old constraint
ALTER TABLE public.daily_challenges DROP CONSTRAINT IF EXISTS daily_challenges_date_grade_level_key;

-- Then add the new one
ALTER TABLE public.daily_challenges ADD CONSTRAINT daily_challenges_date_grade_level_theme_key UNIQUE (date, grade_level, theme);
