import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ShieldSession {
  start: number;
  end: number | null;
}

interface ShieldState {
  isShieldActive: boolean;
  shieldActivatedAt: number | null;
  shieldDuration: number; // in minutes
  defaultShieldDuration: number; // new
  isAutoDisableEnabled: boolean;
  resetDurationOnDeactivation: boolean; // new
  autoDisablePresets: number[]; // in minutes, 0 means 'Never'
  sessions: ShieldSession[];
  toggleShield: () => void;
  setShieldDuration: (duration: number) => void;
  setDefaultShieldDuration: (duration: number) => void; // new
  setIsAutoDisableEnabled: (enabled: boolean) => void;
  setResetDurationOnDeactivation: (enabled: boolean) => void; // new
  addAutoDisablePreset: (duration: number) => void;
  deleteAutoDisablePreset: (duration: number) => void;
  isTimestampShielded: (timestamp: number) => boolean;
}

const defaultPresets = [30, 60, 120, 240];

export const useShieldStore = create<ShieldState>()(
  persist(
    (set, get) => ({
      isShieldActive: false,
      shieldActivatedAt: null,
      shieldDuration: 720, // Default to 12 hours (12 * 60)
      defaultShieldDuration: 720, // New default preset
      isAutoDisableEnabled: true, // enabled by default
      resetDurationOnDeactivation: true, // New persistence setting
      autoDisablePresets: defaultPresets,
      sessions: [],
      toggleShield: () => {
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
            if (sessions.length > 0 && sessions[sessions.length - 1].end === null) {
              sessions[sessions.length - 1].end = Date.now();
            }
            const shouldReset = get().resetDurationOnDeactivation;
            const defaultDuration = get().defaultShieldDuration;
            return {
              isShieldActive: false,
              shieldActivatedAt: null,
              sessions,
              shieldDuration: shouldReset ? defaultDuration : state.shieldDuration,
            };
          }
        });
      },
      setShieldDuration: (duration) => set({ shieldDuration: duration }),
      setDefaultShieldDuration: (duration) => set({ defaultShieldDuration: duration }),
      setIsAutoDisableEnabled: (enabled) => set({ isAutoDisableEnabled: enabled }),
      setResetDurationOnDeactivation: (enabled) => set({ resetDurationOnDeactivation: enabled }),
      addAutoDisablePreset: (duration) =>
        set((state) => {
          if (state.autoDisablePresets.includes(duration)) {
            return state; // Avoid duplicates
          }
          // Add new preset and sort the list
          const newPresets = [...state.autoDisablePresets, duration].sort((a, b) => a - b);
          return { autoDisablePresets: newPresets };
        }),
      deleteAutoDisablePreset: (duration) =>
        set((state) => {
          const newPresets = state.autoDisablePresets.filter((d) => d !== duration);
          return { autoDisablePresets: newPresets };
        }),
      isTimestampShielded: (timestamp) => {
        const { isShieldActive, shieldActivatedAt } = get();
        return (
          isShieldActive &&
          shieldActivatedAt !== null &&
          timestamp >= shieldActivatedAt
        );
      },
    }),
    {
      name: "shield-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);