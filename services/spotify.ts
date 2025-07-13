import * as AuthSession from "expo-auth-session";
import { Track } from "@/types/track";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/auth";

// This function now just returns the result of makeRedirectUri
export const getSpotifyRedirectUri = () => {
  try {
    // For Expo Go, use a standard URI that will work
    const uri = AuthSession.makeRedirectUri({
      scheme: "streamshield",
      path: "spotify-auth-callback",
    });
    return uri;
  } catch (err) {
    console.error("Error generating redirect URI:", err);
    // Fallback to a simple URI that will work in Expo Go
    return "https://auth.expo.io/@anonymous/expo-app";
  }
};

export const createSpotifyAuthRequest = (
  redirectUri: string,
  clientId: string,
  scopes: string[],
) => {
  return new AuthSession.AuthRequest({
    clientId,
    scopes,
    usePKCE: false,
    redirectUri,
    extraParams: {
      show_dialog: "true",
    },
  });
};

/**
 * Exchanges an authorization code for access and refresh tokens
 * @param code - The authorization code received from Spotify OAuth
 * @param redirectUri - The redirect URI used in the OAuth flow
 * @returns Promise containing the token response from Spotify
 */
export const exchangeCodeForToken = async (
  code: string,
  redirectUri: string,
  codeVerifier: string,
) => {
  try {
    const { data, error } = await supabase.functions.invoke(
      "spotify-token-exchange",
      {
        body: { code, redirectUri, codeVerifier },
      },
    );
    if (error) {
      console.error("Error from Supabase Edge Function:", error);
      throw new Error(error.message ?? "Failed to exchange code for token");
    }
    return data;
  } catch (error) {
    console.error("Error exchanging code for token via Supabase:", error);
    throw error;
  }
};

export const classifyTokenError = (
  error: any,
): {
  type: "network" | "spotify_down" | "revoked" | "invalid_refresh" | "other";
  message: string;
} => {
  if (!error || typeof error !== "object")
    return { type: "other", message: "Unknown error" };
  const msg = (error.message ?? error.toString() ?? "").toLowerCase();
  if (msg.includes("network request failed") || msg.includes("networkerror")) {
    return {
      type: "network",
      message:
        "Could not connect to Spotify. Please check your internet connection and try again.",
    };
  }
  if (msg.includes("5") && msg.includes("spotify")) {
    return {
      type: "spotify_down",
      message: "Spotify is temporarily unavailable. Please try again later.",
    };
  }
  if (
    msg.includes("invalid_grant") ||
    msg.includes("invalid_token") ||
    msg.includes("session expired") ||
    msg.includes("revoked") ||
    msg.includes("the access token expired")
  ) {
    return {
      type: "revoked",
      message:
        "Your Spotify session has expired or access was revoked. Please log in again to continue.",
    };
  }
  if (msg.includes("failed to refresh token")) {
    return {
      type: "invalid_refresh",
      message: "Your Spotify session has expired. Please log in again.",
    };
  }
  return {
    type: "other",
    message: error.message ?? "An unknown error occurred.",
  };
};

/**
 * Handles Spotify API errors gracefully, with automatic token refresh when possible
 * @param error The error to handle
 * @param retryFunction Function to retry after token refresh
 * @returns Promise that resolves with the retry result or rejects with user-friendly error
 */
export const handleSpotifyError = async (
  error: any,
  retryFunction?: () => Promise<any>,
) => {
  const { type, message } = classifyTokenError(error);

  // If it's a token error and we have a retry function, try to refresh and retry
  if ((type === "revoked" || type === "invalid_refresh") && retryFunction) {
    try {
      const { tokens, updateTokens } = useAuthStore.getState();
      if (tokens?.refreshToken) {
        const newTokenData = await refreshAuthToken(tokens.refreshToken);
        if (newTokenData.access_token) {
          updateTokens({
            accessToken: newTokenData.access_token,
            refreshToken: newTokenData.refresh_token ?? tokens.refreshToken,
            expiresIn: newTokenData.expires_in,
            expiresAt: Date.now() + newTokenData.expires_in * 1000,
          });
          // Retry the original function
          return await retryFunction();
        }
      }
    } catch (refreshError) {
      console.error(
        "Token refresh failed during error handling:",
        refreshError,
      );
    }
  }

  // If we get here, we couldn't recover from the error
  throw new Error(message);
};

