import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { useAuthStore } from "@/stores/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

// Create a client for React Query
const queryClient = new QueryClient();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
        </QueryClientProvider>
      </trpc.Provider>
    </>
  );
}

function RootLayoutNav() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="settings/profile" 
            options={{ 
              headerShown: true,
              title: "Profile",
              presentation: "card"
            }} 
          />
          <Stack.Screen 
            name="settings/subscription" 
            options={{ 
              headerShown: true,
              title: "Subscription",
              presentation: "card"
            }} 
          />
          <Stack.Screen 
            name="settings/blacklist" 
            options={{ 
              headerShown: true,
              title: "Blacklist",
              presentation: "card"
            }} 
          />
          <Stack.Screen 
            name="settings/rules" 
            options={{ 
              headerShown: true,
              title: "Shielding Rules",
              presentation: "card"
            }} 
          />
        </>
      ) : (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}