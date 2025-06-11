import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SpotifyConnectButton } from '../components/SpotifyConnectButton';
import { useSpotify } from '../hooks/useSpotify';
import { Music2, Headphones, TrendingUp } from 'lucide-react-native';

export default function WelcomeScreen() {
  const { login, isLoading, isLoggedIn } = useSpotify();
  const [hasNavigated, setHasNavigated] = useState(false);

  React.useEffect(() => {
    if (isLoggedIn && !hasNavigated) {
      setHasNavigated(true);
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, hasNavigated]);

  if (isLoggedIn && hasNavigated) {
    return null;
  }

  const handleConnect = async () => {
    const success = await login();
    if (success) {
      router.replace('/(tabs)');
    }
  };

  return (
    <LinearGradient
      colors={['#000000', '#1a1a1a', '#000000']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Music2 color="#1DB954" size={48} strokeWidth={2} />
              </View>
              <Text style={styles.title}>SoundScope</Text>
              <Text style={styles.subtitle}>
                Discover your next favorite song with AI-powered recommendations
              </Text>
            </View>

            <View style={styles.features}>
              <View style={styles.feature}>
                <Headphones color="#FF6B35" size={32} strokeWidth={2} />
                <Text style={styles.featureTitle}>Smart Recommendations</Text>
                <Text style={styles.featureText}>
                  Get personalized music suggestions based on your taste and mood
                </Text>
              </View>

              <View style={styles.feature}>
                <TrendingUp color="#1DB954" size={32} strokeWidth={2} />
                <Text style={styles.featureTitle}>Advanced Analytics</Text>
                <Text style={styles.featureText}>
                  Track your listening habits and discover new musical patterns
                </Text>
              </View>

              <View style={styles.feature}>
                <Music2 color="#9B59B6" size={32} strokeWidth={2} />
                <Text style={styles.featureTitle}>Playlist Creation</Text>
                <Text style={styles.featureText}>
                  Create custom playlists and save your favorite discoveries
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <SpotifyConnectButton onPress={handleConnect} isLoading={isLoading} />
              <Text style={styles.disclaimer}>
                Connect your Spotify account to get started with personalized music discovery
              </Text>
            </View>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  features: {
    gap: 32,
    paddingVertical: 40,
  },
  feature: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#B3B3B3',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    gap: 16,
  },
  disclaimer: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  }

});