/**
 * Refreshes an expired access token using a refresh token
 * @param refreshToken - The refresh token to use for getting a new access token
 * @returns Promise containing the new token data from Spotify
 */
export const refreshAuthToken = async (refreshToken: string) => {
  try {
    const { data, error } = await supabase.functions.invoke(
      "spotify-token-refresh",
      {
        body: { refreshToken },
      },
    );
    if (error) {
      console.error("Supabase function error:", error);
      throw new Error(error.message ?? "Token refresh failed");
    }
    if (!data?.access_token) {
      throw new Error("No access token received from refresh");
    }
    return data;
  } catch (error: any) {
    console.error("Token refresh failed:", error);
    
    // Only logout for specific refresh token errors, not network issues
    const errorMessage = error.message?.toLowerCase() ?? "";
    const isRefreshTokenInvalid = 
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      errorMessage.includes("invalid_grant") ||
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      errorMessage.includes("invalid_token") ||
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      errorMessage.includes("revoked") ||
      error.status === 400; // 400 for invalid_grant
    
    // Don't logout for network errors, server errors, or other temporary issues
    const isNetworkError = 
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      errorMessage.includes("network request failed") ||
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      errorMessage.includes("fetch") ||
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      error.status >= 500 ||
      error.status === 0; // Network error
    
    if (isRefreshTokenInvalid && !isNetworkError) {
      try {
        const { logout } = useAuthStore.getState();
        logout();
      } catch (logoutError) {
        console.error("Failed to logout after refresh failure:", logoutError);
      }
    }
    
    throw error;
  }
};

/**
 * Checks if the current token needs to be refreshed (expires within 5 minutes)
 * @returns true if token should be refreshed, false otherwise
 */
export const shouldRefreshToken = () => {
  const { tokens } = useAuthStore.getState();
  if (!tokens?.expiresAt) return false;

  // Refresh if token expires within 5 minutes
  const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
  return tokens.expiresAt <= fiveMinutesFromNow;
};

/**
 * Proactively refreshes the token if it's about to expire
 * @returns Promise that resolves when token is refreshed (or if no refresh needed)
 * @throws Error if refresh fails and user should be logged out
 */
export const refreshTokenIfNeeded = async () => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) {
    throw new Error("No tokens available");
  }

  if (shouldRefreshToken()) {
    if (!tokens.refreshToken) {
      console.error(
        "Attempted to refresh token, but no refresh token is available. Logging out.",
      );
      logout();
      throw new Error(
        "No refresh token available. User has been logged out.",
      );
    }
    try {
      const newTokenData = await refreshAuthToken(tokens.refreshToken);
      if (newTokenData.access_token) {
        updateTokens({
          accessToken: newTokenData.access_token,
          refreshToken: newTokenData.refresh_token ?? tokens.refreshToken,
          expiresIn: newTokenData.expires_in,
          expiresAt: Date.now() + newTokenData.expires_in * 1000,
        });
      }
    } catch (error) {
      console.error("Proactive token refresh failed:", error);
      // Decide if we should log out the user based on the error
      const { type } = classifyTokenError(error);
      if (type === "revoked" || type === "invalid_refresh") {
        logout();
        throw new Error("Session expired. Please log in again.");
      }
      // For other errors, we might not need to log out immediately
    }
  }
};

let rateLimitEnd = 0;

export const isRateLimited = () => {
  return Date.now() < rateLimitEnd;
};
export const getRateLimitSecondsLeft = () => {
  if (!isRateLimited()) return 0;
  return Math.ceil((rateLimitEnd - Date.now()) / 1000);
};

async function spotifyFetchWithRateLimit(url: string, options: RequestInit) {
  if (isRateLimited()) {
    throw new Error(
      `Rate limited. Please wait ${getRateLimitSecondsLeft()} seconds.`,
    );
  }

  const response = await fetch(url, options);

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") ?? "10");
    rateLimitEnd = Date.now() + retryAfter * 1000;
    throw new Error(`Rate limited. Please wait ${retryAfter} seconds.`);
  }

  return response;
}

