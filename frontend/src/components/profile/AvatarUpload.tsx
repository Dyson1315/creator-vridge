'use client';

import React, { useState, useRef } from 'react';
import { apiClient } from '@/lib/api';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onUpload: (avatarUrl: string) => void;
}

export default function AvatarUpload({ currentAvatar, onUpload }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('JPEG、PNG、WebPファイルのみアップロード可能です');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Upload file using API client
      const response = await apiClient.uploadAvatar(file);
      
      if (response.data?.avatarUrl) {
        // The avatar URL is now a data URI (data:image/jpeg;base64,xxx) from the database
        // No need to convert relative URLs anymore
        onUpload(response.data.avatarUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeAvatar = async () => {
    setIsUploading(true);
    setError(null);

    try {
      await apiClient.deleteAvatar();
      onUpload('');
    } catch (err) {
      setError('アバターの削除に失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-calm-100">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt="Profile Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100">
              <svg
                className="w-16 h-16 text-calm-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V9H21ZM19 21H5V3H13V9H19V21Z" />
              </svg>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={isUploading}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {currentAvatar ? '変更' : 'アップロード'}
        </button>

        {currentAvatar && (
          <button
            type="button"
            onClick={removeAvatar}
            disabled={isUploading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            削除
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm text-center max-w-xs">{error}</p>
      )}

      {/* Upload Guidelines */}
      <div className="text-center text-xs text-calm-500 max-w-xs">
        <p>JPEG、PNG、WebP形式</p>
        <p>最大5MB</p>
        <p>推奨サイズ: 512×512px</p>
      </div>
    </div>
  );
}