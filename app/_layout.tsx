import React from "react";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
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
import { useAuthStore } from "@/stores/auth";
import { initializeSpotifyService } from "@/services/spotify";
import { ActivityIndicator } from "react-native";
import ErrorBoundary from "react-native-error-boundary";

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
  const router = useRouter();
  const [segments] = useSegments();
  // Use optional chaining to handle brief undefined from useSegments()
  const inAuthGroup = segments?.[0] === "(auth)";

  // Debug log to track auth guard state and redirect triggers
  console.log("AuthGuard debug: isAuthenticated", isAuthenticated, "isHydrating", isHydrating, "segments", segments, "inAuthGroup", inAuthGroup);

  useEffect(() => {
    if (isHydrating || !segments) return;

    // Only redirect if we have valid segments and the conditions are met
    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)");
    }
  }, [isAuthenticated, isHydrating, segments, router]);

  // Show spinner if hydrating or segments undefined
  if (isHydrating || !segments) {
    return <ActivityIndicator style={{ flex: 1, justifyContent: "center" }} />;
  }

  return isAuthenticated === !inAuthGroup ? children : <ActivityIndicator style={{ flex: 1, justifyContent: "center" }} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { theme: themePref, colorTheme, isHydrating: themeHydrating } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme =
    themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const { isHydrating: authHydrating, setIsHydrating } = useAuthStore();

  // Initialize the auth store for Spotify service to avoid circular dependencies
  useEffect(() => {
    initializeSpotifyService(useAuthStore);
  }, []);

  // Handle hydration completion
  useEffect(() => {
    if (authHydrating) {
      // Set a timeout to ensure hydration completes
      const timer = setTimeout(() => {
        console.log("Forcing hydration completion");
        setIsHydrating(false);
      }, 2000); // 2 second timeout

      return () => clearTimeout(timer);
    }
  }, [authHydrating, setIsHydrating]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      registerBackgroundTasks();
    }
  }, [fontsLoaded, fontError]);

  console.log("Layout loading check:", {
    fontsLoaded,
    fontError,
    authHydrating: useAuthStore.getState().isHydrating,
    themeHydrating: useThemeStore.getState().isHydrating
  });

  if (!fontsLoaded && !fontError || authHydrating || themeHydrating) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;
  }



  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
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
                  <Stack.Screen name="spotify-callback" options={{ headerShown: false }} />
                </Stack>
              </SafeAreaView>
            </AuthGuard>
          </ErrorBoundary>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );
}
