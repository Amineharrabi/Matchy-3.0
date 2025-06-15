import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeneratedPlaylist, UserAnalytics } from '../types/spotify';

class DataStorageService {
  private HISTORY_KEY = 'playlist_history';
  private ANALYTICS_KEY = 'user_analytics';
  private PREFERENCES_KEY = 'user_preferences';
  private CACHE_TIMESTAMP_KEY = 'cache_timestamps';
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Cache Management
  private async getCacheTimestamp(key: string): Promise<number | null> {
    try {
      const timestamps = await AsyncStorage.getItem(this.CACHE_TIMESTAMP_KEY);
      if (timestamps) {
        const parsed = JSON.parse(timestamps);
        return parsed[key] || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get cache timestamp:', error);
      return null;
    }
  }

  private async setCacheTimestamp(key: string): Promise<void> {
    try {
      const timestamps = await AsyncStorage.getItem(this.CACHE_TIMESTAMP_KEY);
      const parsed = timestamps ? JSON.parse(timestamps) : {};
      parsed[key] = Date.now();
      await AsyncStorage.setItem(this.CACHE_TIMESTAMP_KEY, JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to set cache timestamp:', error);
    }
  }

  private async isCacheValid(key: string): Promise<boolean> {
    const timestamp = await this.getCacheTimestamp(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  // Playlist History Management
  async savePlaylistToHistory(playlist: GeneratedPlaylist): Promise<void> {
    try {
      const history = await this.getPlaylistHistory();
      const updatedHistory = [playlist, ...history.slice(0, 49)]; // Keep last 50 playlists
      await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(updatedHistory));
      await this.setCacheTimestamp(this.HISTORY_KEY);
    } catch (error) {
      console.error('Failed to save playlist to history:', error);
    }
  }

  async getPlaylistHistory(forceRefresh: boolean = false): Promise<GeneratedPlaylist[]> {
    try {
      if (!forceRefresh && await this.isCacheValid(this.HISTORY_KEY)) {
        const history = await AsyncStorage.getItem(this.HISTORY_KEY);
        return history ? JSON.parse(history) : [];
      }
      // If cache is invalid or force refresh, return empty array
      // The actual data will be fetched and cached by the component
      return [];
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
      await this.setCacheTimestamp(this.ANALYTICS_KEY);
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  async getAnalytics(forceRefresh: boolean = false): Promise<UserAnalytics | null> {
    try {
      if (!forceRefresh && await this.isCacheValid(this.ANALYTICS_KEY)) {
        const analytics = await AsyncStorage.getItem(this.ANALYTICS_KEY);
        return analytics ? JSON.parse(analytics) : null;
      }
      // If cache is invalid or force refresh, return null
      // The actual data will be fetched and cached by the component
      return null;
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
      await this.setCacheTimestamp(this.PREFERENCES_KEY);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  async getPreferences(forceRefresh: boolean = false): Promise<any> {
    try {
      if (!forceRefresh && await this.isCacheValid(this.PREFERENCES_KEY)) {
        const preferences = await AsyncStorage.getItem(this.PREFERENCES_KEY);
        return preferences ? JSON.parse(preferences) : null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return null;
    }
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
      await this.setCacheTimestamp(historyKey);
    } catch (error) {
      console.error(`Failed to append to ${type} history:`, error);
    }
  }

  async getHistoryByType(type: string, forceRefresh: boolean = false): Promise<any[]> {
    try {
      const historyKey = `${type}_history`;
      if (!forceRefresh && await this.isCacheValid(historyKey)) {
        const history = await AsyncStorage.getItem(historyKey);
        return history ? JSON.parse(history) : [];
      }
      return [];
    } catch (error) {
      console.error(`Failed to get ${type} history:`, error);
      return [];
    }
  }

  async clearHistoryByType(type: string): Promise<void> {
    try {
      const historyKey = `${type}_history`;
      await AsyncStorage.removeItem(historyKey);
      await this.invalidateCache(historyKey);
    } catch (error) {
      console.error(`Failed to clear ${type} history:`, error);
    }
  }

  // Cache Invalidation
  async invalidateCache(key?: string): Promise<void> {
    try {
      if (key) {
        const timestamps = await AsyncStorage.getItem(this.CACHE_TIMESTAMP_KEY);
        if (timestamps) {
          const parsed = JSON.parse(timestamps);
          delete parsed[key];
          await AsyncStorage.setItem(this.CACHE_TIMESTAMP_KEY, JSON.stringify(parsed));
        }
      } else {
        await AsyncStorage.removeItem(this.CACHE_TIMESTAMP_KEY);
      }
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  }
}

export const dataStorage = new DataStorageService();