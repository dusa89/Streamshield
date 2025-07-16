import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { themes } from "@/constants/colors";
import { useNavigation } from "@react-navigation/native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import * as ImagePicker from "expo-image-picker";
import * as AuthSession from "expo-auth-session";
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';

export default function ProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [isEditing, setIsEditing] = useState(false);
  
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme = themePref === "auto" ? (colorScheme ?? "light") : themePref;
  const theme = themes[colorTheme][effectiveTheme];
  const navigation = useNavigation();
  const { login } = useSpotifyAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.background },
      headerTitleStyle: { color: theme.text },
      headerTintColor: theme.text,
    });
  }, [navigation, theme]);

  const handleUpdateProfile = () => {
    if (isEditing) {
      if (displayName.trim()) {
        updateUser({ displayName: displayName.trim() });
        setIsEditing(false);
      } else {
        Alert.alert("Invalid Name", "Please enter a valid display name.");
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleSelectProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // In a real app, we would upload this image to a server
        // For now, we'll just update the local state
        updateUser({ profileImageUrl: result.assets[0].uri });
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <View style={[styles.content, { backgroundColor: theme.background }]}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: user?.profileImageUrl }}
            style={styles.profileImage}
          />
          <Pressable
            style={[styles.changeImageButton, { backgroundColor: theme.tint }]}
            onPress={handleSelectProfileImage}
          >
            <FontAwesome name="camera" size={16} color={theme.background} />
          </Pressable>
        </View>
                  <View style={[styles.infoContainer, { backgroundColor: theme.card || theme.background, shadowColor: theme.border }]}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.subtext }]}>Display Name</Text>
              {isEditing ? (
                <TextInput
                  style={{
                    fontSize: 17,
                    color: theme.text,
                    backgroundColor: theme.card || theme.background,
                    borderColor: theme.tint,
                    borderWidth: 2,
                    borderRadius: 8,
                    fontWeight: "500",
                    height: 44,
                    paddingLeft: 12,
                    marginBottom: 4,
                  }}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoFocus
                  placeholder="Enter display name"
                  placeholderTextColor={theme.tint}
                />
              ) : (
                <Text style={[styles.infoValue, { color: theme.text }]}>{user?.displayName}</Text>
              )}
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.subtext }]}>Email</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{user?.email}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.subtext }]}>Spotify ID</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{user?.spotifyId}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.subtext }]}>Subscription</Text>
              <Text
                style={[
                  styles.infoValue,
                  styles.subscriptionValue,
                  { color: theme.tint },
                  user?.subscriptionTier === "premium" && styles.premiumValue,
                  user?.subscriptionTier === "pro" && styles.proValue,
                ]}
              >
                {user?.subscriptionTier === "free"
                  ? "Free Plan"
                  : user?.subscriptionTier === "premium"
                    ? "Premium Plan"
                    : "Pro Plan"}
              </Text>
            </View>
          </View>
        <Pressable style={[styles.reconnectButton, { backgroundColor: theme.tint }]} onPress={async () => {
  useAuthStore.setState({ tokens: null });
  await login();
}}>
  <Text style={[styles.reconnectButtonText, { color: theme.background }]}>Reconnect Spotify</Text>
</Pressable>
        <Pressable style={[styles.updateButton, { backgroundColor: theme.tint }]} onPress={handleUpdateProfile}>
          <Text style={[styles.updateButtonText, { color: theme.background }]}>
            {isEditing ? "Save Changes" : "Edit Profile"}
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
  content: {
    flex: 1,
    padding: 16,
  },
  profileImageContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  changeImageButton: {
    position: "absolute",
    bottom: -5,
    right: "35%",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  infoContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
  },
  infoInput: {
    fontSize: 16,
    color: "#191414",
    borderBottomWidth: 1,
    borderBottomColor: "#1DB954",
    paddingVertical: 4,
  },
  subscriptionValue: {
    fontWeight: "500",
    color: "#666666",
  },
  premiumValue: {
    color: "#1DB954",
  },
  proValue: {
    color: "#9C27B0",
  },
  updateButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  reconnectButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  reconnectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
