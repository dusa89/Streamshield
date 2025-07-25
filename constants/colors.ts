// Color theme definitions for StreamShield

// 1. Charcoal & Gold (original)
const charcoalGold = {
  light: {
    text: "#191414",
    background: "#F5F5F5",
    tint: "#D4AF37",
    tabIconDefault: "#A9A9A9",
    tabIconSelected: "#D4AF37",
    border: "rgba(41, 41, 41, 0.1)",
    gradient: ["#F5F5F5", "#E5E5E5"],
    red: "#D32F2F",
    card: "#FFFFFF",
    input: "#F0F0F0",
    textSecondary: "#666666",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#FFFFFF",
    primary: "#D4AF37",
    secondary: "#A9A9A9",
    error: "#D32F2F",
    primaryLight: "#E6C866",
    icon: "#2E2E2E",
    primaryGradient: "#E6C866",
    onPrimary: "#FFFFFF",
    shield: {
      active: ["#D4AF37", "#B89B3D"],
      inactive: ["#E0E0E0", "#BDBDBD"],
      iconActive: "#FFFFFF",
      iconInactive: "#424242",
      glow: ["#D4AF37", "transparent"],
    },
  },
  dark: {
    text: "#FFFFFF",
    background: "#121212",
    tint: "#D4AF37",
    tabIconDefault: "#A9A9A9",
    tabIconSelected: "#D4AF37",
    border: "rgba(255, 255, 255, 0.1)",
    gradient: ["#232323", "#191414"],
    red: "#F44336",
    card: "#232323",
    input: "#191919",
    textSecondary: "#AAAAAA",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#232323",
    primary: "#D4AF37",
    secondary: "#A9A9A9",
    error: "#F44336",
    primaryLight: "#E6C866",
    icon: "#FFFFFF",
    primaryGradient: "#E6C866",
    onPrimary: "#FFFFFF",
    shield: {
      active: ["#D4AF37", "#B89B3D"],
      inactive: ["#424242", "#212121"],
      iconActive: "#FFFFFF",
      iconInactive: "#BDBDBD",
      glow: ["#D4AF37", "transparent"],
    },
  },
};

// 2. Pastel Citrus (current)
const pastelCitrus = {
  light: {
    text: "#23201d",
    background: "#F8F8F8",
    tint: "#A2D5F2",
    tabIconDefault: "#D4C1EC",
    tabIconSelected: "#FFF6B7",
    border: "#FFD6C0",
    gradient: ["#F8F8F8", "#D4C1EC"],
    red: "#E57373",
    card: "#FFFFFF",
    input: "#F0F0F0",
    textSecondary: "#666666",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#FFFFFF",
    primary: "#A2D5F2",
    secondary: "#D4C1EC",
    error: "#E57373",
    primaryLight: "#B8E0F5",
    icon: "#23201d",
    primaryGradient: "#B8E0F5",
    onPrimary: "#FFFFFF",
    shield: {
      active: ["#A2D5F2", "#87C0D9"],
      inactive: ["#E0E0E0", "#BDBDBD"],
      iconActive: "#23201d",
      iconInactive: "#424242",
      glow: ["#A2D5F2", "transparent"],
    },
  },
  dark: {
    text: "#FFFFFF",
    background: "#2D2D34",
    tint: "#A2D5F2",
    tabIconDefault: "#D4C1EC",
    tabIconSelected: "#FFF6B7",
    border: "#FFD6C0",
    gradient: ["#2D2D34", "#D4C1EC"],
    red: "#EF5350",
    card: "#232323",
    input: "#191919",
    textSecondary: "#AAAAAA",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#232323",
    primary: "#A2D5F2",
    secondary: "#D4C1EC",
    error: "#EF5350",
    primaryLight: "#B8E0F5",
    icon: "#FFFFFF",
    primaryGradient: "#B8E0F5",
    onPrimary: "#FFFFFF",
    shield: {
      active: ["#A2D5F2", "#87C0D9"],
      inactive: ["#424242", "#212121"],
      iconActive: "#2D2D34",
      iconInactive: "#BDBDBD",
      glow: ["#A2D5F2", "transparent"],
    },
  },
};

