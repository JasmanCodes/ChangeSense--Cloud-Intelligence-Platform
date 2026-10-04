import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'low'
    | 'medium'
    | 'high'
    | 'critical'
    | 'healthy'
    | 'degraded'
    | 'open'
    | 'investigating'
    | 'resolved'
    | 'info'
    | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    low: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50',
    healthy: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50',
    medium: 'bg-amber-950/60 text-amber-400 border border-amber-800/50',
    investigating: 'bg-amber-950/60 text-amber-400 border border-amber-800/50',
    high: 'bg-rose-950/60 text-rose-400 border border-rose-800/50',
    degraded: 'bg-orange-950/60 text-orange-400 border border-orange-800/50',
    critical: 'bg-red-950/80 text-red-300 border border-red-700 font-semibold',
    open: 'bg-rose-950/60 text-rose-300 border border-rose-800/60',
    resolved: 'bg-slate-800 text-slate-300 border border-slate-700',
    info: 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/50',
    outline: 'bg-transparent text-slate-300 border border-slate-700',
  };

  const dotColors = {
    default: 'bg-slate-400',
    low: 'bg-emerald-400',
    healthy: 'bg-emerald-400',
    medium: 'bg-amber-400',
    investigating: 'bg-amber-400',
    high: 'bg-rose-400',
    degraded: 'bg-orange-400',
    critical: 'bg-red-400 animate-pulse',
    open: 'bg-rose-400 animate-pulse',
    resolved: 'bg-emerald-400',
    info: 'bg-indigo-400',
    outline: 'bg-slate-400',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full whitespace-nowrap transition-colors',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
