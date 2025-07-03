import { useState, useLayoutEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBlacklistStore } from "@/stores/blacklist";
import { mockSearchResults } from "@/mocks/search";
import { useThemeStore } from "@/stores/theme";
import { useColorScheme } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { themes } from "@/constants/colors";

// Define types for blacklist items and search results
interface BlacklistItem {
  id: string;
  name: string;
  artist?: string;
}

interface SearchResults {
  artists: BlacklistItem[];
  genres: BlacklistItem[];
  tracks: BlacklistItem[];
  [key: string]: BlacklistItem[]; // for index signature
}

const TABS = ["Artists", "Genres", "Tracks"];

export default function BlacklistScreen() {
  const [activeTab, setActiveTab] = useState<string>("Artists");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(mockSearchResults);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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

  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.background },
      headerTitleStyle: { color: theme.text },
      headerTintColor: theme.text,
    });
  }, [navigation, theme]);

  const handleSearch = () => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setTimeout(() => {
      const tabKey = activeTab.toLowerCase();
      const results = (mockSearchResults as SearchResults)[tabKey].filter((item: BlacklistItem) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    }, 500);
  };

  const handleAddItem = (item: BlacklistItem) => {
    switch (activeTab) {
      case "Artists":
        if (blacklistedArtists.some((artist: BlacklistItem) => artist.id === item.id)) {
          Alert.alert("Already Blacklisted", "This artist is already in your blacklist.");
          return;
        }
        addArtist(item);
        break;
      case "Genres":
        if (blacklistedGenres.some((genre: BlacklistItem) => genre.id === item.id)) {
          Alert.alert("Already Blacklisted", "This genre is already in your blacklist.");
          return;
        }
        addGenre(item);
        break;
      case "Tracks":
        if (blacklistedTracks.some((track: BlacklistItem) => track.id === item.id)) {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["bottom"]}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text, marginBottom: 8 }}>Blacklist</Text>
          <Text style={{ fontSize: 16, color: theme.text, lineHeight: 22 }}>
            Add artists, genres, and tracks that you want to shield from affecting your recommendations
          </Text>
        </View>
        <View style={{ flexDirection: "row", backgroundColor: theme.background, margin: 16, marginTop: 8, borderRadius: 8, padding: 4 }}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: "center",
                borderRadius: 6,
                backgroundColor: activeTab === tab ? theme.tint : theme.background,
                shadowColor: activeTab === tab ? "#000" : undefined,
                shadowOffset: activeTab === tab ? { width: 0, height: 1 } : undefined,
                shadowOpacity: activeTab === tab ? 0.1 : undefined,
                shadowRadius: activeTab === tab ? 1 : undefined,
                elevation: activeTab === tab ? 1 : undefined,
              }}
              onPress={() => {
                setActiveTab(tab);
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              <Text 
                style={{
                  fontSize: 14,
                  color: activeTab === tab ? '#fff' : theme.text,
                  fontWeight: activeTab === tab ? "500" : undefined,
                }}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: theme.background, borderRadius: 8, paddingHorizontal: 12, marginRight: 8 }}>
            <TextInput
              style={{ flex: 1, height: 40, fontSize: 16, color: theme.text }}
              placeholder={`Search for ${activeTab.toLowerCase()}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              placeholderTextColor={theme.text + '99'}
            />
            {searchQuery.length > 0 && (
              <Pressable 
                style={{ padding: 4 }}
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <Text>X</Text>
              </Pressable>
            )}
          </View>
          <Pressable 
            style={{ backgroundColor: theme.tint, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}
            onPress={handleSearch}
          >
            <Text style={{ color: theme.background, fontSize: 14, fontWeight: "600" }}>Search</Text>
          </Pressable>
        </View>
        {searchResults.length > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 24, backgroundColor: theme.background, borderRadius: 12, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 12 }}>Search Results</Text>
            {searchResults.map((item: BlacklistItem) => (
              <View key={item.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ fontSize: 16, color: theme.text }}>{item.name}</Text>
                    {item.artist && (
                      <Text style={{ fontSize: 14, color: theme.text, marginTop: 2 }}>by {item.artist}</Text>
                    )}
                  </View>
                </View>
                <Pressable 
                  style={{ backgroundColor: theme.tint, width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" }}
                  onPress={() => handleAddItem(item)}
                >
                  <Text>+</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: theme.text, marginBottom: 16 }}>
            Blacklisted {activeTab}
            <Text style={{ fontWeight: "normal", color: theme.text }}> ({getBlacklistedItems().length})</Text>
          </Text>
          {getBlacklistedItems().length > 0 ? (
            getBlacklistedItems().map((item: BlacklistItem) => (
              <View key={item.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.background, padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ fontSize: 16, color: theme.text }}>{item.name}</Text>
                    {item.artist && (
                      <Text style={{ fontSize: 14, color: theme.text, marginTop: 2 }}>by {item.artist}</Text>
                    )}
                  </View>
                </View>
                <Pressable 
                  style={{ padding: 8 }}
                  onPress={() => handleRemoveItem(item.id)}
                >
                  <Text>-</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <View style={{ alignItems: "center", justifyContent: "center", backgroundColor: theme.background, padding: 24, borderRadius: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "500", color: theme.text, marginBottom: 4 }}>
                No blacklisted {activeTab.toLowerCase()} yet
              </Text>
              <Text style={{ fontSize: 14, color: theme.text, textAlign: "center" }}>
                Search and add {activeTab.toLowerCase()} to your blacklist
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}