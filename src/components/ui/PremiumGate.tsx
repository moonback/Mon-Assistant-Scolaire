import { ReactNode, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Crown, Sparkles } from 'lucide-react';
import { usePlan } from '../../contexts/PlanContext';
import type { FeatureKey, DailyUsage } from '../../types/subscription';
import UpgradeModal from './UpgradeModal';

interface PremiumGateProps {
  feature: FeatureKey;
  children: ReactNode;
  usageKey?: keyof DailyUsage;
  featureLabel?: string;
  compact?: boolean;
}

export default function PremiumGate({
  feature,
  children,
  usageKey,
  featureLabel,
  compact = false,
}: PremiumGateProps) {
  const { hasFeature, canUse } = usePlan();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const featureAvailable = hasFeature(feature);
  const usageOk = usageKey ? canUse(usageKey).allowed : true;
  const isLocked = !featureAvailable;
  const isExhausted = featureAvailable && !usageOk;

  if (!isLocked && usageOk) {
    return <>{children}</>;
  }

  return (
    <>
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {compact ? (
        <button
          onClick={() => setShowUpgrade(true)}
          className="relative group"
          title="Fonctionnalite Premium"
        >
          {children}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
            <div className="bg-amber-400 text-white p-2 rounded-full shadow-lg">
              <Crown className="w-4 h-4" />
            </div>
          </div>
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="blur-sm pointer-events-none opacity-40 select-none">
            {children}
          </div>

          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="text-center space-y-4 max-w-sm px-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                {isExhausted ? <Sparkles className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
              </div>

              <h3 className="text-xl font-black text-slate-800">
                {isExhausted ? 'Limite atteinte !' : 'Fonctionnalite Premium'}
              </h3>

              <p className="text-sm font-bold text-slate-500">
                {isExhausted
                  ? `Tu as utilise toutes tes ${featureLabel || 'utilisations'} gratuites pour aujourd'hui.`
                  : `${featureLabel || 'Cette fonctionnalite'} est disponible avec le plan Premium.`}
              </p>

              <button
                onClick={() => setShowUpgrade(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-xl shadow-lg shadow-amber-200 hover:scale-105 transition-all"
              >
                <Crown className="w-4 h-4" />
                Passer en Premium
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
