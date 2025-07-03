import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface TimeRule {
  id: string;
  name: string;
  days: string[];
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface DeviceRule {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  enabled: boolean;
}

interface RulesState {
  timeRules: TimeRule[];
  deviceRules: DeviceRule[];
  toggleTimeRule: (id: string) => void;
  toggleDeviceRule: (id: string) => void;
  removeTimeRule: (id: string) => void;
  removeDeviceRule: (id: string) => void;
  addTimeRule: (rule: TimeRule) => void;
  addDeviceRule: (rule: DeviceRule) => void;
  editTimeRule: (id: string, updated: Partial<TimeRule>) => void;
  editDeviceRule: (id: string, updated: Partial<DeviceRule>) => void;
}

export const useRulesStore = create<RulesState>()(
  persist(
    (set) => ({
      timeRules: [
        {
          id: "time1",
          name: "Work Focus",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          startTime: "9:00 AM",
          endTime: "5:00 PM",
          enabled: true,
        },
        {
          id: "time2",
          name: "Family Time",
          days: ["Saturday", "Sunday"],
          startTime: "10:00 AM",
          endTime: "8:00 PM",
          enabled: false,
        },
      ],
      deviceRules: [
        {
          id: "device1",
          deviceId: "device123",
          deviceName: "Living Room Speaker",
          deviceType: "Smart Speaker",
          enabled: true,
        },
        {
          id: "device2",
          deviceId: "device456",
          deviceName: "Kitchen Echo",
          deviceType: "Smart Speaker",
          enabled: false,
        },
      ],
      toggleTimeRule: (id) => 
        set((state) => ({
          timeRules: state.timeRules.map(rule => 
            rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
          )
        })),
      toggleDeviceRule: (id) => 
        set((state) => ({
          deviceRules: state.deviceRules.map(rule => 
            rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
          )
        })),
      removeTimeRule: (id) => 
        set((state) => ({
          timeRules: state.timeRules.filter(rule => rule.id !== id)
        })),
      removeDeviceRule: (id) => 
        set((state) => ({
          deviceRules: state.deviceRules.filter(rule => rule.id !== id)
        })),
      addTimeRule: (rule) =>
        set((state) => ({
          timeRules: [...state.timeRules, rule],
        })),
      addDeviceRule: (rule) =>
        set((state) => ({
          deviceRules: [...state.deviceRules, rule],
        })),
      editTimeRule: (id, updated) =>
        set((state) => ({
          timeRules: state.timeRules.map(rule => rule.id === id ? { ...rule, ...updated } : rule)
        })),
      editDeviceRule: (id, updated) =>
        set((state) => ({
          deviceRules: state.deviceRules.map(rule => rule.id === id ? { ...rule, ...updated } : rule)
        })),
    }),
    {
      name: "rules-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);