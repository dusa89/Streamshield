import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Track } from "@/types/track";
import { exchangeSpotifyCode, getUserProfile } from "@/services/spotify";
import { supabase } from "@/lib/supabaseClient";

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
  exchangeCodeForToken: (code: string, redirectUri: string, codeVerifier: string) => Promise<void>;
  updateTokens: (updates: Partial<AuthTokens>) => void;
  setSessionHistory: (history: Track[]) => void;
  setRecentTracks: (tracks: Track[]) => void;
  setUser: (user: User) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoggingIn: (loggingIn: boolean) => void;
  refreshTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
          const tokenData = await exchangeSpotifyCode(code, redirectUri, codeVerifier);
          set({ tokens: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in,
            expiresAt: Date.now() + tokenData.expires_in * 1000,
          } });

          const profile = await getUserProfile(tokenData.access_token);
          set({ user: {
            id: profile.id,
            displayName: profile.display_name,
            email: profile.email,
            profileImageUrl: profile.images?.[0]?.url ?? '',
            spotifyId: profile.id,
            subscriptionTier: "free", // Default or fetch from somewhere
          }, isAuthenticated: true });
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
          return { tokens: newTokens };
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
          logout();
          throw e;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => async (state, error) => {
        if (error) {
          console.error("[AuthStore] Hydration error:", error);
          return;
        }
        if (!state) return;

        state.isHydrating = true;
        state.isAuthenticated = !!state.user;

        console.log("[AuthStore] Hydrated isAuthenticated:", state.isAuthenticated);

        if (state.isAuthenticated && !state.tokens?.accessToken) {
          console.log("[AuthStore] Tokens missing, attempting refresh");
          try {
            await state.refreshTokens();
            state.isAuthenticated = true;
          } catch (refreshError) {
            console.error("[AuthStore] Failed to refresh tokens:", refreshError);
            state.isAuthenticated = false;
            state.user = null;
            state.tokens = null;
          }
        } else {
          state.isAuthenticated = !!state.user && !!state.tokens?.accessToken;
        }

        state.isHydrating = false;
      },
    },
  ),
);
