import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSpotify } from '../../hooks/useSpotify';
import { spotifyApi } from '../../services/spotifyApi';
import { dataStorage } from '../../services/dataStorage';
import { TrackCard } from '../../components/TrackCard';
import { SpotifyTrack, SpotifyArtist, UserAnalytics } from '../../types/spotify';
import { BarChart3, TrendingUp, Music, Users, Clock, RefreshCw } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { isLoggedIn } = useSpotify();
  const [topTracks, setTopTracks] = useState<{
    short: SpotifyTrack[];
    medium: SpotifyTrack[];
    long: SpotifyTrack[];
  }>({ short: [], medium: [], long: [] });
  const [topArtists, setTopArtists] = useState<{
    short: SpotifyArtist[];
    medium: SpotifyArtist[];
    long: SpotifyArtist[];
  }>({ short: [], medium: [], long: [] });
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'short' | 'medium' | 'long'>('medium');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      loadAnalyticsData();
    }
  }, [isLoggedIn]);

  const loadAnalyticsData = async () => {
    try {
      setIsRefreshing(true);
      
      // Load top tracks and artists for all time ranges
      const [
        shortTermTracks,
        mediumTermTracks,
        longTermTracks,
        shortTermArtists,
        mediumTermArtists,
        longTermArtists,
      ] = await Promise.all([
        spotifyApi.getUserTopTracks('short_term', 50),
        spotifyApi.getUserTopTracks('medium_term', 50),
        spotifyApi.getUserTopTracks('long_term', 50),
        spotifyApi.getUserTopArtists('short_term', 50),
        spotifyApi.getUserTopArtists('medium_term', 50),
        spotifyApi.getUserTopArtists('long_term', 50),
      ]);

      setTopTracks({
        short: shortTermTracks,
        medium: mediumTermTracks,
        long: longTermTracks,
      });

      setTopArtists({
        short: shortTermArtists,
        medium: mediumTermArtists,
        long: longTermArtists,
      });

      // Generate analytics data
      const analyticsData = await generateAnalytics(mediumTermTracks, mediumTermArtists);
      setAnalytics(analyticsData);
      
      // Save analytics to storage
      await dataStorage.saveAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateAnalytics = async (tracks: SpotifyTrack[], artists: SpotifyArtist[]): Promise<UserAnalytics> => {
    // Extract genres from artists
    const genreCounts: { [key: string]: number } = {};
    artists.forEach(artist => {
      artist.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));

    // Calculate total listening time (estimated)
    const totalDuration = tracks.reduce((sum, track) => sum + track.duration_ms, 0);
    const totalListeningTime = Math.floor(totalDuration / 1000 / 60); // in minutes

    // Get history data
    const history = await dataStorage.getPlaylistHistory();

    // Generate monthly stats (mock data for demo)
    const monthlyStats = [
      { month: 'Jan 2024', listeningTime: 1200, tracksPlayed: 180 },
      { month: 'Feb 2024', listeningTime: 1450, tracksPlayed: 220 },
      { month: 'Mar 2024', listeningTime: 1100, tracksPlayed: 165 },
      { month: 'Apr 2024', listeningTime: 1600, tracksPlayed: 240 },
      { month: 'May 2024', listeningTime: 1350, tracksPlayed: 200 },
      { month: 'Jun 2024', listeningTime: 1800, tracksPlayed: 270 },
    ];

    return {
      totalListeningTime,
      topGenres,
      topArtists: artists.slice(0, 10).map(artist => ({ artist, playCount: Math.floor(Math.random() * 100) + 20 })),
      topTracks: tracks.slice(0, 10).map(track => ({ track, playCount: Math.floor(Math.random() * 50) + 10 })),
      recommendationsGenerated: history.length,
      playlistsCreated: history.length,
      monthlyStats,
    };
  };

  const timeRangeLabels = {
    short: 'Last 4 weeks',
    medium: 'Last 6 months',
    long: 'All time',
  };

  const StatCard = ({ icon, title, value, subtitle, color = '#1DB954' }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        {icon}
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to access your analytics.</Text>
      </View>
    );
  }

  const currentTracks = topTracks[selectedTimeRange];
  const currentArtists = topArtists[selectedTimeRange];

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <BarChart3 color="#9B59B6" size={32} strokeWidth={2} />
            <Text style={styles.title}>Your Analytics</Text>
          </View>
          <TouchableOpacity onPress={loadAnalyticsData} disabled={isRefreshing} style={styles.refreshButton}>
            <RefreshCw 
              color="#1DB954" 
              size={20} 
              strokeWidth={2} 
              style={[isRefreshing && styles.spinning]} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Overview Stats */}
          {analytics && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  icon={<Clock color="#1DB954" size={20} strokeWidth={2} />}
                  title="Listening Time"
                  value={`${Math.floor(analytics.totalListeningTime / 60)}h ${analytics.totalListeningTime % 60}m`}
                  subtitle="Total music listened"
                  color="#1DB954"
                />
                <StatCard
                  icon={<Music color="#FF6B35" size={20} strokeWidth={2} />}
                  title="Recommendations"
                  value={analytics.recommendationsGenerated.toString()}
                  subtitle="Playlists generated"
                  color="#FF6B35"
                />
                <StatCard
                  icon={<Users color="#9B59B6" size={20} strokeWidth={2} />}
                  title="Artists"
                  value={analytics.topArtists.length.toString()}
                  subtitle="Top artists"
                  color="#9B59B6"
                />
                <StatCard
                  icon={<TrendingUp color="#1ABC9C" size={20} strokeWidth={2} />}
                  title="Top Genres"
                  value={analytics.topGenres.length.toString()}
                  subtitle="Different genres"
                  color="#1ABC9C"
                />
              </View>
            </View>
          )}

          {/* Top Genres */}
          {analytics && analytics.topGenres.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Genres</Text>
              <View style={styles.genresContainer}>
                {analytics.topGenres.slice(0, 8).map((item, index) => (
                  <View key={item.genre} style={styles.genreItem}>
                    <Text style={styles.genreRank}>#{index + 1}</Text>
                    <Text style={styles.genreName}>{item.genre}</Text>
                    <Text style={styles.genreCount}>{item.count} artists</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Time Range Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Listening History</Text>
            <View style={styles.timeRangeSelector}>
              {Object.entries(timeRangeLabels).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSelectedTimeRange(key as any)}
                  style={[
                    styles.timeRangeButton,
                    selectedTimeRange === key && styles.activeTimeRangeButton
                  ]}
                >
                  <Text style={[
                    styles.timeRangeText,
                    selectedTimeRange === key && styles.activeTimeRangeText
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Top Tracks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Tracks</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {currentTracks.slice(0, 10).map((track) => (
                <TrackCard key={track.id} track={track} size="small" />
              ))}
            </ScrollView>
          </View>

          {/* Top Artists */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Artists</Text>
            <View style={styles.artistsList}>
              {currentArtists.slice(0, 10).map((artist, index) => (
                <View key={artist.id} style={styles.artistItem}>
                  <Text style={styles.artistRank}>#{index + 1}</Text>
                  <View style={styles.artistInfo}>
                    <Text style={styles.artistName}>{artist.name}</Text>
                    <Text style={styles.artistGenres}>
                      {artist.genres.slice(0, 2).join(', ')}
                    </Text>
                  </View>
                  <Text style={styles.artistPopularity}>
                    {artist.popularity}% popularity
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Monthly Stats */}
          {analytics && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Trends</Text>
              <View style={styles.monthlyStats}>
                {analytics.monthlyStats.map((stat) => (
                  <View key={stat.month} style={styles.monthlyStatItem}>
                    <Text style={styles.monthlyStatMonth}>{stat.month}</Text>
                    <Text style={styles.monthlyStatTime}>
                      {Math.floor(stat.listeningTime / 60)}h {stat.listeningTime % 60}m
                    </Text>
                    <Text style={styles.monthlyStatTracks}>
                      {stat.tracksPlayed} tracks
                    </Text>
                  </View>
                ))}
              </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinning: {
    // Add rotation animation here if needed
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1DB954',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statTitle: {
    color: '#B3B3B3',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statSubtitle: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreItem: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  genreRank: {
    color: '#1DB954',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  genreName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'capitalize',
    textAlign: 'center',
    marginBottom: 4,
  },
  genreCount: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTimeRangeButton: {
    backgroundColor: '#1DB954',
  },
  timeRangeText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  activeTimeRangeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  artistsList: {
    gap: 12,
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  artistRank: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    width: 40,
  },
  artistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  artistName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  artistGenres: {
    color: '#B3B3B3',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  artistPopularity: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  monthlyStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  monthlyStatItem: {
    flex: 1,
    minWidth: (width - 52) / 3,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  monthlyStatMonth: {
    color: '#B3B3B3',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  monthlyStatTime: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  monthlyStatTracks: {
    color: '#666',
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    color: '#FF6B35',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 50,
  },
});