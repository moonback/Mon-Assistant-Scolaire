import { ReactNode } from 'react';
import AppButton from './AppButton';

interface EmptyStateKidProps {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function EmptyStateKid({ icon, title, description, ctaLabel, onCta }: EmptyStateKidProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center md:p-10">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 md:text-base">{description}</p>
      {ctaLabel && onCta && (
        <div className="mt-6">
          <AppButton onClick={onCta}>{ctaLabel}</AppButton>
        </div>
      )}
    </div>
  );
}
