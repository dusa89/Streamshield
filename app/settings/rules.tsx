import React from "react";
import { useState, useLayoutEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Modal, TextInput, Platform, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRulesStore } from "@/stores/rules";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { themes } from "@/constants/colors";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
  } = useRulesStore();

  const [activeTab, setActiveTab] = useState("Time");
  const [showModal, setShowModal] = useState(false);
  const [newTimeRule, setNewTimeRule] = useState({
    name: "",
    days: [] as string[],
    startTime: Platform.OS === "ios" ? "09:00 AM" : "9:00 AM",
    endTime: Platform.OS === "ios" ? "05:00 PM" : "5:00 PM",
  });
  const [newDeviceRule, setNewDeviceRule] = useState({
    deviceName: "",
    deviceType: "Smart Speaker",
  });

  const { theme: themePref, colorTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.background },
      headerTitleStyle: { color: theme.text },
      headerTintColor: theme.text,
    });
  }, [navigation, theme]);

  const [editingRule, setEditingRule] = useState<null | { type: 'Time' | 'Device', rule: any }>(null);

  const handleAddRule = () => {
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
      setShowModal(true);
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
      setShowModal(true);
    }
  };

  const handleSubmitTimeRule = () => {
    if (!newTimeRule.name || newTimeRule.days.length === 0) return;
    addTimeRule({
      id: `time${Date.now()}`,
      name: newTimeRule.name,
      days: newTimeRule.days,
      startTime: newTimeRule.startTime,
      endTime: newTimeRule.endTime,
      enabled: true,
    });
    setShowModal(false);
    setNewTimeRule({ name: "", days: [], startTime: "9:00 AM", endTime: "5:00 PM" });
  };

  const handleSubmitDeviceRule = () => {
    if (!newDeviceRule.deviceName) return;
    addDeviceRule({
      id: `device${Date.now()}`,
      deviceId: `dev${Date.now()}`,
      deviceName: newDeviceRule.deviceName,
      deviceType: newDeviceRule.deviceType,
      enabled: true,
    });
    setShowModal(false);
    setNewDeviceRule({ deviceName: "", deviceType: "Smart Speaker" });
  };

  const handleEditRule = (type: 'Time' | 'Device', rule: any) => {
    setEditingRule({ type, rule });
    setShowModal(true);
    if (type === 'Time') {
      setNewTimeRule({
        name: rule.name,
        days: rule.days,
        startTime: rule.startTime,
        endTime: rule.endTime,
      });
    } else {
      setNewDeviceRule({
        deviceName: rule.deviceName,
        deviceType: rule.deviceType,
      });
    }
  };

  const handleSaveEdit = () => {
    if (!editingRule) return;
    if (editingRule.type === 'Time') {
      if (!newTimeRule.name || newTimeRule.days.length === 0) return;
      useRulesStore.getState().editTimeRule(editingRule.rule.id, {
        ...editingRule.rule,
        ...newTimeRule,
      });
      setShowModal(false);
      setEditingRule(null);
      setNewTimeRule({ name: '', days: [], startTime: '9:00 AM', endTime: '5:00 PM' });
    } else {
      if (!newDeviceRule.deviceName) return;
      useRulesStore.getState().editDeviceRule(editingRule.rule.id, {
        ...editingRule.rule,
        ...newDeviceRule,
      });
      setShowModal(false);
      setEditingRule(null);
      setNewDeviceRule({ deviceName: '', deviceType: 'Smart Speaker' });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Shielding Rules</Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            Create rules to automatically shield your listening based on time or device
          </Text>
        </View>
        <View style={[styles.tabContainer, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
          <Pressable
            style={[
              styles.tabButton,
              {
                backgroundColor: activeTab === "Time" ? theme.tint : theme.background,
                borderColor: activeTab === "Time" ? theme.tint : theme.border,
              },
            ]}
            onPress={() => setActiveTab("Time")}
          >
            <Text style={[
              styles.tabButtonText,
              {
                color: activeTab === "Time" ? theme.background : theme.text,
              },
            ]}>
              Time-based
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tabButton,
              {
                backgroundColor: activeTab === "Device" ? theme.tint : theme.background,
                borderColor: activeTab === "Device" ? theme.tint : theme.border,
              },
            ]}
            onPress={() => setActiveTab("Device")}
          >
            <Text style={[
              styles.tabButtonText,
              {
                color: activeTab === "Device" ? theme.background : theme.text,
              },
            ]}>
              Device-based
            </Text>
          </Pressable>
        </View>
        <View style={styles.rulesContainer}>
          {activeTab === "Time" ? (
            <>
              {timeRules.length > 0 ? (
                timeRules.map((rule) => (
                  <View key={rule.id} style={[styles.ruleCard, { backgroundColor: theme.background, shadowColor: '#000' }]}>
                    <View style={[styles.ruleHeader, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.ruleName, { color: theme.text }]}>{rule.name}</Text>
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
                    <View style={[styles.ruleActions, { borderTopColor: theme.border }]}>
                      <Pressable style={styles.ruleAction} onPress={() => handleEditRule('Time', rule)}>
                        <Text style={[styles.ruleActionText, { color: theme.text }]}>Edit</Text>
                      </Pressable>
                      <Pressable 
                        style={styles.ruleAction}
                        onPress={() => removeTimeRule(rule.id)}
                      >
                        <Text style={[styles.ruleActionText, styles.deleteActionText]}>
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
                  <Text style={[styles.emptyText, { color: theme.text }]}>No time-based rules</Text>
                  <Text style={[styles.emptySubtext, { color: theme.text }]}>
                    Create rules to automatically shield your listening at specific times
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {user?.subscriptionTier === "free" ? (
                <View style={[styles.premiumFeatureContainer, { backgroundColor: theme.background }]}>
                  <Text style={[styles.premiumFeatureTitle, { color: theme.text }]}>Premium Feature</Text>
                  <Text style={[styles.premiumFeatureText, { color: theme.text }]}>
                    Device-based rules are available in Premium and Pro plans
                  </Text>
                  <Pressable style={[styles.upgradePlanButton, { backgroundColor: theme.tint }]}>
                    <Text style={[styles.upgradePlanButtonText, { color: theme.background }]}>View Plans</Text>
                  </Pressable>
                </View>
              ) : deviceRules.length > 0 ? (
                deviceRules.map((rule) => (
                  <View key={rule.id} style={[styles.ruleCard, { backgroundColor: theme.background, shadowColor: '#000' }]}>
                    <View style={[styles.ruleHeader, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.ruleName, { color: theme.text }]}>{rule.deviceName}</Text>
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
                    </View>
                    <View style={[styles.ruleActions, { borderTopColor: theme.border }]}>
                      <Pressable style={styles.ruleAction} onPress={() => handleEditRule('Device', rule)}>
                        <Text style={[styles.ruleActionText, { color: theme.text }]}>Edit</Text>
                      </Pressable>
                      <Pressable 
                        style={styles.ruleAction}
                        onPress={() => removeDeviceRule(rule.id)}
                      >
                        <Text style={[styles.ruleActionText, styles.deleteActionText]}>
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
                  <Text style={[styles.emptyText, { color: theme.text }]}>No device-based rules</Text>
                  <Text style={[styles.emptySubtext, { color: theme.text }]}>
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
          style={[styles.addButton, { backgroundColor: theme.tint, shadowColor: '#000' }]}
          onPress={handleAddRule}
        >
          <Text style={[styles.addButtonText, { color: theme.background }]}>Add {activeTab} Rule</Text>
        </Pressable>
      </View>
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {activeTab === "Time" ? (
              <>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{editingRule ? 'Edit Time Rule' : 'New Time Rule'}</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                  placeholder="Rule Name"
                  value={newTimeRule.name}
                  onChangeText={name => setNewTimeRule({ ...newTimeRule, name })}
                />
                <Text style={[styles.label, { color: theme.text }]}>Days</Text>
                <View style={styles.daysContainer}>
                  {DAYS.map(day => (
                    <Pressable
                      key={day}
                      style={[
                        styles.dayButton,
                        { borderColor: theme.border, backgroundColor: newTimeRule.days.includes(day) ? theme.tint : theme.input }
                      ]}
                      onPress={() => {
                        setNewTimeRule({
                          ...newTimeRule,
                          days: newTimeRule.days.includes(day)
                            ? newTimeRule.days.filter(d => d !== day)
                            : [...newTimeRule.days, day],
                        });
                      }}
                    >
                      <Text style={[styles.dayButtonText, { color: newTimeRule.days.includes(day) ? theme.background : theme.text }]}>{day.slice(0, 3)}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.label, { color: theme.text }]}>Start Time</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                  placeholder="e.g. 9:00 AM"
                  value={newTimeRule.startTime}
                  onChangeText={startTime => setNewTimeRule({ ...newTimeRule, startTime })}
                />
                <Text style={[styles.label, { color: theme.text }]}>End Time</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                  placeholder="e.g. 5:00 PM"
                  value={newTimeRule.endTime}
                  onChangeText={endTime => setNewTimeRule({ ...newTimeRule, endTime })}
                />
                <View style={styles.modalActions}>
                  <Pressable style={[styles.modalButton, { borderColor: theme.border, backgroundColor: theme.tint }]} onPress={() => setShowModal(false)}>
                    <Text style={[styles.modalButtonText, { color: theme.background }]}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[styles.modalButton, { borderColor: theme.border, backgroundColor: theme.tint }]} onPress={editingRule ? handleSaveEdit : handleSubmitTimeRule}>
                    <Text style={[styles.modalButtonText, { color: theme.background }]}>{editingRule ? 'Save' : 'Add'}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{editingRule ? 'Edit Device Rule' : 'New Device Rule'}</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                  placeholder="Device Name"
                  value={newDeviceRule.deviceName}
                  onChangeText={deviceName => setNewDeviceRule({ ...newDeviceRule, deviceName })}
                />
                <Text style={[styles.label, { color: theme.text }]}>Device Type</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                  placeholder="e.g. Smart Speaker"
                  value={newDeviceRule.deviceType}
                  onChangeText={deviceType => setNewDeviceRule({ ...newDeviceRule, deviceType })}
                />
                <View style={styles.modalActions}>
                  <Pressable style={[styles.modalButton, { borderColor: theme.border, backgroundColor: theme.tint }]} onPress={() => setShowModal(false)}>
                    <Text style={[styles.modalButtonText, { color: theme.background }]}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[styles.modalButton, { borderColor: theme.border, backgroundColor: theme.tint }]} onPress={editingRule ? handleSaveEdit : handleSubmitDeviceRule}>
                    <Text style={[styles.modalButtonText, { color: theme.background }]}>{editingRule ? 'Save' : 'Add'}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
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
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabButtonText: {
    fontWeight: 'bold',
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
    bottom: 16,
    left: 16,
    right: 16,
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
  modalContent: {
    padding: 20,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
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
  },
  dayButtonSelected: {},
  dayButtonText: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});