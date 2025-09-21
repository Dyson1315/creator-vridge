'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

interface Artist {
  id: string;
  displayName: string;
  avatarUrl?: string;
  rating?: number;
}

interface Artwork {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  style?: string;
  category: string;
  createdAt: string;
  likesCount: number;
  artist: Artist;
}

interface RecommendationItem extends Artwork {
  compatibilityScore: number;
  reason?: string[];
  reasoning?: string;
}

interface RecommendationsResponse {
  recommendations: RecommendationItem[];
  total: number;
  algorithm: string;
  useAI?: boolean;
}

export default function RecommendedArtworks() {
  const [artworks, setArtworks] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [useAI, setUseAI] = useState(true);
  const [algorithm, setAlgorithm] = useState<string>('');
  const { user } = useAuthStore();

  const fetchRecommendations = async () => {
    if (!user || user.userType !== 'VTUBER') return;

    setLoading(true);
    try {
      // AI推薦APIエンドポイントを使用
      const endpoint = useAI 
        ? '/api/recommendations/ai/artworks'
        : '/api/recommendations/artworks';
      
      const response = await api.get<RecommendationsResponse>(
        `${endpoint}?limit=6&useAI=${useAI}&includeReason=true`
      );
      
      setArtworks(response.data.recommendations);
      setAlgorithm(response.data.algorithm);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      // AI推薦に失敗した場合は内部アルゴリズムにフォールバック
      if (useAI) {
        setUseAI(false);
        try {
          const fallbackResponse = await api.get<RecommendationsResponse>(
            '/api/recommendations/artworks?limit=6&includeReason=true'
          );
          setArtworks(fallbackResponse.data.recommendations);
          setAlgorithm(fallbackResponse.data.algorithm);
        } catch (fallbackError) {
          console.error('Fallback recommendation also failed:', fallbackError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (artworkId: string, isLike: boolean) => {
    if (!user) return;

    try {
      // 推薦システムのフィードバックエンドポイントを使用
      await api.post('/api/recommendations/feedback', {
        artworkId,
        feedbackType: isLike ? 'like' : 'dislike',
        context: {
          source: 'recommendation',
          algorithm,
          useAI,
          viewTime: Date.now()
        }
      });

      // Update local state
      if (isLike) {
        setLikedItems(prev => new Set([...prev, artworkId]));
      } else {
        setLikedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(artworkId);
          return newSet;
        });
      }

      // Update artwork likes count
      setArtworks(prev => prev.map(artwork => 
        artwork.id === artworkId 
          ? { ...artwork, likesCount: artwork.likesCount + (isLike ? 1 : -1) }
          : artwork
      ));

    } catch (error) {
      console.error('Failed to like artwork:', error);
    }
  };

  const handleClick = async (artworkId: string) => {
    if (!user) return;

    try {
      // クリックフィードバックを送信
      await api.post('/api/recommendations/feedback', {
        artworkId,
        feedbackType: 'click',
        context: {
          source: 'recommendation',
          algorithm,
          useAI
        }
      });
    } catch (error) {
      console.error('Failed to record click feedback:', error);
    }
  };

  const handleView = async (artworkId: string) => {
    if (!user) return;

    try {
      // 閲覧フィードバックを送信
      await api.post('/api/recommendations/feedback', {
        artworkId,
        feedbackType: 'view',
        context: {
          source: 'recommendation',
          algorithm,
          useAI
        }
      });
    } catch (error) {
      console.error('Failed to record view feedback:', error);
    }
  };

  const handleViewArtist = (artistId: string) => {
    // Navigate to artist profile
    window.open(`/artist/${artistId}`, '_blank');
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user, useAI]);

  if (!user || user.userType !== 'VTUBER') {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">🎨</span>
            おすすめ作品
            {useAI && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                AI推薦
              </span>
            )}
          </CardTitle>
          {algorithm && (
            <p className="text-xs text-gray-500">
              アルゴリズム: {algorithm}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-600">AI推薦</label>
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchRecommendations}
            disabled={loading}
          >
            {loading ? '読み込み中...' : '更新'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48 mb-3"></div>
                <div className="bg-gray-200 rounded h-4 mb-2"></div>
                <div className="bg-gray-200 rounded h-3 w-3/4"></div>
              </div>
            ))}
          </div>
        ) : artworks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artworks.map((artwork) => (
              <div key={artwork.id} className="group relative">
                <div className="relative overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  {/* Artwork Image */}
                  <div className="aspect-video relative overflow-hidden bg-gray-100">
                    <img
                      src={artwork.thumbnailUrl || artwork.imageUrl}
                      alt={artwork.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        // Fallback to placeholder image
                        e.currentTarget.src = '/images/artwork-placeholder.jpg';
                      }}
                    />
                    
                    {/* Like button overlay */}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => handleLike(artwork.id, !likedItems.has(artwork.id))}
                        className={`p-2 rounded-full transition-colors ${
                          likedItems.has(artwork.id)
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    {/* Category badge */}
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-1 bg-black/70 text-white text-xs rounded">
                        {artwork.category}
                      </span>
                    </div>

                    {/* Compatibility Score */}
                    {artwork.compatibilityScore && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-green-500/80 text-white text-xs rounded font-medium">
                          {Math.round(artwork.compatibilityScore * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Artwork Info */}
                  <div className="p-3">
                    <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {artwork.title}
                    </h4>
                    
                    {artwork.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {artwork.description}
                      </p>
                    )}

                    {/* Recommendation Reason */}
                    {artwork.reasoning && (
                      <div className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-800">
                          <span className="font-medium">推薦理由:</span> {artwork.reasoning}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {artwork.tags && artwork.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {artwork.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {artwork.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{artwork.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Artist Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center">
                          {artwork.artist.avatarUrl ? (
                            <img
                              src={artwork.artist.avatarUrl}
                              alt={artwork.artist.displayName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-primary-600">
                              {artwork.artist.displayName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {artwork.artist.displayName}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          {artwork.likesCount}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => {
                          handleClick(artwork.id);
                          handleViewArtist(artwork.artist.id);
                        }}
                      >
                        絵師を見る
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => {
                          handleClick(artwork.id);
                          handleView(artwork.id);
                          // Navigate to artwork detail
                          window.open(`/artwork/${artwork.id}`, '_blank');
                        }}
                      >
                        詳細
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              おすすめ作品がありません
            </h3>
            <p className="text-gray-600 mb-4">
              まだ作品データが不足しています。しばらくしてから再度お試しください。
            </p>
            <Button onClick={fetchRecommendations} disabled={loading}>
              再読み込み
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}