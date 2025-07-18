import { useEffect } from "react";
import { Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";

export default function SpotifyCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
    // After successful token exchange:
    if (tokens) {
      router.replace("/(tabs)");
    }
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Completing Spotify connection...</Text>
    </View>
  );
} 