// components/Card.tsx
import type { ReactNode } from 'react';
import clsx from 'clsx';

type CardProps = {
  className?: string;
  children: ReactNode;
};

export function Card({ className, children }: CardProps) {
  return (
    <div className={clsx('rounded-md border border-gray-200 bg-white shadow-sm p-4', className)}>
      {children}
    </div>
  );
}

type CardHeaderProps = {
  title: string;
  subtitle?: string;
};

export function CardHeader({ title, subtitle }: CardHeaderProps) {
  return (
    <header className="mb-2">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </header>
  );
}
