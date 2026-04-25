import React, { useState, useMemo } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useStore } from '@/store/useStore';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';

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
      <TouchableOpacity style={styles.jobCard} activeOpacity={0.9}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.companyBadge}>
              <Text style={styles.company}>{item.company}</Text>
            </View>
            <LinearGradient
              colors={getScoreColors(item.score)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreBadge}
            >
              <Text style={styles.scoreText}>{item.score}</Text>
            </LinearGradient>
          </View>
          
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.background} />
      
      {/* Filter Tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map((f) => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>
                {f === 'all' ? 'All Jobs' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <FontAwesome name="briefcase" size={60} color="#CBD5E1" />
          </View>
          <Text style={styles.emptyTitle}>
            {activeFilter === 'all' ? 'Your pipeline is empty' : `No jobs marked as \${activeFilter}`}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeFilter === 'all' 
              ? 'Scrape your first job to see the AI evaluation magic.' 
              : 'Try changing the filter or move jobs to this status.'}
          </Text>
          {activeFilter === 'all' && (
            <Link href="/modal" asChild>
              <TouchableOpacity style={styles.addButton}>
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  style={styles.addButtonGradient}
                >
                  <Text style={styles.addButtonText}>Add Your First Job</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Link>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
          }
        />
      )}
    </View>
  );
}

const getScoreColors = (score: string): [string, string] => {
  switch (score) {
    case 'A': return ['#10B981', '#059669'];
    case 'B': return ['#8BC34A', '#689F38'];
    case 'C': return ['#F59E0B', '#D97706'];
    case 'D': return ['#EF4444', '#DC2626'];
    case 'F': return ['#475569', '#1E293B'];
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
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  filterWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#F8FAFC',
  },
  filterTabActive: {
    backgroundColor: '#EEF2FF',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#4F46E5',
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  companyBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  company: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scoreText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  date: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  addButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
