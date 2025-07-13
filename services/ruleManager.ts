import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import { useRulesStore } from "@/stores/rules";
import { useShieldStore } from "@/stores/shield";
import * as DeviceManager from "./deviceManager";
import { useAuthStore } from "@/stores/auth";

export const SHIELD_RULES_TASK_NAME = "check-shield-rules";
export const DEVICE_MONITOR_TASK_NAME = "device-monitor-task";

TaskManager.defineTask(DEVICE_MONITOR_TASK_NAME, async () => {
  try {
    await DeviceManager.checkDeviceRules();
    return BackgroundTask.BackgroundTaskResult.NewData;
  } catch (error) {
    console.error("[TaskManager] Device monitor task failed:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

TaskManager.defineTask(SHIELD_RULES_TASK_NAME, async () => {
  try {
    const now = new Date();
    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const { timeRules } = useRulesStore.getState();
    const { isShieldActive, toggleShield } = useShieldStore.getState();
    const { user } = useAuthStore.getState();

    if (!user) {
      return BackgroundTask.BackgroundTaskResult.NoData;
    }

    // Check time-based rules
    const matchingTimeRule = timeRules.find((rule) => {
      if (!rule.enabled) return false;
      if (!rule.days.includes(dayName)) return false;
      // Parse start and end time (e.g., "9:00 AM")
      const parseTime = (t: string) => {
        const [time, period] = t.split(" ");
        let [h, m] = time.split(":").map(Number);
        if (period === "PM" && h !== 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        return h * 60 + m;
      };
      const start = parseTime(rule.startTime);
      const end = parseTime(rule.endTime);
      if (start <= end) {
        return currentMinutes >= start && currentMinutes < end;
      } else {
        // Overnight rule (e.g., 10 PM - 6 AM)
        return currentMinutes >= start || currentMinutes < end;
      }
    });

    if (matchingTimeRule && !isShieldActive) {
      await toggleShield(user.id);
      return BackgroundTask.BackgroundTaskResult.NewData;
    } else if (!matchingTimeRule && isShieldActive) {
       // This part needs to be smarter, to not disable a shield activated by a device rule.
       // For now, we only handle time-based deactivation here.
    }

    return BackgroundTask.BackgroundTaskResult.NoData;
  } catch (e) {
    console.error("[RuleManager] Shield rules background task error:", e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Registers all background tasks for the app.
 */
export const registerBackgroundTasks = async () => {
  await BackgroundTask.registerTaskAsync(DEVICE_MONITOR_TASK_NAME, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });

  await BackgroundTask.registerTaskAsync(SHIELD_RULES_TASK_NAME, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });

};
