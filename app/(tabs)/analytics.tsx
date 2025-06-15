import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSpotify } from '../../hooks/useSpotify';
import { spotifyApi } from '../../services/spotifyApi';
import { dataStorage } from '../../services/dataStorage';
import { TrackCard } from '../../components/TrackCard';
import { SpotifyTrack, SpotifyArtist, UserAnalytics } from '../../types/spotify';
import { BarChart3, TrendingUp, Music, Users, Clock, RefreshCw } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

const { width } = Dimensions.get('window');

interface Styles {
  container: ViewStyle;
  safeArea: ViewStyle;
  header: ViewStyle;
  titleContainer: ViewStyle;
  title: TextStyle;
  refreshButton: ViewStyle;
  spinning: ViewStyle;
  scrollView: ViewStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  statsGrid: ViewStyle;
  statCard: ViewStyle;
  statHeader: ViewStyle;
  statTitle: TextStyle;
  statValue: TextStyle;
  statSubtitle: TextStyle;
  genresContainer: ViewStyle;
  genreItem: ViewStyle;
  genreRank: TextStyle;
  genreName: TextStyle;
  genreCount: TextStyle;
  timeRangeSelector: ViewStyle;
  timeRangeButton: ViewStyle;
  timeRangeText: TextStyle;
  activeTimeRangeButton: ViewStyle;
  activeTimeRangeText: TextStyle;
  artistsList: ViewStyle;
  artistItem: ViewStyle;
  artistRank: TextStyle;
  artistInfo: ViewStyle;
  artistName: TextStyle;
  artistGenres: TextStyle;
  artistPopularity: TextStyle;
  monthlyStats: ViewStyle;
  monthlyStatItem: ViewStyle;
  monthlyStatMonth: TextStyle;
  monthlyStatTime: TextStyle;
  monthlyStatTracks: TextStyle;
  errorText: TextStyle;
}

