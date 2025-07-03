import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, Switch, TextInput, useColorScheme, Text, RefreshControl, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useShieldStore } from "@/stores/shield";
import { useAuthStore } from "@/stores/auth";
import { TrackItem } from "@/components/TrackItem";
import { ExclusionInstructionsModal } from "@/components/ExclusionInstructionsModal";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import * as SpotifyService from "@/services/spotify";
import { Track } from "@/types/track";
import { themes } from '@/constants/colors';
import { typography } from '@/constants/theme';
import { useThemeStore } from "@/stores/theme";
import { classifyTokenError } from '@/services/spotify';
import { useRouter } from 'expo-router';
import Toast from 'react-native-root-toast';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { protectionMechanism } from "@/services/protectionMechanism";
import { Picker } from '@react-native-picker/picker';
import Feather from 'react-native-vector-icons/Feather';

// Define pastel colors for icons
const pastelColors = {
  shield: '#A3C9A8',      // pastel green
  timer: '#A7C7E7',       // pastel blue
  dropdown: '#F7CAC9',    // pastel pink
  add: '#FFF2B2',         // pastel yellow
  delete: '#FFB7B2',      // pastel coral
  music: '#B5EAD7',       // pastel mint
  refresh: '#B5D6EA',     // pastel sky blue
  alert: '#FFDAC1',       // pastel peach
};

