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
  Linking,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Image,
  ImageStyle,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSpotify } from '../../hooks/useSpotify';
import { spotifyApi } from '../../services/spotifyApi';
import { newsApi } from '../../services/newsApi';
import { TrackCard } from '../../components/TrackCard';
import { GenreSelector } from '../../components/GenreSelector';
import { SpotifyTrack, SpotifyArtist, MusicNews, SpotifyPlaylist, GeneratedPlaylist } from '../../types/spotify';
import { dataStorage } from '../../services/dataStorage';
import { MOOD_PRESETS } from '../../constants/genres';
import { Music, TrendingUp, Sparkles, Plus, ExternalLink } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';


interface Styles {
  container: ViewStyle;
  safeArea: ViewStyle;
  scrollView: ViewStyle;
  header: ViewStyle;
  headerContent: ViewStyle;
  headerLeft: ViewStyle;
  welcomeText: TextStyle;
  userName: TextStyle;
  profileImage: ImageStyle;
  section: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
  sectionSubtitle: TextStyle;
  newsCard: ViewStyle;
  newsContent: ViewStyle;
  newsTitle: TextStyle;
  newsSource: TextStyle;
  moodSection: ViewStyle;
  genreSection: ViewStyle;
  moodTitle: TextStyle;
  moodChip: ViewStyle;
  selectedMoodChip: ViewStyle;
  moodText: TextStyle;
  selectedMoodText: TextStyle;
  generateButton: ViewStyle;
  disabledButton: ViewStyle;
  gradientButton: ViewStyle;
  generateButtonText: TextStyle;
  createPlaylistButton: ViewStyle;
  createPlaylistText: TextStyle;
  errorText: TextStyle;
  sourceSelector: ViewStyle;
  sourceScrollView: ViewStyle;
  sourceContentContainer: ViewStyle;
  chip: ViewStyle;
  selectedChip: ViewStyle;
  chipText: TextStyle;
  selectedChipText: TextStyle;
  sourceChip: ViewStyle;
  selectedSourceChip: ViewStyle;
  sourceText: TextStyle;
  selectedSourceText: TextStyle;
  playlistSelector: ViewStyle;
  playlistCard: ViewStyle;
  playlistCardSelected: ViewStyle;
  playlistContent: ViewStyle;
  playlistImage: ImageStyle;
  playlistTitle: TextStyle;
  playlistTitleSelected: TextStyle;
  playlistInfo: TextStyle;
  playlistInfoSelected: TextStyle;
  songCountContainer: ViewStyle;
  songCountLabel: TextStyle;
  songCountInput: TextStyle;
  songCountControls: ViewStyle;
  songCountButton: ViewStyle;
  songCountButtonText: TextStyle;
}

type RecommendationMode = 'source' | 'genres' | null;
type RecSource = 'recent_playlists' | 'recent_tracks' | 'alltime_tracks' | 'recent_artists' | 'alltime_artists' | '';

