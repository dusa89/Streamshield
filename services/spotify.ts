import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { supabase } from "@/lib/supabaseClient";

const sdk = SpotifyApi.withClientCredentials(
  process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!
);

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

export const getUserProfile = async (accessToken: string) => {
  const response = await sdk.currentUser.profile();
  return response;
};

export const getRecentlyPlayed = async (accessToken: string, limit = 50) => {
  try {
    const response = await sdk.currentUser.playbackState({ limit });
    return response.items.map((item) => ({
      track: item.track,
      played_at: item.played_at,
    }));
  } catch (error) {
    console.error("Error fetching recently played tracks:", error);
    throw new Error("Failed to refresh recent tracks");
  }
};

export const createPlaylist = async (accessToken: string, userId: string, name: string) => {
  const response = await sdk.playlists.createPlaylist(userId, { name, public: false });
  return response;
};

export const addToPlaylist = async (accessToken: string, playlistId: string, trackUris: string[]) => {
  await sdk.playlists.addItemsToPlaylist(playlistId, trackUris);
};
