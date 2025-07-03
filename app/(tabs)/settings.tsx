import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useThemeStore } from "@/stores/theme";
import { useColorScheme } from "react-native";
import type { ThemePreference, ColorTheme } from "@/stores/theme";
import { themes } from '@/constants/colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useState } from 'react';

// Add Theme type for theme object structure
interface Theme {
  text: string;
  background: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  border: string;
  gradient: string[];
}

// Map of only the theme sets with light/dark keys
const themesMap: Record<ColorTheme, { light: Theme; dark: Theme }> = {
  charcoalGold: themes.charcoalGold as { light: Theme; dark: Theme },
  classicSpotify: themes.classicSpotify as { light: Theme; dark: Theme },
  cyberpunk: themes.cyberpunk as { light: Theme; dark: Theme },
  earthTones: themes.earthTones as { light: Theme; dark: Theme },
  feminineRose: themes.feminineRose as { light: Theme; dark: Theme },
  masculineSteel: themes.masculineSteel as { light: Theme; dark: Theme },
  monochrome: themes.monochrome as { light: Theme; dark: Theme },
  nordicNight: themes.nordicNight as { light: Theme; dark: Theme },
  pastelBlossom: themes.pastelBlossom as { light: Theme; dark: Theme },
  pastelCitrus: themes.pastelCitrus as { light: Theme; dark: Theme },
  pastelOcean: themes.pastelOcean as { light: Theme; dark: Theme },
  solarizedDark: themes.solarizedDark as { light: Theme; dark: Theme },
};

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { theme: themePref, setTheme, colorTheme, setColorTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themesMap[colorTheme][effectiveTheme];
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
  
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
    logout();
    router.replace("/(auth)");
          },
        },
      ]
    );
  };
  
  const colorThemeOptions: { key: ColorTheme; name: string; }[] = [
    { key: 'charcoalGold', name: 'Charcoal Gold' },
    { key: 'classicSpotify', name: 'Classic' },
    { key: 'cyberpunk', name: 'Cyberpunk' },
    { key: 'earthTones', name: 'Earth Tones' },
    { key: 'feminineRose', name: 'Rose' },
    { key: 'masculineSteel', name: 'Steel' },
    { key: 'monochrome', name: 'Monochrome' },
    { key: 'nordicNight', name: 'Nordic Night' },
    { key: 'pastelBlossom', name: 'Pastel Blossom' },
    { key: 'pastelCitrus', name: 'Pastel Citrus' },
    { key: 'pastelOcean', name: 'Pastel Ocean' },
    { key: 'solarizedDark', name: 'Solarized Dark' },
  ];
  
  // If not authenticated, show a message (though this shouldn't happen due to routing)
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
        <View style={styles.centerContainer}>
          <FontAwesome name="user-times" size={48} color={theme.tabIconDefault} />
          <Text style={[styles.centerText, { color: theme.tabIconDefault }]}>Please log in to access settings</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingTop: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text, marginLeft: 20, marginBottom: 8 }}>Settings</Text>
        <View style={[styles.appearanceCard, { backgroundColor: theme.background, borderColor: theme.border, shadowColor: theme.border }]}> 
          <Text style={[styles.sectionTitle, { color: theme.text, marginHorizontal: 0, marginBottom: 12 }]}>Appearance</Text>
          <View style={styles.themeRow}>
            {(['light', 'dark', 'auto'] as ThemePreference[]).map((option) => {
              const isSelected = themePref === option;
              return (
                <Pressable
                  key={option}
                  style={[
                    styles.themeOptionCard,
                    {
                      backgroundColor: isSelected ? theme.tint : theme.background,
                      borderColor: isSelected ? theme.tint : theme.border,
                    },
                  ]}
                  onPress={() => setTheme(option)}
                >
                  <Text style={[
                    styles.themeOptionTextCard,
                    {
                      color: isSelected ? theme.background : theme.text,
                    },
                  ]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.themeDescription, { color: theme.text, marginTop: 8 }]}>Auto: Follows your phone's system appearance</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Color Theme</Text>
            <Pressable
              style={{ marginLeft: 8, padding: 6, borderRadius: 16, backgroundColor: theme.border }}
              onPress={() => setThemeMenuVisible(true)}
              accessibilityLabel="Choose color theme"
            >
              <MaterialCommunityIcons name="palette" size={22} color={theme.tint} />
            </Pressable>
          </View>
          {/* Color Theme Action Sheet */}
          <Modal
            visible={themeMenuVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setThemeMenuVisible(false)}
          >
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}
              activeOpacity={1}
              onPress={() => setThemeMenuVisible(false)}
            >
              <View style={{
                backgroundColor: theme.background,
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                paddingBottom: 12,
                paddingTop: 8,
                paddingHorizontal: 8,
                maxHeight: '60%',
                shadowColor: theme.border,
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 10,
              }}>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 16, marginBottom: 8, alignSelf: 'center' }}>Choose Color Theme</Text>
                <ScrollView style={{ maxHeight: 320 }}>
                  {colorThemeOptions.map((option) => {
                    const preview = themesMap[option.key][effectiveTheme === 'dark' ? 'dark' : 'light'];
                    const isSelected = colorTheme === option.key;
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: isSelected ? preview.tint + '22' : 'transparent',
                          marginBottom: 2,
                        }}
                        onPress={() => {
                          setColorTheme(option.key);
                          setThemeMenuVisible(false);
                        }}
                      >
                        <View style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: preview.tint,
                          borderWidth: 2,
                          borderColor: isSelected ? preview.tint : preview.border,
                          marginRight: 12,
                        }} />
                        <Text style={{ color: isSelected ? preview.tint : theme.text, fontWeight: isSelected ? 'bold' : 'normal', fontSize: 15 }}>{option.name}</Text>
                        {isSelected && (
                          <MaterialCommunityIcons name="check-circle" size={20} color={preview.tint} style={{ marginLeft: 8 }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={{ alignItems: 'center', paddingVertical: 12 }}
                  onPress={() => setThemeMenuVisible(false)}
                >
                  <Text style={{ color: theme.tabIconDefault, fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
        
        <Pressable 
          style={[styles.profileCard, { backgroundColor: theme.background, shadowColor: theme.border }]}
          onPress={() => router.push("/settings/profile")}
        >
          <Image
            source={{ uri: user.profileImageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format" }}
            style={styles.profileImage}
            placeholder="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format"
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>{user.displayName}</Text>
            <Text style={[styles.profileEmail, { color: theme.tabIconDefault }]}>{user.email}</Text>
            <Text style={[styles.profileTier, { color: theme.tint }]}>
              {user.subscriptionTier === "free" ? "Free Plan" : 
               user.subscriptionTier === "premium" ? "Premium Plan" : "Pro Plan"}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color={theme.text} />
        </Pressable>
        
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 20 }]}>Shield Settings</Text>
          
          <Pressable 
            style={[styles.settingItem, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
            onPress={() => router.push("/settings/blacklist")}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: theme.border }] }>
              <FontAwesome name="ban" size={18} color={theme.tint} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Blacklist</Text>
              <Text style={[styles.settingDescription, { color: theme.text }]}>
                Manage artists, genres, and songs to shield
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={theme.text} />
          </Pressable>
          
          <Pressable 
            style={[styles.settingItem, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
            onPress={() => router.push("/settings/rules")}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: theme.border }] }>
              <FontAwesome name="cog" size={18} color={theme.tint} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Shielding Rules</Text>
              <Text style={[styles.settingDescription, { color: theme.text }]}>
                Set up automatic shielding schedules
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={theme.text} />
          </Pressable>
          
          <Pressable 
            style={[styles.settingItem, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
            onPress={() => router.push("/settings/activity-tags")}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: theme.border }] }>
              <FontAwesome name="tags" size={18} color={theme.tint} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Activity Tags</Text>
              <Text style={[styles.settingDescription, { color: theme.text }]}>
                Create and manage listening activity tags
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={theme.text} />
          </Pressable>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 20 }]}>Account</Text>
          
          <Pressable 
            style={[styles.settingItem, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
            onPress={() => router.push("/settings/subscription")}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: theme.border }] }>
              <FontAwesome name="credit-card" size={18} color={theme.tint} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Subscription</Text>
              <Text style={[styles.settingDescription, { color: theme.text }]}>
                {user.subscriptionTier === "free" 
                  ? "Free Plan - Upgrade for more features" 
                  : user.subscriptionTier === "premium" 
                    ? "Premium Plan" 
                    : "Pro Plan"}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={theme.text} />
          </Pressable>
          
          <Pressable 
            style={[styles.settingItem, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
            onPress={() => router.push("/settings/notifications")}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: theme.border }] }>
              <FontAwesome name="bell" size={18} color={theme.tint} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Notifications</Text>
              <Text style={[styles.settingDescription, { color: theme.text }]}>
                Manage app notifications
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={theme.text} />
          </Pressable>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 20 }]}>Support</Text>
          
          <Pressable 
            style={[styles.settingItem, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
            onPress={() => router.push("/settings/support")}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: theme.border }] }>
              <FontAwesome name="question-circle" size={18} color={theme.tint} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Help & Support</Text>
              <Text style={[styles.settingDescription, { color: theme.text }]}>
                Get help with using StreamShield
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={theme.text} />
          </Pressable>
        </View>
        
        <Pressable 
          style={[styles.logoutButton, { backgroundColor: theme.background, borderColor: theme.tint }]}
          onPress={handleLogout}
        >
          <FontAwesome name="sign-out" size={16} color={theme.tint} />
          <Text style={[styles.logoutText, { color: theme.tint }]}>Log Out</Text>
        </Pressable>
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.tabIconDefault }]}>StreamShield v1.0.0</Text>
        </View>
      </ScrollView>
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
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
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
  profileTier: {
    fontSize: 12,
    color: "#1DB954",
    marginTop: 4,
    fontWeight: "500",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 0,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    marginLeft: 20,
    marginRight: 20,
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
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: 12,
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  centerText: {
    fontSize: 16,
    color: "#999999",
    marginTop: 16,
    textAlign: "center",
  },
  appearanceCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    gap: 8,
  },
  themeOptionCard: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
  },
  themeOptionTextCard: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  themeDescription: {
    fontSize: 12,
    color: "#666666",
  },
});