'use client';

import { useRouter } from 'next/navigation';
import { Settings, MapPin, Clock, DollarSign, Star, Calendar, Award, User as UserIcon } from 'lucide-react';
import { User } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ProfileViewProps {
  user: User;
  isOwnProfile?: boolean;
}

export default function ProfileView({ user, isOwnProfile = false }: ProfileViewProps) {
  const router = useRouter();
  const profile = user.profile;

  const handleEditProfile = () => {
    router.push('/profile/settings');
  };

  const renderSkills = (skills: any) => {
    if (!skills || !Array.isArray(skills)) return null;
    
    return (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill: string, index: number) => (
          <span
            key={index}
            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
          >
            {skill}
          </span>
        ))}
      </div>
    );
  };

  const renderPortfolioUrls = (urls: any) => {
    if (!urls || !Array.isArray(urls)) return null;
    
    return (
      <div className="space-y-2">
        {urls.map((url: string, index: number) => (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-primary-600 hover:text-primary-700 underline break-all"
          >
            {url}
          </a>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-calm-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-calm-900 mb-2">
                  {isOwnProfile ? 'マイプロフィール' : 'プロフィール'}
                </h1>
                {!isOwnProfile && (
                  <p className="text-calm-600">
                    {`${profile?.displayName || user.email}さんのプロフィール`}
                  </p>
                )}
              </div>
              {isOwnProfile && (
                <Button
                  onClick={handleEditProfile}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  編集
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-primary-500 rounded"></div>
                    基本情報
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar and Name */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {profile?.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile?.displayName || user.email}
                          className="w-24 h-24 rounded-full object-cover border-4 border-calm-200"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-calm-400 border-4 border-calm-200">
                          <UserIcon className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-calm-900">
                        {profile?.displayName || user.email}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.userType === 'VTUBER' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.userType === 'VTUBER' ? 'VTuber' : '絵師'}
                        </span>
                        {profile?.availability && (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            profile.availability === 'AVAILABLE' 
                              ? 'bg-green-100 text-green-700' 
                              : profile.availability === 'BUSY'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {profile.availability === 'AVAILABLE' && '対応可能'}
                            {profile.availability === 'BUSY' && '多忙'}
                            {profile.availability === 'UNAVAILABLE' && '対応不可'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {profile?.bio && (
                    <div>
                      <h3 className="text-lg font-semibold text-calm-900 mb-2">自己紹介</h3>
                      <p className="text-calm-700 leading-relaxed whitespace-pre-wrap">
                        {profile.bio}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {profile?.skills && (
                    <div>
                      <h3 className="text-lg font-semibold text-calm-900 mb-3">スキル・得意分野</h3>
                      {renderSkills(profile.skills)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Portfolio */}
              {profile?.portfolioUrls && Array.isArray(profile.portfolioUrls) && profile.portfolioUrls.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      ポートフォリオ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderPortfolioUrls(profile.portfolioUrls)}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Stats and Details */}
            <div className="space-y-6">
              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>統計情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-calm-600">評価</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-calm-900">
                        {profile?.rating ? `${profile.rating}/5.0` : '未評価'}
                      </div>
                      <div className="text-xs text-calm-500">
                        {profile?.totalReviews || 0}件のレビュー
                      </div>
                    </div>
                  </div>

                  {profile?.experience && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-calm-600">経験年数</span>
                      </div>
                      <span className="font-semibold text-calm-900">
                        {profile.experience}年
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-calm-600">参加日</span>
                    </div>
                    <span className="font-semibold text-calm-900">
                      {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Price Range */}
              {(profile?.priceRangeMin || profile?.priceRangeMax) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      料金帯
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-calm-900">
                        ${profile?.priceRangeMin || 0} - ${profile?.priceRangeMax || 0}
                      </div>
                      <div className="text-sm text-calm-500 mt-1">
                        1件あたりの料金
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              <Card>
                <CardHeader>
                  <CardTitle>その他の情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile?.timezone && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-calm-600">タイムゾーン:</span>
                      <span className="text-sm font-medium text-calm-900">
                        {profile.timezone}
                      </span>
                    </div>
                  )}

                  {profile?.preferredCommStyle && (
                    <div>
                      <div className="text-sm text-calm-600 mb-1">コミュニケーションスタイル:</div>
                      <div className="text-sm font-medium text-calm-900">
                        {profile.preferredCommStyle}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}