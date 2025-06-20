import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRulesStore } from "@/stores/rules";
import { Clock, Plus, Calendar, Smartphone, Trash2, Edit2 } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth";

export default function RulesScreen() {
  const { user } = useAuthStore();
  const { 
    timeRules, 
    deviceRules,
    toggleTimeRule,
    toggleDeviceRule,
    removeTimeRule,
    removeDeviceRule
  } = useRulesStore();
  
  const [activeTab, setActiveTab] = useState("Time");
  
  const handleAddRule = () => {
    // In a real app, this would navigate to a rule creation screen
    // For demo purposes, we'll just show an alert
    if (activeTab === "Time") {
      if (user?.subscriptionTier === "free" && timeRules.length >= 2) {
        Alert.alert(
          "Subscription Limit Reached",
          "Free plan users can only create up to 2 time-based rules. Upgrade to Premium or Pro for more rules.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "View Plans", onPress: () => {} }
          ]
        );
        return;
      }
      
      Alert.alert(
        "Add Time Rule",
        "In a complete app, this would open a time rule creation screen.",
        [{ text: "OK" }]
      );
    } else {
      if (user?.subscriptionTier === "free") {
        Alert.alert(
          "Premium Feature",
          "Device-based rules are available in Premium and Pro plans.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "View Plans", onPress: () => {} }
          ]
        );
        return;
      }
      
      Alert.alert(
        "Add Device Rule",
        "In a complete app, this would open a device rule creation screen.",
        [{ text: "OK" }]
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Shielding Rules</Text>
          <Text style={styles.subtitle}>
            Create rules to automatically shield your listening based on time or device
          </Text>
        </View>
        
        <View style={styles.tabContainer}>
          <Pressable
            style={[
              styles.tabButton,
              activeTab === "Time" && styles.activeTabButton
            ]}
            onPress={() => setActiveTab("Time")}
          >
            <Clock 
              size={16} 
              color={activeTab === "Time" ? "#1DB954" : "#666666"} 
              style={styles.tabIcon}
            />
            <Text 
              style={[
                styles.tabButtonText,
                activeTab === "Time" && styles.activeTabButtonText
              ]}
            >
              Time-based
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.tabButton,
              activeTab === "Device" && styles.activeTabButton
            ]}
            onPress={() => setActiveTab("Device")}
          >
            <Smartphone 
              size={16} 
              color={activeTab === "Device" ? "#1DB954" : "#666666"} 
              style={styles.tabIcon}
            />
            <Text 
              style={[
                styles.tabButtonText,
                activeTab === "Device" && styles.activeTabButtonText
              ]}
            >
              Device-based
            </Text>
          </Pressable>
        </View>
        
        <View style={styles.rulesContainer}>
          {activeTab === "Time" ? (
            <>
              {timeRules.length > 0 ? (
                timeRules.map((rule) => (
                  <View key={rule.id} style={styles.ruleCard}>
                    <View style={styles.ruleHeader}>
                      <Text style={styles.ruleName}>{rule.name}</Text>
                      <Switch
                        trackColor={{ false: "#DDDDDD", true: "#1DB954" }}
                        thumbColor="#FFFFFF"
                        value={rule.enabled}
                        onValueChange={() => toggleTimeRule(rule.id)}
                      />
                    </View>
                    
                    <View style={styles.ruleDetails}>
                      <View style={styles.ruleItem}>
                        <Calendar size={16} color="#666666" />
                        <Text style={styles.ruleText}>
                          {rule.days.join(", ")}
                        </Text>
                      </View>
                      
                      <View style={styles.ruleItem}>
                        <Clock size={16} color="#666666" />
                        <Text style={styles.ruleText}>
                          {rule.startTime} - {rule.endTime}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.ruleActions}>
                      <Pressable style={styles.ruleAction}>
                        <Edit2 size={16} color="#1DB954" />
                        <Text style={styles.ruleActionText}>Edit</Text>
                      </Pressable>
                      
                      <Pressable 
                        style={styles.ruleAction}
                        onPress={() => removeTimeRule(rule.id)}
                      >
                        <Trash2 size={16} color="#FF3B30" />
                        <Text style={[styles.ruleActionText, styles.deleteActionText]}>
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Clock size={40} color="#CCCCCC" />
                  <Text style={styles.emptyText}>No time-based rules</Text>
                  <Text style={styles.emptySubtext}>
                    Create rules to automatically shield your listening at specific times
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {user?.subscriptionTier === "free" ? (
                <View style={styles.premiumFeatureContainer}>
                  <Smartphone size={40} color="#CCCCCC" />
                  <Text style={styles.premiumFeatureTitle}>Premium Feature</Text>
                  <Text style={styles.premiumFeatureText}>
                    Device-based rules are available in Premium and Pro plans
                  </Text>
                  <Pressable style={styles.upgradePlanButton}>
                    <Text style={styles.upgradePlanButtonText}>View Plans</Text>
                  </Pressable>
                </View>
              ) : deviceRules.length > 0 ? (
                deviceRules.map((rule) => (
                  <View key={rule.id} style={styles.ruleCard}>
                    <View style={styles.ruleHeader}>
                      <Text style={styles.ruleName}>{rule.deviceName}</Text>
                      <Switch
                        trackColor={{ false: "#DDDDDD", true: "#1DB954" }}
                        thumbColor="#FFFFFF"
                        value={rule.enabled}
                        onValueChange={() => toggleDeviceRule(rule.id)}
                      />
                    </View>
                    
                    <View style={styles.ruleDetails}>
                      <View style={styles.ruleItem}>
                        <Smartphone size={16} color="#666666" />
                        <Text style={styles.ruleText}>
                          {rule.deviceType}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.ruleActions}>
                      <Pressable style={styles.ruleAction}>
                        <Edit2 size={16} color="#1DB954" />
                        <Text style={styles.ruleActionText}>Edit</Text>
                      </Pressable>
                      
                      <Pressable 
                        style={styles.ruleAction}
                        onPress={() => removeDeviceRule(rule.id)}
                      >
                        <Trash2 size={16} color="#FF3B30" />
                        <Text style={[styles.ruleActionText, styles.deleteActionText]}>
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Smartphone size={40} color="#CCCCCC" />
                  <Text style={styles.emptyText}>No device-based rules</Text>
                  <Text style={styles.emptySubtext}>
                    Create rules to automatically shield your listening on specific devices
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.addButtonContainer}>
        <Pressable 
          style={styles.addButton}
          onPress={handleAddRule}
        >
          <Plus size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>
            Add {activeTab} Rule
          </Text>
        </Pressable>
      </View>
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
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: "#E8F8EE",
  },
  tabIcon: {
    marginRight: 8,
  },
  tabButtonText: {
    fontSize: 14,
    color: "#666666",
  },
  activeTabButtonText: {
    color: "#1DB954",
    fontWeight: "500",
  },
  rulesContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80, // Space for the add button
  },
  ruleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  ruleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  ruleName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191414",
  },
  ruleDetails: {
    padding: 16,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ruleText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
  },
  ruleActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  ruleAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  ruleActionText: {
    fontSize: 14,
    color: "#1DB954",
    marginLeft: 8,
  },
  deleteActionText: {
    color: "#FF3B30",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    padding: 40,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#191414",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  premiumFeatureContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    padding: 40,
    borderRadius: 12,
  },
  premiumFeatureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#191414",
    marginTop: 16,
  },
  premiumFeatureText: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  upgradePlanButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  upgradePlanButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1DB954",
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});