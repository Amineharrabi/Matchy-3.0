import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SpotifyPlaylist } from '../types/spotify';
import { Play, Music } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { router } from 'expo-router';

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function PlaylistCard({ playlist, onPress, size = 'medium' }: PlaylistCardProps) {
  const { colors } = useAppTheme();
  if (!playlist) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: "/(playlist)/[id]",
        params: { id: playlist.id.toString() }
      } as any);
    }
  };

  const imageUrl = playlist.images?.[0]?.url || 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg';

  const cardStyles = {
    small: styles.smallCard,
    medium: styles.mediumCard,
    large: styles.largeCard,
  };

  const imageStyles = {
    small: styles.smallImage,
    medium: styles.mediumImage,
    large: styles.largeImage,
  };

  const trackCount = playlist.tracks?.total || 0;
  const ownerName = playlist.owner?.display_name || 'Unknown';

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.card,
        cardStyles[size],
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={[styles.image, imageStyles[size]]} />
        <View style={styles.overlay}>
          <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.primary }]}>
            <Play color="#FFFFFF" size={size === 'small' ? 16 : 20} fill="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.title, size === 'small' && styles.smallTitle, { color: colors.text }]}
          numberOfLines={2}
        >
          {playlist.name || 'Untitled Playlist'}
        </Text>
        <Text
          style={[
            styles.description,
            size === 'small' && styles.smallDescription,
            { color: colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {playlist.description || `${trackCount} tracks`}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.owner, { color: colors.textSecondary }]}>{ownerName}</Text>
          <View style={styles.trackCount}>
            <Music color={colors.textSecondary} size={12} />
            <Text style={[styles.trackCountText, { color: colors.textSecondary }]}>{trackCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
  },
  smallCard: {
    width: 140,
    marginRight: 12,
  },
  mediumCard: {
    width: 180,
    marginRight: 12,
  },
  largeCard: {
    width: '100%',
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
  },
  smallImage: {
    height: 140,
  },
  mediumImage: {
    height: 180,
  },
  largeImage: {
    height: 200,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  smallTitle: {
    fontSize: 14,
  },
  description: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  smallDescription: {
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  owner: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  trackCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackCountText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
});