export const getUserProfile = async (accessToken: string) => {
  try {
    const response = await spotifyFetchWithRateLimit(
      "https://api.spotify.com/v1/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    throw error;
  }
};

export const getUserPlaylists = async () => {
  try {
    const { accessToken } = useAuthStore.getState().tokens ?? {};
    if (!accessToken) {
      throw new Error("Not authenticated for fetching playlists.");
    }

    let allPlaylists: any[] = [];
    let next: string | null = "https://api.spotify.com/v1/me/playlists?limit=50";

    do {
      const response = await spotifyFetchWithRateLimit(next, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      allPlaylists = allPlaylists.concat(data.items);
      next = data.next;
    } while (next);

    return allPlaylists;
  } catch (error) {
    console.error("Failed to get user playlists:", error);
    throw error;
  }
};

export const fetchWithAutoRefresh = async (
  apiCall: (accessToken: string) => Promise<any>,
  tokens: { accessToken: string; refreshToken: string },
  updateTokens: (
    tokens: Partial<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      expiresAt?: number;
    }>,
  ) => void,
  logout: () => void,
) => {
  try {
    await refreshTokenIfNeeded();
    const currentTokens = useAuthStore.getState().tokens;
    if (!currentTokens?.accessToken) throw new Error("Authentication failed");
    return await apiCall(currentTokens.accessToken);
  } catch (error: any) {
    const { type } = classifyTokenError(error);
    if (type === "revoked" || type === "invalid_refresh") {
      try {
        const refreshedTokenData = await refreshAuthToken(tokens.refreshToken);
        updateTokens({
          accessToken: refreshedTokenData.access_token,
          refreshToken:
            refreshedTokenData.refresh_token ?? tokens.refreshToken,
          expiresIn: refreshedTokenData.expires_in,
          expiresAt: Date.now() + refreshedTokenData.expires_in * 1000,
        });
        return await apiCall(refreshedTokenData.access_token);
      } catch (refreshError) {
        const refreshErrorType = classifyTokenError(refreshError).type;
        if (
          refreshErrorType === "revoked" ||
          refreshErrorType === "invalid_refresh"
        ) {
          logout();
        }
        throw refreshError; // Rethrow to be caught by UI layer
      }
    } else {
      throw error; // Rethrow other errors
    }
  }
};

export const getCurrentlyPlaying = async (): Promise<Track | null> => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) return null;

  return fetchWithAutoRefresh(
    async (accessToken: string) => {
      const response = await spotifyFetchWithRateLimit(
        "https://api.spotify.com/v1/me/player/currently-playing",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.status === 204 || !response.ok) {
        return null;
      }
      const data = await response.json();
      if (!data?.item) return null;
      const isPlaying = data.is_playing;
      const track = data.item;

      return {
        id: track.id,
        name: track.name,
        artist: track.artists.map((_artist: any) => _artist.name).join(", "),
        artistId: track.artists[0]?.id,
        album: track.album.name,
        albumId: track.album.id,
        albumArt: track.album.images[0]?.url,
        duration: track.duration_ms,
        isPlaying,
        uri: track.uri,
      };
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const getRecentlyPlayed = async (): Promise<Track[]> => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) return [];

  return fetchWithAutoRefresh(
    async (accessToken: string) => {
      const response = await spotifyFetchWithRateLimit(
        "https://api.spotify.com/v1/me/player/recently-played?limit=50",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok) return [];
      const data = await response.json();
      return (
        data.items?.map(({ track, played_at }: any) => ({
          id: track.id,
          name: track.name,
          artist: track.artists.map((_artist: any) => _artist.name).join(", "),
          artistId: track.artists[0]?.id,
          album: track.album.name,
          albumId: track.album.id,
          albumArt: track.album.images[0]?.url,
          duration: track.duration_ms,
          timestamp: new Date(played_at).getTime(),
          uri: track.uri,
        })) ?? []
      );
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const findUserPlaylist = async (
  playlistName?: string,
  playlistId?: string,
) => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) throw new Error("Not authenticated");

  return fetchWithAutoRefresh(
    async (accessToken: string) => {
      if (playlistId) {
        try {
          const response = await spotifyFetchWithRateLimit(
            `https://api.spotify.com/v1/playlists/${playlistId}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          );
          if (response.ok) return response.json();
          return null;
        } catch {
          return null;
        }
      }

      if (playlistName) {
        const playlists = await getUserPlaylists();
        return playlists.find((p: any) => p.name === playlistName) ?? null;
      }

      return null;
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const createUserPlaylistWithRefresh = async (
  userId: string,
  playlistName: string,
) => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) throw new Error("No tokens for playlist creation");

  return fetchWithAutoRefresh(
    async (refreshedAccessToken) => {
      try {
        console.log(
          `Creating playlist: ${playlistName} for user: ${userId} (with refresh)`,
        );
        const response = await spotifyFetchWithRateLimit(
          `https://api.spotify.com/v1/users/${userId}/playlists`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${refreshedAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: playlistName,
              public: false,
              collaborative: false,
              description: "Tracks to be excluded from recommendations by StreamShield.",
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to create playlist: ${errorData.error?.message ?? "Unknown error"}`,
          );
        }

        return await response.json();
      } catch (error) {
        console.error("Error creating playlist:", error);
        throw error;
      }
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const addTracksToPlaylist = async (
  accessToken: string,
  playlistId: string,
  trackUris: string[],
) => {
  try {
    const response = await spotifyFetchWithRateLimit(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: trackUris }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to add tracks: ${errorData.error?.message ?? "Unknown error"}`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error adding tracks to playlist:", error);
    throw error;
  }
};

export const addTracksToPlaylistBatched = async (
  accessToken: string,
  playlistId: string,
  trackUris: string[],
) => {
  try {
    for (let i = 0; i < trackUris.length; i += 100) {
      const batch = trackUris.slice(i, i + 100);
      await addTracksToPlaylist(accessToken, playlistId, batch);
    }
    return { success: true };
  } catch (error) {
    console.error("Error adding tracks in batch:", error);
    throw error;
  }
};

export const addTrackToPlaylist = async (
  playlistId: string,
  trackUri: string,
) => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) throw new Error("No tokens available to add track");

  return fetchWithAutoRefresh(
    async (refreshedAccessToken) => {
      try {
        const response = await spotifyFetchWithRateLimit(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${refreshedAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uris: [trackUri] }),
          },
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to add track: ${errorData.error?.message ?? "Unknown error"}`,
          );
        }
        return await response.json();
      } catch (error) {
        console.error("Error adding track to playlist:", error);
        throw error;
      }
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const removeTrackFromPlaylistWithRefresh = async (
  playlistId: string,
  trackUri: string,
) => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) throw new Error("No tokens available for track removal");

  return fetchWithAutoRefresh(
    async (refreshedAccessToken) => {
      try {
        const response = await spotifyFetchWithRateLimit(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${refreshedAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tracks: [{ uri: trackUri }],
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to remove track: ${errorData.error?.message ?? "Unknown error"}`,
          );
        }
        return await response.json();
      } catch (error) {
        console.error("Error removing track from playlist:", error);
        throw error;
      }
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const removeTrackFromPlaylist = async (
  playlistId: string,
  trackUri: string,
) => {
  try {
    const { accessToken } = useAuthStore.getState().tokens ?? {};
    if (!accessToken) throw new Error("Not authenticated");

    const response = await spotifyFetchWithRateLimit(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tracks: [{ uri: trackUri }],
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to remove track: ${errorData.error?.message ?? "Unknown error"}`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error removing track from playlist:", error);
    throw error;
  }
};

export const getAlbumTracks = async (
  accessToken: string,
  albumId: string,
): Promise<Track[]> => {
  try {
    const response = await spotifyFetchWithRateLimit(
      `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (
      data.items?.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((_artist: any) => _artist.name).join(", "),
        artistId: track.artists[0]?.id,
        album: data.name, // Album name from album endpoint
        albumId: albumId,
        albumArt: data.images[0]?.url, // Album art from album endpoint
        duration: track.duration_ms,
        uri: track.uri,
      })) ?? []
    );
  } catch (error) {
    console.error(`Error fetching tracks for album ${albumId}:`, error);
    return [];
  }
};

export const getArtistTracks = async (
  accessToken: string,
  artistId: string,
): Promise<Track[]> => {
  try {
    const response = await spotifyFetchWithRateLimit(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (
      data.tracks?.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((_artist: any) => _artist.name).join(", "),
        artistId: artistId,
        album: track.album.name,
        albumId: track.album.id,
        albumArt: track.album.images[0]?.url,
        duration: track.duration_ms,
        uri: track.uri,
      })) ?? []
    );
  } catch (error) {
    console.error(`Error fetching top tracks for artist ${artistId}:`, error);
    return [];
  }
};

