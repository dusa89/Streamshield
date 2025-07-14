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
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: number;
  } | null;
  user: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
  } | null;
  sessionHistory: Track[];
  recentTracks: Track[]; // New: Centralized cache for recent tracks
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  login: (redirectUri: string, clientId: string, scopes: string[]) => Promise<void>;
  logout: () => Promise<void>;
  exchangeCodeForToken: (code: string, redirectUri: string) => Promise<void>;
  updateTokens: (newTokens: Partial<AuthState['tokens']>) => void;
  setSessionHistory: (history: Track[]) => void;
  setRecentTracks: (tracks: Track[]) => void; // New: Action to update recent tracks
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
      setRecentTracks: (tracks) => set({ recentTracks: tracks }),
      isHydrating: true,
      recentTracks: [],
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
