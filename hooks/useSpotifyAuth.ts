import { useState, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/auth';

// Register for the redirect
WebBrowser.maybeCompleteAuthSession();

// Spotify configuration
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

// Hard-coded client ID for testing purposes
const CLIENT_ID = "220ee0c4acb841ed9cae6f2823a5ee9b";

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

export const useSpotifyAuth = () => {
  const { user, login, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [redirectUri, setRedirectUri] = useState<string>('');

  // Generate the redirect URI once
  useEffect(() => {
    try {
      // Fixed: Using 'myapp' as the scheme to match app.json configuration
      const uri = AuthSession.makeRedirectUri({
        scheme: 'myapp',
        path: 'spotify-auth-callback',
      });
      console.log("Generated Redirect URI:", uri);
      setRedirectUri(uri);
    } catch (err) {
      console.error("Error generating redirect URI:", err);
      // Fallback to a simple URI that will work in Expo Go
      setRedirectUri('https://auth.expo.io/@anonymous/expo-app');
    }
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!redirectUri) {
        throw new Error("Redirect URI is not ready yet. Please try again.");
      }
      
      // Create a new request with a valid redirectUri
      const request = new AuthSession.AuthRequest({
        clientId: CLIENT_ID,
        scopes,
        // Fixed: Ensure redirectUri is always a string
        redirectUri: redirectUri,
        extraParams: {
          show_dialog: 'true',
        },
      });
      
      const result = await request.promptAsync(discovery);
      
      if (result.type === 'success') {
        // Exchange the code for tokens
        const { code } = result.params;
        
        // In a real app, we would make a server request to exchange the code
        // For this demo, we'll simulate a successful login
        console.log("Auth code received:", code);
        
        // Create a mock user with a properly typed subscriptionTier
        const mockUser = {
          id: "user123",
          displayName: "Demo User",
          email: "user@example.com",
          profileImageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format",
          spotifyId: "spotify_user_123",
          subscriptionTier: "premium" as "free" | "premium" | "pro", // Explicitly type as one of the allowed values
        };
        
        // Store the user in AsyncStorage for persistence
        await AsyncStorage.setItem('user', JSON.stringify(mockUser));
        
        // Update the auth store
        login(mockUser);
        return true;
      } else if (result.type === 'error') {
        console.error("Authentication error:", result.error);
        setError(new Error(result.error?.message || "Authentication failed"));
        return false;
      } else {
        setError(new Error("Authentication was cancelled or failed"));
        return false;
      }
    } catch (err) {
      console.error("Error during login:", err);
      setError(err instanceof Error ? err : new Error("Failed to start authentication"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isLoggedIn: !!user,
    login: handleLogin,
    logout,
    loading,
    error,
    redirectUri,
  };
};