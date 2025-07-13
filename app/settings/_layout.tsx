import { Stack } from "expo-router";

export default function SettingsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="activity-tags" options={{ title: "Activity Tags" }} />

      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="rules" options={{ title: "Shielding Rules" }} />
      <Stack.Screen name="subscription" options={{ title: "Subscription" }} />
      <Stack.Screen name="support" options={{ title: "Help & Support" }} />
    </Stack>
  );
}
