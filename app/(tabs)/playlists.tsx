import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSpotify } from '../../hooks/useSpotify';
import { spotifyApi } from '../../services/spotifyApi';
import { SearchBar } from '../../components/SearchBar';
import { PlaylistCard } from '../../components/PlaylistCard';
import { TrackCard } from '../../components/TrackCard';
import { SpotifyPlaylist, SpotifyTrack } from '../../types/spotify';
import { Music, Search, Heart, Clock } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

const { width } = Dimensions.get('window');

interface Styles {
  container: ViewStyle;
  safeArea: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  tabContainer: ViewStyle;
  tab: ViewStyle;
  activeTab: ViewStyle;
  tabText: TextStyle;
  scrollView: ViewStyle;
  content: ViewStyle;
  grid: ViewStyle;
  gridItem: ViewStyle;
  tracksList: ViewStyle;
  emptyState: ViewStyle;
  emptyTitle: TextStyle;
  emptyText: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  retryText: TextStyle;
  loadingMore: ViewStyle;
}

export default function PlaylistsScreen() {
  const { isLoggedIn } = useSpotify();
  const { colors } = useAppTheme();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [savedTracks, setSavedTracks] = useState<SpotifyTrack[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<SpotifyTrack[]>([]);
  const [recentTracks, setRecentTracks] = useState<SpotifyTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'recent'>('playlists');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    filterData();
  }, [searchQuery, playlists, savedTracks]);

  const loadData = async (refresh = false) => {
    setError(null);
    if (refresh) {
      setPage(0);
      setHasMore(true);
      setSearchQuery(''); // Clear search on refresh
    }

    try {
      // Load all data types in parallel for faster refresh
      const [userPlaylists, savedTracksData, recentTracksData] = await Promise.all([
        spotifyApi.getUserPlaylists(),
        activeTab === 'liked' ? spotifyApi.getSavedTracks(PAGE_SIZE) : Promise.resolve([]),
        activeTab === 'recent' ? spotifyApi.getRecentlyPlayed(20) : Promise.resolve([])
      ]);

      setPlaylists(userPlaylists);

      if (activeTab === 'liked') {
        setSavedTracks(savedTracksData);
        setHasMore(savedTracksData.length === PAGE_SIZE);
      } else if (activeTab === 'recent') {
        setRecentTracks(recentTracksData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Could not load your music. Pull down to try again.');
    }
  };

  const loadSavedTracks = async (refresh = false) => {
    setIsLoadingMore(true);
    try {
      const offset = refresh ? 0 : page * PAGE_SIZE;
      const tracks = await spotifyApi.getSavedTracks(PAGE_SIZE);
      if (tracks.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (refresh) {
        setSavedTracks(tracks);
      } else {
        setSavedTracks(prev => [...prev, ...tracks]);
      }
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load saved tracks:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleTabChange = (tab: 'playlists' | 'liked' | 'recent') => {
    setError(null); // Clear any existing errors
    setActiveTab(tab);
    if (tab === 'liked' && savedTracks.length === 0) {
      loadSavedTracks(true);
    } else if (tab === 'recent' && recentTracks.length === 0) {
      loadData();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const filterData = () => {
    if (!searchQuery.trim()) {
      setFilteredPlaylists(playlists);
      setFilteredTracks(savedTracks);
      return;
    }

    const query = searchQuery.toLowerCase();

    const filteredPlaylistsData = playlists.filter(playlist =>
      playlist.name.toLowerCase().includes(query) ||
      playlist.description.toLowerCase().includes(query) ||
      playlist.owner.display_name.toLowerCase().includes(query)
    );

    const filteredTracksData = savedTracks.filter(track =>
      track.name.toLowerCase().includes(query) ||
      track.artists.some(artist => artist.name.toLowerCase().includes(query)) ||
      track.album.name.toLowerCase().includes(query)
    );

    setFilteredPlaylists(filteredPlaylistsData);
    setFilteredTracks(filteredTracksData);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Render error state if present
  const renderError = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: '#FF6B35' }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={onRefresh}
        >
          <Text style={[styles.retryText, { color: colors.text }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.primary }]}>Please log in to access your playlists.</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={[colors.background, colors.surface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Your Music</Text>
          <SearchBar
            placeholder="Search playlists and songs..."
            onSearch={handleSearch}
            onClear={handleClearSearch}
          />
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => handleTabChange('playlists')}
            style={[styles.tab, activeTab === 'playlists' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          >
            <Music color={activeTab === 'playlists' ? colors.primary : colors.textSecondary} size={20} strokeWidth={2} />
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'playlists' && { color: colors.primary }]}>
              Playlists
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabChange('liked')}
            style={[styles.tab, activeTab === 'liked' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          >
            <Heart color={activeTab === 'liked' ? colors.primary : colors.textSecondary} size={20} strokeWidth={2} />
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'liked' && { color: colors.primary }]}>
              Liked Songs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabChange('recent')}
            style={[styles.tab, activeTab === 'recent' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          >
            <Clock color={activeTab === 'recent' ? colors.primary : colors.textSecondary} size={20} strokeWidth={2} />
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'recent' && { color: colors.primary }]}>
              Recent
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
              progressViewOffset={20}
            />
          }
          onScroll={({ nativeEvent }) => {
            if (activeTab === 'liked' && hasMore && !isLoadingMore && !refreshing) {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              const isEndReached = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
              if (isEndReached) {
                loadSavedTracks();
              }
            }
          }}
          scrollEventThrottle={16}
        >
          {renderError()}

          {/* Playlists Tab */}
          {activeTab === 'playlists' && (
            <View style={styles.content}>
              {filteredPlaylists.length > 0 ? (
                <View style={styles.grid}>
                  {filteredPlaylists.filter(playlist => playlist != null).map((playlist) => (
                    <View key={playlist.id || Math.random().toString()} style={styles.gridItem}>
                      <PlaylistCard playlist={playlist} size="large" />
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Search color={colors.textSecondary} size={48} strokeWidth={1} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {searchQuery ? 'No playlists found' : 'No playlists'}
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'Create playlists in Spotify to see them here'
                    }
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Liked Songs Tab */}
          {activeTab === 'liked' && (
            <View style={styles.content}>
              {filteredTracks.length > 0 ? (
                <View style={styles.tracksList}>
                  {filteredTracks.map((track) => (
                    <TrackCard key={track.id} track={track} size="large" />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Heart color={colors.textSecondary} size={48} strokeWidth={1} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {searchQuery ? 'No liked songs found' : 'No liked songs'}
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'Like songs in Spotify to see them here'
                    }
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Recent Tab */}
          {activeTab === 'recent' && (
            <View style={styles.content}>
              {recentTracks.length > 0 ? (
                <View style={styles.tracksList}>
                  {recentTracks.map((track, index) => (
                    <TrackCard key={`${track.id}-${index}`} track={track} size="large" />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Clock color={colors.textSecondary} size={48} strokeWidth={1} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No recent tracks</Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Play some music on Spotify to see your recent tracks here
                  </Text>
                </View>
              )}
            </View>
          )}

          {isLoadingMore && (
            <View style={styles.loadingMore}>
              <ActivityIndicator color={colors.primary} />
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  grid: {
    gap: 16,
  },
  gridItem: {
    marginBottom: 12,
  },
  tracksList: {
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});