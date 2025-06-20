import { Buffer } from 'buffer';
import * as AuthSession from 'expo-auth-session';

const scopes = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
  'user-library-modify',
  'user-top-read',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-follow-read',
  'user-follow-modify',
  'user-read-recently-played',
];

// Hard-coded client ID for testing purposes
const CLIENT_ID = "220ee0c4acb841ed9cae6f2823a5ee9b";

// This function now just returns the result of makeRedirectUri
export const getSpotifyRedirectUri = () => {
  try {
    // For Expo Go, use a standard URI that will work
    const uri = AuthSession.makeRedirectUri({
      scheme: 'streamshield',
      path: 'spotify-auth-callback',
    });
    console.log("Generated Redirect URI:", uri);
    return uri;
  } catch (err) {
    console.error("Error generating redirect URI:", err);
    // Fallback to a simple URI that will work in Expo Go
    return 'https://auth.expo.io/@anonymous/expo-app';
  }
};

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export const createSpotifyAuthRequest = (redirectUri: string) => {
  return new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    scopes,
    usePKCE: false,
    redirectUri,
    extraParams: {
      show_dialog: 'true',
    }
  });
};

export const exchangeCodeForToken = async (code: string, redirectUri: string) => {
  try {
    // For demo purposes, we'll just return a mock token
    console.log("Code received:", code);
    console.log("Using redirect URI for token exchange:", redirectUri);
    
    // Return mock tokens
    return {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresIn: 3600
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

export const refreshAuthToken = async (refreshToken: string) => {
  try {
    // Return mock refreshed tokens
    return {
      accessToken: "mock-refreshed-access-token",
      refreshToken: refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}