import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Music } from 'lucide-react-native';

interface SpotifyConnectButtonProps {
  onPress: () => void;
  isLoading?: boolean;
}

export function SpotifyConnectButton({ onPress, isLoading = false }: SpotifyConnectButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} disabled={isLoading} style={styles.button}>
      <LinearGradient
        colors={['#1DB954', '#1ed760']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Music color="#FFFFFF" size={24} strokeWidth={2} />
            <Text style={styles.text}>Connect with Spotify</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
});