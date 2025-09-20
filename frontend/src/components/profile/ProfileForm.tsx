'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { User } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ValidatedInput from '@/components/ui/ValidatedInput';
import ValidatedTextarea from '@/components/ui/ValidatedTextarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import AvatarUpload from './AvatarUpload';
import SkillsSelector from './SkillsSelector';
import PriceRangeSelector from './PriceRangeSelector';
import SectionNavigation, { useSectionNavigation, SectionInfo } from './SectionNavigation';
import FormSection, { useFormSections } from './FormSection';
import { useProgressTracking } from './SectionProgress';
import { useAutoSave } from '@/hooks/useAutoSave';
import SaveStatusIndicator from './SaveStatusIndicator';
import DraftRestoreModal from './DraftRestoreModal';
import AutoSaveControls from './AutoSaveControls';
import { useSectionValidation } from '@/hooks/useSectionValidation';
import { getFieldValidation, UserType } from '@/lib/profileValidation';
import ValidationStatus from './ValidationStatus';

interface ProfileFormData {
  displayName: string;
  bio: string;
  skills: string[];
  priceRangeMin: number;
  priceRangeMax: number;
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  timezone: string;
  preferredCommStyle: string;
  experience: number;
  portfolioUrls: string[];
}

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentSection, setCurrentSection] = useState('basic-info');
  const [showDraftModal, setShowDraftModal] = useState(false);
  const { setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      displayName: user.profile?.displayName || '',
      bio: user.profile?.bio || '',
      skills: user.profile?.skills || [],
      priceRangeMin: user.profile?.priceRangeMin || 5000,
      priceRangeMax: user.profile?.priceRangeMax || 50000,
      availability: user.profile?.availability || 'AVAILABLE',
      timezone: user.profile?.timezone || 'Asia/Tokyo',
      preferredCommStyle: user.profile?.preferredCommStyle || '',
      experience: user.profile?.experience || 0,
      portfolioUrls: user.profile?.portfolioUrls || [],
    },
  });

  const availability = watch('availability');
  const userType = user.userType as UserType;
  const formData = watch();

  // Progressive validation
  const {
    sectionStates,
    formSummary,
    getSectionValidation,
    getSectionMessage,
    validateSection,
    validateAllSections,
    getNextIncompleteSection,
  } = useSectionValidation(userType, formData);

  // Auto-save functionality
  const [autoSaveState, autoSaveActions] = useAutoSave(watch, getValues, {
    key: `${user.id}_${userType}`,
    delay: 2000,
    enabled: true,
    validate: (data) => {
      // Only save if basic required fields are present
      return !!(data.displayName || data.bio || data.skills?.length);
    },
    onSave: () => {
      console.log('Draft saved successfully');
    },
    onRestore: (data) => {
      console.log('Draft restored:', data);
    },
    onError: (error) => {
      console.error('Auto-save error:', error);
    }
  });

  // Section navigation and progress tracking
  const { getSections, scrollToSection } = useSectionNavigation(userType);
  const { scrollToSection: scrollToFormSection } = useFormSections();
  const { getSectionCompletion, getOverallProgress, getSectionProgress } = useProgressTracking(userType, formData, user);

  // Get sections with completion status and validation
  const sections: SectionInfo[] = getSections().map(section => {
    const validation = getSectionValidation(section.id);
    return {
      ...section,
      isCompleted: validation.isComplete,
      hasErrors: validation.hasErrors,
      progress: validation.progress,
      validationMessage: getSectionMessage(section.id),
    };
  });

  const overallProgress = formSummary.overallProgress;

  // Check for draft on mount
  useEffect(() => {
    if (autoSaveState.hasDraft && autoSaveState.draftAge !== null) {
      setShowDraftModal(true);
    }
  }, [autoSaveState.hasDraft, autoSaveState.draftAge]);

  // Handle section navigation with auto-save
  const handleSectionClick = (sectionId: string) => {
    // Save current progress before switching sections
    if (autoSaveState.hasUnsavedChanges) {
      autoSaveActions.forceSave();
    }
    setCurrentSection(sectionId);
    scrollToFormSection(sectionId);
  };

  // Auto-update current section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['basic-info', 'skills-experience', 'pricing-availability', 'portfolio', 'communication'];
      const scrollPosition = window.scrollY + 150;

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(`section-${sections[i]}`);
        if (element && element.offsetTop <= scrollPosition) {
          setCurrentSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Draft restoration functions
  const handleRestoreDraft = async () => {
    const draftData = await autoSaveActions.restoreDraft();
    if (draftData) {
      // Restore form data
      Object.keys(draftData).forEach((key) => {
        setValue(key as keyof ProfileFormData, draftData[key]);
      });
      setShowDraftModal(false);
    }
  };

  const handleDiscardDraft = () => {
    autoSaveActions.clearDraft();
    setShowDraftModal(false);
  };

  // Generate draft preview for modal
  const getDraftPreview = () => {
    const data = getValues();
    return {
      displayName: data.displayName,
      bio: data.bio,
      skills: data.skills,
      sections: Object.keys(data).filter(key => 
        data[key as keyof ProfileFormData] !== '' && 
        data[key as keyof ProfileFormData] !== null &&
        (Array.isArray(data[key as keyof ProfileFormData]) ? 
          (data[key as keyof ProfileFormData] as any[]).length > 0 : true)
      )
    };
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Validate all sections before submission
    const validationSummary = await validateAllSections();
    
    if (!validationSummary.isValid) {
      setError('入力に誤りがあります。赤色でマークされた項目を確認してください。');
      setIsLoading(false);
      
      // Scroll to first incomplete required section
      const nextSection = getNextIncompleteSection();
      if (nextSection) {
        scrollToFormSection(nextSection);
      }
      return;
    }

    try {
      const response = await apiClient.updateProfile({
        displayName: data.displayName,
        bio: data.bio,
        skills: data.skills,
        priceRangeMin: data.priceRangeMin,
        priceRangeMax: data.priceRangeMax,
        availability: data.availability,
        timezone: data.timezone,
        preferredCommStyle: data.preferredCommStyle,
        experience: data.experience,
        portfolioUrls: data.portfolioUrls.filter(url => url.trim() !== ''),
      });

      if (response.data) {
        // Update user in auth store
        setUser({
          ...user,
          profile: response.data,
        });
        
        // Clear draft after successful submission
        autoSaveActions.clearDraft();
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpdate = (avatarUrl: string) => {
    // Update user in auth store with new avatar
    setUser({
      ...user,
      profile: {
        ...user.profile!,
        avatarUrl,
      },
    });
  };

  return (
    <div className="relative">
      {/* Section Navigation */}
      <SectionNavigation
        sections={sections}
        currentSection={currentSection}
        onSectionClick={handleSectionClick}
        overallProgress={overallProgress}
        autoSaveState={autoSaveState}
        className="mb-6"
      />

      {/* Validation Status */}
      <ValidationStatus
        formSummary={formSummary}
        onScrollToErrors={() => {
          const nextSection = getNextIncompleteSection();
          if (nextSection) {
            scrollToFormSection(nextSection);
          }
        }}
        className="mb-6"
      />

      {/* Auto-save status and controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-calm-50 border border-calm-200 rounded-xl">
        <SaveStatusIndicator autoSaveState={autoSaveState} />
        <AutoSaveControls
          autoSaveState={autoSaveState}
          autoSaveActions={autoSaveActions}
          showExportImport={true}
          onExport={() => getValues()}
          onImport={(data) => {
            Object.keys(data).forEach((key) => {
              setValue(key as keyof ProfileFormData, data[key]);
            });
          }}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <FormSection
          id="basic-info"
          title="基本情報"
          description="プロフィールの基本的な情報を入力してください"
          isCompleted={getSectionValidation('basic-info').isComplete}
          hasErrors={getSectionValidation('basic-info').hasErrors}
          progress={getSectionValidation('basic-info').progress}
          validationMessage={getSectionMessage('basic-info')}
          errorCount={getSectionValidation('basic-info').errors.length}
          warningCount={getSectionValidation('basic-info').warnings.length}
          isRequired={true}
        >
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-3 sm:space-y-4 py-2">
            <AvatarUpload
              currentAvatar={user.profile?.avatarUrl}
              onUpload={handleAvatarUpdate}
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <ValidatedInput
              label="表示名"
              placeholder={userType === 'VTUBER' ? 'VTuber名' : 'ペンネーム・アーティスト名'}
              validation={getFieldValidation('displayName', userType)}
              contextualHelp={userType === 'VTUBER' ? 
                'VTuberとしての活動名を入力してください。2-50文字で、特殊文字は使用できません。' :
                'アーティストとしての活動名を入力してください。2-50文字で、特殊文字は使用できません。'
              }
              successMessage="有効な表示名です"
              showCharacterCount
              value={watch('displayName')}
              onChange={(value) => setValue('displayName', value)}
              id="displayName"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <ValidatedTextarea
              id="bio-textarea"
              label="自己紹介"
              placeholder={
                userType === 'VTUBER'
                  ? 'あなたの活動内容や、どんな絵師さんと一緒に仕事をしたいか教えてください'
                  : 'あなたの得意な絵柄や、これまでの実績について教えてください'
              }
              validation={getFieldValidation('bio', userType)}
              contextualHelp={userType === 'VTUBER' ? 
                'VTuberとしての活動内容、希望する作品のジャンル、絵師さんに求めることなどを書いてください。' :
                '得意な絵柄、これまでの実績、制作できる作品の種類などを書いてください。'
              }
              successMessage="魅力的な自己紹介です"
              showCharacterCount
              maxLength={500}
              rows={4}
              autoResize
              value={watch('bio')}
              onChange={(value) => setValue('bio', value)}
            />
          </div>
        </FormSection>

        {/* Skills and Experience */}
        <FormSection
          id="skills-experience"
          title={userType === 'VTUBER' ? '求めるスキル・経験' : '得意なスキル・経験'}
          description={userType === 'VTUBER' ? 'あなたが求めるスキルや経験レベルを選択してください' : 'あなたの得意なスキルや経験年数を選択してください'}
          isCompleted={getSectionValidation('skills-experience').isComplete}
          hasErrors={getSectionValidation('skills-experience').hasErrors}
          progress={getSectionValidation('skills-experience').progress}
          validationMessage={getSectionMessage('skills-experience')}
          errorCount={getSectionValidation('skills-experience').errors.length}
          warningCount={getSectionValidation('skills-experience').warnings.length}
          isRequired={true}
        >
          <div className="space-y-2">
            <Controller
              name="skills"
              control={control}
              rules={{
                validate: (value) => {
                  const minSkills = userType === 'ARTIST' ? 3 : 1;
                  if (!Array.isArray(value) || value.length < minSkills) {
                    return userType === 'ARTIST' 
                      ? '3つ以上のスキルを選択してください'
                      : '1つ以上のスキルを選択してください';
                  }
                  return true;
                }
              }}
              render={({ field, fieldState }) => (
                <div>
                  <label className="block text-sm font-medium text-calm-700 mb-2">
                    {userType === 'VTUBER' ? '求めるスキル' : '得意なスキル'}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <SkillsSelector
                    value={field.value}
                    onChange={field.onChange}
                    userType={userType}
                  />
                  {fieldState.error && (
                    <p className="mt-2 text-sm text-red-600 animate-slide-down" role="alert">
                      {fieldState.error.message}
                    </p>
                  )}
                  {userType === 'ARTIST' && (
                    <p className="mt-1 text-xs text-calm-500">
                      最低3つのスキルを選択してください。より多くのスキルを選択すると、マッチング機会が増えます。
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <label 
              className="block text-sm font-medium text-calm-700 mb-2"
              htmlFor="experience-select"
            >
              {userType === 'VTUBER' ? 'VTuber活動年数' : '絵師活動年数'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="experience-select"
              className={`w-full px-3 sm:px-4 py-3 text-sm sm:text-base border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors appearance-none bg-white ${
                errors.experience ? 'border-red-300' : 'border-calm-300'
              }`}
              {...register('experience', {
                required: '活動年数を選択してください',
              })}
            >
              <option value="">選択してください</option>
              <option value={0}>1年未満</option>
              <option value={1}>1-2年</option>
              <option value={3}>3-5年</option>
              <option value={6}>6-10年</option>
              <option value={11}>10年以上</option>
            </select>
            {errors.experience && (
              <p className="mt-2 text-sm text-red-600 animate-slide-down" role="alert">{errors.experience.message}</p>
            )}
            {!errors.experience && watch('experience') !== undefined && watch('experience') !== null && (
              <p className="mt-1 text-xs text-green-600">
                ✓ 経験年数が設定されました
              </p>
            )}
          </div>
        </FormSection>

        {/* Pricing and Availability (Artist only) */}
        {userType === 'ARTIST' && (
          <FormSection
            id="pricing-availability"
            title="料金・稼働情報"
            description="あなたの料金設定と現在の稼働状況を設定してください"
            isCompleted={getSectionValidation('pricing-availability').isComplete}
            hasErrors={getSectionValidation('pricing-availability').hasErrors}
            progress={getSectionValidation('pricing-availability').progress}
            validationMessage={getSectionMessage('pricing-availability')}
            errorCount={getSectionValidation('pricing-availability').errors.length}
            warningCount={getSectionValidation('pricing-availability').warnings.length}
            isRequired={true}
          >
            {/* Price Range */}
            <div className="space-y-2">
              <Controller
                name="priceRangeMin"
                control={control}
                render={({ field }) => (
                  <Controller
                    name="priceRangeMax"
                    control={control}
                    render={({ field: maxField }) => (
                      <PriceRangeSelector
                        min={field.value}
                        max={maxField.value}
                        onMinChange={field.onChange}
                        onMaxChange={maxField.onChange}
                        experienceLevel={watch('experience')}
                      />
                    )}
                  />
                )}
              />
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-calm-700">
                稼働状況
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                {[
                  { value: 'AVAILABLE', label: '稼働中', color: 'bg-green-50 border-green-200 text-green-700' },
                  { value: 'BUSY', label: '多忙', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                  { value: 'UNAVAILABLE', label: '停止中', color: 'bg-red-50 border-red-200 text-red-700' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`
                      flex items-center justify-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all min-h-[44px] text-sm sm:text-base
                      ${availability === option.value 
                        ? option.color 
                        : 'bg-white border-calm-200 text-calm-600 hover:border-calm-300 active:bg-calm-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      className="sr-only"
                      {...register('availability')}
                    />
                    <span className="font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </FormSection>
        )}

        {/* Portfolio URLs (Artist only) */}
        {userType === 'ARTIST' && (
          <FormSection
            id="portfolio"
            title="ポートフォリオ"
            description="あなたの作品を紹介するURLを追加してください（任意）"
            isCompleted={getSectionValidation('portfolio').isComplete}
            hasErrors={getSectionValidation('portfolio').hasErrors}
            progress={getSectionValidation('portfolio').progress}
            validationMessage={getSectionMessage('portfolio')}
            errorCount={getSectionValidation('portfolio').errors.length}
            warningCount={getSectionValidation('portfolio').warnings.length}
            isRequired={false}
          >
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-2">
                <ValidatedInput
                  label={`ポートフォリオURL ${index + 1}`}
                  type="url"
                  placeholder="https://twitter.com/your_account"
                  validation={getFieldValidation('portfolioUrl', userType)}
                  contextualHelp={`${index === 0 ? '主要な' : '追加の'}ポートフォリオサイトのURLを入力してください。Twitter、pixiv、ArtStationなどに対応しています。`}
                  successMessage="有効なURLです"
                  value={watch(`portfolioUrls.${index}`) || ''}
                  onChange={(value) => {
                    const currentUrls = getValues('portfolioUrls') || [];
                    const newUrls = [...currentUrls];
                    newUrls[index] = value;
                    setValue('portfolioUrls', newUrls);
                  }}
                  id={`portfolioUrls-${index}`}
                />
              </div>
            ))}
          </FormSection>
        )}

        {/* Communication Preferences */}
        <FormSection
          id="communication"
          title="コミュニケーション設定"
          description="タイムゾーンや好ましいコミュニケーション方法を設定してください"
          isCompleted={getSectionValidation('communication').isComplete}
          hasErrors={getSectionValidation('communication').hasErrors}
          progress={getSectionValidation('communication').progress}
          validationMessage={getSectionMessage('communication')}
          errorCount={getSectionValidation('communication').errors.length}
          warningCount={getSectionValidation('communication').warnings.length}
          isRequired={false}
        >
          {/* Timezone */}
          <div className="space-y-2">
            <label 
              className="block text-sm font-medium text-calm-700 mb-2"
              htmlFor="timezone-select"
            >
              タイムゾーン
            </label>
            <select
              id="timezone-select"
              className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base border border-calm-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors appearance-none bg-white"
              {...register('timezone')}
            >
              <option value="Asia/Tokyo">日本標準時 (JST)</option>
              <option value="Asia/Seoul">韓国標準時 (KST)</option>
              <option value="America/Los_Angeles">太平洋標準時 (PST)</option>
              <option value="America/New_York">東部標準時 (EST)</option>
              <option value="Europe/London">グリニッジ標準時 (GMT)</option>
            </select>
            <p className="mt-1 text-xs text-calm-500">
              プロジェクトのスケジュール調整に使用されます
            </p>
          </div>

          {/* Preferred Communication Style */}
          <div className="space-y-2">
            <ValidatedInput
              label="好ましいコミュニケーション方法"
              placeholder="例: 週1回の定期報告、リアルタイムチャット等"
              validation={getFieldValidation('preferredCommStyle', userType)}
              contextualHelp="プロジェクト中の連絡頻度や方法について、あなたの希望を教えてください。"
              showCharacterCount
              maxLength={200}
              value={watch('preferredCommStyle')}
              onChange={(value) => setValue('preferredCommStyle', value)}
              id="preferredCommStyle"
            />
          </div>
        </FormSection>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4" role="alert">
            <p className="text-red-600 text-sm sm:text-base">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4" role="alert">
            <p className="text-green-600 text-sm sm:text-base">プロフィールを更新しました！</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 sm:pt-6">
          {/* Progress Summary */}
          <div className="flex items-center space-x-3 text-sm text-calm-600">
            <span>完成度: {Math.round(overallProgress)}%</span>
            <div className="w-20 bg-calm-200 rounded-full h-2">
              <div
                className="h-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <Button
            type="submit"
            loading={isLoading}
            disabled={!isDirty}
            size="lg"
            className="w-full sm:w-auto px-6 sm:px-8 min-h-[44px]"
          >
            プロフィールを更新
          </Button>
        </div>
      </form>

      {/* Draft Restore Modal */}
      <DraftRestoreModal
        isOpen={showDraftModal}
        onClose={() => setShowDraftModal(false)}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        draftAge={autoSaveState.draftAge}
        draftPreview={getDraftPreview()}
      />
    </div>
  );
}