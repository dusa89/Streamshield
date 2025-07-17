import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/stores/auth";
import { useProtectionMechanism } from "@/services/protectionMechanism";
import { Platform } from "react-native";
import { checkAndroidPermissions } from "@/utils/permissions";

export const useInitialization = (setShowInstructions: (show: boolean) => void) => {
  const { user, tokens } = useAuthStore();
  const { initialize, hasShownInstructions } = useProtectionMechanism();
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRan = useRef(false);

  useEffect(() => {
    if (user && tokens?.accessToken && !initializationRan.current) {
      initializationRan.current = true;
      console.log("[Initialization] Starting initialization checks.");

      const init = async () => {
        try {
          // Add Android permission check
          if (Platform.OS === 'android') {
            await checkAndroidPermissions();
          }
          await initialize(tokens.accessToken, user.id);
          setIsInitialized(true);
          console.log("[Initialization] Protection mechanism initialized.");
        } catch (err) {
          // Handle error gracefully
          console.error("[Initialization] Failed:", err);
          setIsInitialized(false);
        }
      };

      init();

      const checkInstructions = async () => {
        const hasShown = await hasShownInstructions();
        if (!hasShown) {
          setTimeout(() => setShowInstructions(true), 2000);
        }
      };
      checkInstructions();
    }
  }, [user, tokens, initialize, hasShownInstructions, setShowInstructions]);

  return { isInitialized };
}; 