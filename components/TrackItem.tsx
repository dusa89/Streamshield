import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Modal,
  Animated,
  useColorScheme,
} from "react-native";
import { Image } from "expo-image";
import { Track } from "@/types/track";
import { useThemeStore } from "@/stores/theme";
import { themes } from "@/constants/colors";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface TrackItemProps {
  track: Track;
  isCurrentlyPlaying?: boolean;
  isShielded?: boolean;
  isTrackExcluded?: boolean;
  isAlbumExcluded?: boolean;
  isArtistExcluded?: boolean;
  onExclude?: (track: Track) => void;
  onUndo?: (track: Track) => void;
  onExcludeAlbum?: (track: Track) => void;
  onUndoAlbum?: (track: Track) => void;
  onExcludeArtist?: (track: Track) => void;
  onUndoArtist?: (track: Track) => void;
  selected?: boolean;
  onSelect?: (track: Track) => void;
  onLongPress?: () => void;
  checkboxAnimation?: Animated.Value;
}

export function TrackItem({
  track,
  isCurrentlyPlaying = false,
  isShielded = false,
  isTrackExcluded = false,
  isAlbumExcluded = false,
  isArtistExcluded = false,
  onExclude,
  onUndo,
  onExcludeAlbum,
  onUndoAlbum,
  onExcludeArtist,
  onUndoArtist,
  selected,
  onSelect,
  onLongPress,
  checkboxAnimation,
}: TrackItemProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme =
    themePref === "auto" ? (colorScheme ?? "light") : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const handlePress = () => {
    if (onSelect) {
      onSelect(track);
    }
  };

  const scale = checkboxAnimation
    ? checkboxAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: "clamp",
      })
    : 0;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={[
        styles.trackContainer,
        { backgroundColor: isCurrentlyPlaying ? theme.tint + "33" : theme.card },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        {onSelect && checkboxAnimation && (
          <Animated.View style={{ transform: [{ scale }], marginRight: 10 }}>
            <TouchableOpacity
              onPress={handlePress}
              style={[
                styles.checkbox,
                {
                  backgroundColor: selected ? theme.tint : theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              {selected && (
                <MaterialCommunityIcons
                  name="check"
                  size={18}
                  color={theme.background}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
        <Image
          source={{ uri: track.albumArt }}
          style={styles.trackAlbumArt}
          transition={300}
        />
        <View style={styles.trackDetails}>
          <Text
            style={[styles.trackTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {track.name}
          </Text>
          <Text
            style={[styles.trackArtist, { color: theme.tabIconDefault }]}
            numberOfLines={1}
          >
            {track.artist}
          </Text>
        </View>
        {isShielded && (
          <MaterialCommunityIcons
            name="shield-check"
            size={20}
            color={theme.tint}
            style={styles.shieldIcon}
          />
        )}
      </View>
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => setMenuVisible(true)}
      >
        <MaterialCommunityIcons
          name="dots-horizontal"
          size={24}
          color={theme.tabIconDefault}
        />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {track.name}
            </Text>
            {onExclude && onUndo && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setMenuVisible(false);
                  if (isTrackExcluded) {
                    onUndo();
                  } else {
                    onExclude();
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={isTrackExcluded ? "shield-off-outline" : "shield-plus-outline"}
                  size={22}
                  color={theme.text}
                />
                <Text style={[styles.modalOptionText, { color: theme.text }]}>
                  {isTrackExcluded ? "Undo Track Exclusion" : "Exclude Track"}
                </Text>
              </TouchableOpacity>
            )}
            {onExcludeAlbum && onUndoAlbum && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setMenuVisible(false);
                  if (isAlbumExcluded) {
                    onUndoAlbum();
                  } else {
                    onExcludeAlbum();
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={isAlbumExcluded ? "album" : "album"}
                  size={22}
                  color={theme.text}
                />
                <Text style={[styles.modalOptionText, { color: theme.text }]}>
                  {isAlbumExcluded ? "Undo Album Exclusion" : "Exclude Album"}
                </Text>
              </TouchableOpacity>
            )}
            {onExcludeArtist && onUndoArtist && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setMenuVisible(false);
                  if (isArtistExcluded) {
                    onUndoArtist();
                  } else {
                    onExcludeArtist();
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={isArtistExcluded ? "account-off-outline" : "account-music-outline"}
                  size={22}
                  color={theme.text}
                />
                <Text style={[styles.modalOptionText, { color: theme.text }]}>
                  {isArtistExcluded ? "Undo Artist Exclusion" : "Exclude Artist"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setMenuVisible(false)}
            >
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={22}
                color={theme.tabIconDefault}
              />
              <Text
                style={[
                  styles.modalOptionText,
                  { color: theme.tabIconDefault, fontWeight: "500" },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trackContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  trackAlbumArt: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  trackDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  trackArtist: {
    fontSize: 14,
    marginTop: 2,
  },
  shieldIcon: {
    marginRight: 8,
  },
  moreButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 16,
  },
  cancelOption: {
    marginTop: 8,
    borderTopWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
