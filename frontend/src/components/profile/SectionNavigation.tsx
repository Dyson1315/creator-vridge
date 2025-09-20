'use client';

import React from 'react';
import { User, Briefcase, DollarSign, Image, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { SaveStatusBadge } from './SaveStatusIndicator';
import { AutoSaveState } from '@/hooks/useAutoSave';

export interface SectionInfo {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isCompleted: boolean;
  isRequired: boolean;
  hasErrors?: boolean;
  progress?: number;
  validationMessage?: string;
}

interface SectionNavigationProps {
  sections: SectionInfo[];
  currentSection: string;
  onSectionClick: (sectionId: string) => void;
  overallProgress: number;
  autoSaveState?: AutoSaveState;
  className?: string;
}

export default function SectionNavigation({
  sections,
  currentSection,
  onSectionClick,
  overallProgress,
  autoSaveState,
  className = '',
}: SectionNavigationProps) {
  return (
    <div className={`bg-white border-b border-calm-200 sticky top-0 z-40 ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-calm-100 h-1">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500 ease-out"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Progress Text */}
          <div className="hidden sm:flex items-center space-x-3">
            <span className="text-sm font-medium text-calm-600">
              プロフィール完成度
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-calm-200 rounded-full h-2">
                <div
                  className="h-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-calm-700">
                {Math.round(overallProgress)}%
              </span>
            </div>
            {/* Auto-save status */}
            {autoSaveState && (
              <SaveStatusBadge autoSaveState={autoSaveState} />
            )}
          </div>

          {/* Mobile Progress */}
          <div className="sm:hidden flex items-center space-x-2">
            <span className="text-xs font-medium text-calm-600">完成度</span>
            <span className="text-xs font-semibold text-calm-700">
              {Math.round(overallProgress)}%
            </span>
            {/* Mobile Auto-save status */}
            {autoSaveState && (
              <SaveStatusBadge autoSaveState={autoSaveState} />
            )}
          </div>
        </div>

        {/* Section Tabs */}
        <nav 
          className="flex overflow-x-auto scrollbar-hide pb-1 -mx-1"
          role="tablist"
          aria-label="プロフィールフォームセクション"
        >
          <div className="flex space-x-1 sm:space-x-2 min-w-max px-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = currentSection === section.id;
              const isCompleted = section.isCompleted;

              return (
                <button
                  key={section.id}
                  onClick={() => onSectionClick(section.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSectionClick(section.id);
                    }
                  }}
                  className={`
                    relative flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 
                    rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200
                    min-w-[80px] sm:min-w-[120px] justify-center sm:justify-start
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    ${isActive
                      ? 'bg-primary-50 text-primary-700 border-2 border-primary-200'
                      : section.hasErrors
                      ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-2 border-red-200'
                      : 'text-calm-600 hover:text-calm-800 hover:bg-calm-50 border-2 border-transparent'
                    }
                    ${isCompleted ? 'shadow-sm' : ''}
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`${section.title}セクション${isCompleted ? '（完了済み）' : section.hasErrors ? '（エラーあり）' : ''}${isActive ? '（現在のセクション）' : ''}`}
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                >
                  {/* Status Indicator */}
                  {(isCompleted || section.hasErrors) && (
                    <div className={`
                      absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white flex items-center justify-center
                      ${isCompleted ? 'bg-green-500' : section.hasErrors ? 'bg-red-500' : 'bg-yellow-500'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-2 h-2 text-white" />
                      ) : section.hasErrors ? (
                        <AlertCircle className="w-2 h-2 text-white" />
                      ) : (
                        <div className="w-1 h-1 bg-white rounded-full" />
                      )}
                    </div>
                  )}

                  {/* Icon */}
                  <Icon className={`
                    w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0
                    ${isActive ? 'text-primary-600' : 'text-current'}
                    ${isCompleted ? 'text-green-600' : section.hasErrors ? 'text-red-600' : ''}
                  `} />

                  {/* Title - Hidden on very small screens */}
                  <span className="hidden sm:inline font-medium truncate">
                    {section.title}
                  </span>

                  {/* Status indicators */}
                  <div className="hidden sm:flex items-center space-x-1">
                    {section.isRequired && !isCompleted && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                    {section.hasErrors && (
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    )}
                    {section.progress !== undefined && section.progress > 0 && !isCompleted && (
                      <div className="w-8 bg-calm-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all duration-300 ${
                            section.hasErrors ? 'bg-red-400' : 'bg-yellow-400'
                          }`}
                          style={{ width: `${section.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

// Hook for managing section navigation
export function useSectionNavigation(userType: 'VTUBER' | 'ARTIST') {
  const getSections = (): Omit<SectionInfo, 'isCompleted'>[] => {
    const baseSections = [
      {
        id: 'basic-info',
        title: '基本情報',
        icon: User,
        isRequired: true,
      },
      {
        id: 'skills-experience',
        title: 'スキル・経験',
        icon: Briefcase,
        isRequired: true,
      },
    ];

    const artistSections = [
      {
        id: 'pricing-availability',
        title: '料金・稼働',
        icon: DollarSign,
        isRequired: true,
      },
      {
        id: 'portfolio',
        title: 'ポートフォリオ',
        icon: Image,
        isRequired: false,
      },
    ];

    const communicationSection = {
      id: 'communication',
      title: 'コミュニケーション',
      icon: MessageCircle,
      isRequired: false,
    };

    if (userType === 'ARTIST') {
      return [...baseSections, ...artistSections, communicationSection];
    } else {
      return [...baseSections, communicationSection];
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const headerHeight = 120; // Approximate height of sticky navigation
      const elementPosition = element.offsetTop - headerHeight;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    }
  };

  return {
    getSections,
    scrollToSection,
  };
}