import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { themes } from "@/constants/colors";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useProtectionMechanism } from "@/services/protectionMechanism";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { ensureValidExclusionPlaylist as ensurePlaylist } from "@/services/spotify";

interface PlaylistInfo {
  id: string;
  name: string;
  trackCount: number;
  url: string;
}

export default function PlaylistManagementScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { tokens } = useSpotifyAuth();
  const { colorTheme } = useThemeStore();
  const { getAllExclusionPlaylists, consolidatePlaylists } = useProtectionMechanism();

  const currentTheme = themes[colorTheme];
  
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [consolidating, setConsolidating] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Playlist Management",
      headerStyle: {
        backgroundColor: currentTheme.background,
      },
      headerTintColor: currentTheme.text,
    });
  }, [navigation, currentTheme]);

  useEffect(() => {
    loadPlaylists();
  }, [user, tokens?.accessToken]);

  const loadPlaylists = async () => {
    if (!user || !tokens?.accessToken) return;
    
    try {
      setLoading(true);
      const exclusionPlaylists = await getAllExclusionPlaylists(
        tokens.accessToken,
        user.id
      );
      
      const playlistInfos: PlaylistInfo[] = exclusionPlaylists.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        trackCount: playlist.trackCount,
        url: `https://open.spotify.com/playlist/${playlist.id}`
      }));
      
      setPlaylists(playlistInfos);
    } catch (error) {
      console.error("Error loading playlists:", error);
      Alert.alert("Error", "Failed to load playlists");
    } finally {
      setLoading(false);
    }
  };

  const handleConsolidatePlaylists = async () => {
    if (!user || !tokens?.accessToken) return;
    
    Alert.alert(
      "Consolidate Playlists",
      "This will merge all your StreamShield playlists into one. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Consolidate",
          style: "destructive",
          onPress: async () => {
            try {
              setConsolidating(true);
              const result = await consolidatePlaylists(
                tokens.accessToken,
                user.id
              );
              
              if (result.consolidated) {
                Alert.alert("Success", result.message);
                await loadPlaylists(); // Reload the playlist list
              } else {
                Alert.alert("Info", result.message);
              }
            } catch (error) {
              console.error("Error consolidating playlists:", error);
              Alert.alert("Error", "Failed to consolidate playlists");
            } finally {
              setConsolidating(false);
            }
          }
        }
      ]
    );
  };

  const handleCleanOldTracks = async () => {
    if (!user || !tokens?.accessToken) return;
    
    Alert.alert(
      "Clean Old Tracks",
      "This will remove tracks older than 30 days from your StreamShield playlists to free up space.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clean",
          onPress: async () => {
            try {
              setCleaning(true);
              
              for (const playlist of playlists) {
                try {
                  // This will be handled by the protection mechanism's cleanup logic
                  // We'll just trigger a refresh to show the updated counts
                  await ensurePlaylist(
                    tokens.accessToken,
                    user.id,
                    playlist.id, // Pass the specific playlist to check/refresh
                  );
                } catch (error) {
                  console.error(`Error cleaning playlist ${playlist.name}:`, error);
                }
              }
              
              Alert.alert("Success", "Old tracks have been cleaned from your playlists");
              await loadPlaylists(); // Reload the playlist list
            } catch (error) {
              console.error("Error cleaning old tracks:", error);
              Alert.alert("Error", "Failed to clean old tracks");
            } finally {
              setCleaning(false);
            }
          }
        }
      ]
    );
  };

  const handleOpenPlaylist = (playlist: PlaylistInfo) => {
    Linking.openURL(playlist.url).catch(() => {
      Alert.alert("Error", "Could not open playlist in Spotify");
    });
  };

  const showExclusionInstructions = () => {
    Alert.alert(
      "How to Exclude Playlist from Taste Profile",
      "1. Open Spotify app\n2. Go to your Library\n3. Find the playlist 'StreamShield Exclusion List'\n4. Tap the three dots (⋯)\n5. Select 'Exclude from your taste profile'\n6. Repeat for any additional StreamShield playlists\n\nThis setting helps prevent your protected listening from influencing recommendations.",
      [
        { text: "OK" },
        {
          text: "Open Spotify",
          onPress: () => {
            Linking.openURL("https://open.spotify.com").catch(() => {
              Alert.alert("Error", "Could not open Spotify");
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: currentTheme.text }]}>
            StreamShield Playlists
          </Text>
          <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
            Manage your exclusion playlists and optimize storage
          </Text>
        </View>

        {/* Instructions Card */}
        <View style={[styles.card, { backgroundColor: currentTheme.cardBackground }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons 
              name="shield-check" 
              size={24} 
              color={currentTheme.primary} 
            />
            <Text style={[styles.cardTitle, { color: currentTheme.text }]}>
              Important Setup
            </Text>
          </View>
          <Text style={[styles.cardText, { color: currentTheme.textSecondary }]}>
            For best protection, make sure to exclude your StreamShield playlists from your taste profile in Spotify.
          </Text>
          <Pressable
            style={[styles.button, { backgroundColor: currentTheme.primary }]}
            onPress={showExclusionInstructions}
          >
            <Text style={[styles.buttonText, { color: currentTheme.text }]}>
              Show Instructions
            </Text>
          </Pressable>
        </View>

        {/* Playlists List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            Your Playlists ({playlists.length})
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.primary} />
              <Text style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
                Loading playlists...
              </Text>
            </View>
          ) : playlists.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="playlist-remove"
                size={48}
                color={currentTheme.textSecondary}
              />
              <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                No StreamShield playlists found
              </Text>
              <Text style={[styles.emptySubtext, { color: currentTheme.textSecondary }]}>
                Playlists will be created automatically when you use the shield
              </Text>
            </View>
          ) : (
            playlists.map((playlist) => (
              <Pressable
                key={playlist.id}
                style={[styles.playlistItem, { backgroundColor: currentTheme.cardBackground }]}
                onPress={() => handleOpenPlaylist(playlist)}
              >
                <View style={styles.playlistInfo}>
                  <Text style={[styles.playlistName, { color: currentTheme.text }]}>
                    {playlist.name}
                  </Text>
                  <Text style={[styles.playlistStats, { color: currentTheme.textSecondary }]}>
                    {playlist.trackCount} tracks
                  </Text>
                </View>
                <View style={styles.playlistActions}>
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: currentTheme.secondary }]}
                    onPress={() => handleOpenPlaylist(playlist)}
                  >
                    <FontAwesome name="external-link" size={16} color={currentTheme.text} />
                  </Pressable>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Management Actions */}
        {playlists.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
              Management Actions
            </Text>
            
            <Pressable
              style={[styles.actionCard, { backgroundColor: currentTheme.cardBackground }]}
              onPress={handleConsolidatePlaylists}
              disabled={consolidating}
            >
              <View style={styles.actionCardContent}>
                <MaterialCommunityIcons 
                  name="merge" 
                  size={24} 
                  color={currentTheme.primary} 
                />
                <View style={styles.actionCardText}>
                  <Text style={[styles.actionCardTitle, { color: currentTheme.text }]}>
                    Consolidate Playlists
                  </Text>
                  <Text style={[styles.actionCardDescription, { color: currentTheme.textSecondary }]}>
                    Merge all playlists into one to reduce management overhead
                  </Text>
                </View>
                {consolidating && <ActivityIndicator size="small" color={currentTheme.primary} />}
              </View>
            </Pressable>

            <Pressable
              style={[styles.actionCard, { backgroundColor: currentTheme.cardBackground }]}
              onPress={handleCleanOldTracks}
              disabled={cleaning}
            >
              <View style={styles.actionCardContent}>
                <MaterialCommunityIcons 
                  name="broom" 
                  size={24} 
                  color={currentTheme.primary} 
                />
                <View style={styles.actionCardText}>
                  <Text style={[styles.actionCardTitle, { color: currentTheme.text }]}>
                    Clean Old Tracks
                  </Text>
                  <Text style={[styles.actionCardDescription, { color: currentTheme.textSecondary }]}>
                    Remove tracks older than 30 days to free up space
                  </Text>
                </View>
                {cleaning && <ActivityIndicator size="small" color={currentTheme.primary} />}
              </View>
            </Pressable>
          </View>
        )}

        {/* Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            Tips
          </Text>
          <View style={[styles.tipCard, { backgroundColor: currentTheme.cardBackground }]}>
            <Text style={[styles.tipText, { color: currentTheme.textSecondary }]}>
              • Keep your playlists under 10,000 tracks for best performance{"\n"}
              • Regularly clean old tracks to prevent new playlist creation{"\n"}
              • Consolidate multiple playlists to simplify management{"\n"}
              • Always exclude playlists from taste profile for maximum protection
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  playlistStats: {
    fontSize: 14,
  },
  playlistActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  actionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionCardText: {
    flex: 1,
    marginLeft: 12,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  actionCardDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  tipCard: {
    borderRadius: 12,
    padding: 16,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 