'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface FormSectionProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  isCompleted?: boolean;
  hasErrors?: boolean;
  progress?: number;
  isRequired?: boolean;
  validationMessage?: string;
  errorCount?: number;
  warningCount?: number;
  className?: string;
}

export default function FormSection({
  id,
  title,
  description,
  children,
  isCompleted = false,
  hasErrors = false,
  progress = 0,
  isRequired = false,
  validationMessage,
  errorCount = 0,
  warningCount = 0,
  className = '',
}: FormSectionProps) {
  return (
    <div id={`section-${id}`} className={`scroll-mt-32 ${className}`}>
      <Card className={`
        transition-all duration-200
        ${isCompleted ? 'ring-2 ring-green-200 bg-green-50/30' : ''}
        ${hasErrors ? 'ring-2 ring-red-200 bg-red-50/30' : ''}
        ${!isCompleted && !hasErrors && progress > 0 ? 'ring-1 ring-yellow-200 bg-yellow-50/20' : ''}
      `}>
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {/* Completion Status Icon */}
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-600" aria-label="完了済み" />
                ) : hasErrors ? (
                  <AlertCircle className="w-5 h-5 text-red-600" aria-label="エラーあり" />
                ) : (
                  <Circle className="w-5 h-5 text-calm-400" aria-label="未完了" />
                )}

                <CardTitle className="text-base sm:text-lg text-calm-900 font-semibold">
                  {title}
                  {isRequired && !isCompleted && (
                    <span className="text-red-500 ml-1" aria-label="必須項目">*</span>
                  )}
                </CardTitle>
              </div>
            </div>

            {/* Progress Indicator */}
            {!isCompleted && progress > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-calm-200 rounded-full h-2">
                  <div
                    className={`
                      h-2 rounded-full transition-all duration-300
                      ${hasErrors ? 'bg-gradient-to-r from-red-400 to-red-500' :
                        progress === 100 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                        'bg-gradient-to-r from-primary-500 to-secondary-500'}
                    `}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className={`
                  text-xs font-medium
                  ${hasErrors ? 'text-red-600' :
                    progress === 100 ? 'text-green-600' :
                    'text-calm-600'}
                `}>
                  {Math.round(progress)}%
                </span>
              </div>
            )}

            {/* Status Badge */}
            {isCompleted ? (
              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <CheckCircle className="w-3 h-3" />
                <span>完了</span>
              </div>
            ) : hasErrors ? (
              <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                <AlertCircle className="w-3 h-3" />
                <span>要修正</span>
              </div>
            ) : progress > 0 ? (
              <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                <Circle className="w-3 h-3" />
                <span>入力中</span>
              </div>
            ) : null}
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-calm-600 mt-2">{description}</p>
          )}

          {/* Validation Message */}
          {validationMessage && (
            <div className={`
              mt-3 px-3 py-2 rounded-lg text-sm flex items-start space-x-2
              ${hasErrors ? 'bg-red-50 text-red-700 border border-red-200' : 
                isCompleted ? 'bg-green-50 text-green-700 border border-green-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'}
            `}>
              {hasErrors ? (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : isCompleted ? (
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              <span>{validationMessage}</span>
            </div>
          )}

          {/* Error and Warning Counts */}
          {(errorCount > 0 || warningCount > 0) && (
            <div className="mt-2 flex items-center space-x-4 text-xs">
              {errorCount > 0 && (
                <span className="flex items-center space-x-1 text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errorCount}個のエラー</span>
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center space-x-1 text-yellow-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>{warningCount}個の警告</span>
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 pt-0">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for managing form sections
export function useFormSections() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const headerHeight = 120; // Height of sticky navigation
      const elementPosition = element.offsetTop - headerHeight;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    }
  };

  const getCurrentSection = () => {
    const sections = ['basic-info', 'skills-experience', 'pricing-availability', 'portfolio', 'communication'];
    const scrollPosition = window.scrollY + 150; // Offset for header

    for (let i = sections.length - 1; i >= 0; i--) {
      const element = document.getElementById(`section-${sections[i]}`);
      if (element && element.offsetTop <= scrollPosition) {
        return sections[i];
      }
    }

    return sections[0];
  };

  return {
    scrollToSection,
    getCurrentSection,
  };
}