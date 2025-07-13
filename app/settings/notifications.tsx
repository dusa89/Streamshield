import React, { useState } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeStore } from "@/stores/theme";
import { useColorScheme } from "react-native";
import { themes } from "@/constants/colors";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useEffect } from "react";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState({
    shieldReminders: true,
    weeklyStats: true,
    newFeatures: false,
    securityAlerts: true,
  });
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      let token;
      if (Device.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          alert("Failed to get push token for push notification!");
          return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        setExpoPushToken(token);
        console.log("Expo Push Token:", token);
      } else {
        alert("Must use physical device for Push Notifications");
      }
    }
    registerForPushNotificationsAsync();
  }, []);

  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme =
    themePref === "auto" ? (colorScheme ?? "light") : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["bottom"]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        {expoPushToken && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.text, fontSize: 12 }}>Push Token:</Text>
            <Text selectable style={{ color: theme.tint, fontSize: 12 }}>
              {expoPushToken}
            </Text>
          </View>
        )}
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>
            Push Notifications
          </Text>
          <Switch
            value={notifications.shieldReminders}
            onValueChange={(value) =>
              setNotifications({ ...notifications, shieldReminders: value })
            }
            trackColor={{ false: theme.border, true: theme.tint }}
            thumbColor={theme.background}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>
            Email Notifications
          </Text>
          <Switch
            value={notifications.securityAlerts}
            onValueChange={(value) =>
              setNotifications({ ...notifications, securityAlerts: value })
            }
            trackColor={{ false: theme.border, true: theme.tint }}
            thumbColor={theme.background}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
  },
});
