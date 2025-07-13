import { cloudSync } from "./cloudSync";
import { useShieldStore } from "@/stores/shield";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Track } from "@/types/track";
import Toast from "react-native-root-toast";

const RECENTLY_PLAYED_KEY = "streamshield:recently_played";

class DataSyncService {
  /**
   * Initialize data sync for a user (called on app start/login)
   */
  async initializeSync(spotifyUserId: string): Promise<void> {
    try {

      // Load data from cloud
      await this.loadAllDataFromCloud(spotifyUserId);

      // Sync local data to cloud
      await this.syncAllDataToCloud(spotifyUserId);

    } catch (error) {
      console.error("Failed to initialize data sync:", error);
      Toast.show("Failed to sync data. Using local data only.", {
        duration: Toast.durations.SHORT,
      });
    }
  }

  /**
   * Load all user data from cloud
   */
  async loadAllDataFromCloud(spotifyUserId: string): Promise<void> {
    try {
      // Load shield sessions from cloud
      await useShieldStore.getState().loadFromCloud(spotifyUserId);

    } catch (error) {
      console.error("Failed to load data from cloud:", error);
      // Don't show error to user - fallback to local data
    }
  }

  /**
   * Sync all local data to cloud
   */
  async syncAllDataToCloud(spotifyUserId: string): Promise<void> {
    try {

      // Sync shield sessions to cloud
      await useShieldStore.getState().syncToCloud(spotifyUserId);

      // Sync history to cloud
      await this.syncHistoryToCloud(spotifyUserId);

    } catch (error) {
      console.error("Failed to sync data to cloud:", error);
      throw error; // Re-throw so the calling code can handle it
    }
  }

  /**
   * Sync history data to cloud
   */
  async syncHistoryToCloud(spotifyUserId: string): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(RECENTLY_PLAYED_KEY);
      if (raw) {
        const localTracks: Track[] = JSON.parse(raw);
        await cloudSync.syncHistory(spotifyUserId, localTracks);
      }
    } catch (error) {
      console.error("Failed to sync history to cloud:", error);
    }
  }

  /**
   * Get merged history data (local + cloud + Spotify) - always try to return 50 tracks
   */
  async getMergedHistory(
    spotifyUserId: string,
    spotifyTracks: Track[],
  ): Promise<Track[]> {
    try {
      // Get local tracks
      const raw = await AsyncStorage.getItem(RECENTLY_PLAYED_KEY);
      const localTracks: Track[] = raw ? JSON.parse(raw) : [];

      // Merge with cloud data (fetches up to 200 tracks from cloud)
      const mergedTracks = await cloudSync.mergeHistoryData(
        spotifyUserId,
        localTracks,
      );

      // Merge with Spotify data
      const allTracks = [...mergedTracks, ...spotifyTracks];

      // Deduplicate by id, keeping only the most recent timestamp
      const trackMap = new Map<string, Track>();
      for (const track of allTracks) {
        if (!track.id) continue;
        const existing = trackMap.get(track.id);
        if (!existing ?? (track.timestamp ?? 0) > (existing.timestamp ?? 0)) {
          trackMap.set(track.id, track);
        }
      }

      // Sort by timestamp desc and return up to 200 tracks
      const sortedTracks = Array.from(trackMap.values())
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
        .slice(0, 200);

      
      return sortedTracks;
    } catch (error) {
      console.error("Failed to merge history data:", error);
      // Fallback to local + Spotify merge
      const raw = await AsyncStorage.getItem(RECENTLY_PLAYED_KEY);
      const localTracks: Track[] = raw ? JSON.parse(raw) : [];
      const allTracks = [...localTracks, ...spotifyTracks];

      // Deduplicate
      const trackMap = new Map<string, Track>();
      for (const track of allTracks) {
        if (!track.id) continue;
        const existing = trackMap.get(track.id);
        if (!existing ?? (track.timestamp ?? 0) > (existing.timestamp ?? 0)) {
          trackMap.set(track.id, track);
        }
      }

      const fallbackTracks = Array.from(trackMap.values())
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
        .slice(0, 200);

      
      return fallbackTracks;
    }
  }

  /**
   * Save track to local storage and sync to cloud
   */
  async saveTrackToHistory(track: Track, spotifyUserId: string): Promise<void> {
    if (!track?.id) return;

    try {
      // Save to local storage
      const raw = await AsyncStorage.getItem(RECENTLY_PLAYED_KEY);
      let list: Track[] = raw ? JSON.parse(raw) : [];

      // Remove any existing entry with same id and timestamp
      list = list.filter(
        (t) => !(t.id === track.id && t.timestamp === track.timestamp),
      );

      // Add new track to the front
      list.unshift({ ...track, timestamp: Date.now() });

      // Keep max 200
      if (list.length > 200) list = list.slice(0, 200);

      await AsyncStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(list));

      // Sync to cloud (don't await - do it in background)
      this.syncHistoryToCloud(spotifyUserId).catch((error) => {
        console.error("Background history sync failed:", error);
      });
    } catch (error) {
      console.error("Failed to save track to history:", error);
    }
  }

  /**
   * Manual sync trigger (for user-initiated sync)
   */
  async manualSync(spotifyUserId: string): Promise<void> {
    try {

      await this.syncAllDataToCloud(spotifyUserId);

    } catch (error) {
      console.error("Manual sync failed:", error);
      throw error; // Re-throw so the calling code can handle it
    }
  }

  /**
   * Get sync status for UI
   */
  getSyncStatus(): {
    shieldSyncing: boolean;
    shieldLastSync: number | null;
  } {
    const shieldState = useShieldStore.getState();

    return {
      shieldSyncing: shieldState.isSyncing,
      shieldLastSync: shieldState.lastSyncAt,
    };
  }

  /**
   * Clear all user data (for testing or account deletion)
   */
  async clearAllUserData(spotifyUserId: string): Promise<void> {
    try {
      // Clear cloud data
      await cloudSync.clearUserData(spotifyUserId);

      // Clear local data
      await AsyncStorage.removeItem(RECENTLY_PLAYED_KEY);

      // Reset stores
      useShieldStore.setState({
        sessions: [],
        isSyncing: false,
        lastSyncAt: null,
      });

    } catch (error) {
      console.error("Failed to clear user data:", error);
      throw error;
    }
  }
}

export const dataSync = new DataSyncService();
