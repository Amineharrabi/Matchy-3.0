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

  async getAnalytics(): Promise<any> {
    return this.getData('analytics');
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
    return this.getData('preferences');
  }

  // General Storage Utilities
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  async getData(key: string): Promise<any> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
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
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  // Extended History Management
  async appendToHistory(type: string, entry: any): Promise<void> {
    try {
      const historyKey = `${type}_history`;
      const history = await AsyncStorage.getItem(historyKey);
      const existingHistory = history ? JSON.parse(history) : [];
      const updatedHistory = [entry, ...existingHistory.slice(0, 49)]; // Keep last 50 entries
      await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error(`Failed to append to ${type} history:`, error);
    }
  }

  async getHistoryByType(type: string): Promise<any[]> {
    try {
      const historyKey = `${type}_history`;
      const history = await AsyncStorage.getItem(historyKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error(`Failed to get ${type} history:`, error);
      return [];
    }
  }

  async clearHistoryByType(type: string): Promise<void> {
    try {
      const historyKey = `${type}_history`;
      await AsyncStorage.removeItem(historyKey);
    } catch (error) {
      console.error(`Failed to clear ${type} history:`, error);
    }
  }
}

export const dataStorage = new DataStorageService();