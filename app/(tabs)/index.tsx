import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Shield, Clock, Music, AlertCircle } from "lucide-react-native";
import { useShieldStore } from "@/stores/shield";
import { useAuthStore } from "@/stores/auth";
import { mockCurrentTrack, mockRecentTracks } from "@/mocks/tracks";
import { TrackItem } from "@/components/TrackItem";
import { ExclusionInstructionsModal } from "@/components/ExclusionInstructionsModal";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useProtectionMechanism } from "@/services/protectionMechanism";
import * as SpotifyService from "@/services/spotify";

export default function ShieldScreen() {
  const { user } = useAuthStore();
  const { isShieldActive, toggleShield, shieldDuration, setShieldDuration } = useShieldStore();
  const [currentTrack, setCurrentTrack] = useState(mockCurrentTrack);
  const [recentTracks, setRecentTracks] = useState(mockRecentTracks);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const protectionMechanism = useProtectionMechanism();
  
  // Timer options in minutes
  const timerOptions = [30, 60, 120, 240];
  
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
  
  const handleToggleShield = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      setIsProcessing(true);
      
      if (!isShieldActive) {
        // Activating shield
        const activated = protectionMechanism.activate();
        
        if (activated) {
          // Process current track if there is one
          if (currentTrack) {
            await protectionMechanism.processCurrentTrack("mock-access-token", currentTrack);
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
  
  const refreshCurrentlyPlaying = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would fetch from Spotify API
      const result = await SpotifyService.getCurrentlyPlaying("mock-access-token");
      
      if (result.success && result.track) {
        setCurrentTrack(result.track);
        
        // If shield is active, process this track
        if (isShieldActive && protectionMechanism.isShieldActive()) {
          await protectionMechanism.processCurrentTrack("mock-access-token", result.track);
        }
      }
      
      // Also refresh recently played
      const recentResult = await SpotifyService.getRecentlyPlayed("mock-access-token");
      
      if (recentResult.success && recentResult.tracks) {
        setRecentTracks(recentResult.tracks);
        
        // If shield is active, process any recent tracks that were played during shield
        if (isShieldActive && protectionMechanism.isShieldActive()) {
          await protectionMechanism.processRecentTracks("mock-access-token", recentResult.tracks);
        }
      }
    } catch (error) {
      console.error("Error refreshing currently playing:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize and refresh data on mount
  useEffect(() => {
    refreshCurrentlyPlaying();
    
    // Set up periodic refresh (every 30 seconds)
    const refreshInterval = setInterval(() => {
      refreshCurrentlyPlaying();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
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

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>StreamShield</Text>
          <Text style={styles.subtitle}>
            {user?.subscriptionTier === "free" ? "Free Plan" : 
             user?.subscriptionTier === "premium" ? "Premium Plan" : "Pro Plan"}
          </Text>
        </View>
        
        <View style={styles.shieldContainer}>
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
                <Shield 
                  size={60} 
                  color="#FFFFFF" 
                  fill={isShieldActive ? "#FFFFFF" : "transparent"}
                />
              )}
              <Text style={styles.shieldText}>
                {isProcessing 
                  ? (isShieldActive ? "Deactivating..." : "Activating...") 
                  : (isShieldActive ? "Shield Active" : "Activate Shield")}
              </Text>
              <Text style={styles.shieldDescription}>
                {isShieldActive 
                  ? "Your listening is protected from affecting your Spotify recommendations" 
                  : "Tap to protect your listening session"}
              </Text>
            </Pressable>
          </LinearGradient>
        </View>
        
        {isShieldActive && (
          <View style={styles.timerContainer}>
            <View style={styles.timerHeader}>
              <Clock size={18} color="#1DB954" />
              <Text style={styles.timerTitle}>Auto-disable after:</Text>
            </View>
            <View style={styles.timerOptions}>
              {timerOptions.map((minutes) => (
                <Pressable
                  key={minutes}
                  style={[
                    styles.timerOption,
                    shieldDuration === minutes && styles.timerOptionSelected
                  ]}
                  onPress={() => handleSelectDuration(minutes)}
                >
                  <Text 
                    style={[
                      styles.timerOptionText,
                      shieldDuration === minutes && styles.timerOptionTextSelected
                    ]}
                  >
                    {minutes} min
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.nowPlayingContainer}>
          <View style={styles.sectionHeader}>
            <Music size={18} color="#1DB954" />
            <Text style={styles.sectionTitle}>Now Playing</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color="#1DB954" style={styles.loader} />
            ) : (
              <Pressable onPress={refreshCurrentlyPlaying} style={styles.refreshButton}>
                <Text style={styles.refreshText}>Refresh</Text>
              </Pressable>
            )}
          </View>
          
          {currentTrack ? (
            <TrackItem 
              track={currentTrack} 
              isCurrentlyPlaying={true}
              isShielded={isShieldActive}
            />
          ) : (
            <View style={styles.noMusicContainer}>
              <AlertCircle size={24} color="#999999" />
              <Text style={styles.noMusicText}>No music playing</Text>
            </View>
          )}
        </View>
        
        <View style={styles.recentContainer}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color="#1DB954" />
            <Text style={styles.sectionTitle}>Recently Played</Text>
          </View>
          
          {recentTracks.length > 0 ? (
            recentTracks.map((track) => (
              <TrackItem 
                key={track.id} 
                track={track} 
                isShielded={track.timestamp !== undefined && 
                           isShieldActive && 
                           track.timestamp > (Date.now() - 3600000)}
              />
            ))
          ) : (
            <View style={styles.noMusicContainer}>
              <AlertCircle size={24} color="#999999" />
              <Text style={styles.noMusicText}>No recent tracks</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <ExclusionInstructionsModal 
        visible={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#191414",
  },
  subtitle: {
    fontSize: 14,
    color: "#1DB954",
    marginTop: 4,
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
    color: "#FFFFFF",
    marginTop: 16,
  },
  shieldDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  timerContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
    color: "#191414",
  },
  timerOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timerOption: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  timerOptionSelected: {
    backgroundColor: "#1DB954",
    borderColor: "#1DB954",
  },
  timerOptionText: {
    fontSize: 14,
    color: "#191414",
  },
  timerOptionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "500",
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
    color: "#191414",
  },
  loader: {
    marginLeft: "auto",
  },
  refreshButton: {
    marginLeft: "auto",
  },
  refreshText: {
    fontSize: 14,
    color: "#1DB954",
  },
  noMusicContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  noMusicText: {
    fontSize: 14,
    color: "#999999",
    marginTop: 8,
  },
  recentContainer: {
    marginBottom: 40,
  },
});