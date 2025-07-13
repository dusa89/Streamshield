import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  useColorScheme,
} from "react-native";
import { themes } from "@/constants/colors";
import { useThemeStore } from "@/stores/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { UserDevice } from "@/types/track";

interface DeviceRuleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (rule: {
    device: UserDevice;
    autoShield: boolean;
    shieldDuration?: number;
    days: string[];
    startTime: string;
    endTime: string;
    timeEnabled: boolean;
  }) => void;
  device: UserDevice | null;
  onSelectDevice: () => void;
  ruleToEdit?: {
    id: string;
    deviceId: string;
    deviceName: string;
    deviceType: string;
    enabled: boolean;
    autoShield: boolean;
    shieldDuration?: number;
    days: string[];
    startTime: string;
    endTime: string;
    timeEnabled: boolean;
    device: UserDevice; // Add the full device object
  } | null;
}

const DeviceRuleModal: React.FC<DeviceRuleModalProps> = ({
  visible,
  onClose,
  onSave,
  device,
  onSelectDevice,
  ruleToEdit,
}) => {
  const [autoShield, setAutoShield] = useState(true);
  const [durationDays, setDurationDays] = useState("0");
  const [durationHours, setDurationHours] = useState("2");
  const [durationMinutes, setDurationMinutes] = useState("0");
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("9:00 AM");
  const [endTime, setEndTime] = useState("5:00 PM");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeField, setTimeField] = useState<"startTime" | "endTime">("startTime");

  const { theme: themeSetting, colorTheme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const effectiveTheme = themeSetting === "auto" ? systemColorScheme ?? "light" : themeSetting;
  const theme = themes[colorTheme][effectiveTheme];

  useEffect(() => {
    if (ruleToEdit) {
      // Pre-fill form for editing
      setAutoShield(ruleToEdit.autoShield);
      if (ruleToEdit.shieldDuration) {
        const totalMinutes = ruleToEdit.shieldDuration;
        const days = Math.floor(totalMinutes / (60 * 24));
        const remainingMinutes = totalMinutes % (60 * 24);
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;
        setDurationDays(days.toString());
        setDurationHours(hours.toString());
        setDurationMinutes(minutes.toString());
      } else {
        setDurationDays("0");
        setDurationHours("0");
        setDurationMinutes("0");
      }
      setTimeEnabled(ruleToEdit.timeEnabled);
      setDays(ruleToEdit.days ?? []);
      setStartTime(ruleToEdit.startTime ?? "09:00 AM");
      setEndTime(ruleToEdit.endTime ?? "05:00 PM");
    } else {
      // Reset form for creating
      setAutoShield(true);
      setDurationDays("0");
      setDurationHours("2");
      setDurationMinutes("0");
      setTimeEnabled(false);
      setDays([]);
      setStartTime("9:00 AM");
      setEndTime("5:00 PM");
    }
  }, [ruleToEdit, visible]);

  useEffect(() => {
    if (!visible) {
      // Reset state when modal is closed
      setAutoShield(true);
      setDurationDays("0");
      setDurationHours("2");
      setDurationMinutes("0");
      setTimeEnabled(false);
      setDays([]);
      setStartTime("9:00 AM");
      setEndTime("5:00 PM");
    }
  }, [visible]);

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const handleDayToggle = (dayIndex: number) => {
    const dayName = fullDayNames[dayIndex];
    const newDays = days.includes(dayName)
      ? days.filter((d) => d !== dayName)
      : [...days, dayName];
    setDays(newDays);
  };

  const showTimePickerFor = (field: "startTime" | "endTime") => {
    setTimeField(field);
    setShowTimePicker(true);
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (event.type === "set" && selectedDate) {
      const formattedTime = selectedDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      if (timeField === "startTime") {
        setStartTime(formattedTime);
      } else {
        setEndTime(formattedTime);
      }
    }
  };

  const handleSave = () => {
    const finalDevice = device ?? ruleToEdit?.device;
    if (!finalDevice) {
      Alert.alert("No Device Selected", "Please select a device first.");
      return;
    }

    if (timeEnabled && days.length === 0) {
      Alert.alert("No Days Selected", "Please select at least one day for time scheduling.");
      return;
    }

    const durationDaysValue = parseInt(durationDays, 10) ?? 0;
    const hours = parseInt(durationHours, 10) ?? 0;
    const minutes = parseInt(durationMinutes, 10) ?? 0;
    const totalShieldDuration = (durationDaysValue * 24 * 60) + (hours * 60) + minutes;

    onSave({
      device: finalDevice,
      autoShield,
      shieldDuration: totalShieldDuration,
      days,
      startTime,
      endTime,
      timeEnabled,
    });
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const dynamicStyles = {
    durationContainer: {
      borderTopColor: theme.border,
    },
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {ruleToEdit ? "Edit Device Rule" : "Add Device Rule"}
          </Text>

          {/* Device Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Device</Text>
            { (device ?? ruleToEdit?.device) ? (
              <View style={[styles.selectedDevice, { backgroundColor: theme.input }]}>
                <FontAwesome
                  name={
                    ((device ?? ruleToEdit!.device).type.toLowerCase() === "computer"
                      ? "laptop"
                      : "mobile") as any
                  }
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.deviceName, { color: theme.text }]}>
                  {(device ?? ruleToEdit!.device).name}
                </Text>
                <Pressable onPress={onSelectDevice}>
                  <FontAwesome name="exchange" size={16} color={theme.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.selectDeviceButton, { backgroundColor: theme.primary }]}
                onPress={onSelectDevice}
              >
                <Text style={[styles.selectDeviceText, { color: theme.card }]}>
                  Select Device
                </Text>
              </Pressable>
            )}
          </View>

          {/* Auto Shield Settings */}
          <View style={styles.section}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Auto Shield</Text>
              <Switch
                value={autoShield}
                onValueChange={setAutoShield}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor={Platform.OS === "ios" ? theme.card : undefined}
              />
            </View>
            {autoShield && (
              <View style={[styles.durationContainer, dynamicStyles.durationContainer]}>
                <Text style={[styles.settingLabel, { color: theme.text, marginBottom: 10 }]}>Shield Duration</Text>
                <View style={styles.timerInputContainer}>
                  <TextInput
                    style={[styles.timerInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.input }]}
                    placeholder="Days"
                    placeholderTextColor={theme.textSecondary}
                    value={durationDays}
                    onChangeText={setDurationDays}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[styles.timerSeparator, { color: theme.text }]}>d</Text>
                  <TextInput
                    style={[styles.timerInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.input }]}
                    placeholder="Hours"
                    placeholderTextColor={theme.textSecondary}
                    value={durationHours}
                    onChangeText={setDurationHours}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[styles.timerSeparator, { color: theme.text }]}>h</Text>
                  <TextInput
                    style={[styles.timerInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.input }]}
                    placeholder="Mins"
                    placeholderTextColor={theme.textSecondary}
                    value={durationMinutes}
                    onChangeText={setDurationMinutes}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[styles.timerSeparator, { color: theme.text }]}>m</Text>
                </View>
                <Text style={[styles.durationHint, { color: theme.textSecondary }]}>
                  (Set to 0d 0h 0m for unlimited)
                </Text>
              </View>
            )}
          </View>

          {/* Time Scheduling */}
          <View style={styles.section}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Time Scheduling</Text>
              <Switch
                value={timeEnabled}
                onValueChange={setTimeEnabled}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor={Platform.OS === "ios" ? theme.card : undefined}
              />
            </View>

            {timeEnabled && (
              <>
                {/* Days Selection */}
                <Text style={[styles.settingLabel, { color: theme.text, marginTop: 15 }]}>Days</Text>
                <View style={styles.daysContainer}>
                  {dayLabels.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayButton,
                        { backgroundColor: theme.background },
                        days.includes(fullDayNames[index]) && { backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: 2 },
                      ]}
                      onPress={() => handleDayToggle(index)}
                    >
                      <Text style={[
                        styles.dayText,
                        { color: theme.textSecondary },
                        days.includes(fullDayNames[index]) && { color: theme.card, fontWeight: "bold" }
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Time Selection */}
                <Text style={[styles.settingLabel, { color: theme.text, marginTop: 15 }]}>Time Range</Text>
                <View style={styles.timeRow}>
                  <Pressable
                    onPress={() => showTimePickerFor("startTime")}
                    style={[styles.timeButton, { backgroundColor: theme.input }]}
                  >
                    <Text style={{ color: theme.text }}>{startTime}</Text>
                  </Pressable>
                  <Text style={{ color: theme.text, marginHorizontal: 10 }}>to</Text>
                  <Pressable
                    onPress={() => showTimePickerFor("endTime")}
                    style={[styles.timeButton, { backgroundColor: theme.input }]}
                  >
                    <Text style={{ color: theme.text }}>{endTime}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>

          {showTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onTimeChange}
            />
          )}

          {/* Actions */}
          <View style={styles.modalActions}>
            <Pressable onPress={handleClose} style={[styles.modalButton, { backgroundColor: theme.background }]}>
              <Text style={{ color: theme.text }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={[styles.modalButton, { backgroundColor: theme.primary }]}>
              <Text style={{ color: theme.card }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  selectedDevice: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  deviceName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  selectDeviceButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  selectDeviceText: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  durationContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
  },
  timerInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timerInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: "center",
    flex: 1,
  },
  timerSeparator: {
    fontSize: 16,
    fontWeight: "bold",
  },
  durationHint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "right",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
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
    marginTop: 10,
  },
  timeButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
});

export default DeviceRuleModal; 