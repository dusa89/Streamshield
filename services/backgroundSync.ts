import { useAuthStore } from "@/stores/auth";
import { dataSync } from "./dataSync";

class BackgroundSyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private backupInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

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

  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
    this.isRunning = false;
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

  // Trigger immediate sync (disabled - blacklist functionality removed)
  async triggerImmediateSync() {
  }
}

export const backgroundSyncService = new BackgroundSyncService();
