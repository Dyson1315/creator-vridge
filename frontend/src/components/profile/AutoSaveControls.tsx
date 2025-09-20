'use client';

import React, { useState } from 'react';
import { Save, Trash2, Download, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import { AutoSaveState, AutoSaveActions } from '@/hooks/useAutoSave';

interface AutoSaveControlsProps {
  autoSaveState: AutoSaveState;
  autoSaveActions: AutoSaveActions;
  className?: string;
  showExportImport?: boolean;
  onExport?: () => any;
  onImport?: (data: any) => void;
}

export default function AutoSaveControls({
  autoSaveState,
  autoSaveActions,
  className = '',
  showExportImport = false,
  onExport,
  onImport
}: AutoSaveControlsProps) {
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { isAutoSaving, hasDraft, hasUnsavedChanges } = autoSaveState;
  const { saveDraft, clearDraft } = autoSaveActions;

  const handleManualSave = async () => {
    setIsManualSaving(true);
    try {
      await saveDraft();
    } finally {
      setIsManualSaving(false);
    }
  };

  const handleClearDraft = async () => {
    setIsClearing(true);
    try {
      clearDraft();
      setShowConfirm(false);
    } finally {
      setIsClearing(false);
    }
  };

  const handleExport = () => {
    if (onExport) {
      const data = onExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile-draft-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImport) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          onImport(data);
        } catch (error) {
          console.error('Failed to import draft:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Manual Save */}
        <Button
          onClick={handleManualSave}
          loading={isManualSaving || isAutoSaving}
          disabled={!hasUnsavedChanges && !hasDraft}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>下書きを保存</span>
        </Button>

        {/* Clear Draft */}
        {hasDraft && (
          <Button
            onClick={() => setShowConfirm(true)}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>下書きを削除</span>
          </Button>
        )}

        {/* Export/Import */}
        {showExportImport && (
          <>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>エクスポート</span>
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="下書きをインポート"
              />
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>インポート</span>
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-calm-900 mb-2">
              下書きを削除
            </h3>
            <p className="text-sm text-calm-600 mb-4">
              保存された下書きを完全に削除します。この操作は取り消せません。
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleClearDraft}
                loading={isClearing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                削除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}