export default function ShieldScreen() {
  const { user, isAuthenticated, tokens, logout } = useAuthStore();
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
    defaultShieldDuration,
    setDefaultShieldDuration,
    resetDurationOnDeactivation,
    setResetDurationOnDeactivation,
  } = useShieldStore();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [customDuration, setCustomDuration] = useState("");
  const [isCustomInputVisible, setIsCustomInputVisible] = useState(false);
  const [unit, setUnit] = useState<'min' | 'hr'>('min');
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme, isHydrating } = useThemeStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [autoDisableModalVisible, setAutoDisableModalVisible] = useState(false);
  const [tempDays, setTempDays] = useState(0);
  const [tempHours, setTempHours] = useState(Math.floor(shieldDuration / 60));
  const [tempMinutes, setTempMinutes] = useState(shieldDuration % 60);
  const [tempReset, setTempReset] = useState(resetDurationOnDeactivation);
  const [tempDefault, setTempDefault] = useState(defaultShieldDuration);
  
  // Add defensive programming for theme initialization
  if (isHydrating || !themePref) {
    // Return a loading state while theme is loading
    const defaultTheme = themes.pastelCitrus.light;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: defaultTheme.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={defaultTheme.tint} />
          <Text style={{ marginTop: 16, color: defaultTheme.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme] || themes.pastelCitrus.light; // Fallback to light theme if undefined
  
  const defaultMinutePresets = [10, 15, 30, 45];
  const defaultHourPresets = [1, 2, 4, 6, 8, 24];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Check if we need to show the exclusion instructions
  useEffect(() => {
    // Only show instructions if the user hasn't seen them yet
    if (!protectionMechanism.hasShownInstructions()) {
      // Wait a moment after the screen loads to show the instructions
      const timer = setTimeout(() => {
        setShowInstructions(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Add this useEffect near the top-level of your component (after user/tokens are defined)
  useEffect(() => {
    let didRun = false;
    if (user && tokens?.accessToken && !didRun) {
      didRun = true;
      (async () => {
        try {
          await protectionMechanism.ensureValidExclusionPlaylist(tokens.accessToken, user.id);
        } catch (e) {
          Alert.alert('Error', 'Could not check or create exclusion playlist: ' + ((e as any)?.message || String(e)));
        }
      })();
    }
    // Only run when user or tokens.accessToken changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tokens?.accessToken]);
  
  const handleToggleShield = async () => {
    if (!tokens?.accessToken || !user) {
      Alert.alert('Error', 'You must be logged in to use the shield.');
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      setIsProcessing(true);
      
      if (!isShieldActive) {
        // Activating shield
        const activated = protectionMechanism.activate();
        
        if (activated) {
          // Process current track if there is one and we have an access token
          if (currentTrack && tokens?.accessToken) {
            await protectionMechanism.processCurrentTrack(tokens.accessToken, user.id, currentTrack);
          }
          
          // Toggle the shield state in the store
          toggleShield();
          
          // Set up auto-disable timer if needed
          if (shieldDuration > 0) {
            // In a real app, we would set up a background task or notification
            console.log(`Shield will auto-disable after ${shieldDuration} minutes`);
          }
          
          // Check if we need to show the exclusion instructions
          if (!protectionMechanism.hasShownInstructions()) {
            setShowInstructions(true);
          }
        } else {
          Alert.alert(
            "Shield Activation Failed",
            "Could not activate the shield. Please try again."
          );
        }
      } else {
        // Deactivating shield
        const deactivated = protectionMechanism.deactivate();
        
        if (deactivated) {
          // Toggle the shield state in the store
          toggleShield();
        } else {
          Alert.alert(
            "Shield Deactivation Failed",
            "Could not deactivate the shield. Please try again."
          );
        }
      }
    } catch (error) {
      console.error("Error toggling shield:", error);
      Alert.alert(
        "Shield Error",
        "An error occurred while managing the shield. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSelectDuration = (duration: number) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setShieldDuration(duration);
  };
  
  const handleAddCustomPreset = () => {
    const duration = parseInt(customDuration, 10);
    if (!isNaN(duration) && duration > 0) {
      addAutoDisablePreset(duration);
      setShieldDuration(duration); // Optionally select the new preset
      setCustomDuration(""); // Clear input
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert("Invalid Duration", "Please enter a valid number of minutes.");
    }
  };
  
  const forceLogoutAndRedirect = () => {
    logout();
    router.replace('/(auth)');
  };
  
  const refreshCurrentlyPlaying = async () => {
    if (!tokens?.accessToken || !user) {
      Alert.alert('Error', 'You must be logged in to refresh.');
      return;
    }
    console.log('--- Refresh button pressed: Checking exclusion playlist ---');
    let playlistId: string | null = null;
    let playlistWasCreated = false;
    try {
      // Always check/create the exclusion playlist on refresh, force check by name
      playlistId = await protectionMechanism.ensureValidExclusionPlaylist(tokens.accessToken, user.id, true);
      console.log('Exclusion playlist ID after check:', playlistId);
    } catch (e) {
      Alert.alert('Error', 'Could not check or create exclusion playlist: ' + ((e as any)?.message || String(e)));
      console.log('Error during playlist check:', e);
      return;
    }
    if (!playlistId) {
      Alert.alert('Error', 'No exclusion playlist available.');
      console.log('No exclusion playlist available after check.');
      return;
    }
    setIsLoading(true);
    try {
      // Get currently playing track
      const currentTrackResult = await SpotifyService.getCurrentlyPlaying(tokens.accessToken);
      setCurrentTrack(currentTrackResult);
      // Process current track if shield is active
      if (currentTrackResult && isShieldActive && protectionMechanism.isShieldActive()) {
        await protectionMechanism.processCurrentTrack(tokens.accessToken, user.id, currentTrackResult);
      }
      // Get recently played tracks
      const recentTracksResult = await SpotifyService.getRecentlyPlayed(tokens.accessToken);
      setRecentTracks(recentTracksResult);
      // Process recent tracks if shield is active
      if (recentTracksResult.length > 0 && isShieldActive && protectionMechanism.isShieldActive()) {
        await protectionMechanism.processRecentTracks(tokens.accessToken, user.id, recentTracksResult);
      }
    } catch (error: any) {
      if (error && error.isRateLimit) {
        Toast.show('Things are busy. Some features will update shortly.', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.BOTTOM,
        });
        return;
      }
      console.error("Error refreshing currently playing:", error);
      const { type, message } = classifyTokenError(error);
      if (type === 'network' || type === 'spotify_down') {
        Alert.alert('Connection Error', message, [
          { text: 'Retry', onPress: refreshCurrentlyPlaying },
          { text: 'OK' }
        ]);
      } else if (type === 'revoked' || type === 'invalid_refresh') {
        Alert.alert('Session Expired', message, [
          { text: 'OK', onPress: forceLogoutAndRedirect }
        ]);
      } else {
        // Optionally show a generic error
        Alert.alert('Error', message);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize and refresh data on mount
  useEffect(() => {
    if (tokens?.accessToken) {
      refreshCurrentlyPlaying();
    }
  }, [tokens?.accessToken]); // Refresh when access token becomes available
  
  // Set up periodic refresh (every 30 seconds) only when authenticated
  useEffect(() => {
    if (!tokens?.accessToken) return;
    
    const refreshInterval = setInterval(() => {
      refreshCurrentlyPlaying();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [tokens?.accessToken]);
  
  // Sync shield state with protection mechanism
  useEffect(() => {
    if (isShieldActive !== protectionMechanism.isShieldActive()) {
      if (isShieldActive) {
        protectionMechanism.activate();
      } else {
        protectionMechanism.deactivate();
      }
    }
  }, [isShieldActive]);

  // Show personalized welcome message when authenticated
  const getWelcomeMessage = () => {
    if (!isAuthenticated || !user) {
      return "StreamShield";
    }
    
    const hour = new Date().getHours();
    let greeting = "Hello";
    
    if (hour < 12) {
      greeting = "Good morning";
    } else if (hour < 17) {
      greeting = "Good afternoon";
    } else {
      greeting = "Good evening";
    }
    
    return `${greeting}, ${user.displayName}!`;
  };

  const onPullToRefresh = async () => {
    setRefreshing(true);
    await refreshCurrentlyPlaying();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: 0, flexGrow: 1, justifyContent: 'flex-end' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullToRefresh}
            tintColor={theme.tint}
          />
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>Shield</Text>
          <Pressable onPress={() => {
            setTempDays(Math.floor(defaultShieldDuration / (60 * 24)));
            setTempHours(Math.floor((defaultShieldDuration % (60 * 24)) / 60));
            setTempMinutes(defaultShieldDuration % 60);
            setTempReset(resetDurationOnDeactivation);
            setTempDefault(defaultShieldDuration);
            setAutoDisableModalVisible(true);
          }} style={{ padding: 8 }}>
            <Feather name="settings" size={24} color={theme.tint} />
          </Pressable>
        </View>
        <View style={[styles.shieldContainer, { marginTop: 12 }]}>
          <LinearGradient
            colors={isShieldActive ? ["#1DB954", "#147B36"] : ["#555555", "#333333"]}
            style={styles.shieldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Pressable 
              style={styles.shieldButton}
              onPress={handleToggleShield}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="shield-check" size={60} color={pastelColors.shield} />
              )}
              <Text style={[styles.shieldText, { color: theme.text }]}>
                {isProcessing 
                  ? (isShieldActive ? "Deactivating..." : "Activating...") 
                  : (isShieldActive ? "Shield Active" : "Activate Shield")}
              </Text>
              <Text style={[styles.shieldDescription, { color: theme.text }]}>
                {isShieldActive 
                  ? "Your listening is protected from affecting your Spotify recommendations" 
                  : "Tap to protect your listening session"}
              </Text>
            </Pressable>
          </LinearGradient>
        </View>
        
        {isShieldActive && (
          <View style={[styles.timerContainer, { backgroundColor: theme.background }]}>
            <View style={styles.timerHeader}>
              <MaterialCommunityIcons name="timer-outline" size={24} color={pastelColors.timer} />
              <Text style={[styles.timerTitle, { color: theme.text }]}>Auto-disable shield</Text>
              <Switch
                style={styles.switch}
                value={isAutoDisableEnabled}
                onValueChange={setIsAutoDisableEnabled}
                trackColor={{ false: theme.border, true: theme.tint }}
                thumbColor={theme.background}
              />
              <Pressable onPress={() => setIsDropdownOpen((open) => !open)} style={{ marginLeft: 8, padding: 4 }}>
                <MaterialCommunityIcons name={isDropdownOpen ? 'chevron-up' : 'chevron-down'} size={24} color={pastelColors.dropdown} />
              </Pressable>
            </View>
            {isAutoDisableEnabled && isDropdownOpen && (
              <>
                {/* Unit toggle */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
                  <Pressable
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 18,
                      borderRadius: 20,
                      backgroundColor: unit === 'min' ? theme.tint : theme.background,
                      borderWidth: 1,
                      borderColor: unit === 'min' ? theme.tint : theme.border,
                      marginRight: 8,
                    }}
                    onPress={() => setUnit('min')}
                  >
                    <Text style={{ color: unit === 'min' ? theme.background : theme.text, fontWeight: 'bold' }}>Minutes</Text>
                  </Pressable>
                  <Pressable
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 18,
                      borderRadius: 20,
                      backgroundColor: unit === 'hr' ? theme.tint : theme.background,
                      borderWidth: 1,
                      borderColor: unit === 'hr' ? theme.tint : theme.border,
                    }}
                    onPress={() => setUnit('hr')}
                  >
                    <Text style={{ color: unit === 'hr' ? theme.background : theme.text, fontWeight: 'bold' }}>Hours</Text>
                  </Pressable>
                </View>
                {/* Presets */}
            <View style={styles.timerOptions}>
                  {(unit === 'min' ? defaultMinutePresets.concat(autoDisablePresets.filter(p => !defaultMinutePresets.includes(p) && p < 60)).sort((a, b) => a - b) : defaultHourPresets).map((val) => {
                    const minutes = unit === 'min' ? val : val * 60;
                    const label = unit === 'min' ? `${val} min` : `${val} hr`;
                    return (
                      <View key={label} style={styles.timerOptionWrapper}>
                <Pressable
                  style={[
                    styles.timerOption,
                          { backgroundColor: shieldDuration === minutes ? theme.tint : theme.background, borderColor: shieldDuration === minutes ? theme.tint : theme.border },
                  ]}
                  onPress={() => handleSelectDuration(minutes)}
                >
                          <Text style={[styles.timerOptionText, { color: shieldDuration === minutes ? theme.background : theme.text }]}>{label}</Text>
                      </Pressable>
                        {/* Only allow deleting custom minute presets */}
                        {unit === 'min' && !defaultMinutePresets.includes(val) && (
                        <Pressable
                          style={styles.deleteButton}
                            onPress={() => deleteAutoDisablePreset(val)}
                        >
                            <MaterialCommunityIcons name="close-circle-outline" size={24} color={pastelColors.delete} />
                </Pressable>
                      )}
                    </View>
                    );
                  })}
            </View>
                {/* Custom input */}
                {isCustomInputVisible ? (
                  <View style={styles.customTimerContainer}>
                    <TextInput
                      style={[styles.customTimerInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                      placeholder={unit === 'min' ? 'Custom (min)' : 'Custom (hr)'}
                      placeholderTextColor={theme.text + '99'}
                      keyboardType="numeric"
                      value={customDuration}
                      onChangeText={setCustomDuration}
                    />
                    <Pressable
                      style={[styles.addButton, { backgroundColor: theme.tint }]}
                      onPress={() => {
                        const val = parseInt(customDuration, 10);
                        if (!isNaN(val) && val > 0) {
                          const minutes = unit === 'min' ? val : val * 60;
                          addAutoDisablePreset(minutes);
                          setShieldDuration(minutes);
                          setCustomDuration("");
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } else {
                          Alert.alert("Invalid Duration", `Please enter a valid number of ${unit === 'min' ? 'minutes' : 'hours'}.`);
                        }
                      }}
                    >
                      <Text style={[styles.addButtonText, { color: theme.background }]}>Add & Use</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={[styles.showCustomButton, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={() => setIsCustomInputVisible(true)}>
                    <MaterialCommunityIcons name="plus-circle-outline" size={24} color={pastelColors.add} />
                    <Text style={[styles.showCustomButtonText, { color: theme.tint }]}>Add Custom Time</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}
        
        <View style={styles.nowPlayingContainer}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="music-note-outline" size={24} color={pastelColors.music} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Now Playing</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.tint} style={styles.loader} />
            ) : (
              <Pressable onPress={refreshCurrentlyPlaying} style={styles.refreshButton}>
                <MaterialCommunityIcons name="refresh" size={20} color={pastelColors.refresh} />
              </Pressable>
            )}
          </View>
          
          {currentTrack && (
            <TrackItem
              track={currentTrack}
              isCurrentlyPlaying={true}
              isShielded={isShieldActive}
              onExclude={async () => {
                if (!tokens?.accessToken || !user) return;
                try {
                  await protectionMechanism.robustlyAddTrackToExclusionPlaylist(tokens.accessToken, user.id, currentTrack);
                  Alert.alert('Success', 'Track added to exclusion playlist.');
                  await refreshCurrentlyPlaying();
                } catch (e) { Alert.alert('Error', 'Failed to add track.'); }
              }}
              onUndo={async () => {
                if (!tokens?.accessToken || !user) return;
                try {
                  await protectionMechanism.robustlyRemoveTrackFromExclusionPlaylist(tokens.accessToken, user.id, currentTrack);
                  Alert.alert('Success', 'Track exclusion undone.');
                  await refreshCurrentlyPlaying();
                } catch (e) { Alert.alert('Error', 'Failed to undo exclusion.'); }
              }}
              onExcludeAlbum={async () => {
                if (!tokens?.accessToken || !user || !currentTrack.albumId) return;
                try {
                  const albumTracks = await SpotifyService.getAlbumTracks(tokens.accessToken, currentTrack.albumId);
                  for (const t of albumTracks) {
                    await protectionMechanism.robustlyAddTrackToExclusionPlaylist(tokens.accessToken, user.id, t);
                  }
                  Alert.alert('Success', 'Album tracks added to exclusion playlist.');
                  await refreshCurrentlyPlaying();
                } catch (e) { Alert.alert('Error', 'Failed to exclude album.'); }
              }}
              onUndoAlbum={async () => {
                if (!tokens?.accessToken || !user || !currentTrack.albumId) return;
                try {
                  const albumTracks = await SpotifyService.getAlbumTracks(tokens.accessToken, currentTrack.albumId);
                  for (const t of albumTracks) {
                    await protectionMechanism.robustlyRemoveTrackFromExclusionPlaylist(tokens.accessToken, user.id, t);
                  }
                  Alert.alert('Success', 'Album exclusion undone.');
                  await refreshCurrentlyPlaying();
                } catch (e) { Alert.alert('Error', 'Failed to undo album exclusion.'); }
              }}
              onExcludeArtist={async () => {
                if (!tokens?.accessToken || !user || !currentTrack.artistId) return;
                try {
                  const artistTracks = await SpotifyService.getArtistTracks(tokens.accessToken, currentTrack.artistId);
                  for (const t of artistTracks) {
                    await protectionMechanism.robustlyAddTrackToExclusionPlaylist(tokens.accessToken, user.id, t);
                  }
                  Alert.alert('Success', 'Artist tracks added to exclusion playlist.');
                  await refreshCurrentlyPlaying();
                } catch (e) { Alert.alert('Error', 'Failed to exclude artist.'); }
              }}
              onUndoArtist={async () => {
                if (!tokens?.accessToken || !user || !currentTrack.artistId) return;
                try {
                  const artistTracks = await SpotifyService.getArtistTracks(tokens.accessToken, currentTrack.artistId);
                  for (const t of artistTracks) {
                    await protectionMechanism.robustlyRemoveTrackFromExclusionPlaylist(tokens.accessToken, user.id, t);
                  }
                  Alert.alert('Success', 'Artist exclusion undone.');
                  await refreshCurrentlyPlaying();
                } catch (e) { Alert.alert('Error', 'Failed to undo artist exclusion.'); }
              }}
            />
          )}
        </View>
        
        <View style={styles.recentContainer}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="timer-outline" size={24} color={theme.tint} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recently Played</Text>
          </View>
          
          {recentTracks.length > 0 ? (
            recentTracks.map((track) => (
              <TrackItem 
                key={`${track.id}-${track.timestamp}`}
                track={track} 
                isShielded={track.timestamp !== undefined && 
                           isShieldActive && 
                           track.timestamp > (Date.now() - 3600000)}
                onExclude={async () => {
                  if (!tokens?.accessToken || !user) return;
                  try {
                    await protectionMechanism.robustlyAddTrackToExclusionPlaylist(tokens.accessToken, user.id, track);
                    Alert.alert('Success', 'Track added to exclusion playlist.');
                    await refreshCurrentlyPlaying();
                  } catch (e) { Alert.alert('Error', 'Failed to add track.'); }
                }}
                onUndo={async () => {
                  if (!tokens?.accessToken || !user) return;
                  try {
                    await protectionMechanism.robustlyRemoveTrackFromExclusionPlaylist(tokens.accessToken, user.id, track);
                    Alert.alert('Success', 'Track exclusion undone.');
                    await refreshCurrentlyPlaying();
                  } catch (e) { Alert.alert('Error', 'Failed to undo exclusion.'); }
                }}
                onExcludeAlbum={async () => {
                  if (!tokens?.accessToken || !user || !track.albumId) return;
                  try {
                    const albumTracks = await SpotifyService.getAlbumTracks(tokens.accessToken, track.albumId);
                    for (const t of albumTracks) {
                      await protectionMechanism.robustlyAddTrackToExclusionPlaylist(tokens.accessToken, user.id, t);
                    }
                    Alert.alert('Success', 'Album tracks added to exclusion playlist.');
                    await refreshCurrentlyPlaying();
                  } catch (e) { Alert.alert('Error', 'Failed to exclude album.'); }
                }}
                onUndoAlbum={async () => {
                  if (!tokens?.accessToken || !user || !track.albumId) return;
                  try {
                    const albumTracks = await SpotifyService.getAlbumTracks(tokens.accessToken, track.albumId);
                    for (const t of albumTracks) {
                      await protectionMechanism.robustlyRemoveTrackFromExclusionPlaylist(tokens.accessToken, user.id, t);
                    }
                    Alert.alert('Success', 'Album exclusion undone.');
                    await refreshCurrentlyPlaying();
                  } catch (e) { Alert.alert('Error', 'Failed to undo album exclusion.'); }
                }}
                onExcludeArtist={async () => {
                  if (!tokens?.accessToken || !user || !track.artistId) return;
                  try {
                    const artistTracks = await SpotifyService.getArtistTracks(tokens.accessToken, track.artistId);
                    for (const t of artistTracks) {
                      await protectionMechanism.robustlyAddTrackToExclusionPlaylist(tokens.accessToken, user.id, t);
                    }
                    Alert.alert('Success', 'Artist tracks added to exclusion playlist.');
                    await refreshCurrentlyPlaying();
                  } catch (e) { Alert.alert('Error', 'Failed to exclude artist.'); }
                }}
                onUndoArtist={async () => {
                  if (!tokens?.accessToken || !user || !track.artistId) return;
                  try {
                    const artistTracks = await SpotifyService.getArtistTracks(tokens.accessToken, track.artistId);
                    for (const t of artistTracks) {
                      await protectionMechanism.robustlyRemoveTrackFromExclusionPlaylist(tokens.accessToken, user.id, t);
                    }
                    Alert.alert('Success', 'Artist exclusion undone.');
                    await refreshCurrentlyPlaying();
                  } catch (e) { Alert.alert('Error', 'Failed to undo artist exclusion.'); }
                }}
              />
            ))
          ) : (
            <View style={styles.noMusicContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color={pastelColors.alert} />
              <Text style={[styles.noMusicText, { color: theme.tabIconDefault }]}>No recent tracks</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <ExclusionInstructionsModal 
        visible={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
      <Modal
        visible={autoDisableModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAutoDisableModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.text + '80', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: theme.background, borderRadius: 16, padding: 24, width: '90%', maxWidth: 400 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>Auto-Disable Shield Settings</Text>
            <Text style={{ color: theme.text, marginBottom: 8 }}>Set Shield Duration</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: theme.tabIconDefault }}>Days</Text>
                <Picker
                  selectedValue={tempDays}
                  style={{ width: 80, height: 120 }}
                  onValueChange={setTempDays}
                >
                  {[...Array(8).keys()].map((d) => <Picker.Item key={d} label={String(d)} value={d} />)}
                </Picker>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: theme.tabIconDefault }}>Hours</Text>
                <Picker
                  selectedValue={tempHours}
                  style={{ width: 80, height: 120 }}
                  onValueChange={setTempHours}
                >
                  {[...Array(24).keys()].map((h) => <Picker.Item key={h} label={String(h)} value={h} />)}
                </Picker>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: theme.tabIconDefault }}>Minutes</Text>
                <Picker
                  selectedValue={tempMinutes}
                  style={{ width: 80, height: 120 }}
                  onValueChange={setTempMinutes}
                >
                  {[...Array(60).keys()].map((m) => <Picker.Item key={m} label={String(m)} value={m} />)}
                </Picker>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Switch
                value={tempReset}
                onValueChange={setTempReset}
                trackColor={{ false: theme.border, true: theme.tint }}
                thumbColor={theme.background}
              />
              <Text style={{ color: theme.text, marginLeft: 8 }}>Reset duration to default after shield deactivation</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Switch
                value={tempDefault === (tempDays * 24 * 60 + tempHours * 60 + tempMinutes)}
                onValueChange={(v) => {
                  if (v) setTempDefault(tempDays * 24 * 60 + tempHours * 60 + tempMinutes);
                }}
                trackColor={{ false: theme.border, true: theme.tint }}
                thumbColor={theme.background}
              />
              <Text style={{ color: theme.text, marginLeft: 8 }}>Set as default duration</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Pressable
                style={{ padding: 10, marginRight: 8 }}
                onPress={() => setAutoDisableModalVisible(false)}
              >
                <Text style={{ color: theme.tabIconDefault }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={{ padding: 10, backgroundColor: theme.tint, borderRadius: 8 }}
                onPress={() => {
                  const totalMinutes = tempDays * 24 * 60 + tempHours * 60 + tempMinutes;
                  setShieldDuration(totalMinutes);
                  setDefaultShieldDuration(tempDefault);
                  setResetDurationOnDeactivation(tempReset);
                  setAutoDisableModalVisible(false);
                }}
              >
                <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  shieldContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  shieldGradient: {
    borderRadius: 16,
    overflow: "hidden",
  },
  shieldButton: {
    alignItems: "center",
    padding: 24,
  },
  shieldText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  shieldDescription: {
    fontSize: 14,
    opacity: 0.9,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  timerContainer: {
    marginTop: 30,
    marginHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  switch: {
    marginLeft: 'auto',
  },
  timerOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 15,
    paddingHorizontal: 15,
  },
  timerOptionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 5,
  },
  timerOption: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
  },
  timerOptionText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  deleteButton: {
    marginLeft: -10,
    padding: 5,
    zIndex: 1,
  },
  customTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
  },
  customTimerInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    borderWidth: 1,
  },
  addButton: {
    paddingHorizontal: 15,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  addButtonText: {
    fontWeight: 'bold',
  },
  nowPlayingContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loader: {
    marginLeft: "auto",
  },
  refreshButton: {
    marginLeft: "auto",
  },
  refreshText: {
    fontSize: 14,
  },
  noMusicContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  noMusicText: {
    fontSize: 14,
    marginTop: 8,
  },
  recentContainer: {
    marginBottom: 8,
  },
  showCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  showCustomButtonText: {
    fontWeight: 'bold',
    marginLeft: 10,
  },
});