export const getAllTracksInPlaylist = async (
  accessToken: string,
  playlistId: string,
) => {
  let allTracks: any[] = [];
  let next: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  while (next) {
    const response = await spotifyFetchWithRateLimit(next, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch playlist tracks");
    }
    const data = await response.json();
    allTracks = allTracks.concat(data.items);
    next = data.next;
  }
  return allTracks;
};

export const getPlaylistTracks = async (
  accessToken: string,
  playlistId: string,
) => {
  return getAllTracksInPlaylist(accessToken, playlistId);
};

export const removeTracksFromPlaylist = async (
  accessToken: string,
  playlistId: string,
  trackUris: string[],
) => {
  try {
    const response = await spotifyFetchWithRateLimit(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tracks: trackUris.map((uri) => ({ uri })),
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to remove tracks: ${errorData.error?.message ?? "Unknown error"}`,
      );
    }
  } catch (error) {
    console.error("Error removing tracks from playlist:", error);
    throw error;
  }
};

export const removeTracksFromPlaylistBatched = async (
  accessToken: string,
  playlistId: string,
  trackUris: string[],
) => {
  try {
    for (let i = 0; i < trackUris.length; i += 100) {
      const batchUris = trackUris.slice(i, i + 100);
      await removeTracksFromPlaylist(accessToken, playlistId, batchUris);
    }
  } catch (error) {
    console.error("Error removing tracks in batch:", error);
    throw error;
  }
};

export const deletePlaylist = async (
  accessToken: string,
  playlistId: string,
) => {
  try {
    const response = await spotifyFetchWithRateLimit(
      `https://api.spotify.com/v1/playlists/${playlistId}/followers`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete playlist: ${response.status} ${errorText}`,
      );
    }
  } catch (error) {
    console.error("Error deleting playlist:", error);
    throw error;
  }
};

