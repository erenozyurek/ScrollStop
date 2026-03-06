import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Card } from '../../components/common';
import { useVideoJobs, type TrackedVideoJob } from '../../context/VideoJobsContext';

const FILTERS = ['All', 'Completed', 'Processing', 'Failed'] as const;
type FilterType = (typeof FILTERS)[number];

type ProjectStatus = 'completed' | 'processing' | 'failed';

const mapStatus = (status: TrackedVideoJob['status']): ProjectStatus => {
  if (status === 'success') return 'completed';
  if (status === 'error') return 'failed';
  return 'processing';
};

const formatRelativeDate = (timestampMs: number): string => {
  const now = Date.now();
  const diffMs = Math.max(0, now - timestampMs);
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestampMs).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const ProjectsScreen = ({ navigation }: any) => {
  const { jobs } = useVideoJobs();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const filteredProjects = useMemo(() => {
    const normalized = jobs
      .map(job => ({
        ...job,
        mappedStatus: mapStatus(job.status),
      }))
      .sort((a, b) => b.createdAtMs - a.createdAtMs);

    if (activeFilter === 'All') {
      return normalized;
    }

    const expected = activeFilter.toLowerCase();
    return normalized.filter(project => project.mappedStatus === expected);
  }, [activeFilter, jobs]);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'processing':
        return Colors.warning;
      case 'failed':
        return Colors.error;
      default:
        return Colors.textTertiary;
    }
  };

  const renderProject = ({ item }: { item: TrackedVideoJob & { mappedStatus: ProjectStatus } }) => (
    <Card
      style={styles.projectCard}
      onPress={() =>
        navigation.navigate('Preview', {
          projectId: item.jobId,
          videoUrl: item.videoUrl,
          status: item.status,
          error: item.error,
        })
      }>
      <View style={styles.projectRow}>
        <View style={styles.thumbnail}>
          <Text style={styles.thumbnailIcon}>🎬</Text>
        </View>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{item.productName || 'Video Ad'}</Text>
          <View style={styles.projectMeta}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.mappedStatus) },
              ]}
            />
            <Text style={styles.statusText}>
              {item.mappedStatus.charAt(0).toUpperCase() + item.mappedStatus.slice(1)}
            </Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.metaText}>{formatRelativeDate(item.createdAtMs)}</Text>
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Projects</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filteredProjects.length}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={[
              styles.filterChip,
              activeFilter === filter && styles.filterChipActive,
            ]}>
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredProjects}
        renderItem={renderProject}
        keyExtractor={item => item.jobId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} projects</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  filters: {
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  filterTextActive: {
    color: Colors.black,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  projectCard: {
    padding: Spacing.md,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailIcon: {
    fontSize: 24,
  },
  projectInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  metaSeparator: {
    fontSize: 12,
    color: Colors.textDisabled,
    marginHorizontal: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  arrow: {
    fontSize: 24,
    color: Colors.textDisabled,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});
