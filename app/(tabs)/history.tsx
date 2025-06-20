import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock, Shield, Tag, Filter } from "lucide-react-native";
import { useState } from "react";
import { mockShieldHistory } from "@/mocks/history";

// Filter options
const FILTER_OPTIONS = ["All", "Shielded", "Unshielded"];

// Define types for history items
interface HistoryItem {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  shielded: boolean;
  tags?: string[];
  tracks?: number;
}

// Define type for grouped history
interface GroupedHistory {
  [date: string]: HistoryItem[];
}

export default function HistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  
  const history = mockShieldHistory;
  
  // Filter history based on selected filter
  const filteredHistory = history.filter(item => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Shielded") return item.shielded;
    if (selectedFilter === "Unshielded") return !item.shielded;
    return true;
  });
  
  // Group history by date
  const groupedHistory: GroupedHistory = filteredHistory.reduce((groups, item) => {
    const date = new Date(item.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as GroupedHistory);
  
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Listening History</Text>
          
          <View style={styles.filterContainer}>
            <Filter size={16} color="#666666" style={styles.filterIcon} />
            <View style={styles.filterOptions}>
              {FILTER_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.filterOption,
                    selectedFilter === option && styles.filterOptionSelected
                  ]}
                  onPress={() => setSelectedFilter(option)}
                >
                  <Text 
                    style={[
                      styles.filterOptionText,
                      selectedFilter === option && styles.filterOptionTextSelected
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        
        <View style={styles.historyContainer}>
          {Object.keys(groupedHistory).length > 0 ? (
            Object.entries(groupedHistory).map(([date, items]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{date}</Text>
                
                {items.map((item: HistoryItem, index: number) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.timeContainer}>
                      <Clock size={14} color="#666666" />
                      <Text style={styles.timeText}>
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </Text>
                    </View>
                    
                    <View style={styles.contentContainer}>
                      <View style={styles.sessionHeader}>
                        <Text style={styles.sessionTitle}>{item.title}</Text>
                        {item.shielded && (
                          <View style={styles.shieldBadge}>
                            <Shield size={12} color="#FFFFFF" />
                            <Text style={styles.shieldText}>Shielded</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={styles.sessionDescription}>{item.description}</Text>
                      
                      {item.tags && item.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                          <Tag size={14} color="#666666" />
                          <View style={styles.tagsList}>
                            {item.tags.map((tag: string, tagIndex: number) => (
                              <View key={tagIndex} style={styles.tagBadge}>
                                <Text style={styles.tagText}>{tag}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                      
                      {item.tracks && (
                        <Text style={styles.tracksText}>
                          {item.tracks} {item.tracks === 1 ? "track" : "tracks"} played
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Clock size={40} color="#CCCCCC" />
              <Text style={styles.emptyText}>No history found</Text>
              <Text style={styles.emptySubtext}>
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
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#191414",
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  filterIcon: {
    marginRight: 8,
  },
  filterOptions: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 4,
    flex: 1,
  },
  filterOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  filterOptionSelected: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  filterOptionText: {
    fontSize: 14,
    color: "#666666",
  },
  filterOptionTextSelected: {
    color: "#191414",
    fontWeight: "500",
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
    color: "#191414",
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
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
  timeText: {
    fontSize: 14,
    color: "#666666",
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
    color: "#191414",
    flex: 1,
  },
  shieldBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DB954",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  shieldText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginLeft: 4,
  },
  sessionDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: 8,
  },
  tagBadge: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#666666",
  },
  tracksText: {
    fontSize: 14,
    color: "#999999",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#191414",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
});