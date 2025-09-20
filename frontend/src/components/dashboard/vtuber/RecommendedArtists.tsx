'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import ContractRequestModal from '@/components/contracts/ContractRequestModal';

interface ArtworkSample {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  style?: string;
  category: string;
  tags?: string[];
  likesCount: number;
}

interface RecommendedArtist {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  rating?: number;
  totalReviews?: number;
  artworkCount: number;
  totalLikes: number;
  artworkSamples: ArtworkSample[];
  compatibilityScore: number;
  reason: string[];
  reasoning?: string;
}

interface ArtistRecommendationsResponse {
  recommendations: RecommendedArtist[];
  total: number;
  algorithm: string;
}

export default function RecommendedArtists() {
  const [artists, setArtists] = useState<RecommendedArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<RecommendedArtist | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const { user } = useAuthStore();

  const fetchRecommendations = async () => {
    if (!user || user.userType !== 'VTUBER') return;

    setLoading(true);
    try {
      const response = await api.get<ArtistRecommendationsResponse>(
        '/api/v1/recommendations/artists?limit=6&includeReason=true'
      );
      setArtists(response.data.recommendations);
    } catch (error) {
      console.error('Failed to fetch artist recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (artistId: string) => {
    // Navigate to artist profile page
    window.open(`/artist/${artistId}`, '_blank');
  };

  const handleRequestContract = (artist: RecommendedArtist) => {
    setSelectedArtist(artist);
    setShowContractModal(true);
  };

  const handleContractSuccess = () => {
    // Refresh recommendations or show success message
    fetchRecommendations();
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  if (!user || user.userType !== 'VTUBER') {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-blue-600 bg-blue-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getScoreText = (score: number) => {
    if (score >= 0.8) return '高';
    if (score >= 0.6) return '中';
    if (score >= 0.4) return '低';
    return '基本';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">🤝</span>
          おすすめ絵師
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="bg-gray-300 rounded h-4 mb-2"></div>
                      <div className="bg-gray-300 rounded h-3 w-3/4"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="bg-gray-300 rounded aspect-square"></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : artists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artists.map((artist) => (
              <div key={artist.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Artist Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {artist.displayName}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {artist.rating && (
                          <span className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            {artist.rating.toFixed(1)}
                          </span>
                        )}
                        <span>{artist.artworkCount}作品</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Compatibility Score */}
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(artist.compatibilityScore)}`}>
                    適合度: {getScoreText(artist.compatibilityScore)}
                  </div>
                </div>

                {/* Bio */}
                {artist.bio && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {artist.bio}
                  </p>
                )}

                {/* Recommendation Reason */}
                {artist.reasoning && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                    <p className="text-xs text-blue-800">
                      <span className="font-medium">推薦理由:</span> {artist.reasoning}
                    </p>
                  </div>
                )}

                {/* Artwork Samples */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {artist.artworkSamples.map((artwork) => (
                    <div key={artwork.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded overflow-hidden">
                        <img
                          src={artwork.thumbnailUrl || artwork.imageUrl}
                          alt={artwork.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.src = '/images/artwork-placeholder.jpg';
                          }}
                        />
                      </div>
                      
                      {/* Artwork info overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 rounded overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <p className="text-xs font-medium truncate">{artwork.title}</p>
                          <p className="text-xs opacity-80">{artwork.category}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>総いいね: {artist.totalLikes}</span>
                  <span>レビュー: {artist.totalReviews || 0}件</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => handleViewProfile(artist.id)}
                  >
                    プロフィール
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleRequestContract(artist)}
                  >
                    依頼する
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              おすすめ絵師がありません
            </h3>
            <p className="text-gray-600 mb-4">
              作品にいいねをして、あなたの好みを学習させてください。
            </p>
            <Button onClick={fetchRecommendations} disabled={loading}>
              再読み込み
            </Button>
          </div>
        )}
      </CardContent>

      {/* Contract Request Modal */}
      {selectedArtist && (
        <ContractRequestModal
          artist={{
            id: selectedArtist.id,
            displayName: selectedArtist.displayName,
            avatarUrl: selectedArtist.avatarUrl,
            bio: selectedArtist.bio,
            rating: selectedArtist.rating
          }}
          isOpen={showContractModal}
          onClose={() => {
            setShowContractModal(false);
            setSelectedArtist(null);
          }}
          onSuccess={handleContractSuccess}
        />
      )}
    </Card>
  );
}