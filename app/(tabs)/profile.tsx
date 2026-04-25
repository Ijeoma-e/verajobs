import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useStore } from '@/store/useStore';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { db, auth } from '@/services/firebase';
import { doc, setDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, setUser } = useStore();
  const [name, setName] = useState(user?.name || '');
  const [cv, setCv] = useState(user?.baseCV || '');
  const [prefs, setPrefs] = useState(user?.preferences || '');
  const [saving, setSaving] = useState(false);

  // Sync state if user changes in store
  useEffect(() => {
    if (user) {
      setName(user.name);
      setCv(user.baseCV);
      setPrefs(user.preferences);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const updatedProfile = {
      id: auth.currentUser?.uid || user?.id || 'anonymous',
      name,
      email: auth.currentUser?.email || user?.email || '',
      baseCV: cv,
      preferences: prefs,
    };

    try {
      // 1. Save to local persistent store
      setUser(updatedProfile);

      // 2. Try to save to Firebase if we have a connection
      if (auth.currentUser) {
        await setDoc(doc(db, 'profiles', auth.currentUser.uid), updatedProfile);
      }

      if (Platform.OS === 'web') {
        alert('Profile Saved Successfully');
      } else {
        Alert.alert('Profile Secured', 'Your career data has been saved and synced.');
      }
    } catch (error) {
      console.error("Save error:", error);
      if (Platform.OS === 'web') {
        alert('Error saving profile. Local copy kept.');
      } else {
        Alert.alert('Sync Error', 'Profile saved locally, but failed to sync with cloud.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Career Identity</Text>
        <Text style={styles.headerSubtitle}>Define your professional baseline for AI evaluation.</Text>
      </View>

      <View style={styles.inputSection}>
        <View style={styles.labelRow}>
          <FontAwesome name="user-circle" size={16} color="#4F46E5" />
          <Text style={styles.label}>Full Name</Text>
        </View>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="E.g. Jane Doe"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.inputSection}>
        <View style={styles.labelRow}>
          <FontAwesome name="file-text" size={16} color="#4F46E5" />
          <Text style={styles.label}>Master CV (Text)</Text>
        </View>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            value={cv}
            onChangeText={setCv}
            placeholder="Paste your full CV here. This will be the source of truth for all tailored generations."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={12}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.inputSection}>
        <View style={styles.labelRow}>
          <FontAwesome name="sliders" size={16} color="#4F46E5" />
          <Text style={styles.label}>Hard Preferences</Text>
        </View>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={[styles.textArea, { height: 120 }]}
            value={prefs}
            onChangeText={setPrefs}
            placeholder="E.g. Remote only, Min $180k, No early-stage startups, Principal roles only."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.disabledButton]} 
        onPress={handleSave} 
        disabled={saving}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          style={styles.saveButtonGradient}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Career Profile</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      <View style={styles.infoBox}>
        <FontAwesome name="lock" size={14} color="#64748B" />
        <Text style={styles.infoText}>Your data is stored securely in Firebase.</Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#0F172A',
  },
  textAreaContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  textArea: {
    padding: 16,
    fontSize: 15,
    color: '#0F172A',
    height: 250,
    lineHeight: 22,
  },
  saveButton: {
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    backgroundColor: 'transparent',
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
  },
});