// 3. Pastel Blossom (pinks, lavenders, mint)
const pastelBlossom = {
  light: {
    text: "#3D2C3C",
    background: "#FFF0F6",
    tint: "#B5EAD7",
    tabIconDefault: "#F7CAC9",
    tabIconSelected: "#D4C1EC",
    border: "#F7CAC9",
    gradient: ["#FFF0F6", "#D4C1EC"],
    red: "#F8BBD9",
    card: "#FFFFFF",
    input: "#F0F0F0",
    textSecondary: "#666666",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#FFFFFF",
    primary: "#B5EAD7",
    secondary: "#D4C1EC",
    error: "#F8BBD9",
    primaryLight: "#C7F0E0",
    icon: "#3D2C3C",
    primaryGradient: "#C7F0E0",
    onPrimary: "#FFFFFF",
    shield: {
      active: ["#B5EAD7", "#9AD8C3"],
      inactive: ["#E0E0E0", "#BDBDBD"],
      iconActive: "#3D2C3C",
      iconInactive: "#424242",
      glow: ["#B5EAD7", "transparent"],
    },
  },
  dark: {
    text: "#FFFFFF",
    background: "#3D2C3C",
    tint: "#B5EAD7",
    tabIconDefault: "#F7CAC9",
    tabIconSelected: "#D4C1EC",
    border: "#F7CAC9",
    gradient: ["#3D2C3C", "#B5EAD7"],
    red: "#F48FB1",
    card: "#232323",
    input: "#191919",
    textSecondary: "#AAAAAA",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#232323",
    primary: "#B5EAD7",
    secondary: "#D4C1EC",
    error: "#F48FB1",
    primaryLight: "#C7F0E0",
    icon: "#FFFFFF",
    primaryGradient: "#C7F0E0",
    onPrimary: "#FFFFFF",
    shield: {
      active: ["#B5EAD7", "#9AD8C3"],
      inactive: ["#424242", "#212121"],
      iconActive: "#3D2C3C",
      iconInactive: "#BDBDBD",
      glow: ["#B5EAD7", "transparent"],
    },
  },
};

// 4. Pastel Ocean (blues, aquas, sand)
const pastelOcean = {
  light: {
    text: "#1A2A40",
    background: "#E3F6FD",
    tint: "#7FDBDA",
    tabIconDefault: "#A2D5F2",
    tabIconSelected: "#FDF6E3",
    border: "#B5D6EA",
    gradient: ["#E3F6FD", "#B5D6EA"],
    red: "#FFAB91",
    card: "#FFFFFF",
    input: "#F0F0F0",
    textSecondary: "#666666",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#FFFFFF",
    primary: "#7FDBDA",
    secondary: "#A2D5F2",
    error: "#FFAB91",
    primaryLight: "#9BE4E3",
    icon: "#1A2A40",
    primaryGradient: "#9BE4E3",
    onPrimary: "#FFFFFF",
    shield: {
      active: ["#7FDBDA", "#6BCACA"],
      inactive: ["#E0E0E0", "#BDBDBD"],
      iconActive: "#1A2A40",
      iconInactive: "#424242",
      glow: ["#7FDBDA", "transparent"],
    },
  },
  dark: {
    text: "#FFFFFF",
    background: "#1A2A40",
    tint: "#7FDBDA",
    tabIconDefault: "#A2D5F2",
    tabIconSelected: "#FDF6E3",
    border: "#B5D6EA",
    gradient: ["#1A2A40", "#7FDBDA"],
    red: "#FF8A65",
    card: "#232323",
    input: "#191919",
    textSecondary: "#AAAAAA",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#232323",
    primary: "#7FDBDA",
    secondary: "#A2D5F2",
    error: "#FF8A65",
    primaryLight: "#9BE4E3",
    icon: "#FFFFFF",
    primaryGradient: "#9BE4E3",
    onPrimary: "#FFFFFF",
    shield: {
      active: ["#7FDBDA", "#6BCACA"],
      inactive: ["#424242", "#212121"],
      iconActive: "#1A2A40",
      iconInactive: "#BDBDBD",
      glow: ["#7FDBDA", "transparent"],
    },
  },
};

