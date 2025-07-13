import { useState, useEffect } from "react";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "@/stores/auth";
import { exchangeCodeForToken, getUserProfile } from "@/services/spotify";
import { protectionMechanism } from "@/services/protectionMechanism";

// Register for the redirect
WebBrowser.maybeCompleteAuthSession();

// Spotify configuration
const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

// Use expo-constants to get the client ID from app.json for standalone builds
const CLIENT_ID =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? "";

const scopes = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-library-read",
  "user-library-modify",
  "user-top-read",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-follow-read",
  "user-follow-modify",
  "user-read-recently-played",
];

/**
 * Custom React hook for handling Spotify authentication in the app.
 * - Manages login, logout, loading state, error state, and redirect URI.
 * - Handles the OAuth flow with Spotify and stores user info and tokens.
 *
 * @returns {
 *   isLoggedIn: boolean, // Whether the user is logged in
 *   login: () => Promise<boolean>, // Function to start the login flow
 *   logout: () => void, // Function to log out the user
 *   loading: boolean, // Whether an auth operation is in progress
 *   error: Error | null, // Any error encountered during auth
 *   redirectUri: string // The redirect URI for Spotify OAuth
 * }
 */
export const useSpotifyAuth = () => {
  const { user, login, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [redirectUri, setRedirectUri] = useState<string>("");
  const [authRequestUrl, setAuthRequestUrl] = useState<string>("");

  // Generate the redirect URI and AuthRequest URL once
  useEffect(() => {
    const uri = AuthSession.makeRedirectUri({
      scheme: "myapp",
      path: "spotify-auth-callback",
    });
    setRedirectUri(uri);
    // Create a request to get the URL for debugging
    const request = new AuthSession.AuthRequest({
      clientId: CLIENT_ID,
      scopes,
      redirectUri: uri,
      extraParams: { show_dialog: "true" },
    });
    setAuthRequestUrl(request.url ?? "");
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
        redirectUri: redirectUri,
        extraParams: {
          show_dialog: "true",
        },
      });

      const result = await request.promptAsync(discovery);

      if (result.type === "success") {
        // Extract the authorization code from the response
        const { code } = result.params;

        try {
          // Exchange the code for tokens using our backend
          if (!request.codeVerifier) {
            throw new Error(
              "PKCE code verifier is missing from the AuthRequest. Cannot complete login.",
            );
          }
          const tokenResponse = await exchangeCodeForToken(
            code,
            redirectUri,
            request.codeVerifier,
          );

          // Extract token data from the response
          const { access_token, refresh_token, expires_in } = tokenResponse;

          if (!access_token || !refresh_token || !expires_in) {
            throw new Error("Invalid token response from Spotify");
          }

          try {
            // Get the user's Spotify profile using the access token
            const spotifyProfile = await getUserProfile(access_token);

            // Construct our User object from Spotify profile data
            const user: any = {
              id: spotifyProfile.id,
              displayName: spotifyProfile.display_name ?? "Spotify User",
              email: spotifyProfile.email ?? "",
              profileImageUrl: spotifyProfile.images?.[0]?.url ?? "",
              spotifyId: spotifyProfile.id,
              subscriptionTier: "free" as const, // Default to free for now
            };

            // Create tokens object
            const tokens = {
              accessToken: access_token,
              refreshToken: refresh_token,
              expiresIn: expires_in,
            };

            // Call the login function with user and tokens
            login(user, tokens);

            // Initialize the protection mechanism
            try {
              await protectionMechanism.initialize(access_token, user.id);
            } catch (initError) {
              console.error(
                "Failed to initialize protection mechanism:",
                initError,
              );
              // Don't fail the login if protection mechanism initialization fails
            }

            return true;
          } catch (profileError) {
            console.error("Error fetching user profile:", profileError);
            throw new Error("Failed to fetch user profile from Spotify");
          }
        } catch (tokenError) {
          console.error("Error exchanging code for tokens:", tokenError);
          throw new Error("Failed to exchange authorization code for tokens");
        }
      } else if (result.type === "error") {
        console.error("Authentication error:", result.error);
        setError(new Error(result.error?.message ?? "Authentication failed"));
        return false;
      } else {
        setError(new Error("Authentication was cancelled or failed"));
        return false;
      }
    } catch (err) {
      console.error("Error during login:", err);
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to start authentication"),
      );
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
    authRequestUrl,
  };
};
