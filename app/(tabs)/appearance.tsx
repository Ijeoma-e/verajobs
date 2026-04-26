import { Text, View } from "@/components/Themed";
import { useStore } from "@/store/useStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";

export default function AppearanceScreen() {
  const { user, setUser } = useStore();
  const [theme, setTheme] = useState(user?.appearance?.theme || "light");
  const [colorScheme, setColorScheme] = useState(user?.appearance?.colorScheme || "blue");
  const [compactMode, setCompactMode] = useState(user?.appearance?.compactMode || false);
  const [saving, setSaving] = useState(false);

  const colorSchemes = {
    blue: {
      primary: "#007AFF",
      secondary: "#5AC8FA",
      gradient: ["#007AFF", "#5AC8FA"],
      name: "iOS Blue"
    },
    purple: {
      primary: "#BF5AF2",
      secondary: "#A78BFA",
      gradient: ["#BF5AF2", "#A78BFA"],
      name: "Violet Purple"
    },
    green: {
      primary: "#34C759",
      secondary: "#30D158",
      gradient: ["#34C759", "#30D158"],
      name: "Apple Green"
    },
    amber: {
      primary: "#FF9500",
      secondary: "#FFCC00",
      gradient: ["#FF9500", "#FFCC00"],
      name: "Orange"
    }
  };

  // Apple-inspired dark mode colors
  const appleDarkColors = {
    background: "#0A0A0A",      // Very dark, warm black
    surface: "#1C1C1E",        // Dark gray with warmth
    surfaceVariant: "#2C2C2E", // Slightly lighter surface
    backgroundVariant: "#121212", // Even darker background
    text: "#FFFFFF",           // Pure white text
    textSecondary: "#8E8E93",  // Gray text for secondary info
    textTertiary: "#48484A",   // Very dim text for tertiary info
    border: "#38383A",         // Subtle border color
    shadow: "#000000",         // Pure black for shadows
    primary: "#007AFF",        // Apple blue
    primaryVariant: "#5856D6", // Lighter blue variant
    success: "#34C759",        // Apple green
    warning: "#FF9500",        // Apple orange
    error: "#FF3B30",          // Apple red
  };

  const handleSave = async () => {
    setSaving(true);
    const updatedProfile = {
      ...user,
      appearance: {
        theme,
        colorScheme,
        compactMode,
      },
    };

    try {
      setUser(updatedProfile);
      Alert.alert("Success", "Appearance settings updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setTheme("light");
    setColorScheme("blue");
    setCompactMode(false);
  };

  const currentScheme = colorSchemes[colorScheme as keyof typeof colorSchemes];

  const getThemeColors = () => {
    if (theme === "dark") {
      return appleDarkColors;
    } else {
      return {
        background: "#FFFFFF",
        surface: "#F9FAFB",
        surfaceVariant: "#F3F4F6",
        backgroundVariant: "#FEFEFE",
        text: "#0F172A",
        textSecondary: "#64748B",
        textTertiary: "#94A3B8",
        border: "#E5E7EB",
        shadow: "#000000",
        primary: colorSchemes[colorScheme].primary,
        primaryVariant: colorSchemes[colorScheme].secondary,
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
      };
    }
  };

  const themeColors = getThemeColors();

  // Dynamic styles based on theme
  const getDynamicStyles = () => ({
    optionButton: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
    },
    optionButtonSelected: {
      backgroundColor: themeColors.primary + "10",
      borderColor: themeColors.primary,
    },
    optionText: {
      color: themeColors.textSecondary,
    },
    optionTextSelected: {
      color: themeColors.primary,
    },
    colorOption: {
      borderColor: themeColors.border,
    },
    colorOptionSelected: {
      borderColor: themeColors.primary,
      shadowColor: themeColors.primary,
    },
    colorPreview: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
    },
    colorName: {
      color: themeColors.text,
    },
    switchContainer: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
    },
    switchTitle: {
      color: themeColors.text,
    },
    switchDesc: {
      color: themeColors.textSecondary,
    },
    resetButton: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
    },
    resetButtonText: {
      color: themeColors.textSecondary,
    },
    saveButton: {
      shadowOpacity: theme === "dark" ? 0.3 : 0.1,
    },
  });

  const dynamicStyles = getDynamicStyles();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={theme === "dark" ? [themeColors.background, themeColors.surface] : ["#FDFDFF", "#F3F4FF"]}
        style={styles.background}
      />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme === "dark" ? "#FFFFFF" : "#0F172A" }]}>
          Appearance
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme === "dark" ? "#8E8E93" : "#64748B" }]}>
          Customize your AuraJobs experience
        </Text>
      </View>

      <View style={styles.settingsContainer}>
        {/* Theme Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="theme-light-dark" size={20} color={currentScheme.primary} />
            <Text style={[styles.sectionTitle, { color: theme === "dark" ? "#FFFFFF" : "#0F172A" }]}>Theme</Text>
          </View>
          
          <View style={styles.optionGroup}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                dynamicStyles.optionButton,
                theme === "light" && dynamicStyles.optionButtonSelected,
                { borderColor: currentScheme.primary }
              ]}
              onPress={() => setTheme("light")}
            >
              <Text style={[
                styles.optionText,
                dynamicStyles.optionText,
                theme === "light" && dynamicStyles.optionTextSelected
              ]}>
                Light
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.optionButton,
                dynamicStyles.optionButton,
                theme === "dark" && dynamicStyles.optionButtonSelected,
                { borderColor: currentScheme.primary }
              ]}
              onPress={() => setTheme("dark")}
            >
              <Text style={[
                styles.optionText,
                dynamicStyles.optionText,
                theme === "dark" && dynamicStyles.optionTextSelected
              ]}>
                Dark
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.optionButton,
                dynamicStyles.optionButton,
                theme === "auto" && dynamicStyles.optionButtonSelected,
                { borderColor: currentScheme.primary }
              ]}
              onPress={() => setTheme("auto")}
            >
              <Text style={[
                styles.optionText,
                dynamicStyles.optionText,
                theme === "auto" && dynamicStyles.optionTextSelected
              ]}>
                Auto
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Color Scheme */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="palette-outline" size={20} color={currentScheme.primary} />
            <Text style={[styles.sectionTitle, { color: theme === "dark" ? "#FFFFFF" : "#0F172A" }]}>Color Scheme</Text>
          </View>
          
          <View style={styles.colorGrid}>
            {Object.entries(colorSchemes).map(([key, scheme]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.colorOption,
                  dynamicStyles.colorOption,
                  colorScheme === key && dynamicStyles.colorOptionSelected,
                  { backgroundColor: scheme.primary }
                ]}
                onPress={() => setColorScheme(key)}
              >
                {colorScheme === key && (
                  <MaterialCommunityIcons name="check" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={[styles.colorPreview, dynamicStyles.colorPreview]}>
            <LinearGradient
              colors={currentScheme.gradient}
              style={styles.gradientPreview}
            />
            <Text style={[styles.colorName, dynamicStyles.colorName]}>{currentScheme.name}</Text>
          </View>
        </View>

        {/* Display Options */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="view-grid" size={20} color={currentScheme.primary} />
            <Text style={[styles.sectionTitle, { color: theme === "dark" ? "#FFFFFF" : "#0F172A" }]}>Display Options</Text>
          </View>
          
          <View style={[styles.switchContainer, dynamicStyles.switchContainer]}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchTitle, dynamicStyles.switchTitle]}>Compact Mode</Text>
              <Text style={[styles.switchDesc, dynamicStyles.switchDesc]}>
                Show more content in less space
              </Text>
            </View>
            <Switch
              value={compactMode}
              onValueChange={setCompactMode}
              trackColor={{ false: themeColors.border, true: currentScheme.primary }}
              thumbColor={compactMode ? "#fff" : themeColors.surface}
              ios_backgroundColor={themeColors.border}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.resetButton, dynamicStyles.resetButton, { borderColor: currentScheme.primary }]}
            onPress={resetToDefaults}
          >
            <Text style={[styles.resetButtonText, dynamicStyles.resetButtonText, { color: currentScheme.primary }]}>
              Reset to Defaults
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, dynamicStyles.saveButton, { backgroundColor: currentScheme.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              colors={currentScheme.gradient}
              style={styles.saveGradient}
            >
              {saving ? (
                <Text style={styles.saveButtonText}>Saving...</Text>
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

  const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
    scrollContent: { 
      padding: 24,
      paddingBottom: 40,
    },
    header: { marginTop: 40, marginBottom: 30 },
    headerTitle: {
      fontSize: 42,
      fontWeight: "900",
      letterSpacing: -1,
    },
    headerSubtitle: {
      fontSize: 16,
      fontWeight: "500",
      marginTop: 8,
    },
    settingsContainer: { gap: 24 },
    section: { 
      backgroundColor: "transparent",
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginLeft: 8,
    },
    optionButton: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      borderWidth: 2,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
    },
    optionButtonSelected: {
      backgroundColor: "#F3F5FF",
      borderWidth: 2,
      borderColor: "#6366F1",
    },
    optionText: {
      fontSize: 15,
      fontWeight: "600",
      color: "#64748B",
    },
    colorGrid: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    colorOption: {
      width: 64,
      height: 64,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: "#E5E7EB",
      justifyContent: "center",
      alignItems: "center",
    },
    colorOptionSelected: {
      borderWidth: 3,
      borderColor: "#6366F1",
      shadowColor: "#6366F1",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    colorPreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },
    gradientPreview: {
      width: 48,
      height: 48,
      borderRadius: 12,
    },
    colorName: {
      fontSize: 16,
      fontWeight: "600",
      color: "#0F172A",
    },
    switchContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },
    switchInfo: { flex: 1 },
    switchTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#0F172A",
      marginBottom: 4,
    },
    switchDesc: {
      fontSize: 14,
      color: "#64748B",
    },
    resetButton: {
      padding: 16,
      borderRadius: 16,
      borderWidth: 2,
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E7EB",
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#64748B",
    },
    saveButton: {
      height: 56,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    saveGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
  });