'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import api, { type Artwork, type ArtworkRecommendationResponse } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { useScrollTracking } from '@/hooks/useScrollTracking';

// 新しいAPIクライアントの型を使用
type RecommendationItem = Artwork;

export default function RecommendedArtworks() {
  const [artworks, setArtworks] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [useAI, setUseAI] = useState(true);
  const [algorithm, setAlgorithm] = useState<string>('');
  const { user } = useAuthStore();
  
  // Analytics tracking refs
  const viewTimestamps = useRef<Map<string, number>>(new Map());
  const hoverTimestamps = useRef<Map<string, number>>(new Map());
  const intersectionObserver = useRef<IntersectionObserver | null>(null);

  // Scroll tracking for the recommendations page
  useScrollTracking({
    targetType: 'recommendations_page',
    targetId: 'artworks',
    threshold: 25,
    debounceMs: 1000
  });

  const fetchRecommendations = async () => {
    if (!user || user.userType !== 'VTUBER') return;

    setLoading(true);
    try {
      // 大量推薦リストからランダム6個を取得するAPIを使用
      const response = await api.getBulkArtworkRecommendations({
        includeReason: true
      });
      
      setArtworks(response.recommendations || []);
      setAlgorithm(response.algorithm || 'bulk_random');
    } catch (error) {
      console.error('Failed to fetch bulk recommendations:', error);
      setArtworks([]);
      setAlgorithm('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (artworkId: string, isLike: boolean) => {
    if (!user) return;

    try {
      // Analytics tracking for like action
      analytics.trackLike('artwork', artworkId, isLike);

      // 新しいAPIクライアントメソッドを使用
      await api.submitRecommendationFeedback(
        artworkId,
        isLike ? 'like' : 'dislike',
        {
          source: 'recommendation',
          algorithm,
          useAI,
          viewTime: Date.now()
        }
      );

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

  const handleClick = async (artworkId: string, clickPosition?: { x: number; y: number }) => {
    if (!user) return;

    try {
      // Analytics tracking for click action
      analytics.trackClick('artwork', artworkId, clickPosition);

      // 新しいAPIクライアントメソッドを使用
      await api.submitRecommendationFeedback(
        artworkId,
        'click',
        {
          source: 'recommendation',
          algorithm,
          useAI
        }
      );
    } catch (error) {
      console.error('Failed to record click feedback:', error);
    }
  };

  const handleView = async (artworkId: string, duration?: number) => {
    if (!user) return;

    try {
      // Analytics tracking for view action
      analytics.trackView('artwork', artworkId, duration);

      // 新しいAPIクライアントメソッドを使用
      await api.submitRecommendationFeedback(
        artworkId,
        'view',
        {
          source: 'recommendation',
          algorithm,
          useAI,
          duration
        }
      );
    } catch (error) {
      console.error('Failed to record view feedback:', error);
    }
  };

  const handleViewArtist = (artistId: string) => {
    // Analytics tracking for artist view
    analytics.trackClick('artist', artistId);
    // Navigate to artist profile
    window.open(`/artist/${artistId}`, '_blank');
  };

  // Hover tracking handlers
  const handleMouseEnter = (artworkId: string) => {
    hoverTimestamps.current.set(artworkId, Date.now());
  };

  const handleMouseLeave = (artworkId: string) => {
    const hoverStart = hoverTimestamps.current.get(artworkId);
    if (hoverStart) {
      const hoverTime = Date.now() - hoverStart;
      analytics.trackHover('artwork', artworkId, hoverTime);
      hoverTimestamps.current.delete(artworkId);
    }
  };

  // Setup intersection observer for view tracking
  useEffect(() => {
    if (!user) return;

    intersectionObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const artworkId = entry.target.getAttribute('data-artwork-id');
          if (!artworkId) return;

          if (entry.isIntersecting) {
            // Start tracking view time
            viewTimestamps.current.set(artworkId, Date.now());
          } else {
            // End tracking and send analytics
            const viewStart = viewTimestamps.current.get(artworkId);
            if (viewStart) {
              const viewDuration = Date.now() - viewStart;
              if (viewDuration > 1000) { // Only track views longer than 1 second
                handleView(artworkId, viewDuration);
              }
              viewTimestamps.current.delete(artworkId);
            }
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the artwork is visible
        rootMargin: '0px'
      }
    );

    return () => {
      if (intersectionObserver.current) {
        intersectionObserver.current.disconnect();
      }
    };
  }, [user, algorithm]);

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

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
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              ランダム表示
            </span>
          </CardTitle>
          {algorithm && (
            <p className="text-xs text-gray-500">
              アルゴリズム: {algorithm} | 大量リストからランダム6個を表示
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center gap-1"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              読み込み中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              ランダム更新
            </>
          )}
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
              <div 
                key={artwork.id} 
                className="group relative"
                data-artwork-id={artwork.id}
                ref={(el) => {
                  if (el && intersectionObserver.current) {
                    intersectionObserver.current.observe(el);
                  }
                }}
                onMouseEnter={() => handleMouseEnter(artwork.id)}
                onMouseLeave={() => handleMouseLeave(artwork.id)}
              >
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
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickPosition = {
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                          };
                          handleLike(artwork.id, !likedItems.has(artwork.id));
                        }}
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
                          {artwork.artist?.avatarUrl ? (
                            <img
                              src={artwork.artist.avatarUrl}
                              alt={artwork.artist?.displayName || 'Artist'}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                // Fallback to initial if avatar fails to load
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                                }
                              }}
                            />
                          ) : null}
                          <span 
                            className="text-xs font-medium text-primary-600"
                            style={{ display: artwork.artist?.avatarUrl ? 'none' : 'block' }}
                          >
                            {(artwork.artist?.displayName || 'A').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {artwork.artist?.displayName || 'Unknown Artist'}
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
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickPosition = {
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                          };
                          handleClick(artwork.id, clickPosition);
                          if (artwork.artist?.id) {
                            handleViewArtist(artwork.artist.id);
                          } else {
                            console.warn('Artist ID not available for artwork:', artwork.id);
                          }
                        }}
                      >
                        絵師を見る
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickPosition = {
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                          };
                          handleClick(artwork.id, clickPosition);
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