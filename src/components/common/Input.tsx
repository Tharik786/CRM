import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label} {props.required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`block w-full rounded-lg border text-sm transition-colors duration-150 py-2 ${
            leftIcon ? 'pl-9' : 'pl-3.5'
          } ${rightIcon ? 'pr-9' : 'pr-3.5'} ${
            error
              ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500'
              : 'border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'
          } ${props.disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white'} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label} {props.required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`block w-full rounded-lg border text-sm transition-colors duration-150 py-2 px-3 bg-white ${
          error
            ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500'
            : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'
        } ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 4,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label} {props.required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        <textarea
          id={textareaId}
          rows={rows}
          className={`block w-full rounded-lg border text-xs sm:text-sm transition-colors duration-150 p-3 leading-relaxed ${
            error
              ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500'
              : 'border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'
          } ${props.disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white'} resize-y ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};
