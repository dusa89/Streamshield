import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  useColorScheme,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { themes } from "@/constants/colors";
import { useThemeStore } from "@/stores/theme";
import { useRulesStore } from "@/stores/rules";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import DeviceSelector from "@/components/DeviceSelector";
import DeviceRuleModal from "@/components/DeviceRuleModal";
import { UserDevice } from "@/types/track";

// Define more specific types for the rules from the store
type TimeRule = ReturnType<typeof useRulesStore.getState>["timeRules"][0];
type DeviceRule = ReturnType<typeof useRulesStore.getState>["deviceRules"][0];

export default function RulesScreen() {
  const {
    timeRules,
    deviceRules,
    toggleTimeRule,
    toggleDeviceRule,
    removeTimeRule,
    removeDeviceRule,
    addTimeRule,
    addDeviceRule,
    editTimeRule,
    editDeviceRule,
  } = useRulesStore();

  const [activeTab, setActiveTab] = useState("Time");
  const [isModalVisible, setModalVisible] = useState(false);
  const [isDeviceSelectorVisible, setDeviceSelectorVisible] = useState(false);
  const [isDeviceRuleModalVisible, setDeviceRuleModalVisible] = useState(false);
  const [selectedDeviceForRule, setSelectedDeviceForRule] = useState<UserDevice | null>(null);
  const [editingTimeRule, setEditingTimeRule] = useState<TimeRule | null>(null);
  const [editingDeviceRule, setEditingDeviceRule] = useState<DeviceRule | null>(null);

  // State for the new time rule form
  const [newTimeRule, setNewTimeRule] = useState({
    name: "",
    days: [] as string[],
    startTime: "09:00 AM",
    endTime: "05:00 PM",
  });
  
  const [datePicker, setDatePicker] = useState({
    show: false,
    field: "startTime" as "startTime" | "endTime",
  });

  const { theme: themePref, colorTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  const theme = themes[colorTheme][effectiveTheme];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // We are using a custom header
    });
  }, [navigation]);

  const handleOpenModal = (rule: TimeRule | DeviceRule | null = null, type: "Time" | "Device" | null = null) => {
    const tab = type ?? activeTab;
    if (tab === "Time") {
      const ruleToEdit = rule as TimeRule | null;
      setEditingTimeRule(ruleToEdit);
      setNewTimeRule({
        name: ruleToEdit?.name ?? "",
        days: ruleToEdit?.days ?? [],
        startTime: ruleToEdit?.startTime ?? "09:00 AM",
        endTime: ruleToEdit?.endTime ?? "05:00 PM",
      });
      setModalVisible(true);
    } else {
      const ruleToEdit = rule as DeviceRule | null;
      setEditingDeviceRule(ruleToEdit);
      setSelectedDeviceForRule(ruleToEdit?.device ?? null);
      setDeviceRuleModalVisible(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCloseDeviceRuleModal = () => {
    setDeviceRuleModalVisible(false);
    setSelectedDeviceForRule(null);
    setEditingDeviceRule(null);
  };

  const handleOpenDeviceSelector = () => {
    setDeviceRuleModalVisible(false);
    setDeviceSelectorVisible(true);
  };

  const showDatePicker = (field: "startTime" | "endTime") => {
    setDatePicker({ show: true, field });
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setDatePicker({ ...datePicker, show: false });
    if (event.type === "set" && selectedDate) {
      const formattedTime = selectedDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      setNewTimeRule({ ...newTimeRule, [datePicker.field]: formattedTime });
    }
  };

  const handleDayToggle = (day: string) => {
    const days = newTimeRule.days.includes(day)
      ? newTimeRule.days.filter((d) => d !== day)
      : [...newTimeRule.days, day];
    setNewTimeRule({ ...newTimeRule, days });
  };

  const handleSaveTimeRule = () => {
    if (!newTimeRule.name || newTimeRule.days.length === 0) {
      Alert.alert("Missing Info", "Please provide a name and select at least one day.");
      return;
    }
    if (editingTimeRule) {
      editTimeRule(editingTimeRule.id, { ...editingTimeRule, ...newTimeRule });
    } else {
      addTimeRule({ ...newTimeRule, id: `time_${Date.now()}`, enabled: true });
    }
    setModalVisible(false);
    setEditingTimeRule(null);
  };

  const handleSaveDeviceRule = (ruleData: {
    device: UserDevice;
    autoShield: boolean;
    shieldDuration?: number;
    days: string[];
    startTime: string;
    endTime: string;
    timeEnabled: boolean;
  }) => {
    if (!ruleData.device.id) {
      Alert.alert("Invalid Device", "The selected device does not have a valid ID.");
      return;
    }
    
    const newRule = {
      id: editingDeviceRule?.id ?? `device_${ruleData.device.id}`,
      deviceId: ruleData.device.id,
      deviceName: ruleData.device.name,
      deviceType: ruleData.device.type,
      enabled: true,
      autoShield: ruleData.autoShield,
      shieldDuration: ruleData.shieldDuration,
      days: ruleData.days,
      startTime: ruleData.startTime,
      endTime: ruleData.endTime,
      timeEnabled: ruleData.timeEnabled,
      device: ruleData.device,
    };
    
    if (editingDeviceRule) {
      editDeviceRule(editingDeviceRule.id, newRule);
    } else {
      addDeviceRule(newRule as DeviceRule);
    }
    handleCloseDeviceRuleModal();
  };

  const handleDeviceSelection = (device: UserDevice) => {
    if (device.id) {
      setSelectedDeviceForRule(device);
      setDeviceSelectorVisible(false);
      setDeviceRuleModalVisible(true);
    }
  };

  const renderTimeRuleModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Add Time Rule</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.input }]}
            placeholder="Rule Name (e.g., Work Hours)"
            placeholderTextColor={theme.textSecondary}
            value={newTimeRule.name}
            onChangeText={(name) => setNewTimeRule({ ...newTimeRule, name })}
          />
          <View style={styles.daysContainer}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  { backgroundColor: theme.background },
                  newTimeRule.days.includes(day) && { backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: 2 },
                ]}
                onPress={() => handleDayToggle(day)}
              >
                <Text style={[ styles.dayText, { color: theme.textSecondary }, newTimeRule.days.includes(day) && { color: theme.card, fontWeight: "bold" } ]}>
                  {day}
          </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.timeRow}>
            <Pressable onPress={() => showDatePicker("startTime")} style={[styles.timeButton, { backgroundColor: theme.input }]}>
              <Text style={{ color: theme.text }}>{newTimeRule.startTime}</Text>
            </Pressable>
            <Text style={{ color: theme.text, marginHorizontal: 10 }}>to</Text>
            <Pressable onPress={() => showDatePicker("endTime")} style={[styles.timeButton, { backgroundColor: theme.input }]}>
              <Text style={{ color: theme.text }}>{newTimeRule.endTime}</Text>
            </Pressable>
        </View>

          {datePicker.show && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
            />
          )}

          <View style={styles.modalActions}>
            <Pressable onPress={() => setModalVisible(false)} style={[styles.modalButton, { backgroundColor: theme.background }]}>
              <Text style={{ color: theme.text }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSaveTimeRule} style={[styles.modalButton, { backgroundColor: theme.primary }]}>
              <Text style={{ color: theme.card }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  const formatDeviceRuleDetails = (rule: any) => {
    let details = rule.deviceType;
    if (rule.timeEnabled && rule.days.length > 0) {
      const dayAbbrevs = rule.days.map((day: string) => day.substring(0, 3)).join(", ");
      details += ` - ${dayAbbrevs} ${rule.startTime}-${rule.endTime}`;
    }
    if (rule.autoShield && rule.shieldDuration) {
      details += ` - Auto-shield ${rule.shieldDuration}min`;
    } else if (rule.autoShield) {
      details += " - Auto-shield unlimited";
    }
    return details;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Rules</Text>
        <Pressable onPress={() => handleOpenModal()}>
          <FontAwesome name="plus" size={22} color={theme.primary} />
        </Pressable>
      </View>

      <View style={styles.tabContainer}>
        {["Time", "Device"].map((tab) => (
          <Pressable
            key={tab}
            style={[ styles.tab, activeTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.primary : theme.textSecondary }]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.rulesList}>
        {activeTab === "Time" &&
          (timeRules.length > 0 ? (
            timeRules.map((rule) => (
              <View key={rule.id} style={[styles.ruleItem, { backgroundColor: theme.card }]}>
                <View style={styles.ruleInfo}>
                  <Text style={[styles.ruleName, { color: theme.text }]}>{rule.name}</Text>
                  <Text style={[styles.ruleDetails, { color: theme.textSecondary }]}>
                    {rule.days.join(", ")} | {rule.startTime} - {rule.endTime}
            </Text>
          </View>
                <View style={styles.ruleActions}>
                  <Switch value={rule.enabled} onValueChange={() => toggleTimeRule(rule.id)} trackColor={{ false: "#767577", true: theme.primary }} thumbColor={Platform.OS === "ios" ? theme.card : undefined} />
                  <Pressable onPress={() => handleOpenModal(rule, "Time")} style={{ marginLeft: 15 }}>
                    <FontAwesome name="pencil" size={20} color={theme.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => removeTimeRule(rule.id)} style={{ marginLeft: 15 }}>
                    <FontAwesome name="trash-o" size={24} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No time rules created.</Text>
          ))}

        {activeTab === "Device" &&
          (deviceRules.length > 0 ? (
            deviceRules.map((rule) => (
              <View key={rule.id} style={[styles.ruleItem, { backgroundColor: theme.card }]}>
                <FontAwesome
                  name={ (rule.deviceType.toLowerCase() === "computer" ? "laptop" : "mobile") as any }
                  size={24} color={theme.textSecondary} style={{marginRight: 15}}/>
                  <View style={styles.ruleInfo}>
                  <Text style={[styles.ruleName, { color: theme.text }]}>{rule.deviceName}</Text>
                  <Text style={[styles.ruleDetails, { color: theme.textSecondary }]}>
                    {formatDeviceRuleDetails(rule)}
                    </Text>
                </View>
                <View style={styles.ruleActions}>
                  <Switch value={rule.enabled} onValueChange={() => toggleDeviceRule(rule.id)} trackColor={{ false: "#767577", true: theme.primary }} thumbColor={Platform.OS === "ios" ? theme.card : undefined} />
                  <Pressable onPress={() => handleOpenModal(rule, "Device")} style={{ marginLeft: 15 }}>
                    <FontAwesome name="pencil" size={20} color={theme.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => removeDeviceRule(rule.id)} style={{ marginLeft: 15 }}>
                    <FontAwesome name="trash-o" size={24} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No device rules created.</Text>
          ))}
      </ScrollView>

      {renderTimeRuleModal()}

      <DeviceRuleModal
        visible={isDeviceRuleModalVisible}
        onClose={handleCloseDeviceRuleModal}
        onSave={handleSaveDeviceRule}
        device={selectedDeviceForRule}
        onSelectDevice={handleOpenDeviceSelector}
        ruleToEdit={editingDeviceRule}
      />

      {isDeviceSelectorVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isDeviceSelectorVisible}
          onRequestClose={() => setDeviceSelectorVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
             <DeviceSelector onDeviceSelect={handleDeviceSelection} onClose={() => setDeviceSelectorVisible(false)} />
            </View>
        </Modal>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tab: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  rulesList: {
    padding: 20,
    gap: 10,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  ruleName: {
    fontSize: 16,
    fontWeight: "600",
  },
  ruleDetails: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayText: {
    fontSize: 16,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  timeButton: {
    padding: 12,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
}); 
