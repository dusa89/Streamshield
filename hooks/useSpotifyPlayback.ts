import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/auth";
import * as SpotifyService from "@/services/spotify";
import { Track } from "@/types/track";
import { dataSync } from "@/services/dataSync";
import { useIsFocused } from "@react-navigation/native";
import { useShieldStore } from "@/stores/shield";
import { useProtectionMechanism } from "@/services/protectionMechanism";

export const useSpotifyPlayback = () => {
  const { user, tokens, logout, setRecentTracks, recentTracks } = useAuthStore();
  const { isShieldActive } = useShieldStore();
  const { processCurrentTrack } = useProtectionMechanism();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isFocused = useIsFocused();
  const processedTrackIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  const getRefreshInterval = () => {
    return isPlaying ? 15000 : 120000; // 15s if playing, 2 mins if paused
  };

  const refreshRecentTracks = useCallback(async () => {
    if (!tokens?.accessToken || !user) return;
    try {
      const recent = await SpotifyService.getRecentlyPlayed();
      const mergedRecent = await dataSync.getMergedHistory(user.id, recent);
      setRecentTracks(mergedRecent); // Update the central store
    } catch (error) {
      console.error("Error refreshing recent tracks:", error);
    }
  }, [tokens?.accessToken, user, setRecentTracks]);

  const refreshCurrentlyPlaying = useCallback(async (isInitial = false) => {
    if (!tokens?.accessToken || !user) return;
    // Use a ref to prevent multiple requests firing at once, without causing re-renders.
    if (loadingRef.current && !isInitial) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const playing = await SpotifyService.getCurrentlyPlaying();

      if (isInitial) {
        await refreshRecentTracks(); // Initial fetch for the central store
      }
      
      setCurrentTrack(playing);
      setIsPlaying(playing?.isPlaying ?? false);
    } catch (error: any) {
      console.error("Error refreshing Spotify data:", error);
      const tokenError = SpotifyService.classifyTokenError(error);
      if (tokenError.type === "revoked" || tokenError.type === "invalid_refresh") {
        logout();
      }
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [tokens?.accessToken, user, logout, refreshRecentTracks]);

  // Effect for polling
  useEffect(() => {
    if (isFocused) {
      refreshCurrentlyPlaying(true); // Initial load with recent tracks
      const interval = setInterval(() => refreshCurrentlyPlaying(), getRefreshInterval());
      return () => clearInterval(interval);
    }
  }, [isFocused, refreshCurrentlyPlaying]);

  // Effect for detecting song changes
  useEffect(() => {
    // Ensure we have a valid track and user, and that we haven't already processed this track ID.
    if (currentTrack?.id && user?.id && tokens?.accessToken && currentTrack.id !== processedTrackIdRef.current) {
      
      // Immediately mark this track as processed to prevent re-entry from other renders.
      processedTrackIdRef.current = currentTrack.id;

      // Always save to history
      dataSync.saveTrackToHistory(currentTrack, user.id).then(() => {
        console.log(`Saved track ${currentTrack.name} to history.`);
        refreshRecentTracks();
      });

      // If shield is active, process track for exclusion
      if (isShieldActive) {
        console.log(`Shield is active. Processing track: ${currentTrack.name}`);
        processCurrentTrack(tokens.accessToken, user.id, currentTrack).catch(
          (err) => {
            console.error("Failed to process track for shield:", err);
          },
        );
      }
    }
  }, [
    currentTrack, // Depend on the whole track object to get the latest info
    user?.id,
    tokens?.accessToken,
    isShieldActive,
    processCurrentTrack,
    refreshRecentTracks,
  ]);

  const handleTogglePlayPause = async () => {
    await SpotifyService.togglePlayback();
    setIsPlaying(!isPlaying);
  };

  const handleNext = async () => {
    await SpotifyService.nextTrack();
    setTimeout(() => refreshCurrentlyPlaying(), 1000); // Refresh after 1s to get new track
  };

  const handlePrevious = async () => {
    await SpotifyService.previousTrack();
    setTimeout(() => refreshCurrentlyPlaying(), 1000); // Refresh after 1s
  };

  return {
    currentTrack,
    isPlaying,
    isLoading,
    refreshCurrentlyPlaying,
    refreshRecentTracks, 
  };
}; 