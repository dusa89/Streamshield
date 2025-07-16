import { create } from "zustand";
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Track } from "@/types/track";
import { exchangeSpotifyCode, getUserProfile } from "@/services/spotify";
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

export const useAuthStore = create(devtools(immer(persist((set, get) => ({
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
      if (e.message?.includes('invalid_grant')) {
        set({ tokens: null });
        // Trigger re-login flow
        const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
        await get().login(redirectUri, process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID, scopes);
      }
      console.error("[AuthStore] Token refresh failed:", e);
      logout();
      throw e;
    }
  },
  login: async (redirectUri: string, clientId: string, scopes: string[]) => {
    try {
      const result = await AuthSession.startAsync({
        authUrl: `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes.join(' ')}&code_challenge_method=S256&code_challenge=${process.env.EXPO_PUBLIC_SPOTIFY_CODE_CHALLENGE}`,
        clientId: clientId,
        redirectUri: redirectUri,
        codeVerifier: process.env.EXPO_PUBLIC_SPOTIFY_CODE_VERIFIER,
      });

      if (result.type === 'success') {
        await get().exchangeCodeForToken(result.code, redirectUri, process.env.EXPO_PUBLIC_SPOTIFY_CODE_VERIFIER);
      } else if (result.type === 'error') {
        console.error("Spotify login error:", result.error);
        throw new Error(`Spotify login failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Spotify login error:", error);
      throw error;
    }
  },
}), { name: 'auth-storage' }))));
