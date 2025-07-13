import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/auth";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore } from "@/stores/theme";
import { useColorScheme } from "react-native";
import { themes } from "@/constants/colors";

export default function SubscriptionScreen() {
  const { user, updateUser } = useAuthStore();
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme =
    themePref === "auto" ? (colorScheme ?? "light") : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const handleSelectPlan = (plan: "free" | "premium" | "pro") => {
    updateUser({ ...user, subscriptionTier: plan });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["bottom"]}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Subscription Plans
          </Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            Choose the plan that fits your needs
          </Text>
        </View>
        <View style={styles.plansContainer}>
          {/* Free Plan Card */}
          <View
            style={[
              styles.planCard,
              user?.subscriptionTier === "free" && [
                styles.selectedPlanCard,
                { borderColor: theme.tint },
              ],
              { backgroundColor: theme.background },
            ]}
          >
            <View
              style={[styles.planHeader, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.planName, { color: theme.text }]}>Free</Text>
              <Text style={[styles.planPrice, { color: theme.text }]}>$0</Text>
              <Text style={[styles.pricePeriod, { color: theme.text }]}>
                /month
              </Text>
            </View>
            <View style={styles.planFeatures}>
              <View style={styles.featureItem}>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  Basic shielding
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  2 time-based rules
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  No device-based rules
                </Text>
              </View>
            </View>
            {user?.subscriptionTier === "free" ? (
              <View
                style={[
                  styles.currentPlanBadge,
                  { backgroundColor: theme.tint },
                ]}
              >
                <Text style={styles.currentPlanText}>Current Plan</Text>
              </View>
            ) : (
              <Pressable
                style={[
                  styles.selectButton,
                  { backgroundColor: theme.background },
                ]}
                onPress={() => handleSelectPlan("free")}
              >
                <Text style={[styles.selectButtonText, { color: theme.text }]}>
                  Select
                </Text>
              </Pressable>
            )}
          </View>

          {/* Premium Plan Card */}
          <View
            style={[
              styles.planCard,
              user?.subscriptionTier === "premium" && [
                styles.selectedPlanCard,
                { borderColor: theme.tint },
              ],
              { backgroundColor: theme.background },
            ]}
          >
            <View
              style={[styles.planHeader, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.planName, { color: theme.text }]}>
                Premium
              </Text>
              <Text style={[styles.planPrice, { color: theme.text }]}>
                $4.99
              </Text>
              <Text style={[styles.pricePeriod, { color: theme.text }]}>
                /month
              </Text>
            </View>
            <View style={styles.planFeatures}>
              <View style={styles.featureItem}>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  All Free features
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  Unlimited time-based rules
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  Device-based rules
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  Priority support
                </Text>
              </View>
            </View>
            {user?.subscriptionTier === "premium" ? (
              <View
                style={[
                  styles.currentPlanBadge,
                  { backgroundColor: theme.tint },
                ]}
              >
                <Text style={styles.currentPlanText}>Current Plan</Text>
              </View>
            ) : (
              <Pressable
                style={[
                  styles.selectButton,
                  { backgroundColor: theme.background },
                ]}
                onPress={() => handleSelectPlan("premium")}
              >
                <Text style={[styles.selectButtonText, { color: theme.text }]}>
                  Select
                </Text>
              </Pressable>
            )}
          </View>

          {/* Pro Plan Card */}
          <View
            style={[
              styles.planCard,
              styles.proPlanCard,
              user?.subscriptionTier === "pro" && [
                styles.selectedProPlanCard,
                { borderColor: theme.tint },
              ],
              { backgroundColor: theme.background },
            ]}
          >
            <LinearGradient
              colors={[theme.tint, "#147B36"]}
              style={styles.proGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={[styles.planHeader, { borderBottomColor: theme.border }]}
              >
                <Text
                  style={[
                    styles.planName,
                    styles.proPlanName,
                    { color: "#FFFFFF" },
                  ]}
                >
                  Pro
                </Text>
                <Text
                  style={[
                    styles.planPrice,
                    styles.proPlanPrice,
                    { color: "#FFFFFF" },
                  ]}
                >
                  $9.99
                </Text>
                <Text
                  style={[
                    styles.pricePeriod,
                    styles.proPricePeriod,
                    { color: "rgba(255,255,255,0.8)" },
                  ]}
                >
                  /month
                </Text>
              </View>
              <View style={styles.planFeatures}>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    All Premium features
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    AI-powered session management
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    Smart alerts for unprotected listening
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    AI-assisted taste profile curation
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    Intelligent rule creation wizard
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    Advanced shielding strength options
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    Whitelisting within shielded sessions
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    Profile integrity score & anomaly detection
                  </Text>
                </View>
              </View>
              {user?.subscriptionTier === "pro" ? (
                <View
                  style={[
                    styles.currentPlanBadge,
                    styles.proCurrentPlanBadge,
                    { backgroundColor: "rgba(255,255,255,0.2)" },
                  ]}
                >
                  <Text style={styles.currentPlanText}>Current Plan</Text>
                </View>
              ) : (
                <Pressable
                  style={[
                    styles.selectButton,
                    styles.proSelectButton,
                    { backgroundColor: "rgba(255,255,255,0.2)" },
                  ]}
                  onPress={() => handleSelectPlan("pro")}
                >
                  <Text style={styles.selectButtonText}>Select</Text>
                </Pressable>
              )}
            </LinearGradient>
          </View>
        </View>
        <View
          style={[styles.infoContainer, { backgroundColor: theme.background }]}
        >
          <Text style={[styles.infoText, { color: theme.text }]}>
            In a real app, selecting a paid plan would take you to a payment
            screen. For this demo, plans can be switched instantly.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedPlanCard: {},
  proPlanCard: {
    overflow: "hidden",
  },
  selectedProPlanCard: {},
  proGradient: {
    borderRadius: 10,
    overflow: "hidden",
  },
  planHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  proPlanName: {},
  planPrice: {
    fontSize: 24,
    fontWeight: "bold",
  },
  proPlanPrice: {},
  pricePeriod: {
    fontSize: 14,
    fontWeight: "normal",
  },
  proPricePeriod: {},
  planFeatures: {
    padding: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
  },
  proFeatureText: {},
  currentPlanBadge: {
    paddingVertical: 8,
    alignItems: "center",
  },
  proCurrentPlanBadge: {},
  currentPlanText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  selectButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  proSelectButton: {},
  selectButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    lineHeight: 20,
  },
});
