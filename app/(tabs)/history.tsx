import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  useColorScheme,
  Modal,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HistoryItem, Track } from "@/types/track";
import { useThemeStore } from "@/stores/theme";
import { themes } from "@/constants/colors";
import * as SpotifyService from "@/services/spotify";
import { useProtectionMechanism } from "@/services/protectionMechanism";
import { useAuthStore } from "@/stores/auth";
import Toast from "react-native-root-toast";
import { useShieldStore } from "@/stores/shield";
import { dataSync } from "@/services/dataSync";
import { Image } from "expo-image";
import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { SuccessToast } from "@/components/SuccessToast";
import { useIsFocused } from "@react-navigation/native";

type Tab = "History" | "Exclusions";

interface GroupedHistory {
  [date: string]: HistoryItem[];
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const { tokens, user, recentTracks } = useAuthStore();
  const { 
    getAllExclusionPlaylists, 
    robustlyRemoveTracksFromExclusionPlaylist,
    robustlyAddTracksInBatch,
    robustlyRemoveTracksInBatch,
  } = useProtectionMechanism();
  const isTimestampShielded = useShieldStore((s) => s.isTimestampShielded);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [exclusionHistory, setExclusionHistory] = useState<Track[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("History");
  const [loading, setLoading] = useState(true);
  const [exclusionLoading, setExclusionLoading] = useState(false);
  const [undoLoading, setUndoLoading] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [excludeModalVisible, setExcludeModalVisible] = useState(false);
  const [undoModalVisible, setUndoModalVisible] = useState(false);
  const [successToastVisible, setSuccessToastVisible] = useState(false);

  const [selectedTrack, setSelectedTrack] = useState<HistoryItem | null>(null);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const selectionModeAnimation = useRef(new Animated.Value(0)).current;

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Refresh button animation
  const refreshButtonRotation = useRef(new Animated.Value(0)).current;
  const refreshButtonScale = useRef(new Animated.Value(1)).current;

  // Performance optimization: Cache for exclusion history
  const exclusionHistoryCache = useRef<{ data: Track[]; timestamp: number } | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Add exclusion state tracking like main screen
  const [excludedTrackIds, setExcludedTrackIds] = useState<Set<string>>(new Set());
  const [excludedAlbumIds, setExcludedAlbumIds] = useState<Set<string>>(new Set());
  const [excludedArtistIds, setExcludedArtistIds] = useState<Set<string>>(new Set());
  const [renderCount, setRenderCount] = useState(50); // Moved from renderExclusionHistory

  // Helper to refresh exclusion state from Spotify
  const refreshExclusionState = useCallback(async () => {
    if (!tokens?.accessToken || !user) return;
    try {
      // Fetch all exclusion playlists
      const exclusionPlaylists = await getAllExclusionPlaylists(tokens.accessToken, user.id);
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
  }, [tokens?.accessToken, user, getAllExclusionPlaylists]);

  const handleScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const scrollDown = currentY > lastScrollY.current && currentY > 0;

        Animated.timing(headerTranslateY, {
      toValue: scrollDown ? -110 : 0,
      duration: 250,
          useNativeDriver: true,
        }).start();
    
    lastScrollY.current = currentY;
  };

  // This is the primary data fetching function for the history screen.
  // It now uses the cached recent tracks from the auth store by default.
  const fetchListeningHistory = useCallback(async (forceApiRefresh = false) => {
    console.log(`History: Starting fetch. Force refresh: ${forceApiRefresh}`);
    if (!user) {
      console.log("History: No user, aborting.");
      return;
    }

    try {
      let tracksFromSpotify: Track[] = recentTracks; // Use cached tracks by default

      if (forceApiRefresh) {
        console.log("History: Forcing API refresh.");
        if (!tokens?.accessToken) {
          console.log("History: No token for forced refresh, aborting.");
          return;
        }
        tracksFromSpotify = await SpotifyService.getRecentlyPlayed();
        console.log(`History: Got ${tracksFromSpotify.length} tracks from Spotify API.`);
      } else {
        console.log(`History: Using ${recentTracks.length} cached recent tracks.`);
      }

      console.log("History: Merging with local/cloud data.");
      const merged = await dataSync.getMergedHistory(user.id, tracksFromSpotify);
      console.log(`History: Merged into ${merged.length} total tracks.`);

      const mapped: HistoryItem[] = merged.map((track) => ({
        id: track.id,
        timestamp: track.timestamp ?? Date.now(),
        title: track.name,
        description: track.artist,
        shielded: track.timestamp ? isTimestampShielded(track.timestamp) : false,
        tags: [],
        tracks: 1,
        albumArt: track.albumArt,
        artistId: track.artistId,
        albumId: track.albumId,
        albumName: track.album,
      }));
      
      console.log("History: Setting new history state.");
      setHistory(mapped);

    } catch (e) {
      console.error("Failed to load listening history:", e);
      Toast.show("Failed to load listening history.");
    }
  }, [user, tokens?.accessToken, recentTracks, isTimestampShielded]);

  const fetchExclusionHistory = async (forceRefresh = false) => {
    if (!tokens?.accessToken || !user) return;
    try {
      setExclusionLoading(true);

      const now = Date.now();
      if (
        !forceRefresh &&
        exclusionHistoryCache.current &&
        now - exclusionHistoryCache.current.timestamp < CACHE_DURATION
      ) {
        console.log("Using cached exclusion history");
        setExclusionHistory(exclusionHistoryCache.current.data);
        setExclusionLoading(false);
        return;
      }

      console.log("Fetching fresh exclusion history");
      const exclusionPlaylists = await getAllExclusionPlaylists(
        tokens.accessToken,
        user.id,
      );
      let allTracks: Track[] = [];

      for (const playlist of exclusionPlaylists) {
        const playlistItems = await SpotifyService.getAllTracksInPlaylist(
          tokens.accessToken,
          playlist.id,
        );
        const mappedTracks: (Partial<Track> | null)[] = playlistItems
          .map((item: any) => {
            const track = item.track;
            if (!track || !track.id) return null;
            return {
              id: track.id,
              name: track.name,
              artist: track.artists.map((a: any) => a.name).join(", "),
              artistId: track.artists[0]?.id,
              album: track.album.name,
              albumId: track.album.id,
              albumArt: track.album.images?.[0]?.url ?? "",
              duration: track.duration_ms,
              timestamp: item.added_at
                ? new Date(item.added_at).getTime()
                : Date.now(),
            };
          });
        const validTracks: Track[] = mappedTracks.filter(
          (t): t is Track => t?.id !== undefined
        );
        allTracks = [...allTracks, ...validTracks];
      }

      // Update cache
      exclusionHistoryCache.current = {
        data: allTracks,
        timestamp: now,
      };

      setExclusionHistory(allTracks);
    } catch (e) {
      console.error("Failed to load exclusion history:", e);
      Toast.show("Failed to load exclusion history.");
    } finally {
      setExclusionLoading(false);
    }
  };

  // Refresh function for pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Force refresh when user manually refreshes
      if (activeTab === "History") {
        await fetchListeningHistory(true); // Force API refresh
      } else {
        await fetchExclusionHistory(true); // Force cache bypass
      }
      // Also refresh exclusion state to update shield icons
      await refreshExclusionState();
    } catch (error) {
      console.error("Refresh failed:", error);
      Toast.show("Failed to refresh data.");
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refreshExclusionState, fetchListeningHistory, fetchExclusionHistory]);

  // Refresh button animation
  const animateRefreshButton = useCallback(() => {
    // Scale down and rotate
    Animated.parallel([
      Animated.timing(refreshButtonScale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(refreshButtonRotation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Scale back up
      Animated.timing(refreshButtonScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    // Haptic feedback for better UX
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateRefreshButton();
    await onRefresh();
  }, [animateRefreshButton, onRefresh]);

  // Call on mount and after exclude/undo
  useEffect(() => {
    refreshExclusionState();
  }, [refreshExclusionState]);

  // This effect runs when the screen comes into focus.
  useEffect(() => {
    if (isFocused) {
      console.log("History screen focused, refreshing data from cache...");
      setLoading(true);
      if (activeTab === "History") {
        fetchListeningHistory(false).finally(() => setLoading(false)); // Don't force API refresh
      } else {
        fetchExclusionHistory().finally(() => setLoading(false));
      }
    }
  }, [isFocused, activeTab, fetchListeningHistory]);


  useEffect(() => {
    navigation.setOptions({
      headerShown: false, // We are using a custom animated header
    });
  }, [navigation, theme]);

  const groupedHistory = useMemo(() => {
    return history.reduce((groups: GroupedHistory, item: HistoryItem) => {
      const date = new Date(item.timestamp).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {});
  }, [history]);

  const openMenu = (track: HistoryItem) => {
    setSelectedTrack(track);
    bottomSheetRef.current?.present();
  };

  const enterSelectionMode = () => {
    setIsSelectionMode(true);
    Animated.timing(selectionModeAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const clearSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedTrackIds([]);
  };

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
    );
  };

  const renderListeningHistory = () => {
    if (Object.keys(groupedHistory).length === 0) {
  return (
        <View style={styles.emptyContainer}>
          <Feather name="clock" size={48} color={theme.tabIconDefault} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No History Found</Text>
          <Text style={[styles.emptySubtext, { color: theme.tabIconDefault }]}>
            Your listening sessions will appear here.
          </Text>
        </View>
      );
    }

    return Object.entries(groupedHistory).map(([date, items]) => (
                <View key={date} style={styles.dateGroup}>
        <Text style={[styles.dateHeader, { color: theme.text }]}>{date}</Text>
        {items.map((item, index) => (
          <TrackRow
            key={`${item.id}-${item.timestamp}-${index}-history`}
            item={item}
            onLongPress={enterSelectionMode}
            isShielded={excludedTrackIds.has(item.id)}
            onSelect={() => toggleTrackSelection(item.id)}
            selected={selectedTrackIds.includes(item.id)}
            isSelectionMode={isSelectionMode}
          />
        ))}
      </View>
    ));
  };
  
  const renderExclusionHistory = () => {
    if (exclusionLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.emptyText, { color: theme.text }]}>Loading Exclusions...</Text>
        </View>
      );
    }
    
    if (exclusionHistory.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="slash" size={48} color={theme.tabIconDefault} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No Exclusions Found</Text>
          <Text style={[styles.emptySubtext, { color: theme.tabIconDefault }]}>
            Tracks you add to the exclusion list will appear here.
                  </Text>
        </View>
      );
    }
    
    // Performance optimization: Limit initial render for large lists
    const loadMore = () => {
      if (renderCount < exclusionHistory.length) {
        setRenderCount(prev => Math.min(prev + 50, exclusionHistory.length));
      }
    };
    
    const tracksToRender = exclusionHistory.slice(0, renderCount);
    
    return (
      <>
        {tracksToRender.map((track, index) => {
          const historyItem: HistoryItem = {
              id: track.id,
              timestamp: track.timestamp ?? Date.now(),
              title: track.name,
              description: track.artist ?? "Unknown Artist",
              shielded: false,
              tags: [],
              tracks: 1,
              albumArt: track.albumArt,
              artistId: track.artistId,
              albumId: track.albumId,
              albumName: track.album ?? "Unknown Album",
          };

          return <TrackRow 
                    key={`${track.id}-${index}-exclusion`} 
                    item={historyItem} 
                    onLongPress={() => {}} 
                    isExclusion 
                    onSelect={() => {}}
                    selected={false}
                    isSelectionMode={false}
                  />;
        })}
        {renderCount < exclusionHistory.length && (
          <TouchableOpacity
            style={[styles.loadMoreButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={loadMore}
          >
            <Text style={[styles.loadMoreText, { color: theme.text }]}>
              Load More ({exclusionHistory.length - renderCount} remaining)
            </Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <BottomSheetModalProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "left", "right"]}>
        <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }], backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>History</Text>
            <View style={styles.headerActions}>
              <Animated.View
                          style={{
                  transform: [
                    { scale: refreshButtonScale },
                    {
                      rotate: refreshButtonRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                            style={[
                    styles.refreshButton,
                    {
                      backgroundColor: refreshing ? theme.tint + "20" : theme.card,
                      borderColor: refreshing ? theme.tint : theme.border,
                    },
                  ]}
                  onPress={handleManualRefresh}
                  disabled={refreshing}
                  activeOpacity={0.7}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color={theme.tint} />
                  ) : (
                            <Feather
                      name="refresh-cw"
                      size={20}
                      color={theme.text}
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
              <TouchableOpacity
                style={[styles.settingsButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push("/settings")}
                activeOpacity={0.7}
              >
                <FontAwesome name="cog" size={20} color={theme.text} />
              </TouchableOpacity>
                        </View>
          </View>
          <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
            <TabButton title="Listening" isActive={activeTab === "History"} onPress={() => setActiveTab("History")} />
            <TabButton title="Exclusions" isActive={activeTab === "Exclusions"} onPress={() => setActiveTab("Exclusions")} />
          </View>
        </Animated.View>

        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: 110 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[theme.tint]}
              tintColor={theme.tint}
            />
          }
        >
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color={theme.tint} style={{ marginTop: 50 }} />
          ) : activeTab === "History" ? (
            renderListeningHistory()
          ) : (
            renderExclusionHistory()
          )}
        </ScrollView>
        
        {isSelectionMode && (
          <Animated.View
                            style={[
              styles.selectionContainer,
              {
                transform: [{ translateY: selectionModeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [200, 0],
                }) }],
                backgroundColor: theme.card,
                borderTopColor: theme.border,
                paddingBottom: insets.bottom + 10,
                              },
                            ]}
                          >
            <View style={styles.selectionHeader}>
              <Text style={[styles.selectionCount, { color: theme.text }]}>
                {selectedTrackIds.length} selected
                          </Text>
              <Pressable onPress={clearSelectionMode}>
                <Feather name="x" size={24} color={theme.tabIconDefault} />
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

        {selectedTrack && (
        <BottomSheetModal
          ref={bottomSheetRef}
            index={0}
            snapPoints={["50%"]}
            enablePanDownToClose
          onDismiss={() => setSelectedTrack(null)}
            onChange={(index: number) => {
              if (index === -1) { // Modal is closed
                setSelectedTrack(null);
              }
            }}
          >
            <BottomSheetView>
              <View style={styles.bottomSheetContent}>
                <Text style={[styles.bottomSheetTitle, { color: theme.text }]}>{selectedTrack.title}</Text>
                <Text style={[styles.bottomSheetArtist, { color: theme.tabIconDefault }]}>{selectedTrack.description}</Text>
                <Image source={{ uri: selectedTrack.albumArt }} style={styles.bottomSheetAlbumArt} />
                <View style={styles.bottomSheetDetails}>
                  <Text style={[styles.bottomSheetLabel, { color: theme.tabIconDefault }]}>Artist:</Text>
                  <Text style={[styles.bottomSheetValue, { color: theme.text }]}>{selectedTrack.description}</Text>
                  <Text style={[styles.bottomSheetLabel, { color: theme.tabIconDefault }]}>Album:</Text>
                  <Text style={[styles.bottomSheetValue, { color: theme.text }]}>{selectedTrack.albumName}</Text>
                  <Text style={[styles.bottomSheetLabel, { color: theme.tabIconDefault }]}>Date:</Text>
                  <Text style={[styles.bottomSheetValue, { color: theme.text }]}>
                    {new Date(selectedTrack.timestamp).toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.bottomSheetActions}>
                    <Pressable
                    style={[styles.bottomSheetActionButton, { backgroundColor: theme.tint }]}
                      onPress={() => {
                      if(selectedTrack && tokens?.accessToken && user) {
                        const trackToUnexclude: Track = {
                          id: selectedTrack.id,
                          name: selectedTrack.title,
                          artist: selectedTrack.description,
                          album: selectedTrack.albumName ?? 'Unknown Album',
                          albumArt: selectedTrack.albumArt ?? '',
                        };
                        robustlyRemoveTracksFromExclusionPlaylist(tokens.accessToken, user.id, [trackToUnexclude]);
                        Toast.show("Track removed from exclusion.");
                        refreshExclusionState();
                        bottomSheetRef.current?.dismiss();
                      }
                    }}
                  >
                    <Feather name="x-circle" size={24} color={theme.background} />
                    <Text style={[styles.bottomSheetActionButtonText, { color: theme.background }]}>Remove</Text>
                    </Pressable>
                <Pressable
                    style={[styles.bottomSheetActionButton, { backgroundColor: theme.border }]}
                      onPress={() => {
                      setSelectedTrack(null);
                      bottomSheetRef.current?.dismiss();
                    }}
                  >
                    <Feather name="edit" size={24} color={theme.text} />
                    <Text style={[styles.bottomSheetActionButtonText, { color: theme.text }]}>Edit</Text>
                </Pressable>
              </View>
                </View>
            </BottomSheetView>
          </BottomSheetModal>
        )}
      </SafeAreaView>

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
              Exclude Options
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
                setExclusionLoading(true);
                const tracksToExclude = history
                  .filter(t => selectedTrackIds.includes(t.id))
                  .map((item): Track => ({
                    id: item.id,
                    name: item.title,
                    artist: item.description,
                    album: item.albumName ?? 'Unknown Album',
                    albumArt: item.albumArt ?? '',
                    artistId: item.artistId,
                    albumId: item.albumId,
                    timestamp: item.timestamp,
                  }));
                await robustlyAddTracksInBatch(
                  tokens.accessToken,
                  user.id,
                  tracksToExclude,
                );
                setExclusionLoading(false);
                clearSelectionMode();
                await refreshExclusionState();
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
                setExclusionLoading(true);
                const albumsToExclude = new Set(history.filter(t => selectedTrackIds.includes(t.id)).map(t => t.albumId));
                let allAlbumTracks: Track[] = [];
                for (const albumId of albumsToExclude) {
                  if (albumId) {
                    const albumTracks = await SpotifyService.getAlbumTracks(tokens.accessToken, albumId);
                    allAlbumTracks.push(...albumTracks);
                  }
                }
                await robustlyAddTracksInBatch(
                  tokens.accessToken,
                  user.id,
                  allAlbumTracks,
                );
                setExclusionLoading(false);
                clearSelectionMode();
                await refreshExclusionState();
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
                setExclusionLoading(true);
                const artistsToExclude = new Set(history.filter(t => selectedTrackIds.includes(t.id)).map(t => t.artistId));
                let allArtistTracks: Track[] = [];
                for (const artistId of artistsToExclude) {
                  if (artistId) {
                    const artistTracks = await SpotifyService.getArtistTracks(tokens.accessToken, artistId);
                    allArtistTracks.push(...artistTracks);
                  }
                }
                await robustlyAddTracksInBatch(
                  tokens.accessToken,
                  user.id,
                  allArtistTracks,
                );
                setExclusionLoading(false);
                clearSelectionMode();
                await refreshExclusionState();
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
                const tracksToUndo = history
                  .filter(t => selectedTrackIds.includes(t.id))
                  .map((item): Track => ({
                    id: item.id,
                    name: item.title,
                    artist: item.description,
                    album: item.albumName ?? 'Unknown Album',
                    albumArt: item.albumArt ?? '',
                    artistId: item.artistId,
                    albumId: item.albumId,
                    timestamp: item.timestamp,
                  }));
                await robustlyRemoveTracksInBatch(
                  tokens.accessToken,
                  user.id,
                  tracksToUndo,
                );
                setUndoLoading(false);
                clearSelectionMode();
                await refreshExclusionState();
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
                const albumsToUndo = new Set(history.filter(t => selectedTrackIds.includes(t.id)).map(t => t.albumId));
                let allAlbumTracks: Track[] = [];
                for (const albumId of albumsToUndo) {
                   if (albumId) {
                    const albumTracks = await SpotifyService.getAlbumTracks(tokens.accessToken, albumId);
                    allAlbumTracks.push(...albumTracks);
                  }
                }
                await robustlyRemoveTracksInBatch(
                  tokens.accessToken,
                  user.id,
                  allAlbumTracks,
                );
                setUndoLoading(false);
                clearSelectionMode();
                await refreshExclusionState();
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
                const artistsToUndo = new Set(history.filter(t => selectedTrackIds.includes(t.id)).map(t => t.artistId));
                let allArtistTracks: Track[] = [];
                for (const artistId of artistsToUndo) {
                  if (artistId) {
                    const artistTracks = await SpotifyService.getArtistTracks(tokens.accessToken, artistId);
                    allArtistTracks.push(...artistTracks);
                  }
                }
                await robustlyRemoveTracksInBatch(
                  tokens.accessToken,
                  user.id,
                  allArtistTracks,
                );
                setUndoLoading(false);
                clearSelectionMode();
                await refreshExclusionState();
              }}
            >
              <Text style={[styles.modalOptionText, { color: theme.text }]}>
                Artist
                      </Text>
                    </Pressable>
                  </View>
        </Pressable>
      </Modal>

      {/* Undo and Exclude Success Toasts */}
      <SuccessToast
        visible={successToastVisible}
        message="Success"
        onHide={() => setSuccessToastVisible(false)}
      />

    </BottomSheetModalProvider>
  );
}

