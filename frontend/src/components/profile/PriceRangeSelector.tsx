'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface PriceRangeSelectorProps {
  min: number;
  max: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  experienceLevel?: number; // For providing recommendations
  className?: string;
}

// Preset price ranges based on Japanese creative industry standards
const PRICE_PRESETS = [
  {
    id: 'beginner',
    label: '初心者向け',
    range: '5,000-15,000円',
    min: 5000,
    max: 15000,
    description: '初めての方や練習用',
    recommended: [0, 1], // Experience levels this is recommended for
    popular: true
  },
  {
    id: 'standard',
    label: '標準的',
    range: '15,000-30,000円',
    min: 15000,
    max: 30000,
    description: '一般的な依頼価格帯',
    recommended: [1, 3],
    popular: true
  },
  {
    id: 'experienced',
    label: '経験者向け',
    range: '30,000-50,000円',
    min: 30000,
    max: 50000,
    description: '経験豊富な絵師向け',
    recommended: [3, 6],
    popular: false
  },
  {
    id: 'professional',
    label: 'プロフェッショナル',
    range: '50,000-100,000円',
    min: 50000,
    max: 100000,
    description: 'プロレベルの高品質',
    recommended: [6, 11],
    popular: false
  },
  {
    id: 'premium',
    label: 'プレミアム',
    range: '100,000円以上',
    min: 100000,
    max: 500000,
    description: '最高級の作品制作',
    recommended: [11],
    popular: false
  }
];

