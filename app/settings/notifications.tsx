import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeStore } from "@/stores/theme";
import { useColorScheme } from "react-native";
import { themes } from "@/constants/colors";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState({
    shieldReminders: true,
    weeklyStats: true,
    newFeatures: false,
    securityAlerts: true,
  });
  
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Push Notifications</Text>
          <Switch
            value={notifications.shieldReminders}
            onValueChange={(value) => setNotifications({ ...notifications, shieldReminders: value })}
            trackColor={{ false: theme.border, true: theme.tint }}
            thumbColor={theme.background}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Email Notifications</Text>
          <Switch
            value={notifications.securityAlerts}
            onValueChange={(value) => setNotifications({ ...notifications, securityAlerts: value })}
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