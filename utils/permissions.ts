import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const checkAndroidPermissions = async () => {
  if (Platform.OS !== "android") return;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permissions not granted. Some features may be limited.");
      // Optionally, show a UI toast or alert here if needed
    }
  } catch (error) {
    console.error("Error checking Android permissions:", error);
  }
}; 