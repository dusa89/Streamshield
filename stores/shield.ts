import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cloudSync } from "@/services/cloudSync";

interface ShieldSession {
  start: number;
  end: number | null;
}

interface ShieldState {
  isShieldActive: boolean;
  shieldActivatedAt: number | null;
  shieldDuration: number; // in minutes, 0 means unlimited
  isAutoDisableEnabled: boolean;
  autoDisablePresets: number[]; // in minutes, 0 means 'Always On'
  sessions: ShieldSession[];
  isSyncing: boolean;
  lastSyncAt: number | null;
  toggleShield: (spotifyUserId?: string) => Promise<void>;
  setShieldDuration: (duration: number) => void;
  setIsAutoDisableEnabled: (enabled: boolean) => void;
  addAutoDisablePreset: (duration: number) => void;
  deleteAutoDisablePreset: (duration: number) => void;
  isTimestampShielded: (timestamp: number) => boolean;
  setShieldActivatedAt: (timestamp: number) => void;
  hideAutoDisableWarning: boolean;
  setHideAutoDisableWarning: (hide: boolean) => void;
  syncToCloud: (spotifyUserId: string) => Promise<void>;
  loadFromCloud: (spotifyUserId: string) => Promise<void>;
  lastPlaylistCheck: number;
  setLastPlaylistCheck: (timestamp: number) => void;
  lastConsolidation: number;
  setLastConsolidation: (timestamp: number) => void;
  hasRunDuplicateRemovalThisSession: boolean;
  setHasRunDuplicateRemovalThisSession: (hasRun: boolean) => void;
}

const defaultPresets = [30, 60, 120, 240, 0]; // 0 = Always On

export const useShieldStore = create<ShieldState>()(
  persist(
    (set, get) => ({
      isShieldActive: false,
      shieldActivatedAt: null,
      shieldDuration: 60, // default 60 minutes
      isAutoDisableEnabled: true, // enabled by default
      autoDisablePresets: defaultPresets,
      sessions: [],
      hideAutoDisableWarning: false,
      isSyncing: false,
      lastSyncAt: null,
      lastPlaylistCheck: 0,
      lastConsolidation: 0,
      hasRunDuplicateRemovalThisSession: false,
      setHideAutoDisableWarning: (hide) =>
        set({ hideAutoDisableWarning: hide }),
      setLastPlaylistCheck: (timestamp) => set({ lastPlaylistCheck: timestamp }),
      setLastConsolidation: (timestamp) => set({ lastConsolidation: timestamp }),
      setHasRunDuplicateRemovalThisSession: (hasRun) => set({ hasRunDuplicateRemovalThisSession: hasRun }),

      // Cloud sync functions
      syncToCloud: async (spotifyUserId: string) => {
        const state = get();
        set({ isSyncing: true });
        try {
          await cloudSync.syncShieldSessions(spotifyUserId, state.sessions);
          set({ lastSyncAt: Date.now() });
        } catch (error) {
          console.error("Failed to sync shield sessions to cloud:", error);
        } finally {
          set({ isSyncing: false });
        }
      },

      loadFromCloud: async (spotifyUserId: string) => {
        set({ isSyncing: true });
        try {
          const cloudSessions =
            await cloudSync.fetchShieldSessions(spotifyUserId);
          set({
            sessions: cloudSessions,
            lastSyncAt: Date.now(),
          });
        } catch (error) {
          console.error("Failed to load shield sessions from cloud:", error);
        } finally {
          set({ isSyncing: false });
        }
      },

      toggleShield: async (spotifyUserId) => {
        set((state) => {
          if (!state.isShieldActive) {
            // Activating: start a new session
            return {
              isShieldActive: true,
              shieldActivatedAt: Date.now(),
              sessions: [...state.sessions, { start: Date.now(), end: null }],
            };
          } else {
            // Deactivating: end the last session
            const sessions = [...state.sessions];
            if (
              sessions.length > 0 &&
              sessions[sessions.length - 1].end === null
            ) {
              sessions[sessions.length - 1].end = Date.now();
            }
            return {
              isShieldActive: false,
              shieldActivatedAt: null,
              sessions,
            };
          }
        });

        // Sync to cloud if user ID provided
        if (spotifyUserId) {
          await get().syncToCloud(spotifyUserId);
        }
      },
      setShieldDuration: (duration) => set({ shieldDuration: duration }),
      setIsAutoDisableEnabled: (enabled) =>
        set({ isAutoDisableEnabled: enabled }),
      addAutoDisablePreset: (duration) =>
        set((state) => {
          if (state.autoDisablePresets.includes(duration)) {
            return state; // Avoid duplicates
          }
          // Add new preset and sort the list, always put 0 (Always On) at the end
          const newPresets = [...state.autoDisablePresets, duration].filter(
            (v, i, arr) => arr.indexOf(v) === i,
          );
          newPresets.sort((a, b) => (a === 0 ? 1 : b === 0 ? -1 : a - b));
          return { autoDisablePresets: newPresets };
        }),
      deleteAutoDisablePreset: (duration) =>
        set((state) => {
          // Prevent deleting default presets except 0 (Always On)
          if (defaultPresets.includes(duration) && duration !== 0) {
            return state;
          }
          return {
            autoDisablePresets: state.autoDisablePresets.filter(
              (p) => p !== duration,
            ),
          };
        }),
      isTimestampShielded: (timestamp: number) => {
        const sessions = get().sessions;
        return sessions.some((s) =>
          s.end
            ? timestamp >= s.start && timestamp <= s.end
            : timestamp >= s.start,
        );
      },
      setShieldActivatedAt: (timestamp: number) =>
        set({ shieldActivatedAt: timestamp }),
    }),
    {
      name: "shield-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
