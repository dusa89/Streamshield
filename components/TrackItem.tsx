import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity, Dimensions, Linking, Alert } from "react-native";
import { Image } from "expo-image";
import { Track } from "@/types/track";
import Feather from 'react-native-vector-icons/Feather';
import React, { useState } from "react";
import { useThemeStore } from '@/stores/theme';
import { useColorScheme } from 'react-native';
import { themes } from '@/constants/colors';

interface TrackItemProps {
  track: Track;
  isCurrentlyPlaying?: boolean;
  isShielded?: boolean;
  onExclude?: (track: Track) => void;
  onUndo?: (track: Track) => void;
  onExcludeAlbum?: (track: Track) => void;
  onUndoAlbum?: (track: Track) => void;
  onExcludeArtist?: (track: Track) => void;
  onUndoArtist?: (track: Track) => void;
}

const SHEET_MAX_HEIGHT = Dimensions.get('window').height * 0.5;

export function TrackItem({ track, isCurrentlyPlaying = false, isShielded = false, onExclude, onUndo, onExcludeAlbum, onUndoAlbum, onExcludeArtist, onUndoArtist }: TrackItemProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }] }>
      <Image
        source={{ uri: track.albumArt }}
        style={styles.albumArt}
      />
      
      <View style={styles.trackInfo}>
        <View style={styles.trackNameContainer}>
          <Text style={[styles.trackName, { color: theme.text }]} numberOfLines={1}>
            {track.name}
          </Text>
          {isShielded && (
            <View style={[styles.shieldBadge, { backgroundColor: theme.tint }] }>
              <Feather name="shield" size={10} color={theme.background} />
            </View>
          )}
        </View>
        
        <Text style={[styles.artistName, { color: theme.tabIconDefault }]} numberOfLines={1}>
          {track.artist}
        </Text>
        
        {isCurrentlyPlaying && (
          <View style={[styles.playingBadge, { backgroundColor: theme.border }] }>
            <Text style={[styles.playingText, { color: theme.text }]}>Now Playing</Text>
          </View>
        )}
      </View>
      
      {track.timestamp && (
        <Text style={[styles.timestamp, { color: theme.tabIconDefault }]}>
          {new Date(track.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </Text>
      )}
      {/* 3-dot menu */}
      <Pressable style={styles.menuButton} onPress={() => setMenuVisible(true)}>
        <Feather name="more-horizontal" size={20} color={theme.tabIconDefault} />
      </Pressable>
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={[styles.sheetContainer, { backgroundColor: theme.background + 'E6', shadowColor: theme.border }] }>
            {/* Track Actions */}
            <Text style={[styles.sheetGroupLabel, { color: theme.tabIconDefault }]}>Track</Text>
            <View style={styles.actionRowCentered}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.tint, marginRight: 10 }]} onPress={() => { setMenuVisible(false); onExclude && onExclude(track); }}>
                <Feather name="minus-circle" size={18} color={theme.background} style={styles.sheetIcon} />
                <Text style={[styles.actionButtonText, { color: theme.background }]}>Exclude</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.red }]} onPress={() => { setMenuVisible(false); onUndo && onUndo(track); }}>
                <Feather name="rotate-ccw" size={18} color={theme.background} style={styles.sheetIcon} />
                <Text style={[styles.actionButtonText, { color: theme.background }]}>Undo</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.sheetAction} onPress={async () => {
              setMenuVisible(false);
              if (track.id) {
                const spotifyUri = `spotify:track:${track.id}`;
                const webUrl = `https://open.spotify.com/track/${track.id}`;
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
              <Feather name="play-circle" size={20} color={theme.tint} style={styles.sheetIcon} />
              <Text style={[styles.sheetActionText, { color: theme.text }]}>Play on Spotify</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetAction} onPress={async () => {
              setMenuVisible(false);
              if (track.artistId) {
                const spotifyUri = `spotify:artist:${track.artistId}`;
                const webUrl = `https://open.spotify.com/artist/${track.artistId}`;
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
              } else if (track.artist) {
                const webUrl = `https://open.spotify.com/search/${encodeURIComponent(track.artist)}`;
                Linking.openURL(webUrl);
              }
            }}>
              <Feather name="user" size={20} color={theme.tint} style={styles.sheetIcon} />
              <Text style={[styles.sheetActionText, { color: theme.text }]}>View Artist</Text>
            </TouchableOpacity>
            {/* Divider */}
            <View style={[styles.sheetDivider, { backgroundColor: theme.border }]} />
            {/* Album Actions */}
            <Text style={[styles.sheetGroupLabel, { color: theme.tabIconDefault }]}>Album</Text>
            <View style={styles.actionRowCentered}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.tint, marginRight: 10 }]} onPress={() => { setMenuVisible(false); onExcludeAlbum && onExcludeAlbum(track); }}>
                <Feather name="minus-square" size={18} color={theme.background} style={styles.sheetIcon} />
                <Text style={[styles.actionButtonText, { color: theme.background }]}>Exclude</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.red }]} onPress={() => { setMenuVisible(false); onUndoAlbum && onUndoAlbum(track); }}>
                <Feather name="rotate-ccw" size={18} color={theme.background} style={styles.sheetIcon} />
                <Text style={[styles.actionButtonText, { color: theme.background }]}>Undo</Text>
              </TouchableOpacity>
            </View>
            {/* Divider */}
            <View style={[styles.sheetDivider, { backgroundColor: theme.border }]} />
            {/* Artist Actions */}
            <Text style={[styles.sheetGroupLabel, { color: theme.tabIconDefault }]}>Artist</Text>
            <View style={styles.actionRowCentered}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.tint, marginRight: 10 }]} onPress={() => { setMenuVisible(false); onExcludeArtist && onExcludeArtist(track); }}>
                <Feather name="user-minus" size={18} color={theme.background} style={styles.sheetIcon} />
                <Text style={[styles.actionButtonText, { color: theme.background }]}>Exclude</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.red }]} onPress={() => { setMenuVisible(false); onUndoArtist && onUndoArtist(track); }}>
                <Feather name="rotate-ccw" size={18} color={theme.background} style={styles.sheetIcon} />
                <Text style={[styles.actionButtonText, { color: theme.background }]}>Undo</Text>
              </TouchableOpacity>
            </View>
            {/* Cancel Button */}
            <TouchableOpacity style={[styles.sheetCancel, { backgroundColor: theme.background }]} onPress={() => setMenuVisible(false)}>
              <Text style={[styles.sheetCancelText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginLeft: 20,
    marginRight: 20,
  },
  albumArt: {
    width: 60,
    height: 60,
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
    marginRight: 6,
  },
  shieldBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  artistName: {
    fontSize: 14,
    marginTop: 2,
  },
  playingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  playingText: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 8,
  },
  menuButton: {
    marginLeft: 8,
    padding: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: SHEET_MAX_HEIGHT,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 8,
    paddingTop: 4,
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetGroupLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 0,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionRowCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginRight: 6,
    marginTop: 1,
    marginBottom: 1,
    minWidth: 60,
    justifyContent: 'center',
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    paddingHorizontal: 4,
    flex: 1,
  },
  sheetIcon: {
    marginRight: 6,
  },
  sheetActionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sheetDestructive: {
    // color handled inline
  },
  sheetDivider: {
    height: 1,
    marginVertical: 6,
  },
  sheetCancel: {
    marginTop: 10,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetCancelText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});