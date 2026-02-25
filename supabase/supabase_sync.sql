-- Migration for cross-device sync
-- Run this in your Supabase SQL Editor

-- 1. Conversation History (Assistant)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  response text NOT NULL,
  image_url text, -- Store base64 or storage URL
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Idempotent policies for conversations
DROP POLICY IF EXISTS "Users can view conversations of their children." ON public.conversations;
CREATE POLICY "Users can view conversations of their children." ON public.conversations
  FOR SELECT USING (auth.uid() IN (SELECT parent_id FROM public.children WHERE id = child_id));

DROP POLICY IF EXISTS "Users can insert conversations for their children." ON public.conversations;
CREATE POLICY "Users can insert conversations for their children." ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT parent_id FROM public.children WHERE id = child_id));

DROP POLICY IF EXISTS "Users can delete conversations of their children." ON public.conversations;
CREATE POLICY "Users can delete conversations of their children." ON public.conversations
  FOR DELETE USING (auth.uid() IN (SELECT parent_id FROM public.children WHERE id = child_id));

-- 2. Daily Challenges Store
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  date date DEFAULT current_date NOT NULL,
  grade_level text NOT NULL,
  word_data jsonb NOT NULL,
  problem_data jsonb NOT NULL,
  UNIQUE(date, grade_level)
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view daily challenges." ON public.daily_challenges;
CREATE POLICY "Everyone can view daily challenges." ON public.daily_challenges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only service role or admin can insert/update challenges." ON public.daily_challenges;
CREATE POLICY "Only service role or admin can insert/update challenges." ON public.daily_challenges
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Daily Challenge Completion Status
CREATE TABLE IF NOT EXISTS public.daily_challenge_status (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES public.daily_challenges(id) ON DELETE CASCADE NOT NULL,
  word_completed boolean DEFAULT false,
  problem_completed boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(child_id, challenge_id)
);

ALTER TABLE public.daily_challenge_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage completion status of their children." ON public.daily_challenge_status;
CREATE POLICY "Users can manage completion status of their children." ON public.daily_challenge_status
  FOR ALL USING (auth.uid() IN (SELECT parent_id FROM public.children WHERE id = child_id));

-- 4. Daily Time Tracking & Stats
CREATE TABLE IF NOT EXISTS public.daily_child_stats (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT current_date NOT NULL,
  time_spent_minutes integer DEFAULT 0,
  ai_generations_count integer DEFAULT 0,
  UNIQUE(child_id, date)
);

ALTER TABLE public.daily_child_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage daily stats of their children." ON public.daily_child_stats;
CREATE POLICY "Users can manage daily stats of their children." ON public.daily_child_stats
  FOR ALL USING (auth.uid() IN (SELECT parent_id FROM public.children WHERE id = child_id));
