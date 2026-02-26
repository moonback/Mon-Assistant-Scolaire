import { ElementType, ReactNode, ComponentPropsWithoutRef } from 'react';

type CardVariant = 'surface' | 'highlight';

type AppCardProps<T extends ElementType = 'div'> = {
  as?: T;
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

const variantClasses: Record<CardVariant, string> = {
  surface: 'bg-white border border-slate-200',
  highlight: 'bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100',
};

export default function AppCard<T extends ElementType = 'div'>({
  as,
  variant = 'surface',
  className = '',
  children,
  ...props
}: AppCardProps<T>) {
  const Component = (as || 'div') as ElementType;

  return (
    <Component
      className={[
        'rounded-2xl p-5 md:p-6 shadow-sm transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </Component>
  );
}
