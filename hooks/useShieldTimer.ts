import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useShieldStore } from "@/stores/shield";

export const useShieldTimer = () => {
  const {
    isShieldActive,
    toggleShield,
    shieldDuration,
    isAutoDisableEnabled,
    shieldActivatedAt,
  } = useShieldStore();

  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isShieldActive ?? !isAutoDisableEnabled ?? shieldDuration === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRemainingTime(null);
      return;
    }

    const endTime = (shieldActivatedAt ?? Date.now()) + shieldDuration * 60 * 1000;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((endTime - now) / 1000));
      setRemainingTime(diff);

      if (diff <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // Auto-disable shield when timer ends
        if (useShieldStore.getState().isShieldActive) {
          toggleShield();
          Alert.alert(
            "Shield Disabled",
            "The shield has been automatically disabled after the timer expired.",
          );
        }
      }
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isShieldActive, isAutoDisableEnabled, shieldDuration, shieldActivatedAt, toggleShield]);

  return remainingTime;
}; 