// 5. Classic Spotify (original theme - green and black)
const classicSpotify = {
  light: {
    text: "#191414",
    background: "#FFFFFF",
    tint: "#1DB954",
    tabIconDefault: "#B3B3B3",
    tabIconSelected: "#1DB954",
    border: "#E5E5E5",
    gradient: ["#FFFFFF", "#F8F8F8"],
    red: "#E22134",
    card: "#FFFFFF",
    input: "#F0F0F0",
    textSecondary: "#666666",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#FFFFFF",
    primary: "#1DB954",
    secondary: "#B3B3B3",
    error: "#E22134",
    primaryLight: "#1ED760",
    icon: "#191414",
    primaryGradient: "#1ED760",
    onPrimary: "#FFFFFF",
    shield: {
      active: ["#1DB954", "#1AAE4B"],
      inactive: ["#E0E0E0", "#BDBDBD"],
      iconActive: "#FFFFFF",
      iconInactive: "#424242",
      glow: ["#1DB954", "transparent"],
    },
  },
  dark: {
    text: "#FFFFFF",
    background: "#191414",
    tint: "#1DB954",
    tabIconDefault: "#B3B3B3",
    tabIconSelected: "#1DB954",
    border: "#282828",
    gradient: ["#191414", "#121212"],
    red: "#FF4444",
    card: "#232323",
    input: "#191919",
    textSecondary: "#AAAAAA",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#232323",
    primary: "#1DB954",
    secondary: "#B3B3B3",
    error: "#FF4444",
    primaryLight: "#1ED760",
    icon: "#FFFFFF",
    primaryGradient: "#1ED760",
    onPrimary: "#FFFFFF",
    shield: {
      active: ["#1DB954", "#1AAE4B"],
      inactive: ["#424242", "#212121"],
      iconActive: "#FFFFFF",
      iconInactive: "#BDBDBD",
      glow: ["#1DB954", "transparent"],
    },
  },
};

// 6. Feminine Rose (soft pinks, roses, and golds)
const feminineRose = {
  light: {
    text: "#2D1B1B",
    background: "#FFF8F8",
    tint: "#E8B4B8",
    tabIconDefault: "#D4A5A5",
    tabIconSelected: "#F4C2C2",
    border: "#F0E6E6",
    gradient: ["#FFF8F8", "#FDF2F2"],
    red: "#D81B60",
    card: "#FFFFFF",
    input: "#F0F0F0",
    textSecondary: "#666666",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#FFFFFF",
    primary: "#E8B4B8",
    secondary: "#D4A5A5",
    error: "#D81B60",
    primaryLight: "#F0C4C8",
    icon: "#2D1B1B",
    primaryGradient: "#F0C4C8",
    onPrimary: "#FFFFFF",
    shield: {
      active: ["#E8B4B8", "#DDAAB0"],
      inactive: ["#E0E0E0", "#BDBDBD"],
      iconActive: "#2D1B1B",
      iconInactive: "#424242",
      glow: ["#E8B4B8", "transparent"],
    },
  },
  dark: {
    text: "#FFFFFF",
    background: "#2D1B1B",
    tint: "#E8B4B8",
    tabIconDefault: "#D4A5A5",
    tabIconSelected: "#F4C2C2",
    border: "#4A2F2F",
    gradient: ["#2D1B1B", "#1F1414"],
    red: "#E91E63",
    card: "#232323",
    input: "#191919",
    textSecondary: "#AAAAAA",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#232323",
    primary: "#E8B4B8",
    secondary: "#D4A5A5",
    error: "#E91E63",
    primaryLight: "#F0C4C8",
    icon: "#FFFFFF",
    primaryGradient: "#F0C4C8",
    onPrimary: "#FFFFFF",
    shield: {
      active: ["#E8B4B8", "#DDAAB0"],
      inactive: ["#424242", "#212121"],
      iconActive: "#2D1B1B",
      iconInactive: "#BDBDBD",
      glow: ["#E8B4B8", "transparent"],
    },
  },
};

// 7. Masculine Steel (deep blues, grays, and steel accents)
const masculineSteel = {
  light: {
    text: "#1A1A1A",
    background: "#F5F7FA",
    tint: "#4A5568",
    tabIconDefault: "#A0AEC0",
    tabIconSelected: "#2D3748",
    border: "#E2E8F0",
    gradient: ["#F5F7FA", "#EDF2F7"],
    red: "#E53E3E",
    card: "#FFFFFF",
    input: "#F0F0F0",
    textSecondary: "#666666",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#FFFFFF",
    primary: "#4A5568",
    secondary: "#A0AEC0",
    error: "#E53E3E",
    primaryLight: "#718096",
    primaryGradient: "#718096",
    onPrimary: "#FFFFFF",
  },
  dark: {
    text: "#F7FAFC",
    background: "#1A202C",
    tint: "#4A5568",
    tabIconDefault: "#A0AEC0",
    tabIconSelected: "#2D3748",
    border: "#2D3748",
    gradient: ["#1A202C", "#171923"],
    red: "#FC8181",
    card: "#232323",
    input: "#191919",
    textSecondary: "#AAAAAA",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#232323",
    primary: "#4A5568",
    secondary: "#A0AEC0",
    error: "#FC8181",
    primaryLight: "#718096",
    primaryGradient: "#718096",
    onPrimary: "#FFFFFF",
  },
};

