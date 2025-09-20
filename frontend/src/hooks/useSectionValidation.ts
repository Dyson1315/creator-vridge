'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getProfileValidationConfig, 
  isSectionValid, 
  sectionValidationMessages,
  UserType 
} from '@/lib/profileValidation';
import { useFormValidation, FieldValidationConfig } from './useFieldValidation';

// Section validation state
export interface SectionValidationState {
  isValid: boolean;
  isComplete: boolean;
  hasErrors: boolean;
  progress: number;
  errors: string[];
  warnings: string[];
  fieldCount: number;
  validFieldCount: number;
}

// Form validation summary
export interface FormValidationSummary {
  isValid: boolean;
  overallProgress: number;
  sectionsCompleted: number;
  totalSections: number;
  requiredSectionsCompleted: number;
  totalRequiredSections: number;
  errorCount: number;
  warningCount: number;
}

// Section configuration
interface SectionConfig {
  id: string;
  name: string;
  fields: string[];
  isRequired: boolean;
  weight: number; // Weight for progress calculation
}

// Section configurations for different user types
const sectionConfigs: Record<UserType, SectionConfig[]> = {
  VTUBER: [
    {
      id: 'basic-info',
      name: '基本情報',
      fields: ['displayName', 'bio'],
      isRequired: true,
      weight: 30,
    },
    {
      id: 'skills-experience',
      name: 'スキル・経験',
      fields: ['skills', 'experience'],
      isRequired: true,
      weight: 30,
    },
    {
      id: 'communication',
      name: 'コミュニケーション',
      fields: ['timezone', 'preferredCommStyle'],
      isRequired: false,
      weight: 20,
    },
  ],
  ARTIST: [
    {
      id: 'basic-info',
      name: '基本情報',
      fields: ['displayName', 'bio'],
      isRequired: true,
      weight: 20,
    },
    {
      id: 'skills-experience',
      name: 'スキル・経験',
      fields: ['skills', 'experience'],
      isRequired: true,
      weight: 25,
    },
    {
      id: 'pricing-availability',
      name: '料金・稼働',
      fields: ['priceRange', 'availability'],
      isRequired: true,
      weight: 25,
    },
    {
      id: 'portfolio',
      name: 'ポートフォリオ',
      fields: ['portfolioUrl'],
      isRequired: false,
      weight: 15,
    },
    {
      id: 'communication',
      name: 'コミュニケーション',
      fields: ['timezone', 'preferredCommStyle'],
      isRequired: false,
      weight: 15,
    },
  ],
};

