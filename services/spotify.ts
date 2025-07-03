import * as AuthSession from "expo-auth-session";
import { Track } from "@/types/track";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/auth";

// Backend API base URL - use the same configuration as tRPC
const getBackendBaseUrl = () => {
  // For local development, use localhost
  if (__DEV__) {
    // IMPORTANT: This IP address must be your computer's local network IP
    // so that your phone can connect to the backend server during development.
    return "http://172.25.208.1:3000";
  }
  
  // For production, use your actual backend URL
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  
  // Fallback for development
  return "http://172.25.208.1:3000";
};

const BACKEND_BASE_URL = getBackendBaseUrl();

// This function now just returns the result of makeRedirectUri
export const getSpotifyRedirectUri = () => {
  try {
    // For Expo Go, use a standard URI that will work
    const uri = AuthSession.makeRedirectUri({
      scheme: "streamshield",
      path: "spotify-auth-callback",
    });
    console.log("Generated Redirect URI:", uri);
    return uri;
  } catch (err) {
    console.error("Error generating redirect URI:", err);
    // Fallback to a simple URI that will work in Expo Go
    return "https://auth.expo.io/@anonymous/expo-app";
  }
};

export const createSpotifyAuthRequest = (redirectUri: string, clientId: string, scopes: string[]) => {
  return new AuthSession.AuthRequest({
    clientId,
    scopes,
    usePKCE: false,
    redirectUri,
    extraParams: {
      show_dialog: "true",
    }
  });
};

/**
 * Exchanges an authorization code for access and refresh tokens
 * @param code - The authorization code received from Spotify OAuth
 * @param redirectUri - The redirect URI used in the OAuth flow
 * @returns Promise containing the token response from Spotify
 */
export const exchangeCodeForToken = async (code: string, redirectUri: string, codeVerifier: string) => {
  try {
    console.log("Exchanging code for token via Supabase Edge Function:", code);
    console.log("Using redirect URI:", redirectUri);
    const { data, error } = await supabase.functions.invoke('spotify-token-exchange', {
      body: { code, redirectUri, codeVerifier },
    });
    if (error) {
      console.error("Error from Supabase Edge Function:", error);
      throw new Error(error.message || 'Failed to exchange code for token');
    }
    console.log("Token exchange successful via Supabase");
    return data;
  } catch (error) {
    console.error("Error exchanging code for token via Supabase:", error);
    throw error;
  }
};

export const classifyTokenError = (error: any): {
  type: 'network' | 'spotify_down' | 'revoked' | 'invalid_refresh' | 'other',
  message: string
} => {
  if (!error || typeof error !== 'object') return { type: 'other', message: 'Unknown error' };
  const msg = (error.message || error.toString() || '').toLowerCase();
  if (msg.includes('network request failed') || msg.includes('networkerror')) {
    return { type: 'network', message: 'Could not connect to Spotify. Please check your internet connection and try again.' };
  }
  if (msg.includes('5') && msg.includes('spotify')) {
    return { type: 'spotify_down', message: 'Spotify is temporarily unavailable. Please try again later.' };
  }
  if (msg.includes('invalid_grant') || msg.includes('invalid_token') || msg.includes('session expired') || msg.includes('revoked')) {
    return { type: 'revoked', message: 'Your Spotify session has expired or access was revoked. Please log in again to continue.' };
  }
  if (msg.includes('failed to refresh token')) {
    return { type: 'invalid_refresh', message: 'Your Spotify session has expired. Please log in again.' };
  }
  return { type: 'other', message: error.message || 'An unknown error occurred.' };
};

/**
 * Refreshes an expired access token using a refresh token
 * @param refreshToken - The refresh token to use for getting a new access token
 * @returns Promise containing the new token data from Spotify
 */
export const refreshAuthToken = async (refreshToken: string) => {
  try {
    console.log("Refreshing auth token via Supabase Edge Function...");
    const { data, error } = await supabase.functions.invoke('spotify-token-refresh', {
      body: { refreshToken },
    });
    if (error) {
      throw error;
    }
    console.log("Token refresh successful");
    return data;
  } catch (error: any) {
    // Map error to user-friendly message for network failure
    if (error.message?.includes('Network request failed')) {
      error.message = 'Could not connect to Spotify. Please check your internet connection and try again.';
    }
    throw error;
  }
};

let rateLimitResetTime: number | null = null;

export const isRateLimited = () => {
  return rateLimitResetTime && Date.now() < rateLimitResetTime;
};

