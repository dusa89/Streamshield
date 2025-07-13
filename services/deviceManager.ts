import * as SpotifyService from "./spotify";
import { useAuthStore } from "@/stores/auth";
import { useRulesStore } from "@/stores/rules";
import { useShieldStore } from "@/stores/shield";
import { UserDevice } from "@/types/track";

let monitoringInterval: number | null = null;

/**
 * Fetches the list of available devices from the Spotify API.
 * Requires the user to be authenticated.
 * @returns A promise that resolves to an array of Spotify device objects.
 */
export const getAvailableDevices = async (): Promise<UserDevice[]> => {
  const { tokens } = useAuthStore.getState();
  if (!tokens?.accessToken) {
    console.error("No access token available to fetch devices.");
    return [];
  }

  try {
    // This function needs to be implemented in spotify.ts
    const devices = await SpotifyService.getAvailableDevices();
    return devices ?? [];
  } catch (error) {
    console.error("Failed to get available devices:", error);
    // Handle specific errors (e.g., token expired) if necessary
    return [];
  }
};

export const checkDeviceRules = async () => {
  const { user } = useAuthStore.getState();
  const { deviceRules } = useRulesStore.getState();
  const { isShieldActive, toggleShield } = useShieldStore.getState();

  if (!user || deviceRules.length === 0) {
    return;
  }

  const activeDevice = await SpotifyService.getDetailedPlaybackState();
  if (!activeDevice?.device?.id) {
    return;
  }

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseTime = (t: string) => {
    if (!t) return 0;
    const [time, period] = t.split(" ");
    if (!time || !period) return 0;
    let [h, m] = time.split(":").map(Number);
    if (period.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };

  const matchingRule = deviceRules.find((rule) => {
    if (!rule.enabled || !rule.autoShield || rule.deviceId !== activeDevice.device?.id) {
      return false;
    }

    // If time scheduling is not enabled for this rule, it's a match.
    if (!rule.timeEnabled) {
      return true;
    }

    // If time scheduling is enabled, check the time.
    if (!rule.days?.includes(dayName)) {
      return false;
    }

    const start = parseTime(rule.startTime);
    const end = parseTime(rule.endTime);

    if (start <= end) {
      // Not an overnight rule
      return currentMinutes >= start && currentMinutes < end;
    } else {
      // Overnight rule (e.g., 10 PM - 6 AM)
      return currentMinutes >= start || currentMinutes < end;
    }
  });

  if (matchingRule && !isShieldActive) {
    // Using user.id from the auth store, assuming it's the spotify user id
    if (user?.id) {
          await toggleShield(user.id);
    } else {
       console.error("[DeviceManager] Cannot activate shield, user ID is missing.");
    }
  }
};


// Placeholder for the background monitoring logic
export const startDeviceMonitoring = async () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }
  // Check every 30 seconds
  monitoringInterval = setInterval(checkDeviceRules, 30 * 1000) as unknown as number;
};

export const stopDeviceMonitoring = () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}; 