const PLAYLIST_PREFIX = "StreamShield Exclusion List";

export const getAllExclusionPlaylists = async (
  accessToken: string,
): Promise<Array<{ id: string; name: string; trackCount: number }>> => {
  try {
    const userPlaylists = await getUserPlaylists(); // This function should be adapted to use the provided accessToken

    const exclusionPlaylists = userPlaylists
      .filter((playlist: any) => playlist?.name?.startsWith(PLAYLIST_PREFIX))
      .map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        trackCount: playlist.tracks?.total ?? 0,
      }))
      .sort((a: any, b: any) => {
        const extractPlaylistNumber = (playlistName: string): number => {
          const match = playlistName.match(/#(\d+)$/);
          return match ? parseInt(match[1], 10) : 1;
        };
        return extractPlaylistNumber(a.name) - extractPlaylistNumber(b.name);
      });

    return exclusionPlaylists;
  } catch (error) {
    console.error("Failed to get exclusion playlists:", error);
    throw error;
  }
};

export async function ensureValidExclusionPlaylist(
  accessToken: string,
  userId: string,
  currentPlaylistId: string | null,
): Promise<string> {
  if (currentPlaylistId) {
    try {
      const playlist = await findUserPlaylist(undefined, currentPlaylistId);
      if (playlist) {
        return currentPlaylistId;
      }
    } catch {
      // Playlist not found, proceed to find/create
    }
  }

  const existingPlaylists = await getAllExclusionPlaylists(accessToken);
  if (existingPlaylists.length > 0) {
    // For simplicity, we'll just use the first one found.
    // Consolidation logic can be handled separately.
    return existingPlaylists[0].id;
  }

  // If no playlist exists, create one.
  const newPlaylist = await createUserPlaylistWithRefresh(
    userId,
    PLAYLIST_PREFIX,
  );
  return newPlaylist.id;
}