export function useSectionValidation(userType: UserType, formData: any) {
  const [sectionStates, setSectionStates] = useState<Record<string, SectionValidationState>>({});
  
  // Get validation configuration for the user type
  const validationConfig = useMemo(() => getProfileValidationConfig(userType), [userType]);
  
  // Get section configurations for the user type
  const sections = useMemo(() => sectionConfigs[userType], [userType]);
  
  // Initialize form validation
  const formValidation = useFormValidation({
    fields: validationConfig,
    validateOnChange: true,
    validateOnBlur: true,
  });

  // Calculate section validation state
  const calculateSectionState = useCallback((
    sectionId: string, 
    sectionFields: string[]
  ): SectionValidationState => {
    let validFieldCount = 0;
    let fieldCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check each field in the section
    sectionFields.forEach(fieldName => {
      fieldCount++;
      const fieldValidation = formValidation.fieldValidations[fieldName];
      
      if (fieldValidation) {
        if (fieldValidation.isValid) {
          validFieldCount++;
        } else if (fieldValidation.message) {
          errors.push(fieldValidation.message);
        }
      } else {
        // Field not validated yet or no validation result
        const fieldValue = formData[fieldName];
        const config = validationConfig[fieldName];
        
        if (config?.required && (!fieldValue || fieldValue === '')) {
          errors.push(`${getFieldDisplayName(fieldName)}を入力してください`);
        } else if (fieldValue) {
          validFieldCount++;
        }
      }
    });

    // Special validation for complex fields
    if (sectionId === 'skills-experience') {
      const skills = formData.skills || [];
      const minSkills = userType === 'ARTIST' ? 3 : 1;
      if (skills.length < minSkills) {
        const message = userType === 'ARTIST' 
          ? '3つ以上のスキルを選択してください'
          : '1つ以上のスキルを選択してください';
        errors.push(message);
      }
    }

    if (sectionId === 'pricing-availability' && userType === 'ARTIST') {
      const { priceRangeMin, priceRangeMax } = formData;
      if (priceRangeMin && priceRangeMax && priceRangeMin >= priceRangeMax) {
        errors.push('最低料金は最高料金より低く設定してください');
      }
    }

    // Calculate progress
    const progress = fieldCount > 0 ? (validFieldCount / fieldCount) * 100 : 0;
    
    // Check if section is complete using the validation helper
    const isComplete = isSectionValid(sectionId as any, formData, userType);
    
    return {
      isValid: errors.length === 0,
      isComplete,
      hasErrors: errors.length > 0,
      progress: Math.min(progress, 100),
      errors,
      warnings,
      fieldCount,
      validFieldCount,
    };
  }, [formData, formValidation.fieldValidations, userType, validationConfig]);

  // Update section states when form data or validations change
  useEffect(() => {
    const newSectionStates: Record<string, SectionValidationState> = {};
    
    sections.forEach(section => {
      newSectionStates[section.id] = calculateSectionState(section.id, section.fields);
    });
    
    setSectionStates(newSectionStates);
  }, [sections, calculateSectionState]);

  // Calculate form validation summary
  const formSummary = useMemo((): FormValidationSummary => {
    const sectionIds = sections.map(s => s.id);
    const requiredSections = sections.filter(s => s.isRequired);
    
    let overallProgress = 0;
    let sectionsCompleted = 0;
    let requiredSectionsCompleted = 0;
    let errorCount = 0;
    let warningCount = 0;

    // Calculate weighted progress
    sections.forEach(section => {
      const state = sectionStates[section.id];
      if (state) {
        overallProgress += (state.progress * section.weight) / 100;
        
        if (state.isComplete) {
          sectionsCompleted++;
          if (section.isRequired) {
            requiredSectionsCompleted++;
          }
        }
        
        errorCount += state.errors.length;
        warningCount += state.warnings.length;
      }
    });

    const isValid = requiredSectionsCompleted === requiredSections.length && errorCount === 0;

    return {
      isValid,
      overallProgress,
      sectionsCompleted,
      totalSections: sections.length,
      requiredSectionsCompleted,
      totalRequiredSections: requiredSections.length,
      errorCount,
      warningCount,
    };
  }, [sections, sectionStates]);

  // Get section validation state
  const getSectionValidation = useCallback((sectionId: string): SectionValidationState => {
    return sectionStates[sectionId] || {
      isValid: true,
      isComplete: false,
      hasErrors: false,
      progress: 0,
      errors: [],
      warnings: [],
      fieldCount: 0,
      validFieldCount: 0,
    };
  }, [sectionStates]);

  // Get section validation message
  const getSectionMessage = useCallback((sectionId: string): string => {
    const state = getSectionValidation(sectionId);
    const messages = sectionValidationMessages[sectionId as keyof typeof sectionValidationMessages];
    
    if (!messages) return '';
    
    if (state.hasErrors && state.errors.length > 0) {
      return state.errors[0]; // Return first error
    }
    
    if (state.isComplete) {
      return messages.complete;
    }
    
    return messages.incomplete;
  }, [getSectionValidation]);

  // Validate specific section
  const validateSection = useCallback(async (sectionId: string): Promise<SectionValidationState> => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      return getSectionValidation(sectionId);
    }

    // Trigger validation for all fields in the section
    const fieldValidations = await Promise.all(
      section.fields.map(fieldName => 
        formValidation.validateField(fieldName, formData[fieldName])
      )
    );

    // Recalculate section state
    const newState = calculateSectionState(sectionId, section.fields);
    
    setSectionStates(prev => ({
      ...prev,
      [sectionId]: newState,
    }));

    return newState;
  }, [sections, formValidation, formData, calculateSectionState, getSectionValidation]);

  // Validate all sections
  const validateAllSections = useCallback(async (): Promise<FormValidationSummary> => {
    // Validate all form fields
    await formValidation.validateAll(formData);
    
    // This will trigger the useEffect to recalculate section states
    return formSummary;
  }, [formValidation, formData, formSummary]);

  // Get next incomplete required section
  const getNextIncompleteSection = useCallback((): string | null => {
    const requiredSections = sections.filter(s => s.isRequired);
    
    for (const section of requiredSections) {
      const state = getSectionValidation(section.id);
      if (!state.isComplete) {
        return section.id;
      }
    }
    
    return null;
  }, [sections, getSectionValidation]);

  return {
    sectionStates,
    formSummary,
    getSectionValidation,
    getSectionMessage,
    validateSection,
    validateAllSections,
    getNextIncompleteSection,
    sections,
  };
}

// Helper function to get field display name
function getFieldDisplayName(fieldName: string): string {
  const fieldNames: Record<string, string> = {
    displayName: '表示名',
    bio: '自己紹介',
    skills: 'スキル',
    experience: '経験年数',
    priceRange: '料金設定',
    availability: '稼働状況',
    portfolioUrl: 'ポートフォリオURL',
    timezone: 'タイムゾーン',
    preferredCommStyle: 'コミュニケーション方法',
  };
  
  return fieldNames[fieldName] || fieldName;
}