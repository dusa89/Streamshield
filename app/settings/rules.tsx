import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Modal,
  useColorScheme,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRulesStore } from "@/stores/rules";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { themes } from "@/constants/colors";
import { useNavigation } from "@react-navigation/native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DeviceSelector from "@/components/DeviceSelector";
import { SpotifyDevice } from "@/services/deviceManager";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function RulesScreen() {
  const { user } = useAuthStore();
  const {
    timeRules,
    deviceRules,
    toggleTimeRule,
    toggleDeviceRule,
    removeTimeRule,
    removeDeviceRule,
    addTimeRule,
    addDeviceRule,
    editDeviceRule,
  } = useRulesStore();

  const [activeTab, setActiveTab] = useState("Time");
  const [showModal, setShowModal] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [newTimeRule, setNewTimeRule] = useState({
    name: "",
    days: [] as string[],
    startTime: Platform.OS === "ios" ? "09:00 AM" : "9:00 AM",
    endTime: Platform.OS === "ios" ? "05:00 PM" : "5:00 PM",
  });
  const [newDeviceRule, setNewDeviceRule] = useState({
    deviceId: "",
    deviceName: "",
    deviceType: "Smart Speaker",
    autoShield: true,
    shieldDuration: 60, // 1 hour default
  });

  const { theme: themePref, colorTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme =
    themePref === "auto" ? (colorScheme ?? "light") : themePref;
  const theme = themes[colorTheme][effectiveTheme];
  const insets = useSafeAreaInsets();

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.background },
      headerTitleStyle: { color: theme.text },
      headerTintColor: theme.text,
    });
  }, [navigation, theme]);

  const [editingRule, setEditingRule] = useState<null | {
    type: "Time" | "Device";
    rule: any;
  }>(null);

  const handleAddRule = () => {
    if (activeTab === "Time") {
      if (user?.subscriptionTier === "free" && timeRules.length >= 2) {
        Alert.alert(
          "Subscription Limit Reached",
          "Free plan users can only create up to 2 time-based rules. Upgrade to Premium or Pro for more rules.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "View Plans", onPress: () => {} },
          ],
        );
        return;
      }
      setShowModal(true);
    } else {
      if (user?.subscriptionTier === "free") {
        Alert.alert(
          "Premium Feature",
          "Device-based rules are available in Premium and Pro plans.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "View Plans", onPress: () => {} },
          ],
        );
        return;
      }
      setShowDeviceSelector(true);
    }
  };

  const handleDeviceSelect = (device: SpotifyDevice) => {
    setNewDeviceRule({
      deviceId: device.id,
      deviceName: device.friendlyName ?? device.name,
      deviceType: device.category ?? device.type,
      autoShield: true,
      shieldDuration: 60,
    });
    setShowModal(true);
  };

  const handleSubmitTimeRule = () => {
    if (!newTimeRule.name ?? newTimeRule.days.length === 0) return;
    addTimeRule({
      id: `time${Date.now()}`,
      name: newTimeRule.name,
      days: newTimeRule.days,
      startTime: newTimeRule.startTime,
      endTime: newTimeRule.endTime,
      enabled: true,
    });
    setShowModal(false);
    setNewTimeRule({
      name: "",
      days: [],
      startTime: "9:00 AM",
      endTime: "5:00 PM",
    });
  };

  const handleSubmitDeviceRule = () => {
    if (!newDeviceRule.deviceId ?? !newDeviceRule.deviceName) return;
    addDeviceRule({
      id: `device${Date.now()}`,
      deviceId: newDeviceRule.deviceId,
      deviceName: newDeviceRule.deviceName,
      deviceType: newDeviceRule.deviceType,
      enabled: true,
      autoShield: newDeviceRule.autoShield,
      shieldDuration: newDeviceRule.shieldDuration,
    });
    setShowModal(false);
    setNewDeviceRule({
      deviceId: "",
      deviceName: "",
      deviceType: "Smart Speaker",
      autoShield: true,
      shieldDuration: 60,
    });
  };

  const handleEditRule = (type: "Time" | "Device", rule: any) => {
    setEditingRule({ type, rule });
    setShowModal(true);
    if (type === "Time") {
      setNewTimeRule({
        name: rule.name,
        days: rule.days,
        startTime: rule.startTime,
        endTime: rule.endTime,
      });
    } else {
      setNewDeviceRule({
        deviceId: rule.deviceId,
        deviceName: rule.deviceName,
        deviceType: rule.deviceType,
        autoShield: rule.autoShield,
        shieldDuration: rule.shieldDuration,
      });
    }
  };

  const handleSaveEdit = () => {
    if (!editingRule) return;
    if (editingRule.type === "Time") {
      if (!newTimeRule.name ?? newTimeRule.days.length === 0) return;
      useRulesStore.getState().editTimeRule(editingRule.rule.id, {
        ...editingRule.rule,
        ...newTimeRule,
      });
      setShowModal(false);
      setEditingRule(null);
      setNewTimeRule({
        name: "",
        days: [],
        startTime: "9:00 AM",
        endTime: "5:00 PM",
      });
    } else {
      if (!newDeviceRule.deviceId ?? !newDeviceRule.deviceName) return;
      editDeviceRule(editingRule.rule.id, {
        ...editingRule.rule,
        ...newDeviceRule,
      });
      setShowModal(false);
      setEditingRule(null);
      setNewDeviceRule({
        deviceId: "",
        deviceName: "",
        deviceType: "Smart Speaker",
        autoShield: true,
        shieldDuration: 60,
      });
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return "Unlimited";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["bottom"]}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Shielding Rules
          </Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            Create rules to automatically shield your listening based on time or
            device
          </Text>
        </View>
        <View
          style={[
            styles.tabContainer,
            {
              borderBottomColor: theme.border,
              backgroundColor: theme.background,
            },
          ]}
        >
          <Pressable
            style={[
              styles.tabButton,
              {
                backgroundColor:
                  activeTab === "Time" ? theme.tint : theme.background,
                borderColor: activeTab === "Time" ? theme.tint : theme.border,
              },
            ]}
            onPress={() => setActiveTab("Time")}
          >
            <Text
              style={[
                styles.tabButtonText,
                {
                  color: activeTab === "Time" ? theme.background : theme.text,
                },
              ]}
            >
              Time-based
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tabButton,
              {
                backgroundColor:
                  activeTab === "Device" ? theme.tint : theme.background,
                borderColor: activeTab === "Device" ? theme.tint : theme.border,
              },
            ]}
            onPress={() => setActiveTab("Device")}
          >
            <Text
              style={[
                styles.tabButtonText,
                {
                  color: activeTab === "Device" ? theme.background : theme.text,
                },
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
                  <View
                    key={rule.id}
                    style={[
                      styles.ruleCard,
                      {
                        backgroundColor: theme.background,
                        shadowColor: "#000",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.ruleHeader,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <Text style={[styles.ruleName, { color: theme.text }]}>
                        {rule.name}
                      </Text>
                      <Switch
                        trackColor={{ false: "#A9A9A9", true: theme.tint }}
                        thumbColor="#FFFFFF"
                        value={rule.enabled}
                        onValueChange={() => toggleTimeRule(rule.id)}
                      />
                    </View>
                    <View style={styles.ruleDetails}>
                      <View style={styles.ruleItem}>
                        <Text style={[styles.ruleText, { color: theme.text }]}>
                          {rule.days.join(", ")}
                        </Text>
                      </View>
                      <View style={styles.ruleItem}>
                        <Text style={[styles.ruleText, { color: theme.text }]}>
                          {rule.startTime} - {rule.endTime}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.ruleActions,
                        { borderTopColor: theme.border },
                      ]}
                    >
                      <Pressable
                        style={styles.ruleAction}
                        onPress={() => handleEditRule("Time", rule)}
                      >
                        <Text
                          style={[styles.ruleActionText, { color: theme.text }]}
                        >
                          Edit
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.ruleAction}
                        onPress={() => removeTimeRule(rule.id)}
                      >
                        <Text
                          style={[
                            styles.ruleActionText,
                            styles.deleteActionText,
                          ]}
                        >
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <View
                  style={[
                    styles.emptyContainer,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <Text style={[styles.emptyText, { color: theme.text }]}>
                    No time-based rules
                  </Text>
                  <Text style={[styles.emptySubtext, { color: theme.text }]}>
                    Create rules to automatically shield your listening at
                    specific times
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {user?.subscriptionTier === "free" ? (
                <View
                  style={[
                    styles.premiumFeatureContainer,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <Text
                    style={[styles.premiumFeatureTitle, { color: theme.text }]}
                  >
                    Premium Feature
                  </Text>
                  <Text
                    style={[styles.premiumFeatureText, { color: theme.text }]}
                  >
                    Device-based rules are available in Premium and Pro plans
                  </Text>
                  <Pressable
                    style={[
                      styles.upgradePlanButton,
                      { backgroundColor: theme.tint },
                    ]}
                  >
                    <Text
                      style={[
                        styles.upgradePlanButtonText,
                        { color: theme.background },
                      ]}
                    >
                      View Plans
                    </Text>
                  </Pressable>
                </View>
              ) : deviceRules.length > 0 ? (
                deviceRules.map((rule) => (
                  <View
                    key={rule.id}
                    style={[
                      styles.ruleCard,
                      {
                        backgroundColor: theme.background,
                        shadowColor: "#000",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.ruleHeader,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <Text style={[styles.ruleName, { color: theme.text }]}>
                        {rule.deviceName}
                      </Text>
                      <Switch
                        trackColor={{ false: "#A9A9A9", true: theme.tint }}
                        thumbColor="#FFFFFF"
                        value={rule.enabled}
                        onValueChange={() => toggleDeviceRule(rule.id)}
                      />
                    </View>
                    <View style={styles.ruleDetails}>
                      <View style={styles.ruleItem}>
                        <Text style={[styles.ruleText, { color: theme.text }]}>
                          {rule.deviceType}
                        </Text>
                      </View>
                      <View style={styles.ruleItem}>
                        <View style={styles.ruleFeature}>
                          <MaterialCommunityIcons
                            name={rule.autoShield ? "shield-check" : "shield-off"}
                            size={16}
                            color={rule.autoShield ? "#4CAF50" : theme.textSecondary}
                          />
                          <Text style={[styles.ruleText, { color: theme.text }]}>
                            Auto-shield: {rule.autoShield ? "On" : "Off"}
                          </Text>
                        </View>
                      </View>
                      {rule.autoShield && rule.shieldDuration !== undefined && (
                        <View style={styles.ruleItem}>
                          <Text style={[styles.ruleText, { color: theme.text }]}>
                            Duration: {formatDuration(rule.shieldDuration)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={[
                        styles.ruleActions,
                        { borderTopColor: theme.border },
                      ]}
                    >
                      <Pressable
                        style={styles.ruleAction}
                        onPress={() => handleEditRule("Device", rule)}
                      >
                        <Text
                          style={[styles.ruleActionText, { color: theme.text }]}
                        >
                          Edit
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.ruleAction}
                        onPress={() => removeDeviceRule(rule.id)}
                      >
                        <Text
                          style={[
                            styles.ruleActionText,
                            styles.deleteActionText,
                          ]}
                        >
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <View
                  style={[
                    styles.emptyContainer,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <Text style={[styles.emptyText, { color: theme.text }]}>
                    No device-based rules
                  </Text>
                  <Text style={[styles.emptySubtext, { color: theme.text }]}>
                    Create rules to automatically shield your listening when
                    specific devices are active
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Rule Button */}
      <View
        style={[
          styles.addButtonContainer,
          {
            paddingBottom: insets.bottom + 20,
            backgroundColor: theme.background,
          },
        ]}
      >
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.tint }]}
          onPress={handleAddRule}
        >
          <FontAwesome name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Rule</Text>
        </Pressable>
      </View>

      {/* Time Rule Modal */}
      <Modal
        visible={showModal && activeTab === "Time"}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingRule ? "Edit Time Rule" : "New Time Rule"}
            </Text>
            <Pressable onPress={() => setShowModal(false)}>
              <FontAwesome name="close" size={20} color={theme.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={newTimeRule.name}
                onChangeText={(text) =>
                  setNewTimeRule({ ...newTimeRule, name: text })
                }
                placeholder="e.g., Work Hours"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Days</Text>
              <View style={styles.daysContainer}>
                {DAYS.map((day) => (
                  <Pressable
                    key={day}
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: newTimeRule.days.includes(day)
                          ? theme.tint
                          : theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      const updatedDays = newTimeRule.days.includes(day)
                        ? newTimeRule.days.filter((d) => d !== day)
                        : [...newTimeRule.days, day];
                      setNewTimeRule({ ...newTimeRule, days: updatedDays });
                    }}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        {
                          color: newTimeRule.days.includes(day)
                            ? theme.background
                            : theme.text,
                        },
                      ]}
                    >
                      {day.slice(0, 3)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Time</Text>
              <View style={styles.timeContainer}>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      backgroundColor: theme.card,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={newTimeRule.startTime}
                  onChangeText={(text) =>
                    setNewTimeRule({ ...newTimeRule, startTime: text })
                  }
                  placeholder="9:00 AM"
                  placeholderTextColor={theme.textSecondary}
                />
                <Text style={[styles.timeSeparator, { color: theme.text }]}>to</Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      backgroundColor: theme.card,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={newTimeRule.endTime}
                  onChangeText={(text) =>
                    setNewTimeRule({ ...newTimeRule, endTime: text })
                  }
                  placeholder="5:00 PM"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.modalButton, { backgroundColor: theme.border }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.text }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, { backgroundColor: theme.tint }]}
              onPress={editingRule ? handleSaveEdit : handleSubmitTimeRule}
            >
              <Text style={[styles.modalButtonText, { color: theme.background }]}>
                {editingRule ? "Save" : "Create"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Device Rule Modal */}
      <Modal
        visible={showModal && activeTab === "Device"}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingRule ? "Edit Device Rule" : "New Device Rule"}
            </Text>
            <Pressable onPress={() => setShowModal(false)}>
              <FontAwesome name="close" size={20} color={theme.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Device</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={newDeviceRule.deviceName}
                onChangeText={(text) =>
                  setNewDeviceRule({ ...newDeviceRule, deviceName: text })
                }
                placeholder="Device name"
                placeholderTextColor={theme.textSecondary}
                editable={!editingRule} // Don't allow editing device name when editing
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Device Type</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={newDeviceRule.deviceType}
                onChangeText={(text) =>
                  setNewDeviceRule({ ...newDeviceRule, deviceType: text })
                }
                placeholder="Device type"
                placeholderTextColor={theme.textSecondary}
                editable={!editingRule} // Don't allow editing device type when editing
              />
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Auto-activate shield
                </Text>
                <Switch
                  trackColor={{ false: "#A9A9A9", true: theme.tint }}
                  thumbColor="#FFFFFF"
                  value={newDeviceRule.autoShield}
                  onValueChange={(value) =>
                    setNewDeviceRule({ ...newDeviceRule, autoShield: value })
                  }
                />
              </View>
            </View>
            {newDeviceRule.autoShield && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Shield Duration (minutes)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.card,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={newDeviceRule.shieldDuration?.toString() ?? ""}
                  onChangeText={(text) => {
                    const duration = parseInt(text) ?? 0;
                    setNewDeviceRule({ ...newDeviceRule, shieldDuration: duration });
                  }}
                  placeholder="60 (0 = unlimited)"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                  Set to 0 for unlimited duration
                </Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.modalButton, { backgroundColor: theme.border }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.text }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, { backgroundColor: theme.tint }]}
              onPress={editingRule ? handleSaveEdit : handleSubmitDeviceRule}
            >
              <Text style={[styles.modalButtonText, { color: theme.background }]}>
                {editingRule ? "Save" : "Create"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Device Selector Modal */}
      <Modal
        visible={showDeviceSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <DeviceSelector
          onDeviceSelect={handleDeviceSelect}
          onClose={() => setShowDeviceSelector(false)}
        />
      </Modal>
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
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  rulesContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80, // Space for the add button
  },
  ruleCard: {
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
  },
  ruleName: {
    fontSize: 16,
    fontWeight: "600",
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
    marginLeft: 8,
  },
  ruleFeature: {
    flexDirection: "row",
    alignItems: "center",
  },
  ruleActions: {
    flexDirection: "row",
    borderTopWidth: 1,
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
    marginLeft: 8,
  },
  deleteActionText: {
    color: "#FF3B30",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  premiumFeatureContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderRadius: 12,
  },
  premiumFeatureTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  premiumFeatureText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  upgradePlanButton: {
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
    left: 16,
    right: 16,
    bottom: 0, // Adjust as needed
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContent: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  textInput: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  dayButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  dayButtonText: {
    fontSize: 14,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  timeInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  timeSeparator: {
    marginHorizontal: 10,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});
