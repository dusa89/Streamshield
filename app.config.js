import "dotenv/config";

export default {
  expo: {
    name: "StreamShield",
    slug: "streamshield",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/StreamShield-logo.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.streamshield.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/StreamShield-logo.png",
        backgroundColor: "#ffffff",
      },
      package: "com.streamshield.app",
    },
    web: {
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-router",
        {
          origin: "https://rork.com/",
        },
      ],
      "expo-background-task"
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: "https://rork.com/",
      },
      eas: {
        projectId: "190afce7-7285-4df1-8af8-ad4600242e30",
      },
      EXPO_PUBLIC_SPOTIFY_CLIENT_ID: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID,
    },
  },
};
