import React, { useCallback } from "react";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { useColorScheme } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { useRouter, useSegments } from "expo-router";
import { useThemeStore } from "@/stores/theme";
import { registerBackgroundTasks } from "@/services/ruleManager";
import { SafeAreaView } from "react-native-safe-area-context";
import { themes } from "@/constants/colors";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { initializeSpotifyService } from "@/services/spotify";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Create a client for React Query
const queryClient = new QueryClient();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrating } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated && inAuthGroup) {
      // If the user is authenticated and in the auth group,
      // redirect them to the main app.
      router.replace("/(tabs)");
    } else if (!isAuthenticated && !inAuthGroup) {
      // If the user is not authenticated and not in the auth group,
      // redirect them to the auth group.
      router.replace("/(auth)");
    }
  }, [isAuthenticated, isHydrating, segments, router]);

  // You can return a loading state here while checking for authentication.
  if (isHydrating) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { theme: themePref, colorTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme =
    themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const auth = useAuthStore();

  // Initialize the auth store for Spotify service to avoid circular dependencies
  useEffect(() => {
    initializeSpotifyService(useAuthStore);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      registerBackgroundTasks();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!auth.isAuthenticated || auth.isHydrating) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
          <AuthGuard>
            <SafeAreaView
              style={{ flex: 1, backgroundColor: theme.background }}
            >
              <ExpoStatusBar
                style={effectiveTheme === "dark" ? "light" : "dark"}
              />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="settings" />
              </Stack>
            </SafeAreaView>
          </AuthGuard>
          </QueryClientProvider>
        </trpc.Provider>
    </GestureHandlerRootView>
  );
}
