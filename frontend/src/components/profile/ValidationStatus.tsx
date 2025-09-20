'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Info, Lightbulb } from 'lucide-react';
import { FormValidationSummary } from '@/hooks/useSectionValidation';

interface ValidationStatusProps {
  formSummary: FormValidationSummary;
  onScrollToErrors?: () => void;
  className?: string;
}

export default function ValidationStatus({
  formSummary,
  onScrollToErrors,
  className = '',
}: ValidationStatusProps) {
  const {
    isValid,
    overallProgress,
    sectionsCompleted,
    totalSections,
    requiredSectionsCompleted,
    totalRequiredSections,
    errorCount,
    warningCount,
  } = formSummary;

  // Get status color and message
  const getStatusInfo = () => {
    if (isValid && overallProgress === 100) {
      return {
        color: 'green',
        icon: CheckCircle,
        title: 'プロフィール完成',
        message: '全ての必須項目が入力されています。プロフィールを更新できます。',
      };
    }

    if (errorCount > 0) {
      return {
        color: 'red',
        icon: AlertCircle,
        title: '入力エラーがあります',
        message: `${errorCount}個のエラーを修正してください。`,
      };
    }

    if (requiredSectionsCompleted < totalRequiredSections) {
      return {
        color: 'yellow',
        icon: Info,
        title: '必須項目の入力が必要です',
        message: `あと${totalRequiredSections - requiredSectionsCompleted}個の必須セクションを完了してください。`,
      };
    }

    return {
      color: 'blue',
      icon: Lightbulb,
      title: '入力を続けてください',
      message: '任意項目も入力して、プロフィールをより魅力的にしましょう。',
    };
  };

  const { color, icon: Icon, title, message } = getStatusInfo();

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: 'text-green-500',
      progress: 'bg-green-500',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-500',
      progress: 'bg-red-500',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: 'text-yellow-500',
      progress: 'bg-yellow-500',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'text-blue-500',
      progress: 'bg-blue-500',
    },
  };

  const classes = colorClasses[color as keyof typeof colorClasses];

  return (
    <div className={`${classes.bg} ${classes.border} border rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <Icon className={`w-5 h-5 ${classes.icon} mt-0.5 flex-shrink-0`} />
          <div className="min-w-0 flex-1">
            <h3 className={`font-medium ${classes.text} text-sm sm:text-base`}>
              {title}
            </h3>
            <p className={`${classes.text} text-sm mt-1 opacity-80`}>
              {message}
            </p>
          </div>
        </div>

        {/* Action button for errors */}
        {errorCount > 0 && onScrollToErrors && (
          <button
            onClick={onScrollToErrors}
            className="text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1 rounded-md hover:bg-red-100 transition-colors flex-shrink-0"
          >
            エラーを確認
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-calm-600 mb-1">
          <span>完成度</span>
          <span className="font-medium">{Math.round(overallProgress)}%</span>
        </div>
        <div className="w-full bg-calm-200 rounded-full h-2">
          <div
            className={`h-2 ${classes.progress} rounded-full transition-all duration-500`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        {/* Completed sections */}
        <div className="text-center">
          <div className={`font-bold text-lg ${classes.text}`}>
            {sectionsCompleted}
          </div>
          <div className="text-calm-600">完了セクション</div>
        </div>

        {/* Required sections */}
        <div className="text-center">
          <div className={`font-bold text-lg ${classes.text}`}>
            {requiredSectionsCompleted}/{totalRequiredSections}
          </div>
          <div className="text-calm-600">必須セクション</div>
        </div>

        {/* Errors */}
        {errorCount > 0 && (
          <div className="text-center">
            <div className="font-bold text-lg text-red-600">
              {errorCount}
            </div>
            <div className="text-calm-600">エラー</div>
          </div>
        )}

        {/* Warnings */}
        {warningCount > 0 && (
          <div className="text-center">
            <div className="font-bold text-lg text-yellow-600">
              {warningCount}
            </div>
            <div className="text-calm-600">警告</div>
          </div>
        )}
      </div>

      {/* Tips */}
      {!isValid && (
        <div className={`mt-3 pt-3 border-t ${classes.border} border-opacity-50`}>
          <div className="flex items-start space-x-2">
            <Lightbulb className="w-4 h-4 text-calm-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-calm-600">
              {errorCount > 0 ? (
                <span>赤色でマークされた項目を修正してください。ヘルプテキストを参考にしてください。</span>
              ) : requiredSectionsCompleted < totalRequiredSections ? (
                <span>必須項目（*マーク）をすべて入力してください。リアルタイムで入力チェックを行います。</span>
              ) : (
                <span>任意項目も入力すると、より多くのマッチング機会が得られます。</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick validation summary component
interface QuickValidationSummaryProps {
  formSummary: FormValidationSummary;
  className?: string;
}

export function QuickValidationSummary({
  formSummary,
  className = '',
}: QuickValidationSummaryProps) {
  const { isValid, overallProgress, errorCount } = formSummary;

  const getStatusIcon = () => {
    if (isValid && overallProgress === 100) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (errorCount > 0) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return <Info className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (isValid && overallProgress === 100) {
      return '完成';
    }
    if (errorCount > 0) {
      return `${errorCount}個のエラー`;
    }
    return `${Math.round(overallProgress)}%完了`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium text-calm-700">
        {getStatusText()}
      </span>
    </div>
  );
}