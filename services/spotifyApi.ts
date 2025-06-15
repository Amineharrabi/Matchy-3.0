import { SpotifyAuth } from './spotifyAuth';
import { SpotifyUser, SpotifyTrack, SpotifyArtist, SpotifyPlaylist, MoodPreset } from '../types/spotify';
import * as SecureStore from 'expo-secure-store';
import axios, { AxiosRequestConfig } from 'axios';

// Add Last.fm API key from environment
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0';

class SpotifyApiService {
  private baseUrl = 'https://api.spotify.com/v1';
  private auth = SpotifyAuth.getInstance();
  private userMarket: string | null = null; // Cache user's market

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    const token = await this.auth.getAccessToken();
    if (!token) throw new Error('No access token available');

    try {
      console.log(`Making Spotify API request to: ${endpoint}`);

      const headers = options.headers as Record<string, string> || {};
      const isJsonRequest = headers['Content-Type'] === 'application/json';

      const config: AxiosRequestConfig = {
        method: options.method || 'GET',
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          ...headers
        },
        // Only parse body as JSON if Content-Type is application/json
        data: isJsonRequest && options.body
          ? JSON.parse(options.body as string)
          : options.body
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
        // Clear the access token to force a refresh
        await SecureStore.deleteItemAsync('spotify_access_token');
        // Wait a bit to ensure the token is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
        // Try the request again with a new token
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }

