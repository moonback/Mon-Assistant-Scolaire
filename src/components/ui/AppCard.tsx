import { ElementType, ReactNode } from 'react';

type CardVariant = 'surface' | 'highlight';

interface AppCardProps {
  as?: ElementType;
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  surface: 'bg-white border border-slate-200',
  highlight: 'bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100',
};

export default function AppCard({ as: Component = 'div', variant = 'surface', className = '', children }: AppCardProps) {
  return (
    <Component
      className={[
        'rounded-2xl p-5 md:p-6 shadow-sm transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </Component>
  );
}
