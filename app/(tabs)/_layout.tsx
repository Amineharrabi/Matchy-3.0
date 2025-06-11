import { Tabs, useRouter } from 'expo-router';
import {
  Home,
  List,
  History,
  BarChart3,
  Settings,
  Shield,
} from 'lucide-react-native';
import { useSpotify } from '../../hooks/useSpotify';
import { useEffect, memo } from 'react';

function TabLayout() {
  const { user, isLoggedIn } = useSpotify();
  const router = useRouter();
  const isDeveloper = user?.email === process.env.EXPO_PUBLIC_DEVELOPER_EMAIL;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (!isLoggedIn) {
      timeoutId = setTimeout(() => {
        router.replace('/');
      }, 100);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#333',
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#1DB954',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: 'Playlists',
          tabBarIcon: ({ size, color }) => (
            <List size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ size, color }) => (
            <History size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      {isDeveloper && (
        <Tabs.Screen
          name="developer"
          options={{
            title: 'Developer',
            tabBarIcon: ({ size, color }) => (
              <Shield size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}

export default memo(TabLayout);