-- =============================================================
-- FREEMIUM SAAS MIGRATION
-- Run this in your Supabase SQL Editor
-- =============================================================

-- 1. PLANS TABLE
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  price_monthly integer DEFAULT 0,
  price_yearly integer DEFAULT 0,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  limits jsonb NOT NULL DEFAULT '{}',
  features jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id uuid REFERENCES public.plans(id) NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  trial_ends_at timestamptz,
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. DAILY USAGE TABLE
CREATE TABLE IF NOT EXISTS public.daily_usage (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT current_date,
  ai_messages_count integer DEFAULT 0,
  quizzes_count integer DEFAULT 0,
  challenges_generated integer DEFAULT 0,
  flashcard_sessions_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, date)
);

-- ============================
-- RLS POLICIES
-- ============================

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active plans" ON public.plans;
CREATE POLICY "Anyone can read active plans" ON public.plans
  FOR SELECT USING (is_active = true);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own daily usage" ON public.daily_usage;
CREATE POLICY "Users can manage their own daily usage" ON public.daily_usage
  FOR ALL USING (auth.uid() = user_id);

-- ============================
-- INDEXES
-- ============================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON public.daily_usage(user_id, date);

-- ============================
-- AUTO updated_at TRIGGER
-- ============================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_plans_updated_at ON public.plans;
CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- SEED DATA
-- ============================

INSERT INTO public.plans (name, display_name, description, price_monthly, price_yearly, limits, features, sort_order)
VALUES (
  'free',
  'Gratuit',
  'Parfait pour commencer l''aventure !',
  0, 0,
  '{
    "max_children": 2,
    "ai_messages_per_day": 10,
    "quizzes_per_day": 3,
    "daily_challenges_per_day": 1,
    "flashcard_sessions_per_day": 0
  }'::jsonb,
  '["daily_challenges_basic", "ai_assistant_text", "math_game_basic", "quiz_basic", "dictionary", "did_you_know", "drawing_board", "dashboard_basic", "parental_time_limit", "avatars_basic"]'::jsonb,
  1
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  limits = EXCLUDED.limits,
  features = EXCLUDED.features;

INSERT INTO public.plans (name, display_name, description, price_monthly, price_yearly, limits, features, sort_order)
VALUES (
  'premium',
  'Premium',
  'L''experience complete pour toute la famille !',
  799, 6990,
  '{
    "max_children": 5,
    "ai_messages_per_day": -1,
    "quizzes_per_day": -1,
    "daily_challenges_per_day": -1,
    "flashcard_sessions_per_day": -1
  }'::jsonb,
  '["daily_challenges_basic", "daily_challenges_themes", "ai_assistant_text", "ai_assistant_image", "ai_assistant_voice", "math_game_basic", "math_game_advanced", "quiz_basic", "quiz_unlimited", "dictionary", "did_you_know", "drawing_board", "dashboard_basic", "dashboard_charts", "dashboard_analytics", "flashcards_full", "homework_helper", "story_creator", "parental_time_limit", "parental_topic_blocking", "parental_bedtime", "parental_competitions", "badges_all", "avatars_all", "pedagogical_hub", "sibling_competitions", "star_marketplace"]'::jsonb,
  2
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  limits = EXCLUDED.limits,
  features = EXCLUDED.features;

-- ============================
-- UPDATE handle_new_user() to auto-assign free plan
-- ============================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username')
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;

  INSERT INTO public.children (parent_id, name, grade_level)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'Mon Enfant'),
    COALESCE(new.raw_user_meta_data->>'grade_level', 'CP')
  );

  SELECT id INTO free_plan_id FROM public.plans WHERE name = 'free' LIMIT 1;
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status)
    VALUES (new.id, free_plan_id, 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- HELPER: Increment daily usage counters atomically
-- ============================
CREATE OR REPLACE FUNCTION public.increment_daily_usage(
  p_user_id uuid,
  p_field text,
  p_amount integer DEFAULT 1
)
RETURNS integer AS $$
DECLARE
  current_val integer;
BEGIN
  INSERT INTO public.daily_usage (user_id, date)
  VALUES (p_user_id, current_date)
  ON CONFLICT (user_id, date) DO NOTHING;

  EXECUTE format(
    'UPDATE public.daily_usage SET %I = %I + $1 WHERE user_id = $2 AND date = current_date RETURNING %I',
    p_field, p_field, p_field
  ) INTO current_val USING p_amount, p_user_id;

  RETURN current_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
