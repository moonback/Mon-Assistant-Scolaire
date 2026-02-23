-- Migration script to update existing schema to Multi-Child architecture
-- Run this in your Supabase SQL Editor

-- 1. Update Profiles table
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS parent_pin text;
-- Optionally remove old child-specific columns if you want to clean up
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS grade_level;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS stars;

-- 2. Create Children table
CREATE TABLE IF NOT EXISTS public.children (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  grade_level text CHECK (grade_level IN ('CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème')),
  stars integer DEFAULT 0,
  daily_time_limit integer DEFAULT 30,
  bedtime text DEFAULT '20:00',
  reward_goals jsonb DEFAULT '[]',
  blocked_topics text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Update Progress table
ALTER TABLE IF EXISTS public.progress ADD COLUMN IF NOT EXISTS child_id uuid REFERENCES public.children(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.progress RENAME COLUMN created_at TO date; -- Align with new naming or keep as is

-- 4. Enable RLS on new table
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- 5. Recreate Policies (Drop existing if necessary)
DROP POLICY IF EXISTS "Users can view their own children." ON public.children;
CREATE POLICY "Users can view their own children." ON public.children
  FOR SELECT USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Users can insert their own children." ON public.children;
CREATE POLICY "Users can insert their own children." ON public.children
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Users can update their own children." ON public.children;
CREATE POLICY "Users can update their own children." ON public.children
  FOR UPDATE USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Users can delete their own children." ON public.children;
CREATE POLICY "Users can delete their own children." ON public.children
  FOR DELETE USING (auth.uid() = parent_id);

-- Update progress policies
DROP POLICY IF EXISTS "Users can view own progress." ON public.progress;
CREATE POLICY "Users can view progress of their children." ON public.progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress." ON public.progress;
CREATE POLICY "Users can insert progress for their children." ON public.progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Update Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username')
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
  
  -- Create first child profile
  INSERT INTO public.children (parent_id, name, grade_level)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', 'Mon Enfant'), COALESCE(new.raw_user_meta_data->>'grade_level', 'CP'));
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add Atomic Increment Helper
CREATE OR REPLACE FUNCTION increment_child_stars(child_id uuid, count integer)
RETURNS void AS $$
BEGIN
  UPDATE public.children
  SET stars = stars + count
  WHERE id = child_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
