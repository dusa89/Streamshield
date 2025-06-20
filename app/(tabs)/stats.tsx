import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart2, Clock, Music, Filter } from "lucide-react-native";
import { useState } from "react";
import { mockListeningStats } from "@/mocks/stats";
import { LinearGradient } from "expo-linear-gradient";

// Time period filters
const TIME_PERIODS = ["Week", "Month", "Year"];

export default function StatsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState("Week");
  const [showTrueTaste, setShowTrueTaste] = useState(false);
  
  const stats = mockListeningStats;
  
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Listening Stats</Text>
          
          <View style={styles.periodSelector}>
            {TIME_PERIODS.map((period) => (
              <Pressable
                key={period}
                style={[
                  styles.periodOption,
                  selectedPeriod === period && styles.periodOptionSelected
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text 
                  style={[
                    styles.periodOptionText,
                    selectedPeriod === period && styles.periodOptionTextSelected
                  ]}
                >
                  {period}
                </Text>
              </Pressable>
            ))}
          </View>
          
          <Pressable 
            style={[
              styles.trueTasteToggle,
              showTrueTaste && styles.trueTasteToggleActive
            ]}
            onPress={() => setShowTrueTaste(!showTrueTaste)}
          >
            <Filter size={16} color={showTrueTaste ? "#FFFFFF" : "#191414"} />
            <Text 
              style={[
                styles.trueTasteText,
                showTrueTaste && styles.trueTasteTextActive
              ]}
            >
              {showTrueTaste ? "True Taste View" : "Show True Taste"}
            </Text>
          </Pressable>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Clock size={18} color="#1DB954" />
              <Text style={styles.statTitle}>Listening Time</Text>
            </View>
            
            <View style={styles.statContent}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalHours}h</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{showTrueTaste ? stats.unshieldedHours : stats.shieldedHours}h</Text>
                <Text style={styles.statLabel}>{showTrueTaste ? "Unshielded" : "Shielded"}</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.percentShielded}%</Text>
                <Text style={styles.statLabel}>Shielded</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Music size={18} color="#1DB954" />
              <Text style={styles.statTitle}>Top Genres</Text>
            </View>
            
            <View style={styles.genreContainer}>
              {(showTrueTaste ? stats.trueTasteGenres : stats.allGenres).map((genre, index) => (
                <View key={index} style={styles.genreItem}>
                  <View style={styles.genreBar}>
                    <LinearGradient
                      colors={["#1DB954", "#147B36"]}
                      style={[styles.genreProgress, { width: `${genre.percentage}%` }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <View style={styles.genreInfo}>
                    <Text style={styles.genreName}>{genre.name}</Text>
                    <Text style={styles.genrePercentage}>{genre.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <BarChart2 size={18} color="#1DB954" />
              <Text style={styles.statTitle}>Top Artists</Text>
            </View>
            
            <View style={styles.artistsContainer}>
              {(showTrueTaste ? stats.trueTasteArtists : stats.allArtists).map((artist, index) => (
                <View key={index} style={styles.artistItem}>
                  <Text style={styles.artistRank}>{index + 1}</Text>
                  <Text style={styles.artistName}>{artist.name}</Text>
                  <Text style={styles.artistPlays}>{artist.plays} plays</Text>
                </View>
              ))}
            </View>
          </View>
          
          {showTrueTaste && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>About True Taste View</Text>
              <Text style={styles.infoText}>
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
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  periodOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  periodOptionSelected: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  periodOptionText: {
    fontSize: 14,
    color: "#666666",
  },
  periodOptionTextSelected: {
    color: "#191414",
    fontWeight: "500",
  },
  trueTasteToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  trueTasteToggleActive: {
    backgroundColor: "#1DB954",
  },
  trueTasteText: {
    fontSize: 14,
    color: "#191414",
    marginLeft: 6,
  },
  trueTasteTextActive: {
    color: "#FFFFFF",
  },
  statsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
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
    color: "#191414",
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
    color: "#191414",
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#EEEEEE",
  },
  genreContainer: {
    marginTop: 8,
  },
  genreItem: {
    marginBottom: 12,
  },
  genreBar: {
    height: 8,
    backgroundColor: "#F5F5F5",
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
    color: "#191414",
  },
  genrePercentage: {
    fontSize: 14,
    color: "#666666",
  },
  artistsContainer: {
    marginTop: 8,
  },
  artistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  artistRank: {
    width: 24,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1DB954",
  },
  artistName: {
    flex: 1,
    fontSize: 14,
    color: "#191414",
  },
  artistPlays: {
    fontSize: 14,
    color: "#666666",
  },
  infoCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191414",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
});