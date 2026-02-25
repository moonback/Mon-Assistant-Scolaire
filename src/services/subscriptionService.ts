import { supabase } from '../lib/supabase';
import type { Plan, Subscription, DailyUsage } from '../types/subscription';

const USAGE_DB_FIELDS: Record<keyof DailyUsage, string> = {
  ai_messages_count: 'ai_messages_count',
  quizzes_count: 'quizzes_count',
  challenges_generated: 'challenges_generated',
  flashcard_sessions_count: 'flashcard_sessions_count',
};

const USAGE_LIMIT_MAP: Record<keyof DailyUsage, string> = {
  ai_messages_count: 'ai_messages_per_day',
  quizzes_count: 'quizzes_per_day',
  challenges_generated: 'daily_challenges_per_day',
  flashcard_sessions_count: 'flashcard_sessions_per_day',
};

export const subscriptionService = {
  async getPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('[subscriptionService] getPlans error:', error);
      return [];
    }
    return data || [];
  },

  async getUserSubscription(userId: string): Promise<{
    subscription: Subscription | null;
    plan: Plan | null;
  }> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return { subscription: null, plan: null };
    }

    const plan = (data as any).plan as Plan;
    const { plan: _, ...subscription } = data as any;
    return { subscription, plan };
  },

  async getDailyUsage(userId: string): Promise<DailyUsage> {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('daily_usage')
      .select('ai_messages_count, quizzes_count, challenges_generated, flashcard_sessions_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    return {
      ai_messages_count: data?.ai_messages_count || 0,
      quizzes_count: data?.quizzes_count || 0,
      challenges_generated: data?.challenges_generated || 0,
      flashcard_sessions_count: data?.flashcard_sessions_count || 0,
    };
  },

  async incrementUsage(userId: string, field: keyof DailyUsage): Promise<number> {
    const dbField = USAGE_DB_FIELDS[field];

    const { data, error } = await supabase.rpc('increment_daily_usage', {
      p_user_id: userId,
      p_field: dbField,
      p_amount: 1,
    });

    if (error) {
      console.error('[subscriptionService] incrementUsage error:', error);
      return -1;
    }

    return data as number;
  },

  checkLimit(
    plan: Plan | null,
    usage: DailyUsage,
    usageKey: keyof DailyUsage
  ): { allowed: boolean; remaining: number; limit: number } {
    if (!plan) {
      return { allowed: true, remaining: 999, limit: -1 };
    }

    const limitKey = USAGE_LIMIT_MAP[usageKey];
    const limit = (plan.limits[limitKey] as number) ?? -1;

    if (limit === -1) return { allowed: true, remaining: -1, limit: -1 };
    if (limit === 0) return { allowed: false, remaining: 0, limit: 0 };

    const used = usage[usageKey] || 0;
    const remaining = Math.max(0, limit - used);

    return { allowed: remaining > 0, remaining, limit };
  },

  hasFeature(plan: Plan | null, feature: string): boolean {
    if (!plan) return true;
    return (plan.features as string[]).includes(feature);
  },

  async ensureSubscription(userId: string): Promise<void> {
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existing) {
      const { data: freePlan } = await supabase
        .from('plans')
        .select('id')
        .eq('name', 'free')
        .single();

      if (freePlan) {
        await supabase.from('subscriptions').insert({
          user_id: userId,
          plan_id: freePlan.id,
          status: 'active',
        });
      }
    }
  },
};
