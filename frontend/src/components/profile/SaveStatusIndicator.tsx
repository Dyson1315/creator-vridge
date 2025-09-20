'use client';

import React from 'react';
import { Save, Check, Clock, AlertCircle } from 'lucide-react';
import { AutoSaveState, formatTimeAgo } from '@/hooks/useAutoSave';

interface SaveStatusIndicatorProps {
  autoSaveState: AutoSaveState;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function SaveStatusIndicator({
  autoSaveState,
  className = '',
  showText = true,
  size = 'md'
}: SaveStatusIndicatorProps) {
  const { isAutoSaving, lastSaved, hasUnsavedChanges, hasDraft } = autoSaveState;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  const renderStatus = () => {
    if (isAutoSaving) {
      return (
        <div className={`flex items-center space-x-2 text-blue-600 ${getSizeClasses()}`}>
          <Save className={`${getIconSize()} animate-pulse`} />
          {showText && <span className="font-medium">自動保存中...</span>}
        </div>
      );
    }

    if (hasUnsavedChanges) {
      return (
        <div className={`flex items-center space-x-2 text-amber-600 ${getSizeClasses()}`}>
          <Clock className={getIconSize()} />
          {showText && <span>未保存の変更があります</span>}
        </div>
      );
    }

    if (lastSaved) {
      return (
        <div className={`flex items-center space-x-2 text-green-600 ${getSizeClasses()}`}>
          <Check className={getIconSize()} />
          {showText && (
            <span>
              最終保存: {formatTimeAgo(lastSaved)}
            </span>
          )}
        </div>
      );
    }

    if (hasDraft) {
      return (
        <div className={`flex items-center space-x-2 text-purple-600 ${getSizeClasses()}`}>
          <AlertCircle className={getIconSize()} />
          {showText && <span>下書きが利用可能</span>}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`transition-all duration-200 ${className}`}>
      {renderStatus()}
    </div>
  );
}

// Compact version for navigation/header
export function SaveStatusBadge({
  autoSaveState,
  className = '',
}: {
  autoSaveState: AutoSaveState;
  className?: string;
}) {
  const { isAutoSaving, hasUnsavedChanges, lastSaved } = autoSaveState;

  if (isAutoSaving) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium ${className}`}>
        <Save className="w-3 h-3 mr-1 animate-pulse" />
        保存中
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium ${className}`}>
        <Clock className="w-3 h-3 mr-1" />
        未保存
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium ${className}`}>
        <Check className="w-3 h-3 mr-1" />
        保存済み
      </div>
    );
  }

  return null;
}