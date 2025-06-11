export const MUSIC_GENRES = [
  'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'blues',
  'bossanova', 'brazil', 'breakbeat', 'british', 'chill', 'classical',
  'club', 'country', 'dance', 'dancehall', 'deep-house', 'disco',
  'drum-and-bass', 'dub', 'dubstep', 'edm', 'electronic', 'folk',
  'funk', 'garage', 'gospel', 'groove', 'grunge', 'hip-hop',
  'house', 'indie', 'jazz', 'latin', 'metal', 'pop', 'punk',
  'r-n-b', 'reggae', 'rock', 'soul', 'techno', 'trance'
];

export const MOOD_PRESETS = {
  happy: {
    target_valence: 0.8,
    target_energy: 0.7,
    target_danceability: 0.8,
  },
  sad: {
    target_valence: 0.2,
    target_energy: 0.3,
    target_acousticness: 0.6,
  },
  energetic: {
    target_energy: 0.9,
    target_danceability: 0.8,
    target_tempo: 130,
  },
  chill: {
    target_energy: 0.3,
    target_valence: 0.5,
    target_acousticness: 0.7,
  },
  focus: {
    target_instrumentalness: 0.8,
    target_energy: 0.4,
    target_speechiness: 0.1,
  },
  workout: {
    target_energy: 0.9,
    target_tempo: 140,
    target_danceability: 0.8,
  },
};

export const GENRE_COLORS: { [key: string]: string } = {
  'pop': '#FF6B9D',
  'rock': '#FF8C42',
  'hip-hop': '#6BCF7F',
  'jazz': '#4D96FF',
  'classical': '#9B59B6',
  'electronic': '#1ABC9C',
  'country': '#F39C12',
  'r-n-b': '#E74C3C',
  'indie': '#95A5A6',
  'folk': '#8E44AD',
  'metal': '#34495E',
  'blues': '#3498DB',
  'reggae': '#27AE60',
  'funk': '#F1C40F',
  'disco': '#E67E22',
  'techno': '#16A085',
  'house': '#2ECC71',
  'ambient': '#9B59B6',
  'punk': '#E74C3C',
  'soul': '#D35400',
};