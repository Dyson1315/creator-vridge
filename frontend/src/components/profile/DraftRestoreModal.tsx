'use client';

import React, { useState } from 'react';
import { X, AlertCircle, Clock, FileText, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatDraftAge } from '@/hooks/useAutoSave';

interface DraftRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
  onDiscard: () => void;
  draftAge: number | null;
  draftPreview?: {
    displayName?: string;
    bio?: string;
    skills?: string[];
    sections?: string[];
  };
}

export default function DraftRestoreModal({
  isOpen,
  onClose,
  onRestore,
  onDiscard,
  draftAge,
  draftPreview
}: DraftRestoreModalProps) {
  const [isDiscarding, setIsDiscarding] = useState(false);

  if (!isOpen) return null;

  const handleRestore = () => {
    onRestore();
    onClose();
  };

  const handleDiscard = async () => {
    setIsDiscarding(true);
    try {
      onDiscard();
      onClose();
    } finally {
      setIsDiscarding(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-calm-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-calm-900">
                下書きが見つかりました
              </h2>
              <p className="text-sm text-calm-600">
                以前の作業を復元しますか？
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-calm-100 rounded-lg transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 text-calm-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Draft info */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900">
                  未保存の変更があります
                </p>
                {draftAge && (
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-700">
                      {formatDraftAge(draftAge)}に保存
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Draft preview */}
          {draftPreview && (
            <div className="bg-calm-50 border border-calm-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-calm-900 mb-3">
                下書きの内容プレビュー
              </h3>
              <div className="space-y-2 text-sm">
                {draftPreview.displayName && (
                  <div className="flex items-center space-x-2">
                    <span className="text-calm-600">表示名:</span>
                    <span className="text-calm-900 font-medium">
                      {draftPreview.displayName}
                    </span>
                  </div>
                )}
                {draftPreview.bio && (
                  <div>
                    <span className="text-calm-600">自己紹介:</span>
                    <p className="text-calm-900 mt-1 line-clamp-2">
                      {draftPreview.bio.substring(0, 100)}
                      {draftPreview.bio.length > 100 && '...'}
                    </p>
                  </div>
                )}
                {draftPreview.skills && draftPreview.skills.length > 0 && (
                  <div>
                    <span className="text-calm-600">スキル:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {draftPreview.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {draftPreview.skills.length > 3 && (
                        <span className="px-2 py-1 bg-calm-200 text-calm-700 rounded-md text-xs">
                          +{draftPreview.skills.length - 3}個
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {draftPreview.sections && draftPreview.sections.length > 0 && (
                  <div>
                    <span className="text-calm-600">変更されたセクション:</span>
                    <p className="text-calm-900 mt-1">
                      {draftPreview.sections.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-900">
                  <strong>注意:</strong> 「新しく開始」を選択すると、下書きは完全に削除されます。
                  この操作は取り消せません。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-calm-200">
          <Button
            onClick={handleRestore}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
            size="lg"
          >
            下書きを復元
          </Button>
          <Button
            onClick={handleDiscard}
            loading={isDiscarding}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            size="lg"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            新しく開始
          </Button>
        </div>
      </div>
    </div>
  );
}