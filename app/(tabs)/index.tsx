import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Switch,
  TextInput,
  useColorScheme,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useShieldStore } from "@/stores/shield";
import { useAuthStore } from "@/stores/auth";
import { TrackItem } from "@/components/TrackItem";
import { ExclusionInstructionsModal } from "@/components/ExclusionInstructionsModal";
import { SuccessToast } from "@/components/SuccessToast";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import * as SpotifyService from "@/services/spotify";
import { Track } from "@/types/track";
import { themes } from "@/constants/colors";
import { useThemeStore } from "@/stores/theme";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProtectionMechanism } from "@/services/protectionMechanism";
import { dataSync } from "@/services/dataSync";
import { useShieldTimer } from "@/hooks/useShieldTimer";
import { useInitialization } from "@/hooks/useInitialization";
import { useSpotifyPlayback } from "@/hooks/useSpotifyPlayback";
import { createStyles } from "@/styles/shieldScreen";

// Define pastel colors for icons
const pastelColors = {
  shield: "#A3C9A8", // pastel green
  timer: "#A7C7E7", // pastel blue
  dropdown: "#F7CAC9", // pastel pink
  add: "#FFF2B2", // pastel yellow
  delete: "#FFB7B2", // pastel coral
  music: "#B5EAD7", // pastel mint
  refresh: "#B5D6EA", // pastel sky blue
  alert: "#FFDAC1", // pastel peach
};

// Define a fixed height for the visible part of the header
const HEADER_CONTENT_HEIGHT = 48; // Facebook-style compact header height

