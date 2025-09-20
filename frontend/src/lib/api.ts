const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  userType: 'VTUBER' | 'ARTIST';
  status: string;
  emailVerified: boolean;
  profile?: Profile;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Profile {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  skills: string[] | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  timezone: string | null;
  preferredCommStyle: string | null;
  experience: number | null;
  rating: number | null;
  totalReviews: number;
  portfolioUrls: string[] | null;
}

export interface Match {
  id: string;
  vtuberUserId: string;
  artistUserId: string;
  matchScore: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  description: string | null;
  budget: number | null;
  deadline: string | null;
  matchedAt: string;
  respondedAt: string | null;
  completedAt: string | null;
  vtuberUser?: User;
  artistUser?: User;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    // Get token from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(
    email: string,
    password: string,
    userType: 'VTUBER' | 'ARTIST',
    displayName?: string
  ): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, userType, displayName }),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/v1/auth/me');
  }

  async refreshToken(): Promise<ApiResponse<{ token: string; expiresAt: string }>> {
    return this.request('/api/v1/auth/refresh', {
      method: 'POST',
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/api/v1/auth/logout', {
      method: 'POST',
    });
  }

  // User endpoints
  async getUserProfile(id: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/api/v1/users/${id}/profile`);
  }

  async updateProfile(profileData: Partial<Profile>): Promise<ApiResponse<Profile>> {
    return this.request<Profile>('/api/v1/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async searchUsers(params: {
    userType?: string;
    skills?: string;
    priceMin?: number;
    priceMax?: number;
    availability?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<User[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<User[]>(`/api/v1/users/search?${searchParams}`);
  }

  async getUserStats(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/users/stats');
  }

  // Match endpoints
  async getMatchSuggestions(params?: {
    limit?: number;
    skills?: string;
    priceMax?: number;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request(`/api/v1/matches/suggestions?${searchParams}`);
  }

  async createMatchRequest(data: {
    artistUserId: string;
    description: string;
    budget: number;
    deadline: string;
  }): Promise<ApiResponse<Match>> {
    return this.request<Match>('/api/v1/matches/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async respondToMatch(
    matchId: string,
    status: 'ACCEPTED' | 'REJECTED',
    message?: string
  ): Promise<ApiResponse<Match>> {
    return this.request<Match>(`/api/v1/matches/${matchId}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ status, message }),
    });
  }

  async getMyMatches(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Match[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request<Match[]>(`/api/v1/matches/my-matches?${searchParams}`);
  }

  async getMatchDetails(matchId: string): Promise<ApiResponse<Match>> {
    return this.request<Match>(`/api/v1/matches/${matchId}`);
  }

  // Avatar upload/delete endpoints
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${this.baseURL}/api/v1/users/avatar`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async deleteAvatar(): Promise<ApiResponse> {
    return this.request('/api/v1/users/avatar', {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;