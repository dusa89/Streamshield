import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { mockShieldHistory, HistoryItem } from "@/mocks/history";
import { TrackItem } from "@/components/TrackItem";
import { useThemeStore } from "@/stores/theme";
import { useColorScheme } from "react-native";
import { themes } from "@/constants/colors";
import * as SpotifyService from "@/services/spotify";
import { useAuthStore } from "@/stores/auth";
import Toast from 'react-native-root-toast';
import { useShieldStore } from "@/stores/shield";
import { Image } from "expo-image";
import Feather from 'react-native-vector-icons/Feather';
import { Linking } from "react-native";

// Time period filters
const TIME_PERIODS = ["Today", "Week", "Month"];

// Filter options
const FILTER_OPTIONS = ["All", "Shielded", "Unshielded"];

// Define types for history items
interface GroupedHistory {
  [date: string]: HistoryItem[];
}

export default function HistoryScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState("Today");
  const [tracks, setTracks] = useState([]);
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];
  const { tokens } = useAuthStore();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const isTimestampShielded = useShieldStore((s) => s.isTimestampShielded);
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  
  // Filter history based on selected filter
  const filteredHistory = history.filter((item: HistoryItem) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Shielded") return item.shielded;
    if (selectedFilter === "Unshielded") return !item.shielded;
    return true;
  });
  
  // Group history by date
  const groupedHistory = filteredHistory.reduce((groups: { [key: string]: HistoryItem[] }, item: HistoryItem) => {
    const date = new Date(item.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});
  
  useEffect(() => {
    const fetchHistory = async () => {
      if (!tokens?.accessToken) return;
      try {
        const tracks = await SpotifyService.getRecentlyPlayed(tokens.accessToken);
        // Map Track[] to HistoryItem[] and mark shielded
        const mapped: HistoryItem[] = tracks.map((track) => ({
          id: track.id,
          timestamp: track.timestamp || Date.now(),
          title: track.name,
          description: `Played by ${track.artist}`,
          shielded: track.timestamp ? isTimestampShielded(track.timestamp) : false,
          tags: [],
          tracks: 1,
          albumArt: track.albumArt,
          artistId: track.artistId,
        }));
        setHistory(mapped);
      } catch (e) {
        Toast.show("Failed to load listening history.");
      }
    };
    fetchHistory();
  }, [tokens?.accessToken, isTimestampShielded]);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingTop: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text, marginLeft: 20, marginBottom: 8 }}>History</Text>
        <View style={styles.historyContainer}>
          {Object.keys(groupedHistory).length > 0 ? (
            Object.entries(groupedHistory).map(([date, items]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={[styles.dateHeader, { color: theme.text }]}>{date}</Text>
                
                {items.map((item: HistoryItem, index: number) => (
                  <View key={index} style={[styles.historyItem, { backgroundColor: theme.background, shadowColor: theme.border, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, marginBottom: 0 }] }>
                    {item.albumArt && (
                      <Image source={{ uri: item.albumArt }} style={{ width: 40, height: 40, borderRadius: 4, marginRight: 12 }} />
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.sessionTitle, { color: theme.text, fontSize: 15, fontWeight: '500' }]} numberOfLines={1}>{item.title}</Text>
                        <Pressable style={{ padding: 4, marginLeft: 4 }} onPress={() => setMenuVisible(index)}>
                          <Feather name="more-horizontal" size={18} color={theme.tabIconDefault} />
                        </Pressable>
                      </View>
                      <Text style={[styles.sessionDescription, { color: theme.text, fontSize: 13 }]} numberOfLines={1}>{item.description}</Text>
                      {item.shielded && (
                        <View style={[styles.shieldBadge, { backgroundColor: theme.tint, alignSelf: 'flex-start', marginTop: 2 }] }>
                          <Feather name="shield" size={10} color={theme.background} />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.timeText, { color: theme.text, marginLeft: 8, fontSize: 12 }]}>{new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                    {/* 3-dot menu for track */}
                    <Modal
                      visible={menuVisible === index}
                      transparent
                      animationType="fade"
                      onRequestClose={() => setMenuVisible(null)}
                    >
                      <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(null)}>
                        <View style={[styles.sheetContainer, { backgroundColor: theme.background, shadowColor: theme.border }] }>
                          <TouchableOpacity style={styles.sheetAction} onPress={async () => {
                            setMenuVisible(null);
                            if (item.id) {
                              const spotifyUri = `spotify:track:${item.id}`;
                              const webUrl = `https://open.spotify.com/track/${item.id}`;
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
                            <Text style={[styles.sheetActionText, { color: theme.text }]}>Play on Spotify</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.sheetCancel, { backgroundColor: theme.background }]} onPress={() => setMenuVisible(null)}>
                            <Text style={[styles.sheetCancelText, { color: theme.text }]}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    </Modal>
                  </View>
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon} />
              <Text style={[styles.emptyText, { color: theme.text }]}>No history found</Text>
              <Text style={[styles.emptySubtext, { color: theme.text }]}>
                Your listening sessions will appear here
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
  historyContainer: {
    padding: 16,
    paddingTop: 0,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  historyItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timeIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  timeText: {
    fontSize: 14,
    marginLeft: 4,
  },
  contentContainer: {
    marginLeft: 18,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  shieldBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  shieldIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
  },
  shieldText: {
    fontSize: 12,
    marginLeft: 4,
  },
  sessionDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tagIcon: {
    width: 14,
    height: 14,
    marginRight: 8,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: 8,
  },
  tagBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
  },
  tracksText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
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
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    marginBottom: 8,
  },
  sheetActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  sheetCancel: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
  },
  sheetCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
});