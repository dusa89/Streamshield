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
} from "react-native";
import { useShieldStore } from "@/stores/shield";
import { useThemeStore } from "@/stores/theme";
import { themes } from "@/constants/colors";
import { createStyles } from "@/styles/shieldScreen";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Stack } from "expo-router";

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
    const durationInMinutes = unit === 'hr' ? parseInt(customDuration, 10) * 60 : parseInt(customDuration, 10);
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
              <Text style={{color: theme.text}}>Current Duration: {shieldDuration === 0 ? 'Always On' : `${shieldDuration} minutes`}</Text>
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
                )})}
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
                <View style={{flexDirection: 'row', alignItems: 'center', marginHorizontal: 8}}>
                    <Pressable onPress={() => setUnit('min')} style={{padding: 8, backgroundColor: unit === 'min' ? theme.primary : theme.card, borderRadius: 8}}>
                        <Text style={{color: unit === 'min' ? theme.onPrimary : theme.text}}>Min</Text>
                    </Pressable>
                    <Pressable onPress={() => setUnit('hr')} style={{padding: 8, backgroundColor: unit === 'hr' ? theme.primary : theme.card, borderRadius: 8, marginLeft: 8}}>
                        <Text style={{color: unit === 'hr' ? theme.onPrimary : theme.text}}>Hr</Text>
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
    </ScrollView>
  );
} 