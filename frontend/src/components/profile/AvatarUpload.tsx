'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onUpload: (avatarUrl: string) => void;
  className?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export default function AvatarUpload({ currentAvatar, onUpload, className }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // Image compression utility
  const compressImage = (file: File, maxWidth: number = 512, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate dimensions maintaining aspect ratio
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };
  
  // Fix image orientation for mobile photos
  const fixImageOrientation = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // For mobile photos, we'll assume they need to be rotated properly
          // This is a simplified approach - in production you might want to read EXIF data
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const fixedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(fixedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            0.9
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'JPEG、PNG、WebPファイルのみアップロード可能です';
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'ファイルサイズは5MB以下にしてください';
    }

    return null;
  };
  
  const processAndUploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Process image for mobile
      let processedFile = file;
      if (isMobile) {
        processedFile = await fixImageOrientation(file);
      }
      
      // Compress if needed
      if (processedFile.size > 1024 * 1024) { // 1MB
        processedFile = await compressImage(processedFile);
      }
      
      // Simulate upload progress (since we can't get real progress from fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev) return null;
          const newPercentage = Math.min(prev.percentage + 10, 90);
          return {
            ...prev,
            percentage: newPercentage,
            loaded: (prev.total * newPercentage) / 100
          };
        });
      }, 200);

      // Upload file using API client
      const response = await apiClient.uploadAvatar(processedFile);
      
      clearInterval(progressInterval);
      setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 });
      
      if (response.data?.avatarUrl) {
        const fullAvatarUrl = response.data.avatarUrl.startsWith('http') 
          ? response.data.avatarUrl 
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${response.data.avatarUrl}`;
        
        onUpload(fullAvatarUrl);
        setSuccess(true);
        setPreview(null);
        
        // Clean up preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    await processAndUploadFile(file);
    
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drag over to false if we're leaving the drop zone entirely
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setIsDragOver(false);
      }
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      await processAndUploadFile(imageFile);
    } else {
      setError('画像ファイルを選択してください');
    }
  }, [processAndUploadFile]);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const triggerCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const removeAvatar = async () => {
    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiClient.deleteAvatar();
      onUpload('');
      setSuccess(true);
    } catch (err) {
      setError('アバターの削除に失敗しました');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Keyboard handlers for accessibility
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Main Upload Area */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative group transition-all duration-300 ease-in-out",
          "border-2 border-dashed rounded-3xl p-6 sm:p-8",
          "focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-2",
          isDragOver
            ? "border-primary-400 bg-primary-50 scale-105"
            : "border-calm-300 hover:border-primary-300 hover:bg-calm-50",
          isUploading && "pointer-events-none",
          "min-h-[280px] sm:min-h-[320px] w-full max-w-sm mx-auto"
        )}
        role="button"
        tabIndex={0}
        aria-label="アバター画像をアップロード"
        onKeyDown={(e) => handleKeyDown(e, triggerFileSelect)}
      >
        {/* Avatar Display */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className={cn(
              "rounded-full overflow-hidden border-4 border-white shadow-lg bg-calm-100 transition-all duration-300",
              isMobile ? "w-24 h-24 sm:w-32 sm:h-32" : "w-32 h-32 lg:w-40 lg:h-40"
            )}>
              {preview || currentAvatar ? (
                <img
                  src={preview || currentAvatar || ''}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100">
                  <svg
                    className={cn(
                      "text-calm-400 transition-all duration-300",
                      isMobile ? "w-8 h-8 sm:w-12 sm:h-12" : "w-12 h-12 lg:w-16 lg:h-16"
                    )}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V9H21ZM19 21H5V3H13V9H19V21Z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Upload Progress Overlay */}
            {isUploading && uploadProgress && (
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-60 flex flex-col items-center justify-center">
                <div className="relative w-8 h-8 mb-2">
                  <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-calm-300"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-white"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${uploadProgress.percentage}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
                <span className="text-white text-xs font-medium">
                  {Math.round(uploadProgress.percentage)}%
                </span>
              </div>
            )}

            {/* Success Indicator */}
            {success && (
              <div className="absolute inset-0 rounded-full bg-green-500 bg-opacity-90 flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          {/* Upload Instructions */}
          {!isUploading && (
            <div className="text-center space-y-2">
              <p className={cn(
                "font-medium text-calm-700",
                isMobile ? "text-sm" : "text-base"
              )}>
                {isDragOver ? "ここにドロップ" : "画像をアップロード"}
              </p>
              <p className={cn(
                "text-calm-500",
                isMobile ? "text-xs" : "text-sm"
              )}>
                {isDragOver ? "" : "ドラッグ&ドロップまたはクリック"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Controls */}
      <div className={cn(
        "flex gap-3 mt-6 w-full max-w-sm",
        isMobile ? "flex-col" : "flex-row justify-center"
      )}>
        <Button
          type="button"
          onClick={triggerFileSelect}
          disabled={isUploading}
          loading={isUploading}
          variant="primary"
          size={isMobile ? "lg" : "md"}
          className={cn(
            "flex-1 touch-manipulation",
            isMobile && "min-h-[48px]"
          )}
          aria-label={currentAvatar ? "アバター画像を変更" : "アバター画像をアップロード"}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {currentAvatar ? '変更' : 'アップロード'}
        </Button>

        {/* Mobile Camera Button */}
        {isMobile && (
          <Button
            type="button"
            onClick={triggerCameraCapture}
            disabled={isUploading}
            variant="outline"
            size="lg"
            className="flex-1 min-h-[48px] touch-manipulation"
            aria-label="カメラで撮影"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            撮影
          </Button>
        )}

        {(currentAvatar || preview) && (
          <Button
            type="button"
            onClick={removeAvatar}
            disabled={isUploading}
            variant="outline"
            size={isMobile ? "lg" : "md"}
            className={cn(
              "border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 focus:ring-red-400",
              isMobile ? "flex-1 min-h-[48px] touch-manipulation" : ""
            )}
            aria-label="アバター画像を削除"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            削除
          </Button>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />
      
      {/* Mobile Camera Input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />

      {/* Status Messages */}
      <div className="w-full max-w-sm mt-4 space-y-2">
        {/* Success Message */}
        {success && (
          <div className={cn(
            "flex items-center justify-center p-3 rounded-xl bg-green-50 border border-green-200",
            "animate-in slide-in-from-bottom-2 duration-300"
          )}>
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 text-sm font-medium">
              アップロードが完了しました
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={cn(
            "flex items-start p-3 rounded-xl bg-red-50 border border-red-200",
            "animate-in slide-in-from-bottom-2 duration-300"
          )} role="alert" aria-live="polite">
            <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        {/* Upload Guidelines */}
        {!error && !success && (
          <div className={cn(
            "text-center space-y-1 p-3 rounded-xl bg-calm-50",
            isMobile ? "text-xs" : "text-xs"
          )}>
            <div className="flex items-center justify-center space-x-4 text-calm-600">
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                JPEG、PNG、WebP
              </span>
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                最大5MB
              </span>
            </div>
            <p className="text-calm-500">推奨サイズ: 512×512px</p>
          </div>
        )}
      </div>
    </div>
  );
}