export type FeatureKey =
  | 'daily_challenges_basic'
  | 'daily_challenges_themes'
  | 'ai_assistant_text'
  | 'ai_assistant_image'
  | 'ai_assistant_voice'
  | 'math_game_basic'
  | 'math_game_advanced'
  | 'quiz_basic'
  | 'quiz_unlimited'
  | 'dictionary'
  | 'did_you_know'
  | 'drawing_board'
  | 'dashboard_basic'
  | 'dashboard_charts'
  | 'dashboard_analytics'
  | 'flashcards_full'
  | 'homework_helper'
  | 'story_creator'
  | 'parental_time_limit'
  | 'parental_topic_blocking'
  | 'parental_bedtime'
  | 'parental_competitions'
  | 'badges_all'
  | 'avatars_basic'
  | 'avatars_all'
  | 'pedagogical_hub'
  | 'sibling_competitions'
  | 'star_marketplace';

export interface Plan {
  id: string;
  name: 'free' | 'premium';
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  limits: Record<string, number | string[]>;
  features: FeatureKey[];
  is_active: boolean;
  sort_order: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export interface DailyUsage {
  ai_messages_count: number;
  quizzes_count: number;
  challenges_generated: number;
  flashcard_sessions_count: number;
}

export interface PlanContextValue {
  plan: Plan | null;
  subscription: Subscription | null;
  usage: DailyUsage;
  isPremium: boolean;
  isLoading: boolean;
  hasFeature: (feature: FeatureKey) => boolean;
  getLimit: (key: string) => number;
  canUse: (usageKey: keyof DailyUsage) => { allowed: boolean; remaining: number; limit: number };
  incrementUsage: (usageKey: keyof DailyUsage) => Promise<number>;
  refreshPlan: () => Promise<void>;
}