      // If we get a 403 Forbidden, it might be a scope issue
      if (error?.response?.status === 403) {
        console.error('Forbidden - missing required scope, please re-authenticate');
        // Clear all tokens to force re-authentication
        await this.auth.clearTokens();
        throw new Error('Missing required scope. Please log in again.');
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

  async getUserMarket(): Promise<string> {
    if (this.userMarket) {
      return this.userMarket;
    }

    try {
      const user = await this.makeRequest<SpotifyUser>('/me');
      this.userMarket = user?.country || 'US';
      console.log(`User market set to: ${this.userMarket}`);
      return this.userMarket;
    } catch (error) {
      console.warn('Could not get user market, using US as fallback:', error);
      this.userMarket = 'US';
      return this.userMarket;
    }
  }

  async searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
    const market = await this.getUserMarket();
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
      market,
    });

    const response = await this.makeRequest<{ tracks: { items: SpotifyTrack[] } }>(`/search?${params.toString()}`);
    return response?.tracks.items || [];
  }

  async searchArtists(query: string, limit: number = 20): Promise<SpotifyArtist[]> {
    const market = await this.getUserMarket();
    const params = new URLSearchParams({
      q: query,
      type: 'artist',
      limit: limit.toString(),
      market,
    });

    const response = await this.makeRequest<{ artists: { items: SpotifyArtist[] } }>(`/search?${params.toString()}`);
    return response?.artists.items || [];
  }

  async createPlaylist(name: string, tracks: SpotifyTrack[]): Promise<SpotifyPlaylist | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    // Create empty playlist with custom name format
    const playlist = await this.makeRequest<SpotifyPlaylist>(`/users/${user.id}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Created for ${user.display_name}, by Matchy`,
        description: 'Generated by Matchy',
        public: false
      })
    });

    if (!playlist) return null;

    // Add tracks to playlist
    await this.makeRequest(`/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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

  // Add Last.fm API helper function
  private async makeLastfmRequest<T>(method: string, params: Record<string, string>): Promise<T> {
    try {
      const queryParams = new URLSearchParams({
        method,
        api_key: LASTFM_API_KEY!,
        format: 'json',
        ...params
      });

      const response = await axios.get(`${LASTFM_BASE_URL}/?${queryParams.toString()}`);
      return response.data as T;
    } catch (error: any) {
      console.error('Last.fm API request failed:', {
        method,
        error: error?.response?.data || error?.message || 'Unknown error'
      });
      throw new Error(`Last.fm API error: ${error?.message || 'Unknown error'}`);
    }
  }

  // Add Last.fm similar tracks function
  private async getLastfmSimilarTracks(trackName: string, artistName: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await this.makeLastfmRequest<{ similartracks: { track: any[] } }>('track.getsimilar', {
        artist: artistName,
        track: trackName,
        limit: limit.toString()
      });
      return response.similartracks.track;
    } catch (error) {
      console.error('Failed to get similar tracks from Last.fm:', error);
      return [];
    }
  }

  // Add Last.fm similar artists function
  private async getLastfmSimilarArtists(artistName: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await this.makeLastfmRequest<{ similarartists: { artist: any[] } }>('artist.getsimilar', {
        artist: artistName,
        limit: limit.toString()
      });
      return response.similarartists.artist;
    } catch (error) {
      console.error('Failed to get similar artists from Last.fm:', error);
      return [];
    }
  }

  // Add Spotify track search helper
  private async searchSpotifyTrack(trackName: string, artistName: string): Promise<SpotifyTrack | null> {
    try {
      const query = `track:${trackName} artist:${artistName}`;
      const tracks = await this.searchTracks(query, 1);
      return tracks[0] || null;
    } catch (error) {
      console.error('Failed to search Spotify track:', error);
      return null;
    }
  }

  // Add track-based recommendations function
  private async getTrackBasedRecommendations(userTopTracks: SpotifyTrack[], limit: number = 20): Promise<SpotifyTrack[]> {
    const recommendations: SpotifyTrack[] = [];
    const seenTracks = new Set<string>();

    // Use more seed tracks for better variety
    const seedTracks = userTopTracks.slice(0, 50);

    // Process tracks in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < seedTracks.length; i += batchSize) {
      const batch = seedTracks.slice(i, i + batchSize);

      // Process each track in the batch
      for (const track of batch) {
        // Reduce delay to 50ms for faster processing
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
          // Get recommendations directly from Last.fm
          const similarTracks = await this.getLastfmSimilarTracks(track.name, track.artists[0].name, 20);

          for (const similarTrack of similarTracks) {
            if (recommendations.length >= limit * 2) break;

            const spotifyTrack = await this.searchSpotifyTrack(similarTrack.name, similarTrack.artist.name);

            if (spotifyTrack && !seenTracks.has(spotifyTrack.id)) {
              seenTracks.add(spotifyTrack.id);
              recommendations.push({
                ...spotifyTrack,
                similarity_score: similarTrack.match,
                source_track: track.name
              });
            }
          }
        } catch (error) {
          console.error('Error getting track-based recommendations:', error);
          continue;
        }
      }
    }

    // If we don't have enough recommendations, try to get more from the remaining tracks
    if (recommendations.length < limit && userTopTracks.length > seedTracks.length) {
      const remainingTracks = userTopTracks.slice(seedTracks.length);
      for (const track of remainingTracks) {
        if (recommendations.length >= limit * 2) break;

        try {
          const similarTracks = await this.getLastfmSimilarTracks(track.name, track.artists[0].name, 15);

          for (const similarTrack of similarTracks) {
            if (recommendations.length >= limit * 2) break;

            const spotifyTrack = await this.searchSpotifyTrack(similarTrack.name, similarTrack.artist.name);

            if (spotifyTrack && !seenTracks.has(spotifyTrack.id)) {
              seenTracks.add(spotifyTrack.id);
              recommendations.push({
                ...spotifyTrack,
                similarity_score: similarTrack.match,
                source_track: track.name
              });
            }
          }
        } catch (error) {
          console.error('Error getting additional track-based recommendations:', error);
          continue;
        }
      }
    }

    // Shuffle and return the requested number of recommendations
    return this.shuffleArray(recommendations)
      .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
      .slice(0, limit);
  }

  // Add method to get user's existing tracks
  private async getUserExistingTracks(): Promise<Set<string>> {
    const existingTracks = new Set<string>();
    try {
      // Get user's playlists
      const playlists = await this.makeRequest<{ items: SpotifyPlaylist[] }>('/me/playlists?limit=50');

      // Get tracks from each playlist
      for (const playlist of playlists.items) {
        const tracks = await this.makeRequest<{ items: { track: SpotifyTrack }[] }>(
          `/playlists/${playlist.id}/tracks?limit=100`
        );
        tracks.items.forEach(item => existingTracks.add(item.track.id));
      }

      // Get user's saved tracks
      const savedTracks = await this.makeRequest<{ items: { track: SpotifyTrack }[] }>(
        '/me/tracks?limit=50'
      );
      savedTracks.items.forEach(item => existingTracks.add(item.track.id));

      console.log(`Found ${existingTracks.size} existing tracks`);
      return existingTracks;
    } catch (error) {
      console.error('Error getting user existing tracks:', error);
      return new Set();
    }
  }

  // Add helper function for shuffling arrays
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Add artist-based recommendations function
  private async getArtistBasedRecommendations(userTopArtists: SpotifyArtist[], limit: number = 20): Promise<SpotifyTrack[]> {
    const recommendations: SpotifyTrack[] = [];
    const seenTracks = new Set<string>();
    const existingTracks = await this.getUserExistingTracks();

    // Calculate limits for the 20/80 split
    const topArtistsLimit = Math.ceil(limit * 0.2); // 20% from top artists
    const similarArtistsLimit = limit - topArtistsLimit; // 80% from similar artists

    // Shuffle top artists to get different ones each time
    const seedArtists = this.shuffleArray(userTopArtists).slice(0, 5);
    console.log('Using seed artists:', seedArtists.map(a => a.name));

    // First, get recommendations from top artists (20%)
    for (const artist of seedArtists) {
      try {
        const topTracks = await this.makeRequest<{ tracks: SpotifyTrack[] }>(
          `/artists/${artist.id}/top-tracks?market=${await this.getUserMarket()}`
        );

        console.log(`Getting top tracks for ${artist.name}:`, topTracks.tracks.length);

        // Shuffle and take a random subset of tracks
        const shuffledTracks = this.shuffleArray(topTracks.tracks);

        // Add tracks from the original artist
        for (const track of shuffledTracks) {
          if (recommendations.length >= topArtistsLimit) break;

          if (!seenTracks.has(track.id) && !existingTracks.has(track.id)) {
            seenTracks.add(track.id);
            recommendations.push({
              ...track,
              similarity_score: 1,
              source_artist: artist.name
            });
          }
        }
      } catch (error) {
        console.error(`Error getting recommendations for artist ${artist.name}:`, error);
        continue;
      }
    }

    // Then, get recommendations from similar artists (80%)
    const similarArtistsRecommendations: SpotifyTrack[] = [];
    for (const artist of seedArtists) {
      try {
        const similarArtists = await this.getLastfmSimilarArtists(artist.name, 5); // Increased to 5 for more variety
        console.log(`Found ${similarArtists.length} similar artists for ${artist.name}`);

        // Shuffle similar artists to get different ones each time
        const shuffledSimilarArtists = this.shuffleArray(similarArtists);

        for (const similarArtist of shuffledSimilarArtists) {
          if (similarArtistsRecommendations.length >= similarArtistsLimit) break;

          const spotifyArtist = await this.searchArtists(similarArtist.name, 1);
          if (!spotifyArtist[0]) continue;

          const similarTopTracks = await this.makeRequest<{ tracks: SpotifyTrack[] }>(
            `/artists/${spotifyArtist[0].id}/top-tracks?market=${await this.getUserMarket()}`
          );

          console.log(`Getting top tracks for similar artist ${similarArtist.name}:`, similarTopTracks.tracks.length);

          // Shuffle and take a random subset of tracks
          const shuffledSimilarTracks = this.shuffleArray(similarTopTracks.tracks);

          for (const track of shuffledSimilarTracks) {
            if (similarArtistsRecommendations.length >= similarArtistsLimit) break;

            if (!seenTracks.has(track.id) && !existingTracks.has(track.id)) {
              seenTracks.add(track.id);
              similarArtistsRecommendations.push({
                ...track,
                similarity_score: similarArtist.match,
                source_artist: artist.name
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error getting similar artist recommendations for ${artist.name}:`, error);
        continue;
      }
    }

    // Combine and shuffle all recommendations
    const allRecommendations = [...recommendations, ...similarArtistsRecommendations];
    return this.shuffleArray(allRecommendations)
      .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
      .slice(0, limit);
  }

  // Add combined recommendations function
  private async getCombinedRecommendations(limit: number = 20): Promise<SpotifyTrack[]> {
    const [topTracks, topArtists] = await Promise.all([
      this.getUserTopTracks('short_term', 10),
      this.getUserTopArtists('short_term', 10)
    ]);

    console.log('Getting combined recommendations with:', {
      topTracks: topTracks.map(t => t.name),
      topArtists: topArtists.map(a => a.name)
    });

    // Request more recommendations than needed to account for duplicates
    const [trackBased, artistBased] = await Promise.all([
      this.getTrackBasedRecommendations(this.shuffleArray(topTracks), limit),
      this.getArtistBasedRecommendations(this.shuffleArray(topArtists), limit)
    ]);

    // Combine and deduplicate recommendations
    const allRecommendations = [...trackBased, ...artistBased];
    const uniqueRecommendations = Array.from(
      new Map(allRecommendations.map(track => [track.id, track])).values()
    );

    // If we don't have enough unique recommendations, try to get more
    if (uniqueRecommendations.length < limit) {
      const remainingLimit = limit - uniqueRecommendations.length;
      const additionalRecommendations = await this.getTrackBasedRecommendations(
        this.shuffleArray(topTracks),
        remainingLimit * 2 // Request more to account for potential duplicates
      );

      // Add new unique recommendations
      for (const track of additionalRecommendations) {
        if (uniqueRecommendations.length >= limit) break;
        if (!uniqueRecommendations.some(t => t.id === track.id)) {
          uniqueRecommendations.push(track);
        }
      }
    }

    // Shuffle and sort by similarity score
    return this.shuffleArray(uniqueRecommendations)
      .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
      .slice(0, limit);
  }

  // Add genre-based recommendations function
  private async getGenreBasedRecommendations(genres: string[], limit: number = 20): Promise<SpotifyTrack[]> {
    try {
      const existingTracks = await this.getUserExistingTracks();
      const recommendations: SpotifyTrack[] = [];
      const seenTracks = new Set<string>();

      // Get top tracks for each genre
      for (const genre of genres) {
        try {
          // Search for top tracks in this genre
          const market = await this.getUserMarket();
          const response = await this.makeRequest<{ tracks: { items: SpotifyTrack[] } }>(
            `/search?q=genre:${encodeURIComponent(genre)}&type=track&limit=50&market=${market}`
          );

          const tracks = response.tracks.items;
          console.log(`Found ${tracks.length} tracks for genre: ${genre}`);

          // Shuffle and add tracks that aren't in user's playlists
          const shuffledTracks = this.shuffleArray(tracks);
          for (const track of shuffledTracks) {
            if (recommendations.length >= limit) break;

            if (!seenTracks.has(track.id) && !existingTracks.has(track.id)) {
              seenTracks.add(track.id);
              recommendations.push({
                ...track,
                similarity_score: 1,
                source_genre: genre
              });
            }
          }
        } catch (error) {
          console.error(`Error getting recommendations for genre ${genre}:`, error);
          continue;
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error in genre-based recommendations:', error);
      throw error;
    }
  }

  async generateRecommendations(params: {
    genres?: string[];
    artists?: SpotifyArtist[];
    tracks?: SpotifyTrack[];
    mood?: MoodPreset;
    limit?: number;
    source?: string;
  }): Promise<SpotifyTrack[]> {
    const { genres = [], artists = [], tracks = [], mood, limit = 20, source } = params;

    try {
      let recommendations: SpotifyTrack[] = [];

      // If we have genres, try to get recommendations based on source first
      if (genres.length > 0) {
        if (source) {
          if (source.includes('artists')) {
            console.log('Using artist-based recommendations with genres');
            recommendations = await this.getArtistBasedRecommendations(artists, limit);
          } else if (source.includes('tracks')) {
            console.log('Using track-based recommendations with genres');
            recommendations = await this.getTrackBasedRecommendations(tracks, limit);
          } else if (source === 'recent_playlists') {
            console.log('Using track-based recommendations for playlist with genres');
            recommendations = await this.getTrackBasedRecommendations(tracks, limit);
          }
        }

        // If no recommendations found or if we have genres, get genre-based recommendations
        if (recommendations.length === 0) {
          console.log('No recommendations found with source, falling back to genre-based recommendations');
          recommendations = await this.getGenreBasedRecommendations(genres, limit);
        }
      } else {
        // If no genres specified, use source-based recommendations
        if (source) {
          if (source.includes('artists')) {
            console.log('Using artist-based recommendations for source:', source);
            recommendations = await this.getArtistBasedRecommendations(artists, limit);
          } else if (source.includes('tracks')) {
            console.log('Using track-based recommendations for source:', source);
            recommendations = await this.getTrackBasedRecommendations(tracks, limit);
          } else if (source === 'recent_playlists') {
            console.log('Using track-based recommendations for playlist source');
            recommendations = await this.getTrackBasedRecommendations(tracks, limit);
          }
        } else {
          // If no source specified, use combined recommendations
          console.log('Using combined recommendations');
          recommendations = await this.getCombinedRecommendations(limit);
        }
      }

      // If we still have no recommendations and have genres, use genre-based recommendations
      if (recommendations.length === 0 && genres.length > 0) {
        console.log('No recommendations found, using genre-based recommendations');
        recommendations = await this.getGenreBasedRecommendations(genres, limit);
      }

      console.log(`Generated ${recommendations.length} recommendations`);
      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }
}

export const spotifyApi = new SpotifyApiService();