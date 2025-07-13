import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProtectionMechanism } from "@/services/protectionMechanism";
import { useThemeStore } from "@/stores/theme";
import { useColorScheme } from "react-native";
import { themes } from "@/constants/colors";

interface ExclusionInstructionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ExclusionInstructionsModal({
  visible,
  onClose,
}: ExclusionInstructionsModalProps) {
  const protectionMechanism = useProtectionMechanism();
  const [shouldShow, setShouldShow] = useState(false);
  const [activeTab, setActiveTab] = useState<"iOS" | "Android" | "Desktop">(
    "iOS",
  );
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme =
    themePref === "auto" ? (colorScheme ?? "light") : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  useEffect(() => {
    if (visible) {
      (async () => {
        const alreadyShown = await protectionMechanism.hasShownInstructions();
        setShouldShow(!alreadyShown);
      })();
    }
  }, [visible]);

  const handleUnderstand = async () => {
    await protectionMechanism.markInstructionsAsShown();
    setShouldShow(false);
    onClose();
  };

  if (!shouldShow) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.centeredView, { backgroundColor: theme.text + "80" }]}
      >
        <View
          style={[
            styles.modalView,
            { backgroundColor: theme.background, shadowColor: theme.border },
          ]}
        >
          <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>
                One-Time Setup Required
              </Text>
            </View>

            <Text style={[styles.description, { color: theme.text }]}>
              For StreamShield to effectively protect your music taste profile,
              you need to mark its dedicated playlist as "excluded" in your
              Spotify settings.
            </Text>

            <View style={[styles.infoBox, { backgroundColor: theme.border }]}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>
                How StreamShield Works
              </Text>
              <Text style={[styles.infoText, { color: theme.text }]}>
                When you use StreamShield, it moves the songs you listen to into
                a special playlist. By telling Spotify to "exclude" this
                playlist from your taste profile, you prevent those songs from
                affecting your future music recommendations, like Discover
                Weekly.
              </Text>
            </View>

            <View style={styles.stepsContainer}>
              <Text style={[styles.stepsTitle, { color: theme.text }]}>
                How to set it up:
              </Text>

              <View style={styles.tabContainer}>
                {(["iOS", "Android", "Desktop"] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tab,
                      activeTab === tab && {
                        backgroundColor: theme.tint,
                      },
                    ]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        { color: theme.text },
                        activeTab === tab && {
                          color: theme.background,
                          fontWeight: "bold",
                        },
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View
                style={[
                  styles.instructionsContainer,
                  { backgroundColor: theme.card },
                ]}
              >
                {activeTab === "iOS" && (
                  <View>
                    <Text style={[styles.stepText, { color: theme.text }]}>1. Open the Spotify app on your iPhone or iPad.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>2. Tap <Text style={{ fontWeight: "bold" }}>Your Library</Text> at the bottom of the screen.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>3. Tap <Text style={{ fontWeight: "bold" }}>Playlists</Text> at the top, then scroll to find the playlist called <Text style={{ fontWeight: "bold" }}>'StreamShield Exclusion List'</Text>.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>4. Tap on the playlist to open it.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>5. Look for the <Text style={{ fontWeight: "bold" }}>three dots</Text> (•••) button just below the playlist name and tap it. This opens a menu with more options.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>6. In the menu, scroll down and tap <Text style={{ fontWeight: "bold" }}>'Exclude from your taste profile'</Text>. This tells Spotify to ignore songs in this playlist when making recommendations for you (like Discover Weekly).</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>7. After you do this, you might see a small icon or message showing the playlist is excluded. If you ever create a new StreamShield playlist, repeat these steps for the new one.</Text>
                  </View>
                )}
                {activeTab === "Android" && (
                  <View>
                    <Text style={[styles.stepText, { color: theme.text }]}>1. Open the Spotify app on your Android phone or tablet.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>2. Tap <Text style={{ fontWeight: "bold" }}>Your Library</Text> at the bottom.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>3. Tap <Text style={{ fontWeight: "bold" }}>Playlists</Text> at the top, then scroll to find <Text style={{ fontWeight: "bold" }}>'StreamShield Exclusion List'</Text>.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>4. Tap on the playlist to open it.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>5. Tap the <Text style={{ fontWeight: "bold" }}>three dots</Text> (⋮) in the top right corner of the screen. This opens more options.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>6. Tap <Text style={{ fontWeight: "bold" }}>'Exclude from your taste profile'</Text> in the menu. This tells Spotify to ignore songs in this playlist when making recommendations for you.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>7. You may see a small icon or message showing the playlist is excluded. If you get a new StreamShield playlist, repeat these steps for the new one.</Text>
                  </View>
                )}
                {activeTab === "Desktop" && (
                  <View>
                    <Text style={[styles.stepText, { color: theme.text }]}>1. Open the Spotify app on your computer (Windows or Mac).</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>2. In the left sidebar, under <Text style={{ fontWeight: "bold" }}>Your Library</Text>, find and click on <Text style={{ fontWeight: "bold" }}>'StreamShield Exclusion List'</Text>.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>3. Right-click the playlist name in the sidebar, or click the <Text style={{ fontWeight: "bold" }}>three dots</Text> (•••) near the top of the playlist page (next to the Play button).</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>4. In the menu that appears, click <Text style={{ fontWeight: "bold" }}>'Exclude from your taste profile'</Text>. This tells Spotify to ignore songs in this playlist when making recommendations for you.</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>5. You may see a small icon or message showing the playlist is excluded. If you get a new StreamShield playlist, repeat these steps for the new one.</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={[styles.note, { color: theme.tabIconDefault }]}>
              This is a one-time setup for each new "StreamShield" playlist. If
              a playlist gets full, the app will create a new one, and you'll
              need to repeat this process.
            </Text>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, { backgroundColor: theme.tint }]}
              onPress={handleUnderstand}
            >
              <Text style={[styles.buttonText, { color: theme.background }]}>
                I've Done This
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.laterButton,
                { backgroundColor: theme.background, borderColor: theme.tint },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.laterButtonText, { color: theme.tint }]}>
                Remind Me Later
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 20,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollView: {
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 14,
  },
  instructionsContainer: {
    padding: 16,
    borderRadius: 12,
  },
  stepText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  note: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 16,
    flexDirection: "column",
    gap: 8,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  laterButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