export const getRateLimitSecondsLeft = () => {
  return rateLimitResetTime ? Math.max(0, Math.ceil((rateLimitResetTime - Date.now()) / 1000)) : 0;
};

async function spotifyFetchWithRateLimit(url: string, options: RequestInit) {
  if (rateLimitResetTime && Date.now() < rateLimitResetTime) {
    const retryAfter = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
    throw { isRateLimit: true, retryAfter };
  }
  const response = await fetch(url, options);
  if (response.status === 429) {
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 5;
    rateLimitResetTime = Date.now() + retryAfter * 1000;
    throw { isRateLimit: true, retryAfter };
  }
  return response;
}

/**
 * Gets the current user's profile from Spotify API
 * @param accessToken - The valid access token for authentication
 * @returns Promise containing the user profile data from Spotify
 */
export const getUserProfile = async (accessToken: string) => {
  try {
    console.log("Fetching user profile");
    
    const response = await spotifyFetchWithRateLimit('https://api.spotify.com/v1/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch user profile');
    }

    const userData = await response.json();
    console.log("User profile fetched successfully");
    return userData;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// Helper to handle token refresh and retry
export const fetchWithAutoRefresh = async (
  apiCall: (accessToken: string) => Promise<any>,
  tokens: { accessToken: string; refreshToken: string },
  updateTokens: (tokens: Partial<{ accessToken: string; refreshToken: string; expiresIn: number; expiresAt?: number }>) => void,
  refreshAuthToken: (refreshToken: string) => Promise<any>
) => {
  try {
    return await apiCall(tokens.accessToken);
  } catch (error: any) {
    // If rate limit error, rethrow so UI can handle it
    if (error && error.isRateLimit) {
      throw error;
    }
    if (error.message && error.message.toLowerCase().includes("token expired")) {
      try {
      // Try to refresh the token
      const newTokenData = await refreshAuthToken(tokens.refreshToken);
      if (newTokenData.access_token) {
        updateTokens({
          accessToken: newTokenData.access_token,
          refreshToken: newTokenData.refresh_token || tokens.refreshToken,
          expiresIn: newTokenData.expires_in,
          expiresAt: Date.now() + newTokenData.expires_in * 1000,
        });
        // Retry the API call with the new token
        return await apiCall(newTokenData.access_token);
      } else {
        throw new Error("Failed to refresh token");
        }
      } catch (refreshError: any) {
        // Bubble up the refresh error for user-facing handling
        throw refreshError;
      }
    }
    throw error;
  }
};

/**
 * Gets the currently playing track from Spotify API
 * @param accessToken - The valid access token for authentication
 * @returns Promise containing the currently playing track or null if nothing is playing
 */
export const getCurrentlyPlaying = async (accessToken: string): Promise<Track | null> => {
  const { tokens, updateTokens } = useAuthStore.getState();
  return fetchWithAutoRefresh(
    async (token) => {
    console.log("Fetching currently playing track");
    const response = await spotifyFetchWithRateLimit('https://api.spotify.com/v1/me/player/currently-playing', {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
      if (response.status === 401) {
        throw new Error('The access token expired');
      }
    if (!response.ok) {
      // Try to parse error response, but handle cases where it might not be valid JSON
      let errorMessage = 'Failed to fetch currently playing track';
      try {
      const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (parseError) {
        console.warn("Could not parse error response as JSON:", parseError);
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    // Check if response has content before trying to parse JSON
    const responseText = await response.text();
    if (!responseText.trim()) {
      console.log("Empty response from Spotify API");
      return null;
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", parseError);
      throw new Error("Invalid response from Spotify API");
    }
    
    if (!data.item) {
      console.log("No track currently playing");
      return null;
    }
    const track: Track = {
      id: data.item.id,
      name: data.item.name,
      artist: data.item.artists.map((artist: any) => artist.name).join(', '),
      artistId: data.item.artists[0]?.id,
      album: data.item.album.name,
      albumId: data.item.album.id,
      albumArt: data.item.album.images[0]?.url || '',
      duration: data.item.duration_ms,
    };
    console.log("Currently playing track fetched successfully:", track.name);
    return track;
    },
    tokens!,
    updateTokens,
    refreshAuthToken
  );
};

/**
 * Gets the recently played tracks from Spotify API
 * @param accessToken - The valid access token for authentication
 * @returns Promise containing an array of recently played tracks
 */
export const getRecentlyPlayed = async (accessToken: string): Promise<Track[]> => {
  const { tokens, updateTokens } = useAuthStore.getState();
  return fetchWithAutoRefresh(
    async (token) => {
    console.log("Fetching recently played tracks");
    const response = await spotifyFetchWithRateLimit('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
      if (response.status === 401) {
        throw new Error('The access token expired');
      }
    if (!response.ok) {
      // Try to parse error response, but handle cases where it might not be valid JSON
      let errorMessage = 'Failed to fetch recently played tracks';
      try {
      const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (parseError) {
        console.warn("Could not parse error response as JSON:", parseError);
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    // Check if response has content before trying to parse JSON
    const responseText = await response.text();
    if (!responseText.trim()) {
      console.log("Empty response from Spotify API");
      return [];
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", parseError);
      throw new Error("Invalid response from Spotify API");
    }
    
    const tracks: Track[] = data.items.map((item: any) => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists.map((artist: any) => artist.name).join(', '),
      artistId: item.track.artists[0]?.id,
      album: item.track.album.name,
      albumId: item.track.album.id,
      albumArt: item.track.album.images[0]?.url || '',
      duration: item.track.duration_ms,
        timestamp: new Date(item.played_at).getTime(),
    }));
    console.log(`Recently played tracks fetched successfully: ${tracks.length} tracks`);
    return tracks;
    },
    tokens!,
    updateTokens,
    refreshAuthToken
  );
};

/**
 * Finds a user's playlist by name or ID
 * @param accessToken - The valid access token for authentication
 * @param playlistName - (Optional) The name of the playlist to search for
 * @param playlistId - (Optional) The ID of the playlist to fetch directly
 * @returns Promise containing the playlist object if found, null otherwise
 */
export const findUserPlaylist = async (
  accessToken: string,
  playlistName?: string,
  playlistId?: string
) => {
  try {
    if (playlistId) {
      // Fetch playlist by ID
      const response = await spotifyFetchWithRateLimit(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch playlist by ID');
      }
      const playlist = await response.json();
      return playlist;
    }
    if (!playlistName) throw new Error('Must provide playlistName or playlistId');
    // Search by name (original logic)
    const response = await spotifyFetchWithRateLimit('https://api.spotify.com/v1/me/playlists?limit=50', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch user playlists');
    }
    const data = await response.json();
    const playlist = data.items.find((playlist: any) => playlist.name === playlistName);
    return playlist || null;
  } catch (error) {
    console.error("Error finding user playlist:", error);
    throw error;
  }
};

/**
 * Creates a new playlist for the user
 * @param accessToken - The valid access token for authentication
 * @param userId - The Spotify user ID
 * @param playlistName - The name for the new playlist
 * @returns Promise containing the newly created playlist object
 */
export const createUserPlaylist = async (accessToken: string, userId: string, playlistName: string) => {
  try {
    console.log(`Creating playlist: ${playlistName} for user: ${userId}`);
    const response = await spotifyFetchWithRateLimit(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: playlistName,
        public: false,
        collaborative: false,
        description: "A private playlist for StreamShield to protect your recommendations."
      }),
    });
    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {}
      const errorMsg = `Failed to create playlist. Status: ${response.status} ${response.statusText}. Body: ${errorBody}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    const playlist = await response.json();
    console.log(`Playlist created successfully: ${playlistName} with ID: ${playlist.id}`);
    return playlist;
  } catch (error) {
    console.error("Error creating user playlist:", error);
    throw error;
  }
};

/**
 * Adds a track to a playlist
 * @param accessToken - The valid access token for authentication
 * @param playlistId - The ID of the playlist to add the track to
 * @param trackUri - The Spotify URI of the track to add
 * @returns Promise containing the response from Spotify API
 */
export const addTrackToPlaylist = async (accessToken: string, playlistId: string, trackUri: string) => {
  try {
    console.log(`Adding track ${trackUri} to playlist ${playlistId}`);
    
    const response = await spotifyFetchWithRateLimit(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: [trackUri]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to add track to playlist');
    }

    const result = await response.json();
    console.log(`Track added successfully to playlist ${playlistId}`);
    return result;
  } catch (error) {
    console.error("Error adding track to playlist:", error);
    throw error;
  }
};

/**
 * Removes a track from a playlist
 * @param accessToken - The valid access token for authentication
 * @param playlistId - The ID of the playlist to remove the track from
 * @param trackUri - The Spotify URI of the track to remove
 * @returns Promise containing the response from Spotify API
 */
export const removeTrackFromPlaylist = async (accessToken: string, playlistId: string, trackUri: string) => {
  try {
    console.log(`Removing track ${trackUri} from playlist ${playlistId}`);
    const response = await spotifyFetchWithRateLimit(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tracks: [{ uri: trackUri }]
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to remove track from playlist');
    }
    const result = await response.json();
    console.log(`Track removed successfully from playlist ${playlistId}`);
    return result;
  } catch (error) {
    console.error("Error removing track from playlist:", error);
    throw error;
  }
};

/**
 * Gets all tracks from an album
 * @param accessToken - The valid access token for authentication
 * @param albumId - The Spotify album ID
 * @returns Promise containing an array of Track objects
 */
export const getAlbumTracks = async (accessToken: string, albumId: string): Promise<Track[]> => {
  try {
    const response = await spotifyFetchWithRateLimit(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch album tracks');
    }
    const data = await response.json();
    // Note: The album endpoint returns simplified track objects, so we map to our Track type as best as possible
    return data.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      artist: item.artists.map((artist: any) => artist.name).join(', '),
      album: item.album?.name || '',
      albumArt: item.album?.images?.[0]?.url || '',
      duration: item.duration_ms,
    }));
  } catch (error) {
    console.error('Error fetching album tracks:', error);
    throw error;
  }
};

/**
 * Gets all tracks from an artist (fetches top tracks for simplicity)
 * @param accessToken - The valid access token for authentication
 * @param artistId - The Spotify artist ID
 * @returns Promise containing an array of Track objects
 */
export const getArtistTracks = async (accessToken: string, artistId: string): Promise<Track[]> => {
  try {
    // We'll use the artist's top tracks endpoint for simplicity
    const response = await spotifyFetchWithRateLimit(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch artist tracks');
    }
    const data = await response.json();
    return data.tracks.map((item: any) => ({
      id: item.id,
      name: item.name,
      artist: item.artists.map((artist: any) => artist.name).join(', '),
      album: item.album?.name || '',
      albumArt: item.album?.images?.[0]?.url || '',
      duration: item.duration_ms,
    }));
  } catch (error) {
    console.error('Error fetching artist tracks:', error);
    throw error;
  }
};

/**
 * Fetches all tracks from a playlist, handling pagination (max 100 per request)
 * @param accessToken - The valid access token for authentication
 * @param playlistId - The ID of the playlist to fetch tracks from
 * @returns Promise containing an array of track objects (raw Spotify API format)
 */
export const getAllTracksInPlaylist = async (accessToken: string, playlistId: string) => {
  let allTracks: any[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  while (nextUrl) {
    const response = await spotifyFetchWithRateLimit(nextUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch playlist tracks');
    }
    const data = await response.json();
    allTracks = allTracks.concat(data.items);
    nextUrl = data.next;
  }
  return allTracks;
};

export const findUserPlaylistWithRefresh = async (playlistName?: string, playlistId?: string) => {
  const { tokens, updateTokens } = useAuthStore.getState();
  if (!tokens) throw new Error('No Spotify tokens available');
  return fetchWithAutoRefresh(
    (accessToken) => findUserPlaylist(accessToken, playlistName, playlistId),
    tokens,
    updateTokens,
    refreshAuthToken
  );
};

export const createUserPlaylistWithRefresh = async (userId: string, playlistName: string) => {
  const { tokens, updateTokens } = useAuthStore.getState();
  if (!tokens) throw new Error('No Spotify tokens available');
  return fetchWithAutoRefresh(
    (accessToken) => createUserPlaylist(accessToken, userId, playlistName),
    tokens,
    updateTokens,
    refreshAuthToken
  );
};

export const addTrackToPlaylistWithRefresh = async (playlistId: string, trackUri: string) => {
  const { tokens, updateTokens } = useAuthStore.getState();
  if (!tokens) throw new Error('No Spotify tokens available');
  return fetchWithAutoRefresh(
    (accessToken) => addTrackToPlaylist(accessToken, playlistId, trackUri),
    tokens,
    updateTokens,
    refreshAuthToken
  );
};

export const removeTrackFromPlaylistWithRefresh = async (playlistId: string, trackUri: string) => {
  const { tokens, updateTokens } = useAuthStore.getState();
  if (!tokens) throw new Error('No Spotify tokens available');
  return fetchWithAutoRefresh(
    (accessToken) => removeTrackFromPlaylist(accessToken, playlistId, trackUri),
    tokens,
    updateTokens,
    refreshAuthToken
  );
};