import React, { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useStore } from '@/store/useStore';

export default function ProfileScreen() {
  const { user, setUser } = useStore();
  const [name, setName] = useState(user?.name || '');
  const [cv, setCv] = useState(user?.baseCV || '');
  const [prefs, setPrefs] = useState(user?.preferences || '');

  const handleSave = () => {
    setUser({
      id: user?.id || '1', // Default for now
      name,
      email: user?.email || '',
      baseCV: cv,
      preferences: prefs,
    });
    Alert.alert('Success', 'Profile updated successfully');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Base CV (Text)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={cv}
          onChangeText={setCv}
          placeholder="Paste your CV text here..."
          multiline
          numberOfLines={10}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Career Preferences</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={prefs}
          onChangeText={setPrefs}
          placeholder="E.g. Remote only, Min $150k, Tech stack: React, Node..."
          multiline
          numberOfLines={5}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
