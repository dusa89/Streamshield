import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { themes } from "@/constants/colors";

export type ThemeName = "auto" | "light" | "dark";
export type ColorTheme = keyof typeof themes;

export enum ThemePreference {
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark',
}

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
  isHydrating: boolean;
  _setHydrating: (isHydrating: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "auto",
      colorTheme: "pastelCitrus",
      setTheme: (theme) => set({ theme }),
      setColorTheme: (colorTheme) => {
        set({ colorTheme });
      },
      isHydrating: true,
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrating = false;
      },
    },
  ),
);
