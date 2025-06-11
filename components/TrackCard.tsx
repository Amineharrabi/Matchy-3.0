import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SpotifyTrack } from '../types/spotify';
import { Play, Heart } from 'lucide-react-native';

interface TrackCardProps {
  track: SpotifyTrack;
  onPress?: () => void;
  showArtist?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function TrackCard({ track, onPress, showArtist = true, size = 'medium' }: TrackCardProps) {
  const imageUrl = track.album.images[0]?.url || 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg';
  const artistNames = track.artists.map(artist => artist.name).join(', ');
  
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

  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, cardStyles[size]]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={[styles.image, imageStyles[size]]} />
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.playButton}>
            <Play color="#FFFFFF" size={size === 'small' ? 16 : 20} fill="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.info}>
        <Text style={[styles.title, size === 'small' && styles.smallTitle]} numberOfLines={1}>
          {track.name}
        </Text>
        {showArtist && (
          <Text style={[styles.artist, size === 'small' && styles.smallArtist]} numberOfLines={1}>
            {artistNames}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.duration}>
            {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
          </Text>
          <TouchableOpacity style={styles.favoriteButton}>
            <Heart color="#666" size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
    backgroundColor: '#333',
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
    backgroundColor: '#1DB954',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  smallTitle: {
    fontSize: 14,
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  smallArtist: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duration: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  favoriteButton: {
    padding: 4,
  },
});