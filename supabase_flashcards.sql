-- Flashcard Sessions table
-- Run in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.flashcard_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  cards jsonb DEFAULT '[]',
  score integer DEFAULT 0,
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.flashcard_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage flashcard sessions of their children."
  ON public.flashcard_sessions
  FOR ALL
  USING (auth.uid() IN (SELECT parent_id FROM public.children WHERE id = child_id));
