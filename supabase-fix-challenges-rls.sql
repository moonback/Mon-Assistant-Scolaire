-- Fix for daily_challenges RLS policy
-- Run this in your Supabase SQL Editor

DROP POLICY IF EXISTS "Only service role or admin can insert/update challenges." ON public.daily_challenges;

-- Allow authenticated users (parents) to insert challenges if they don't exist for today.
-- This is necessary because the first user of the day generates the challenge via AI and saves it.
CREATE POLICY "Allow authenticated users to insert daily challenges" ON public.daily_challenges
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update daily challenges (rarely needed, but follow same logic)
CREATE POLICY "Allow authenticated users to update daily challenges" ON public.daily_challenges
  FOR UPDATE USING (auth.role() = 'authenticated');
