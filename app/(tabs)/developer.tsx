import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dataStorage } from '../../services/dataStorage';
import { useSpotify } from '../../hooks/useSpotify';
import { SpotifyUser } from '../../types/spotify';
import {
  Settings,
  Database,
  Trash2,
  Download,
  Info,
  Shield,
  RefreshCw,
  HardDrive,
} from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

const ERROR_COLOR = '#FF6B35';

interface DeveloperCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value?: string;
  onPress?: () => void;
  color?: string;
  dangerous?: boolean;
}

interface Styles {
  container: ViewStyle;
  safeArea: ViewStyle;
  header: ViewStyle;
  titleContainer: ViewStyle;
  title: TextStyle;
  refreshButton: ViewStyle;
  scrollView: ViewStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  devCard: ViewStyle;
  dangerousCard: ViewStyle;
  devCardHeader: ViewStyle;
  devCardIcon: ViewStyle;
  devCardInfo: ViewStyle;
  devCardTitle: TextStyle;
  devCardDescription: TextStyle;
  devCardValue: TextStyle;
  dangerousValue: TextStyle;
  debugData: ViewStyle;
  debugTitle: TextStyle;
  debugText: TextStyle;
  accessDenied: ViewStyle;
  accessDeniedTitle: TextStyle;
  accessDeniedText: TextStyle;
}

const DeveloperCard: React.FC<DeveloperCardProps> = ({
  icon,
  title,
  description,
  value,
  onPress,
  color,
  dangerous
}) => {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.devCard,
        {
          backgroundColor: colors.surface,
          borderColor: dangerous ? ERROR_COLOR : colors.border,
        },
        dangerous && styles.dangerousCard
      ]}
    >
      <View style={styles.devCardHeader}>
        <View style={[styles.devCardIcon, { backgroundColor: `${color || colors.primary}20` }]}>
          {icon}
        </View>
        <View style={styles.devCardInfo}>
          <Text style={[styles.devCardTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.devCardDescription, { color: colors.textSecondary }]}>{description}</Text>
          {value && (
            <Text style={[
              styles.devCardValue,
              dangerous ? [styles.dangerousValue, { color: ERROR_COLOR }] : { color: colors.text }
            ]}>
              {value}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function DeveloperScreen() {
  const { user } = useSpotify();
  const { colors } = useAppTheme();
  const [storageSize, setStorageSize] = useState(0);
  const [playlistCount, setPlaylistCount] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>({});
  const [debugMode, setDebugMode] = useState(false);
  const [apiRequestCount, setApiRequestCount] = useState(0);

  const loadDeveloperData = async () => {
    try {
      const size = await dataStorage.getStorageSize();
      const playlists = await dataStorage.getData('generatedPlaylists') || [];
      const analytics = await dataStorage.getAnalytics();
      const prefs = await dataStorage.getPreferences();
      const requests = await dataStorage.getData('apiRequestCount') || 0;

      setStorageSize(size);
      setPlaylistCount(playlists.length);
      setAnalyticsData(analytics);
      setPreferences(prefs);
      setApiRequestCount(requests);
    } catch (error) {
      console.error('Failed to load developer data:', error);
      Alert.alert('Error', 'Failed to load developer data');
    }
  };

  const refreshData = async () => {
    await loadDeveloperData();
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all locally stored data including playlists, preferences, and analytics. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataStorage.clearAllData();
              await loadDeveloperData();
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('Failed to clear data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const toggleDebugMode = () => {
    setDebugMode(prev => !prev);
  };

  // Helper function to check if user is a developer
  const checkDeveloperStatus = (user: SpotifyUser | null): boolean => {
    if (!user?.email) return false;
    return user.email.endsWith('@matchymusic.com') || user.email === 'admin@example.com';
  };

  useEffect(() => {
    loadDeveloperData();
  }, []);

  if (!checkDeveloperStatus(user)) {
    return (
      <LinearGradient colors={[colors.background, colors.surface]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.accessDenied}>
            <Shield color={colors.textSecondary} size={64} strokeWidth={1} />
            <Text style={[styles.accessDeniedTitle, { color: colors.text }]}>Access Denied</Text>
            <Text style={[styles.accessDeniedText, { color: colors.textSecondary }]}>
              This section is only available to developers.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.background, colors.surface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Settings color={colors.primary} size={32} strokeWidth={2} />
            <Text style={[styles.title, { color: colors.text }]}>Developer</Text>
          </View>
          <TouchableOpacity onPress={refreshData} style={styles.refreshButton}>
            <RefreshCw color={colors.primary} size={24} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Storage Management */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Storage</Text>

            <DeveloperCard
              icon={<Database color={colors.primary} size={24} strokeWidth={2} />}
              title="Local Storage"
              description="Current storage usage"
              value={`${(storageSize / 1024).toFixed(2)} KB`}
              color={colors.primary}
            />

            <DeveloperCard
              icon={<HardDrive color={colors.primary} size={24} strokeWidth={2} />}
              title="Generated Playlists"
              description="Number of playlists stored"
              value={`${playlistCount} playlists`}
              color={colors.primary}
            />

            <DeveloperCard
              icon={<Download color={colors.primary} size={24} strokeWidth={2} />}
              title="API Requests"
              description="Total API requests made"
              value={`${apiRequestCount} requests`}
              color={colors.primary}
            />

            <DeveloperCard
              icon={<Trash2 color={ERROR_COLOR} size={24} strokeWidth={2} />}
              title="Clear All Data"
              description="Delete all locally stored data"
              onPress={clearAllData}
              dangerous
            />
          </View>

          {/* Debug Tools */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Debug</Text>

            <DeveloperCard
              icon={<Info color={colors.primary} size={24} strokeWidth={2} />}
              title="Debug Mode"
              description="Toggle debug logging"
              value={debugMode ? 'Enabled' : 'Disabled'}
              onPress={toggleDebugMode}
              color={colors.primary}
            />

            {debugMode && (
              <>
                <View style={styles.debugData}>
                  <Text style={[styles.debugTitle, { color: colors.text }]}>User Preferences</Text>
                  <Text style={[styles.debugText, { color: colors.textSecondary }]}>
                    {JSON.stringify(preferences, null, 2)}
                  </Text>
                </View>

                <View style={styles.debugData}>
                  <Text style={[styles.debugTitle, { color: colors.text }]}>Analytics Data</Text>
                  <Text style={[styles.debugText, { color: colors.textSecondary }]}>
                    {JSON.stringify(analyticsData, null, 2)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  devCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dangerousCard: {
    borderWidth: 1,
  },
  devCardHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  devCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  devCardInfo: {
    flex: 1,
  },
  devCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  devCardDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  devCardValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  dangerousValue: {
    fontFamily: 'Inter-SemiBold',
  },
  debugData: {
    padding: 16,
    marginVertical: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginTop: 20,
    marginBottom: 12,
  },
  accessDeniedText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});