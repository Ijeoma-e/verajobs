const tintColorLight = '#004B9B'; // PlayStation blue
const tintColorDark = '#fff';

export default {
  light: {
    text: '#0F172A',
    background: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    cardBackground: '#F9FAFB',
    border: '#E5E7EB',
    shadow: '#000000',
    // PlayStation-inspired light mode
    primary: '#004B9B',
    secondary: '#0066CC',
    accent: '#FFD700', // Gold for highlights
  },
  dark: {
    text: '#FFFFFF',
    background: '#0A0A0A', // Deep black like PS5
    tint: tintColorDark,
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorDark,
    cardBackground: '#151515', // Slightly lighter than background
    border: '#2A2A2A',
    shadow: '#000000',
    // PlayStation-inspired dark mode
    primary: '#004B9B',
    secondary: '#0066CC',
    accent: '#FFD700', // Gold for highlights
    // Additional PS colors
    danger: '#FF3B30',
    success: '#34C759',
  },
};
