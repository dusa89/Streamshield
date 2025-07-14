import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth";
import { useProtectionMechanism } from "@/services/protectionMechanism";

export const useInitialization = (setShowInstructions: (show: boolean) => void) => {
  const { user, tokens } = useAuthStore();
  const {
    initialize,
    hasShownInstructions,
  } = useProtectionMechanism();
  
  const initializationRan = useRef(false);

  // This single effect handles all app initialization logic.
  useEffect(() => {
    if (user && tokens?.accessToken && !initializationRan.current) {
      initializationRan.current = true;
      
      console.log("[Initialization] User authenticated. Starting initialization checks.");

      // Check 1: Show exclusion playlist instructions if they haven't been seen.
      const checkInstructions = async () => {
        const hasShown = await hasShownInstructions();
        if (!hasShown) {
          // Use a short delay to allow the app to settle before showing the modal.
          const timer = setTimeout(() => {
            console.log("[Initialization] Showing exclusion playlist instructions.");
            setShowInstructions(true);
          }, 2000);
          return () => clearTimeout(timer);
        }
      };
      checkInstructions();

      // Check 2: Run the main protection mechanism initialization (including consolidation)
      // We run this after a 30-second delay to avoid blocking the main thread on startup.
      const initialConsolidationTimer = setTimeout(() => {
        console.log("[Initialization] Triggering initial playlist consolidation (30s delay).");
        initialize(tokens.accessToken, user.id).catch((err) => {
          console.error("[Initialization] Initial playlist consolidation failed:", err);
        });
      }, 30 * 1000); // 30 seconds

      return () => {
        clearTimeout(initialConsolidationTimer);
      };
    }
  }, [user, tokens, initialize, hasShownInstructions, setShowInstructions]);
}; 