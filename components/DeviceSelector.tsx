import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  useColorScheme,
} from "react-native";
import * as DeviceManager from "@/services/deviceManager";
import { themes } from "@/constants/colors";
import { useThemeStore } from "@/stores/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { UserDevice } from "@/types/track";

interface DeviceSelectorProps {
  onDeviceSelect: (device: UserDevice) => void;
  onClose: () => void;
}

const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  onDeviceSelect,
  onClose,
}) => {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme: themeSetting, colorTheme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const effectiveTheme = themeSetting === "auto" ? systemColorScheme ?? "light" : themeSetting;
  const theme = themes[colorTheme][effectiveTheme];

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const fetchedDevices = await DeviceManager.getAvailableDevices();
      setDevices(fetchedDevices);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      // Keep existing devices if refresh fails
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const fetchedDevices = await DeviceManager.getAvailableDevices();
      setDevices(fetchedDevices);
    } catch (error) {
      console.error("Failed to refresh devices:", error);
      // Keep existing devices if refresh fails
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "computer":
        return "laptop";
      case "smartphone":
        return "mobile";
      case "speaker":
        return "volume-up";
      default:
        return "music";
    }
  };

  const renderItem = ({ item }: { item: UserDevice }) => (
    <Pressable
      style={[styles.deviceItem, { borderBottomColor: theme.border }]}
      onPress={() => onDeviceSelect(item)}
    >
      <FontAwesome
        name={getDeviceIcon(item.type)}
        size={24}
        color={item.is_active ? theme.primary : theme.text}
        style={styles.icon}
      />
      <View style={styles.deviceInfo}>
        <Text
          style={[
            styles.deviceName,
            { color: item.is_active ? theme.primary : theme.text },
          ]}
        >
          {item.name}
        </Text>
        <Text style={[styles.deviceType, { color: theme.subtext }]}>
          {item.type}
        </Text>
      </View>
      {item.is_active && <View style={styles.activeDot} />}
    </Pressable>
  );

  return (
    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Select a Device</Text>
        <View style={styles.headerActions}>
          <Pressable 
            style={styles.refreshButton} 
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <FontAwesome 
              name="refresh" 
              size={20} 
              color={refreshing ? theme.subtext : theme.primary} 
            />
          </Pressable>
          <Pressable onPress={onClose}>
            <FontAwesome name="close" size={24} color={theme.text} />
          </Pressable>
        </View>
      </View>
      <Text style={[styles.disclaimer, { color: theme.subtext }]}>
        Hint: If your device isn't listed, try playing a song on it in the Spotify app first.
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <FlatList
          data={devices}
          renderItem={renderItem}
          keyExtractor={(item) => item.id!}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                No devices found. Make sure Spotify is active on a device.
              </Text>
              <Pressable 
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={handleRefresh}
              >
                <Text style={[styles.retryButtonText, { color: theme.card }]}>
                  Refresh Devices
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "60%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  disclaimer: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 15,
    marginHorizontal: 10,
  },
  refreshButton: {
    padding: 8,
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  icon: {
    marginRight: 15,
    width: 30,
    textAlign: "center",
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
  },
  deviceType: {
    fontSize: 14,
    marginTop: 2,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "green",
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default DeviceSelector; 