export const searchSpotify = async (
  query: string,
  type: "artist" | "album" | "track",
) => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) throw new Error("Not authenticated");

  return fetchWithAutoRefresh(
    async (accessToken: string) => {
      const response = await spotifyFetchWithRateLimit(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query,
        )}&type=${type}&limit=20`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) return null;
      return response.json();
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const getPlaybackState = async (): Promise<{ is_playing: boolean } | null> => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) return null;

  try {
    const state = await fetchWithAutoRefresh(
      async (accessToken: string) => {
        const response = await spotifyFetchWithRateLimit(
          "https://api.spotify.com/v1/me/player",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (response.status === 204) return null; // No active device
        if (!response.ok) throw new Error("Failed to get playback state");
        return response.json();
      },
      tokens,
      updateTokens,
      logout,
    );

    return state ? { is_playing: state.is_playing } : null;
  } catch (error) {
    console.error("Error getting playback state:", error);
    return null;
  }
};

export const togglePlayback = async () => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) throw new Error("Not authenticated");

  return fetchWithAutoRefresh(
    async (accessToken: string) => {
      try {
        const stateResponse = await spotifyFetchWithRateLimit(
          "https://api.spotify.com/v1/me/player",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (stateResponse.status === 204) return; // No active device
        const state = await stateResponse.json();
        const endpoint = state.is_playing ? "/pause" : "/play";

        const response = await spotifyFetchWithRateLimit(
          `https://api.spotify.com/v1/me/player${endpoint}`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!response.ok && response.status !== 204) {
          throw new Error("Failed to toggle playback");
        }
      } catch (error) {
        console.error("Error toggling playback:", error);
        throw error;
      }
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const pausePlayback = async () => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) return;

  await fetchWithAutoRefresh(
    async (accessToken: string) => {
      await spotifyFetchWithRateLimit(
        "https://api.spotify.com/v1/me/player/pause",
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const resumePlayback = async () => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) return;

  await fetchWithAutoRefresh(
    async (accessToken: string) => {
      await spotifyFetchWithRateLimit(
        "https://api.spotify.com/v1/me/player/play",
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const nextTrack = async () => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) return;

  await fetchWithAutoRefresh(
    async (accessToken: string) => {
      await spotifyFetchWithRateLimit(
        "https://api.spotify.com/v1/me/player/next",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const previousTrack = async () => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) return;

  await fetchWithAutoRefresh(
    async (accessToken: string) => {
      await spotifyFetchWithRateLimit(
        "https://api.spotify.com/v1/me/player/previous",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const getAvailableDevices = async (): Promise<SpotifyApi.UserDevice[]> => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) return [];

  return fetchWithAutoRefresh(
    async (accessToken: string) => {
      const response = await spotifyFetchWithRateLimit(
        "https://api.spotify.com/v1/me/player/devices",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.devices ?? [];
    },
    tokens,
    updateTokens,
    logout,
  );
};

export const getDetailedPlaybackState = async (): Promise<{
  is_playing: boolean;
  device?: {
    id: string;
    name: string;
    type: string;
    is_active: boolean;
  };
  item?: any;
} | null> => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) return null;

  try {
    const state = await fetchWithAutoRefresh(
      async (accessToken: string) => {
        const response = await spotifyFetchWithRateLimit(
          "https://api.spotify.com/v1/me/player",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (response.status === 204) return null;
        if (!response.ok) throw new Error("Failed to get playback state");
        return response.json();
      },
      tokens,
      updateTokens,
      logout,
    );

    if (!state) return null;

    return {
      is_playing: state.is_playing,
      device: state.device
        ? {
            id: state.device.id,
            name: state.device.name,
            type: state.device.type,
            is_active: state.device.is_active,
          }
        : undefined,
      item: state.item,
    };
  } catch (error) {
    console.error("Error getting detailed playback state:", error);
    return null;
  }
};

export const transferPlayback = async (
  deviceId: string,
  play: boolean = false,
): Promise<void> => {
  const { tokens, updateTokens, logout } = useAuthStore.getState();
  if (!tokens) return;

  await fetchWithAutoRefresh(
    async (accessToken: string) => {
      await spotifyFetchWithRateLimit(
        "https://api.spotify.com/v1/me/player",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ device_ids: [deviceId], play }),
        },
      );
    },
    tokens,
    updateTokens,
    logout,
  );
};
