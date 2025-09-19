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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-calm-700 mb-3">
          {userType === 'VTUBER' ? '興味のある配信ジャンル' : '得意なスキル・技術'}
        </label>
        
        {/* Preset Skills */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
          {availableSkills.map((skill) => {
            const isSelected = value.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`
                  px-3 py-2 text-sm rounded-lg border transition-all
                  ${isSelected
                    ? 'bg-primary-100 border-primary-300 text-primary-700'
                    : 'bg-white border-calm-300 text-calm-600 hover:border-calm-400'
                  }
                `}
              >
                {skill}
              </button>
            );
          })}
        </div>

        {/* Custom Skill Input */}
        <div className="flex space-x-2">
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
            className="flex-1 px-3 py-2 text-sm border border-calm-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addCustomSkill}
            disabled={!customSkill.trim()}
            className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            追加
          </button>
        </div>
      </div>

      {/* Selected Skills */}
      {value.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-calm-700 mb-2">
            選択中のスキル ({value.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {value.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-2 text-primary-500 hover:text-primary-700"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
      <div className="text-xs text-calm-500">
        <p>
          {userType === 'VTUBER' 
            ? '興味のある配信ジャンルを選択してください。これに基づいて適切な絵師さんをマッチングします。'
            : '得意なスキルを選択してください。これに基づいて適切なVTuberさんからの依頼をマッチングします。'
          }
        </p>
      </div>
    </div>
  );
}