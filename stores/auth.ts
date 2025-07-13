import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface User {
  id: string;
  displayName: string;
  email: string;
  profileImageUrl: string;
  spotifyId: string;
  subscriptionTier: "free" | "premium" | "pro";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt?: number; // Calculated timestamp when token expires
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updateTokens: (tokens: Partial<AuthTokens>) => void;
  isHydrating: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      tokens: null,
      login: (user, tokens) => {
        // Calculate expiration timestamp
        const expiresAt = Date.now() + tokens.expiresIn * 1000;
        const tokensWithExpiry = { ...tokens, expiresAt };

        set({
          isAuthenticated: true,
          user,
          tokens: tokensWithExpiry,
        });
      },
      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          tokens: null,
        }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      updateTokens: (updates) =>
        set((state) => ({
          tokens: state.tokens ? { ...state.tokens, ...updates } : null,
        })),
      isHydrating: true,
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrating = false;
      },
    },
  ),
);
