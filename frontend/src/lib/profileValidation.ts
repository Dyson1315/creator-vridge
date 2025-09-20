'use client';

import { FieldValidationConfig, validationPatterns, ValidationResult } from '@/hooks/useFieldValidation';

// User type specific validation configs
export type UserType = 'VTUBER' | 'ARTIST';

// Profile field validation rules
export const profileValidationRules = {
  displayName: (userType: UserType): FieldValidationConfig => ({
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: validationPatterns.displayName,
    customValidator: (value: string): ValidationResult => {
      if (!value) {
        return { isValid: false, message: '表示名を入力してください', state: 'invalid' };
      }

      if (value.length < 2) {
        return { isValid: false, message: '表示名は2文字以上で入力してください', state: 'invalid' };
      }

      if (value.length > 50) {
        return { isValid: false, message: '表示名は50文字以内で入力してください', state: 'invalid' };
      }

      // Check for special characters
      if (!/^[^\u0000-\u001F\u007F-\u009F<>{}]*$/.test(value)) {
        return { isValid: false, message: '特殊文字は使用できません', state: 'invalid' };
      }

      // Check for common inappropriate terms (basic check)
      const inappropriateTerms = ['admin', 'administrator', 'root', 'system', 'null', 'undefined'];
      if (inappropriateTerms.some(term => value.toLowerCase().includes(term))) {
        return { isValid: false, message: 'この表示名は使用できません', state: 'invalid' };
      }

      return { isValid: true, state: 'valid' };
    },
  }),

  bio: (userType: UserType): FieldValidationConfig => ({
    required: false,
    maxLength: 500,
    customValidator: (value: string): ValidationResult => {
      if (!value || value.trim() === '') {
        return { isValid: true, state: 'neutral' };
      }

      if (value.length > 500) {
        return { isValid: false, message: '自己紹介は500文字以内で入力してください', state: 'invalid' };
      }

      // Check for excessive line breaks
      const lineBreaks = (value.match(/\n/g) || []).length;
      if (lineBreaks > 10) {
        return { isValid: false, message: '改行が多すぎます（10行以内）', state: 'invalid' };
      }

      return { isValid: true, state: 'valid' };
    },
  }),

  skills: (userType: UserType): FieldValidationConfig => ({
    required: true,
    customValidator: (value: string[]): ValidationResult => {
      if (!Array.isArray(value) || value.length === 0) {
        const minSkills = userType === 'ARTIST' ? 3 : 1;
        const message = userType === 'ARTIST' 
          ? '3つ以上のスキルを選択してください'
          : '1つ以上のスキルを選択してください';
        return { isValid: false, message, state: 'invalid' };
      }

      const minRequired = userType === 'ARTIST' ? 3 : 1;
      const maxAllowed = 10;

      if (value.length < minRequired) {
        const message = userType === 'ARTIST'
          ? `${minRequired}つ以上のスキルを選択してください`
          : `${minRequired}つ以上のスキルを選択してください`;
        return { isValid: false, message, state: 'invalid' };
      }

      if (value.length > maxAllowed) {
        return { isValid: false, message: `スキルは${maxAllowed}個まで選択できます`, state: 'invalid' };
      }

      return { isValid: true, state: 'valid' };
    },
  }),

  experience: (userType: UserType): FieldValidationConfig => ({
    required: true,
    customValidator: (value: number | string): ValidationResult => {
      if (value === undefined || value === null || value === '') {
        return { isValid: false, message: '活動年数を選択してください', state: 'invalid' };
      }

      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) {
        return { isValid: false, message: '有効な活動年数を選択してください', state: 'invalid' };
      }

      return { isValid: true, state: 'valid' };
    },
  }),

  priceRange: (userType: UserType): FieldValidationConfig => ({
    required: userType === 'ARTIST',
    customValidator: (value: { min: number; max: number }): ValidationResult => {
      if (userType !== 'ARTIST') {
        return { isValid: true, state: 'neutral' };
      }

      if (!value || typeof value.min !== 'number' || typeof value.max !== 'number') {
        return { isValid: false, message: '料金範囲を設定してください', state: 'invalid' };
      }

      if (value.min >= value.max) {
        return { isValid: false, message: '最低料金は最高料金より低く設定してください', state: 'invalid' };
      }

      if (value.min < 1000) {
        return { isValid: false, message: '最低料金は1,000円以上に設定してください', state: 'invalid' };
      }

      if (value.max > 1000000) {
        return { isValid: false, message: '最高料金は1,000,000円以下に設定してください', state: 'invalid' };
      }

      // Check for reasonable price ranges based on experience
      const priceDifference = value.max - value.min;
      if (priceDifference < 5000) {
        return { 
          isValid: false, 
          message: '料金範囲は5,000円以上の幅を持たせてください', 
          state: 'invalid' 
        };
      }

      return { isValid: true, state: 'valid' };
    },
  }),

  portfolioUrl: (): FieldValidationConfig => ({
    required: false,
    pattern: validationPatterns.url,
    asyncValidator: async (value: string): Promise<ValidationResult> => {
      if (!value || value.trim() === '') {
        return { isValid: true, state: 'neutral' };
      }

      // Basic URL format validation
      if (!validationPatterns.url.test(value)) {
        return { isValid: false, message: '有効なURLを入力してください', state: 'invalid' };
      }

      // Check for common portfolio platforms
      const allowedDomains = [
        'twitter.com', 'x.com', 'pixiv.net', 'artstation.com', 'deviantart.com',
        'instagram.com', 'youtube.com', 'twitch.tv', 'github.com', 'behance.net',
        'booth.pm', 'fanbox.cc', 'skeb.jp', 'coconala.com'
      ];

      try {
        const url = new URL(value);
        const isAllowedDomain = allowedDomains.some(domain => 
          url.hostname === domain || url.hostname.endsWith('.' + domain)
        );

        if (!isAllowedDomain) {
          return { 
            isValid: false, 
            message: '対応していないサイトです。主要なポートフォリオサイトのURLを入力してください', 
            state: 'invalid' 
          };
        }

        // Simulate async validation (e.g., checking if URL is accessible)
        await new Promise(resolve => setTimeout(resolve, 500));

        return { isValid: true, state: 'valid' };
      } catch {
        return { isValid: false, message: '有効なURLを入力してください', state: 'invalid' };
      }
    },
  }),

  email: (): FieldValidationConfig => ({
    required: false,
    pattern: validationPatterns.email,
    asyncValidator: async (value: string): Promise<ValidationResult> => {
      if (!value || value.trim() === '') {
        return { isValid: true, state: 'neutral' };
      }

      if (!validationPatterns.email.test(value)) {
        return { isValid: false, message: '有効なメールアドレスを入力してください', state: 'invalid' };
      }

      // Check for disposable email domains
      const disposableDomains = [
        '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 
        'tempmail.org', 'throwaway.email'
      ];

      const domain = value.split('@')[1]?.toLowerCase();
      if (disposableDomains.includes(domain)) {
        return { 
          isValid: false, 
          message: '一時的なメールアドレスは使用できません', 
          state: 'invalid' 
        };
      }

      // Simulate async validation (e.g., checking if email exists)
      await new Promise(resolve => setTimeout(resolve, 800));

      return { isValid: true, state: 'valid' };
    },
  }),

  timezone: (): FieldValidationConfig => ({
    required: false,
    customValidator: (value: string): ValidationResult => {
      if (!value) {
        return { isValid: true, state: 'neutral' };
      }

      const validTimezones = [
        'Asia/Tokyo', 'Asia/Seoul', 'America/Los_Angeles', 
        'America/New_York', 'Europe/London', 'Australia/Sydney',
        'Asia/Shanghai', 'Europe/Paris'
      ];

      if (!validTimezones.includes(value)) {
        return { isValid: false, message: '有効なタイムゾーンを選択してください', state: 'invalid' };
      }

      return { isValid: true, state: 'valid' };
    },
  }),

  preferredCommStyle: (): FieldValidationConfig => ({
    required: false,
    maxLength: 200,
    customValidator: (value: string): ValidationResult => {
      if (!value || value.trim() === '') {
        return { isValid: true, state: 'neutral' };
      }

      if (value.length > 200) {
        return { 
          isValid: false, 
          message: 'コミュニケーション方法は200文字以内で入力してください', 
          state: 'invalid' 
        };
      }

      return { isValid: true, state: 'valid' };
    },
  }),
};