export default function PriceRangeSelector({ 
  min, 
  max, 
  onMinChange, 
  onMaxChange, 
  experienceLevel = 0,
  className 
}: PriceRangeSelectorProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customMin, setCustomMin] = useState(min.toString());
  const [customMax, setCustomMax] = useState(max.toString());
  const [validationError, setValidationError] = useState<string | null>(null);

  // Format price for display
  const formatPrice = (price: number): string => {
    if (price >= 10000) {
      const man = Math.floor(price / 10000);
      const remainder = price % 10000;
      if (remainder === 0) {
        return `${man}万円`;
      } else {
        return `${man}.${Math.floor(remainder / 1000)}万円`;
      }
    }
    return `${price.toLocaleString()}円`;
  };

  // Check if a preset is currently selected
  const getSelectedPreset = () => {
    return PRICE_PRESETS.find(preset => 
      min >= preset.min && max <= preset.max && 
      Math.abs(min - preset.min) < 1000 && Math.abs(max - preset.max) < 1000
    );
  };

  // Get recommended presets based on experience level
  const getRecommendedPresets = () => {
    return PRICE_PRESETS.filter(preset => 
      preset.recommended.some(level => experienceLevel >= level && experienceLevel < (level + 3))
    );
  };

  // Handle preset selection
  const handlePresetSelect = (preset: typeof PRICE_PRESETS[0]) => {
    onMinChange(preset.min);
    onMaxChange(preset.max);
    setIsCustomMode(false);
    setValidationError(null);
  };

  // Handle custom mode toggle
  const handleCustomModeToggle = () => {
    if (!isCustomMode) {
      setCustomMin(min.toString());
      setCustomMax(max.toString());
    }
    setIsCustomMode(!isCustomMode);
    setValidationError(null);
  };

  // Validate and apply custom values
  const handleCustomApply = () => {
    const minVal = parseInt(customMin) || 0;
    const maxVal = parseInt(customMax) || 0;

    // Validation
    if (minVal < 1000) {
      setValidationError('最低料金は1,000円以上で設定してください');
      return;
    }
    if (maxVal > 1000000) {
      setValidationError('最高料金は1,000,000円以下で設定してください');
      return;
    }
    if (minVal >= maxVal) {
      setValidationError('最低料金は最高料金より低く設定してください');
      return;
    }

    onMinChange(minVal);
    onMaxChange(maxVal);
    setValidationError(null);
  };

  // Auto-apply custom values on valid input
  useEffect(() => {
    if (isCustomMode && customMin && customMax) {
      const minVal = parseInt(customMin) || 0;
      const maxVal = parseInt(customMax) || 0;
      
      if (minVal >= 1000 && maxVal <= 1000000 && minVal < maxVal) {
        setValidationError(null);
      }
    }
  }, [customMin, customMax, isCustomMode]);

  const selectedPreset = getSelectedPreset();
  const recommendedPresets = getRecommendedPresets();

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <label className="block text-sm font-medium text-calm-700 mb-3">
          希望料金範囲
        </label>
        
        {/* Recommendation Badge */}
        {experienceLevel > 0 && recommendedPresets.length > 0 && (
          <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-xl">
            <div className="flex items-center space-x-2 mb-1">
              <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-primary-700">あなたにおすすめ</span>
            </div>
            <p className="text-sm text-primary-600">
              {experienceLevel < 3 ? '初心者' : experienceLevel < 6 ? '経験者' : 'プロフェッショナル'}
              レベルの方には以下の価格帯が人気です
            </p>
          </div>
        )}

        {/* Preset Price Buttons */}
        <div className="space-y-3">
          {PRICE_PRESETS.map((preset) => {
            const isSelected = selectedPreset?.id === preset.id;
            const isRecommended = recommendedPresets.some(rec => rec.id === preset.id);
            
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={cn(
                  "w-full p-4 text-left border-2 rounded-xl transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2",
                  "min-h-[60px] touch-manipulation", // Minimum touch target size
                  isSelected
                    ? "bg-primary-100 border-primary-300 text-primary-700"
                    : "bg-white border-calm-300 text-calm-700 hover:border-calm-400 hover:bg-calm-50"
                )}
                aria-pressed={isSelected}
                aria-describedby={`preset-${preset.id}-description`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-base">{preset.label}</span>
                      {preset.popular && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-secondary-100 text-secondary-700 rounded-full">
                          人気
                        </span>
                      )}
                      {isRecommended && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary-200 text-primary-700 rounded-full">
                          おすすめ
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-calm-900">{preset.range}</div>
                    <div className="text-xs text-calm-500 mt-0.5" id={`preset-${preset.id}-description`}>
                      {preset.description}
                    </div>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    isSelected 
                      ? "border-primary-500 bg-primary-500" 
                      : "border-calm-300"
                  )}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Custom Setting Option */}
          <button
            type="button"
            onClick={handleCustomModeToggle}
            className={cn(
              "w-full p-4 text-left border-2 rounded-xl transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2",
              "min-h-[60px] touch-manipulation",
              isCustomMode
                ? "bg-primary-100 border-primary-300 text-primary-700"
                : "bg-white border-calm-300 text-calm-700 hover:border-calm-400 hover:bg-calm-50"
            )}
            aria-pressed={isCustomMode}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-base mb-1">カスタム設定</div>
                <div className="text-sm text-calm-600">
                  {isCustomMode ? 
                    `${formatPrice(min)} ～ ${formatPrice(max)}` : 
                    '自由に料金範囲を設定する'
                  }
                </div>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                isCustomMode 
                  ? "border-primary-500 bg-primary-500" 
                  : "border-calm-300"
              )}>
                {isCustomMode && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Custom Input Fields */}
        {isCustomMode && (
          <div className="mt-4 p-4 bg-calm-50 rounded-xl space-y-4 animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">
                  最低料金（円）
                </label>
                <input
                  type="number"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  placeholder="例: 10000"
                  min="1000"
                  max="500000"
                  step="1000"
                  className={cn(
                    "w-full px-4 py-3 text-calm-900 bg-white border rounded-xl",
                    "placeholder:text-calm-400 touch-manipulation",
                    "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent",
                    "text-base", // Prevent zoom on iOS
                    validationError ? "border-red-300" : "border-calm-300"
                  )}
                  aria-label="最低料金を入力"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">
                  最高料金（円）
                </label>
                <input
                  type="number"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  placeholder="例: 50000"
                  min="1000"
                  max="1000000"
                  step="1000"
                  className={cn(
                    "w-full px-4 py-3 text-calm-900 bg-white border rounded-xl",
                    "placeholder:text-calm-400 touch-manipulation",
                    "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent",
                    "text-base", // Prevent zoom on iOS
                    validationError ? "border-red-300" : "border-calm-300"
                  )}
                  aria-label="最高料金を入力"
                />
              </div>
            </div>

            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{validationError}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                type="button"
                onClick={handleCustomApply}
                size="sm"
                className="flex-1"
                disabled={!customMin || !customMax}
              >
                適用
              </Button>
              <Button
                type="button"
                onClick={() => setIsCustomMode(false)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </div>
        )}

        {/* Current Selection Display */}
        <div className="mt-6 p-4 bg-primary-50 rounded-xl">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary-700 mb-1">
              {formatPrice(min)} ～ {formatPrice(max)}
            </div>
            <p className="text-sm text-primary-600">
              この価格帯でのマッチングを希望します
            </p>
          </div>
        </div>

        {/* Helpful Guidelines */}
        <div className="mt-4 p-4 bg-calm-50 rounded-lg">
          <h4 className="text-sm font-medium text-calm-700 mb-2">料金設定のガイドライン</h4>
          <ul className="text-xs text-calm-600 space-y-1">
            <li>• 作品の複雑さや制作期間によって料金は変動する場合があります</li>
            <li>• この設定は初期のマッチング判定に使用されます</li>
            <li>• 実際の料金は個別相談で最終決定します</li>
            <li>• 経験を積んだら料金帯を見直すことをおすすめします</li>
          </ul>
        </div>
      </div>
    </div>
  );
}