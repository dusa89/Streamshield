import { useAuthStore } from "@/stores/auth";
import { dataSync } from "./dataSync";
import { protectionMechanism } from "./protectionMechanism";

class BackgroundSyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private backupInterval: ReturnType<typeof setInterval> | null = null;
  private consolidationInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[BackgroundSync] Starting background services.");

    // Sync every 15 minutes (was 5 minutes)
    this.syncInterval = setInterval(
      () => {
        this.performBackgroundSync();
      },
      15 * 60 * 1000,
    );

    // Backup every hour (was 30 minutes)
    this.backupInterval = setInterval(
      () => {
        this.performBackgroundBackup();
      },
      60 * 60 * 1000,
    );

    // Consolidate playlists every 24 hours
    this.consolidationInterval = setInterval(
      () => {
        this.performPlaylistConsolidation();
      },
      24 * 60 * 60 * 1000,
    );
  }

  stop() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.backupInterval) clearInterval(this.backupInterval);
    if (this.consolidationInterval) clearInterval(this.consolidationInterval);
    this.syncInterval = null;
    this.backupInterval = null;
    this.consolidationInterval = null;
    this.isRunning = false;
    console.log("[BackgroundSync] Stopped background services.");
  }

  private async performBackgroundSync() {
    const { tokens, user } = useAuthStore.getState();

    if (!tokens?.accessToken || !user) {
      return;
    }

    try {
      // Background sync disabled - blacklist functionality removed
    } catch (error) {
      console.error("Background sync failed:", error);
    }
  }

  private async performBackgroundBackup() {
    const { tokens, user } = useAuthStore.getState();

    if (!tokens?.accessToken || !user) {
      return;
    }

    try {
      await dataSync.syncAllDataToCloud(user.id);
    } catch (error) {
      console.error("Background backup failed:", error);
    }
  }

  private async performPlaylistConsolidation() {
    const { tokens, user } = useAuthStore.getState();

    if (!tokens?.accessToken || !user) {
      console.log("[BackgroundSync] Skipping playlist consolidation, user not logged in.");
      return;
    }

    console.log("[BackgroundSync] Performing scheduled 24-hour playlist consolidation.");
    try {
      await protectionMechanism.consolidatePlaylists(tokens.accessToken, user.id);
    } catch (error) {
      console.error("[BackgroundSync] Scheduled playlist consolidation failed:", error);
    }
  }

  // Trigger immediate sync (disabled - blacklist functionality removed)
  async triggerImmediateSync() {
  }
}

export const backgroundSync = new BackgroundSyncService();
