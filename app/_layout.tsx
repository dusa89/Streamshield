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
import { useAuthStore } from "@/stores/auth";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Create a client for React Query
const queryClient = new QueryClient();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme =
    themePref === "auto" ? (colorScheme ?? "light") : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      registerBackgroundTasks();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // Show nothing until fonts are loaded
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <>
        <ExpoStatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <SafeAreaView
              style={{ flex: 1, backgroundColor: theme.background }}
            >
              <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
                <RootLayoutNav />
              </View>
            </SafeAreaView>
          </QueryClientProvider>
        </trpc.Provider>
      </>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, isHydrating } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Return a loading indicator or null while the store is rehydrating.
  if (isHydrating) {
    return null; // Or <ActivityIndicator />
  }

  useEffect(() => {
    const inTabsOrSettingsGroup =
      segments[0] === "(tabs)" || segments[0] === "settings";

    if (isAuthenticated && !inTabsOrSettingsGroup) {
      router.replace("/(tabs)");
    } else if (!isAuthenticated && !inTabsOrSettingsGroup) {
      // No action needed, user is already in the auth flow.
    } else if (!isAuthenticated && inTabsOrSettingsGroup) {
      router.replace("/(auth)");
    }
  }, [isAuthenticated, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}
