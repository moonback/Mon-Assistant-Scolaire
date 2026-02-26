import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
      <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 text-slate-300">
        {icon}
      </div>
      <h3 className="text-base font-black text-slate-400 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