export default function ShieldScreen() {
  const { user, tokens, recentTracks } = useAuthStore();
  const {
    isShieldActive,
    toggleShield,
    shieldDuration,
    setShieldDuration,
    isAutoDisableEnabled,
    setIsAutoDisableEnabled,
    autoDisablePresets,
    addAutoDisablePreset,
    deleteAutoDisablePreset,
    setShieldActivatedAt,
    hideAutoDisableWarning,
    setHideAutoDisableWarning,
  } = useShieldStore();

  const {
    currentTrack,
    isPlaying,
    isLoading,
    refreshCurrentlyPlaying,
  } = useSpotifyPlayback();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [customDuration, setCustomDuration] = useState("");
  const [isCustomInputVisible, setIsCustomInputVisible] = useState(false);
  const [unit, setUnit] = useState<"min" | "hr">("min");
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme, isHydrating } = useThemeStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const remainingTime = useShieldTimer();
  const { isInitialized } = useInitialization(setShowInstructions);
  const protection = useProtectionMechanism();

  const [showDisableWarning, setShowDisableWarning] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const pendingSwitchValue = useRef<boolean>(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [playlistLoading] = useState(false);
  const [availablePlaylists] = useState<Array<{ id: string; name: string; trackCount: number }>>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [batchExcludeModalVisible, setBatchExcludeModalVisible] =
    useState(false);
  const [batchExcludeLoading, setBatchExcludeLoading] = useState(false);
  const [batchExcludeProgress] = useState<{ current: number; total: number; type: string } | null>(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const selectionModeAnimation = useRef(new Animated.Value(0)).current;
  const checkboxAnimation = useRef(new Animated.Value(0)).current;
  const [undoLoading, setUndoLoading] = useState(false);
  const [excludeLoading, setExcludeLoading] = useState(false);
  const [excludeModalVisible, setExcludeModalVisible] = useState(false);
  const [undoModalVisible, setUndoModalVisible] = useState(false);
  const [successToastVisible, setSuccessToastVisible] = useState(false);
  const [successToastMessage, setSuccessToastMessage] = useState("Success");

  // Animation values for playback controls
  const playButtonAnimation = useRef(new Animated.Value(1)).current;
  const previousButtonAnimation = useRef(new Animated.Value(1)).current;
  const nextButtonAnimation = useRef(new Animated.Value(1)).current;

  // Add defensive programming for theme initialization
  if (isHydrating || !themePref) {
    // Return a loading state while theme is loading
    const defaultTheme = themes.pastelCitrus.light;
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: defaultTheme.background }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={defaultTheme.tint} />
          <Text style={{ marginTop: 16, color: defaultTheme.text }}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const effectiveTheme =
    themePref === "auto" ? (colorScheme ?? "light") : themePref;
  const theme = themes[colorTheme][effectiveTheme] || themes.pastelCitrus.light; // Fallback to light theme if undefined
  const styles = createStyles(theme);

  const defaultMinutePresets = [10, 15, 30, 45];
  const defaultHourPresets = [1, 2, 4, 6, 8, 24]; // Remove 100 hours preset
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleToggleShield = async () => {
    if (!tokens?.accessToken || !user) {
      router.push('/(auth)/login');
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      setIsProcessing(true);
      if (!isShieldActive) {
        const activated = protection.activate();
        if (activated) {
          if (currentTrack && tokens.accessToken) {
            await protection.processCurrentTrack(tokens.accessToken, user.id, currentTrack);
          }
          await toggleShield(user.id);
          if (shieldDuration > 0) {
            console.log(`Shield will auto-disable after ${shieldDuration} minutes`);
          }
          if (!protection.hasShownInstructions()) {
            setShowInstructions(true);
          }
        } else {
          Alert.alert("Shield Activation Failed", "Could not activate the shield.");
        }
      } else {
        const deactivated = protection.deactivate();
        if (deactivated) {
          await toggleShield(user.id);
        } else {
          Alert.alert("Shield Deactivation Failed", "Could not deactivate the shield.");
        }
      }
    } catch (error) {
      console.error("Error toggling shield:", error);
      Alert.alert("Shield Error", "An error occurred while managing the shield.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectDuration = (duration: number) => {
    if (duration === -1) {
      // Custom duration
      setIsCustomInputVisible(true);
    } else {
      setShieldDuration(duration);
    }
    setIsDropdownOpen(false);
  };

  const showSuccessToast = (message: string) => {
    setSuccessToastMessage(message);
    setSuccessToastVisible(true);
  };

  const onPullToRefresh = async () => {
    await refreshCurrentlyPlaying();
  };

  const handleExcludeSingleTrack = async (track: Track) => {
    if (!tokens?.accessToken || !user) return;
    if (!protection) {
      Alert.alert("Error", "Protection mechanism not initialized.");
      return;
    }
    setIsProcessing(true);
    try {
      const success = await protection.robustlyAddTracksToExclusionPlaylist(
        tokens.accessToken,
        user.id,
        [track],
      );
      if (success) {
        showSuccessToast("Track excluded successfully");
        await refreshCurrentlyPlaying();
      } else {
        Alert.alert("Error", "Failed to exclude track.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "An unknown error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndoSingleTrack = async (track: Track) => {
    if (!tokens?.accessToken || !user) return;
    if (!protection) {
      Alert.alert("Error", "Protection mechanism not initialized.");
      return;
    }
    setIsProcessing(true);
    try {
      const success = await protection.robustlyRemoveTracksFromExclusionPlaylist(
        tokens.accessToken,
        user.id,
        [track],
      );
      if (success) {
        showSuccessToast("Exclusion undone successfully");
        await refreshCurrentlyPlaying();
      } else {
        Alert.alert("Error", "Failed to undo exclusion.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "An unknown error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const scrollHandler = () => {};

  // Initialize data sync and refresh data on mount
  useEffect(() => {
    if (tokens?.accessToken && user) {
      // Initialize cloud sync
      dataSync.initializeSync(user.id).catch((error) => {
        console.error("Failed to initialize data sync:", error);
      });

      // Refresh currently playing
      refreshCurrentlyPlaying();
    }
  }, [tokens?.accessToken, user]);

  // Add authentication check to prevent API calls when not logged in
  useEffect(() => {
    if (!tokens?.accessToken || !user) {
      console.log("User not authenticated, skipping API calls");
      return;
    }
  }, [tokens?.accessToken, user]); // Refresh when access token or user becomes available

  // This effect handles the periodic refresh of the "currently playing" track.
  useEffect(() => {
    // We only want to set up an interval if the user is logged in.
    if (!tokens?.accessToken) {
      console.log("User not authenticated, skipping periodic refresh setup");
      return;
    }

    const getRefreshInterval = () => {
      // Refresh more frequently if music is playing to keep the UI responsive.
      const newInterval = isPlaying ? 45 : 120; // in seconds
      console.log(`[ShieldScreen] Setting refresh interval to ${newInterval}s`);
      return newInterval * 1000;
    };

    const intervalId = setInterval(() => {
      console.log("[ShieldScreen] Performing periodic refresh...");
      refreshCurrentlyPlaying();
    }, getRefreshInterval());

    // Cleanup function to clear the interval when the component unmounts
    // or when the dependencies of this effect change.
    return () => clearInterval(intervalId);
  }, [isPlaying, tokens?.accessToken, refreshCurrentlyPlaying]);


  // Custom handler for the auto-disable switch
  const handleAutoDisableSwitch = (enabled: boolean) => {
    if (!enabled) {
      if (hideAutoDisableWarning) {
        setIsAutoDisableEnabled(false);
        return;
      }
      pendingSwitchValue.current = false;
      setShowDisableWarning(true);
    } else {
      setIsAutoDisableEnabled(true);
      if (isShieldActive && shieldDuration > 0) {
        setShieldActivatedAt(Date.now());
      }
    }
  };

  const loadPlaylistTracks = async (playlistId: string) => {
    if (!tokens?.accessToken) return;
    try {
      const tracks = await SpotifyService.getAllTracksInPlaylist(
        tokens.accessToken,
        playlistId,
      );
      const playlist = availablePlaylists.find((p) => p.id === playlistId);
      const tracksWithPlaylistInfo = tracks.map((track: any) => ({
        ...track,
        playlistName: playlist?.name ?? "Unknown Playlist",
        playlistId: playlistId,
      }));
      setPlaylistTracks(tracksWithPlaylistInfo);
    } catch {}
  };

  // Helper to toggle selection
  const toggleTrackSelection = (track: Track) => {
    setSelectedTrackIds((prev) =>
      prev.includes(track.id)
        ? prev.filter((id) => id !== track.id)
        : [...prev, track.id],
    );
  };

  const clearTrackSelection = () => {
    setSelectedTrackIds([]);
    setIsSelectionMode(false);
    // Animate out
    Animated.parallel([
      Animated.timing(selectionModeAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(checkboxAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const enterSelectionMode = () => {
    setIsSelectionMode(true);
    // Animate in
    Animated.parallel([
      Animated.timing(selectionModeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(checkboxAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Batch exclude/undo handlers for selected tracks
  const handleBatchExcludeSelected = async () => {
    if (!tokens?.accessToken || !user || selectedTrackIds.length === 0) return;
    if (!protection) {
      Alert.alert("Error", "Protection mechanism not initialized.");
      return;
    }
    setExcludeLoading(true);
    setBatchExcludeLoading(true);
    try {
      const tracksToExclude = recentTracks.filter(t => selectedTrackIds.includes(t.id));
      await protection.robustlyAddTracksInBatch(
        tokens.accessToken,
        user.id,
        tracksToExclude,
      );
      showSuccessToast("Selected tracks excluded");
      clearTrackSelection();
      await refreshCurrentlyPlaying();
    } catch {}
    setBatchExcludeLoading(false);
    setExcludeLoading(false);
  };
  const handleBatchUndoSelected = async () => {
    if (!tokens?.accessToken || !user || selectedTrackIds.length === 0) return;
    if (!protection) {
      Alert.alert("Error", "Protection mechanism not initialized.");
      return;
    }
    setUndoLoading(true);
    setBatchExcludeLoading(true);
    try {
      const tracksToUndo = recentTracks.filter(t => selectedTrackIds.includes(t.id));
      await protection.robustlyRemoveTracksInBatch(
        tokens.accessToken,
        user.id,
        tracksToUndo,
      );
      showSuccessToast("Exclusion undone for selected tracks");
      clearTrackSelection();
      await refreshCurrentlyPlaying();
    } catch {}
    setBatchExcludeLoading(false);
    setUndoLoading(false);
  };

  // Calculate the total dynamic height of the header
  const totalHeaderHeight = insets.top + HEADER_CONTENT_HEIGHT;

  // Add at the top, after imports
  const [excludedTrackIds, setExcludedTrackIds] = useState<Set<string>>(new Set());
  const [excludedAlbumIds, setExcludedAlbumIds] = useState<Set<string>>(new Set());
  const [excludedArtistIds, setExcludedArtistIds] = useState<Set<string>>(new Set());

  // Helper to refresh exclusion state from Spotify
  const refreshExclusionState = useCallback(async () => {
    if (!tokens?.accessToken || !user) return;
    if (!protection) return;
    try {
      // Fetch all exclusion playlists
      const exclusionPlaylists = await protection.getAllExclusionPlaylists(tokens.accessToken, user.id);
      const trackIds = new Set<string>();
      const albumIds = new Set<string>();
      const artistIds = new Set<string>();
      for (const playlist of exclusionPlaylists) {
        const allTracks = await SpotifyService.getAllTracksInPlaylist(tokens.accessToken, playlist.id);
        allTracks.forEach((item: any) => {
          if (item.track?.id) trackIds.add(item.track.id);
          if (item.track?.album?.id) albumIds.add(item.track.album.id);
          if (item.track?.artists?.length) {
            item.track.artists.forEach((artist: any) => artistIds.add(artist.id));
          }
        });
      }
      setExcludedTrackIds(trackIds);
      setExcludedAlbumIds(albumIds);
      setExcludedArtistIds(artistIds);
    } catch {
      // ignore
    }
  }, [tokens?.accessToken, user, protection]);

  // Call on mount and after exclude/undo
  useEffect(() => {
    refreshExclusionState();
  }, [refreshExclusionState]);

  const Header = () => (
    <View
      style={[
        styles.header,
        {
          height: totalHeaderHeight,
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          StreamShield ™
        </Text>
        <Pressable onPress={() => router.push("/settings")}>
          <FontAwesome name="cog" size={24} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );

  const HEADER_HEIGHT = insets.top + HEADER_CONTENT_HEIGHT;
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 1.2],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: "clamp",
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.7],
    outputRange: [1, 0.2],
    extrapolate: "clamp",
  });
  let lastScrollY = 0;
  let isScrollingUp = false;

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ flex: 1 }}>
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
          scrollIndicatorInsets={{ top: HEADER_HEIGHT }}
          contentInsetAdjustmentBehavior="never"
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onPullToRefresh}
              tintColor={theme.tint}
            />
          }
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* Batch Exclusion Progress Indicator */}
          {batchExcludeProgress && (
            <View
              style={[
                styles.progressContainer,
                { backgroundColor: theme.card || "#23272f" },
              ]}
            >
              <View style={styles.progressHeader}>
                <MaterialCommunityIcons
                  name="playlist-remove"
                  size={20}
                  color={theme.tint}
                />
                <Text style={[styles.progressText, { color: theme.text }]}>
                  Batch Excluding {batchExcludeProgress.type}...
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[styles.progressBar, { backgroundColor: theme.border }]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: theme.tint,
                        width: `${(batchExcludeProgress.current / batchExcludeProgress.total) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.progressCount, { color: theme.text + "CC" }]}
                >
                  {batchExcludeProgress.current} / {batchExcludeProgress.total}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.shieldContainer}>
            <TouchableOpacity
              onPress={() => {
                console.log('Shield button pressed');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleToggleShield();
              }}
              disabled={isProcessing || !isInitialized}
              activeOpacity={0.7}
              style={styles.shieldContainer}
            >
              <LinearGradient
                colors={isShieldActive ? [theme.primary, theme.primaryGradient ?? theme.primary] : [theme.card, theme.card]}
                style={styles.shieldCard}
              >
                <Pressable style={styles.shieldSettingsButton} onPress={() => router.push("/settings/shield")}>
                    <MaterialCommunityIcons 
                        name="cog"
                        size={24}
                        color={isShieldActive ? theme.onPrimary ?? theme.text : theme.text}
                    />
                </Pressable>
                <MaterialCommunityIcons 
                    name={isShieldActive ? "shield-check" : "shield-off-outline"}
                    size={64}
                    color={isShieldActive ? theme.onPrimary ?? theme.text : theme.text}
                    style={styles.shieldIcon}
                />
                <Text style={[styles.shieldText, { color: isShieldActive ? theme.onPrimary ?? theme.text : theme.text }]}>
                    {isShieldActive ? "Shield Active" : "Shield Inactive"}
                </Text>
                <Text style={[styles.shieldDescription, { color: isShieldActive ? theme.onPrimary ?? theme.text : theme.subtext }]}>
                    {isShieldActive
                        ? "Your listening is protected from affecting your Spotify recommendations"
                        : "Tap to protect your listening history"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Now Playing section */}
          <View style={styles.nowPlayingContainer}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="music-note-outline"
                size={24}
                color={pastelColors.music}
              />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Now Playing
              </Text>
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.tint}
                  style={styles.loader}
                />
              ) : (
                <Pressable
                  onPress={() => refreshCurrentlyPlaying()}
                  style={styles.refreshButton}
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={20}
                    color={pastelColors.refresh}
                  />
                </Pressable>
              )}
            </View>

            {currentTrack ? (
              <TrackItem
                track={currentTrack}
                isCurrentlyPlaying={true}
                isShielded={Boolean(currentTrack.id) && excludedTrackIds.has(String(currentTrack.id ?? ""))}
                onExclude={() => handleExcludeSingleTrack(currentTrack)}
                onUndo={() => handleUndoSingleTrack(currentTrack)}
                onExcludeAlbum={async () => {
                  if (!tokens?.accessToken || !user || !currentTrack.albumId) {
                    Alert.alert("Error", "Missing album ID or access token.");
                    return;
                  }
                  try {
                    if (currentTrack.albumId) {
                      const id = currentTrack.albumId;
                      setExcludedAlbumIds(prev => new Set([...prev, id]));
                    }
                    const albumTracks = await SpotifyService.getAlbumTracks(
                      tokens.accessToken,
                      currentTrack.albumId,
                    );
                    await protection.robustlyAddTracksInBatch(
                      tokens.accessToken,
                      user.id,
                      albumTracks,
                    );
                    showSuccessToast("All tracks from this album added to exclusion playlist");
                    await refreshCurrentlyPlaying();
                    await refreshExclusionState();
                  } catch {}
                }}
                onUndoAlbum={async () => {
                  if (!tokens?.accessToken || !user || !currentTrack.albumId) return;
                  try {
                    if (currentTrack.albumId) {
                      const id = currentTrack.albumId;
                      setExcludedAlbumIds(prev => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                      });
                    }
                    const albumTracks = await SpotifyService.getAlbumTracks(
                      tokens.accessToken,
                      currentTrack.albumId,
                    );
                    await protection.robustlyRemoveTracksInBatch(
                      tokens.accessToken,
                      user.id,
                      albumTracks,
                    );
                    showSuccessToast("Album tracks removed from exclusion playlist");
                    await refreshCurrentlyPlaying();
                    await refreshExclusionState();
                  } catch {}
                }}
                onExcludeArtist={async () => {
                  if (!tokens?.accessToken || !user || !currentTrack.artistId) {
                    Alert.alert("Error", "Missing artist ID or access token.");
                    return;
                  }
                  try {
                    if (currentTrack.artistId) {
                      const id = currentTrack.artistId;
                      setExcludedArtistIds(prev => new Set([...prev, id]));
                    }
                    const artistTracks = await SpotifyService.getArtistTracks(
                      tokens.accessToken,
                      currentTrack.artistId,
                    );
                    await protection.robustlyAddTracksInBatch(
                      tokens.accessToken,
                      user.id,
                      artistTracks,
                    );
                    showSuccessToast("All tracks from this artist added to exclusion playlist");
                    await refreshCurrentlyPlaying();
                    await refreshExclusionState();
                  } catch {}
                }}
                onUndoArtist={async () => {
                  if (!tokens?.accessToken || !user || !currentTrack.artistId) return;
                  try {
                    if (currentTrack.artistId) {
                      const id = currentTrack.artistId;
                      setExcludedArtistIds(prev => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                      });
                    }
                    const artistTracks = await SpotifyService.getArtistTracks(
                      tokens.accessToken,
                      currentTrack.artistId,
                    );
                    await protection.robustlyRemoveTracksInBatch(
                      tokens.accessToken,
                      user.id,
                      artistTracks,
                    );
                    showSuccessToast("Artist tracks removed from exclusion playlist");
                    await refreshCurrentlyPlaying();
                    await refreshExclusionState();
                  } catch {}
                }}
                isTrackExcluded={Boolean(currentTrack.id) && excludedTrackIds.has(String(currentTrack.id ?? ""))}
                isAlbumExcluded={currentTrack.albumId ? Boolean(currentTrack.albumId) && excludedAlbumIds.has(String(currentTrack.albumId ?? "")) : false}
                isArtistExcluded={currentTrack.artistId ? Boolean(currentTrack.artistId) && excludedArtistIds.has(String(currentTrack.artistId ?? "")) : false}
              />
            ) : (
              <View style={styles.noMusicContainer}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={28}
                  color={pastelColors.alert}
                />
                <Text
                  style={[styles.noMusicText, { color: theme.tabIconDefault }]}
                >
                  No music playing
                </Text>
              </View>
            )}
          </View>

          {/* Playback Controls */}
          {tokens?.accessToken && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                marginVertical: 4,
                paddingHorizontal: 20,
              }}
            >
              <Animated.View
                style={{
                  transform: [{ scale: previousButtonAnimation }],
                  opacity: previousButtonAnimation,
                  shadowColor: theme.tint,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
              }}
            >
              <Pressable
                  onPressIn={() => {
                    Animated.parallel([
                      Animated.timing(previousButtonAnimation, {
                        toValue: 0.95,
                        duration: 100,
                        useNativeDriver: true,
                      }),
                    ]).start();
                  }}
                  onPressOut={() => {
                    Animated.parallel([
                      Animated.timing(previousButtonAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                      }),
                    ]).start();
                  }}
                onPress={async () => {
                  try {
                    await SpotifyService.previousTrack();
                    // Update track info after skipping (2s delay for Spotify API to update)
                    // This quick refresh is intentional for better UX after manual control
                    setTimeout(() => refreshCurrentlyPlaying(), 2000);
                  } catch {}
                }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: theme.background,
                    borderWidth: 2,
                    borderColor: theme.tint,
                    justifyContent: "center",
                    alignItems: "center",
                    marginHorizontal: 12,
                  }}
              >
                <MaterialCommunityIcons
                  name="skip-previous"
                    size={28}
                  color={theme.tint}
                />
              </Pressable>
              </Animated.View>

              <Animated.View
                style={{
                  transform: [{ scale: playButtonAnimation }],
                  opacity: playButtonAnimation,
                  shadowColor: theme.tint,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
              <Pressable
                  onPressIn={() => {
                    Animated.parallel([
                      Animated.timing(playButtonAnimation, {
                        toValue: 0.95,
                        duration: 100,
                        useNativeDriver: true,
                      }),
                    ]).start();
                  }}
                  onPressOut={() => {
                    Animated.parallel([
                      Animated.timing(playButtonAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                      }),
                    ]).start();
                  }}
                onPress={async () => {
                  try {
                    await SpotifyService.togglePlayback();
                    // Update local state immediately for better UX
                    refreshCurrentlyPlaying();
                    // Refresh to get actual state from Spotify
                    setTimeout(() => refreshCurrentlyPlaying(), 2000);
                  } catch {}
                }}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: theme.tint,
                    justifyContent: "center",
                    alignItems: "center",
                    marginHorizontal: 16,
                  }}
              >
                <MaterialCommunityIcons
                    name={isPlaying ? "pause" : "play"}
                    size={32}
                    color={theme.background}
                />
              </Pressable>
              </Animated.View>

              <Animated.View
                style={{
                  transform: [{ scale: nextButtonAnimation }],
                  opacity: nextButtonAnimation,
                  shadowColor: theme.tint,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
              <Pressable
                  onPressIn={() => {
                    Animated.parallel([
                      Animated.timing(nextButtonAnimation, {
                        toValue: 0.95,
                        duration: 100,
                        useNativeDriver: true,
                      }),
                    ]).start();
                  }}
                  onPressOut={() => {
                    Animated.parallel([
                      Animated.timing(nextButtonAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                      }),
                    ]).start();
                  }}
                onPress={async () => {
                  try {
                    await SpotifyService.nextTrack();
                    // Update track info after skipping (longer delay for Spotify to update)
                    setTimeout(() => refreshCurrentlyPlaying(), 2000);
                  } catch {}
                }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: theme.background,
                    borderWidth: 2,
                    borderColor: theme.tint,
                    justifyContent: "center",
                    alignItems: "center",
                    marginHorizontal: 12,
                  }}
              >
                <MaterialCommunityIcons
                  name="skip-next"
                    size={28}
                  color={theme.tint}
                />
              </Pressable>
              </Animated.View>
            </View>
          )}

          <View style={styles.recentContainer}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="timer-outline"
                size={24}
                color={theme.tint}
              />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Recently Played
              </Text>
              {/* Render Select All row when in selection mode */}
              {isSelectionMode && recentTracks.length > 0 && (
                <Pressable
                  style={styles.selectAllRow}
                  onPress={() => {
                    if (selectedTrackIds.length === recentTracks.length) {
                      setSelectedTrackIds([]);
                    } else {
                      setSelectedTrackIds(recentTracks.map((t) => t.id));
                    }
                  }}
                >
                  <View
                    style={[
                      styles.selectAllCheckbox,
                      {
                        borderColor: theme.tint,
                        backgroundColor:
                          selectedTrackIds.length === recentTracks.length
                            ? theme.tint
                            : "transparent",
                      },
                    ]}
                  >
                    {selectedTrackIds.length === recentTracks.length && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={theme.background}
                      />
                    )}
                  </View>
                  <Text style={[styles.selectAllText, { color: theme.text }]}>
                    {selectedTrackIds.length === recentTracks.length
                      ? "Deselect All"
                      : "Select All"}
                  </Text>
                </Pressable>
              )}
            </View>

            {recentTracks.length > 0 ? (
              recentTracks.slice(0, 50).map((track) => (
                <TrackItem
                  key={`${track.id}-${track.timestamp}`}
                  track={track}
                  isShielded={Boolean(track.id) && excludedTrackIds.has(String(track.id ?? ""))}
                  onExclude={() => handleExcludeSingleTrack(track)}
                  onUndo={() => handleUndoSingleTrack(track)}
                  onExcludeAlbum={async () => {
                    if (!tokens?.accessToken || !user || !track.albumId) {
                      Alert.alert("Error", "Missing album ID or access token.");
                      return;
                    }
                    try {
                      if (track.albumId) {
                        const id = track.albumId;
                        setExcludedAlbumIds(prev => new Set([...prev, id]));
                      }
                      const albumTracks = await SpotifyService.getAlbumTracks(
                        tokens.accessToken,
                        track.albumId,
                      );
                      await protection.robustlyAddTracksInBatch(
                        tokens.accessToken,
                        user.id,
                        albumTracks,
                      );
                      showSuccessToast("All tracks from this album added to exclusion playlist");
                      await refreshCurrentlyPlaying();
                      await refreshExclusionState();
                    } catch {}
                  }}
                  onUndoAlbum={async () => {
                    if (!tokens?.accessToken || !user || !track.albumId) return;
                    try {
                      if (track.albumId) {
                        const id = track.albumId;
                        setExcludedAlbumIds(prev => {
                          const next = new Set(prev);
                          next.delete(id);
                          return next;
                        });
                      }
                      const albumTracks = await SpotifyService.getAlbumTracks(
                        tokens.accessToken,
                        track.albumId,
                      );
                      await protection.robustlyRemoveTracksInBatch(
                        tokens.accessToken,
                        user.id,
                        albumTracks,
                      );
                      showSuccessToast("Album tracks removed from exclusion playlist");
                      await refreshCurrentlyPlaying();
                      await refreshExclusionState();
                    } catch {}
                  }}
                  onExcludeArtist={async () => {
                    if (!tokens?.accessToken || !user || !track.artistId) {
                      Alert.alert("Error", "Missing artist ID or access token.");
                      return;
                    }
                    try {
                      if (track.artistId) {
                        const id = track.artistId;
                        setExcludedArtistIds(prev => new Set([...prev, id]));
                      }
                      const artistTracks = await SpotifyService.getArtistTracks(
                        tokens.accessToken,
                        track.artistId,
                      );
                      await protection.robustlyAddTracksInBatch(
                        tokens.accessToken,
                        user.id,
                        artistTracks,
                      );
                      showSuccessToast("All tracks from this artist added to exclusion playlist");
                      await refreshCurrentlyPlaying();
                      await refreshExclusionState();
                    } catch {}
                  }}
                  onUndoArtist={async () => {
                    if (!tokens?.accessToken || !user || !track.artistId) return;
                    try {
                      if (track.artistId) {
                        const id = track.artistId;
                        setExcludedArtistIds(prev => {
                          const next = new Set(prev);
                          next.delete(id);
                          return next;
                        });
                      }
                      const artistTracks = await SpotifyService.getArtistTracks(
                        tokens.accessToken,
                        track.artistId,
                      );
                      await protection.robustlyRemoveTracksInBatch(
                        tokens.accessToken,
                        user.id,
                        artistTracks,
                      );
                      showSuccessToast("Artist tracks removed from exclusion playlist");
                      await refreshCurrentlyPlaying();
                      await refreshExclusionState();
                    } catch {}
                  }}
                  selected={
                    isSelectionMode && selectedTrackIds.includes(track.id)
                  }
                  onSelect={isSelectionMode ? toggleTrackSelection : undefined}
                  onLongPress={enterSelectionMode}
                  checkboxAnimation={checkboxAnimation}
                  isTrackExcluded={Boolean(track.id) && excludedTrackIds.has(String(track.id ?? ""))}
                  isAlbumExcluded={track.albumId ? Boolean(track.albumId) && excludedAlbumIds.has(String(track.albumId ?? "")) : false}
                  isArtistExcluded={track.artistId ? Boolean(track.artistId) && excludedArtistIds.has(String(track.artistId ?? "")) : false}
                />
              ))
            ) : (
              <View style={styles.noMusicContainer}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={28}
                  color={pastelColors.alert}
                />
                <Text
                  style={[styles.noMusicText, { color: theme.tabIconDefault }]}
                >
                  No recent tracks
                </Text>
              </View>
            )}
          </View>
        </Animated.ScrollView>

        {isSelectionMode && (
          <Animated.View
            style={[
              styles.selectionContainer,
              {
                transform: [{ translateY: selectionModeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }) }],
                backgroundColor: theme.card,
                borderTopColor: theme.border,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            <View style={styles.selectionHeader}>
              <Text style={[styles.selectionCount, { color: theme.text }]}>
                {selectedTrackIds.length} selected
              </Text>
              <Pressable onPress={clearTrackSelection}>
                <MaterialCommunityIcons name="close-circle" size={26} color={theme.tabIconDefault} />
              </Pressable>
            </View>
            <View style={styles.selectionActions}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: theme.tint }]}
                onPress={() => setExcludeModalVisible(true)}
                disabled={selectedTrackIds.length === 0}
              >
                <MaterialCommunityIcons name="shield-plus-outline" size={20} color={theme.background} />
                <Text style={[styles.actionButtonText, { color: theme.background }]}>Exclude</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, { backgroundColor: theme.border }]}
                onPress={() => setUndoModalVisible(true)}
                disabled={selectedTrackIds.length === 0}
              >
                <MaterialCommunityIcons name="shield-off-outline" size={20} color={theme.text} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>Undo</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Floating Header - Facebook Style Solid Implementation */}
        <Animated.View
          style={[
            styles.header,
            {
              height: HEADER_HEIGHT,
              backgroundColor: theme.background,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              transform: [{ translateY: headerTranslateY }],
              opacity: headerOpacity,
              elevation: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>StreamShield ™</Text>
            <Pressable onPress={() => router.push("/settings")}> 
              <FontAwesome name="cog" size={24} color={theme.text} />
            </Pressable>
          </View>
        </Animated.View>
      </View>

      <ExclusionInstructionsModal
        visible={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
      {/* Custom modal for disabling auto-disable warning */}
      <Modal
        visible={showDisableWarning}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDisableWarning(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "#0008",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setShowDisableWarning(false)}
        >
          <View
            style={{
              backgroundColor: theme.background,
              padding: 24,
              borderRadius: 16,
              width: 320,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: theme.text,
                fontWeight: "bold",
                fontSize: 18,
                marginBottom: 12,
              }}
            >
              Disable Auto-disable?
            </Text>
            <Text
              style={{
                color: theme.text,
                fontSize: 15,
                marginBottom: 18,
                textAlign: "center",
              }}
            >
              Are you sure you want to turn off the auto-disable timer? The
              shield will remain active until you manually turn it off.
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 18,
              }}
              onPress={() => setDontShowAgain(!dontShowAgain)}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: theme.tint,
                  backgroundColor: dontShowAgain ? theme.tint : "transparent",
                  marginRight: 8,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {dontShowAgain && (
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color={theme.background}
                  />
                )}
              </View>
              <Text style={{ color: theme.text, fontSize: 15 }}>
                Don't show this again
              </Text>
            </TouchableOpacity>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Pressable
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: theme.border,
                  marginRight: 8,
                  alignItems: "center",
                }}
                onPress={() => {
                  setShowDisableWarning(false);
                  setDontShowAgain(false);
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "bold" }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: theme.red,
                  marginLeft: 8,
                  alignItems: "center",
                }}
                onPress={() => {
                  setShowDisableWarning(false);
                  setIsAutoDisableEnabled(false);
                  if (dontShowAgain) setHideAutoDisableWarning(true);
                  setDontShowAgain(false);
                }}
              >
                <Text style={{ color: theme.background, fontWeight: "bold" }}>
                  Turn Off
                </Text>
              </Pressable>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={playlistModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPlaylistModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: theme.text + "80",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "90%",
              maxHeight: "80%",
              backgroundColor: theme.background,
              borderRadius: 20,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: theme.text,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Exclusion Playlists
            </Text>
            {availablePlaylists.length > 1 && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ color: theme.text, fontSize: 14, marginBottom: 8 }}
                >
                  Select Playlist:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 8 }}
                >
                  {availablePlaylists.map((playlist) => (
                    <Pressable
                      key={playlist.id}
                      style={{
                        backgroundColor:
                          selectedPlaylistId === playlist.id
                            ? theme.tint
                            : theme.border,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 16,
                        marginRight: 8,
                        minWidth: 120,
                      }}
                      onPress={() => {
                        setSelectedPlaylistId(playlist.id);
                        loadPlaylistTracks(playlist.id);
                      }}
                    >
                      <Text
                        style={{
                          color:
                            selectedPlaylistId === playlist.id
                              ? theme.background
                              : theme.text,
                          fontSize: 12,
                          fontWeight: "500",
                          textAlign: "center",
                        }}
                      >
                        {playlist.name}
                      </Text>
                      <Text
                        style={{
                          color:
                            selectedPlaylistId === playlist.id
                              ? theme.background + "CC"
                              : theme.text + "CC",
                          fontSize: 10,
                          textAlign: "center",
                          marginTop: 2,
                        }}
                      >
                        {playlist.trackCount} tracks
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
            {selectedPlaylistId && availablePlaylists.length > 0 && (
              <View
                style={{
                  marginBottom: 16,
                  padding: 12,
                  backgroundColor: theme.card || "#23272f",
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}
                >
                  {
                    availablePlaylists.find((p) => p.id === selectedPlaylistId)
                      ?.name
                  }
                </Text>
                <Text
                  style={{
                    color: theme.text + "CC",
                    fontSize: 14,
                    marginTop: 4,
                  }}
                >
                  {playlistTracks.length} tracks loaded
                </Text>
              </View>
            )}
            {playlistLoading ? (
              <ActivityIndicator
                size="large"
                color={theme.tint}
                style={{ marginVertical: 32 }}
              />
            ) : playlistTracks.length === 0 ? (
              <Text
                style={{
                  color: theme.text,
                  textAlign: "center",
                  marginVertical: 32,
                }}
              >
                {availablePlaylists.length === 0
                  ? "No exclusion playlists found."
                  : "No tracks found in this playlist."}
              </Text>
            ) : (
              <FlatList
                data={playlistTracks}
                keyExtractor={(item) =>
                  item.track?.id ?? item.track?.name ?? Math.random().toString()
                }
                style={{ maxHeight: 400 }}
                renderItem={({ item }) => {
                  const track = item.track;
                  const artist = track?.artists
                    ? track.artists.map((a: any) => a.name).join(", ")
                    : "Unknown Artist";
                  const albumArt = track?.album?.images?.[0]?.url;
                  return (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      {albumArt ? (
                        <Image
                          source={{ uri: albumArt }}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 6,
                            marginRight: 12,
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 6,
                            marginRight: 12,
                            backgroundColor: theme.border,
                          }}
                        />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ color: theme.text, fontWeight: "600" }}
                          numberOfLines={1}
                        >
                          {track?.name ?? "Unknown Track"}
                        </Text>
                        <Text
                          style={{ color: theme.tabIconDefault, fontSize: 13 }}
                          numberOfLines={1}
                        >
                          {artist}
                        </Text>
                      </View>
                    </View>
                  );
                }}
              />
            )}
            <Pressable
              style={{
                marginTop: 16,
                backgroundColor: theme.tint,
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: "center",
              }}
              onPress={() => setPlaylistModalVisible(false)}
            >
              <Text
                style={{
                  color: theme.background,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Selection Mode Actions */}
      {isSelectionMode && (
        <Animated.View
          style={[
            styles.selectionModeContainer,
            {
              bottom: insets.bottom,
              left: 0,
              right: 0,
              height: 56,
              backgroundColor: "#2D2D34",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.1)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 20,
            },
          ]}
        >
          <Text style={[styles.selectionText, { color: theme.text }]}>
            {selectedTrackIds.length} selected
          </Text>
          <View style={styles.selectionActions}>
            <Pressable
              style={[
                styles.selectionButton,
                { backgroundColor: theme.card, opacity: undoLoading ? 0.6 : 1 },
              ]}
              onPress={() => setUndoModalVisible(true)}
              disabled={selectedTrackIds.length === 0 || undoLoading}
            >
              {undoLoading ? (
                <ActivityIndicator size="small" color={theme.text} />
              ) : (
                <Text
                  style={[styles.selectionButtonText, { color: theme.text }]}
                >
                  Undo
                </Text>
              )}
            </Pressable>
            <Pressable
              style={[
                styles.selectionButton,
                {
                  backgroundColor: theme.tint,
                  marginLeft: 12,
                  opacity: excludeLoading ? 0.6 : 1,
                },
              ]}
              onPress={() => setExcludeModalVisible(true)}
              disabled={selectedTrackIds.length === 0 || excludeLoading}
            >
              {excludeLoading ? (
                <ActivityIndicator size="small" color={theme.background} />
              ) : (
                <Text
                  style={[
                    styles.selectionButtonText,
                    { color: theme.background },
                  ]}
                >
                  Exclude
                </Text>
              )}
            </Pressable>
          </View>
          <Pressable
            style={styles.selectionCancelButton}
            onPress={clearTrackSelection}
          >
            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
          </Pressable>
        </Animated.View>
      )}
      {/* Batch Exclusion Modal */}
      <Modal
        visible={batchExcludeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBatchExcludeModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: theme.text + "80",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "90%",
              maxHeight: "80%",
              backgroundColor: theme.background,
              borderRadius: 20,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: theme.text,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              Batch Exclusion
            </Text>
            <Text
              style={{
                color: theme.text + "CC",
                fontSize: 14,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Long press any track to start selecting, then use the action
              buttons below
            </Text>
            <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
              {recentTracks.map((track) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  selected={selectedTrackIds.includes(track.id)}
                  onSelect={toggleTrackSelection}
                  onLongPress={enterSelectionMode}
                  isTrackExcluded={Boolean(track.id) && excludedTrackIds.has(String(track.id ?? ""))}
                  isAlbumExcluded={track.albumId ? Boolean(track.albumId) && excludedAlbumIds.has(String(track.albumId ?? "")) : false}
                  isArtistExcluded={track.artistId ? Boolean(track.artistId) && excludedArtistIds.has(String(track.artistId ?? "")) : false}
                />
              ))}
            </ScrollView>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: theme.tint,
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: "center",
                  marginRight: 8,
                  opacity:
                    selectedTrackIds.length === 0 || batchExcludeLoading
                      ? 0.5
                      : 1,
                }}
                onPress={handleBatchExcludeSelected}
                disabled={selectedTrackIds.length === 0 || batchExcludeLoading}
              >
                <Text
                  style={{
                    color: theme.background,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Exclude Selected
                </Text>
              </Pressable>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: theme.card ?? "#23272f",
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: "center",
                  marginLeft: 8,
                  opacity:
                    selectedTrackIds.length === 0 || batchExcludeLoading
                      ? 0.5
                      : 1,
                }}
                onPress={handleBatchUndoSelected}
                disabled={selectedTrackIds.length === 0 || batchExcludeLoading}
              >
                <Text
                  style={{
                    color: theme.text,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Undo Exclusion
                </Text>
              </Pressable>
            </View>
            <Pressable
              style={{
                backgroundColor: theme.border,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={() => {
                setBatchExcludeModalVisible(false);
                clearTrackSelection();
              }}
            >
              <Text
                style={{ color: theme.text, fontWeight: "bold", fontSize: 16 }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Exclude Modal */}
      <Modal
        visible={excludeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExcludeModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setExcludeModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Exclude Selected
            </Text>
            <Pressable
              style={styles.modalOption}
              onPress={async () => {
                if (!tokens?.accessToken || !user) {
                  setExcludeModalVisible(false);
                  Alert.alert("Error", "No access token or user.");
                  return;
                }
                setExcludeModalVisible(false);
                setExcludeLoading(true);
                const tracksToExclude = recentTracks.filter(t => selectedTrackIds.includes(t.id));
                await protection.robustlyAddTracksInBatch(
                  tokens.accessToken,
                  user.id,
                  tracksToExclude,
                );
                setExcludeLoading(false);
                clearTrackSelection();
                await refreshCurrentlyPlaying();
              }}
            >
              <Text style={[styles.modalOptionText, { color: theme.text }]}>
                Track
              </Text>
            </Pressable>
            <Pressable
              style={styles.modalOption}
              onPress={async () => {
                if (!tokens?.accessToken || !user) {
                  setExcludeModalVisible(false);
                  Alert.alert("Error", "No access token or user.");
                  return;
                }
                setExcludeModalVisible(false);
                setExcludeLoading(true);
                const albumsToExclude = new Set(recentTracks.filter(t => selectedTrackIds.includes(t.id)).map(t => t.albumId));
                let allAlbumTracks: Track[] = [];
                for (const albumId of albumsToExclude) {
                  if (albumId) {
                    const albumTracks = await SpotifyService.getAlbumTracks(tokens.accessToken, albumId);
                    allAlbumTracks.push(...albumTracks);
                  }
                }
                await protection.robustlyAddTracksInBatch(
                  tokens.accessToken,
                  user.id,
                  allAlbumTracks,
                );
                setExcludeLoading(false);
                clearTrackSelection();
                await refreshCurrentlyPlaying();
              }}
            >
              <Text style={[styles.modalOptionText, { color: theme.text }]}>
                Album
              </Text>
            </Pressable>
            <Pressable
              style={styles.modalOption}
              onPress={async () => {
                if (!tokens?.accessToken || !user) {
                  setExcludeModalVisible(false);
                  Alert.alert("Error", "No access token or user.");
                  return;
                }
                setExcludeModalVisible(false);
                setExcludeLoading(true);
                const artistsToExclude = new Set(recentTracks.filter(t => selectedTrackIds.includes(t.id)).map(t => t.artistId));
                let allArtistTracks: Track[] = [];
                for (const artistId of artistsToExclude) {
                  if (artistId) {
                    const artistTracks = await SpotifyService.getArtistTracks(tokens.accessToken, artistId);
                    allArtistTracks.push(...artistTracks);
                  }
                }
                await protection.robustlyAddTracksInBatch(
                  tokens.accessToken,
                  user.id,
                  allArtistTracks,
                );
                setExcludeLoading(false);
                clearTrackSelection();
                await refreshCurrentlyPlaying();
              }}
            >
              <Text style={[styles.modalOptionText, { color: theme.text }]}>
                Artist
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      {/* Undo Modal */}
      <Modal
        visible={undoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUndoModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setUndoModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Undo Exclusion
            </Text>
            <Pressable
              style={styles.modalOption}
              onPress={async () => {
                if (!tokens?.accessToken || !user) {
                  setUndoModalVisible(false);
                  Alert.alert("Error", "No access token or user.");
                  return;
                }
                setUndoModalVisible(false);
                setUndoLoading(true);
                const tracksToUndo = recentTracks.filter(t => selectedTrackIds.includes(t.id));
                await protection.robustlyRemoveTracksInBatch(
                  tokens.accessToken,
                  user.id,
                  tracksToUndo,
                );
                setUndoLoading(false);
                clearTrackSelection();
                await refreshCurrentlyPlaying();
              }}
            >
              <Text style={[styles.modalOptionText, { color: theme.text }]}>
                Track
              </Text>
            </Pressable>
            <Pressable
              style={styles.modalOption}
              onPress={async () => {
                if (!tokens?.accessToken || !user) {
                  setUndoModalVisible(false);
                  Alert.alert("Error", "No access token or user.");
                  return;
                }
                setUndoModalVisible(false);
                setUndoLoading(true);
                const albumsToUndo = new Set(recentTracks.filter(t => selectedTrackIds.includes(t.id)).map(t => t.albumId));
                let allAlbumTracks: Track[] = [];
                for (const albumId of albumsToUndo) {
                   if (albumId) {
                    const albumTracks = await SpotifyService.getAlbumTracks(tokens.accessToken, albumId);
                    allAlbumTracks.push(...albumTracks);
                  }
                }
                await protection.robustlyRemoveTracksInBatch(
                  tokens.accessToken,
                  user.id,
                  allAlbumTracks,
                );
                setUndoLoading(false);
                clearTrackSelection();
                await refreshCurrentlyPlaying();
              }}
            >
              <Text style={[styles.modalOptionText, { color: theme.text }]}>
                Album
              </Text>
            </Pressable>
            <Pressable
              style={styles.modalOption}
              onPress={async () => {
                if (!tokens?.accessToken || !user) {
                  setUndoModalVisible(false);
                  Alert.alert("Error", "No access token or user.");
                  return;
                }
                setUndoModalVisible(false);
                setUndoLoading(true);
                const artistsToUndo = new Set(recentTracks.filter(t => selectedTrackIds.includes(t.id)).map(t => t.artistId));
                let allArtistTracks: Track[] = [];
                for (const artistId of artistsToUndo) {
                  if (artistId) {
                    const artistTracks = await SpotifyService.getArtistTracks(tokens.accessToken, artistId);
                    allArtistTracks.push(...artistTracks);
                  }
                }
                await protection.robustlyRemoveTracksInBatch(
                  tokens.accessToken,
                  user.id,
                  allArtistTracks,
                );
                setUndoLoading(false);
                clearTrackSelection();
                await refreshCurrentlyPlaying();
              }}
            >
              <Text style={[styles.modalOptionText, { color: theme.text }]}>
                Artist
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      
      {/* Success Toast */}
      <SuccessToast
        visible={successToastVisible}
        message={successToastMessage}
        onHide={() => setSuccessToastVisible(false)}
      />
    </SafeAreaView>
  );
}
