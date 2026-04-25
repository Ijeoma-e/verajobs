import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams } from 'expo-router';
import { useStore } from '@/store/useStore';
import { matchStories } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';

export default function InterviewPrepScreen() {
  const { id } = useLocalSearchParams();
  const { jobs, stories } = useStore();
  const job = jobs.find((j) => j.id === id);
  const [loading, setLoading] = useState(true);
  const [prepData, setPrepData] = useState<any>(null);

  useEffect(() => {
    async function loadPrep() {
      if (!job || stories.length === 0) {
        setLoading(false);
        return;
      }
      try {
        const result = await matchStories(job.description, stories);
        setPrepData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadPrep();
  }, [id]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={styles.loadingText}>Vera is analyzing your story bank...</Text>
    </View>
  );

  if (!job) return <View style={styles.center}><Text>Job not found</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Interview Playbook</Text>
        <Text style={styles.subtitle}>{job.company} • {job.title}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="question-circle" size={18} color="#4F46E5" />
          <Text style={styles.sectionTitle}>Likely Questions</Text>
        </View>
        {prepData?.interview_q.map((item: any, i: number) => {
          const matchedStory = stories.find(s => s.id === item.recommendedStoryId);
          return (
            <View key={i} style={styles.qCard}>
              <Text style={styles.question}>"{item.question}"</Text>
              <View style={styles.matchBadge}>
                <Text style={styles.matchText}>Use Story: {matchedStory?.title || 'None matched'}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="lightbulb-o" size={18} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Story Strategy</Text>
        </View>
        {prepData?.recommendations.map((rec: any, i: number) => {
          const story = stories.find(s => s.id === rec.storyId);
          return (
            <View key={i} style={styles.recCard}>
              <Text style={styles.recTitle}>{story?.title}</Text>
              <Text style={styles.recReason}>{rec.reason}</Text>
            </View>
          );
        })}
      </View>

      {stories.length === 0 && (
        <View style={styles.warningCard}>
          <FontAwesome name="warning" size={24} color="#F59E0B" />
          <Text style={styles.warningText}>Your Story Bank is empty. Add STAR+R stories in the 'Vera' tab to get personalized interview prep.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 20, fontSize: 16, color: '#64748B', textAlign: 'center' },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 4 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginLeft: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  qCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  question: { fontSize: 16, fontWeight: '700', color: '#1E293B', fontStyle: 'italic', marginBottom: 12 },
  matchBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  matchText: { color: '#4F46E5', fontSize: 12, fontWeight: '700' },
  recCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  recTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  recReason: { fontSize: 14, color: '#475569', lineHeight: 20 },
  warningCard: { backgroundColor: '#FFFBEB', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FEF3C7' },
  warningText: { flex: 1, marginLeft: 15, color: '#92400E', fontSize: 14, lineHeight: 20 }
});
