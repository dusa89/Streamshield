import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "light" | "dark" | "auto";
export type ColorTheme =
  | "charcoalGold"
  | "classicSpotify"
  | "cyberpunk"
  | "earthTones"
  | "feminineRose"
  | "masculineSteel"
  | "monochrome"
  | "nordicNight"
  | "pastelBlossom"
  | "pastelCitrus"
  | "pastelOcean"
  | "solarizedDark";

interface ThemeState {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
  isHydrating: boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "auto",
      setTheme: (theme) => {
        console.log("Setting theme to:", theme);
        set({ theme });
      },
      colorTheme: "classicSpotify",
      setColorTheme: (colorTheme) => {
        console.log("Setting color theme to:", colorTheme);
        set({ colorTheme });
      },
      isHydrating: true,
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        console.log("Theme store rehydrated:", state);
        if (state) state.isHydrating = false;
      },
    }
  )
); 