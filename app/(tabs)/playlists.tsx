import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSpotify } from '../../hooks/useSpotify';
import { spotifyApi } from '../../services/spotifyApi';
import { SearchBar } from '../../components/SearchBar';
import { PlaylistCard } from '../../components/PlaylistCard';
import { TrackCard } from '../../components/TrackCard';
import { SpotifyPlaylist, SpotifyTrack } from '../../types/spotify';
import { Music, Search, Heart, Clock } from 'lucide-react-native';

export default function PlaylistsScreen() {
  const { isLoggedIn } = useSpotify();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [savedTracks, setSavedTracks] = useState<SpotifyTrack[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<SpotifyTrack[]>([]);
  const [recentTracks, setRecentTracks] = useState<SpotifyTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'recent'>('playlists');

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    filterData();
  }, [searchQuery, playlists, savedTracks]);

  const loadData = async () => {
    try {
      const [playlistsData, savedTracksData, recentTracksData] = await Promise.all([
        spotifyApi.getUserPlaylists(50),
        spotifyApi.getSavedTracks(50),
        spotifyApi.getRecentlyPlayed(20),
      ]);

      setPlaylists(playlistsData);
      setSavedTracks(savedTracksData);
      setRecentTracks(recentTracksData);
      setFilteredPlaylists(playlistsData);
      setFilteredTracks(savedTracksData);
    } catch (error) {
      console.error('Failed to load playlists data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to access your playlists.</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Music</Text>
          <SearchBar
            placeholder="Search playlists and songs..."
            onSearch={handleSearch}
            onClear={handleClearSearch}
          />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('playlists')}
            style={[styles.tab, activeTab === 'playlists' && styles.activeTab]}
          >
            <Music color={activeTab === 'playlists' ? '#1DB954' : '#666'} size={20} strokeWidth={2} />
            <Text style={[styles.tabText, activeTab === 'playlists' && styles.activeTabText]}>
              Playlists
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('liked')}
            style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
          >
            <Heart color={activeTab === 'liked' ? '#1DB954' : '#666'} size={20} strokeWidth={2} />
            <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>
              Liked Songs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('recent')}
            style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
          >
            <Clock color={activeTab === 'recent' ? '#1DB954' : '#666'} size={20} strokeWidth={2} />
            <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
              Recent
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1DB954" />}
        >
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
                  <Search color="#666" size={48} strokeWidth={1} />
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? 'No playlists found' : 'No playlists'}
                  </Text>
                  <Text style={styles.emptyText}>
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
                  <Heart color="#666" size={48} strokeWidth={1} />
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? 'No liked songs found' : 'No liked songs'}
                  </Text>
                  <Text style={styles.emptyText}>
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
                  <Clock color="#666" size={48} strokeWidth={1} />
                  <Text style={styles.emptyTitle}>No recent tracks</Text>
                  <Text style={styles.emptyText}>
                    Play some music on Spotify to see your recent tracks here
                  </Text>
                </View>
              )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    color: '#FFFFFF',
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
    borderBottomColor: '#333',
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
    borderBottomColor: '#1DB954',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: '#1DB954',
    fontWeight: 'bold',
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
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#FF6B35',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 50,
  },
});