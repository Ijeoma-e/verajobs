import React, { useState, useMemo } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions, ScrollView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useStore } from '@/store/useStore';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const FILTERS = ['all', 'evaluating', 'applied', 'interviewing', 'offered', 'rejected'];

export default function PipelineScreen() {
  const { jobs } = useStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredJobs = useMemo(() => {
    if (activeFilter === 'all') return jobs;
    return jobs.filter(j => j.status === activeFilter);
  }, [jobs, activeFilter]);

  const renderItem = ({ item }: { item: any }) => (
    <Link href={`/job/${item.id}`} asChild>
      <TouchableOpacity style={styles.cardContainer} activeOpacity={0.7}>
        <View style={styles.auraCard}>
          <View style={styles.cardHeader}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoInitial}>{item.company.charAt(0)}</Text>
            </View>
            <View style={styles.headerTitleArea}>
              <Text style={styles.companyName} numberOfLines={1}>{item.company}</Text>
              <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreBg(item.score) }]}>
              <Text style={[styles.scoreText, { color: getScoreColor(item.score) }]}>{item.score}</Text>
            </View>
          </View>
          
          <View style={styles.cardDivider} />
          
          <View style={styles.cardFooter}>
            <View style={[styles.statusPill, { backgroundColor: getStatusBg(item.status) }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={[styles.statusLabel, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFDFF', '#F3F4FF', '#EBEBFF']} style={styles.background} pointerEvents="none" />
      
      {/* Aura Header */}
      <View style={styles.auraHeader}>
        <Text style={styles.headerGreeting}>Your Career</Text>
        <Text style={styles.headerTitle}>Pipeline</Text>
      </View>

      {/* Modern Filter Scroll */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map((f) => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient colors={['#FFFFFF', '#F9FAFF']} style={styles.emptyAura}>
            <MaterialCommunityIcons name="star-four-points" size={64} color="#6366F1" />
            <Text style={styles.emptyText}>Find your next aura job</Text>
            <Link href="/modal" asChild>
              <TouchableOpacity style={styles.emptyAddButton}>
                <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.gradientBtn}>
                  <Text style={styles.btnText}>Add Job</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Link>
          </LinearGradient>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
        />
      )}

      {/* Floating Add Button */}
      <Link href="/modal" asChild>
        <TouchableOpacity style={styles.fab}>
          <LinearGradient colors={['#6366F1', '#A855F7']} style={styles.fabGradient}>
            <FontAwesome name="plus" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

// Design Helpers
const getScoreBg = (score: string) => {
  switch (score) {
    case 'A': return 'rgba(16, 185, 129, 0.1)';
    case 'B': return 'rgba(139, 195, 74, 0.1)';
    case 'C': return 'rgba(245, 158, 11, 0.1)';
    case 'D': return 'rgba(239, 68, 68, 0.1)';
    default: return 'rgba(148, 163, 184, 0.1)';
  }
};

const getScoreColor = (score: string) => {
  switch (score) {
    case 'A': return '#10B981';
    case 'B': return '#8BC34A';
    case 'C': return '#F59E0B';
    case 'D': return '#EF4444';
    default: return '#64748B';
  }
};

const getStatusBg = (status: string) => {
  switch (status) {
    case 'applied': return 'rgba(79, 106, 210, 0.08)';
    case 'interviewing': return 'rgba(168, 85, 247, 0.08)';
    case 'offered': return 'rgba(34, 197, 94, 0.08)';
    case 'rejected': return 'rgba(239, 68, 68, 0.08)';
    default: return 'rgba(99, 102, 241, 0.08)';
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
  auraHeader: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: 'transparent' },
  headerGreeting: { fontSize: 16, fontWeight: '600', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 2 },
  headerTitle: { fontSize: 42, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  filterSection: { marginBottom: 10, backgroundColor: 'transparent' },
  filterScroll: { paddingHorizontal: 24, gap: 10 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF0FF' },
  filterChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  filterChipText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF' },
  listContent: { padding: 24, paddingTop: 10, paddingBottom: 100 },
  cardContainer: { marginBottom: 16 },
  auraCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 20, borderWidth: 1, borderColor: '#F0F2FF', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' },
  logoCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3F5FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEF0FF' },
  logoInitial: { fontSize: 20, fontWeight: '800', color: '#6366F1' },
  headerTitleArea: { flex: 1, marginLeft: 15, backgroundColor: 'transparent' },
  companyName: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  jobTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  scoreBadge: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  scoreText: { fontSize: 18, fontWeight: '900' },
  cardDivider: { height: 1, backgroundColor: '#F1F3FF', marginVertical: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusLabel: { fontSize: 12, fontWeight: '800' },
  dateText: { fontSize: 12, fontWeight: '600', color: '#CBD5E1' },
  emptyContainer: { flex: 1, padding: 40, justifyContent: 'center' },
  emptyAura: { borderRadius: 40, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#EEF0FF' },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#94A3B8', marginTop: 20, marginBottom: 30 },
  emptyAddButton: { width: '100%', height: 60, borderRadius: 20, overflow: 'hidden' },
  gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  fabGradient: { flex: 1, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
});
