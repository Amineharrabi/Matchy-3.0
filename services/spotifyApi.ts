import { SpotifyAuth } from './spotifyAuth';
import { SpotifyUser, SpotifyTrack, SpotifyArtist, SpotifyPlaylist, RecommendationSeed } from '../types/spotify';

class SpotifyApiService {
  private baseUrl = 'https://api.spotify.com/v1';
  private auth = SpotifyAuth.getInstance();

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    const token = await this.auth.getAccessToken();
    if (!token) throw new Error('No access token available');

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Spotify API request failed:', error);
      return null;
    }
  }

  async getCurrentUser(): Promise<SpotifyUser | null> {
    return this.makeRequest<SpotifyUser>('/me');
  }

  async getUserPlaylists(limit: number = 50): Promise<SpotifyPlaylist[]> {
    const response = await this.makeRequest<{ items: SpotifyPlaylist[] }>(`/me/playlists?limit=${limit}`);
    return response?.items || [];
  }

  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist | null> {
    return this.makeRequest<SpotifyPlaylist>(`/playlists/${playlistId}`);
  }

  async getPlaylistTracks(playlistId: string, limit: number = 100): Promise<SpotifyTrack[]> {
    const response = await this.makeRequest<{ items: Array<{ track: SpotifyTrack }> }>(`/playlists/${playlistId}/tracks?limit=${limit}`);
    return response?.items.map(item => item.track) || [];
  }

  async getUserTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 20): Promise<SpotifyTrack[]> {
    const response = await this.makeRequest<{ items: SpotifyTrack[] }>(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
    return response?.items || [];
  }

  async getUserTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 20): Promise<SpotifyArtist[]> {
    const response = await this.makeRequest<{ items: SpotifyArtist[] }>(`/me/top/artists?time_range=${timeRange}&limit=${limit}`);
    return response?.items || [];
  }

  async getSavedTracks(limit: number = 50): Promise<SpotifyTrack[]> {
    const response = await this.makeRequest<{ items: Array<{ track: SpotifyTrack }> }>(`/me/tracks?limit=${limit}`);
    return response?.items.map(item => item.track) || [];
  }

  async getFollowedArtists(limit: number = 50): Promise<SpotifyArtist[]> {
    const response = await this.makeRequest<{ artists: { items: SpotifyArtist[] } }>(`/me/following?type=artist&limit=${limit}`);
    return response?.artists.items || [];
  }

  async getRecommendations(seeds: RecommendationSeed): Promise<SpotifyTrack[]> {
    const params = new URLSearchParams();

    Object.entries(seeds).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await this.makeRequest<{ tracks: SpotifyTrack[] }>(`/recommendations?${params.toString()}`);
    return response?.tracks || [];
  }

  async getAvailableGenres(): Promise<string[]> {
    const response = await this.makeRequest<{ genres: string[] }>('/recommendations/available-genre-seeds');
    return response?.genres || [];
  }

  async searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
    });

    const response = await this.makeRequest<{ tracks: { items: SpotifyTrack[] } }>(`/search?${params.toString()}`);
    return response?.tracks.items || [];
  }

  async searchArtists(query: string, limit: number = 20): Promise<SpotifyArtist[]> {
    const params = new URLSearchParams({
      q: query,
      type: 'artist',
      limit: limit.toString(),
    });

    const response = await this.makeRequest<{ artists: { items: SpotifyArtist[] } }>(`/search?${params.toString()}`);
    return response?.artists.items || [];
  }

  async createPlaylist(name: string, description: string, isPublic: boolean = false): Promise<SpotifyPlaylist | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    return this.makeRequest<SpotifyPlaylist>(`/users/${user.id}/playlists`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        public: isPublic,
      }),
    });
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<boolean> {
    const response = await this.makeRequest(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({
        uris: trackUris,
      }),
    });

    return response !== null;
  }

  async getRecentlyPlayed(limit: number = 50): Promise<SpotifyTrack[]> {
    const response = await this.makeRequest<{ items: Array<{ track: SpotifyTrack }> }>(`/me/player/recently-played?limit=${limit}`);
    return response?.items.map(item => item.track) || [];
  }

  async getArtist(artistId: string): Promise<SpotifyArtist | null> {
    return this.makeRequest<SpotifyArtist>(`/artists/${artistId}`);
  }

  async getTrack(trackId: string): Promise<SpotifyTrack | null> {
    return this.makeRequest<SpotifyTrack>(`/tracks/${trackId}`);
  }

  async getTrackFeatures(trackId: string): Promise<any> {
    return this.makeRequest(`/audio-features/${trackId}`);
  }
}

export const spotifyApi = new SpotifyApiService();