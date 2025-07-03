import React from "react";
import { View, Text, StyleSheet, Pressable, Linking, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeStore } from "@/stores/theme";
import { useColorScheme } from "react-native";
import { themes } from "@/constants/colors";
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const FAQ = [
  { q: "How does StreamShield work?", a: "StreamShield protects your Spotify recommendations by shielding certain listening sessions from influencing your taste profile." },
  { q: "How do I activate the shield?", a: "Go to the Shield tab and tap the shield button to activate or deactivate protection." },
  { q: "What are time-based rules?", a: "Time-based rules let you automatically enable the shield during specific times or days." },
  { q: "How do I contact support?", a: "Tap the 'Contact Support' button below to send us an email." },
];

export default function SupportScreen() {
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const handleContact = () => {
    const email = "support@streamshield.app";
    const subject = encodeURIComponent("StreamShield Support Request");
    const body = encodeURIComponent("");
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open email client.");
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Help & Support</Text>
        {FAQ.map((item, idx) => (
          <View key={idx} style={styles.faqItem}>
            <Text style={[styles.faqQ, { color: theme.tint }]}>{item.q}</Text>
            <Text style={[styles.faqA, { color: theme.text }]}>{item.a}</Text>
          </View>
        ))}
        <Pressable style={[styles.contactButton, { backgroundColor: theme.tint }]} onPress={handleContact}>
          <Text style={[styles.contactButtonText, { color: theme.background }]}>Contact Support</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  faqItem: {
    marginBottom: 20,
  },
  faqQ: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  faqA: {
    fontSize: 15,
    marginBottom: 8,
  },
  contactButton: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
}); 