import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-calm-700 mb-2">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'block w-full px-4 py-3 text-calm-900 bg-white border border-calm-300 rounded-xl shadow-sm',
            'placeholder:text-calm-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
            'disabled:bg-calm-50 disabled:text-calm-500 disabled:cursor-not-allowed',
            'transition-all duration-200',
            error && 'border-red-300 focus:ring-red-400',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600 animate-slide-up">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-calm-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;