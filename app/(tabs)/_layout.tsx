import React from "react";
import { Tabs } from "expo-router";
import { useColorScheme, Platform } from "react-native";
import { useThemeStore } from "@/stores/theme";
import { themes } from "@/constants/colors";
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme, isHydrating } = useThemeStore();
  const insets = useSafeAreaInsets();
  
  // Add defensive programming for theme initialization
  if (isHydrating || !themePref) {
    // Return a minimal layout while theme is loading
    const defaultTheme = themes.pastelCitrus.light;
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: defaultTheme.tint,
          tabBarInactiveTintColor: defaultTheme.tabIconDefault,
          tabBarStyle: {
            backgroundColor: defaultTheme.background,
            height: 56 + insets.bottom,
            paddingTop: 18,
            paddingBottom: insets.bottom + 8,
            elevation: 0,
            shadowOpacity: 0,
            shadowColor: 'transparent',
            borderTopWidth: 0,
          },
          tabBarLabelStyle: {
            fontWeight: '600',
            fontSize: 13,
            marginBottom: 2,
          },
          tabBarItemStyle: {
            marginHorizontal: 8,
            borderRadius: 12,
            paddingVertical: 6,
            paddingHorizontal: 0,
          },
          headerStyle: {
            backgroundColor: defaultTheme.background,
          },
          headerTintColor: defaultTheme.text,
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Shield",
            tabBarIcon: ({ color, focused }) => <Feather name="shield" size={22} color={color} style={{ opacity: focused ? 1 : 0.7 }} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarIcon: ({ color, focused }) => <Feather name="bar-chart-2" size={22} color={color} style={{ opacity: focused ? 1 : 0.7 }} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color, focused }) => <Feather name="clock" size={22} color={color} style={{ opacity: focused ? 1 : 0.7 }} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, focused }) => <Feather name="settings" size={22} color={color} style={{ opacity: focused ? 1 : 0.7 }} />,
          }}
        />
      </Tabs>
    );
  }

  const effectiveTheme = themePref === "auto" ? colorScheme ?? "light" : themePref;
  // Fallback: if colorTheme is not in themes, use 'pastelCitrus'
  const themeSet = themes[colorTheme] || themes.pastelCitrus;
  const theme = themeSet[effectiveTheme] || themes.pastelCitrus[effectiveTheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.background,
          height: 84 + insets.bottom,
          paddingTop: 20,
          paddingBottom: insets.bottom + 20,
          elevation: 0,
          shadowOpacity: 0,
          shadowColor: 'transparent',
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 13,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          marginHorizontal: 8,
          borderRadius: 12,
          paddingVertical: 6,
          paddingHorizontal: 0,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Shield",
          tabBarIcon: ({ color, focused }) => <Feather name="shield" size={18} color={color} style={{ opacity: focused ? 1 : 0.7 }} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, focused }) => <Feather name="bar-chart-2" size={18} color={color} style={{ opacity: focused ? 1 : 0.7 }} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, focused }) => <Feather name="clock" size={18} color={color} style={{ opacity: focused ? 1 : 0.7 }} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => <Feather name="settings" size={18} color={color} style={{ opacity: focused ? 1 : 0.7 }} />,
        }}
      />
    </Tabs>
  );
}