// Color theme definitions for StreamShield

// 1. Charcoal & Gold (original)
const charcoalGold = {
  light: {
    text: '#191414',
    background: '#F5F5F5',
    tint: '#D4AF37',
    tabIconDefault: '#A9A9A9',
    tabIconSelected: '#D4AF37',
    border: 'rgba(41, 41, 41, 0.1)',
    gradient: ['#F5F5F5', '#E5E5E5'],
    red: '#D32F2F',
    card: '#FFFFFF',
    input: '#F0F0F0',
  },
  dark: {
    text: '#FFFFFF',
    background: '#121212',
    tint: '#D4AF37',
    tabIconDefault: '#A9A9A9',
    tabIconSelected: '#D4AF37',
    border: 'rgba(255, 255, 255, 0.1)',
    gradient: ['#232323', '#191414'],
    red: '#F44336',
    card: '#232323',
    input: '#191919',
  },
};

// 2. Pastel Citrus (current)
const pastelCitrus = {
  light: {
    text: '#23201d',
    background: '#F8F8F8',
    tint: '#A2D5F2',
    tabIconDefault: '#D4C1EC',
    tabIconSelected: '#FFF6B7',
    border: '#FFD6C0',
    gradient: ['#F8F8F8', '#D4C1EC'],
    red: '#E57373',
    card: '#FFFFFF',
    input: '#F0F0F0',
  },
  dark: {
    text: '#FFFFFF',
    background: '#2D2D34',
    tint: '#A2D5F2',
    tabIconDefault: '#D4C1EC',
    tabIconSelected: '#FFF6B7',
    border: '#FFD6C0',
    gradient: ['#2D2D34', '#D4C1EC'],
    red: '#EF5350',
    card: '#232323',
    input: '#191919',
  },
};

// 3. Pastel Blossom (pinks, lavenders, mint)
const pastelBlossom = {
  light: {
    text: '#3D2C3C',
    background: '#FFF0F6',
    tint: '#B5EAD7',
    tabIconDefault: '#F7CAC9',
    tabIconSelected: '#D4C1EC',
    border: '#F7CAC9',
    gradient: ['#FFF0F6', '#D4C1EC'],
    red: '#F8BBD9',
    card: '#FFFFFF',
    input: '#F0F0F0',
  },
  dark: {
    text: '#FFFFFF',
    background: '#3D2C3C',
    tint: '#B5EAD7',
    tabIconDefault: '#F7CAC9',
    tabIconSelected: '#D4C1EC',
    border: '#F7CAC9',
    gradient: ['#3D2C3C', '#B5EAD7'],
    red: '#F48FB1',
    card: '#232323',
    input: '#191919',
  },
};

// 4. Pastel Ocean (blues, aquas, sand)
const pastelOcean = {
  light: {
    text: '#1A2A40',
    background: '#E3F6FD',
    tint: '#7FDBDA',
    tabIconDefault: '#A2D5F2',
    tabIconSelected: '#FDF6E3',
    border: '#B5D6EA',
    gradient: ['#E3F6FD', '#B5D6EA'],
    red: '#FFAB91',
    card: '#FFFFFF',
    input: '#F0F0F0',
  },
  dark: {
    text: '#FFFFFF',
    background: '#1A2A40',
    tint: '#7FDBDA',
    tabIconDefault: '#A2D5F2',
    tabIconSelected: '#FDF6E3',
    border: '#B5D6EA',
    gradient: ['#1A2A40', '#7FDBDA'],
    red: '#FF8A65',
    card: '#232323',
    input: '#191919',
  },
};

// 5. Classic Spotify (original theme - green and black)
const classicSpotify = {
  light: {
    text: '#191414',
    background: '#FFFFFF',
    tint: '#1DB954',
    tabIconDefault: '#B3B3B3',
    tabIconSelected: '#1DB954',
    border: '#E5E5E5',
    gradient: ['#FFFFFF', '#F8F8F8'],
    red: '#E22134',
    card: '#FFFFFF',
    input: '#F0F0F0',
  },
  dark: {
    text: '#FFFFFF',
    background: '#191414',
    tint: '#1DB954',
    tabIconDefault: '#B3B3B3',
    tabIconSelected: '#1DB954',
    border: '#282828',
    gradient: ['#191414', '#121212'],
    red: '#FF4444',
    card: '#232323',
    input: '#191919',
  },
};

// 6. Feminine Rose (soft pinks, roses, and golds)
const feminineRose = {
  light: {
    text: '#2D1B1B',
    background: '#FFF8F8',
    tint: '#E8B4B8',
    tabIconDefault: '#D4A5A5',
    tabIconSelected: '#F4C2C2',
    border: '#F0E6E6',
    gradient: ['#FFF8F8', '#FDF2F2'],
    red: '#D81B60',
    card: '#FFFFFF',
    input: '#F0F0F0',
  },
  dark: {
    text: '#FFFFFF',
    background: '#2D1B1B',
    tint: '#E8B4B8',
    tabIconDefault: '#D4A5A5',
    tabIconSelected: '#F4C2C2',
    border: '#4A2F2F',
    gradient: ['#2D1B1B', '#1F1414'],
    red: '#E91E63',
    card: '#232323',
    input: '#191919',
  },
};

