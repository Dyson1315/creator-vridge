'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { useFieldValidation, FieldValidationConfig, ValidationState } from '@/hooks/useFieldValidation';

export interface ValidatedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  helperText?: string;
  validation?: FieldValidationConfig;
  showCharacterCount?: boolean;
  showValidationIcon?: boolean;
  contextualHelp?: string;
  successMessage?: string;
  autoResize?: boolean;
  onChange?: (value: string, validation: any) => void;
  onValidationChange?: (isValid: boolean, message?: string) => void;
}

export default function ValidatedTextarea({
  label,
  helperText,
  validation = {},
  showCharacterCount = true,
  showValidationIcon = true,
  contextualHelp,
  successMessage,
  autoResize = true,
  className,
  maxLength,
  rows = 4,
  value: controlledValue,
  onChange,
  onValidationChange,
  onBlur,
  onFocus,
  disabled,
  ...props
}: ValidatedTextareaProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Initialize field validation
  const {
    validation: validationResult,
    validate,
    setFieldTouched,
    isTouched,
    isValidating,
  } = useFieldValidation(value, {
    validateOnBlur: true,
    validateOnChange: true,
    debounceMs: 300,
    ...validation,
  });

  // Auto-resize functionality
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, rows * 24)}px`;
    }
  }, [autoResize, rows]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Get validation state and styling
  const getValidationState = (): {
    state: ValidationState;
    borderClass: string;
    iconClass: string;
    messageClass: string;
  } => {
    if (!isTouched && !isFocused) {
      return {
        state: 'neutral',
        borderClass: 'border-calm-300 focus:border-primary-500',
        iconClass: 'text-calm-400',
        messageClass: 'text-calm-600',
      };
    }

    switch (validationResult.state) {
      case 'validating':
        return {
          state: 'validating',
          borderClass: 'border-yellow-300 focus:border-yellow-500',
          iconClass: 'text-yellow-500',
          messageClass: 'text-yellow-600',
        };
      case 'valid':
        return {
          state: 'valid',
          borderClass: 'border-green-300 focus:border-green-500',
          iconClass: 'text-green-500',
          messageClass: 'text-green-600',
        };
      case 'invalid':
        return {
          state: 'invalid',
          borderClass: 'border-red-300 focus:border-red-500',
          iconClass: 'text-red-500',
          messageClass: 'text-red-600',
        };
      default:
        return {
          state: 'neutral',
          borderClass: 'border-calm-300 focus:border-primary-500',
          iconClass: 'text-calm-400',
          messageClass: 'text-calm-600',
        };
    }
  };

  const { state, borderClass, iconClass, messageClass } = getValidationState();

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue, validationResult);
    
    // Auto-resize
    if (autoResize) {
      setTimeout(adjustHeight, 0);
    }
  }, [controlledValue, onChange, validationResult, autoResize, adjustHeight]);

  // Handle focus
  const handleFocus = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    setShowHelp(true);
    onFocus?.(e);
  }, [onFocus]);

  // Handle blur
  const handleBlur = useCallback(async (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    setShowHelp(false);
    setFieldTouched(true);
    
    // Trigger validation on blur
    const result = await validate(value);
    onValidationChange?.(result.isValid, result.message);
    
    onBlur?.(e);
  }, [onBlur, setFieldTouched, validate, value, onValidationChange]);

  // Notify parent of validation changes
  useEffect(() => {
    if (isTouched) {
      onValidationChange?.(validationResult.isValid, validationResult.message);
    }
  }, [validationResult, isTouched, onValidationChange]);

  // Calculate character count
  const characterCount = typeof value === 'string' ? value.length : 0;
  const maxCount = maxLength || validation.maxLength;

  // Get validation icon
  const getValidationIcon = () => {
    if (!showValidationIcon || !isTouched) return null;

    switch (state) {
      case 'validating':
        return <Loader2 className={`w-4 h-4 animate-spin ${iconClass}`} />;
      case 'valid':
        return <CheckCircle className={`w-4 h-4 ${iconClass}`} />;
      case 'invalid':
        return <AlertCircle className={`w-4 h-4 ${iconClass}`} />;
      default:
        return null;
    }
  };

  // Get message to display
  const getMessage = () => {
    if (validationResult.message && (isTouched || state === 'invalid')) {
      return {
        text: validationResult.message,
        type: 'error' as const,
      };
    }

    if (state === 'valid' && successMessage && isTouched) {
      return {
        text: successMessage,
        type: 'success' as const,
      };
    }

    if (showHelp && contextualHelp) {
      return {
        text: contextualHelp,
        type: 'help' as const,
      };
    }

    if (helperText && !isTouched) {
      return {
        text: helperText,
        type: 'helper' as const,
      };
    }

    return null;
  };

  const message = getMessage();

  return (
    <div className="w-full">
      {/* Label and character count */}
      {(label || (showCharacterCount && maxCount)) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label 
              className="block text-sm font-medium text-calm-700"
              htmlFor={props.id}
            >
              {label}
              {validation.required && (
                <span className="text-red-500 ml-1" aria-label="必須項目">*</span>
              )}
            </label>
          )}

          {/* Character count */}
          {showCharacterCount && maxCount && (
            <span 
              className={cn(
                'text-xs',
                characterCount > maxCount * 0.8 
                  ? characterCount >= maxCount 
                    ? 'text-red-500' 
                    : 'text-yellow-600'
                  : 'text-calm-500'
              )}
            >
              {characterCount}/{maxCount}
            </span>
          )}
        </div>
      )}

      {/* Textarea container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          className={cn(
            'block w-full px-4 py-3 text-calm-900 bg-white border rounded-xl shadow-sm resize-none',
            'placeholder:text-calm-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-400/20',
            'disabled:bg-calm-50 disabled:text-calm-500 disabled:cursor-not-allowed',
            'transition-all duration-200',
            borderClass,
            
            // Add padding for validation icon
            showValidationIcon && 'pr-10',
            
            className
          )}
          rows={autoResize ? undefined : rows}
          style={autoResize ? { minHeight: `${rows * 24}px` } : undefined}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength || validation.maxLength}
          disabled={disabled}
          aria-invalid={validationResult.state === 'invalid'}
          aria-describedby={
            message ? `${props.id}-message` : undefined
          }
          {...props}
        />

        {/* Validation icon */}
        {showValidationIcon && (
          <div className="absolute top-3 right-3">
            {getValidationIcon()}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          id={`${props.id}-message`}
          className={cn(
            'mt-2 text-sm flex items-start space-x-1 animate-slide-down',
            message.type === 'error' && messageClass,
            message.type === 'success' && 'text-green-600',
            message.type === 'help' && 'text-primary-600',
            message.type === 'helper' && 'text-calm-500'
          )}
          role={message.type === 'error' ? 'alert' : undefined}
        >
          {message.type === 'help' && (
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Loading indicator for async validation */}
      {isValidating && (
        <div className="mt-1 flex items-center space-x-2 text-xs text-yellow-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>検証中...</span>
        </div>
      )}
    </div>
  );
}