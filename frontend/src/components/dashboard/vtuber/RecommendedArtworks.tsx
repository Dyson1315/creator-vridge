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

interface RecommendationsResponse {
  recommendations: Artwork[];
  total: number;
  recommendationId: string;
}

export default function RecommendedArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();

  const fetchRecommendations = async () => {
    if (!user || user.userType !== 'VTUBER') return;

    setLoading(true);
    try {
      const response = await api.get<RecommendationsResponse>('/api/v1/artworks/recommendations?limit=6');
      setArtworks(response.data.recommendations);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (artworkId: string, isLike: boolean) => {
    if (!user) return;

    try {
      await api.post('/api/v1/artworks/like', {
        artworkId,
        isLike,
        context: {
          source: 'recommendation',
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

  const handleViewArtist = (artistId: string) => {
    // Navigate to artist profile
    window.open(`/artist/${artistId}`, '_blank');
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  if (!user || user.userType !== 'VTUBER') {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">🎨</span>
          おすすめ作品
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
        >
          {loading ? '読み込み中...' : '更新'}
        </Button>
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
                        onClick={() => handleViewArtist(artwork.artist.id)}
                      >
                        絵師を見る
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => {/* Navigate to artwork detail */}}
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