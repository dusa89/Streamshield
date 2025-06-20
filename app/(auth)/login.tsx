import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield } from 'lucide-react-native';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import * as Clipboard from 'expo-clipboard';

export default function LoginScreen() {
  const { login, loading, error, redirectUri } = useSpotifyAuth();

  const handleCopyUri = async () => {
    if (redirectUri) {
      await Clipboard.setStringAsync(redirectUri);
      alert('Redirect URI copied to clipboard!');
    }
  };

  return (
    <LinearGradient
      colors={['#1DB954', '#191414']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Shield size={80} color="#FFFFFF" />
          <Text style={styles.appName}>StreamShield</Text>
        </View>
        
        <Text style={styles.tagline}>
          Protect your music taste profile
        </Text>
        
        <Pressable 
          style={styles.loginButton}
          onPress={login} 
          disabled={loading || !redirectUri}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Log in with Spotify</Text>
          )}
        </Pressable>

        {error && (
          <Text style={styles.errorText}>
            Error: {error.message || 'An unknown error occurred.'}
          </Text>
        )}

        {/* Display the redirect URI */}
        <View style={styles.uriContainer}>
          <Text style={styles.uriLabel}>Your Redirect URI for this session:</Text>
          <Text style={styles.uriText} selectable>{redirectUri || 'Generating...'}</Text>
          <Pressable 
            style={styles.copyButton} 
            onPress={handleCopyUri} 
            disabled={!redirectUri}
          >
            <Text style={styles.copyButtonText}>Copy URI</Text>
          </Pressable>
        </View>
        
        <Text style={styles.instructions}>
          IMPORTANT: Copy this URI and add it to your Spotify Developer Dashboard under "Redirect URIs" in your app settings.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 16,
  },
  tagline: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 40,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: "center",
    width: "80%",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#191414",
    fontSize: 18,
    fontWeight: "600",
  },
  errorText: {
    color: "#FFCCCC",
    marginTop: 20,
    textAlign: "center",
    padding: 10,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 5,
    width: "90%",
  },
  uriContainer: {
    marginTop: 40,
    padding: 15,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 10,
    width: "95%",
    alignItems: "center",
  },
  uriLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 10,
  },
  uriText: {
    color: "#1DB954",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 5,
    width: "100%",
  },
  copyButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  copyButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  instructions: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    width: "90%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 10,
    borderRadius: 5,
  }
});