import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#1DB954", "#191414"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.appName}>StreamShield</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.tagline}>Protect your music taste profile</Text>
            <Text style={styles.description}>
              Shield your Spotify recommendations from unwanted influences. Keep
              your music taste authentic.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.loginButton}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.loginButtonText}>Get Started</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 16,
  },
  infoContainer: {
    alignItems: "center",
  },
  tagline: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#191414",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    marginBottom: 20,
  },
  footerText: {
    color: "#FFFFFF",
    opacity: 0.6,
    textAlign: "center",
    fontSize: 12,
  },
});
