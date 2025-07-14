import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore, ThemePreference } from "@/stores/theme";
import React, { useLayoutEffect } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { themes } from "@/constants/colors";
import { useNavigation } from "@react-navigation/native";
import { useShieldStore } from "@/stores/shield";
import { HeaderBackButton } from "@react-navigation/elements";

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme: themePref, colorTheme, setTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme =
    themePref === "auto" ? (colorScheme ?? "light") : themePref;
  const theme = themes[colorTheme][effectiveTheme];
  const navigation = useNavigation();
  const { hideAutoDisableWarning, setHideAutoDisableWarning } =
    useShieldStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.background },
      headerTitle: "Settings",
      headerTitleAlign: "center",
      headerTitleStyle: { color: theme.text, fontWeight: "bold", fontSize: 20 },
      headerTintColor: theme.text,
      headerLeft: () => (
        <HeaderBackButton
          tintColor={theme.text}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              router.replace("/(tabs)");
            }
          }}
        />
      ),
    });
  }, [navigation, theme, router]);

  const handleActivityTags = () => {
    router.push("/settings/activity-tags");
  };
  const handleNotifications = () => {
    router.push("/settings/notifications");
  };
  const handleSupport = () => {
    router.push("/settings/support");
  };
  
  console.log("DEBUG: hideAutoDisableWarning =", hideAutoDisableWarning);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* DEBUG: This is app/settings/index.tsx */}
      {/* Shield Warnings toggle and debug label only, no reset button */}
      {/* Remove the static Shield Warnings header and margin at the top */}
      <ScrollView style={styles.scrollView}>
        <Pressable
          style={[
            styles.profileCard,
            { backgroundColor: theme.background, shadowColor: theme.border },
          ]}
          onPress={() => router.push("/settings/profile")}
        >
          <Image
            style={styles.profileImage}
            source={{ uri: user?.profileImageUrl }}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {user?.displayName}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.text }]}>
              {user?.email}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={18} color={theme.text} />
        </Pressable>
        {/* Move Shield Warnings toggle here */}
        <View
          style={[
            styles.settingItem,
            {
              borderWidth: 2,
              borderColor: theme.tint,
              backgroundColor: theme.background,
              marginHorizontal: 16,
              borderRadius: 12,
              marginBottom: 18,
            },
          ]}
        >
          <View style={styles.settingIconContainer}>
            <FontAwesome name="shield" size={20} color={theme.text} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Show Auto-disable Warning
            </Text>
            <Text style={[styles.settingDescription, { color: theme.text }]}>
              Show confirmation when disabling the auto-disable timer
            </Text>
          </View>
          <Switch
            value={!hideAutoDisableWarning}
            onValueChange={(v: boolean) => setHideAutoDisableWarning(!v)}
          />
        </View>
        {/* Appearance (Theme) section follows */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Appearance
          </Text>
          <View style={styles.themeRow}>
            {(["light", "dark", "auto"] as ThemePreference[]).map((option) => {
              const isSelected = themePref === option;
              const buttonBackgroundColor = isSelected
                ? theme.tint
                : theme.background;
              const buttonBorderColor = isSelected ? theme.tint : theme.border;
              const textColor = isSelected ? theme.background : theme.text;
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
                    {option === "light"
                      ? "Light"
                      : option === "dark"
                        ? "Dark"
                        : "Auto"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.themeDescription, { color: theme.text }]}>
            Auto: Follows your phone's system appearance
          </Text>
          {/* Color Theme Selector */}
          <Text
            style={[styles.sectionTitle, { color: theme.text, marginTop: 18 }]}
          >
            Color Theme
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8, marginBottom: 8 }}
          >
            {Object.entries(themes).map(([key, value]) => {
              const isSelected = colorTheme === key;
              const previewColors = [
                value[effectiveTheme].background,
                value[effectiveTheme].tint,
                value[effectiveTheme].tabIconSelected,
              ];
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.colorThemeOption,
                    colorTheme === key && styles.themeOptionSelected,
                  ]}
                  onPress={() => useThemeStore.getState().setColorTheme(key as keyof typeof themes)}
                >
                  <View
                    style={{
                      width: 48,
                      height: 24,
                      borderRadius: 6,
                      marginBottom: 4,
                      overflow: "hidden",
                      flexDirection: "row",
                    }}
                  >
                    {previewColors.map((c, i) => (
                      <View key={i} style={{ flex: 1, backgroundColor: c }} />
                    ))}
                  </View>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 12,
                      fontWeight: isSelected ? "bold" : "normal",
                      textAlign: "center",
                    }}
                  >
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: theme.border,
            marginHorizontal: 16,
            marginBottom: 16,
          }}
        />
        <Pressable
          style={[
            styles.sectionContainer,
            styles.settingsNavItem,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
          onPress={handleActivityTags}
        >
          <View style={styles.settingIconContainer}>
            <FontAwesome name="tag" size={20} color={theme.text} />
          </View>
          <Text style={[styles.settingTitle, { color: theme.text }]}>
            Activity Tags
          </Text>
          <FontAwesome
            name="chevron-right"
            size={18}
            color={theme.text}
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
        <Pressable
          style={[
            styles.sectionContainer,
            styles.settingsNavItem,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
          onPress={handleNotifications}
        >
          <View style={styles.settingIconContainer}>
            <FontAwesome name="bell" size={20} color={theme.text} />
          </View>
          <Text style={[styles.settingTitle, { color: theme.text }]}>
            Notifications
          </Text>
          <FontAwesome
            name="chevron-right"
            size={18}
            color={theme.text}
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
        <Pressable
          style={[
            styles.sectionContainer,
            styles.settingsNavItem,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
          onPress={() => router.push("/settings/subscription")}
        >
          <View style={styles.settingIconContainer}>
            <FontAwesome name="credit-card" size={20} color={theme.text} />
          </View>
          <Text style={[styles.settingTitle, { color: theme.text }]}>
            Subscription
          </Text>
          <FontAwesome
            name="chevron-right"
            size={18}
            color={theme.text}
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
        <Pressable
          style={[
            styles.sectionContainer,
            styles.settingsNavItem,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
          onPress={handleSupport}
        >
          <View style={styles.settingIconContainer}>
            <FontAwesome name="question-circle" size={20} color={theme.text} />
          </View>
          <Text style={[styles.settingTitle, { color: theme.text }]}>
            Help & Support
          </Text>
          <FontAwesome
            name="chevron-right"
            size={18}
            color={theme.text}
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
        <View style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </View>
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.text }]}>
            Version 1.0.0
          </Text>
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
    color: "#191414",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: "#F5F5F5",
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeOptionText: {
    fontWeight: "bold",
  },
  themeOptionSelected: {
    backgroundColor: "#1DB954",
    borderColor: "#1DB954",
  },
  themeOptionTextSelected: {
    color: "#FFFFFF",
  },
  themeDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginLeft: 10,
  },
  settingsNavItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  colorThemeOption: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    padding: 8,
    borderRadius: 8,
    minWidth: 70,
  },
});
