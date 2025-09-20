'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

// Validation states
export type ValidationState = 'neutral' | 'validating' | 'valid' | 'invalid';

// Validation result
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  state: ValidationState;
}

// Field validation configuration
export interface FieldValidationConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => Promise<ValidationResult> | ValidationResult;
  asyncValidator?: (value: any) => Promise<ValidationResult>;
  debounceMs?: number;
  validateOnMount?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

// Hook return type
export interface UseFieldValidationReturn {
  validation: ValidationResult;
  validate: (value: any) => Promise<ValidationResult>;
  reset: () => void;
  setFieldTouched: (touched: boolean) => void;
  isTouched: boolean;
  isValidating: boolean;
}

// Default validation messages in Japanese
const defaultMessages = {
  required: 'この項目は必須です',
  minLength: (min: number) => `${min}文字以上で入力してください`,
  maxLength: (max: number) => `${max}文字以内で入力してください`,
  pattern: '入力形式が正しくありません',
  email: '有効なメールアドレスを入力してください',
  url: '有効なURLを入力してください',
  phone: '有効な電話番号を入力してください',
} as const;

// Built-in validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  phone: /^[\d\-\+\(\)\s]+$/,
  displayName: /^[^\u0000-\u001F\u007F-\u009F<>{}]*$/,
} as const;

export function useFieldValidation(
  initialValue: any = '',
  config: FieldValidationConfig = {}
): UseFieldValidationReturn {
  const {
    required = false,
    minLength,
    maxLength,
    pattern,
    customValidator,
    asyncValidator,
    debounceMs = 300,
    validateOnMount = false,
    validateOnChange = true,
    validateOnBlur = true,
  } = config;

  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    state: 'neutral',
  });
  
  const [isTouched, setIsTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Basic synchronous validation
  const validateSync = useCallback((value: any): ValidationResult | null => {
    // Required validation
    if (required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return {
        isValid: false,
        message: defaultMessages.required,
        state: 'invalid',
      };
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return {
        isValid: true,
        state: 'neutral',
      };
    }

    // Length validations
    if (typeof value === 'string') {
      if (minLength && value.length < minLength) {
        return {
          isValid: false,
          message: defaultMessages.minLength(minLength),
          state: 'invalid',
        };
      }

      if (maxLength && value.length > maxLength) {
        return {
          isValid: false,
          message: defaultMessages.maxLength(maxLength),
          state: 'invalid',
        };
      }
    }

    // Pattern validation
    if (pattern && typeof value === 'string' && !pattern.test(value)) {
      let message: string = defaultMessages.pattern;
      
      // Provide specific messages for common patterns
      if (pattern.source === validationPatterns.email.source) {
        message = defaultMessages.email;
      } else if (pattern.source === validationPatterns.url.source) {
        message = defaultMessages.url;
      } else if (pattern.source === validationPatterns.phone.source) {
        message = defaultMessages.phone;
      }

      return {
        isValid: false,
        message,
        state: 'invalid',
      };
    }

    return null; // No sync validation errors
  }, [required, minLength, maxLength, pattern]);

  // Async validation function
  const validateAsync = useCallback(async (value: any): Promise<ValidationResult> => {
    // Cancel previous async validation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // First run sync validation
      const syncResult = validateSync(value);
      if (syncResult) {
        return syncResult;
      }

      // Set validating state
      setIsValidating(true);
      setValidation(prev => ({ ...prev, state: 'validating' }));

      // Run custom validator if provided
      if (customValidator) {
        const customResult = await Promise.resolve(customValidator(value));
        if (signal.aborted) return validation;
        
        if (!customResult.isValid) {
          return customResult;
        }
      }

      // Run async validator if provided
      if (asyncValidator) {
        const asyncResult = await asyncValidator(value);
        if (signal.aborted) return validation;
        
        if (!asyncResult.isValid) {
          return asyncResult;
        }
      }

      // All validations passed
      return {
        isValid: true,
        state: 'valid',
      };
    } catch (error) {
      if (signal.aborted) return validation;
      
      return {
        isValid: false,
        message: 'バリデーションエラーが発生しました',
        state: 'invalid',
      };
    } finally {
      if (!signal.aborted) {
        setIsValidating(false);
      }
    }
  }, [validateSync, customValidator, asyncValidator, validation]);

  // Debounced validation
  const debouncedValidate = useCallback(
    debounce(async (value: any) => {
      const result = await validateAsync(value);
      setValidation(result);
    }, debounceMs),
    [validateAsync, debounceMs]
  );

  // Main validation function
  const validate = useCallback(async (value: any): Promise<ValidationResult> => {
    // For immediate validation (e.g., on blur)
    const result = await validateAsync(value);
    setValidation(result);
    return result;
  }, [validateAsync]);

  // Trigger validation on value change (with debouncing)
  const handleValueChange = useCallback((value: any) => {
    if (!isTouched || !validateOnChange) return;
    
    // Reset to validating state if we have async validation
    if (asyncValidator || customValidator) {
      setValidation(prev => ({ ...prev, state: 'validating' }));
    }
    
    debouncedValidate(value);
  }, [isTouched, validateOnChange, debouncedValidate, asyncValidator, customValidator]);

  // Set field as touched
  const setFieldTouched = useCallback((touched: boolean) => {
    setIsTouched(touched);
  }, []);

  // Reset validation state
  const reset = useCallback(() => {
    setValidation({
      isValid: true,
      state: 'neutral',
    });
    setIsTouched(false);
    setIsValidating(false);
    debouncedValidate.cancel();
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [debouncedValidate]);

  // Validate on mount if configured
  useEffect(() => {
    if (validateOnMount && initialValue) {
      validate(initialValue);
    }
  }, [validateOnMount, initialValue, validate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedValidate.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedValidate]);

  return {
    validation,
    validate,
    reset,
    setFieldTouched,
    isTouched,
    isValidating,
  };
}

