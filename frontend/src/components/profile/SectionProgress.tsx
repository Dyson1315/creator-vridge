'use client';

import { User } from '@/lib/api';

export interface SectionValidation {
  [key: string]: (data: any, user: User) => boolean;
}

export interface ProgressCalculator {
  calculateSectionCompletion: (sectionId: string, formData: any, user: User) => boolean;
  calculateOverallProgress: (formData: any, user: User) => number;
  getRequiredFields: (sectionId: string, userType: 'VTUBER' | 'ARTIST') => string[];
}

export function createProgressCalculator(userType: 'VTUBER' | 'ARTIST'): ProgressCalculator {
  // Define validation rules for each section
  const sectionValidations: SectionValidation = {
    'basic-info': (data, user) => {
      const hasDisplayName = !!(data.displayName?.trim().length > 0);
      const hasBio = !!(data.bio?.trim().length > 0);
      const hasAvatar = !!(user.profile?.avatarUrl && user.profile.avatarUrl.length > 0);
      return hasDisplayName && hasBio && hasAvatar;
    },

    'skills-experience': (data) => {
      const hasSkills = data.skills?.length > 0;
      const hasExperience = data.experience !== undefined && data.experience !== '';
      return hasSkills && hasExperience;
    },

    'pricing-availability': (data) => {
      // Only for artists
      if (userType !== 'ARTIST') return true;
      
      const hasPriceRange = data.priceRangeMin > 0 && data.priceRangeMax > 0;
      const hasAvailability = data.availability && data.availability !== '';
      return hasPriceRange && hasAvailability;
    },

    'portfolio': (data) => {
      // Optional section for artists
      if (userType !== 'ARTIST') return true;
      
      // Consider completed if at least one portfolio URL is provided
      const portfolioUrls = data.portfolioUrls || [];
      return portfolioUrls.some((url: string) => url?.trim().length > 0);
    },

    'communication': (data) => {
      const hasTimezone = data.timezone?.length > 0;
      // Communication style is optional
      return hasTimezone;
    },
  };

  // Define required fields for each section
  const sectionRequiredFields = {
    'basic-info': ['displayName', 'bio', 'avatarUrl'],
    'skills-experience': ['skills', 'experience'],
    'pricing-availability': userType === 'ARTIST' ? ['priceRangeMin', 'priceRangeMax', 'availability'] : [],
    'portfolio': [], // Optional section
    'communication': ['timezone'],
  };

  const calculateSectionCompletion = (sectionId: string, formData: any, user: User): boolean => {
    const validator = sectionValidations[sectionId];
    if (!validator) return false;
    return validator(formData, user);
  };

  const calculateOverallProgress = (formData: any, user: User): number => {
    const sections = getSectionsForUserType(userType);
    const requiredSections = sections.filter(section => section.isRequired);
    const completedRequiredSections = requiredSections.filter(section =>
      calculateSectionCompletion(section.id, formData, user)
    );

    const optionalSections = sections.filter(section => !section.isRequired);
    const completedOptionalSections = optionalSections.filter(section =>
      calculateSectionCompletion(section.id, formData, user)
    );

    // Weight: 80% for required sections, 20% for optional sections
    const requiredProgress = requiredSections.length > 0 
      ? (completedRequiredSections.length / requiredSections.length) * 80 
      : 80;

    const optionalProgress = optionalSections.length > 0 
      ? (completedOptionalSections.length / optionalSections.length) * 20 
      : 20;

    return Math.min(100, requiredProgress + optionalProgress);
  };

  const getRequiredFields = (sectionId: string, userType: 'VTUBER' | 'ARTIST'): string[] => {
    return sectionRequiredFields[sectionId as keyof typeof sectionRequiredFields] || [];
  };

  return {
    calculateSectionCompletion,
    calculateOverallProgress,
    getRequiredFields,
  };
}

// Helper function to get sections for user type
function getSectionsForUserType(userType: 'VTUBER' | 'ARTIST') {
  const baseSections = [
    { id: 'basic-info', isRequired: true },
    { id: 'skills-experience', isRequired: true },
  ];

  const artistSections = [
    { id: 'pricing-availability', isRequired: true },
    { id: 'portfolio', isRequired: false },
  ];

  const communicationSection = { id: 'communication', isRequired: false };

  if (userType === 'ARTIST') {
    return [...baseSections, ...artistSections, communicationSection];
  } else {
    return [...baseSections, communicationSection];
  }
}

// Hook for real-time progress tracking
export function useProgressTracking(userType: 'VTUBER' | 'ARTIST', formData: any, user: User) {
  const calculator = createProgressCalculator(userType);
  
  const getSectionCompletion = (sectionId: string) => {
    return calculator.calculateSectionCompletion(sectionId, formData, user);
  };

  const getOverallProgress = () => {
    return calculator.calculateOverallProgress(formData, user);
  };

  const getSectionProgress = (sectionId: string) => {
    const requiredFields = calculator.getRequiredFields(sectionId, userType);
    if (requiredFields.length === 0) return 100;

    const completedFields = requiredFields.filter(field => {
      if (field === 'avatarUrl') {
        return user.profile?.avatarUrl && user.profile.avatarUrl.length > 0;
      }
      if (field === 'skills') {
        return formData.skills?.length > 0;
      }
      const value = formData[field];
      return value !== undefined && value !== '' && value !== null;
    });

    return (completedFields.length / requiredFields.length) * 100;
  };

  return {
    getSectionCompletion,
    getOverallProgress,
    getSectionProgress,
  };
}