import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions, TextInput, Modal, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, Link, useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';
import { getTailoredCV, evaluateJob } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const STATUSES = ['evaluating', 'applied', 'interviewing', 'offered', 'rejected'];

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { jobs, user, updateJob, removeJob } = useStore();
  const job = jobs.find((j) => j.id === id);
  const [loading, setLoading] = useState(false);
  const [reevaluating, setReevaluating] = useState(false);
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
    if (Platform.OS === 'web') alert('Notes Saved');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Pipeline',
      'Are you sure you want to remove this job from your pipeline?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            removeJob(job.id);
            router.back();
          } 
        }
      ]
    );
  };

  const handleReevaluate = async () => {
    if (!user?.baseCV) {
      Alert.alert('Aura Missing', 'Complete your profile first.');
      return;
    }
    setReevaluating(true);
    try {
      const result = await evaluateJob(job.url, user.baseCV, user.preferences);
      updateJob(job.id, {
        score: result.evaluation.score,
        evaluation: result.evaluation
      });
      Platform.OS === 'web' ? alert('Aura Refined: Job re-evaluated.') : Alert.alert('Aura Refined', 'Job fit score updated with your latest profile.');
    } catch (error) {
      console.error(error);
      Alert.alert('Re-evaluation Failed', 'Could not refresh the fit score.');
    } finally {
      setReevaluating(false);
    }
  };

  const handleTailorCV = async () => {
    if (!user?.baseCV) {
      Alert.alert('Aura Missing', 'Complete your profile first.');
      return;
    }
    setLoading(true);
    try {
      const tailored = await getTailoredCV(job.description, user.baseCV);
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'DM Sans', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.5; }
              .header { border-bottom: 2px solid #6366F1; padding-bottom: 20px; margin-bottom: 30px; }
              .name { font-size: 32px; font-weight: 700; color: #000; margin: 0; }
              .contact { color: #666; font-size: 14px; margin-top: 5px; }
              .section { margin-bottom: 25px; }
              .section-title { font-size: 14px; font-weight: 700; color: #6366F1; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
              .summary { font-size: 15px; margin-bottom: 20px; }
              .exp-item { margin-bottom: 20px; }
              .exp-header { display: flex; justify-content: space-between; font-weight: 700; }
              .exp-company { color: #444; }
              .exp-duration { color: #888; font-size: 13px; }
              .exp-role { font-weight: 700; font-size: 16px; margin: 4px 0; }
              .bullets { margin-top: 8px; padding-left: 20px; }
              .bullet { margin-bottom: 5px; font-size: 14px; }
              .skills { display: flex; flex-wrap: wrap; gap: 8px; }
              .skill-tag { background: #f0f2ff; color: #6366F1; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 500; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="name">${tailored.personal_info.name}</h1>
              <div class="contact">${tailored.personal_info.email} | ${tailored.personal_info.phone}</div>
            </div>

            <div class="section">
              <div class="section-title">Professional Summary</div>
              <div class="summary">${tailored.summary}</div>
            </div>

            <div class="section">
              <div class="section-title">Experience</div>
              ${tailored.experience.map((exp: any) => `
                <div class="exp-item">
                  <div class="exp-header">
                    <span class="exp-role">${exp.role}</span>
                    <span class="exp-duration">${exp.duration}</span>
                  </div>
                  <div class="exp-company">${exp.company}</div>
                  <ul class="bullets">
                    ${exp.bullets.map((b: string) => `<li class="bullet">${b}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>

            <div class="section">
              <div class="section-title">Technical Skills</div>
              <div class="skills">
                ${tailored.skills.map((s: string) => `<span class="skill-tag">${s}</span>`).join('')}
              </div>
            </div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error(error);
      Alert.alert('Aura Error', 'Failed to generate tailored CV.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#FDFDFF', '#F3F4FF', '#EBEBFF']} style={styles.background} />
      
      {/* Aura Header Card */}
      <View style={styles.auraHeaderCard}>
        <View style={styles.auraCardHeader}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>{job.company.charAt(0)}</Text>
          </View>
          <View style={styles.auraScoreArea}>
             <TouchableOpacity onPress={handleReevaluate} disabled={reevaluating}>
               <LinearGradient colors={getScoreColors(job.score)} style={styles.auraScoreBadge}>
                  {reevaluating ? <ActivityIndicator size="small" color="#fff" /> : (
                    <Text style={styles.auraScoreValue}>{job.score}</Text>
                  )}
               </LinearGradient>
             </TouchableOpacity>
             <Text style={styles.auraScoreLabel}>Fit Score</Text>
          </View>
        </View>
        
        <Text style={styles.auraJobTitle}>{job.title}</Text>
        <Text style={styles.auraCompanyName}>{job.company}</Text>

        <TouchableOpacity style={styles.auraStatusBtn} onPress={() => setShowStatusModal(true)}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(job.status) }]} />
          <Text style={[styles.statusLabel, { color: getStatusColor(job.status) }]}>{job.status.toUpperCase()}</Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Action Hub */}
      <View style={styles.actionHub}>
         <TouchableOpacity style={styles.primaryAction} onPress={handleTailorCV} disabled={loading}>
            <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.gradientBtn}>
               {loading ? <ActivityIndicator color="#fff" /> : (
                 <>
                  <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" />
                  <Text style={styles.btnText}>Tailor CV</Text>
                 </>
               )}
            </LinearGradient>
         </TouchableOpacity>
         
         <Link href={`/job/prep/${job.id}`} asChild>
            <TouchableOpacity style={styles.secondaryAction}>
               <MaterialCommunityIcons name="lightning-bolt" size={20} color="#6366F1" />
               <Text style={styles.secondaryBtnText}>Prep</Text>
            </TouchableOpacity>
         </Link>
      </View>

      {/* Analysis Grid */}
      <View style={styles.section}>
         <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="auto-fix" size={18} color="#6366F1" />
            <Text style={styles.sectionTitle}>Aura Analysis</Text>
         </View>
         <View style={styles.analysisCard}>
            <Text style={styles.analysisText}>{job.evaluation.fit_summary}</Text>
         </View>
      </View>

      {/* Grid: Green & Red Flags */}
      <View style={styles.flagsGrid}>
         <View style={[styles.flagColumn, { marginRight: 8 }]}>
            <Text style={styles.flagTitle}>PROS</Text>
            {job.evaluation.green_flags.map((f: string, i: number) => (
              <View key={i} style={styles.flagPill}><Text style={styles.flagText}>• {f}</Text></View>
            ))}
         </View>
         <View style={[styles.flagColumn, { marginLeft: 8 }]}>
            <Text style={styles.flagTitle}>CONS</Text>
            {job.evaluation.red_flags.map((f: string, i: number) => (
              <View key={i} style={styles.flagPillRed}><Text style={styles.flagTextRed}>• {f}</Text></View>
            ))}
         </View>
      </View>

      {/* Management */}
      <View style={styles.section}>
         <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="notebook-outline" size={18} color="#6366F1" />
            <Text style={styles.sectionTitle}>Process Notes</Text>
         </View>
         <View style={styles.notesCard}>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Recruiter names, interview dates, thoughts..."
              value={notes}
              onChangeText={setNotes}
              onBlur={handleSaveNotes}
              placeholderTextColor="#94A3B8"
            />
         </View>
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
        <Text style={styles.deleteBtnText}>Delete Pipeline</Text>
      </TouchableOpacity>

      <View style={{ height: 60 }} />

      {/* Status Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowStatusModal(false)} activeOpacity={1}>
           <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Update Process Status</Text>
              {STATUSES.map((s) => (
                <TouchableOpacity key={s} style={[styles.modalOption, job.status === s && styles.modalOptionActive]} onPress={() => handleUpdateStatus(s)}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(s) }]} />
                  <Text style={[styles.modalOptionText, job.status === s && styles.modalOptionTextActive]}>{s.toUpperCase()}</Text>
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
    case 'applied': return '#4F6AD2';
    case 'interviewing': return '#A855F7';
    case 'offered': return '#22C55E';
    case 'rejected': return '#EF4444';
    default: return '#6366F1';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  scrollContent: { padding: 24, paddingTop: 60 },
  auraHeaderCard: { backgroundColor: '#FFFFFF', borderRadius: 40, padding: 30, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.08, shadowRadius: 25, elevation: 10, borderWidth: 1, borderColor: '#F0F2FF' },
  auraCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: 'transparent', marginBottom: 25 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F5FF', justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 28, fontWeight: '900', color: '#6366F1' },
  auraScoreArea: { alignItems: 'center', backgroundColor: 'transparent' },
  auraScoreBadge: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  auraScoreValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
  auraScoreLabel: { fontSize: 10, fontWeight: '800', color: '#CBD5E1', textTransform: 'uppercase' },
  auraJobTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  auraCompanyName: { fontSize: 16, fontWeight: '600', color: '#64748B', marginTop: 5, marginBottom: 20 },
  auraStatusBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#EEF2FF' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusLabel: { fontSize: 12, fontWeight: '800', marginRight: 5 },
  actionHub: { flexDirection: 'row', marginTop: 24, gap: 12, backgroundColor: 'transparent' },
  primaryAction: { flex: 2, height: 60, borderRadius: 20, overflow: 'hidden', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  gradientBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  secondaryAction: { flex: 1, height: 60, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0F2FF', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  secondaryBtnText: { fontSize: 16, fontWeight: '800', color: '#6366F1' },
  section: { marginTop: 32, backgroundColor: 'transparent' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: 'transparent' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 10 },
  analysisCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F0F2FF' },
  analysisText: { fontSize: 16, lineHeight: 24, color: '#334155' },
  flagsGrid: { flexDirection: 'row', marginTop: 24, backgroundColor: 'transparent' },
  flagColumn: { flex: 1, backgroundColor: 'transparent' },
  flagTitle: { fontSize: 11, fontWeight: '900', color: '#CBD5E1', marginBottom: 10, letterSpacing: 1 },
  flagPill: { backgroundColor: 'rgba(34, 197, 94, 0.05)', padding: 10, borderRadius: 12, marginBottom: 8 },
  flagText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  flagPillRed: { backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: 10, borderRadius: 12, marginBottom: 8 },
  flagTextRed: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  notesCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F0F2FF' },
  notesInput: { fontSize: 15, color: '#334155', minHeight: 120, textAlignVertical: 'top' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
  modalHandle: { width: 40, height: 5, backgroundColor: '#EEF2FF', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 25, textAlign: 'center' },
  modalOption: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, marginBottom: 10, backgroundColor: '#F9FAFF' },
  modalOptionActive: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#6366F1' },
  modalOptionText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  modalOptionTextActive: { color: '#6366F1' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 15, borderRadius: 20, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWeight: 1, borderColor: 'rgba(239, 68, 68, 0.1)', gap: 8 },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '800' },
});
