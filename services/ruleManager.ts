import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { useRulesStore } from "@/stores/rules";
import { useShieldStore } from "@/stores/shield";

export const SHIELD_RULES_TASK_NAME = "check-shield-rules";

TaskManager.defineTask(SHIELD_RULES_TASK_NAME, async () => {
  try {
    const now = new Date();
    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const { timeRules } = useRulesStore.getState();
    const { isShieldActive, toggleShield } = useShieldStore.getState();

    // Find any enabled rule that matches the current day and time
    const matchingRule = timeRules.find((rule) => {
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

    if (matchingRule && !isShieldActive) {
      toggleShield();
      console.log("Shield activated by time rule");
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else if (!matchingRule && isShieldActive) {
      toggleShield();
      console.log("Shield deactivated (no matching time rule)");
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (e) {
    console.error("Shield rules background task error:", e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
}); 