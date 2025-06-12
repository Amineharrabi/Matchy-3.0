import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet, ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    Image,
    ImageStyle,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useSpotify } from '../../hooks/useSpotify';
import { spotifyApi } from '../../services/spotifyApi';
import { SpotifyPlaylist, SpotifyTrack } from '../../types/spotify';
import { TrackCard } from '../../components/TrackCard';
import { ArrowLeft, Music, Play } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Styles {
    container: ViewStyle;
    header: ViewStyle;
    headerBackground: ViewStyle;
    headerContent: ViewStyle;
    backButton: ViewStyle;
    coverImage: ImageStyle;
    playlistInfo: ViewStyle;
    playlistTitle: TextStyle;
    playlistSubtitle: TextStyle;
    playlistMeta: TextStyle;
    content: ViewStyle;
    tracks: ViewStyle;
}

export default function PlaylistDetailsScreen() {
    const { id } = useLocalSearchParams();
    const { colors } = useAppTheme();
    const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null);
    const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadPlaylistDetails();
    }, [id]);

    const loadPlaylistDetails = async () => {
        try {
            const playlistData = await spotifyApi.getPlaylist(id as string);
            if (playlistData) {
                setPlaylist(playlistData);
                const playlistTracks = await spotifyApi.getPlaylistTracks(id as string);
                setTracks(playlistTracks);
            }
        } catch (error) {
            console.error('Failed to load playlist details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!playlist) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Playlist not found</Text>
            </View>
        );
    } const coverImage = playlist.images[0]?.url || 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg';

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPlaylistDetails();
        setRefreshing(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                        progressBackgroundColor={colors.surface}
                        progressViewOffset={20}
                    />
                }>
                <LinearGradient
                    colors={[colors.primary + '40', colors.background]}
                    style={styles.headerBackground}
                >
                    <SafeAreaView style={styles.header}>
                        <View style={styles.headerContent}>
                            <TouchableOpacity onPress={() => router.push("/(tabs)/playlists")}>
                                <ArrowLeft size={24} color={colors.text} />
                            </TouchableOpacity>
                            <Image source={{ uri: coverImage }} style={styles.coverImage} />
                            <View style={styles.playlistInfo}>
                                <Text style={[styles.playlistTitle, { color: colors.text }]} numberOfLines={2}>
                                    {playlist.name}
                                </Text>
                                <Text style={[styles.playlistSubtitle, { color: colors.textSecondary }]}>
                                    {playlist.owner.display_name}
                                </Text>
                                <Text style={[styles.playlistMeta, { color: colors.textSecondary }]}>
                                    <Music size={12} color={colors.textSecondary} /> {playlist.tracks.total} tracks
                                </Text>
                            </View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                <View style={[styles.content, { backgroundColor: colors.background }]}>                   
                     <View style={styles.tracks}>
                    {tracks.map((track, index) => (
                        <TrackCard
                            key={`${track.id}-${index}`}
                            track={track}
                            size="large"
                        />
                    ))}
                </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create<Styles>({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerBackground: {
        paddingTop: 20,
    },
    headerContent: {
        gap: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverImage: {
        width: '100%',
        height: 280,
        borderRadius: 5,
    },
    playlistInfo: {
        gap: 8,
    },
    playlistTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
        marginLeft: 10,
    },
    playlistSubtitle: {
        fontSize: 16,
        marginLeft: 10,
        fontFamily: 'Inter-Regular',
    },
    playlistMeta: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    content: {
        flex: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
    },
    tracks: {
        padding: 20,
        gap: 12,
    },
});
