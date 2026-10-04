import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'accent' | 'danger';
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  noPadding = false,
  className,
  ...props
}) => {
  const variantStyles = {
    default:
      'bg-slate-900/90 dark:bg-[#111827] border border-slate-800 shadow-sm text-slate-100',
    glass:
      'glass-panel shadow-card-dark text-slate-100',
    accent:
      'bg-slate-900/90 dark:bg-[#111827] border border-indigo-500/30 shadow-glow-brand text-slate-100',
    danger:
      'bg-slate-900/90 dark:bg-[#111827] border border-rose-500/30 shadow-glow-danger text-slate-100',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-xl transition-all duration-150',
          variantStyles[variant],
          !noPadding && 'p-5',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={twMerge(clsx('flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80', className))}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3
    className={twMerge(clsx('text-base font-semibold text-slate-100 flex items-center gap-2', className))}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p
    className={twMerge(clsx('text-xs text-slate-400 mt-0.5', className))}
    {...props}
  >
    {children}
  </p>
);
