import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 px-4 rounded-xl border border-dashed border-slate-300 bg-white ${className}`}>
      {icon ? (
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-brand-50 text-brand-600 mb-3">
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">{description}</p>
      {actionText && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 w-full">
      <div className="animate-spin rounded-full h-9 w-9 border-2 border-brand-600 border-t-transparent" />
      <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
};
