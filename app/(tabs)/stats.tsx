import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TouchableOpacity, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore } from "@/stores/theme";
import { useColorScheme } from "react-native";
import { themes } from "@/constants/colors";
import * as SpotifyService from "@/services/spotify";
import { useAuthStore } from "@/stores/auth";
import { useShieldStore } from "@/stores/shield";

// Time period filters
const TIME_PERIODS = ["Week", "Month", "Year"];

export default function StatsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState("Week");
  const [showTrueTaste, setShowTrueTaste] = useState(false);
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];
  
  const { tokens } = useAuthStore();
  const [tracks, setTracks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const isTimestampShielded = useShieldStore((s) => s.isTimestampShielded);
  const [artistMenuVisible, setArtistMenuVisible] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);

  // Helper to get the start timestamp for the selected period
  const getPeriodStart = (period: string) => {
    const now = Date.now();
    if (period === 'Week') return now - 7 * 24 * 60 * 60 * 1000;
    if (period === 'Month') return now - 30 * 24 * 60 * 60 * 1000;
    if (period === 'Year') return now - 365 * 24 * 60 * 60 * 1000;
    return 0;
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!tokens?.accessToken) return;
      try {
        const recentTracks = await SpotifyService.getRecentlyPlayed(tokens.accessToken);
        // Mark each track as shielded or not
        const markedTracks = recentTracks.map((t) => ({ ...t, shielded: t.timestamp ? isTimestampShielded(t.timestamp) : false }));
        setTracks(markedTracks);
        // Compute stats for the selected period and taste view
        const periodStart = getPeriodStart(selectedPeriod);
        const tracksForPeriod = markedTracks.filter(t => (t.timestamp || 0) >= periodStart);
        const tracksForStats = showTrueTaste
          ? tracksForPeriod.filter(t => !t.shielded)
          : tracksForPeriod;
        const totalHours = tracksForStats.reduce((sum, t) => sum + (t.duration || 0), 0) / 1000 / 60 / 60;
        const allArtists = tracksForStats.map(t => t.artist).filter(Boolean);
        const artistCounts: Record<string, number> = {};
        allArtists.forEach(a => { artistCounts[a] = (artistCounts[a] || 0) + 1; });
        // Build a map from artist name to artistId (first occurrence wins)
        const artistIdMap: Record<string, string | undefined> = {};
        tracksForStats.forEach(t => {
          if (t.artist && t.artistId && !artistIdMap[t.artist]) {
            artistIdMap[t.artist] = t.artistId;
          }
        });
        const topArtists = Object.entries(artistCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, plays]) => ({ name, plays, id: artistIdMap[name] }));
        setStats({
          totalHours: totalHours.toFixed(1),
          totalTracks: tracksForStats.length,
          topArtists,
          topGenres: [], // Not available from Spotify API directly
        });
      } catch (e) {
        setStats(null);
      }
    };
    fetchStats();
  }, [tokens?.accessToken, isTimestampShielded, selectedPeriod, showTrueTaste]);
  
  if (!stats) {
  return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.text, fontSize: 18 }}>Loading stats...</Text>
        </View>
      </SafeAreaView>
    );
  }
        
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingTop: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text, marginLeft: 20, marginBottom: 8 }}>Stats</Text>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.background, shadowColor: theme.border, borderColor: theme.border }] }>
            <View style={styles.statHeader}>
              <Text style={[styles.statTitle, { color: theme.text }]}>Listening Time</Text>
            </View>
            
            <View style={styles.statContent}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>{stats?.totalHours}h</Text>
                <Text style={[styles.statLabel, { color: theme.text }]}>Total</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>{stats?.totalTracks}</Text>
                <Text style={[styles.statLabel, { color: theme.text }]}>Tracks</Text>
              </View>
            </View>
          </View>
          
          {stats.topArtists && stats.topArtists.length > 0 && (
            <View style={[styles.statCard, { backgroundColor: theme.background, shadowColor: theme.border, borderColor: theme.border }] }>
            <View style={styles.statHeader}>
                <Text style={[styles.statTitle, { color: theme.text }]}>Top Artists</Text>
              </View>
              
              <View style={styles.artistsContainer}>
                {stats.topArtists.map((artist: any, index: number) => (
                  <View key={index} style={[styles.artistItem, { borderBottomColor: theme.border }] }>
                    <Text style={[styles.artistRank, { color: theme.text }]}>{index + 1}</Text>
                    <Text style={[styles.artistName, { color: theme.text }]}>{artist.name}</Text>
                    <Text style={[styles.artistPlays, { color: theme.text }]}>{artist.plays} plays</Text>
                    <TouchableOpacity style={{ marginLeft: 8, padding: 8 }} onPress={() => { setArtistMenuVisible(artist.name); setSelectedArtistId(artist.id); }}>
                      <Text style={{ fontSize: 18, color: theme.tabIconDefault }}>⋮</Text>
                    </TouchableOpacity>
                    {/* 3-dot menu for artist */}
                    <Modal
                      visible={artistMenuVisible === artist.name}
                      transparent
                      animationType="fade"
                      onRequestClose={() => setArtistMenuVisible(null)}
                    >
                      <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setArtistMenuVisible(null)}>
                        <View style={[styles.sheetContainer, { backgroundColor: theme.background, shadowColor: theme.border }] }>
                          <TouchableOpacity style={styles.sheetAction} onPress={async () => {
                            setArtistMenuVisible(null);
                            if (artist.id) {
                              const spotifyUri = `spotify:artist:${artist.id}`;
                              const webUrl = `https://open.spotify.com/artist/${artist.id}`;
                              try {
                                const supported = await Linking.canOpenURL(spotifyUri);
                                if (supported) {
                                  Linking.openURL(spotifyUri);
                                } else {
                                  Linking.openURL(webUrl);
                                }
                              } catch (e) {
                                Linking.openURL(webUrl);
                              }
                            }
                          }}>
                            <Text style={[styles.sheetActionText, { color: theme.text }]}>View Artist on Spotify</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.sheetCancel, { backgroundColor: theme.background }]} onPress={() => setArtistMenuVisible(null)}>
                            <Text style={[styles.sheetCancelText, { color: theme.text }]}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    </Modal>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {stats.topGenres && stats.topGenres.length > 0 && (
            <View style={[styles.statCard, { backgroundColor: theme.background, shadowColor: theme.border, borderColor: theme.border }] }>
              <View style={styles.statHeader}>
                <Text style={[styles.statTitle, { color: theme.text }]}>Top Genres</Text>
            </View>
            
            <View style={styles.genreContainer}>
                {stats.topGenres.map((genre: any, index: number) => (
                <View key={index} style={styles.genreItem}>
                    <View style={[styles.genreBar, { backgroundColor: theme.border }] }>
                    <LinearGradient
                        colors={[theme.tint, "#147B36"]}
                      style={[styles.genreProgress, { width: `${genre.percentage}%` }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <View style={styles.genreInfo}>
                      <Text style={[styles.genreName, { color: theme.text }]}>{genre.name}</Text>
                      <Text style={[styles.genrePercentage, { color: theme.text }]}>{genre.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          )}
          
          {showTrueTaste && (
            <View style={[styles.infoCard, { backgroundColor: theme.border }] }>
              <Text style={[styles.infoTitle, { color: theme.text }]}>About True Taste View</Text>
              <Text style={[styles.infoText, { color: theme.text }]}>
                This view shows your listening stats with all shielded sessions filtered out,
                representing your core music taste as preserved by StreamShield.
              </Text>
            </View>
          )}
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
  },
  statsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  statContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
  },
  genreContainer: {
    marginTop: 8,
  },
  genreItem: {
    marginBottom: 12,
  },
  genreBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  genreProgress: {
    height: "100%",
    borderRadius: 4,
  },
  genreInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  genreName: {
    fontSize: 14,
  },
  genrePercentage: {
    fontSize: 14,
  },
  artistsContainer: {
    marginTop: 8,
  },
  artistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  artistRank: {
    width: 24,
    fontSize: 16,
    fontWeight: "bold",
  },
  artistName: {
    flex: 1,
    fontSize: 14,
  },
  artistPlays: {
    fontSize: 14,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxHeight: '80%',
  },
  sheetAction: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sheetActionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sheetCancel: {
    padding: 16,
  },
  sheetCancelText: {
    fontSize: 16,
    color: '#333333',
  },
});