import { createContext, useContext, ReactNode } from 'react';
import { usePlanLogic } from '../hooks/usePlan';
import { useAuth } from './AuthContext';
import type { PlanContextValue } from '../types/subscription';

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const value = usePlanLogic(session?.user.id);

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextValue {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within PlanProvider');
  }
  return context;
}
