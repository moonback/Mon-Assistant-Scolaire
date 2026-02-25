import { usePlan } from '../../contexts/PlanContext';
import type { DailyUsage } from '../../types/subscription';

interface UsageCounterProps {
  usageKey: keyof DailyUsage;
  label?: string;
}

export default function UsageCounter({ usageKey, label }: UsageCounterProps) {
  const { canUse } = usePlan();
  const { remaining, limit } = canUse(usageKey);

  if (limit === -1) return null;

  const used = limit - remaining;
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  const isLow = remaining <= 1;

  return (
    <div className="flex items-center gap-2 text-xs font-bold">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isLow ? 'bg-red-400' : 'bg-indigo-400'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={isLow ? 'text-red-500' : 'text-slate-400'}>
        {used}/{limit} {label || ''}
      </span>
    </div>
  );
}
