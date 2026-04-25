import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useStore } from '@/store/useStore';
import { useRouter } from 'expo-router';
import { evaluateJob } from '@/services/api';

export default function AddJobModal() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, addJob } = useStore();
  const router = useRouter();

  const handleAddJob = async () => {
    if (!url) return;
    if (!user?.baseCV) {
      Alert.alert('Profile Incomplete', 'Please add your CV in the Profile tab first.');
      return;
    }

    setLoading(true);
    try {
      const result = await evaluateJob(
        url,
        user.baseCV,
        user.preferences
      );

      const newJob = {
        id: Math.random().toString(36).substring(7),
        company: result.company,
        title: result.title,
        description: result.description,
        url: url,
        score: result.evaluation.score,
        evaluation: result.evaluation,
        status: 'evaluating' as const,
        createdAt: Date.now(),
      };

      addJob(newJob);
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to scrape or evaluate the job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add New Job</Text>
      <Text style={styles.subtitle}>Paste a job URL from Greenhouse, Lever, or Ashby</Text>
      
      <TextInput
        style={styles.input}
        placeholder="https://jobs.lever.co/company/role"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        keyboardType="url"
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleAddJob}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Scrape & Evaluate</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A0CFFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
