import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBlacklistStore } from "@/stores/blacklist";
import { Music, Search, X, Plus, Trash2 } from "lucide-react-native";
import { mockSearchResults } from "@/mocks/search";

// Tab options
const TABS = ["Artists", "Genres", "Tracks"];

// Define types for blacklist items
interface BlacklistItem {
  id: string;
  name: string;
  artist?: string;
}

// Define type for search results
interface SearchResult {
  id: string;
  name: string;
  artist?: string;
}

export default function BlacklistScreen() {
  const [activeTab, setActiveTab] = useState("Artists");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { 
    blacklistedArtists, 
    blacklistedGenres, 
    blacklistedTracks,
    addArtist,
    addGenre,
    addTrack,
    removeArtist,
    removeGenre,
    removeTrack
  } = useBlacklistStore();
  
  const handleSearch = () => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // In a real app, this would be an API call to Spotify
    setTimeout(() => {
      const tabKey = activeTab.toLowerCase() as keyof typeof mockSearchResults;
      const results = mockSearchResults[tabKey].filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };
  
  const handleAddItem = (item: SearchResult) => {
    switch (activeTab) {
      case "Artists":
        if (blacklistedArtists.some(artist => artist.id === item.id)) {
          Alert.alert("Already Blacklisted", "This artist is already in your blacklist.");
          return;
        }
        addArtist(item);
        break;
      case "Genres":
        if (blacklistedGenres.some(genre => genre.id === item.id)) {
          Alert.alert("Already Blacklisted", "This genre is already in your blacklist.");
          return;
        }
        addGenre(item);
        break;
      case "Tracks":
        if (blacklistedTracks.some(track => track.id === item.id)) {
          Alert.alert("Already Blacklisted", "This track is already in your blacklist.");
          return;
        }
        addTrack(item);
        break;
    }
    
    setSearchQuery("");
    setSearchResults([]);
  };
  
  const handleRemoveItem = (id: string) => {
    switch (activeTab) {
      case "Artists":
        removeArtist(id);
        break;
      case "Genres":
        removeGenre(id);
        break;
      case "Tracks":
        removeTrack(id);
        break;
    }
  };
  
  const getBlacklistedItems = (): BlacklistItem[] => {
    switch (activeTab) {
      case "Artists":
        return blacklistedArtists;
      case "Genres":
        return blacklistedGenres;
      case "Tracks":
        return blacklistedTracks;
      default:
        return [];
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Blacklist</Text>
          <Text style={styles.subtitle}>
            Add artists, genres, and tracks that you want to shield from affecting your recommendations
          </Text>
        </View>
        
        <View style={styles.tabContainer}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton
              ]}
              onPress={() => {
                setActiveTab(tab);
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              <Text 
                style={[
                  styles.tabButtonText,
                  activeTab === tab && styles.activeTabButtonText
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#666666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search for ${activeTab.toLowerCase()}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable 
                style={styles.clearButton}
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <X size={16} color="#666666" />
              </Pressable>
            )}
          </View>
          <Pressable 
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
        </View>
        
        {searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Search Results</Text>
            
            {searchResults.map((item) => (
              <View key={item.id} style={styles.resultItem}>
                <View style={styles.resultContent}>
                  <Music size={20} color="#1DB954" />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    {item.artist && (
                      <Text style={styles.resultSubtext}>by {item.artist}</Text>
                    )}
                  </View>
                </View>
                <Pressable 
                  style={styles.addButton}
                  onPress={() => handleAddItem(item)}
                >
                  <Plus size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.blacklistContainer}>
          <Text style={styles.blacklistTitle}>
            Blacklisted {activeTab}
            <Text style={styles.blacklistCount}> ({getBlacklistedItems().length})</Text>
          </Text>
          
          {getBlacklistedItems().length > 0 ? (
            getBlacklistedItems().map((item: BlacklistItem) => (
              <View key={item.id} style={styles.blacklistItem}>
                <View style={styles.blacklistContent}>
                  <Music size={20} color="#FF3B30" />
                  <View style={styles.blacklistInfo}>
                    <Text style={styles.blacklistName}>{item.name}</Text>
                    {item.artist && (
                      <Text style={styles.blacklistSubtext}>by {item.artist}</Text>
                    )}
                  </View>
                </View>
                <Pressable 
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item.id)}
                >
                  <Trash2 size={20} color="#FF3B30" />
                </Pressable>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No blacklisted {activeTab.toLowerCase()} yet
              </Text>
              <Text style={styles.emptySubtext}>
                Search and add {activeTab.toLowerCase()} to your blacklist
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    margin: 16,
    marginTop: 8,
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 14,
    color: "#666666",
  },
  activeTabButtonText: {
    color: "#191414",
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#191414",
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  resultsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191414",
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  resultContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  resultInfo: {
    marginLeft: 12,
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    color: "#191414",
  },
  resultSubtext: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  addButton: {
    backgroundColor: "#1DB954",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  blacklistContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  blacklistTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#191414",
    marginBottom: 16,
  },
  blacklistCount: {
    fontWeight: "normal",
    color: "#666666",
  },
  blacklistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  blacklistContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  blacklistInfo: {
    marginLeft: 12,
    flex: 1,
  },
  blacklistName: {
    fontSize: 16,
    color: "#191414",
  },
  blacklistSubtext: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    padding: 24,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#191414",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
});