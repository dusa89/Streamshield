import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";

interface SuccessToastProps {
  visible: boolean;
  message?: string;
  onHide: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ 
  visible, 
  message = "Success", 
  onHide 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (visible) {
      // Fade in and slide up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 2 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.toast}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// Add error variant
export const ErrorToast = ({ message }) => (
  <View style={{ backgroundColor: 'red' }}>
    <Text>{message}</Text>
  </View>
);
// Usage example: ErrorToast({ message: 'Token expired - reconnecting...' });

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    backgroundColor: "rgba(34, 197, 94, 0.9)", // Green with transparency
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 0, // Borderless as requested
  },
  text: {
    color: "rgba(255, 255, 255, 0.9)", // Slightly transparent white
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
}); 