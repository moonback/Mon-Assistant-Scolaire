import { useEffect, useState, useCallback, useMemo } from 'react';
import { subscriptionService } from '../services/subscriptionService';
import type { Plan, Subscription, DailyUsage, FeatureKey, PlanContextValue } from '../types/subscription';

export function usePlanLogic(userId: string | undefined): PlanContextValue {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<DailyUsage>({
    ai_messages_count: 0,
    quizzes_count: 0,
    challenges_generated: 0,
    flashcard_sessions_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlanData = useCallback(async () => {
    if (!userId) {
      setPlan(null);
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      await subscriptionService.ensureSubscription(userId);

      const [subData, usageData] = await Promise.all([
        subscriptionService.getUserSubscription(userId),
        subscriptionService.getDailyUsage(userId),
      ]);

      setPlan(subData.plan);
      setSubscription(subData.subscription);
      setUsage(usageData);
    } catch (e) {
      console.error('[usePlan] Error fetching plan data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPlanData();
  }, [fetchPlanData]);

  const isPremium = useMemo(() => plan?.name === 'premium', [plan]);

  const hasFeature = useCallback(
    (feature: FeatureKey) => subscriptionService.hasFeature(plan, feature),
    [plan]
  );

  const getLimit = useCallback(
    (key: string) => {
      if (!plan) return -1;
      return (plan.limits[key] as number) ?? -1;
    },
    [plan]
  );

  const canUse = useCallback(
    (usageKey: keyof DailyUsage) => subscriptionService.checkLimit(plan, usage, usageKey),
    [plan, usage]
  );

  const incrementUsage = useCallback(
    async (usageKey: keyof DailyUsage) => {
      if (!userId) return -1;
      const newVal = await subscriptionService.incrementUsage(userId, usageKey);
      setUsage(prev => ({ ...prev, [usageKey]: newVal >= 0 ? newVal : prev[usageKey] + 1 }));
      return newVal;
    },
    [userId]
  );

  const refreshPlan = useCallback(async () => {
    setIsLoading(true);
    await fetchPlanData();
  }, [fetchPlanData]);

  return {
    plan,
    subscription,
    usage,
    isPremium,
    isLoading,
    hasFeature,
    getLimit,
    canUse,
    incrementUsage,
    refreshPlan,
  };
}
