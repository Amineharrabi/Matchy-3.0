import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSpotify } from '../../hooks/useSpotify';
import { spotifyApi } from '../../services/spotifyApi';
import { newsApi } from '../../services/newsApi';
import { TrackCard } from '../../components/TrackCard';
import { GenreSelector } from '../../components/GenreSelector';
import { SpotifyTrack, SpotifyArtist, MusicNews, GeneratedPlaylist } from '../../types/spotify';
import { dataStorage } from '../../services/dataStorage';
import { MOOD_PRESETS } from '../../constants/genres';
import { Music, TrendingUp, Sparkles, Plus, ExternalLink } from 'lucide-react-native';

export default function HomeScreen() {
  const { user, isLoggedIn } = useSpotify();
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [musicNews, setMusicNews] = useState<MusicNews[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<keyof typeof MOOD_PRESETS | null>(null);
  const [recommendations, setRecommendations] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const [tracks, artists, news] = await Promise.all([
        spotifyApi.getUserTopTracks('medium_term', 10),
        spotifyApi.getUserTopArtists('medium_term', 5),
        newsApi.getMusicNews(),
      ]);

      setTopTracks(tracks);
      setTopArtists(artists);
      setMusicNews(news.slice(0, 3));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre].slice(0, 5)
    );
  };

  const generateRecommendations = async () => {
    if (selectedGenres.length === 0) {
      Alert.alert('Select Genres', 'Please select at least one genre to get recommendations.');
      return;
    }

    setIsLoading(true);
    try {
      const topArtistIds = topArtists.slice(0, 2).map(artist => artist.id);
      const topTrackIds = topTracks.slice(0, 2).map(track => track.id);

      const seedParams = {
        seed_genres: selectedGenres.slice(0, 2),
        seed_artists: topArtistIds.slice(0, 2),
        seed_tracks: topTrackIds.slice(0, 1),
        limit: 20,
        ...(selectedMood ? MOOD_PRESETS[selectedMood] : {}),
      };

      const recommendedTracks = await spotifyApi.getRecommendations(seedParams);
      setRecommendations(recommendedTracks);

      // Save to history
      const playlist: GeneratedPlaylist = {
        id: Date.now().toString(),
        name: `Recommendations - ${selectedGenres.join(', ')}`,
        description: `Generated based on ${selectedGenres.join(', ')}${selectedMood ? ` with ${selectedMood} mood` : ''}`,
        tracks: recommendedTracks,
        genres: selectedGenres,
        createdAt: new Date().toISOString(),
        mood: selectedMood || undefined,
      };

      await dataStorage.savePlaylistToHistory(playlist);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      Alert.alert('Error', 'Failed to generate recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createSpotifyPlaylist = async () => {
    if (recommendations.length === 0) {
      Alert.alert('No Recommendations', 'Generate recommendations first to create a playlist.');
      return;
    }

    try {
      const playlistName = `SoundScope - ${selectedGenres.join(', ')}`;
      const description = `AI-generated playlist based on ${selectedGenres.join(', ')} | Created with SoundScope`;
      
      const playlist = await spotifyApi.createPlaylist(playlistName, description, false);
      
      if (playlist) {
        const trackUris = recommendations.map(track => `spotify:track:${track.id}`);
        const success = await spotifyApi.addTracksToPlaylist(playlist.id, trackUris);
        
        if (success) {
          Alert.alert(
            'Playlist Created!', 
            `"${playlistName}" has been added to your Spotify account.`,
            [
              { text: 'OK', style: 'default' }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Failed to create playlist:', error);
      Alert.alert('Error', 'Failed to create playlist. Please try again.');
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to access your music data.</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1DB954" />}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.display_name || 'Music Lover'}</Text>
          </View>

          {/* Music News */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp color="#FF6B35" size={24} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Music News</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {musicNews.map((news) => (
                <TouchableOpacity key={news.id} style={styles.newsCard}>
                  <View style={styles.newsContent}>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {news.title}
                    </Text>
                    <Text style={styles.newsSource}>{news.source}</Text>
                  </View>
                  <ExternalLink color="#666" size={16} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Top Tracks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Music color="#1DB954" size={24} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Your Top Tracks</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topTracks.map((track) => (
                <TrackCard key={track.id} track={track} size="small" />
              ))}
            </ScrollView>
          </View>

          {/* Recommendation Engine */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles color="#9B59B6" size={24} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Generate Recommendations</Text>
            </View>
            
            <GenreSelector
              selectedGenres={selectedGenres}
              onGenreToggle={handleGenreToggle}
              maxSelection={5}
            />

            {/* Mood Selection */}
            <View style={styles.moodSection}>
              <Text style={styles.moodTitle}>Select Mood (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Object.keys(MOOD_PRESETS).map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    onPress={() => setSelectedMood(selectedMood === mood ? null : mood as keyof typeof MOOD_PRESETS)}
                    style={[
                      styles.moodChip,
                      selectedMood === mood && styles.selectedMoodChip
                    ]}
                  >
                    <Text style={[
                      styles.moodText,
                      selectedMood === mood && styles.selectedMoodText
                    ]}>
                      {mood}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity 
              onPress={generateRecommendations}
              disabled={isLoading || selectedGenres.length === 0}
              style={[styles.generateButton, (isLoading || selectedGenres.length === 0) && styles.disabledButton]}
            >
              <LinearGradient
                colors={['#1DB954', '#1ed760']}
                style={styles.gradientButton}
              >
                <Sparkles color="#FFFFFF" size={20} strokeWidth={2} />
                <Text style={styles.generateButtonText}>
                  {isLoading ? 'Generating...' : 'Generate Recommendations'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Music color="#FF6B35" size={24} strokeWidth={2} />
                <Text style={styles.sectionTitle}>Recommended for You</Text>
                <TouchableOpacity onPress={createSpotifyPlaylist} style={styles.createPlaylistButton}>
                  <Plus color="#1DB954" size={20} strokeWidth={2} />
                  <Text style={styles.createPlaylistText}>Create Playlist</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recommendations.map((track) => (
                  <TrackCard key={track.id} track={track} size="medium" />
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    color: '#B3B3B3',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  newsCard: {
    width: 280,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    marginLeft: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#333',
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    lineHeight: 22,
    marginBottom: 8,
  },
  newsSource: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  moodSection: {
    marginBottom: 20,
  },
  moodTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  moodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: 'transparent',
    marginRight: 8,
    marginLeft: 4,
  },
  selectedMoodChip: {
    backgroundColor: '#9B59B6',
    borderColor: '#9B59B6',
  },
  moodText: {
    color: '#B3B3B3',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  selectedMoodText: {
    color: '#FFFFFF',
  },
  generateButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
  },
  createPlaylistText: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  errorText: {
    color: '#FF6B35',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 50,
  },
});