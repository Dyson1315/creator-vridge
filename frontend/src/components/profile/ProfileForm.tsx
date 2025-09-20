'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { User } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import AvatarUpload from './AvatarUpload';
import SkillsSelector from './SkillsSelector';
import PriceRangeSlider from './PriceRangeSlider';

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
  const [avatarChanged, setAvatarChanged] = useState(false);
  const { setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
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
  const userType = user.userType;

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

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
        
        setSuccess(true);
        setAvatarChanged(false); // Reset avatar changed flag after successful update
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
    
    // Mark that avatar has been changed
    setAvatarChanged(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-calm-900">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <AvatarUpload
              currentAvatar={user.profile?.avatarUrl}
              onUpload={handleAvatarUpdate}
            />
          </div>

          {/* Display Name */}
          <Input
            label="表示名"
            placeholder={userType === 'VTUBER' ? 'VTuber名' : 'ペンネーム・アーティスト名'}
            error={errors.displayName?.message}
            {...register('displayName', {
              required: '表示名を入力してください',
              maxLength: {
                value: 50,
                message: '表示名は50文字以内で入力してください',
              },
            })}
          />

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-calm-700 mb-2">
              自己紹介
            </label>
            <textarea
              className="w-full px-4 py-3 border border-calm-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={4}
              placeholder={
                userType === 'VTUBER'
                  ? 'あなたの活動内容や、どんな絵師さんと一緒に仕事をしたいか教えてください'
                  : 'あなたの得意な絵柄や、これまでの実績について教えてください'
              }
              {...register('bio', {
                maxLength: {
                  value: 500,
                  message: '自己紹介は500文字以内で入力してください',
                },
              })}
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills and Expertise */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-calm-900">
            {userType === 'VTUBER' ? '求めるスキル' : '得意なスキル'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Controller
            name="skills"
            control={control}
            render={({ field }) => (
              <SkillsSelector
                value={field.value}
                onChange={field.onChange}
                userType={userType}
              />
            )}
          />

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-calm-700 mb-2">
              {userType === 'VTUBER' ? 'VTuber活動年数' : '絵師活動年数'}
            </label>
            <select
              className="w-full px-4 py-3 border border-calm-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing and Availability (Artist only) */}
      {userType === 'ARTIST' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-calm-900">料金・稼働情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price Range */}
            <Controller
              name="priceRangeMin"
              control={control}
              render={({ field }) => (
                <Controller
                  name="priceRangeMax"
                  control={control}
                  render={({ field: maxField }) => (
                    <PriceRangeSlider
                      min={field.value}
                      max={maxField.value}
                      onMinChange={field.onChange}
                      onMaxChange={maxField.onChange}
                    />
                  )}
                />
              )}
            />

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-calm-700 mb-2">
                稼働状況
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'AVAILABLE', label: '稼働中', color: 'bg-green-50 border-green-200 text-green-700' },
                  { value: 'BUSY', label: '多忙', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                  { value: 'UNAVAILABLE', label: '停止中', color: 'bg-red-50 border-red-200 text-red-700' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`
                      flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all
                      ${availability === option.value 
                        ? option.color 
                        : 'bg-white border-calm-200 text-calm-600 hover:border-calm-300'
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
          </CardContent>
        </Card>
      )}

      {/* Portfolio URLs (Artist only) */}
      {userType === 'ARTIST' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-calm-900">ポートフォリオ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[0, 1, 2].map((index) => (
              <Input
                key={index}
                label={`ポートフォリオURL ${index + 1}`}
                type="url"
                placeholder="https://example.com/portfolio"
                {...register(`portfolioUrls.${index}` as const, {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: '有効なURLを入力してください',
                  },
                })}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-calm-900">コミュニケーション設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-calm-700 mb-2">
              タイムゾーン
            </label>
            <select
              className="w-full px-4 py-3 border border-calm-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              {...register('timezone')}
            >
              <option value="Asia/Tokyo">日本標準時 (JST)</option>
              <option value="Asia/Seoul">韓国標準時 (KST)</option>
              <option value="America/Los_Angeles">太平洋標準時 (PST)</option>
              <option value="America/New_York">東部標準時 (EST)</option>
              <option value="Europe/London">グリニッジ標準時 (GMT)</option>
            </select>
          </div>

          {/* Preferred Communication Style */}
          <Input
            label="好ましいコミュニケーション方法"
            placeholder="例: 週1回の定期報告、リアルタイムチャット等"
            {...register('preferredCommStyle')}
          />
        </CardContent>
      </Card>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-600">プロフィールを更新しました！</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-6">
        <Button
          type="submit"
          loading={isLoading}
          disabled={!isDirty && !avatarChanged}
          size="lg"
          className="px-8"
        >
          プロフィールを更新
        </Button>
      </div>
    </form>
  );
}