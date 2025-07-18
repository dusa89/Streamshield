import React, { useEffect, useState } from "react";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { useRouter, usePathname } from "expo-router";
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
  initialRouteName: "(tabs)",
};

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { theme: themePref, colorTheme, isHydrating: themeHydrating } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const { isAuthenticated, isHydrating: authHydrating } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false); // Prevent multiple redirects

  useEffect(() => {
    initializeSpotifyService(useAuthStore);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      registerBackgroundTasks();
    }
  }, [fontsLoaded, fontError]);

  // Auth redirect logic
  useEffect(() => {
    if (authHydrating || themeHydrating || redirecting) return;

    const inAuthPath = pathname?.startsWith("/(auth)") || pathname === "/spotify-callback";
    console.log("Redirect check:", { isAuthenticated, pathname, inAuthPath });

    if (isAuthenticated && inAuthPath) {
      setRedirecting(true);
      router.replace("/(tabs)");
      setTimeout(() => setRedirecting(false), 100); // Debounce
    } else if (!isAuthenticated && !inAuthPath && pathname) { // Only if pathname defined
      setRedirecting(true);
      router.replace("/(auth)");
      setTimeout(() => setRedirecting(false), 100);
    }
  }, [isAuthenticated, authHydrating, themeHydrating, pathname, router]);

  if (!fontsLoaded && !fontError || authHydrating || themeHydrating) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
              <ExpoStatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="spotify-callback" options={{ headerShown: false }} />
              </Stack>
            </SafeAreaView>
          </ErrorBoundary>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );
}