// 8. Cyberpunk (neon, bold, futuristic)
const cyberpunk = {
  light: {
    text: "#1DE9B6",
    background: "#18122B",
    tint: "#FF2E63",
    tabIconDefault: "#6C63FF",
    tabIconSelected: "#FF2E63",
    border: "#393053",
    gradient: ["#18122B", "#393053"],
    red: "#FF1744",
    card: "#FFFFFF",
    input: "#F0F0F0",
    textSecondary: "#666666",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#FFFFFF",
    primary: "#FF2E63",
    secondary: "#6C63FF",
    error: "#FF1744",
    primaryLight: "#FF5C8A",
    primaryGradient: "#FF5C8A",
    onPrimary: "#FFFFFF",
  },
  dark: {
    text: "#1DE9B6",
    background: "#0F1021",
    tint: "#FF2E63",
    tabIconDefault: "#6C63FF",
    tabIconSelected: "#FF2E63",
    border: "#232946",
    gradient: ["#0F1021", "#232946"],
    red: "#FF4081",
    card: "#232323",
    input: "#191919",
    textSecondary: "#AAAAAA",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#232323",
    primary: "#FF2E63",
    secondary: "#6C63FF",
    error: "#FF4081",
    primaryLight: "#FF5C8A",
    primaryGradient: "#FF5C8A",
    onPrimary: "#FFFFFF",
  },
};

// 9. Earth Tones (warm, natural, cozy)
const earthTones = {
  light: {
    text: "#3E2723",
    background: "#F5E9DA",
    tint: "#A1887F",
    tabIconDefault: "#8D6E63",
    tabIconSelected: "#6D4C41",
    border: "#D7CCC8",
    gradient: ["#F5E9DA", "#D7CCC8"],
    red: "#BF360C",
    card: "#FFFFFF",
    input: "#F0F0F0",
    textSecondary: "#666666",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#FFFFFF",
    primary: "#A1887F",
    secondary: "#8D6E63",
    error: "#BF360C",
    primaryLight: "#D7CCC8",
    primaryGradient: "#D7CCC8",
    onPrimary: "#FFFFFF",
  },
  dark: {
    text: "#F5E9DA",
    background: "#3E2723",
    tint: "#A1887F",
    tabIconDefault: "#8D6E63",
    tabIconSelected: "#F5E9DA",
    border: "#6D4C41",
    gradient: ["#3E2723", "#6D4C41"],
    red: "#FF5722",
    card: "#232323",
    input: "#191919",
    textSecondary: "#AAAAAA",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#232323",
    primary: "#A1887F",
    secondary: "#8D6E63",
    error: "#FF5722",
    primaryLight: "#D7CCC8",
    primaryGradient: "#D7CCC8",
    onPrimary: "#FFFFFF",
  },
};

// 10. Monochrome (minimalist, black/white/gray)
const monochrome = {
  light: {
    text: "#222222",
    background: "#FFFFFF",
    tint: "#444444",
    tabIconDefault: "#B0B0B0",
    tabIconSelected: "#222222",
    border: "#E0E0E0",
    gradient: ["#FFFFFF", "#E0E0E0"],
    red: "#D32F2F",
    card: "#FFFFFF",
    input: "#F0F0F0",
    textSecondary: "#666666",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#FFFFFF",
    primary: "#444444",
    secondary: "#B0B0B0",
    error: "#D32F2F",
    primaryLight: "#E0E0E0",
    primaryGradient: "#E0E0E0",
    onPrimary: "#FFFFFF",
  },
  dark: {
    text: "#F5F5F5",
    background: "#181818",
    tint: "#B0B0B0",
    tabIconDefault: "#444444",
    tabIconSelected: "#F5F5F5",
    border: "#222222",
    gradient: ["#181818", "#222222"],
    red: "#F44336",
    card: "#232323",
    input: "#191919",
    textSecondary: "#AAAAAA",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#232323",
    primary: "#B0B0B0",
    secondary: "#444444",
    error: "#F44336",
    primaryLight: "#E0E0E0",
    primaryGradient: "#E0E0E0",
    onPrimary: "#FFFFFF",
  },
};

