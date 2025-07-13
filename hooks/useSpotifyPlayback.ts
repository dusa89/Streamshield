import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth";
import * as SpotifyService from "@/services/spotify";
import { Track } from "@/types/track";
import { dataSync } from "@/services/dataSync";
import { useIsFocused } from "@react-navigation/native";

export const useSpotifyPlayback = () => {
  const { user, tokens, logout } = useAuthStore();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isFocused = useIsFocused();

  const getRefreshInterval = () => {
    return isPlaying ? 15000 : 120000; // 15s if playing, 2 mins if paused
  };

  const refreshCurrentlyPlaying = useCallback(async (isInitial = false) => {
    if (!tokens?.accessToken || !user) return;
    if (isLoading && !isInitial) return;

    setIsLoading(true);

    try {
      const [playing, recent] = await Promise.all([
        SpotifyService.getCurrentlyPlaying(),
        SpotifyService.getRecentlyPlayed(),
      ]);

      const mergedRecent = await dataSync.getMergedHistory(user.id, recent);

      setCurrentTrack(playing);
      setRecentTracks(mergedRecent);
      setIsPlaying(playing?.isPlaying ?? false);
    } catch (error: any) {
      console.error("Error refreshing Spotify data:", error);
      const tokenError = SpotifyService.classifyTokenError(error);
      if (tokenError.type === "revoked" || tokenError.type === "invalid_refresh") {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [tokens?.accessToken, user, isLoading, logout]);

  useEffect(() => {
    if (isFocused) {
      refreshCurrentlyPlaying(true); // Initial load
      const interval = setInterval(() => refreshCurrentlyPlaying(), getRefreshInterval());
      return () => clearInterval(interval);
    }
  }, [isFocused, refreshCurrentlyPlaying]);

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
    recentTracks,
    isPlaying,
    isLoading,
    refreshCurrentlyPlaying,
    handleTogglePlayPause,
    handleNext,
    handlePrevious,
  };
}; 