import React, { useCallback } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar, View } from "react-native";
import { useColorScheme } from "react-native";
import { useAuthStore } from "@/stores/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { useRouter, useSegments } from "expo-router";
import { useThemeStore } from "@/stores/theme";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { SHIELD_RULES_TASK_NAME } from "@/services/ruleManager";
import { SafeAreaView } from "react-native-safe-area-context";
import { themes } from "@/constants/colors";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

export const unstable_settings = {
  initialRouteName: "(auth)",
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
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    async function registerBackgroundTask() {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(SHIELD_RULES_TASK_NAME);
      if (!isRegistered) {
        try {
          await BackgroundFetch.registerTaskAsync(SHIELD_RULES_TASK_NAME, {
            minimumInterval: 60 * 15, // 15 minutes
            stopOnTerminate: false,
            startOnBoot: true,
          });
          console.log("Shield rules background task registered");
        } catch (e) {
          console.error("Failed to register shield rules background task:", e);
        }
      }
    }
    registerBackgroundTask();
  }, []);

  if (!fontsLoaded) {
    // Show nothing until fonts are loaded
    return null;
  }

  return (
    <>
      <ExpoStatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <RootLayoutNav />
            </View>
          </SafeAreaView>
        </QueryClientProvider>
      </trpc.Provider>
    </>
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
    const inTabsOrSettingsGroup = segments[0] === "(tabs)" || segments[0] === "settings";

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
    </Stack>
  );
}