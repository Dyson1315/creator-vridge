'use client';

import React, { useState } from 'react';

interface SkillsSelectorProps {
  value: string[];
  onChange: (skills: string[]) => void;
  userType: 'VTUBER' | 'ARTIST';
}

const VTUBER_SKILLS = [
  'Live2D',
  '3Dモデル',
  'ゲーム実況',
  '歌枠',
  'ASMR',
  'トーク',
  'エンターテイメント',
  '教育・解説',
  'バーチャルライブ',
  'コラボ配信',
  'ショート動画',
  '雑談',
];

const ARTIST_SKILLS = [
  'Live2Dモデリング',
  'Live2Dリギング',
  '3Dモデリング',
  'キャラクターデザイン',
  'イラスト制作',
  'ロゴデザイン',
  'UI/UXデザイン',
  'アニメーション',
  'エフェクト制作',
  'ボイス・音響',
  'ゲーム開発',
  'Webデザイン',
  '動画編集',
  'グラフィックデザイン',
  'コンセプトアート',
  'テクスチャ制作',
];

export default function SkillsSelector({ value, onChange, userType }: SkillsSelectorProps) {
  const [customSkill, setCustomSkill] = useState('');

  const availableSkills = userType === 'VTUBER' ? VTUBER_SKILLS : ARTIST_SKILLS;

  const toggleSkill = (skill: string) => {
    const isSelected = value.includes(skill);
    if (isSelected) {
      onChange(value.filter(s => s !== skill));
    } else {
      onChange([...value, skill]);
    }
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !value.includes(customSkill.trim())) {
      onChange([...value, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    onChange(value.filter(s => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomSkill();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <label 
          className="block text-sm font-medium text-calm-700 mb-3"
          id="skills-section-label"
        >
          {userType === 'VTUBER' ? '興味のある配信ジャンル' : '得意なスキル・技術'}
        </label>
        
        {/* Preset Skills */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5"
          role="group"
          aria-labelledby="skills-section-label"
        >
          {availableSkills.map((skill) => {
            const isSelected = value.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                aria-pressed={isSelected}
                className={`
                  px-3 sm:px-4 py-3 sm:py-2 text-sm sm:text-sm rounded-lg border-2 transition-all font-medium min-h-[44px] sm:min-h-[36px] text-center active:scale-95
                  ${isSelected
                    ? 'bg-primary-100 border-primary-300 text-primary-700 shadow-sm'
                    : 'bg-white border-calm-300 text-calm-600 hover:border-calm-400 hover:bg-calm-50 active:bg-calm-100'
                  }
                `}
              >
                {skill}
              </button>
            );
          })}
        </div>

        {/* Custom Skill Input */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <input
            type="text"
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              userType === 'VTUBER' 
                ? 'カスタムジャンルを追加...' 
                : 'カスタムスキルを追加...'
            }
            aria-label={
              userType === 'VTUBER' 
                ? 'カスタムジャンルを入力' 
                : 'カスタムスキルを入力'
            }
            className="flex-1 px-3 sm:px-4 py-3 text-sm sm:text-base border border-calm-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors min-h-[44px]"
          />
          <button
            type="button"
            onClick={addCustomSkill}
            disabled={!customSkill.trim()}
            aria-label="スキルを追加"
            className="px-4 sm:px-6 py-3 text-sm sm:text-base bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px] active:bg-primary-700"
          >
            追加
          </button>
        </div>
      </div>

      {/* Selected Skills */}
      {value.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 sm:p-4">
          <label className="block text-sm font-medium text-calm-700 mb-3">
            選択中のスキル ({value.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {value.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-3 py-2 text-sm bg-white text-primary-700 rounded-full border border-primary-200 shadow-sm"
              >
                <span className="mr-2">{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  aria-label={`${skill}を削除`}
                  className="text-primary-500 hover:text-primary-700 p-1 rounded-full hover:bg-primary-100 transition-colors min-w-[24px] min-h-[24px] flex items-center justify-center"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-calm-50 border border-calm-200 rounded-lg p-3 sm:p-4">
        <div className="text-xs sm:text-sm text-calm-600 leading-relaxed">
          <p>
            {userType === 'VTUBER' 
              ? '興味のある配信ジャンルを選択してください。これに基づいて適切な絵師さんをマッチングします。'
              : '得意なスキルを選択してください。これに基づいて適切なVTuberさんからの依頼をマッチングします。'
            }
          </p>
        </div>
      </div>
    </div>
  );
}