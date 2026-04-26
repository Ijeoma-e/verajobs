import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

export type ThemeMode = 'light' | 'dark' | 'auto';

export function useEnhancedTheme() {
  const systemTheme = useColorScheme() ?? 'light';
  const theme: ThemeMode = 'auto'; // This would come from your store
  
  const isDarkMode = theme === 'dark' || (theme === 'auto' && systemTheme === 'dark');
  const isLightMode = theme === 'light' || (theme === 'auto' && systemTheme === 'light');
  
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  return {
    theme: systemTheme,
    isDarkMode,
    isLightMode,
    colors,
    systemTheme,
  };
}

export function getAppleDarkColors() {
  return {
    background: '#0A0A0A',      // Very dark, warm black
    surface: '#1C1C1E',        // Dark gray with warmth
    surfaceVariant: '#2C2C2E', // Slightly lighter surface
    backgroundVariant: '#121212', // Even darker background
    text: '#FFFFFF',           // Pure white text
    textSecondary: '#8E8E93',  // Gray text for secondary info
    textTertiary: '#48484A',   // Very dim text for tertiary info
    border: '#38383A',         // Subtle border color
    shadow: '#000000',         // Pure black for shadows
    primary: '#007AFF',        // Apple blue
    primaryVariant: '#5856D6', // Lighter blue variant
    success: '#34C759',        // Apple green
    warning: '#FF9500',        // Apple orange
    error: '#FF3B30',          // Apple red
  };
}

export function getAppleLightColors() {
  return {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceVariant: '#F3F4F6',
    backgroundVariant: '#FEFEFE',
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    border: '#E5E7EB',
    shadow: '#000000',
    primary: '#007AFF',
    primaryVariant: '#5AC8FA',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  };
}