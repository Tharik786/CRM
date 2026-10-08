import React from 'react';

export type BadgeVariant = 'indigo' | 'green' | 'amber' | 'rose' | 'slate' | 'purple' | 'blue' | 'cyan';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
  };

  const dotColors = {
    indigo: 'bg-indigo-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-400',
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    cyan: 'bg-cyan-500',
  };

  const sizeStyles = {
    xs: 'text-[9.5px] px-1.5 py-0.5 font-bold tracking-wider',
    sm: 'text-[10px] px-2 py-0.5 font-semibold tracking-wider',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border uppercase font-sans whitespace-nowrap shrink-0 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
