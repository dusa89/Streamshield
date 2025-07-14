import { Stack } from "expo-router";
import { useThemeStore } from "@/stores/theme";
import { themes } from "@/constants/colors";
import { useColorScheme } from "react-native";

export default function SettingsStackLayout() {
  const { theme: themePref, colorTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme =
    themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerShadowVisible: false, // Removes the shadow line on iOS
      }}
    >
      <Stack.Screen name="index" options={{ title: "Settings", headerShown: true }} />
      <Stack.Screen name="activity-tags" options={{ title: "Activity Tags" }} />
      <Stack.Screen name="shield" options={{ title: "Shield Settings" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="rules" options={{ title: "Shielding Rules" }} />
      <Stack.Screen name="subscription" options={{ title: "Subscription" }} />
      <Stack.Screen name="support" options={{ title: "Help & Support" }} />
    </Stack>
  );
}
