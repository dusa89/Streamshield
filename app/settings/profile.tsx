import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useAuthStore } from "@/stores/auth";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isEditing, setIsEditing] = useState(false);

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
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: user?.profileImageUrl }}
            style={styles.profileImage}
          />
          <Pressable 
            style={styles.changeImageButton}
            onPress={handleSelectProfileImage}
          >
            <Text style={styles.changeImageText}>Change Image</Text>
          </Pressable>
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Display Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={displayName}
                onChangeText={setDisplayName}
                autoFocus
              />
            ) : (
              <Text style={styles.infoValue}>{user?.displayName}</Text>
            )}
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Spotify ID</Text>
            <Text style={styles.infoValue}>{user?.spotifyId}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Subscription</Text>
            <Text style={[
              styles.infoValue, 
              styles.subscriptionValue,
              user?.subscriptionTier === "premium" && styles.premiumValue,
              user?.subscriptionTier === "pro" && styles.proValue,
            ]}>
              {user?.subscriptionTier === "free" 
                ? "Free Plan" 
                : user?.subscriptionTier === "premium" 
                  ? "Premium Plan" 
                  : "Pro Plan"}
            </Text>
          </View>
        </View>
        <Pressable 
          style={styles.updateButton}
          onPress={handleUpdateProfile}
        >
          <Text style={styles.updateButtonText}>
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
    backgroundColor: "#FFFFFF",
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
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changeImageButton: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "#1DB954",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  changeImageText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  infoContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
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
    color: "#666666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#191414",
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
    backgroundColor: "#1DB954",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});