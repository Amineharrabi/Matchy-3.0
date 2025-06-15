import { SpotifyAuth } from './spotifyAuth';
import { SpotifyUser, SpotifyTrack, SpotifyArtist, SpotifyPlaylist, RecommendationSeed, MoodPreset } from '../types/spotify';
import { MOOD_PRESETS } from '../constants/genres';
import * as SecureStore from 'expo-secure-store';
import axios, { AxiosRequestConfig } from 'axios';

interface SeedValidationResult {
  valid: boolean;
  failedSeeds: string[];
  warnings: string[];
  details: {
    validGenres: string[];
    validArtists: string[];
    validTracks: string[];
    invalidGenres: string[];
    invalidArtists: string[];
    invalidTracks: string[];
    seedCounts: {
      total: number;
      genres: number;
      artists: number;
      tracks: number;
    };
  };
}

class SpotifyApiService {
  private baseUrl = 'https://api.spotify.com/v1';
  private auth = SpotifyAuth.getInstance();

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    const token = await this.auth.getAccessToken();
    if (!token) throw new Error('No access token available');

    try {
      console.log(`Making Spotify API request to: ${endpoint}`);

      const config: AxiosRequestConfig = {
        method: options.method || 'GET',
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string> || {})
        },
        data: options.body ? JSON.parse(options.body as string) : undefined,
      };

      const response = await axios(config);

      // Special handling for 204 No Content responses
      if (response.status === 204) {
        console.log('Received 204 No Content response');
        return null as T;
      }

      return response.data as T;
    } catch (error: any) {
      console.error('Spotify API request failed:', {
        endpoint,
        error: error?.response?.data || error?.message || 'Unknown error',
        status: error?.response?.status,
      });

      // Handle 401 Unauthorized
      if (error?.response?.status === 401 && retryCount === 0) {
        console.error('Unauthorized - token may be expired, attempting to refresh...');
        await SecureStore.deleteItemAsync('spotify_access_token');
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }

      throw new Error(`Spotify API error: ${error?.response?.data?.error?.message || error?.message || 'Unknown error'}`);
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
    try {
      console.log(`Fetching tracks for playlist: ${playlistId}`);
      const response = await this.makeRequest<{ items: Array<{ track: SpotifyTrack }> }>(
        `/playlists/${playlistId}/tracks?limit=${limit}`
      );
      return response.items.map(item => item.track);
    } catch (error: any) {
      console.error(`Failed to fetch playlist tracks:`, {
        playlistId,
        error: error?.message || 'Unknown error'
      });
      throw error;
    }
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
    try {
      const params = new URLSearchParams();

      // Log initial seed data
      console.log('Recommendation seeds:', {
        tracks: seeds.seed_tracks,
        artists: seeds.seed_artists,
        genres: seeds.seed_genres,
        limit: seeds.limit,
        market: seeds.market
      });

      // Add seeds to params
      if (seeds.seed_tracks?.length) {
        params.append('seed_tracks', seeds.seed_tracks.join(','));
      }
      if (seeds.seed_artists?.length) {
        params.append('seed_artists', seeds.seed_artists.join(','));
      }
      if (seeds.seed_genres?.length) {
        params.append('seed_genres', seeds.seed_genres.join(','));
      }

      // Verify we have at least one type of seed
      if (!seeds.seed_tracks?.length && !seeds.seed_artists?.length && !seeds.seed_genres?.length) {
        throw new Error('At least one seed (tracks, artists, or genres) is required');
      }

      // Add limit parameter (default 20, max 100)
      const limit = seeds.limit || 20;
      params.append('limit', Math.min(100, Math.max(1, limit)).toString());

      // Add market if provided
      if (seeds.market) {
        params.append('market', seeds.market);
      }

      // Add other parameters
      Object.entries(seeds).forEach(([key, value]) => {
        if (value !== undefined && value !== null &&
          !['seed_tracks', 'seed_artists', 'seed_genres'].includes(key)) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const queryString = params.toString();
      console.log('Final recommendations request:', {
        url: `/recommendations?${queryString}`,
        params: Object.fromEntries(params.entries())
      });

      // Make the request with retry logic for transient failures
      const maxRetries = 2;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await this.makeRequest<{ tracks: SpotifyTrack[] }>(`/recommendations?${queryString}`);

          if (!response?.tracks?.length) {
            throw new Error('No recommendations returned');
          }

          console.log(`Generated ${response.tracks.length} recommendations`);
          return response.tracks;
        } catch (error: any) {
          console.warn(`Attempt ${attempt + 1} failed:`, {
            error: error?.message,
            status: error?.response?.status,
            data: error?.response?.data,
            endpoint: `/recommendations?${queryString}`
          });
          lastError = error;

          // Handle specific error cases
          if (error?.response?.status === 404) {
            throw new Error('Unable to generate recommendations. Please try different tracks, artists, or genres.');
          }

          // Only retry on potentially transient errors
          if (!error.message.includes('429') && // Rate limit
            !error.message.includes('503') && // Service unavailable
            !error.message.includes('timeout')) {
            throw error;
          }

          if (attempt < maxRetries) {
            // Wait before retrying, with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }
        }
      }

      // If we get here, all retries failed
      throw lastError || new Error('Failed to generate recommendations after retries');
    } catch (error: any) {
      console.error('Failed to get recommendations:', {
        error: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
      throw new Error(`Failed to get recommendations: ${error?.message || 'Unknown error'}`);
    }
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

  private async validateTrack(trackId: string): Promise<boolean> {
    try {
      console.log(`Validating track ${trackId}...`);
      const track = await this.makeRequest<SpotifyTrack>(`/tracks/${trackId}`);

      // Log detailed track information
      console.log('Track validation result:', {
        id: trackId,
        name: track?.name,
        is_playable: track?.is_playable,
        available_markets: track?.available_markets,
        popularity: track?.popularity
      });

      // Check if track is playable and available in the market
      const isValid = track && track.is_playable !== false;
      if (!isValid) {
        console.warn(`Track ${trackId} validation failed:`, {
          reason: !track ? 'Track not found' : 'Track not playable',
          details: track
        });
      }
      return isValid;
    } catch (error) {
      console.warn(`Track ${trackId} validation failed:`, error);
      return false;
    }
  }

  private async validateSeedCombination(options: {
    genres?: string[];
    artists?: string[];
    tracks?: string[];
  }): Promise<SeedValidationResult> {
    const { genres = [], artists = [], tracks = [] } = options;
    const totalSeeds = genres.length + artists.length + tracks.length;
    const warnings: string[] = [];
    const details = {
      validGenres: [] as string[],
      validArtists: [] as string[],
      validTracks: [] as string[],
      invalidGenres: [] as string[],
      invalidArtists: [] as string[],
      invalidTracks: [] as string[],
      seedCounts: {
        total: totalSeeds,
        genres: genres.length,
        artists: artists.length,
        tracks: tracks.length
      }
    };

    if (totalSeeds > 5) {
      // Build a detailed message about which seed types exceed limits
      const seedDetails: string[] = [];
      if (genres.length > 0) seedDetails.push(`${genres.length} genres`);
      if (artists.length > 0) seedDetails.push(`${artists.length} artists`);
      if (tracks.length > 0) seedDetails.push(`${tracks.length} tracks`);

      // Create a user-friendly message suggesting how to reduce seeds
      const seedTypeWithMost = tracks.length >= artists.length && tracks.length >= genres.length ? 'tracks' :
        artists.length >= tracks.length && artists.length >= genres.length ? 'artists' :
          'genres';

      const suggestion = `Try reducing the number of ${seedTypeWithMost} to stay within the 5 seed limit`;

      console.warn('Seed count validation failed:', {
        totalSeeds,
        breakdown: { genres: genres.length, artists: artists.length, tracks: tracks.length },
        suggestion
      });

      return {
        valid: false,
        failedSeeds: ['Too many seeds - maximum is 5 total'],
        warnings: [
          `Too many seeds provided (${seedDetails.join(', ')}). Spotify allows a maximum of 5 seeds total.`,
          suggestion
        ],
        details
      };
    }

    if (totalSeeds === 0) {
      return {
        valid: false,
        failedSeeds: ['No seeds provided'],
        warnings: ['At least one seed (genre, artist, or track) is required'],
        details
      };
    }

    const failedSeeds: string[] = [];

    // Validate tracks in parallel for better performance
    if (tracks.length) {
      console.log('Validating tracks:', tracks);
      const trackValidations = await Promise.allSettled(
        tracks.map(async trackId => {
          try {
            const isValid = await this.validateTrack(trackId);
            if (isValid) {
              details.validTracks.push(trackId);
            } else {
              details.invalidTracks.push(trackId);
              failedSeeds.push(`track:${trackId}`);
            }
            return isValid;
          } catch (error) {
            console.warn(`Track validation failed for ${trackId}:`, error);
            details.invalidTracks.push(trackId);
            failedSeeds.push(`track:${trackId}`);
            return false;
          }
        })
      );

      const validTrackCount = trackValidations.filter(
        result => result.status === 'fulfilled' && result.value
      ).length;

      if (validTrackCount === 0 && tracks.length > 0) {
        warnings.push('None of the provided tracks are available for recommendations');
      }
    }

    // Validate artists in parallel
    if (artists.length) {
      console.log('Validating artists:', artists);
      try {
        const response = await this.makeRequest<{ artists: Array<SpotifyArtist | null> }>(
          `/artists?ids=${artists.join(',')}`
        );
        response.artists.forEach((artist, index) => {
          const artistId = artists[index];
          if (artist) {
            details.validArtists.push(artistId);
          } else {
            details.invalidArtists.push(artistId);
            failedSeeds.push(`artist:${artistId}`);
          }
        });

        if (details.validArtists.length === 0 && artists.length > 0) {
          warnings.push('None of the provided artists were found');
        }
      } catch (error) {
        console.error('Artist validation failed:', error);
        failedSeeds.push(...artists.map(id => `artist:${id}`));
        details.invalidArtists.push(...artists);
        warnings.push('Failed to validate artists - they may not be available');
      }
    }

    // Validate genres
    if (genres.length) {
      console.log('Validating genres:', genres);
      try {
        const availableGenres = await this.makeRequest<{ genres: string[] }>('/recommendations/available-genre-seeds');
        genres.forEach(genre => {
          if (availableGenres.genres.includes(genre)) {
            details.validGenres.push(genre);
          } else {
            details.invalidGenres.push(genre);
            failedSeeds.push(`genre:${genre}`);
          }
        });

        if (details.validGenres.length === 0 && genres.length > 0) {
          warnings.push('None of the provided genres are valid for recommendations');
        }
      } catch (error) {
        console.error('Genre validation failed:', error);
        failedSeeds.push(...genres.map(g => `genre:${g}`));
        details.invalidGenres.push(...genres);
        warnings.push('Failed to validate genres - they may not be available');
      }
    }

    // Check if we have at least one valid seed of any type
    const hasValidSeed =
      details.validGenres.length > 0 ||
      details.validArtists.length > 0 ||
      details.validTracks.length > 0;

    if (!hasValidSeed) {
      warnings.push('No valid seeds found after validation');
    }

    return {
      valid: hasValidSeed,
      failedSeeds,
      warnings,
      details
    };
  }

  async generateRecommendations(options: {
    genres?: string[];
    artists?: SpotifyArtist[];
    tracks?: SpotifyTrack[];
    mood?: keyof typeof MOOD_PRESETS;
    limit?: number;
    source?: string;
  }): Promise<SpotifyTrack[]> {
    try {
      const { genres, artists, tracks, mood, limit = 20 } = options;

      // Log initial request details with more context
      console.log('Generating recommendations with:', {
        genres: genres || [],
        mood,
        seedArtists: artists?.length || 0,
        seedTracks: tracks?.length || 0,
        source: options.source,
        totalSeeds: (genres?.length || 0) + (artists?.length || 0) + (tracks?.length || 0)
      });

      // Get mood presets if specified
      const moodPreset: MoodPreset = mood ? MOOD_PRESETS[mood] : {};

      // Combine genre seeds from both direct selection and mood
      const combinedGenres = [...(genres || [])];
      if (moodPreset.seed_genres) {
        combinedGenres.push(...moodPreset.seed_genres);
      }

      // Validate all seeds
      const validationResult = await this.validateSeedCombination({
        genres: combinedGenres,
        artists: artists?.map(a => a.id),
        tracks: tracks?.map(t => t.id)
      });

      // Log validation results
      console.log('Seed validation results:', {
        valid: validationResult.valid,
        failedCount: validationResult.failedSeeds.length,
        warnings: validationResult.warnings,
        validCounts: {
          genres: validationResult.details.validGenres.length,
          artists: validationResult.details.validArtists.length,
          tracks: validationResult.details.validTracks.length
        }
      });

      // If validation fails, throw a more detailed error
      if (!validationResult.valid) {
        const errorDetails = [];

        // Handle seed count error specifically
        if (validationResult.details.seedCounts.total > 5) {
          const breakdown = validationResult.details.seedCounts;
          errorDetails.push(
            `Too many seeds provided (${breakdown.total} total: ` +
            `${breakdown.tracks} tracks, ${breakdown.artists} artists, ${breakdown.genres} genres). ` +
            'Spotify allows a maximum of 5 seeds in total.\n\n' +
            validationResult.warnings[1] // This is the suggestion we added above
          );
        } else {
          // Handle other validation errors
          if (validationResult.details.invalidGenres.length) {
            errorDetails.push(`Invalid genres: ${validationResult.details.invalidGenres.join(', ')}`);
          }
          if (validationResult.details.invalidArtists.length) {
            errorDetails.push(`Invalid artists found`);
          }
          if (validationResult.details.invalidTracks.length) {
            errorDetails.push(`Some tracks are not available`);
          }
        }

        throw new Error(
          `Unable to generate recommendations: ${errorDetails.join('. ')}`
        );
      }

      // Create seeds object with validated data only
      const seeds: RecommendationSeed = {
        limit,
        ...(validationResult.details.validGenres.length ?
          { seed_genres: validationResult.details.validGenres.slice(0, 5) } : {}),
        ...(validationResult.details.validArtists.length ?
          { seed_artists: validationResult.details.validArtists.slice(0, 5) } : {}),
        ...(validationResult.details.validTracks.length ?
          { seed_tracks: validationResult.details.validTracks.slice(0, 5) } : {})
      };

      // Add mood parameters if they exist
      if (moodPreset.target_valence !== undefined) seeds.target_valence = moodPreset.target_valence;
      if (moodPreset.target_energy !== undefined) seeds.target_energy = moodPreset.target_energy;
      if (moodPreset.target_danceability !== undefined) seeds.target_danceability = moodPreset.target_danceability;
      if (moodPreset.target_acousticness !== undefined) seeds.target_acousticness = moodPreset.target_acousticness;
      if (moodPreset.target_tempo !== undefined) seeds.target_tempo = moodPreset.target_tempo;

      // Convert seeds to URL parameters
      const params = new URLSearchParams();
      Object.entries(seeds).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              params.append(key, value.join(','));
            }
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const queryString = params.toString();
      console.log('Making recommendations request:', {
        parameters: queryString,
        seedCounts: {
          genres: seeds.seed_genres?.length || 0,
          artists: seeds.seed_artists?.length || 0,
          tracks: seeds.seed_tracks?.length || 0
        },
        mood: mood || 'none'
      });

      // Make the request with retry logic for transient failures
      const maxRetries = 2;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await this.makeRequest<{ tracks: SpotifyTrack[] }>(
            `/recommendations?${queryString}`
          );

          if (!response?.tracks?.length) {
            throw new Error('No recommendations returned');
          }

          console.log(`Generated ${response.tracks.length} recommendations`);
          return response.tracks;
        } catch (error: any) {
          console.warn(`Attempt ${attempt + 1} failed:`, error);
          lastError = error;

          // Only retry on potentially transient errors
          if (!error.message.includes('429') && // Rate limit
            !error.message.includes('503') && // Service unavailable
            !error.message.includes('timeout')) {
            throw error;
          }

          if (attempt < maxRetries) {
            // Wait before retrying, with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }
        }
      }

      // If we get here, all retries failed
      throw lastError || new Error('Failed to generate recommendations after retries');
    } catch (error: any) {
      console.error('Failed to generate recommendations:', {
        error: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace'
      });
      throw error;
    }
  }

  async createPlaylist(name: string, tracks: SpotifyTrack[]): Promise<SpotifyPlaylist | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    // Create empty playlist
    const playlist = await this.makeRequest<SpotifyPlaylist>(`/users/${user.id}/playlists`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        description: 'Generated by Matchy',
        public: false
      })
    });

    if (!playlist) return null;

    // Add tracks to playlist
    await this.makeRequest(`/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      body: JSON.stringify({
        uris: tracks.map(t => `spotify:track:${t.id}`)
      })
    });

    return playlist;
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