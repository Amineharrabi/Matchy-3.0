import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dataStorage } from '../../services/dataStorage';
import { useSpotify } from '../../hooks/useSpotify';
import { 
  Settings, 
  Database, 
  Trash2, 
  Download, 
  Upload, 
  Info, 
  Shield,
  RefreshCw,
  HardDrive,
} from 'lucide-react-native';

export default function DeveloperScreen() {
  const { user } = useSpotify();
  const [storageSize, setStorageSize] = useState(0);
  const [playlistCount, setPlaylistCount] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>({});
  const [debugMode, setDebugMode] = useState(false);
  const [apiRequestCount, setApiRequestCount] = useState(0);

  useEffect(() => {
    loadDeveloperData();
  }, []);

  const loadDeveloperData = async () => {
    try {
      const [size, history, analytics, prefs] = await Promise.all([
        dataStorage.getStorageSize(),
        dataStorage.getPlaylistHistory(),
        dataStorage.getAnalytics(),
        dataStorage.getPreferences(),
      ]);

      setStorageSize(size);
      setPlaylistCount(history.length);
      setAnalyticsData(analytics);
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load developer data:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all stored data including playlist history, analytics, and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataStorage.clearAllData();
              await loadDeveloperData();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  const exportData = async () => {
    try {
      const [history, analytics, prefs] = await Promise.all([
        dataStorage.getPlaylistHistory(),
        dataStorage.getAnalytics(),
        dataStorage.getPreferences(),
      ]);

      const exportData = {
        timestamp: new Date().toISOString(),
        user: user?.id,
        data: {
          playlistHistory: history,
          analytics,
          preferences: prefs,
        },
      };

      // In a real app, you would save this to a file or send to a server
      console.log('Export Data:', JSON.stringify(exportData, null, 2));
      Alert.alert('Export Complete', 'Data has been exported to console. In production, this would save to a file.');
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export data.');
    }
  };

  const simulateApiRequest = () => {
    setApiRequestCount(prev => prev + 1);
    Alert.alert('API Request Simulated', `Total requests: ${apiRequestCount + 1}`);
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    Alert.alert('Debug Mode', debugMode ? 'Disabled' : 'Enabled');
  };

  const DeveloperCard = ({ 
    icon, 
    title, 
    description, 
    value, 
    onPress, 
    color = '#1DB954',
    dangerous = false 
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    value?: string;
    onPress?: () => void;
    color?: string;
    dangerous?: boolean;
  }) => (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.devCard, dangerous && styles.dangerousCard]}
      disabled={!onPress}
    >
      <View style={styles.devCardHeader}>
        <View style={[styles.devCardIcon, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        <View style={styles.devCardInfo}>
          <Text style={styles.devCardTitle}>{title}</Text>
          <Text style={styles.devCardDescription}>{description}</Text>
        </View>
      </View>
      {value && (
        <Text style={[styles.devCardValue, dangerous && styles.dangerousValue]}>
          {value}
        </Text>
      )}
    </TouchableOpacity>
  );

  // Check if user is developer
  const isDeveloper = user?.email === process.env.EXPO_PUBLIC_DEVELOPER_EMAIL;

  if (!isDeveloper) {
    return (
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.accessDenied}>
            <Shield color="#FF6B35" size={64} strokeWidth={1} />
            <Text style={styles.accessDeniedTitle}>Access Denied</Text>
            <Text style={styles.accessDeniedText}>
              This section is only available to authorized developers.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Settings color="#FF6B35" size={32} strokeWidth={2} />
            <Text style={styles.title}>Developer Tools</Text>
          </View>
          <TouchableOpacity onPress={loadDeveloperData} style={styles.refreshButton}>
            <RefreshCw color="#1DB954" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer Info</Text>
            <View style={styles.userInfo}>
              <Text style={styles.userInfoText}>User ID: {user?.id}</Text>
              <Text style={styles.userInfoText}>Email: {user?.email}</Text>
              <Text style={styles.userInfoText}>Display Name: {user?.display_name}</Text>
              <Text style={styles.userInfoText}>Country: {user?.country}</Text>
            </View>
          </View>

          {/* Storage Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage Management</Text>
            
            <DeveloperCard
              icon={<HardDrive color="#1DB954\" size={24} strokeWidth={2} />}
              title="Storage Usage"
              description="Total data stored locally"
              value={formatBytes(storageSize)}
              color="#1DB954"
            />

            <DeveloperCard
              icon={<Database color="#9B59B6\" size={24} strokeWidth={2} />}
              title="Playlist History"
              description="Number of generated playlists stored"
              value={`${playlistCount} playlists`}
              color="#9B59B6"
            />

            <DeveloperCard
              icon={<Download color="#1ABC9C\" size={24} strokeWidth={2} />}
              title="Export Data"
              description="Export all user data for backup"
              onPress={exportData}
              color="#1ABC9C"
            />

            <DeveloperCard
              icon={<Trash2 color="#FF6B35\" size={24} strokeWidth={2} />}
              title="Clear All Data"
              description="Permanently delete all stored data"
              onPress={clearAllData}
              color="#FF6B35"
              dangerous
            />
          </View>

          {/* Debug Tools */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug Tools</Text>
            
            <DeveloperCard
              icon={<Info color="#F39C12\" size={24} strokeWidth={2} />}
              title="Debug Mode"
              description={`Debug mode is ${debugMode ? 'enabled' : 'disabled'}`}
              onPress={toggleDebugMode}
              color="#F39C12"
            />

            <DeveloperCard
              icon={<Upload color="#3498DB\" size={24} strokeWidth={2} />}
              title="Simulate API Request"
              description="Test API request handling"
              value={`${apiRequestCount} requests made`}
              onPress={simulateApiRequest}
              color="#3498DB"
            />
          </View>

          {/* Analytics Data */}
          {analyticsData && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Analytics Debug</Text>
              <View style={styles.debugData}>
                <Text style={styles.debugTitle}>Raw Analytics Data:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={styles.debugText}>
                    {JSON.stringify(analyticsData, null, 2)}
                  </Text>
                </ScrollView>
              </View>
            </View>
          )}

          {/* Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Preferences</Text>
            <View style={styles.debugData}>
              <Text style={styles.debugTitle}>Stored Preferences:</Text>
              <Text style={styles.debugText}>
                {JSON.stringify(preferences, null, 2)}
              </Text>
            </View>
          </View>

          {/* Environment Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Environment</Text>
            <View style={styles.envInfo}>
              <Text style={styles.envText}>
                Spotify Client ID: {process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID?.substring(0, 8)}...
              </Text>
              <Text style={styles.envText}>
                News API Key: {process.env.EXPO_PUBLIC_NEWS_API_KEY ? 'Configured' : 'Not configured'}
              </Text>
              <Text style={styles.envText}>
                Developer Email: {process.env.EXPO_PUBLIC_DEVELOPER_EMAIL}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  devCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  dangerousCard: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
  },
  devCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  devCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  devCardInfo: {
    flex: 1,
  },
  devCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  devCardDescription: {
    color: '#B3B3B3',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  devCardValue: {
    color: '#1DB954',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginTop: 12,
    textAlign: 'right',
  },
  dangerousValue: {
    color: '#FF6B35',
  },
  userInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  userInfoText: {
    color: '#B3B3B3',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  debugData: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  debugTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  debugText: {
    color: '#B3B3B3',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  envInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  envText: {
    color: '#B3B3B3',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  accessDeniedTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginTop: 20,
    marginBottom: 12,
  },
  accessDeniedText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});