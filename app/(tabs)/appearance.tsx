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
      primary: "#6366F1",
      secondary: "#8B5CF6",
      gradient: ["#6366F1", "#8B5CF6"],
      name: "Ocean Blue"
    },
    purple: {
      primary: "#8B5CF6",
      secondary: "#A855F7",
      gradient: ["#8B5CF6", "#A855F7"],
      name: "Royal Purple"
    },
    green: {
      primary: "#10B981",
      secondary: "#059669",
      gradient: ["#10B981", "#059669"],
      name: "Forest Green"
    },
    amber: {
      primary: "#F59E0B",
      secondary: "#D97706",
      gradient: ["#F59E0B", "#D97706"],
      name: "Sunset Amber"
    }
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={theme === "dark" ? ["#1a1a2e", "#16213e"] : ["#FDFDFF", "#F3F4FF"]}
        style={styles.background}
      />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme === "dark" ? "#fff" : "#0F172A" }]}>
          Appearance
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme === "dark" ? "#94A3B8" : "#64748B" }]}>
          Customize your AuraJobs experience
        </Text>
      </View>

      <View style={styles.settingsContainer}>
        {/* Theme Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="theme-light-dark" size={20} color={currentScheme.primary} />
            <Text style={styles.sectionTitle}>Theme</Text>
          </View>
          
          <View style={styles.optionGroup}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                theme === "light" && styles.optionButtonSelected,
                { borderColor: currentScheme.primary }
              ]}
              onPress={() => setTheme("light")}
            >
              <Text style={[
                styles.optionText,
                theme === "light" && { color: currentScheme.primary }
              ]}>
                Light
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.optionButton,
                theme === "dark" && styles.optionButtonSelected,
                { borderColor: currentScheme.primary }
              ]}
              onPress={() => setTheme("dark")}
            >
              <Text style={[
                styles.optionText,
                theme === "dark" && { color: currentScheme.primary }
              ]}>
                Dark
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.optionButton,
                theme === "auto" && styles.optionButtonSelected,
                { borderColor: currentScheme.primary }
              ]}
              onPress={() => setTheme("auto")}
            >
              <Text style={[
                styles.optionText,
                theme === "auto" && { color: currentScheme.primary }
              ]}>
                Auto
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Color Scheme */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="palette" size={20} color={currentScheme.primary} />
            <Text style={styles.sectionTitle}>Color Scheme</Text>
          </View>
          
          <View style={styles.colorGrid}>
            {Object.entries(colorSchemes).map(([key, scheme]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.colorOption,
                  colorScheme === key && styles.colorOptionSelected,
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
          
          <View style={styles.colorPreview}>
            <LinearGradient
              colors={currentScheme.gradient}
              style={styles.gradientPreview}
            />
            <Text style={styles.colorName}>{currentScheme.name}</Text>
          </View>
        </View>

        {/* Display Options */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="view-grid" size={20} color={currentScheme.primary} />
            <Text style={styles.sectionTitle}>Display Options</Text>
          </View>
          
          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Compact Mode</Text>
              <Text style={styles.switchDesc}>
                Show more content in less space
              </Text>
            </View>
            <Switch
              value={compactMode}
              onValueChange={setCompactMode}
              trackColor={{ false: "#E5E7EB", true: currentScheme.primary }}
              thumbColor={compactMode ? "#fff" : "#F3F4F6"}
              ios_backgroundColor="#E5E7EB"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: currentScheme.primary }]}
            onPress={resetToDefaults}
          >
            <Text style={[styles.resetButtonText, { color: currentScheme.primary }]}>
              Reset to Defaults
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: currentScheme.primary }]}
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
  scrollContent: { padding: 24 },
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
  section: { backgroundColor: "transparent" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 8,
  },
  optionGroup: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: "#F3F5FF",
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
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  colorPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2FF",
  },
  gradientPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
    borderColor: "#EEF2FF",
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
  actionButtons: {
    gap: 16,
    marginTop: 32,
  },
  resetButton: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
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