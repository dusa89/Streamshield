import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Linking, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { useThemeStore, ThemePreference } from "@/stores/theme";
import React, { useState, useLayoutEffect } from "react";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { themes } from "@/constants/colors";
import { useNavigation } from "@react-navigation/native";

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { login, logout, loading, error, redirectUri } = useSpotifyAuth();
  const { theme: themePref, colorTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const navigation = useNavigation();
  
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.background },
      headerTitleStyle: { color: theme.text },
      headerTintColor: theme.text,
    });
  }, [navigation, theme]);
  
  const onLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await logout();
              router.replace("/(auth)");
          }
        }
      ]
    );
  };
  
  const handleActivityTags = () => {
    router.push("/settings/activity-tags");
  };
  const handleNotifications = () => {
    router.push("/settings/notifications");
  };
  const handleSupport = () => {
    router.push("/settings/support");
  };
  
  // BEGIN DEBUG: Commenting out original settings UI
  /*
  <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
    <ScrollView style={styles.scrollView}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>
      <View style={[styles.profileCard, { backgroundColor: theme.background, shadowColor: theme.border }] }>
        <Image style={styles.profileImage} source={{ uri: user?.profileImageUrl }} />
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: theme.text }]}>{user?.displayName}</Text>
          <Text style={[styles.profileEmail, { color: theme.text }]}>{user?.email}</Text>
        </View>
      </View>
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
        <View style={styles.themeRow}>
          {(['light', 'dark', 'auto'] as ThemePreference[]).map((option) => {
            const isSelected = themePref === option;
            const buttonBackgroundColor = isSelected ? theme.tint : theme.background;
            const buttonBorderColor = isSelected ? theme.tint : theme.border;
            const textColor = isSelected ? theme.background : theme.text;
            if (effectiveTheme === 'dark' && !isSelected) {
              console.log(`Unselected Dark Mode Button ('${option}'): Applying text color: ${textColor}`);
            }
            return (
              <Pressable
                key={option}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: buttonBackgroundColor,
                    borderColor: buttonBorderColor,
                  },
                ]}
                onPress={() => setTheme(option)}
              >
                <Text style={[styles.themeOptionText, { color: textColor }]}> 
                  {option === 'light' ? 'Light' : option === 'dark' ? 'Dark' : 'Auto'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.themeDescription, { color: theme.text }]}>Auto: Follows your phone's system appearance</Text>
      </View>
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifications</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <FontAwesome name="bell" size={20} color={theme.text} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Notifications</Text>
            <Text style={[styles.settingDescription, { color: theme.text }]}> 
              {isNotificationsEnabled ? "Notifications are enabled" : "Notifications are disabled"}
            </Text>
          </View>
          <Switch
            value={isNotificationsEnabled}
            onValueChange={(value) => setIsNotificationsEnabled(value)}
          />
        </View>
      </View>
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Activity Tags</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <FontAwesome name="tag" size={20} color={theme.text} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Activity Tags</Text>
            <Text style={[styles.settingDescription, { color: theme.text }]}> 
              Manage your activity tags
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={20} color={theme.text} />
        </View>
      </View>
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifications</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <FontAwesome name="bell" size={20} color={theme.text} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Notifications</Text>
            <Text style={[styles.settingDescription, { color: theme.text }]}> 
              Manage your notifications
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={20} color={theme.text} />
        </View>
      </View>
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Support</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <FontAwesome name="support" size={20} color={theme.text} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Support</Text>
            <Text style={[styles.settingDescription, { color: theme.text }]}> 
              Get help and support
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={20} color={theme.text} />
        </View>
      </View>
      <View style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </View>
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.text }]}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  </SafeAreaView>
  */
  // END DEBUG: Commented out original settings UI

  // Add this new return statement for debugging purposes
  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: theme.text }}>
                Settings Debug Mode
              </Text>
              <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 40, color: theme.text }}>
                This is a simplified view to test navigation. Please tap the button below.
              </Text>
          <Pressable 
                style={{
                    backgroundColor: '#1DB954',
                    paddingVertical: 15,
                    paddingHorizontal: 30,
                    borderRadius: 30,
                }}
                onPress={() => {
                    console.log("--- DEBUG: Attempting to navigate to /settings/support ---");
                    try {
                        router.push("/settings/support");
                      } catch (e: any) {
                        console.error("--- DEBUG: Navigation failed with error: ---", e);
                        Alert.alert("Navigation Failed", e.message);
                    }
                }}
            >
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                    Test Navigate to Support
          </Text>
        </Pressable>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#191414",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191414",
  },
  profileEmail: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191414",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: "#191414",
  },
  settingDescription: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  logoutText: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "500",
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: "#999999",
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeOptionText: {
    fontWeight: 'bold',
  },
  themeOptionSelected: {
    backgroundColor: '#1DB954',
    borderColor: '#1DB954',
  },
  themeOptionTextSelected: {
    color: '#FFFFFF',
  },
  themeDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 10,
  },
});