'use client';

import React, { useCallback } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import SkillsSelector from './SkillsSelector';
import { useFieldValidation } from '@/hooks/useFieldValidation';
import { getFieldValidation, UserType } from '@/lib/profileValidation';

interface ValidatedSkillsSelectorProps {
  value: string[];
  onChange: (skills: string[]) => void;
  userType: UserType;
  label?: string;
  helperText?: string;
  error?: string;
  onValidationChange?: (isValid: boolean, message?: string) => void;
}

export default function ValidatedSkillsSelector({
  value = [],
  onChange,
  userType,
  label,
  helperText,
  error,
  onValidationChange,
}: ValidatedSkillsSelectorProps) {
  const validation = getFieldValidation('skills', userType);
  
  const {
    validation: validationResult,
    validate,
    setFieldTouched,
    isTouched,
  } = useFieldValidation(value, validation);

  // Handle skills change with validation
  const handleSkillsChange = useCallback(async (newSkills: string[]) => {
    onChange(newSkills);
    
    if (isTouched) {
      const result = await validate(newSkills);
      onValidationChange?.(result.isValid, result.message);
    }
  }, [onChange, isTouched, validate, onValidationChange]);

  // Handle focus/blur to track interaction
  const handleInteraction = useCallback(() => {
    if (!isTouched) {
      setFieldTouched(true);
    }
  }, [isTouched, setFieldTouched]);

  // Get validation state
  const hasError = error || (isTouched && !validationResult.isValid);
  const isValid = isTouched && validationResult.isValid && value.length > 0;
  const minSkills = userType === 'ARTIST' ? 3 : 1;

  // Get message to display
  const getMessage = () => {
    if (error) {
      return { text: error, type: 'error' as const };
    }
    
    if (isTouched && validationResult.message) {
      return { text: validationResult.message, type: 'error' as const };
    }
    
    if (isValid) {
      return { 
        text: `${value.length}個のスキルが選択されています`, 
        type: 'success' as const 
      };
    }
    
    if (helperText) {
      return { text: helperText, type: 'helper' as const };
    }
    
    return null;
  };

  const message = getMessage();

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-calm-700">
            {label}
            <span className="text-red-500 ml-1" aria-label="必須項目">*</span>
          </label>
          
          {/* Skill count indicator */}
          <span className={`text-xs font-medium ${
            hasError ? 'text-red-600' : 
            isValid ? 'text-green-600' : 
            'text-calm-500'
          }`}>
            {value.length}/{minSkills}+ 選択
          </span>
        </div>
      )}

      {/* Skills Selector Container */}
      <div 
        className={`
          relative border-2 rounded-xl transition-all duration-200 
          ${hasError ? 'border-red-300 bg-red-50/30' : 
            isValid ? 'border-green-300 bg-green-50/30' : 
            'border-calm-200 hover:border-calm-300'}
        `}
        onClick={handleInteraction}
        onFocus={handleInteraction}
      >
        <SkillsSelector
          value={value}
          onChange={handleSkillsChange}
          userType={userType}
        />
        
        {/* Validation icon */}
        <div className="absolute top-3 right-3 pointer-events-none">
          {hasError ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : isValid ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : null}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`
            mt-2 text-sm flex items-start space-x-1 animate-slide-down
            ${message.type === 'error' && 'text-red-600'}
            ${message.type === 'success' && 'text-green-600'}
            ${message.type === 'helper' && 'text-calm-500'}
          `}
          role={message.type === 'error' ? 'alert' : undefined}
        >
          {message.type === 'helper' && (
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-calm-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Additional help for artists */}
      {userType === 'ARTIST' && !hasError && (
        <div className="mt-2 text-xs text-calm-500">
          <p>
            最低{minSkills}つのスキルを選択してください。より多くのスキルを選択すると、マッチング機会が増えます。
          </p>
        </div>
      )}

      {/* Skill recommendations */}
      {isTouched && value.length > 0 && value.length < 5 && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">おすすめ:</p>
              <p>
                {userType === 'ARTIST' 
                  ? 'より具体的なスキル（例：Live2D、キャラクターデザイン）を追加すると、適切な案件とマッチしやすくなります。'
                  : '求める作品の種類（例：ロゴデザイン、イラスト制作）を追加すると、より良い絵師さんと出会えます。'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}