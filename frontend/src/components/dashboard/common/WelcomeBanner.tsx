import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface WelcomeBannerProps {
  userName: string;
  userType: string;
  message: string;
  className?: string;
}

export default function WelcomeBanner({ 
  userName, 
  userType, 
  message,
  className 
}: WelcomeBannerProps) {
  const currentHour = new Date().getHours();
  
  const getGreeting = () => {
    if (currentHour < 5) return 'お疲れさまです';
    if (currentHour < 12) return 'おはようございます';
    if (currentHour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  const getTimeBasedIcon = () => {
    if (currentHour < 5) return '🌙';
    if (currentHour < 12) return '🌅';
    if (currentHour < 18) return '☀️';
    return '🌃';
  };

  return (
    <Card className={cn(
      'bg-gradient-to-r from-primary-500 to-secondary-500 border-0 text-white overflow-hidden relative',
      className
    )}>
      {/* 背景デコレーション */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 text-6xl">
          {getTimeBasedIcon()}
        </div>
        <div className="absolute bottom-2 left-4 text-4xl opacity-50">
          ✨
        </div>
        <div className="absolute top-1/2 right-1/4 text-2xl opacity-30">
          💫
        </div>
      </div>

      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold">
                {getGreeting()}、{userName}さん
              </h2>
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                {userType}
              </span>
            </div>
            <p className="text-white text-opacity-90 text-lg max-w-2xl">
              {message}
            </p>
            <div className="flex items-center space-x-4 text-sm text-white text-opacity-80 pt-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date().toLocaleDateString('ja-JP', { 
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </span>
            </div>
          </div>
          
          {/* アバター */}
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {userName.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}