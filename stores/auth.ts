import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Track } from "@/types/track";

export interface User {
  id: string;
  displayName: string;
  email: string;
  profileImageUrl: string;
  spotifyId: string;
  subscriptionTier: "free" | "premium" | "pro";
  avatarUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt?: number; // Calculated timestamp when token expires
}

interface AuthState {
  tokens: AuthTokens | null;
  user: User | null;
  sessionHistory: Track[];
  recentTracks: Track[];
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (redirectUri: string, clientId: string, scopes: string[]) => Promise<void>;
  logout: () => Promise<void>;
  exchangeCodeForToken: (code: string, redirectUri: string) => Promise<void>;
  updateTokens: (updates: Partial<AuthTokens>) => void;
  setSessionHistory: (history: Track[]) => void;
  setRecentTracks: (tracks: Track[]) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tokens: null,
      user: null,
      sessionHistory: [],
      recentTracks: [],
      isLoggingIn: false,
      isLoggingOut: false,
      isAuthenticated: false,
      isHydrating: true,
      login: async (redirectUri, clientId, scopes) => {
        // Implementation...
      },
      logout: async () => {
        set({ isAuthenticated: false, user: null, tokens: null });
      },
      exchangeCodeForToken: async (code, redirectUri) => {
        // Add implementation if missing
      },
      updateTokens: (updates: Partial<AuthTokens>) =>
        set((state) => ({
          tokens: state.tokens ? { ...state.tokens, ...updates } : null,
        })),
      setSessionHistory: (history: Track[]) => set({ sessionHistory: history }),
      setRecentTracks: (tracks: Track[]) => set({ recentTracks: tracks }),
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
