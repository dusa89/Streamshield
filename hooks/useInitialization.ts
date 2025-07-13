import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth";
import { useShieldStore } from "@/stores/shield";
import { useProtectionMechanism } from "@/services/protectionMechanism";
import { ensureValidExclusionPlaylist as ensurePlaylist } from "@/services/spotify";

export const useInitialization = (setShowInstructions: (show: boolean) => void) => {
  const { user, tokens } = useAuthStore();
  const {
    hasShownInstructions,
    removeDuplicateTracksFromPlaylist,
  } = useProtectionMechanism();
  
  const initialCheckRan = useRef(false);
  const consolidationCheckRan = useRef(false);

  // Check if we need to show the exclusion instructions
  useEffect(() => {
    const checkInstructions = async () => {
      const hasShown = await hasShownInstructions();
      if (!hasShown) {
        const timer = setTimeout(() => {
          setShowInstructions(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    };
    checkInstructions();
  }, [hasShownInstructions, setShowInstructions]);

  // Ensure valid exclusion playlist on app start
  useEffect(() => {
    if (user && tokens?.accessToken && !initialCheckRan.current) {
      initialCheckRan.current = true;
      (async () => {
        try {
          await ensurePlaylist(
            tokens.accessToken,
            user.id,
            null, // Let the function find the playlist
          );
        } catch (error) {
          console.error("Failed to ensure valid exclusion playlist:", error);
        }
      })();
    }
  }, [user, tokens?.accessToken]);

  // Remove duplicates and consolidate playlists on app start
  useEffect(() => {
    if (user && tokens?.accessToken && !consolidationCheckRan.current) {
      consolidationCheckRan.current = true;
      const shieldStore = useShieldStore.getState();
      const lastConsolidation = shieldStore.lastConsolidation || 0;
      const hasRunThisSession = shieldStore.hasRunDuplicateRemovalThisSession;
      const now = Date.now();
      const hoursSinceLastConsolidation = (now - lastConsolidation) / (1000 * 60 * 60);

      if (hoursSinceLastConsolidation > 24 && !hasRunThisSession) {
        (async () => {
          try {
            await removeDuplicateTracksFromPlaylist(
              tokens.accessToken,
              user.id,
            );
            shieldStore.setLastConsolidation(now);
            shieldStore.setHasRunDuplicateRemovalThisSession(true);
          } catch (error) {
            console.error("Failed to run daily consolidation:", error);
          }
        })();
      }
    }
  }, [user, tokens?.accessToken, removeDuplicateTracksFromPlaylist]);
}; 