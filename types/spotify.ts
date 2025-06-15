export interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  images?: SpotifyImage[];
  product?: string;
  country?: string;
  isDeveloper?: boolean;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: SpotifyAlbum;
  duration_ms: number;
  external_urls: { spotify: string };
  preview_url: string | null;
  popularity: number;
  is_playable?: boolean; // Some tracks may not have this property, so we make it optional
  available_markets?: string[];
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{ url: string; height: number; width: number }>;
  genres: string[];
  followers: { total: number };
  popularity: number;
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  images: Array<{ url: string; height: number; width: number }>;
  release_date: string;
  total_tracks: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string; height: number; width: number }>;
  tracks: { total: number };
  owner: { id: string; display_name: string };
  public: boolean;
  collaborative: boolean;
  external_urls: { spotify: string };
}

export interface RecommendationSeed {
  seed_artists?: string[];
  seed_genres?: string[];
  seed_tracks?: string[];
  limit?: number;
  market?: string;
  min_acousticness?: number;
  max_acousticness?: number;
  target_acousticness?: number;
  min_danceability?: number;
  max_danceability?: number;
  target_danceability?: number;
  min_duration_ms?: number;
  max_duration_ms?: number;
  target_duration_ms?: number;
  min_energy?: number;
  max_energy?: number;
  target_energy?: number;
  min_instrumentalness?: number;
  max_instrumentalness?: number;
  target_instrumentalness?: number;
  min_key?: number;
  max_key?: number;
  target_key?: number;
  min_liveness?: number;
  max_liveness?: number;
  target_liveness?: number;
  min_loudness?: number;
  max_loudness?: number;
  target_loudness?: number;
  min_mode?: number;
  max_mode?: number;
  target_mode?: number;
  min_popularity?: number;
  max_popularity?: number;
  target_popularity?: number;
  min_speechiness?: number;
  max_speechiness?: number;
  target_speechiness?: number;
  min_tempo?: number;
  max_tempo?: number;
  target_tempo?: number;
  min_time_signature?: number;
  max_time_signature?: number;
  target_time_signature?: number;
  min_valence?: number;
  max_valence?: number;
  target_valence?: number;
}

export interface GeneratedPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: SpotifyTrack[];
  genres: string[];
  createdAt: string;
  mood?: string;
}

export interface MusicNews {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
}

export interface UserAnalytics {
  totalListeningTime: number;
  topGenres: Array<{ genre: string; count: number }>;
  topArtists: Array<{ artist: SpotifyArtist; playCount: number }>;
  topTracks: Array<{ track: SpotifyTrack; playCount: number }>;
  recommendationsGenerated: number;
  playlistsCreated: number;
  monthlyStats: Array<{
    month: string;
    listeningTime: number;
    tracksPlayed: number;
  }>;
}

export interface SpotifyImage {
  url: string;
  height?: number | null;
  width?: number | null;
}

export interface MoodPreset {
  seed_genres?: string[];
  target_valence?: number;
  target_energy?: number;
  target_danceability?: number;
  target_acousticness?: number;
  target_tempo?: number;
}