export default function AnalyticsScreen() {
  const { isLoggedIn } = useSpotify();
  const { colors } = useAppTheme();
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

  const loadAnalyticsData = async (forceRefresh: boolean = false) => {
    try {
      setIsRefreshing(true);

      // Try to get cached analytics first
      const cachedAnalytics = await dataStorage.getAnalytics(forceRefresh);
      if (cachedAnalytics && !forceRefresh) {
        setAnalytics(cachedAnalytics);
        setIsRefreshing(false);
        return;
      }

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

      // Save analytics to storage with cache
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

    // Calculate monthly stats from history
    const monthlyStats = history.reduce((acc: any[], playlist) => {
      const date = new Date(playlist.created_at);
      const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;

      const existingMonth = acc.find(m => m.month === monthKey);
      if (existingMonth) {
        existingMonth.listeningTime += playlist.tracks.reduce((sum, track) => sum + track.duration_ms, 0) / 1000 / 60;
        existingMonth.tracksPlayed += playlist.tracks.length;
      } else {
        acc.push({
          month: monthKey,
          listeningTime: playlist.tracks.reduce((sum, track) => sum + track.duration_ms, 0) / 1000 / 60,
          tracksPlayed: playlist.tracks.length
        });
      }
      return acc;
    }, []).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
    });

    // Get real play counts from history
    const trackPlayCounts = new Map<string, number>();
    const artistPlayCounts = new Map<string, number>();

    history.forEach(playlist => {
      playlist.tracks.forEach(track => {
        trackPlayCounts.set(track.id, (trackPlayCounts.get(track.id) || 0) + 1);
        track.artists.forEach(artist => {
          artistPlayCounts.set(artist.id, (artistPlayCounts.get(artist.id) || 0) + 1);
        });
      });
    });

    return {
      totalListeningTime,
      topGenres,
      topArtists: artists.slice(0, 10).map(artist => ({
        artist,
        playCount: artistPlayCounts.get(artist.id) || 0
      })),
      topTracks: tracks.slice(0, 10).map(track => ({
        track,
        playCount: trackPlayCounts.get(track.id) || 0
      })),
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

  const StatCard = ({ icon, title, value, subtitle, color = colors.primary }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color, backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.statHeader}>
        {icon}
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
  );

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.primary }]}>
          Please log in to access your analytics.
        </Text>
      </View>
    );
  }

  const currentTracks = topTracks[selectedTimeRange];
  const currentArtists = topArtists[selectedTimeRange];

  return (
    <LinearGradient colors={[colors.background, colors.surface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <BarChart3 color={colors.primary} size={32} strokeWidth={2} />
            <Text style={[styles.title, { color: colors.text }]}>Your Analytics</Text>
          </View>
          <TouchableOpacity
            onPress={loadAnalyticsData}
            disabled={isRefreshing}
            style={[styles.refreshButton, { backgroundColor: `${colors.primary}20` }]}
          >
            <RefreshCw
              color={colors.primary}
              size={20}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Overview Stats */}
          {analytics && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  icon={<Clock color={colors.primary} size={20} strokeWidth={2} />}
                  title="Listening Time"
                  value={`${Math.floor(analytics.totalListeningTime / 60)}h ${analytics.totalListeningTime % 60}m`}
                  subtitle="Total music listened"
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Genres</Text>
              <View style={styles.genresContainer}>
                {analytics.topGenres.slice(0, 8).map((item, index) => (
                  <View
                    key={item.genre}
                    style={[styles.genreItem, {
                      backgroundColor: colors.surface,
                      borderColor: colors.border
                    }]}
                  >
                    <Text style={[styles.genreRank, { color: colors.primary }]}>#{index + 1}</Text>
                    <Text style={[styles.genreName, { color: colors.text }]}>{item.genre}</Text>
                    <Text style={[styles.genreCount, { color: colors.textSecondary }]}>
                      {item.count} artists
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Time Range Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Listening History</Text>
            <View style={[styles.timeRangeSelector, { backgroundColor: colors.surface }]}>
              {Object.entries(timeRangeLabels).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSelectedTimeRange(key as any)}
                  style={[
                    styles.timeRangeButton,
                    selectedTimeRange === key && { backgroundColor: colors.primary }
                  ]}
                >
                  <Text
                    style={[
                      styles.timeRangeText,
                      { color: colors.textSecondary },
                      selectedTimeRange === key && { color: colors.text }
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Top Tracks */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Tracks</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {currentTracks.slice(0, 10).map((track) => (
                <TrackCard key={track.id} track={track} size="small" />
              ))}
            </ScrollView>
          </View>

          {/* Top Artists */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Artists</Text>
            <View style={styles.artistsList}>
              {currentArtists.slice(0, 10).map((artist, index) => (
                <View
                  key={artist.id}
                  style={[styles.artistItem, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }]}
                >
                  <Text style={[styles.artistRank, { color: colors.primary }]}>#{index + 1}</Text>
                  <View style={styles.artistInfo}>
                    <Text style={[styles.artistName, { color: colors.text }]}>{artist.name}</Text>
                    <Text style={[styles.artistGenres, { color: colors.textSecondary }]}>
                      {artist.genres.slice(0, 2).join(', ')}
                    </Text>
                  </View>
                  <Text style={[styles.artistPopularity, { color: colors.textSecondary }]}>
                    {artist.popularity}% popularity
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Monthly Stats */}
          {analytics && analytics.monthlyStats && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Trends</Text>
              <View style={styles.monthlyStats}>
                {Object.values(analytics.monthlyStats).map((monthStat) => (
                  <View
                    key={monthStat.month}
                    style={[styles.monthlyStatItem, {
                      backgroundColor: colors.surface,
                      borderColor: colors.border
                    }]}
                  >
                    <Text style={[styles.monthlyStatMonth, { color: colors.textSecondary }]}>
                      {monthStat.month}
                    </Text>
                    <Text style={[styles.monthlyStatTime, { color: colors.text }]}>
                      {Math.floor(monthStat.listeningTime / 60)}h {monthStat.listeningTime % 60}m
                    </Text>
                    <Text style={[styles.monthlyStatTracks, { color: colors.textSecondary }]}>
                      {monthStat.tracksPlayed} tracks
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

const styles = StyleSheet.create<Styles>({
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
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statSubtitle: {
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
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  genreRank: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  genreName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'capitalize',
    textAlign: 'center',
    marginBottom: 4,
  },
  genreCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  timeRangeSelector: {
    flexDirection: 'row',
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
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  activeTimeRangeButton: {
    backgroundColor: undefined, // Will be overridden by inline style
  },
  activeTimeRangeText: {
    fontWeight: 'bold',
  },
  artistsList: {
    gap: 12,
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  artistRank: {
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
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  artistGenres: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  artistPopularity: {
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
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  monthlyStatMonth: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  monthlyStatTime: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  monthlyStatTracks: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 50,
  },
});