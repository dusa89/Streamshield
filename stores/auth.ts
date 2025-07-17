import { create } from "zustand";
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Track } from "@/types/track";
import { exchangeCodeForToken, getUserProfile } from "@/services/spotify";
import { supabase } from "@/lib/supabaseClient";
import * as AuthSession from "expo-auth-session";

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
  logout: () => Promise<void>;
  exchangeCodeForToken: (code: string, redirectUri: string, codeVerifier: string) => Promise<void>;
  updateTokens: (updates: Partial<AuthTokens>) => void;
  setSessionHistory: (history: Track[]) => void;
  setRecentTracks: (tracks: Track[]) => void;
  setUser: (user: User) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoggingIn: (loggingIn: boolean) => void;
  refreshTokens: () => Promise<void>;
  login: (redirectUri: string, clientId: string, scopes: string[]) => Promise<void>;
}

const scopes = ['user-read-playback-state', 'user-modify-playback-state', 'playlist-modify-public', 'playlist-modify-private', 'user-read-recently-played'];

export const useAuthStore = create<AuthState>()(devtools(immer(persist((set, get) => {
  console.log('Auth store creating...');
  return {
    tokens: null,
    user: null,
    sessionHistory: [],
    recentTracks: [],
    isLoggingIn: false,
    isLoggingOut: false,
    isAuthenticated: false,
    isHydrating: true,
  logout: async () => {
    set({ isLoggingOut: true });
    try {
      await supabase.auth.signOut();
      set({ isAuthenticated: false, user: null, tokens: null, sessionHistory: [], recentTracks: [] });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      set({ isLoggingOut: false });
    }
  },
  exchangeCodeForToken: async (code: string, redirectUri: string, codeVerifier: string) => {
    try {
      const tokenData = await exchangeCodeForToken(code, redirectUri, codeVerifier);
      set((state) => {
        state.tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
          expiresAt: Date.now() + tokenData.expires_in * 1000,
        };
      });

      const profile = await getUserProfile(tokenData.access_token);
      set((state) => {
        state.user = {
          id: profile.id,
          displayName: profile.display_name,
          email: profile.email,
          profileImageUrl: profile.images?.[0]?.url ?? '',
          spotifyId: profile.id,
          subscriptionTier: "free", // Default or fetch from somewhere
        };
      });
      set({ isAuthenticated: true });
    } catch (error) {
      console.error("Token exchange error:", error);
      throw error;
    }
  },
  updateTokens: (updates: Partial<AuthTokens>) =>
    set((state) => {
      const newTokens = state.tokens ? { ...state.tokens, ...updates } : null;
      if (newTokens && updates.expiresIn) {
        newTokens.expiresAt = Date.now() + (updates.expiresIn * 1000);
      }
      state.tokens = newTokens;
    }),
  setSessionHistory: (history: Track[]) => set({ sessionHistory: history }),
  setRecentTracks: (tracks: Track[]) => set({ recentTracks: tracks }),
  setUser: (user: User) => set({ user }),
  setAuthenticated: (authenticated: boolean) => set({ isAuthenticated: authenticated }),
  setLoggingIn: (loggingIn: boolean) => set({ isLoggingIn: loggingIn }),
  refreshTokens: async () => {
    const { tokens, updateTokens, logout } = get();
    if (!tokens?.refreshToken) {
      logout();
      throw new Error("No refresh token available");
    }
    try {
      const { data, error } = await supabase.functions.invoke(
        "spotify-token-refresh",
        { body: { refreshToken: tokens.refreshToken } }
      );
      if (error) throw error;
      if (!data?.access_token) throw new Error("No access token received");
      updateTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? tokens.refreshToken,
        expiresIn: data.expires_in,
        expiresAt: Date.now() + (data.expires_in * 1000),
      });
    } catch (e) {
      console.error("[AuthStore] Token refresh failed:", e);
      if ((e as any).message?.includes('invalid_grant')) {
        set({ tokens: null });
        await logout();
      } else {
        throw e;
      }
    }
  },
  login: async (redirectUri: string, clientId: string, scopes: string[]) => {
    // Note: This is a placeholder; main login is handled in useSpotifyAuth.ts. For auto re-login, trigger UI flow instead.
    throw new Error("Login should be triggered via UI for proper PKCE handling");
  },
}), { 
  name: 'auth-storage',
  partialize: (state) => ({
    tokens: state.tokens,
    user: state.user,
    sessionHistory: state.sessionHistory,
    recentTracks: state.recentTracks,
    isAuthenticated: state.isAuthenticated,
  }),
  onRehydrateStorage: () => {
    console.log('Hydration starting');
    return (state, error) => {
      if (error) {
        console.error('Hydration error:', error);
        if (state) {
          set({ tokens: null, user: null, isAuthenticated: false, isHydrating: false });
        }
      } else {
        console.log('Hydration finished');
        if (state) {
          if (state.isAuthenticated && (!state.tokens || !state.tokens.refreshToken)) {
            console.warn('Invalid hydrated state: Authenticated but no valid tokens');
            set({ tokens: null, isAuthenticated: false });
          }
          set({ isHydrating: false });
        }
      }
    };
  },
}));
console.log('Auth store created.');
