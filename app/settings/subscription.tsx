import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/auth";
import { Check, Shield, AlertCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function SubscriptionScreen() {
  const { user, updateUser } = useAuthStore();
  
  const handleSelectPlan = (plan: "free" | "premium" | "pro") => {
    // In a real app, this would navigate to a payment screen
    // For demo purposes, we'll just update the user's subscription tier
    updateUser({ subscriptionTier: plan });
  };
  
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Upgrade to unlock more features and protect your music taste
          </Text>
        </View>
        
        <View style={styles.plansContainer}>
          {/* Free Plan */}
          <Pressable 
            style={[
              styles.planCard,
              user?.subscriptionTier === "free" && styles.selectedPlanCard
            ]}
            onPress={() => handleSelectPlan("free")}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Free</Text>
              <Text style={styles.planPrice}>$0</Text>
            </View>
            
            <View style={styles.planFeatures}>
              <View style={styles.featureItem}>
                <Check size={16} color="#1DB954" />
                <Text style={styles.featureText}>Basic manual shielding</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#1DB954" />
                <Text style={styles.featureText}>Limited to 10 blacklist items</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#1DB954" />
                <Text style={styles.featureText}>1-2 time-based rules</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#1DB954" />
                <Text style={styles.featureText}>Basic statistics</Text>
              </View>
            </View>
            
            {user?.subscriptionTier === "free" ? (
              <View style={styles.currentPlanBadge}>
                <Text style={styles.currentPlanText}>Current Plan</Text>
              </View>
            ) : (
              <Pressable 
                style={styles.selectButton}
                onPress={() => handleSelectPlan("free")}
              >
                <Text style={styles.selectButtonText}>Select</Text>
              </Pressable>
            )}
          </Pressable>
          
          {/* Premium Plan */}
          <Pressable 
            style={[
              styles.planCard,
              user?.subscriptionTier === "premium" && styles.selectedPlanCard
            ]}
            onPress={() => handleSelectPlan("premium")}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Premium</Text>
              <Text style={styles.planPrice}>$4.99<Text style={styles.pricePeriod}>/month</Text></Text>
            </View>
            
            <View style={styles.planFeatures}>
              <View style={styles.featureItem}>
                <Check size={16} color="#1DB954" />
                <Text style={styles.featureText}>Unlimited manual shielding</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#1DB954" />
                <Text style={styles.featureText}>Device-based rules</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#1DB954" />
                <Text style={styles.featureText}>Unlimited blacklist items</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#1DB954" />
                <Text style={styles.featureText}>Up to 5 time-based rules</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#1DB954" />
                <Text style={styles.featureText}>Activity tagging</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#1DB954" />
                <Text style={styles.featureText}>Detailed "True Taste" stats</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#1DB954" />
                <Text style={styles.featureText}>Basic Last.fm scrobble control</Text>
              </View>
            </View>
            
            {user?.subscriptionTier === "premium" ? (
              <View style={styles.currentPlanBadge}>
                <Text style={styles.currentPlanText}>Current Plan</Text>
              </View>
            ) : (
              <Pressable 
                style={styles.selectButton}
                onPress={() => handleSelectPlan("premium")}
              >
                <Text style={styles.selectButtonText}>Select</Text>
              </Pressable>
            )}
          </Pressable>
          
          {/* Pro Plan */}
          <Pressable 
            style={[
              styles.planCard,
              styles.proPlanCard,
              user?.subscriptionTier === "pro" && styles.selectedProPlanCard
            ]}
            onPress={() => handleSelectPlan("pro")}
          >
            <LinearGradient
              colors={["#1DB954", "#147B36"]}
              style={styles.proGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.planName, styles.proPlanName]}>Pro</Text>
                <Text style={[styles.planPrice, styles.proPlanPrice]}>
                  $9.99<Text style={[styles.pricePeriod, styles.proPricePeriod]}>/month</Text>
                </Text>
              </View>
              
              <View style={styles.planFeatures}>
                <View style={styles.featureItem}>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    All Premium features
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    AI-powered session management
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    Smart alerts for unprotected listening
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    AI-assisted taste profile curation
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    Intelligent rule creation wizard
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    Advanced shielding strength options
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    Whitelisting within shielded sessions
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={[styles.featureText, styles.proFeatureText]}>
                    Profile integrity score & anomaly detection
                  </Text>
                </View>
              </View>
              
              {user?.subscriptionTier === "pro" ? (
                <View style={[styles.currentPlanBadge, styles.proCurrentPlanBadge]}>
                  <Text style={styles.currentPlanText}>Current Plan</Text>
                </View>
              ) : (
                <Pressable 
                  style={[styles.selectButton, styles.proSelectButton]}
                  onPress={() => handleSelectPlan("pro")}
                >
                  <Text style={styles.selectButtonText}>Select</Text>
                </Pressable>
              )}
            </LinearGradient>
          </Pressable>
        </View>
        
        <View style={styles.infoContainer}>
          <AlertCircle size={16} color="#666666" />
          <Text style={styles.infoText}>
            In a real app, selecting a paid plan would take you to a payment screen.
            For this demo, plans can be switched instantly.
          </Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 22,
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
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
  selectedPlanCard: {
    borderColor: "#1DB954",
  },
  proPlanCard: {
    overflow: "hidden",
  },
  selectedProPlanCard: {
    borderColor: "#147B36",
  },
  proGradient: {
    borderRadius: 10,
    overflow: "hidden",
  },
  planHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#191414",
    marginBottom: 8,
  },
  proPlanName: {
    color: "#FFFFFF",
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#191414",
  },
  proPlanPrice: {
    color: "#FFFFFF",
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#666666",
  },
  proPricePeriod: {
    color: "rgba(255, 255, 255, 0.8)",
  },
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
    color: "#191414",
    marginLeft: 8,
  },
  proFeatureText: {
    color: "#FFFFFF",
  },
  currentPlanBadge: {
    backgroundColor: "#1DB954",
    paddingVertical: 8,
    alignItems: "center",
  },
  proCurrentPlanBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  currentPlanText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  selectButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    alignItems: "center",
  },
  proSelectButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191414",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
    lineHeight: 20,
  },
});