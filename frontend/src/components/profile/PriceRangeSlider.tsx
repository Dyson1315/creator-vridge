'use client';

import React from 'react';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}

const PRICE_PRESETS = [
  { label: '~5万円', min: 1000, max: 50000 },
  { label: '5-10万円', min: 50000, max: 100000 },
  { label: '10-20万円', min: 100000, max: 200000 },
  { label: '20-50万円', min: 200000, max: 500000 },
  { label: '50万円~', min: 500000, max: 1000000 },
];

export default function PriceRangeSlider({ min, max, onMinChange, onMaxChange }: PriceRangeSliderProps) {
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${Math.floor(price / 10000)}万円`;
    }
    return `${price.toLocaleString()}円`;
  };

  const handlePresetClick = (preset: typeof PRICE_PRESETS[0]) => {
    onMinChange(preset.min);
    onMaxChange(preset.max);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-calm-700 mb-3">
          希望料金範囲
        </label>
        
        {/* Price Presets */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          {PRICE_PRESETS.map((preset, index) => {
            const isSelected = min >= preset.min && max <= preset.max;
            return (
              <button
                key={index}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`
                  px-3 py-2 text-sm rounded-lg border transition-all
                  ${isSelected
                    ? 'bg-primary-100 border-primary-300 text-primary-700'
                    : 'bg-white border-calm-300 text-calm-600 hover:border-calm-400'
                  }
                `}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Range Inputs */}
        <div className="space-y-4">
          {/* Min Price */}
          <div>
            <label className="block text-sm font-medium text-calm-600 mb-2">
              最低料金: {formatPrice(min)}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1000"
                max="500000"
                step="1000"
                value={min}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value);
                  if (newMin <= max) {
                    onMinChange(newMin);
                  }
                }}
                className="flex-1 h-2 bg-calm-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((min - 1000) / (500000 - 1000)) * 100}%, #E5E7EB ${((min - 1000) / (500000 - 1000)) * 100}%, #E5E7EB 100%)`
                }}
              />
              <input
                type="number"
                value={min}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value) || 1000;
                  if (newMin <= max && newMin >= 1000) {
                    onMinChange(newMin);
                  }
                }}
                className="w-24 px-2 py-1 text-sm border border-calm-300 rounded focus:ring-1 focus:ring-primary-500"
                min="1000"
                max="500000"
                step="1000"
              />
            </div>
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-medium text-calm-600 mb-2">
              最高料金: {formatPrice(max)}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1000"
                max="1000000"
                step="1000"
                value={max}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value);
                  if (newMax >= min) {
                    onMaxChange(newMax);
                  }
                }}
                className="flex-1 h-2 bg-calm-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((max - 1000) / (1000000 - 1000)) * 100}%, #E5E7EB ${((max - 1000) / (1000000 - 1000)) * 100}%, #E5E7EB 100%)`
                }}
              />
              <input
                type="number"
                value={max}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value) || 1000000;
                  if (newMax >= min && newMax <= 1000000) {
                    onMaxChange(newMax);
                  }
                }}
                className="w-24 px-2 py-1 text-sm border border-calm-300 rounded focus:ring-1 focus:ring-primary-500"
                min="1000"
                max="1000000"
                step="1000"
              />
            </div>
          </div>
        </div>

        {/* Range Display */}
        <div className="mt-4 p-4 bg-primary-50 rounded-lg">
          <div className="text-center">
            <span className="text-lg font-semibold text-primary-700">
              {formatPrice(min)} ～ {formatPrice(max)}
            </span>
          </div>
          <p className="text-sm text-primary-600 text-center mt-1">
            この価格帯でのマッチングを希望します
          </p>
        </div>
      </div>

      {/* Guidelines */}
      <div className="text-xs text-calm-500">
        <p>
          料金は作品の複雑さや期間によって変動する場合があります。
          この設定は初期のマッチング判定に使用され、実際の料金は個別に相談して決定します。
        </p>
      </div>
    </div>
  );
}