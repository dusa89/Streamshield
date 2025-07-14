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
    return isPlaying ? 15000 : 120000;
  };

  const refreshRecentTracks = useCallback(async () => {
    if (!tokens?.accessToken || !user) return;
    try {
      const recent = await SpotifyService.getRecentlyPlayed();
      const mergedRecent = await dataSync.getMergedHistory(user.id, recent);
      setRecentTracks(mergedRecent);
    } catch (error) {
      console.error("Error refreshing recent tracks:", error);
    }
  }, [tokens?.accessToken, user, setRecentTracks]);

  const refreshCurrentlyPlaying = useCallback(async (isInitial = false) => {
    if (!tokens?.accessToken || !user) return;
    if (loadingRef.current && !isInitial) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const playing = await SpotifyService.getCurrentlyPlaying();
      const state = await SpotifyService.getPlaybackState();
      if (isInitial) await refreshRecentTracks();
      setCurrentTrack(playing);
      setIsPlaying(state?.is_playing ?? playing?.isPlaying ?? false);
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

  useEffect(() => {
    if (isFocused) {
      refreshCurrentlyPlaying(true);
      const interval = setInterval(() => refreshCurrentlyPlaying(), getRefreshInterval());
      return () => clearInterval(interval);
    }
  }, [isFocused, refreshCurrentlyPlaying]);

  useEffect(() => {
    if (currentTrack?.id && user?.id && tokens?.accessToken && currentTrack.id !== processedTrackIdRef.current) {
      processedTrackIdRef.current = currentTrack.id;
      dataSync.saveTrackToHistory(currentTrack, user.id).then(() => {
        console.log(`Saved track ${currentTrack.name} to history.`);
        refreshRecentTracks();
      });
      if (isShieldActive) {
        console.log(`Shield is active. Processing track: ${currentTrack.name}`);
        processCurrentTrack(tokens.accessToken, user.id, currentTrack).catch((err) => {
          console.error("Failed to process track for shield:", err);
        });
      }
    }
  }, [currentTrack, user?.id, tokens?.accessToken, isShieldActive, processCurrentTrack, refreshRecentTracks]);

  return {
    currentTrack,
    isPlaying,
    isLoading,
    refreshCurrentlyPlaying,
    refreshRecentTracks,
  };
}; 