'use client';

import React from 'react';
import { User } from '@/lib/api';

interface ProfileHeaderProps {
  user: User;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const profile = user.profile;
  const displayName = profile?.displayName || 'ユーザー';
  const avatarUrl = profile?.avatarUrl;
  const userType = user.userType;
  const availability = profile?.availability || 'AVAILABLE';

  // User type display config
  const userTypeConfig = {
    VTUBER: {
      label: 'VTuber',
      bgColor: 'bg-primary-100',
      textColor: 'text-primary-700',
      borderColor: 'border-primary-200',
    },
    ARTIST: {
      label: '絵師',
      bgColor: 'bg-secondary-100',
      textColor: 'text-secondary-700',
      borderColor: 'border-secondary-200',
    },
  };

  // Availability status config (only for Artists)
  const availabilityConfig = {
    AVAILABLE: {
      label: '稼働中',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      dotColor: 'bg-green-500',
    },
    BUSY: {
      label: '多忙',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      dotColor: 'bg-yellow-500',
    },
    UNAVAILABLE: {
      label: '停止中',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      dotColor: 'bg-red-500',
    },
  };

  const typeConfig = userTypeConfig[userType];
  const statusConfig = availabilityConfig[availability];

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-calm-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Profile Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-calm-100">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${displayName}のプロフィール画像`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-calm-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* User Information */}
        <div className="flex-grow text-center sm:text-left">
          {/* Display Name */}
          <h2 className="text-xl sm:text-2xl font-bold text-calm-900 mb-2">
            {displayName}
          </h2>

          {/* Badges Row */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
            {/* User Type Badge */}
            <span
              className={`
                inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
                ${typeConfig.bgColor} ${typeConfig.textColor} ${typeConfig.borderColor}
              `}
            >
              {typeConfig.label}
            </span>

            {/* Availability Status Badge (Artists only) */}
            {userType === 'ARTIST' && (
              <span
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                  ${statusConfig.bgColor} ${statusConfig.textColor}
                `}
              >
                <span
                  className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}
                />
                {statusConfig.label}
              </span>
            )}
          </div>

          {/* Bio Preview (if available) */}
          {profile?.bio && (
            <p className="text-sm text-calm-600 line-clamp-2 max-w-md">
              {profile.bio}
            </p>
          )}

          {/* Additional Info Row */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 text-xs text-calm-500">
            {/* Experience */}
            {profile?.experience !== undefined && profile?.experience !== null && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {profile.experience === 0 && '1年未満'}
                {profile.experience === 1 && '1-2年'}
                {profile.experience === 3 && '3-5年'}
                {profile.experience === 6 && '6-10年'}
                {profile.experience === 11 && '10年以上'}
              </span>
            )}

            {/* Rating (if available) */}
            {profile?.rating && profile?.totalReviews > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {profile.rating.toFixed(1)} ({profile.totalReviews}件)
              </span>
            )}

            {/* Timezone */}
            {profile?.timezone && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z" />
                </svg>
                {profile.timezone === 'Asia/Tokyo' && 'JST'}
                {profile.timezone === 'Asia/Seoul' && 'KST'}
                {profile.timezone === 'America/Los_Angeles' && 'PST'}
                {profile.timezone === 'America/New_York' && 'EST'}
                {profile.timezone === 'Europe/London' && 'GMT'}
                {!['Asia/Tokyo', 'Asia/Seoul', 'America/Los_Angeles', 'America/New_York', 'Europe/London'].includes(profile.timezone) && profile.timezone}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}