import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dataStorage } from '../../services/dataStorage';
import { spotifyApi } from '../../services/spotifyApi';
import { TrackCard } from '../../components/TrackCard';
import { GeneratedPlaylist } from '../../types/spotify';
import { History, Calendar, Music, Plus, Trash2, RefreshCw } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

const ERROR_COLOR = '#FF6B35';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface Styles {
  container: ViewStyle;
  safeArea: ViewStyle;
  header: ViewStyle;
  titleContainer: ViewStyle;
  title: TextStyle;
  clearButton: ViewStyle;
  clearButtonText: TextStyle;
  emptyState: ViewStyle;
  emptyTitle: TextStyle;
  emptyText: TextStyle;
  content: ViewStyle;
  playlistList: ViewStyle;
  playlistItem: ViewStyle;
  selectedPlaylistItem: ViewStyle;
  playlistHeader: ViewStyle;
  playlistInfo: ViewStyle;
  playlistName: TextStyle;
  playlistMeta: TextStyle;
  genresContainer: ViewStyle;
  genreTag: ViewStyle;
  genreText: TextStyle;
  moreGenres: TextStyle;
  playlistActions: ViewStyle;
  actionButton: ViewStyle;
  playlistTracks: ViewStyle;
  tracksTitle: TextStyle;
  loadingContainer: ViewStyle;
}

// Memoized TrackCard wrapper
const MemoizedTrackCard = memo(TrackCard);

// Memoized playlist item component
const PlaylistItem = memo(({
  playlist,
  isSelected,
  onSelect,
  onDelete,
  onCreateSpotifyPlaylist,
  colors,
  isLoading
}: {
  playlist: GeneratedPlaylist;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onCreateSpotifyPlaylist: () => void;
  colors: any;
  isLoading: boolean;
}) => (
  <TouchableOpacity
    onPress={onSelect}
    style={[
      styles.playlistItem,
      { backgroundColor: colors.surface, borderColor: colors.border },
      isSelected && [styles.selectedPlaylistItem, { borderColor: colors.primary }]
    ]}
  >
    <View style={styles.playlistHeader}>
      <View style={styles.playlistInfo}>
        <Text style={[styles.playlistName, { color: colors.text }]} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={[styles.playlistMeta, { color: colors.textSecondary }]}>
          {playlist.tracks.length} tracks • {formatDate(playlist.createdAt)}
        </Text>
        <View style={styles.genresContainer}>
          {playlist.genres.slice(0, 3).map((genre) => (
            <View key={genre} style={[styles.genreTag, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[styles.genreText, { color: colors.textSecondary }]}>{genre}</Text>
            </View>
          ))}
          {playlist.genres.length > 3 && (
            <Text style={[styles.moreGenres, { color: colors.textSecondary }]}>
              +{playlist.genres.length - 3}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.playlistActions}>
        <TouchableOpacity
          onPress={onCreateSpotifyPlaylist}
          disabled={isLoading}
          style={[styles.actionButton, { backgroundColor: `${colors.primary}20` }]}
        >
          <Plus color={colors.primary} size={20} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={[styles.actionButton, { backgroundColor: `${ERROR_COLOR}20` }]}
        >
          <Trash2 color={ERROR_COLOR} size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>

    {isSelected && (
      <View style={[styles.playlistTracks, { borderTopColor: colors.border }]}>
        <Text style={[styles.tracksTitle, { color: colors.text }]}>
          Tracks ({playlist.tracks.length})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {playlist.tracks.map((track) => (
            <MemoizedTrackCard key={track.id} track={track} size="small" />
          ))}
        </ScrollView>
      </View>
    )}
  </TouchableOpacity>
));

export default function HistoryScreen() {
  const [playlistHistory, setPlaylistHistory] = useState<GeneratedPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<GeneratedPlaylist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { colors } = useAppTheme();

  const loadHistory = useCallback(async () => {
    try {
      const history = await dataStorage.getPlaylistHistory();
      setPlaylistHistory(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleCreateSpotifyPlaylist = useCallback(async (playlist: GeneratedPlaylist) => {
    if (playlist.tracks.length === 0) {
      Alert.alert('No Tracks', 'This playlist has no tracks to add to Spotify.');
      return;
    }

    setIsLoading(true);
    try {
      const newPlaylist = await spotifyApi.createPlaylist(
        playlist.name,
        playlist.description,
        false
      );

      if (newPlaylist) {
        const trackUris = playlist.tracks.map(track => `spotify:track:${track.id}`);
        const success = await spotifyApi.addTracksToPlaylist(newPlaylist.id, trackUris);

        if (success) {
          Alert.alert(
            'Playlist Created!',
            `"${playlist.name}" has been added to your Spotify account.`,
            [{ text: 'OK', style: 'default' }]
          );
        }
      }
    } catch (error) {
      console.error('Failed to create playlist:', error);
      Alert.alert('Error', 'Failed to create playlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeletePlaylist = useCallback((playlistId: string) => {
    Alert.alert(
      'Delete Playlist',
      'Are you sure you want to delete this playlist from your history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedHistory = playlistHistory.filter(p => p.id !== playlistId);
            setPlaylistHistory(updatedHistory);
            await dataStorage.clearPlaylistHistory();
            for (const playlist of updatedHistory) {
              await dataStorage.savePlaylistToHistory(playlist);
            }
            if (selectedPlaylist?.id === playlistId) {
              setSelectedPlaylist(null);
            }
          },
        },
      ]
    );
  }, [playlistHistory, selectedPlaylist]);

  const clearAllHistory = useCallback(() => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to clear all playlist history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await dataStorage.clearPlaylistHistory();
            setPlaylistHistory([]);
            setSelectedPlaylist(null);
          },
        },
      ]
    );
  }, []);

  return (
    <LinearGradient colors={[colors.background, colors.surface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <History color={colors.primary} size={32} strokeWidth={2} />
            <Text style={[styles.title, { color: colors.text }]}>Playlist History</Text>
          </View>
          {playlistHistory.length > 0 && (
            <TouchableOpacity
              onPress={clearAllHistory}
              style={[styles.clearButton, { backgroundColor: `${ERROR_COLOR}20` }]}
            >
              <Trash2 color={ERROR_COLOR} size={20} strokeWidth={2} />
              <Text style={[styles.clearButtonText, { color: ERROR_COLOR }]}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {isInitialLoad ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : playlistHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <History color={colors.textSecondary} size={64} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No History Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Generate some music recommendations to see your playlist history here.
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            <ScrollView style={styles.playlistList} showsVerticalScrollIndicator={false}>
              {playlistHistory.map((playlist) => (
                <PlaylistItem
                  key={playlist.id}
                  playlist={playlist}
                  isSelected={selectedPlaylist?.id === playlist.id}
                  onSelect={() => setSelectedPlaylist(selectedPlaylist?.id === playlist.id ? null : playlist)}
                  onDelete={() => handleDeletePlaylist(playlist.id)}
                  onCreateSpotifyPlaylist={() => handleCreateSpotifyPlaylist(playlist)}
                  colors={colors}
                  isLoading={isLoading}
                />
              ))}
            </ScrollView>
          </View>
        )}
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
    paddingBottom: 20,
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
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  playlistList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  playlistItem: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  selectedPlaylistItem: {},
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  playlistMeta: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  genreTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textTransform: 'capitalize',
  },
  moreGenres: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  playlistActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistTracks: {
    borderTopWidth: 1,
    padding: 16,
  },
  tracksTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});