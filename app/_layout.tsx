import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSpotify } from '../hooks/useSpotify';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

function RootLayoutNav() {
  const { isLoggedIn } = useSpotify();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="index" />
      ) : (
        <>
          <Stack.Screen 
            name="(tabs)" 
            options={{ animation: 'fade' }}
          />
          <Stack.Screen 
            name="+not-found" 
            options={{ presentation: 'modal' }}
          />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const { isLoading: authLoading } = useSpotify();
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  const prepare = useCallback(async () => {
    try {
      if (fontsLoaded && !authLoading && !appReady) {
        await SplashScreen.hideAsync();
        setAppReady(true);
      }
    } catch (error) {
      console.warn('Error preparing app:', error);
    }
  }, [fontsLoaded, authLoading, appReady]);
  // Handle initialization effects
  useEffect(() => {
    async function prepare() {
      try {
        if (fontsLoaded && !authLoading) {
          await SplashScreen.hideAsync();
          setAppReady(true);
        }
      } catch (error) {
        console.warn('Error preparing app:', error);
      }
    }

    prepare();
  }, [fontsLoaded, authLoading]);

  // Show loading screen
  if (!appReady || !fontsLoaded || authLoading) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  // Handle font loading error
  if (fontError) {
    console.error('Error loading fonts:', fontError);
    return null;
  }

  return (
    <>
      <RootLayoutNav />
      <StatusBar style="light" backgroundColor="#000000" />
    </>
  );
}