const TabButton = ({ title, isActive, onPress }: { title: string, isActive: boolean, onPress: () => void }) => {
  const { theme: themePref, colorTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  return (
    <TouchableOpacity onPress={onPress} style={[styles.tab, isActive && [styles.activeTab, { borderBottomColor: theme.tint }]]}>
      <Text style={[styles.tabText, { color: isActive ? theme.tint : theme.tabIconDefault }]}>
        {title}
                  </Text>
    </TouchableOpacity>
  );
};

const TrackRow = ({ 
  item, 
  onLongPress, 
  isExclusion = false, 
  isShielded = false,
  onSelect,
  selected,
  isSelectionMode
}: { 
  item: HistoryItem, 
  onLongPress: () => void, 
  isExclusion?: boolean, 
  isShielded?: boolean,
  onSelect: () => void,
  selected: boolean,
  isSelectionMode: boolean
}) => {
  const { theme: themePref, colorTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const handlePress = () => {
    if (isSelectionMode) {
      onSelect();
    }
  };

  return (
                    <Pressable
      style={[styles.historyItem, { backgroundColor: selected ? theme.tint + "33" : theme.card, borderBottomColor: theme.border }]}
      onLongPress={onLongPress}
      onPress={handlePress}
    >
      {isSelectionMode && !isExclusion && (
                <View
                      style={[
            styles.checkbox,
            {
              backgroundColor: selected ? theme.tint : theme.background,
              borderColor: theme.border,
            },
          ]}
        >
          {selected && (
                      <Feather
              name="check"
              size={14}
                        color={theme.background}
                      />
          )}
                  </View>
      )}
      <Image source={{ uri: item.albumArt }} style={styles.albumArt} />
      <View style={styles.trackInfo}>
        <Text style={[styles.trackTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.trackArtist, { color: theme.tabIconDefault }]} numberOfLines={1}>{item.description}</Text>
        {isShielded && !isExclusion && (
          <View style={[styles.shieldBadge, { backgroundColor: theme.tint }]}>
            <Feather name="shield" size={10} color={theme.background} />
            </View>
          )}
      </View>
      <Text style={[styles.timeText, { color: theme.tabIconDefault }]}>
        {isExclusion 
          ? new Date(item.timestamp).toLocaleDateString()
          : new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
      <TouchableOpacity style={{ padding: 4 }} onPress={onLongPress}>
        <Feather name="more-horizontal" size={20} color={theme.tabIconDefault} />
      </TouchableOpacity>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 40,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
  },
  selectionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  selectionActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 280,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalOption: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "40%",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: "uppercase",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
    justifyContent: "center",
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  trackArtist: {
    fontSize: 14,
  },
  shieldBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    marginLeft: 8,
  },
  // BottomSheet styles - can be refactored later
  bottomSheetContent: {
    padding: 20,
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  bottomSheetArtist: {
    fontSize: 18,
    marginBottom: 15,
  },
  bottomSheetAlbumArt: {
    width: 100,
    height: 100,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 15,
  },
  bottomSheetDetails: {
    marginBottom: 20,
  },
  bottomSheetLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  bottomSheetValue: {
    fontSize: 16,
    marginBottom: 10,
  },
  bottomSheetActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  bottomSheetActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bottomSheetActionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  loadMoreButton: {
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