// Get validation config for a field
export function getFieldValidation(
  fieldName: keyof typeof profileValidationRules,
  userType: UserType,
  additionalParams?: any
): FieldValidationConfig {
  const rule = profileValidationRules[fieldName];
  
  if (typeof rule === 'function') {
    // Check if the rule function accepts userType parameter
    if (rule.length > 0) {
      return (rule as (userType: UserType, additionalParams?: any) => FieldValidationConfig)(userType, additionalParams);
    } else {
      return (rule as () => FieldValidationConfig)();
    }
  }
  
  return (rule as () => FieldValidationConfig)();
}

// Get all validation configs for a user type
export function getProfileValidationConfig(userType: UserType): Record<string, FieldValidationConfig> {
  return {
    displayName: getFieldValidation('displayName', userType),
    bio: getFieldValidation('bio', userType),
    skills: getFieldValidation('skills', userType),
    experience: getFieldValidation('experience', userType),
    ...(userType === 'ARTIST' && {
      priceRange: getFieldValidation('priceRange', userType),
      portfolioUrl: getFieldValidation('portfolioUrl', userType),
    }),
    timezone: getFieldValidation('timezone', userType),
    preferredCommStyle: getFieldValidation('preferredCommStyle', userType),
  };
}

// Validation messages for form sections
export const sectionValidationMessages = {
  'basic-info': {
    incomplete: '表示名と基本情報を入力してください',
    complete: '基本情報の入力が完了しました',
  },
  'skills-experience': {
    incomplete: 'スキルと経験年数を選択してください',
    complete: 'スキル・経験情報の入力が完了しました',
  },
  'pricing-availability': {
    incomplete: '料金設定と稼働状況を設定してください',
    complete: '料金・稼働情報の設定が完了しました',
  },
  'portfolio': {
    incomplete: 'ポートフォリオURLを追加してください（任意）',
    complete: 'ポートフォリオ情報の設定が完了しました',
  },
  'communication': {
    incomplete: 'コミュニケーション設定を確認してください（任意）',
    complete: 'コミュニケーション設定が完了しました',
  },
} as const;

// Helper function to check if a section is valid
export function isSectionValid(
  sectionId: keyof typeof sectionValidationMessages,
  formData: any,
  userType: UserType
): boolean {
  switch (sectionId) {
    case 'basic-info':
      return !!(formData.displayName && formData.displayName.length >= 2);
    
    case 'skills-experience':
      const minSkills = userType === 'ARTIST' ? 3 : 1;
      return !!(
        formData.skills && 
        Array.isArray(formData.skills) && 
        formData.skills.length >= minSkills &&
        formData.experience !== undefined && 
        formData.experience !== null && 
        formData.experience !== ''
      );
    
    case 'pricing-availability':
      if (userType !== 'ARTIST') return true;
      return !!(
        formData.priceRangeMin && 
        formData.priceRangeMax && 
        formData.priceRangeMin < formData.priceRangeMax &&
        formData.availability
      );
    
    case 'portfolio':
      // Portfolio is optional, so always valid
      return true;
    
    case 'communication':
      // Communication settings are optional, so always valid
      return true;
    
    default:
      return false;
  }
}