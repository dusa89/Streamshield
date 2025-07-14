import React, { useState } from "react";
import {
  View,
  Text,
  Switch,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  Alert,
  Platform,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useShieldStore } from "@/stores/shield";
import { useThemeStore } from "@/stores/theme";
import { themes } from "@/constants/colors";
import { createStyles } from "@/styles/shieldScreen";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Stack } from "expo-router";
import { useRulesStore } from "@/stores/rules";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import DeviceSelector from "@/components/DeviceSelector";
import DeviceRuleModal from "@/components/DeviceRuleModal";
import { UserDevice } from "@/types/track";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";

export default function ShieldSettingsScreen() {
  const {
    shieldDuration,
    setShieldDuration,
    isAutoDisableEnabled,
    setIsAutoDisableEnabled,
    autoDisablePresets,
    addAutoDisablePreset,
    deleteAutoDisablePreset,
  } = useShieldStore();
  
  const { theme: themePref, colorTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  const effectiveTheme = themePref === "auto" ? (colorScheme ?? "light") : themePref;
  const theme = themes[colorTheme][effectiveTheme] || themes.pastelCitrus.light;
  const styles = createStyles(theme);

  const [customDuration, setCustomDuration] = useState("");
  const [isCustomInputVisible, setIsCustomInputVisible] = useState(false);
  const [unit, setUnit] = useState<"min" | "hr">("min");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSelectDuration = (duration: number) => {
    if (duration === -1) {
      setIsCustomInputVisible(true);
    } else {
      setShieldDuration(duration);
    }
    setIsDropdownOpen(false);
  };
  
  const handleAddCustomPreset = () => {
    const durationInMinutes = unit === "hr" ? parseInt(customDuration, 10) * 60 : parseInt(customDuration, 10);
    if (!isNaN(durationInMinutes) && durationInMinutes > 0) {
      addAutoDisablePreset(durationInMinutes);
      setCustomDuration("");
      setIsCustomInputVisible(false);
    } else {
      Alert.alert("Invalid Input", "Please enter a valid positive number for the duration.");
    }
  };

  const defaultMinutePresets = [10, 15, 30, 45];
  const defaultHourPresets = [1, 2, 4, 6, 8, 24];

  // --- RULES SECTION START ---
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
  const [editingTimeRule, setEditingTimeRule] = useState<any>(null);
  const [editingDeviceRule, setEditingDeviceRule] = useState<any>(null);
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
  // --- RULES SECTION END ---

  // --- RULES MODAL LOGIC START ---
  const handleOpenModal = (rule = null, type = null) => {
    const tab = type ?? activeTab;
    if (tab === "Time") {
      const ruleToEdit = rule;
      setEditingTimeRule(ruleToEdit);
      setNewTimeRule({
        name: ruleToEdit?.name ?? "",
        days: ruleToEdit?.days ?? [],
        startTime: ruleToEdit?.startTime ?? "09:00 AM",
        endTime: ruleToEdit?.endTime ?? "05:00 PM",
      });
      setModalVisible(true);
    } else {
      const ruleToEdit = rule;
      setEditingDeviceRule(ruleToEdit);
      setSelectedDeviceForRule(ruleToEdit?.device ?? null);
      setDeviceRuleModalVisible(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const handleSaveDeviceRule = (ruleData) => {
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
      addDeviceRule(newRule);
    }
    setDeviceRuleModalVisible(false);
    setSelectedDeviceForRule(null);
    setEditingDeviceRule(null);
  };

  const handleDeviceSelection = (device) => {
    if (device.id) {
      setSelectedDeviceForRule(device);
      setIsDeviceSelectorVisible(false);
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View style={{ width: "90%", borderRadius: 10, padding: 20, backgroundColor: theme.card }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: theme.text }}>Add Time Rule</Text>
          <TextInput
            style={{ borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, color: theme.text, borderColor: theme.border, backgroundColor: theme.input }}
            placeholder="Rule Name (e.g., Work Hours)"
            placeholderTextColor={theme.textSecondary}
            value={newTimeRule.name}
            onChangeText={(name) => setNewTimeRule({ ...newTimeRule, name })}
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <TouchableOpacity
                key={index}
                style={{ width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: newTimeRule.days.includes(day) ? theme.primary : "transparent", backgroundColor: newTimeRule.days.includes(day) ? theme.primary : theme.background }}
                onPress={() => {
                  const days = newTimeRule.days.includes(day)
                    ? newTimeRule.days.filter((d) => d !== day)
                    : [...newTimeRule.days, day];
                  setNewTimeRule({ ...newTimeRule, days });
                }}
              >
                <Text style={{ color: newTimeRule.days.includes(day) ? theme.card : theme.textSecondary, fontWeight: newTimeRule.days.includes(day) ? "bold" : "normal" }}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 20 }}>
            <Pressable onPress={() => setDatePicker({ show: true, field: "startTime" })} style={{ padding: 12, borderRadius: 8, backgroundColor: theme.input }}>
              <Text style={{ color: theme.text }}>{newTimeRule.startTime}</Text>
            </Pressable>
            <Text style={{ color: theme.text, marginHorizontal: 10 }}>to</Text>
            <Pressable onPress={() => setDatePicker({ show: true, field: "endTime" })} style={{ padding: 12, borderRadius: 8, backgroundColor: theme.input }}>
              <Text style={{ color: theme.text }}>{newTimeRule.endTime}</Text>
            </Pressable>
          </View>
          {datePicker.show && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setDatePicker({ ...datePicker, show: false });
                if (event.type === "set" && selectedDate) {
                  const formattedTime = selectedDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });
                  setNewTimeRule({ ...newTimeRule, [datePicker.field]: formattedTime });
                }
              }}
            />
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 10 }}>
            <Pressable onPress={() => setModalVisible(false)} style={{ paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8, backgroundColor: theme.background }}>
              <Text style={{ color: theme.text }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSaveTimeRule} style={{ paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8, backgroundColor: theme.primary }}>
              <Text style={{ color: theme.card }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
  // --- RULES MODAL LOGIC END ---

  return (
    <ScrollView style={[styles.safeArea, {backgroundColor: theme.background}]}>
      <Stack.Screen options={{ title: "Shield Settings" }} />
      <View style={[styles.timerContainer, { borderColor: theme.border, marginHorizontal: 16, marginTop: 16 }]}>
        <View style={styles.timerHeader}>
          <MaterialCommunityIcons name="timer-outline" size={24} color={theme.text} />
          <Text style={[styles.timerTitle, { color: theme.text }]}>
            Auto-disable shield
          </Text>
          <Switch
            value={isAutoDisableEnabled}
            onValueChange={setIsAutoDisableEnabled}
            style={styles.switch}
            trackColor={{ false: theme.subtext, true: theme.primary }}
            thumbColor={isAutoDisableEnabled ? theme.tint : theme.background}
          />
        </View>
        {isAutoDisableEnabled && (
          <>
            <Pressable onPress={() => setIsDropdownOpen(!isDropdownOpen)} style={{ marginTop: 16 }}>
              <Text style={{color: theme.text}}>Current Duration: {shieldDuration === 0 ? "Always On" : `${shieldDuration} minutes`}</Text>
            </Pressable>

            {isDropdownOpen && (
              <View style={styles.timerOptions}>
                 <Pressable style={[styles.timerOption, {borderColor: theme.border}]} onPress={() => handleSelectDuration(0)}>
                    <Text style={[styles.timerOptionText, {color: theme.text}]}>Always On</Text>
                  </Pressable>
                {defaultMinutePresets.map((p) => (
                  <Pressable key={`min-${p}`} style={[styles.timerOption, {borderColor: theme.border}]} onPress={() => handleSelectDuration(p)}>
                    <Text style={[styles.timerOptionText, {color: theme.text}]}>{p} min</Text>
                  </Pressable>
                ))}
                {defaultHourPresets.map((p) => (
                  <Pressable key={`hr-${p}`} style={[styles.timerOption, {borderColor: theme.border}]} onPress={() => handleSelectDuration(p * 60)}>
                    <Text style={[styles.timerOptionText, {color: theme.text}]}>{p} hr</Text>
                  </Pressable>
                ))}
                {autoDisablePresets.map((p) => {
                    if (defaultMinutePresets.includes(p) || defaultHourPresets.includes(p/60)) return null;
                    return (
                    <View key={`custom-${p}`} style={styles.timerOptionWrapper}>
                        <Pressable style={[styles.timerOption, {borderColor: theme.border}]} onPress={() => handleSelectDuration(p)}>
                            <Text style={[styles.timerOptionText, {color: theme.text}]}>{p % 60 === 0 ? `${p/60} hr` : `${p} min`}</Text>
                        </Pressable>
                        <Pressable style={styles.deleteButton} onPress={() => deleteAutoDisablePreset(p)}>
                            <MaterialCommunityIcons name="close-circle" size={20} color={theme.subtext} />
                        </Pressable>
                    </View>
                );})}
              </View>
            )}
            
            <Pressable style={[styles.showCustomButton, {borderColor: theme.border}]} onPress={() => setIsCustomInputVisible(!isCustomInputVisible)}>
                 <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.text} />
                 <Text style={[styles.showCustomButtonText, {color: theme.text}]}>Add Custom Time</Text>
            </Pressable>

            {isCustomInputVisible && (
              <View style={styles.customTimerContainer}>
                <TextInput
                  style={[styles.customTimerInput, {borderColor: theme.border, color: theme.text}]}
                  value={customDuration}
                  onChangeText={setCustomDuration}
                  keyboardType="numeric"
                  placeholder="e.g., 50"
                  placeholderTextColor={theme.subtext}
                />
                <View style={{flexDirection: "row", alignItems: "center", marginHorizontal: 8}}>
                    <Pressable onPress={() => setUnit("min")} style={{padding: 8, backgroundColor: unit === "min" ? theme.primary : theme.card, borderRadius: 8}}>
                        <Text style={{color: unit === "min" ? theme.onPrimary : theme.text}}>Min</Text>
                    </Pressable>
                    <Pressable onPress={() => setUnit("hr")} style={{padding: 8, backgroundColor: unit === "hr" ? theme.primary : theme.card, borderRadius: 8, marginLeft: 8}}>
                        <Text style={{color: unit === "hr" ? theme.onPrimary : theme.text}}>Hr</Text>
                    </Pressable>
                </View>
                <Pressable style={[styles.addButton, {backgroundColor: theme.primary}]} onPress={handleAddCustomPreset}>
                  <Text style={[styles.addButtonText, {color: theme.onPrimary}]}>Add</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>
      <View style={{ marginTop: 32, marginHorizontal: 16 }}>
        <Text style={[styles.timerTitle, { color: theme.text, fontSize: 18, marginBottom: 8 }]}>Shielding Rules</Text>
        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          <Pressable onPress={() => setActiveTab("Time")}
            style={{ marginRight: 16, borderBottomWidth: activeTab === "Time" ? 2 : 0, borderColor: theme.primary }}>
            <Text style={{ color: theme.text, fontWeight: activeTab === "Time" ? "bold" : "normal" }}>Time Rules</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab("Device")}
            style={{ borderBottomWidth: activeTab === "Device" ? 2 : 0, borderColor: theme.primary }}>
            <Text style={{ color: theme.text, fontWeight: activeTab === "Device" ? "bold" : "normal" }}>Device Rules</Text>
          </Pressable>
        </View>
        {/* Time Rules List */}
        {activeTab === "Time" && (
          <View>
            {timeRules.length === 0 ? (
              <Text style={{ color: theme.subtext, marginBottom: 8 }}>No time rules set.</Text>
            ) : (
              timeRules.map((rule) => (
                <View key={rule.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, backgroundColor: theme.card, borderRadius: 8, padding: 8 }}>
                  <Text style={{ color: theme.text, flex: 1 }}>{rule.name}</Text>
                  <Switch value={rule.enabled} onValueChange={() => toggleTimeRule(rule.id)} />
                  <Pressable onPress={() => handleOpenModal(rule, "Time")} style={{ marginLeft: 8 }}>
                    <FontAwesome name="edit" size={18} color={theme.primary} />
                  </Pressable>
                  <Pressable onPress={() => removeTimeRule(rule.id)} style={{ marginLeft: 8 }}>
                    <FontAwesome name="trash" size={18} color={theme.error || "#e74c3c"} />
                  </Pressable>
                </View>
              ))
            )}
            <Pressable onPress={() => handleOpenModal(null, "Time")} style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}>
              <FontAwesome name="plus-circle" size={20} color={theme.primary} />
              <Text style={{ color: theme.primary, marginLeft: 6 }}>Add Time Rule</Text>
            </Pressable>
          </View>
        )}
        {/* Device Rules List */}
        {activeTab === "Device" && (
          <View>
            {deviceRules.length === 0 ? (
              <Text style={{ color: theme.subtext, marginBottom: 8 }}>No device rules set.</Text>
            ) : (
              deviceRules.map((rule) => (
                <View key={rule.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, backgroundColor: theme.card, borderRadius: 8, padding: 8 }}>
                  <Text style={{ color: theme.text, flex: 1 }}>{rule.deviceName}</Text>
                  <Switch value={rule.enabled} onValueChange={() => toggleDeviceRule(rule.id)} />
                  <Pressable onPress={() => handleOpenModal(rule, "Device")} style={{ marginLeft: 8 }}>
                    <FontAwesome name="edit" size={18} color={theme.primary} />
                  </Pressable>
                  <Pressable onPress={() => removeDeviceRule(rule.id)} style={{ marginLeft: 8 }}>
                    <FontAwesome name="trash" size={18} color={theme.error || "#e74c3c"} />
                  </Pressable>
                </View>
              ))
            )}
            <Pressable onPress={() => handleOpenModal(null, "Device")} style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}>
              <FontAwesome name="plus-circle" size={20} color={theme.primary} />
              <Text style={{ color: theme.primary, marginLeft: 6 }}>Add Device Rule</Text>
            </Pressable>
          </View>
        )}
      </View>
      {renderTimeRuleModal()}
      <DeviceRuleModal
        visible={isDeviceRuleModalVisible}
        onClose={() => { setDeviceRuleModalVisible(false); setEditingDeviceRule(null); setSelectedDeviceForRule(null); }}
        onSave={handleSaveDeviceRule}
        device={selectedDeviceForRule}
        onSelectDevice={() => setIsDeviceSelectorVisible(true)}
        ruleToEdit={editingDeviceRule}
      />
      {isDeviceSelectorVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isDeviceSelectorVisible}
          onRequestClose={() => setIsDeviceSelectorVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <DeviceSelector onDeviceSelect={handleDeviceSelection} onClose={() => setIsDeviceSelectorVisible(false)} />
          </View>
        </Modal>
      )}
    </ScrollView>
  );
} 