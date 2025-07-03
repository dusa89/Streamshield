import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Modal, Pressable, Image, ScrollView } from "react-native";
import { useProtectionMechanism } from "@/services/protectionMechanism";
import { useThemeStore } from '@/stores/theme';
import { useColorScheme } from 'react-native';
import { themes } from '@/constants/colors';

interface ExclusionInstructionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ExclusionInstructionsModal({ visible, onClose }: ExclusionInstructionsModalProps) {
  const protectionMechanism = useProtectionMechanism();
  const [shouldShow, setShouldShow] = useState(false);
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
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
      <View style={[styles.centeredView, { backgroundColor: theme.text + '80' }]}>
        <View style={[styles.modalView, { backgroundColor: theme.background, shadowColor: theme.border }]}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>One-Time Setup Required</Text>
            </View>
            
            <Text style={[styles.description, { color: theme.text }]}>
              For StreamShield to effectively protect your music taste profile, you need to mark the 
              "StreamShield" playlist as excluded from your taste profile in Spotify.
            </Text>
            
            <View style={[styles.infoBox, { backgroundColor: theme.border }] }>
              <Text style={[styles.infoTitle, { color: theme.text }]}>How StreamShield Works</Text>
              <Text style={[styles.infoText, { color: theme.text }]}>
                When you activate the shield, StreamShield adds tracks you listen to during shielded sessions 
                to a special playlist that you've marked as "excluded from taste profile" in Spotify. 
                This helps dilute the impact of these plays on your recommendations.
              </Text>
            </View>
            
            <View style={styles.stepsContainer}>
              <Text style={[styles.stepsTitle, { color: theme.text }]}>Follow these steps:</Text>
              
              <View style={styles.step}>
                <Text style={[styles.stepNumber, { backgroundColor: theme.tint, color: theme.background }]}>1</Text>
                <Text style={[styles.stepText, { color: theme.text }]}>Open the Spotify app</Text>
              </View>
              
              <View style={styles.step}>
                <Text style={[styles.stepNumber, { backgroundColor: theme.tint, color: theme.background }]}>2</Text>
                <Text style={[styles.stepText, { color: theme.text }]}>Go to Your Library → Playlists</Text>
              </View>
              
              <View style={styles.step}>
                <Text style={[styles.stepNumber, { backgroundColor: theme.tint, color: theme.background }]}>3</Text>
                <Text style={[styles.stepText, { color: theme.text }]}>Find "StreamShield (Excluded from Recommendations)"</Text>
              </View>
              
              <View style={styles.step}>
                <Text style={[styles.stepNumber, { backgroundColor: theme.tint, color: theme.background }]}>4</Text>
                <Text style={[styles.stepText, { color: theme.text }]}>Tap the "..." menu button</Text>
              </View>
              
              <View style={styles.step}>
                <Text style={[styles.stepNumber, { backgroundColor: theme.tint, color: theme.background }]}>5</Text>
                <Text style={[styles.stepText, { color: theme.text }]}>Select "Exclude from your taste profile"</Text>
              </View>
            </View>
            
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=300&auto=format" }}
                style={styles.image}
                resizeMode="contain"
              />
              <Text style={[styles.imageCaption, { color: theme.tabIconDefault }]}>Example of Spotify menu option</Text>
            </View>
            
            <Text style={[styles.note, { color: theme.tabIconDefault }]}>
              This is a one-time setup. You only need to do this once for StreamShield to work properly.
            </Text>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, { backgroundColor: theme.tint }]}
              onPress={handleUnderstand}
            >
              <Text style={[styles.buttonText, { color: theme.background }]}>I've Done This</Text>
            </Pressable>
            
            <Pressable
              style={[styles.laterButton, { backgroundColor: theme.background, borderColor: theme.tint }]}
              onPress={onClose}
            >
              <Text style={[styles.laterButtonText, { color: theme.tint }]}>Remind Me Later</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  stepsContainer: {
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "bold",
    marginRight: 12,
  },
  stepText: {
    fontSize: 15,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageCaption: {
    fontSize: 14,
    fontStyle: "italic",
  },
  note: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  laterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});