// Hook for managing multiple field validations
export interface UseFormValidationConfig {
  fields: Record<string, FieldValidationConfig>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation(config: UseFormValidationConfig) {
  const { fields, validateOnChange = true, validateOnBlur = true } = config;
  
  const [fieldValidations, setFieldValidations] = useState<Record<string, ValidationResult>>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  
  // Create individual field validators
  const fieldValidators = useRef<Record<string, UseFieldValidationReturn>>({});
  
  // Initialize field validators
  useEffect(() => {
    Object.keys(fields).forEach(fieldName => {
      if (!fieldValidators.current[fieldName]) {
        fieldValidators.current[fieldName] = useFieldValidation('', {
          ...fields[fieldName],
          validateOnChange,
          validateOnBlur,
        });
      }
    });
  }, [fields, validateOnChange, validateOnBlur]);

  // Validate a specific field
  const validateField = useCallback(async (fieldName: string, value: any): Promise<ValidationResult> => {
    const validator = fieldValidators.current[fieldName];
    if (!validator) {
      return { isValid: true, state: 'neutral' };
    }

    const result = await validator.validate(value);
    setFieldValidations(prev => ({ ...prev, [fieldName]: result }));
    return result;
  }, []);

  // Validate all fields
  const validateAll = useCallback(async (values: Record<string, any>): Promise<boolean> => {
    const results = await Promise.all(
      Object.keys(fields).map(async (fieldName) => {
        const result = await validateField(fieldName, values[fieldName]);
        return { fieldName, result };
      })
    );

    const newValidations: Record<string, ValidationResult> = {};
    let isFormValid = true;

    results.forEach(({ fieldName, result }) => {
      newValidations[fieldName] = result;
      if (!result.isValid) {
        isFormValid = false;
      }
    });

    setFieldValidations(newValidations);
    return isFormValid;
  }, [fields, validateField]);

  // Get form validity
  const isFormValid = Object.values(fieldValidations).every(validation => validation.isValid);
  
  // Get fields with errors
  const fieldsWithErrors = Object.keys(fieldValidations).filter(
    fieldName => !fieldValidations[fieldName].isValid
  );

  // Set field as touched
  const setFieldTouchedState = useCallback((fieldName: string, touched: boolean) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: touched }));
    fieldValidators.current[fieldName]?.setFieldTouched(touched);
  }, []);

  // Reset all validations
  const resetAll = useCallback(() => {
    Object.values(fieldValidators.current).forEach(validator => validator.reset());
    setFieldValidations({});
    setFieldTouched({});
  }, []);

  return {
    fieldValidations,
    fieldTouched,
    isFormValid,
    fieldsWithErrors,
    validateField,
    validateAll,
    setFieldTouched: setFieldTouchedState,
    resetAll,
  };
}