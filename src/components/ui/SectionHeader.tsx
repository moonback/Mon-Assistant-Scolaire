import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export default function SectionHeader({ title, subtitle, action, className = '' }: SectionHeaderProps) {
  return (
    <header className={['flex flex-col gap-3 md:flex-row md:items-end md:justify-between', className].join(' ')}>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm font-medium text-slate-600 md:text-base">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