export default function HomeScreen() {
  const { user, isLoggedIn } = useSpotify();
  const [topTracksShort, setTopTracksShort] = useState<SpotifyTrack[]>([]);
  const [topTracksLong, setTopTracksLong] = useState<SpotifyTrack[]>([]);
  const [topArtistsShort, setTopArtistsShort] = useState<SpotifyArtist[]>([]);
  const [topArtistsLong, setTopArtistsLong] = useState<SpotifyArtist[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [musicNews, setMusicNews] = useState<MusicNews[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<keyof typeof MOOD_PRESETS | null>(null);
  const [recommendations, setRecommendations] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recSource, setRecSource] = useState<RecSource>('recent_tracks');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [recommendationMode, setRecommendationMode] = useState<RecommendationMode>(null);
  const [songCount, setSongCount] = useState<number>(10);
  const { colors } = useAppTheme();

  // Add useEffect to monitor recommendations state
  useEffect(() => {
    console.log('Recommendations state updated:', recommendations.length);
    if (recommendations.length > 0) {
      console.log('First recommendation:', recommendations[0].name);
    }
  }, [recommendations]);

  const styles = StyleSheet.create<Styles>({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
    },
    headerLeft: {
      flex: 1,
    },
    welcomeText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    userName: {
      fontSize: 28,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
      marginTop: 4,
      color: colors.text,
    },
    profileImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: colors.primary,
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
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
      flex: 1,
      color: colors.text,
    },
    sectionSubtitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    newsCard: {
      width: 280,
      borderRadius: 12,
      padding: 16,
      marginRight: 12,
      marginLeft: 20,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    newsContent: {
      flex: 1,
    },
    newsTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      lineHeight: 22,
      marginBottom: 8,
      color: colors.text,
    },
    newsSource: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    moodSection: {
      marginTop: 24,
      marginBottom: 20,
    },
    genreSection: {
      marginTop: 24,
      marginBottom: 20,
    },
    moodTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      marginBottom: 12,
      paddingHorizontal: 4,
      marginLeft: 3,
      color: colors.text,
    },
    moodChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: 'transparent',
      marginRight: 8,
      marginLeft: 4,
      borderColor: colors.border,
    },
    selectedMoodChip: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    moodText: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
      textTransform: 'capitalize',
      color: colors.text,
    },
    selectedMoodText: {
      color: colors.textLight,
      fontWeight: 'bold',
    },
    generateButton: {
      borderRadius: 25,
      overflow: 'hidden',
      marginTop: 24,
      marginHorizontal: 20,
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
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
      color: colors.textLight,
    },
    createPlaylistButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.background,
    },
    createPlaylistText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    errorText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginTop: 50,
      color: colors.error,
    },
    sourceSelector: {
      marginBottom: 16,
    },
    sourceScrollView: {
      flexGrow: 0,
      marginBottom: 16,
    },
    sourceContentContainer: {
      paddingHorizontal: 20,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
      marginRight: 8,
    },
    selectedChip: {
      backgroundColor: colors.primary,
    },
    chipText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: 'Inter-Medium',
    },
    selectedChipText: {
      color: colors.textLight,
      fontWeight: 'bold',
    },
    sourceChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      marginRight: 8,
    },
    selectedSourceChip: {
      backgroundColor: colors.primary,
    },
    sourceText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    selectedSourceText: {
      color: colors.textLight,
      fontWeight: 'bold',
    },
    playlistSelector: {
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    playlistCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      marginBottom: 8,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    playlistCardSelected: {
      backgroundColor: `${colors.primary}20`,
      borderColor: colors.primary,
    },
    playlistContent: {
      flex: 1,
      justifyContent: 'center',
      minWidth: 0, // Allows text truncation to work properly
    },
    playlistImage: {
      width: 56,
      height: 56,
      borderRadius: 4,
      marginRight: 8,
    },
    playlistTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
      flexShrink: 1, // Allows text to shrink if needed
    },
    playlistTitleSelected: {
      color: colors.primary,
    },
    playlistInfo: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      flexShrink: 1, // Allows text to shrink if needed
    },
    playlistInfoSelected: {
      color: colors.primary,
      opacity: 0.8,
    },
    songCountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 20,
      marginTop: 24,
      marginBottom: 16,
    },
    songCountLabel: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    songCountInput: {
      width: 50,
      height: 40,
      textAlign: 'center',
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    songCountControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    songCountButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    songCountButtonText: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.textLight,
    },
  });

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const [
        tracksShort,
        tracksLong,
        artistsShort,
        artistsLong,
        playlists,
        news
      ] = await Promise.all([
        spotifyApi.getUserTopTracks('short_term', 5),
        spotifyApi.getUserTopTracks('long_term', 5),
        spotifyApi.getUserTopArtists('short_term', 5),
        spotifyApi.getUserTopArtists('long_term', 5),
        spotifyApi.getUserPlaylists(),
        newsApi.getMusicNews(),
      ]);

      setTopTracksShort(tracksShort);
      setTopTracksLong(tracksLong);
      setTopArtistsShort(artistsShort);
      setTopArtistsLong(artistsLong);
      setUserPlaylists(playlists);
      setMusicNews(news);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      if (error?.message?.includes('401')) {
        Alert.alert('Session Expired', 'Please log in again');
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSourceSelect = (source: RecSource) => {
    if (recommendationMode === 'genres' && (selectedGenres.length > 0 || selectedMood)) {
      Alert.alert(
        'Switch to Source-based Recommendations?',
        'This will clear your current genre and mood selections. Do you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch',
            onPress: () => {
              setSelectedGenres([]);
              setSelectedMood(null);
              setRecommendationMode('source');
              setRecSource(source);
              if (source === 'recent_playlists') {
                setSelectedPlaylist(null);
              }
            }
          }
        ]
      );
      return;
    }

    setRecommendationMode('source');
    setRecSource(source);
    if (source === 'recent_playlists') {
      setSelectedPlaylist(null);
    }
  };

  const handleGenreToggle = (genre: string) => {
    if (recommendationMode === 'source' && recSource) {
      Alert.alert(
        'Switch to Genre-based Recommendations?',
        'This will clear your current source selection. Do you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch',
            onPress: () => {
              setRecSource('');
              setSelectedPlaylist(null);
              setRecommendationMode('genres');
              setSelectedGenres([genre]);
            }
          }
        ]
      );
      return;
    }

    setRecommendationMode('genres');
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre].slice(0, 5)
    );
  };

  const handleSongCountChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num)) {
      if (num > 30) setSongCount(30);
      else if (num < 1) setSongCount(1);
      else setSongCount(num);
    }
  };

  const incrementSongCount = () => {
    setSongCount(prev => Math.min(prev + 1, 30));
  };

  const decrementSongCount = () => {
    setSongCount(prev => Math.max(prev - 1, 1));
  };

  const generateRecommendations = async () => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'Please login to generate recommendations');
      return;
    }

    // Validate based on recommendation mode
    if (recommendationMode === 'source') {
      if (recSource === 'recent_playlists' && !selectedPlaylist) {
        Alert.alert('Error', 'Please select a playlist to generate recommendations from');
        return;
      }
    } else if (recommendationMode === 'genres') {
      if (selectedGenres.length === 0 && !selectedMood) {
        Alert.alert('Error', 'Please select at least one genre or mood');
        return;
      }
    }

    setIsLoading(true);
    try {
      let seedArtists: SpotifyArtist[] = [];
      let seedTracks: SpotifyTrack[] = [];
      let genres = selectedGenres;

      if (recommendationMode === 'source') {
        // Get seed data based on selected source
        switch (recSource) {
          case 'recent_playlists':
            if (selectedPlaylist) {
              const playlistTracks = await spotifyApi.getPlaylistTracks(selectedPlaylist);
              seedTracks = playlistTracks
                .sort(() => 0.5 - Math.random())
                .slice(0, 5);
              console.log('Using selected playlist tracks:', seedTracks.length);
            }
            break;
          case 'recent_tracks':
            seedTracks = topTracksShort;
            break;
          case 'alltime_tracks':
            seedTracks = topTracksLong;
            break;
          case 'recent_artists':
            seedArtists = topArtistsShort;
            break;
          case 'alltime_artists':
            seedArtists = topArtistsLong;
            break;
        }
        // Clear genres and mood when using source-based recommendations
        genres = [];
      }

      // Get mood preset if selected
      const moodPreset = selectedMood ? MOOD_PRESETS[selectedMood] : undefined;
      if (moodPreset?.seed_genres) {
        genres = [...new Set([...genres, ...moodPreset.seed_genres])];
      }

      console.log('Generating recommendations with:', {
        mode: recommendationMode,
        source: recSource,
        seedTracks: seedTracks.length,
        seedArtists: seedArtists.length,
        genres: genres,
        mood: selectedMood,
        moodPreset: moodPreset,
        limit: songCount
      });

      const recommendations = await spotifyApi.generateRecommendations({
        genres: genres,
        artists: seedArtists,
        tracks: seedTracks,
        mood: moodPreset,
        limit: songCount,
        source: recSource || undefined
      });

      console.log('Received recommendations:', recommendations.length);

      // Force a state update with a new array
      setRecommendations([...recommendations]);

      if (recommendations.length > 0) {
        const historyEntry = {
          date: new Date().toISOString(),
          genres: selectedGenres,
          mood: selectedMood || undefined,
          source: recSource,
          playlistId: selectedPlaylist,
          tracks: recommendations
        };
        await dataStorage.appendToHistory('recommendations', historyEntry);
      }

    } catch (error: any) {
      console.error('Failed to generate recommendations:', error);
      const errorMessage = error?.response?.status === 404
        ? 'Unable to generate recommendations. Try selecting different options or refreshing the page.'
        : 'Failed to generate recommendations. Please try again.';
      Alert.alert('Error', errorMessage);
      // Clear recommendations on error
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createPlaylist = async () => {
    if (!recommendations.length) return;

    setIsLoading(true);
    try {
      const moodText = selectedMood ? ` (${selectedMood})` : '';
      const genreText = selectedGenres.length ? ` [${selectedGenres.join(', ')}]` : '';
      const name = `Matchy Mix${moodText}${genreText}`;

      const playlist = await spotifyApi.createPlaylist(name, recommendations);

      if (playlist) {
        // Store the playlist in history
        const historyEntry: GeneratedPlaylist = {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description || '',
          tracks: recommendations,
          genres: selectedGenres,
          createdAt: new Date().toISOString(),
          mood: selectedMood || undefined
        };
        await dataStorage.savePlaylistToHistory(historyEntry);

        Alert.alert(
          'Success!',
          'Playlist created successfully. Would you like to open it in Spotify?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open', onPress: () => Linking.openURL(playlist.external_urls.spotify) }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create playlist');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleExternalLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Failed to open the link');
    }
  };

  const renderRecommendationControls = () => {
    const canGenerate = recSource === 'recent_playlists'
      ? !!selectedPlaylist
      : true;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Sparkles color={colors.primary} size={24} strokeWidth={2} />
          <Text style={styles.sectionTitle}>Generate Recommendations</Text>
        </View>

        {/* Source Selector */}
        <View style={styles.sourceSelector}>
          <Text style={styles.sectionSubtitle}>Select Source:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sourceScrollView}
            contentContainerStyle={styles.sourceContentContainer}
          >
            {[
              { key: 'recent_playlists', label: 'Your Playlists' },
              { key: 'recent_tracks', label: 'Recent Top Tracks' },
              { key: 'alltime_tracks', label: 'All-Time Top Tracks' },
              { key: 'recent_artists', label: 'Recent Top Artists' },
              { key: 'alltime_artists', label: 'All-Time Top Artists' },

            ].map(option => (
              <TouchableOpacity
                key={option.key}
                onPress={() => handleSourceSelect(option.key as RecSource)}
                style={[
                  styles.sourceChip,
                  recSource === option.key && styles.selectedSourceChip
                ]}
              >
                <Text style={[
                  styles.sourceText,
                  recSource === option.key && styles.selectedSourceText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>      {/* Playlist Selector */}
        {recSource === 'recent_playlists' && (
          <View style={styles.playlistSelector}>
            {userPlaylists.map(playlist => (
              <TouchableOpacity
                key={playlist.id}
                style={[
                  styles.playlistCard,
                  selectedPlaylist === playlist.id && styles.playlistCardSelected,
                ]}
                onPress={() => {
                  setSelectedPlaylist(previousId =>
                    previousId === playlist.id ? null : playlist.id
                  );
                }}
              >
                <Image
                  source={{
                    uri: playlist.images?.[0]?.url || 'https://via.placeholder.com/56'
                  }}
                  style={styles.playlistImage}
                />
                <View style={styles.playlistContent}>
                  <Text
                    style={[
                      styles.playlistTitle,
                      selectedPlaylist === playlist.id && styles.playlistTitleSelected
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {playlist.name}
                  </Text>
                  <Text
                    style={[
                      styles.playlistInfo,
                      selectedPlaylist === playlist.id && styles.playlistInfoSelected
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {playlist.tracks.total} tracks • {playlist.owner.display_name || 'Unknown'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Genre Selector */}
        <View style={styles.genreSection}>
          <Text style={styles.sectionSubtitle}>Select Genres (Optional):</Text>
          <GenreSelector
            selectedGenres={selectedGenres}
            onGenresChange={setSelectedGenres}
            maxSelection={5}
          />
        </View>

        {/* Mood Selection */}
        <View style={styles.moodSection}>
          <Text style={styles.sectionSubtitle}>Select Mood (Optional):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.keys(MOOD_PRESETS).map((mood) => (
              <TouchableOpacity
                key={mood}
                onPress={() => setSelectedMood(
                  selectedMood === mood ? null : mood as keyof typeof MOOD_PRESETS
                )}
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

        {/* Song Count Selector */}
        <View style={styles.songCountContainer}>
          <Text style={styles.songCountLabel}>Number of Songs:</Text>
          <View style={styles.songCountControls}>
            <TouchableOpacity
              style={styles.songCountButton}
              onPress={decrementSongCount}
              disabled={songCount <= 1}
            >
              <Text style={styles.songCountButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.songCountInput}
              value={songCount.toString()}
              onChangeText={handleSongCountChange}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TouchableOpacity
              style={styles.songCountButton}
              onPress={incrementSongCount}
              disabled={songCount >= 30}
            >
              <Text style={styles.songCountButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          onPress={generateRecommendations}
          disabled={!canGenerate || isLoading}
          style={[
            styles.generateButton,
            (!canGenerate || isLoading) && styles.disabledButton
          ]}
        >
          <LinearGradient
            colors={[colors.primary, `${colors.primary}80`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Sparkles color={colors.text} size={20} strokeWidth={2} />
                <Text style={styles.generateButtonText}>
                  Generate Recommendations
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={[colors.background, colors.surface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.display_name || 'Music Lover'}
                </Text>
              </View>
              {user?.images && user.images.length > 0 && (
                <Image
                  source={{ uri: user.images[0].url }}
                  style={styles.profileImage}
                />
              )}
            </View>
          </View>

          {/* Music News */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp color={colors.primary} size={24} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Music News</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {musicNews.map((news) => (
                <TouchableOpacity
                  key={news.id}
                  style={styles.newsCard}
                  onPress={() => handleExternalLink(news.url)}
                  activeOpacity={0.7}
                >
                  <View style={styles.newsContent}>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {news.title}
                    </Text>
                    <Text style={styles.newsSource}>{news.source}</Text>
                  </View>
                  <ExternalLink color={colors.textSecondary} size={16} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Recent Tracks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Music color={colors.primary} size={24} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Your recent Tracks</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topTracksShort.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  size="small"
                  onPress={() => Linking.openURL(track.external_urls.spotify)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Recommendation Controls */}
          {renderRecommendationControls()}

          {/* Recommendations Display */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Music color={colors.primary} size={24} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Your Recommendations</Text>
              {recommendations.length > 0 && (
                <TouchableOpacity
                  onPress={createPlaylist}
                  style={styles.createPlaylistButton}
                  disabled={isLoading}
                >
                  <Plus color={colors.primary} size={20} strokeWidth={2} />
                  <Text style={styles.createPlaylistText}>Create Playlist</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {recommendations.length > 0
                ? `Found ${recommendations.length} recommendations`
                : 'No recommendations yet'}
            </Text>
            {recommendations.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
                {recommendations.map((track, index) => {
                  console.log(`Rendering track ${index}:`, track.name);
                  return (
                    <TrackCard
                      key={track.id}
                      track={track}
                      onPress={() => Linking.openURL(track.external_urls.spotify)}
                    />
                  );
                })}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
