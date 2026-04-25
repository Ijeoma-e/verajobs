import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions, TextInput, Modal } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams } from 'expo-router';
import { useStore } from '@/store/useStore';
import { getTailoredCV } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const STATUSES = ['evaluating', 'applied', 'interviewing', 'offered', 'rejected'];

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams();
  const { jobs, user, updateJob } = useStore();
  const job = jobs.find((j) => j.id === id);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(job?.notes || '');
  const [showStatusModal, setShowStatusModal] = useState(false);

  if (!job) return <View style={styles.container}><Text>Job not found</Text></View>;

  const handleUpdateStatus = (newStatus: any) => {
    updateJob(job.id, { 
      status: newStatus,
      applicationDate: newStatus === 'applied' && !job.applicationDate ? Date.now() : job.applicationDate
    });
    setShowStatusModal(false);
  };

  const handleSaveNotes = () => {
    updateJob(job.id, { notes });
    Alert.alert('Saved', 'Notes updated successfully.');
  };

  const handleTailorCV = async () => {
    if (!user?.baseCV) {
      Alert.alert('Missing Profile', 'Please complete your profile first.');
      return;
    }
    setLoading(true);
    try {
      const tailoredData = await getTailoredCV(job.description, user.baseCV);
      
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 40px; line-height: 1.5; color: #334155; }
              h1 { color: #0F172A; font-size: 28px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; }
              .contact { font-size: 14px; color: #64748B; margin-bottom: 30px; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; }
              h2 { color: #4F46E5; font-size: 18px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 30px; text-transform: uppercase; }
              .summary { font-size: 14px; margin-bottom: 20px; font-style: italic; }
              .experience-item { margin-bottom: 25px; }
              .role-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .role { font-weight: 800; color: #1E293B; font-size: 16px; }
              .duration { color: #94A3B8; font-size: 13px; }
              .company-name { color: #6366F1; font-weight: 600; font-size: 14px; margin-bottom: 8px; }
              ul { padding-left: 20px; margin-top: 8px; }
              li { margin-bottom: 6px; font-size: 13.5px; }
              .skills-container { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
              .skill-tag { background: #F1F5F9; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
            </style>
          </head>
          <body>
            <h1>${tailoredData.personal_info.name}</h1>
            <div class="contact">
              ${tailoredData.personal_info.email} &nbsp;•&nbsp; ${tailoredData.personal_info.phone || ''}
            </div>
            
            <div class="section">
              <h2>Professional Summary</h2>
              <div class="summary">${tailoredData.summary}</div>
            </div>

            <div class="section">
              <h2>Professional Experience</h2>
              ${tailoredData.experience.map((exp: any) => `
                <div class="experience-item">
                  <div class="role-header">
                    <span class="role">${exp.role}</span>
                    <span class="duration">${exp.duration}</span>
                  </div>
                  <div class="company-name">${exp.company}</div>
                  <ul>
                    ${exp.bullets.map((b: string) => `<li>${b}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>

            <div class="section">
              <h2>Key Expertise</h2>
              <div class="skills-container">
                ${tailoredData.skills.map((s: string) => `<span class="skill-tag">${s}</span>`).join('')}
              </div>
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <LinearGradient colors={['#EEF2FF', '#FFFFFF']} style={styles.headerCard}>
        <View style={styles.companyRow}>
          <View style={styles.companyBadge}>
            <Text style={styles.companyText}>{job.company}</Text>
          </View>
          <LinearGradient
            colors={getScoreColors(job.score)}
            style={styles.scoreBadge}
          >
            <Text style={styles.scoreValue}>{job.score}</Text>
          </LinearGradient>
        </View>
        <Text style={styles.jobTitle}>{job.title}</Text>
        
        <TouchableOpacity style={styles.statusChangeBtn} onPress={() => setShowStatusModal(true)}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(job.status) }]} />
          <Text style={styles.statusText}>{job.status.toUpperCase()}</Text>
          <FontAwesome name="caret-down" size={12} color="#64748B" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Application Management */}
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="tasks" size={18} color="#4F46E5" />
          <Text style={styles.sectionTitle}>Application Management</Text>
        </View>
        <View style={styles.managementCard}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder="Add internal notes about this application..."
            value={notes}
            onChangeText={setNotes}
            onBlur={handleSaveNotes}
          />
          {job.applicationDate && (
            <View style={styles.dateInfo}>
              <FontAwesome name="calendar" size={12} color="#94A3B8" />
              <Text style={styles.dateText}>Applied on: {new Date(job.applicationDate).toLocaleDateString()}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="star" size={18} color="#4F46E5" />
          <Text style={styles.sectionTitle}>Fit Analysis</Text>
        </View>
        <View style={styles.analysisCard}>
          <Text style={styles.fitSummary}>{job.evaluation.fit_summary}</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={[styles.contentSection, { flex: 1, marginRight: 8 }]}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="check-circle" size={18} color="#10B981" />
            <Text style={styles.sectionTitle}>Green Flags</Text>
          </View>
          {job.evaluation.green_flags.map((flag: string, i: number) => (
            <View key={i} style={styles.flagItem}>
              <Text style={styles.flagText}>• {flag}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.contentSection, { flex: 1, marginLeft: 8 }]}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="exclamation-circle" size={18} color="#EF4444" />
            <Text style={styles.sectionTitle}>Red Flags</Text>
          </View>
          {job.evaluation.red_flags.map((flag: string, i: number) => (
            <View key={i} style={styles.flagItem}>
              <Text style={styles.flagText}>• {flag}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.mainButton} 
        onPress={handleTailorCV} 
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesome name="file-pdf-o" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.buttonText}>Tailor & Export CV</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Link href={`/job/prep/${job.id}`} asChild>
        <TouchableOpacity style={styles.prepButton} activeOpacity={0.8}>
          <FontAwesome name="bolt" size={18} color="#4F46E5" style={{ marginRight: 10 }} />
          <Text style={styles.prepButtonText}>AI Interview Playbook</Text>
        </TouchableOpacity>
      </Link>
      <View style={{ height: 40 }} />

      <Modal visible={showStatusModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowStatusModal(false)}>
          <View style={styles.statusModal}>
            <Text style={styles.modalTitle}>Update Status</Text>
            {STATUSES.map((s) => (
              <TouchableOpacity 
                key={s} 
                style={[styles.statusOption, job.status === s && styles.statusOptionActive]}
                onPress={() => handleUpdateStatus(s)}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(s) }]} />
                <Text style={[styles.statusOptionText, job.status === s && styles.statusOptionTextActive]}>
                  {s.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const getScoreColors = (score: string): [string, string] => {
  switch (score) {
    case 'A': return ['#10B981', '#059669'];
    case 'B': return ['#8BC34A', '#689F38'];
    case 'C': return ['#F59E0B', '#D97706'];
    case 'D': return ['#EF4444', '#DC2626'];
    default: return ['#94A3B8', '#64748B'];
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'applied': return '#3B82F6';
    case 'interviewing': return '#8B5CF6';
    case 'offered': return '#10B981';
    case 'rejected': return '#EF4444';
    default: return '#6366F1';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
  },
  headerCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  companyBadge: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  companyText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 32,
    marginBottom: 16,
  },
  statusChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  contentSection: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  managementCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  notesInput: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 6,
    fontWeight: '600',
  },
  analysisCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fitSummary: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
  gridRow: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  flagItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  flagText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  mainButton: {
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  prepButton: {
    height: 60,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#EEF2FF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  prepButtonText: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  statusModal: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  statusOptionActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  statusOptionTextActive: {
    color: '#4F46E5',
  },
});
