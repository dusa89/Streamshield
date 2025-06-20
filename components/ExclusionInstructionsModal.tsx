import React from "react";
import { View, Text, StyleSheet, Modal, Pressable, Image, ScrollView } from "react-native";
import { Shield, Check } from "lucide-react-native";
import { useProtectionMechanism } from "@/services/protectionMechanism";

interface ExclusionInstructionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ExclusionInstructionsModal({ visible, onClose }: ExclusionInstructionsModalProps) {
  const protectionMechanism = useProtectionMechanism();
  
  const handleUnderstand = () => {
    protectionMechanism.markInstructionsAsShown();
    onClose();
  };
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
              <Shield size={32} color="#1DB954" />
              <Text style={styles.title}>One-Time Setup Required</Text>
            </View>
            
            <Text style={styles.description}>
              For StreamShield to effectively protect your music taste profile, you need to mark the 
              "StreamShield" playlist as excluded from your taste profile in Spotify.
            </Text>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>How StreamShield Works</Text>
              <Text style={styles.infoText}>
                When you activate the shield, StreamShield adds tracks you listen to during shielded sessions 
                to a special playlist that you've marked as "excluded from taste profile" in Spotify. 
                This helps dilute the impact of these plays on your recommendations.
              </Text>
            </View>
            
            <View style={styles.stepsContainer}>
              <Text style={styles.stepsTitle}>Follow these steps:</Text>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>Open the Spotify app</Text>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>Go to Your Library → Playlists</Text>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>Find "StreamShield (Excluded from Recommendations)"</Text>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>4</Text>
                <Text style={styles.stepText}>Tap the "..." menu button</Text>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>5</Text>
                <Text style={styles.stepText}>Select "Exclude from your taste profile"</Text>
              </View>
            </View>
            
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=300&auto=format" }}
                style={styles.image}
                resizeMode="contain"
              />
              <Text style={styles.imageCaption}>Example of Spotify menu option</Text>
            </View>
            
            <Text style={styles.note}>
              This is a one-time setup. You only need to do this once for StreamShield to work properly.
            </Text>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.button}
              onPress={handleUnderstand}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>I've Done This</Text>
            </Pressable>
            
            <Pressable
              style={styles.laterButton}
              onPress={onClose}
            >
              <Text style={styles.laterButtonText}>Remind Me Later</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
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
    color: "#191414",
    marginLeft: 12,
  },
  description: {
    fontSize: 16,
    color: "#333333",
    marginBottom: 20,
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191414",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191414",
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
    backgroundColor: "#1DB954",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "bold",
    marginRight: 12,
  },
  stepText: {
    fontSize: 15,
    color: "#333333",
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
    color: "#666666",
    fontStyle: "italic",
  },
  note: {
    fontSize: 14,
    color: "#666666",
    fontStyle: "italic",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    backgroundColor: "#1DB954",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  laterButtonText: {
    color: "#666666",
    fontSize: 14,
  },
});