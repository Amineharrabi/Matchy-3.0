import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeneratedPlaylist, UserAnalytics } from '../types/spotify';

class DataStorageService {
  private HISTORY_KEY = 'playlist_history';
  private ANALYTICS_KEY = 'user_analytics';
  private PREFERENCES_KEY = 'user_preferences';

  // Playlist History Management
  async savePlaylistToHistory(playlist: GeneratedPlaylist): Promise<void> {
    try {
      const history = await this.getPlaylistHistory();
      const updatedHistory = [playlist, ...history.slice(0, 49)]; // Keep last 50 playlists
      await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save playlist to history:', error);
    }
  }

  async getPlaylistHistory(): Promise<GeneratedPlaylist[]> {
    try {
      const history = await AsyncStorage.getItem(this.HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get playlist history:', error);
      return [];
    }
  }

  async clearPlaylistHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear playlist history:', error);
    }
  }

  // Analytics Management
  async saveAnalytics(analytics: UserAnalytics): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(analytics));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  async getAnalytics(): Promise<UserAnalytics | null> {
    try {
      const analytics = await AsyncStorage.getItem(this.ANALYTICS_KEY);
      return analytics ? JSON.parse(analytics) : null;
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return null;
    }
  }

  async updateAnalytics(updates: Partial<UserAnalytics>): Promise<void> {
    try {
      const currentAnalytics = await this.getAnalytics();
      const updatedAnalytics = {
        ...currentAnalytics,
        ...updates,
      } as UserAnalytics;
      await this.saveAnalytics(updatedAnalytics);
    } catch (error) {
      console.error('Failed to update analytics:', error);
    }
  }

  // User Preferences
  async savePreferences(preferences: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  async getPreferences(): Promise<any> {
    try {
      const preferences = await AsyncStorage.getItem(this.PREFERENCES_KEY);
      return preferences ? JSON.parse(preferences) : {};
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return {};
    }
  }

  // General Storage Utilities
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.HISTORY_KEY,
        this.ANALYTICS_KEY,
        this.PREFERENCES_KEY,
      ]);
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }

  async getStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return 0;
    }
  }
}

export const dataStorage = new DataStorageService();