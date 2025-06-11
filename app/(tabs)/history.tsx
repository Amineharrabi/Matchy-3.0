import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dataStorage } from '../../services/dataStorage';
import { spotifyApi } from '../../services/spotifyApi';
import { TrackCard } from '../../components/TrackCard';
import { GeneratedPlaylist } from '../../types/spotify';
import { History, Calendar, Music, Plus, Trash2, RefreshCw } from 'lucide-react-native';

export default function HistoryScreen() {
  const [playlistHistory, setPlaylistHistory] = useState<GeneratedPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<GeneratedPlaylist | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await dataStorage.getPlaylistHistory();
      setPlaylistHistory(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

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

  const createSpotifyPlaylist = async (generatedPlaylist: GeneratedPlaylist) => {
    if (generatedPlaylist.tracks.length === 0) {
      Alert.alert('No Tracks', 'This playlist has no tracks to add to Spotify.');
      return;
    }

    setIsLoading(true);
    try {
      const playlist = await spotifyApi.createPlaylist(
        generatedPlaylist.name,
        generatedPlaylist.description,
        false
      );
      
      if (playlist) {
        const trackUris = generatedPlaylist.tracks.map(track => `spotify:track:${track.id}`);
        const success = await spotifyApi.addTracksToPlaylist(playlist.id, trackUris);
        
        if (success) {
          Alert.alert(
            'Playlist Created!', 
            `"${generatedPlaylist.name}" has been added to your Spotify account.`,
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
  };

  const deletePlaylist = async (playlistId: string) => {
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
            
            // Update storage
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
  };

  const clearAllHistory = async () => {
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
  };

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <History color="#FF6B35" size={32} strokeWidth={2} />
            <Text style={styles.title}>Playlist History</Text>
          </View>
          {playlistHistory.length > 0 && (
            <TouchableOpacity onPress={clearAllHistory} style={styles.clearButton}>
              <Trash2 color="#FF6B35" size={20} strokeWidth={2} />
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {playlistHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <History color="#666" size={64} strokeWidth={1} />
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyText}>
              Generate some music recommendations to see your playlist history here.
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Playlist List */}
            <ScrollView style={styles.playlistList} showsVerticalScrollIndicator={false}>
              {playlistHistory.map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  onPress={() => setSelectedPlaylist(selectedPlaylist?.id === playlist.id ? null : playlist)}
                  style={[
                    styles.playlistItem,
                    selectedPlaylist?.id === playlist.id && styles.selectedPlaylistItem
                  ]}
                >
                  <View style={styles.playlistHeader}>
                    <View style={styles.playlistInfo}>
                      <Text style={styles.playlistName} numberOfLines={1}>
                        {playlist.name}
                      </Text>
                      <Text style={styles.playlistMeta}>
                        {playlist.tracks.length} tracks • {formatDate(playlist.createdAt)}
                      </Text>
                      <View style={styles.genresContainer}>
                        {playlist.genres.slice(0, 3).map((genre) => (
                          <View key={genre} style={styles.genreTag}>
                            <Text style={styles.genreText}>{genre}</Text>
                          </View>
                        ))}
                        {playlist.genres.length > 3 && (
                          <Text style={styles.moreGenres}>+{playlist.genres.length - 3}</Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.playlistActions}>
                      <TouchableOpacity
                        onPress={() => createSpotifyPlaylist(playlist)}
                        disabled={isLoading}
                        style={styles.actionButton}
                      >
                        <Plus color="#1DB954" size={20} strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deletePlaylist(playlist.id)}
                        style={styles.actionButton}
                      >
                        <Trash2 color="#FF6B35" size={20} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {selectedPlaylist?.id === playlist.id && (
                    <View style={styles.playlistTracks}>
                      <Text style={styles.tracksTitle}>Tracks ({playlist.tracks.length})</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {playlist.tracks.map((track) => (
                          <TrackCard key={track.id} track={track} size="small" />
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
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
    paddingBottom: 20,
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
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  clearButtonText: {
    color: '#FF6B35',
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
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    color: '#666',
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
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  selectedPlaylistItem: {
    borderColor: '#1DB954',
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  playlistMeta: {
    color: '#B3B3B3',
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
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreText: {
    color: '#B3B3B3',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textTransform: 'capitalize',
  },
  moreGenres: {
    color: '#666',
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
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistTracks: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    padding: 16,
  },
  tracksTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
});