// 7. Masculine Steel (deep blues, grays, and steel accents)
const masculineSteel = {
  light: {
    text: '#1A1A1A',
    background: '#F5F7FA',
    tint: '#4A5568',
    tabIconDefault: '#A0AEC0', // lighter for better contrast
    tabIconSelected: '#2D3748',
    border: '#E2E8F0',
    gradient: ['#F5F7FA', '#EDF2F7'],
    red: '#E53E3E',
    card: '#FFFFFF',
    input: '#F0F0F0',
  },
  dark: {
    text: '#F7FAFC', // slightly lighter for better contrast
    background: '#1A202C',
    tint: '#4A5568',
    tabIconDefault: '#A0AEC0', // lighter for better contrast
    tabIconSelected: '#2D3748',
    border: '#2D3748',
    gradient: ['#1A202C', '#171923'],
    red: '#FC8181',
    card: '#232323',
    input: '#191919',
  },
};

// 8. Cyberpunk (neon, bold, futuristic)
const cyberpunk = {
  light: {
    text: '#1DE9B6',
    background: '#18122B',
    tint: '#FF2E63',
    tabIconDefault: '#6C63FF',
    tabIconSelected: '#FF2E63',
    border: '#393053',
    gradient: ['#18122B', '#393053'],
    red: '#FF1744',
    card: '#FFFFFF',
    input: '#F0F0F0',
  },
  dark: {
    text: '#1DE9B6',
    background: '#0F1021',
    tint: '#FF2E63',
    tabIconDefault: '#6C63FF',
    tabIconSelected: '#FF2E63',
    border: '#232946',
    gradient: ['#0F1021', '#232946'],
    red: '#FF4081',
    card: '#232323',
    input: '#191919',
  },
};

// 9. Earth Tones (warm, natural, cozy)
const earthTones = {
  light: {
    text: '#3E2723',
    background: '#F5E9DA',
    tint: '#A1887F',
    tabIconDefault: '#8D6E63',
    tabIconSelected: '#6D4C41',
    border: '#D7CCC8',
    gradient: ['#F5E9DA', '#D7CCC8'],
    red: '#BF360C',
    card: '#FFFFFF',
    input: '#F0F0F0',
  },
  dark: {
    text: '#F5E9DA',
    background: '#3E2723',
    tint: '#A1887F',
    tabIconDefault: '#8D6E63',
    tabIconSelected: '#F5E9DA',
    border: '#6D4C41',
    gradient: ['#3E2723', '#6D4C41'],
    red: '#FF5722',
    card: '#232323',
    input: '#191919',
  },
};

// 10. Monochrome (minimalist, black/white/gray)
const monochrome = {
  light: {
    text: '#222222',
    background: '#FFFFFF',
    tint: '#444444',
    tabIconDefault: '#B0B0B0',
    tabIconSelected: '#222222',
    border: '#E0E0E0',
    gradient: ['#FFFFFF', '#E0E0E0'],
    red: '#D32F2F',
    card: '#FFFFFF',
    input: '#F0F0F0',
  },
  dark: {
    text: '#F5F5F5',
    background: '#181818',
    tint: '#B0B0B0',
    tabIconDefault: '#444444',
    tabIconSelected: '#F5F5F5',
    border: '#222222',
    gradient: ['#181818', '#222222'],
    red: '#F44336',
    card: '#232323',
    input: '#191919',
  },
};

// 11. Nordic Night (nord palette, modern, calm)
const nordicNight = {
  light: {
    text: '#2E3440',
    background: '#ECEFF4',
    tint: '#5E81AC',
    tabIconDefault: '#A3BE8C',
    tabIconSelected: '#5E81AC',
    border: '#D8DEE9',
    gradient: ['#ECEFF4', '#D8DEE9'],
    red: '#BF616A',
    card: '#FFFFFF',
    input: '#F0F0F0',
  },
  dark: {
    text: '#ECEFF4',
    background: '#2E3440',
    tint: '#5E81AC',
    tabIconDefault: '#A3BE8C',
    tabIconSelected: '#5E81AC',
    border: '#4C566A',
    gradient: ['#2E3440', '#4C566A'],
    red: '#BF616A',
    card: '#232323',
    input: '#191919',
  },
};

// 12. Solarized Dark (retro, developer favorite)
const solarizedDark = {
  light: {
    text: '#657b83',
    background: '#fdf6e3',
    tint: '#b58900',
    tabIconDefault: '#93a1a1',
    tabIconSelected: '#268bd2',
    border: '#eee8d5',
    gradient: ['#fdf6e3', '#eee8d5'],
    red: '#dc322f',
    card: '#FFFFFF',
    input: '#F0F0F0',
  },
  dark: {
    text: '#fdf6e3',
    background: '#002b36',
    tint: '#b58900',
    tabIconDefault: '#586e75',
    tabIconSelected: '#268bd2',
    border: '#073642',
    gradient: ['#002b36', '#073642'],
    red: '#dc322f',
    card: '#232323',
    input: '#191919',
  },
};

export const themes = {
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