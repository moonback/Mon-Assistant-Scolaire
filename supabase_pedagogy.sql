-- Pedagogical hub persistence (DB-first, cross-device)
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.pedagogical_daily_missions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT current_date,
  grade_level text,
  generated_missions jsonb NOT NULL DEFAULT '[]',
  completed_mission_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(child_id, date)
);

CREATE TABLE IF NOT EXISTS public.pedagogical_mission_events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT current_date,
  mission_id text NOT NULL,
  mission_subject text,
  points_awarded integer NOT NULL DEFAULT 0,
  grade_level text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(child_id, date, mission_id)
);

ALTER TABLE public.pedagogical_daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedagogical_mission_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage pedagogical daily missions of their children." ON public.pedagogical_daily_missions;
CREATE POLICY "Users can manage pedagogical daily missions of their children." ON public.pedagogical_daily_missions
  FOR ALL USING (auth.uid() IN (SELECT parent_id FROM public.children WHERE id = child_id));

DROP POLICY IF EXISTS "Users can manage pedagogical mission events of their children." ON public.pedagogical_mission_events;
CREATE POLICY "Users can manage pedagogical mission events of their children." ON public.pedagogical_mission_events
  FOR ALL USING (auth.uid() IN (SELECT parent_id FROM public.children WHERE id = child_id));

CREATE OR REPLACE FUNCTION public.update_pedagogy_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_pedagogy_updated_at ON public.pedagogical_daily_missions;
CREATE TRIGGER trg_update_pedagogy_updated_at
BEFORE UPDATE ON public.pedagogical_daily_missions
FOR EACH ROW
EXECUTE FUNCTION public.update_pedagogy_updated_at();
