'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';

interface Artist {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  rating?: number;
}

interface ContractRequestModalProps {
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContractRequestModal({
  artist,
  isOpen,
  onClose,
  onSuccess
}: ContractRequestModalProps) {
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement contract request API call
      console.log('Contract request:', {
        artistId: artist.id,
        description,
        budget,
        deadline
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to send contract request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">依頼リクエスト</h2>
        </div>

        <div className="space-y-4">
          {/* Artist Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center">
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
              <h3 className="font-medium">{artist.displayName}</h3>
              {artist.rating && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <span className="text-yellow-400">★</span>
                  {artist.rating.toFixed(1)}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                依頼内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="どのような作品を制作してほしいか詳しく記載してください..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-vertical"
                required
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium mb-1">
                予算 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="例: ¥50,000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                required
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium mb-1">
                希望納期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !description.trim() || !budget.trim() || !deadline}
              >
                {loading ? '送信中...' : '依頼を送る'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}