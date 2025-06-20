import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ShieldState {
  isShieldActive: boolean;
  shieldActivatedAt: number | null;
  shieldDuration: number; // in minutes
  toggleShield: () => void;
  setShieldDuration: (duration: number) => void;
}

export const useShieldStore = create<ShieldState>()(
  persist(
    (set) => ({
      isShieldActive: false,
      shieldActivatedAt: null,
      shieldDuration: 60, // default 60 minutes
      toggleShield: () => 
        set((state) => ({
          isShieldActive: !state.isShieldActive,
          shieldActivatedAt: !state.isShieldActive ? Date.now() : null,
        })),
      setShieldDuration: (duration) => set({ shieldDuration: duration }),
    }),
    {
      name: "shield-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);