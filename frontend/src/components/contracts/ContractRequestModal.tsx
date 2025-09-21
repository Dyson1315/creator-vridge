'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

interface Artist {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  rating?: number;
}

interface ContractRequestModalProps {
  artist: Artist;
  artworkId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ContractFormData {
  title: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  deadline: string;
  deliverables: string[];
  requirements: {
    format: string;
    resolution: string;
    style: string;
    revisions: string;
    usage: string;
    additionalNotes: string;
  };
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

const initialFormData: ContractFormData = {
  title: '',
  description: '',
  budgetMin: '',
  budgetMax: '',
  deadline: '',
  deliverables: [''],
  requirements: {
    format: '',
    resolution: '',
    style: '',
    revisions: '3',
    usage: '',
    additionalNotes: ''
  },
  priority: 'NORMAL'
};

export default function ContractRequestModal({ 
  artist, 
  artworkId, 
  isOpen, 
  onClose, 
  onSuccess 
}: ContractRequestModalProps) {
  const [formData, setFormData] = useState<ContractFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user } = useAuthStore();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRequirementChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [field]: value
      }
    }));
  };

  const handleDeliverableChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((item, i) => i === index ? value : item)
    }));
  };

  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, '']
    }));
  };

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }

    if (!formData.description.trim()) {
      newErrors.description = '詳細説明は必須です';
    } else if (formData.description.length < 10) {
      newErrors.description = '詳細説明は10文字以上で入力してください';
    }

    if (formData.budgetMin && formData.budgetMax) {
      const min = parseFloat(formData.budgetMin);
      const max = parseFloat(formData.budgetMax);
      if (min > max) {
        newErrors.budgetMax = '最大予算は最小予算以上で設定してください';
      }
    }

    if (formData.deadline) {
      const deadline = new Date(formData.deadline);
      const now = new Date();
      if (deadline <= now) {
        newErrors.deadline = '締切は現在時刻より後に設定してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || user.userType !== 'VTUBER') {
      alert('VTuberユーザーのみ契約依頼を送信できます');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        artistUserId: artist.id,
        artworkId,
        title: formData.title,
        description: formData.description,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        deliverables: formData.deliverables.filter(item => item.trim()),
        requirements: Object.fromEntries(
          Object.entries(formData.requirements).filter(([_, value]) => value.trim())
        ),
        priority: formData.priority
      };

      const response = await api.post('/api/v1/contracts/request', requestData);

      if (response.data.success) {
        alert('契約依頼を送信しました！');
        onSuccess?.();
        onClose();
        setFormData(initialFormData);
      }

    } catch (error: any) {
      console.error('Error sending contract request:', error);
      const errorMessage = error.response?.data?.error || '契約依頼の送信に失敗しました';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData(initialFormData);
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
                  {artist.avatarUrl ? (
                    <img
                      src={artist.avatarUrl}
                      alt={artist.displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-primary-600">
                      {artist.displayName.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <div>{artist.displayName} への契約依頼</div>
                  {artist.rating && (
                    <div className="text-sm text-gray-600 font-normal">
                      ★ {artist.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={loading}
              >
                ✕
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">基本情報</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    依頼タイトル *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="例: VTuberアバターイラスト制作"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    詳細説明 *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="依頼の詳細内容を記載してください..."
                    rows={4}
                    className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.description ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>
              </div>

              {/* Budget and Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">予算・スケジュール</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最小予算 (円)
                    </label>
                    <Input
                      type="number"
                      value={formData.budgetMin}
                      onChange={(e) => handleInputChange('budgetMin', e.target.value)}
                      placeholder="50000"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最大予算 (円)
                    </label>
                    <Input
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) => handleInputChange('budgetMax', e.target.value)}
                      placeholder="100000"
                      min="0"
                      className={errors.budgetMax ? 'border-red-500' : ''}
                    />
                    {errors.budgetMax && (
                      <p className="text-red-500 text-sm mt-1">{errors.budgetMax}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    希望締切
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className={errors.deadline ? 'border-red-500' : ''}
                  />
                  {errors.deadline && (
                    <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    優先度
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="LOW">低</option>
                    <option value="NORMAL">普通</option>
                    <option value="HIGH">高</option>
                    <option value="URGENT">緊急</option>
                  </select>
                </div>
              </div>

              {/* Deliverables */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">納品物</h3>
                
                {formData.deliverables.map((deliverable, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={deliverable}
                      onChange={(e) => handleDeliverableChange(index, e.target.value)}
                      placeholder="例: 高解像度PNG画像"
                      className="flex-1"
                    />
                    {formData.deliverables.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDeliverable(index)}
                      >
                        削除
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDeliverable}
                >
                  + 納品物を追加
                </Button>
              </div>

              {/* Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">詳細要件</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ファイル形式
                    </label>
                    <Input
                      value={formData.requirements.format}
                      onChange={(e) => handleRequirementChange('format', e.target.value)}
                      placeholder="例: PNG, PSD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      解像度
                    </label>
                    <Input
                      value={formData.requirements.resolution}
                      onChange={(e) => handleRequirementChange('resolution', e.target.value)}
                      placeholder="例: 2048x2048"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      希望画風
                    </label>
                    <Input
                      value={formData.requirements.style}
                      onChange={(e) => handleRequirementChange('style', e.target.value)}
                      placeholder="例: アニメ調、リアル調"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      修正回数
                    </label>
                    <Input
                      type="number"
                      value={formData.requirements.revisions}
                      onChange={(e) => handleRequirementChange('revisions', e.target.value)}
                      min="0"
                      max="10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    使用用途
                  </label>
                  <Input
                    value={formData.requirements.usage}
                    onChange={(e) => handleRequirementChange('usage', e.target.value)}
                    placeholder="例: 配信、グッズ、SNS"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    追加の注意事項
                  </label>
                  <textarea
                    value={formData.requirements.additionalNotes}
                    onChange={(e) => handleRequirementChange('additionalNotes', e.target.value)}
                    placeholder="その他の要望や注意事項があれば記載してください..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={loading}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? '送信中...' : '契約依頼を送信'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}