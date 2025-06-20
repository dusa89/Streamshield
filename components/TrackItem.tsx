import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Shield } from "lucide-react-native";
import { Track } from "@/types/track";

interface TrackItemProps {
  track: Track;
  isCurrentlyPlaying?: boolean;
  isShielded?: boolean;
}

export function TrackItem({ track, isCurrentlyPlaying = false, isShielded = false }: TrackItemProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: track.albumArt }}
        style={styles.albumArt}
      />
      
      <View style={styles.trackInfo}>
        <View style={styles.trackNameContainer}>
          <Text style={styles.trackName} numberOfLines={1}>
            {track.name}
          </Text>
          {isShielded && (
            <View style={styles.shieldBadge}>
              <Shield size={10} color="#FFFFFF" />
            </View>
          )}
        </View>
        
        <Text style={styles.artistName} numberOfLines={1}>
          {track.artist}
        </Text>
        
        {isCurrentlyPlaying && (
          <View style={styles.playingBadge}>
            <Text style={styles.playingText}>Now Playing</Text>
          </View>
        )}
      </View>
      
      {track.timestamp && (
        <Text style={styles.timestamp}>
          {new Date(track.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  trackName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#191414",
    marginRight: 6,
  },
  shieldBadge: {
    backgroundColor: "#1DB954",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  artistName: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  playingBadge: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  playingText: {
    fontSize: 12,
    color: "#191414",
  },
  timestamp: {
    fontSize: 12,
    color: "#999999",
    marginLeft: 8,
  },
});