// 11. Nordic Night (nord palette, modern, calm)
const nordicNight = {
  light: {
    text: "#2E3440",
    background: "#ECEFF4",
    tint: "#5E81AC",
    tabIconDefault: "#A3BE8C",
    tabIconSelected: "#5E81AC",
    border: "#D8DEE9",
    gradient: ["#ECEFF4", "#D8DEE9"],
    red: "#BF616A",
    card: "#FFFFFF",
    input: "#F0F0F0",
    textSecondary: "#666666",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#FFFFFF",
    primary: "#5E81AC",
    secondary: "#A3BE8C",
    error: "#BF616A",
    primaryLight: "#D8DEE9",
    primaryGradient: "#D8DEE9",
    onPrimary: "#FFFFFF",
  },
  dark: {
    text: "#ECEFF4",
    background: "#2E3440",
    tint: "#5E81AC",
    tabIconDefault: "#A3BE8C",
    tabIconSelected: "#5E81AC",
    border: "#4C566A",
    gradient: ["#2E3440", "#4C566A"],
    red: "#BF616A",
    card: "#232323",
    input: "#191919",
    textSecondary: "#AAAAAA",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#232323",
    primary: "#5E81AC",
    secondary: "#A3BE8C",
    error: "#BF616A",
    primaryLight: "#D8DEE9",
    primaryGradient: "#D8DEE9",
    onPrimary: "#FFFFFF",
  },
};

// 12. Solarized Dark (retro, developer favorite)
const solarizedDark = {
  light: {
    text: "#657b83",
    background: "#fdf6e3",
    tint: "#b58900",
    tabIconDefault: "#93a1a1",
    tabIconSelected: "#268bd2",
    border: "#eee8d5",
    gradient: ["#fdf6e3", "#eee8d5"],
    red: "#dc322f",
    card: "#FFFFFF",
    input: "#F0F0F0",
    textSecondary: "#666666",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#FFFFFF",
    primary: "#b58900",
    secondary: "#93a1a1",
    error: "#dc322f",
    primaryLight: "#eee8d5",
    primaryGradient: "#eee8d5",
    onPrimary: "#FFFFFF",
  },
  dark: {
    text: "#fdf6e3",
    background: "#002b36",
    tint: "#b58900",
    tabIconDefault: "#586e75",
    tabIconSelected: "#268bd2",
    border: "#073642",
    gradient: ["#002b36", "#073642"],
    red: "#dc322f",
    card: "#232323",
    input: "#191919",
    textSecondary: "#AAAAAA",
    subtext: "#888888",
    // Additional properties for UI components
    cardBackground: "#232323",
    primary: "#b58900",
    secondary: "#93a1a1",
    error: "#dc322f",
    primaryLight: "#eee8d5",
    primaryGradient: "#eee8d5",
    onPrimary: "#FFFFFF",
  },
};

export type ColorTheme = {
  light: ColorSet;
  dark: ColorSet;
};

export type ColorSet = {
  text: string;
  background: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  border: string;
  gradient: string[];
  red: string;
  card: string;
  input: string;
  textSecondary: string;
  subtext: string;
  cardBackground: string;
  primary: string;
  secondary: string;
  error: string;
  primaryLight: string;
  icon?: string;  // Made optional if not always present
  primaryGradient?: string;
  onPrimary?: string;
  shield: {
    active: [string, string];
    inactive: [string, string];
    iconActive: string;
    iconInactive: string;
    glow: [string, string];
  };
};

export const themes: Record<string, ColorTheme> = {
  charcoalGold,
  classicSpotify,
  cyberpunk,
  earthTones,
  feminineRose,
  masculineSteel,
  monochrome,
  nordicNight,
  pastelBlossom,
  pastelCitrus,
  pastelOcean,
  solarizedDark,
};

// Default Colors export for backward compatibility
// This maps to the current default theme (pastelCitrus)
export const Colors = {
  light: pastelCitrus.light,
  dark: pastelCitrus.dark,
};

export default themes;
