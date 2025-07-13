import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cloudSync } from "@/services/cloudSync";
import { UserDevice } from "@/types/track";

export interface TimeRule {
  id: string;
  name: string;
  days: string[];
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export interface DeviceRule {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  enabled: boolean;
  autoShield: boolean; // Whether to automatically activate shield when this device plays
  shieldDuration?: number; // Optional duration in minutes, 0 = unlimited
  // Time scheduling fields
  days: string[]; // Days of the week when this rule applies
  startTime: string; // Start time in 12-hour format (e.g., "9:00 AM")
  endTime: string; // End time in 12-hour format (e.g., "5:00 PM")
  timeEnabled: boolean; // Whether time scheduling is enabled for this device
  device: UserDevice;
}

interface RulesState {
  timeRules: TimeRule[];
  deviceRules: DeviceRule[];
  isSyncing: boolean;
  lastSyncAt: number | null;
  toggleTimeRule: (id: string) => void;
  toggleDeviceRule: (id: string) => void;
  removeTimeRule: (id: string) => void;
  removeDeviceRule: (id: string) => void;
  addTimeRule: (rule: TimeRule) => void;
  addDeviceRule: (rule: DeviceRule) => void;
  editTimeRule: (id: string, updated: Partial<TimeRule>) => void;
  editDeviceRule: (id: string, updated: Partial<DeviceRule>) => void;
  syncToCloud: (spotifyUserId: string) => Promise<void>;
  loadFromCloud: (spotifyUserId: string) => Promise<void>;
}

export const useRulesStore = create<RulesState>()(
  persist(
    (set, get) => ({
      timeRules: [
        {
          id: "time1",
          name: "Work Focus",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          startTime: "9:00 AM",
          endTime: "5:00 PM",
          enabled: true,
        },
        {
          id: "time2",
          name: "Family Time",
          days: ["Saturday", "Sunday"],
          startTime: "10:00 AM",
          endTime: "8:00 PM",
          enabled: false,
        },
      ],
      deviceRules: [
        {
          id: "device1",
          deviceId: "device123",
          deviceName: "Living Room Speaker",
          deviceType: "Smart Speaker",
          enabled: true,
          autoShield: true,
          shieldDuration: 120, // 2 hours
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          startTime: "9:00 AM",
          endTime: "5:00 PM",
          timeEnabled: false,
          device: { id: "device123", name: "Living Room Speaker", type: "Smart Speaker", is_active: false, is_private_session: false, is_restricted: false, volume_percent: null },
        },
        {
          id: "device2",
          deviceId: "device456",
          deviceName: "Kitchen Echo",
          deviceType: "Smart Speaker",
          enabled: false,
          autoShield: false,
          days: ["Saturday", "Sunday"],
          startTime: "10:00 AM",
          endTime: "8:00 PM",
          timeEnabled: false,
          device: { id: "device456", name: "Kitchen Echo", type: "Smart Speaker", is_active: false, is_private_session: false, is_restricted: false, volume_percent: null },
        },
      ],
      isSyncing: false,
      lastSyncAt: null,
      toggleTimeRule: (id) =>
        set((state) => ({
          timeRules: state.timeRules.map((rule) =>
            rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
          ),
        })),
      toggleDeviceRule: (id) =>
        set((state) => ({
          deviceRules: state.deviceRules.map((rule) =>
            rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
          ),
        })),
      removeTimeRule: (id) =>
        set((state) => ({
          timeRules: state.timeRules.filter((rule) => rule.id !== id),
        })),
      removeDeviceRule: (id) =>
        set((state) => ({
          deviceRules: state.deviceRules.filter((rule) => rule.id !== id),
        })),
      addTimeRule: (rule) =>
        set((state) => ({
          timeRules: [...state.timeRules, rule],
        })),
      addDeviceRule: (rule) =>
        set((state) => ({
          deviceRules: [...state.deviceRules, rule],
        })),
      editTimeRule: (id, updated) =>
        set((state) => ({
          timeRules: state.timeRules.map((rule) =>
            rule.id === id ? { ...rule, ...updated } : rule,
          ),
        })),
      editDeviceRule: (id, updated) =>
        set((state) => ({
          deviceRules: state.deviceRules.map((rule) =>
            rule.id === id ? { ...rule, ...updated } : rule,
          ),
        })),
      syncToCloud: async (spotifyUserId: string) => {
        const state = get();
        set({ isSyncing: true });
        try {
          await cloudSync.syncRules(spotifyUserId, state.timeRules, state.deviceRules);
          set({ lastSyncAt: Date.now() });
        } catch (error) {
          console.error("Failed to sync rules to cloud:", error);
        } finally {
          set({ isSyncing: false });
        }
      },
      loadFromCloud: async (spotifyUserId: string) => {
        set({ isSyncing: true });
        try {
          const cloudRules = await cloudSync.fetchRules(spotifyUserId);
          if (cloudRules) {
            set({
              timeRules: cloudRules.timeRules ?? get().timeRules,
              deviceRules: (cloudRules.deviceRules ?? []).map(rule => ({
                ...rule,
                days: [],
                startTime: "9:00 AM",
                endTime: "5:00 PM",
                timeEnabled: false,
                device: {
                  id: rule.deviceId,
                  name: rule.deviceName,
                  type: rule.deviceType,
                  is_active: false,
                  is_private_session: false,
                  is_restricted: false,
                  volume_percent: null,
                },
              })),
              lastSyncAt: Date.now(),
            });
          }
        } catch (error) {
          console.error("Failed to load rules from cloud:", error);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "rules-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
