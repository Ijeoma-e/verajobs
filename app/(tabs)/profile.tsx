import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Dimensions, ActivityIndicator, Platform, Switch } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { extractTextFromPDF } from '@/services/api';
import { Text, View } from '@/components/Themed';
import { useStore } from '@/store/useStore';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '@/services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { List } from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, setUser } = useStore();
  const [name, setName] = useState(user?.name || '');
  const [cv, setCv] = useState(user?.baseCV || '');
  const [prefs, setPrefs] = useState(user?.preferences || '');
  const [isAutonomous, setIsAutonomous] = useState(user?.aiSettings?.isAutonomous || false);
  const [autoTailor, setAutoTailor] = useState(user?.aiSettings?.autoTailor || false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUploadCV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });

      if (!result.canceled) {
        setUploading(true);
        const file = result.assets[0];
        
        // Extract text from file using Vera's AI powers
        const text = await extractTextFromPDF(file.uri, file.name, file.mimeType || 'application/pdf');
        setCv(text);
        Platform.OS === 'web' ? alert('Aura Scanned: CV logic extracted.') : Alert.alert('Aura Scanned', 'Vera has successfully extracted your career baseline.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Error', 'Failed to scan CV. Please try pasting the text manually.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCv(user.baseCV);
      setPrefs(user.preferences);
      setIsAutonomous(user.aiSettings?.isAutonomous || false);
      setAutoTailor(user.aiSettings?.autoTailor || false);
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
      aiSettings: {
        isAutonomous,
        scanFrequency: 'daily',
        autoTailor,
      }
    };

    try {
      setUser(updatedProfile);
      if (auth.currentUser) {
        await setDoc(doc(db, 'profiles', auth.currentUser.uid), updatedProfile);
      }
      Platform.OS === 'web' ? alert('Aura Identity Updated') : Alert.alert('Aura Updated', 'Your career baseline is now perfectly synced.');
    } catch (error) {
      console.error(error);
      Alert.alert('Sync Interrupted', 'Data saved locally, but cloud sync is currently offline.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#FDFDFF', '#F3F4FF', '#EBEBFF']} style={styles.background} />
      
      <View style={styles.auraHeader}>
        <Text style={styles.headerTitle}>Identity</Text>
        <Text style={styles.headerSubtitle}>Personalize your AI career profile</Text>
      </View>

      <View style={styles.inputContainer}>
        {/* Name Input */}
        <View style={styles.auraField}>
          <View style={styles.fieldHeader}>
            <MaterialCommunityIcons name="account-circle-outline" size={18} color="#6366F1" />
            <Text style={styles.fieldLabel}>Full Name</Text>
          </View>
          <TextInput
            style={styles.auraInput}
            value={name}
            onChangeText={setName}
            placeholder="How should Vera address you?"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Master CV */}
        <View style={styles.auraField}>
          <View style={styles.fieldHeader}>
            <MaterialCommunityIcons name="file-document-outline" size={18} color="#6366F1" />
            <Text style={styles.fieldLabel}>Master CV Baseline</Text>
            <TouchableOpacity style={styles.uploadMiniBtn} onPress={handleUploadCV} disabled={uploading}>
              {uploading ? <ActivityIndicator size="small" color="#6366F1" /> : (
                <MaterialCommunityIcons name="upload" size={16} color="#6366F1" />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.auraTextAreaBox}>
            <TextInput
              style={styles.auraTextArea}
              value={cv}
              onChangeText={setCv}
              placeholder="Paste your core CV text here..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Career Preferences */}
        <View style={styles.auraField}>
          <View style={styles.fieldHeader}>
            <MaterialCommunityIcons name="tune-variant" size={18} color="#6366F1" />
            <Text style={styles.fieldLabel}>Career Preferences</Text>
          </View>
          <View style={styles.auraTextAreaBox}>
            <TextInput
              style={[styles.auraTextArea, { height: 120 }]}
              value={prefs}
              onChangeText={setPrefs}
              placeholder="Sponsorship, Salary range, Stack preferences..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Vera AI Settings */}
        <View style={styles.auraField}>
          <View style={styles.fieldHeader}>
            <MaterialCommunityIcons name="robot-outline" size={18} color="#6366F1" />
            <Text style={styles.fieldLabel}>Vera Superpowers</Text>
          </View>
          <View style={styles.auraTextAreaBox}>
            <List.Item
              title="Autonomous Mode"
              description="Vera scans for new jobs daily while you sleep."
              right={() => <Switch value={isAutonomous} onValueChange={setIsAutonomous} color="#6366F1" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDesc}
            />
            <View style={styles.cardDivider} />
            <List.Item
              title="Auto-Tailoring"
              description="Automatically tailor your CV for high-fit roles."
              right={() => <Switch value={autoTailor} onValueChange={setAutoTailor} color="#6366F1" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDesc}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleSave} 
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.saveGradient}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Aura Profile</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.securityBox}>
          <MaterialCommunityIcons name="shield-check-outline" size={14} color="#94A3B8" />
          <Text style={styles.securityText}>Your data is protected and private.</Text>
        </View>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  scrollContent: { padding: 24 },
  auraHeader: { marginTop: 40, marginBottom: 30 },
  headerTitle: { fontSize: 42, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  headerSubtitle: { fontSize: 16, color: '#64748B', fontWeight: '500' },
  inputContainer: { gap: 24 },
  auraField: { backgroundColor: 'transparent' },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8, flex: 1 },
  uploadMiniBtn: { padding: 8, backgroundColor: '#F3F5FF', borderRadius: 10, borderWidth: 1, borderColor: '#EEF2FF' },
  auraInput: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, fontSize: 16, color: '#0F172A', borderWidth: 1, borderColor: '#EEF2FF', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  auraTextAreaBox: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#EEF2FF', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  auraTextArea: { height: 250, fontSize: 15, color: '#0F172A', lineHeight: 22 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  listDesc: { fontSize: 12, color: '#64748B' },
  cardDivider: { height: 1, backgroundColor: '#F1F3FF', marginHorizontal: 15 },
  saveBtn: { height: 64, borderRadius: 22, overflow: 'hidden', marginTop: 10, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  saveGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  securityBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  securityText: { fontSize: 12, color: '#94A3B8', marginLeft: 6, fontWeight: '500' },
});
