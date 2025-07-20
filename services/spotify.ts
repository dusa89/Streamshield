import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { supabase } from "@/lib/supabaseClient";

let sdk; // Global SDK instance

export const initializeSpotifyService = (authStore) => {
  const tokens = authStore.getState().tokens;
  if (tokens && tokens.accessToken && tokens.expiresIn && tokens.refreshToken) {
    const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
    const tokenObj = {
      access_token: tokens.accessToken,
      token_type: 'Bearer',
      expires_in: tokens.expiresIn,
      refresh_token: tokens.refreshToken,
    };
    sdk = SpotifyApi.withAccessToken(clientId, tokenObj);
    console.log("[SpotifyService] SDK initialized successfully");
  } else {
    console.warn("[SpotifyService] Skipping initialization - missing token fields");
  }
};

export const exchangeSpotifyCode = async (
  code: string,
  redirectUri: string,
  codeVerifier: string
) => {
  const { data, error } = await supabase.functions.invoke("spotify-token-exchange", {
    body: { code, redirectUri, codeVerifier },
  });
  if (error) throw error;
  return data;
};

export const getUserProfile = async () => {
  if (!sdk) throw new Error("Spotify SDK not initialized");
  try {
    const response = await sdk.currentUser.profile();
    return response;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

export const getRecentlyPlayed = async (limit = 50) => {
  if (!sdk) throw new Error("Spotify SDK not initialized");
  try {
    const response = await sdk.player.getRecentlyPlayedTracks(limit);
    return response.items.map((item) => ({
      track: item.track,
      played_at: item.played_at,
    }));
  } catch (error) {
    console.error("Error fetching recently played tracks:", error);
    throw new Error("Failed to refresh recent tracks");
  }
};

export const createPlaylist = async (userId: string, name: string) => {
  if (!sdk) throw new Error("Spotify SDK not initialized");
  try {
    const response = await sdk.playlists.createPlaylist(userId, { name, public: false });
    return response;
  } catch (error) {
    console.error("Error creating playlist:", error);
    throw error;
  }
};

export const addToPlaylist = async (playlistId: string, trackUris: string[]) => {
  if (!sdk) throw new Error("Spotify SDK not initialized");
  try {
    await sdk.playlists.addItemsToPlaylist(playlistId, trackUris);
  } catch (error) {
    console.error("Error adding to playlist:", error);
    throw error;
  }
};
