-- Extension of pedagogical features based on roadmap

-- 1. Spaced Repetition System (SRS)
CREATE TABLE IF NOT EXISTS public.pedagogical_srs_cards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  notion text NOT NULL,
  mastery_level integer DEFAULT 1, -- 1 to 5
  next_review_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_reviewed_at timestamp with time zone,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(child_id, notion)
);

ALTER TABLE public.pedagogical_srs_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage SRS cards of their children." ON public.pedagogical_srs_cards
  FOR ALL USING (auth.uid() IN (SELECT parent_id FROM public.children WHERE id = child_id));

-- 2. Milestones & Portfolio
CREATE TABLE IF NOT EXISTS public.pedagogical_milestones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  icon text DEFAULT '🏆',
  category text, -- 'mastery', 'effort', 'regularity'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pedagogical_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones of their children." ON public.pedagogical_milestones
  FOR SELECT USING (auth.uid() IN (SELECT parent_id FROM public.children WHERE id = child_id));

-- 3. Weekly Support Plan (Parent/Teacher)
CREATE TABLE IF NOT EXISTS public.pedagogical_weekly_plans (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  week_start_date date NOT NULL,
  objectives text[] DEFAULT '{}',
  recommended_activities jsonb DEFAULT '[]',
  parent_feedback_scripts jsonb DEFAULT '[]',
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(child_id, week_start_date)
);

ALTER TABLE public.pedagogical_weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage weekly plans of their children." ON public.pedagogical_weekly_plans
  FOR ALL USING (auth.uid() IN (SELECT parent_id FROM public.children WHERE id = child_id));
