import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';
import { getTailoredCV } from '@/services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams();
  const { jobs, user } = useStore();
  const job = jobs.find((j) => j.id === id);
  const [loading, setLoading] = useState(false);

  if (!job) return <Text>Job not found</Text>;

  const handleTailorCV = async () => {
    if (!user?.baseCV) return;
    setLoading(true);
    try {
      const tailoredData = await getTailoredCV(job.description, user.baseCV);
      
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 20px; line-height: 1.6; }
              h1 { color: #333; margin-bottom: 5px; }
              h2 { color: #666; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              .section { margin-bottom: 20px; }
              .item { margin-bottom: 15px; }
              .title { font-weight: bold; }
              .meta { font-style: italic; color: #777; }
            </style>
          </head>
          <body>
            <h1>\${tailoredData.personal_info.name}</h1>
            <p>\${tailoredData.personal_info.email} | \${tailoredData.personal_info.phone || ''}</p>
            
            <div class="section">
              <h2>Summary</h2>
              <p>\${tailoredData.summary}</p>
            </div>

            <div class="section">
              <h2>Experience</h2>
              \${tailoredData.experience.map((exp: any) => `
                <div class="item">
                  <div class="title">\${exp.role} at \${exp.company}</div>
                  <div class="meta">\${exp.duration}</div>
                  <ul>
                    \${exp.bullets.map((b: string) => `<li>\${b}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>

            <div class="section">
              <h2>Skills</h2>
              <p>\${tailoredData.skills.join(', ')}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to tailor CV. Please check your API keys.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.company}>{job.company}</Text>
        <Text style={styles.title}>{job.title}</Text>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(job.score) }]}>
          <Text style={styles.scoreText}>{job.score}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fit Summary</Text>
        <Text style={styles.text}>{job.evaluation.fit_summary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Green Flags</Text>
        {job.evaluation.green_flags.map((flag: string, i: number) => (
          <Text key={i} style={styles.bullet}>• \${flag}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Red Flags</Text>
        {job.evaluation.red_flags.map((flag: string, i: number) => (
          <Text key={i} style={styles.bullet}>• \${flag}</Text>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleTailorCV} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Tailor & Export CV (PDF)</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const getScoreColor = (score: string) => {
  switch (score) {
    case 'A': return '#4CAF50';
    case 'B': return '#8BC34A';
    case 'C': return '#FFC107';
    case 'D': return '#FF9800';
    case 'F': return '#F44336';
    default: return '#9E9E9E';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  company: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  scoreBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  scoreText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
