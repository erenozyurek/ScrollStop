import React, { useState, useMemo } from 'react';
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

const FILTERS = ['All', 'Completed', 'Processing', 'Failed'] as const;
type FilterType = (typeof FILTERS)[number];

const PROJECTS = [
  {
    id: '1',
    name: 'Blue Light Glasses Ad',
    status: 'completed',
    date: '2 hours ago',
    duration: '15s',
  },
  {
    id: '2',
    name: 'Yoga Mat Promo',
    status: 'processing',
    date: '5 hours ago',
    duration: '30s',
  },
  {
    id: '3',
    name: 'Phone Case TikTok',
    status: 'completed',
    date: 'Yesterday',
    duration: '15s',
  },
  {
    id: '4',
    name: 'Wireless Earbuds Review',
    status: 'completed',
    date: '2 days ago',
    duration: '30s',
  },
  {
    id: '5',
    name: 'Skincare Routine',
    status: 'completed',
    date: '3 days ago',
    duration: '60s',
  },
  {
    id: '6',
    name: 'Fitness Band Promo',
    status: 'failed',
    date: '4 days ago',
    duration: '15s',
  },
];

export const ProjectsScreen = ({ navigation }: any) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'All') return PROJECTS;
    return PROJECTS.filter(
      p => p.status === activeFilter.toLowerCase(),
    );
  }, [activeFilter]);

  const getStatusColor = (status: string) => {
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

  const renderProject = ({ item }: any) => (
    <Card
      style={styles.projectCard}
      onPress={() => navigation.navigate('Preview', { projectId: item.id })}>
      <View style={styles.projectRow}>
        <View style={styles.thumbnail}>
          <Text style={styles.thumbnailIcon}>🎬</Text>
        </View>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{item.name}</Text>
          <View style={styles.projectMeta}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.metaText}>{item.duration}</Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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

      {/* Filter Tabs */}
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

      {/* Projects List */}
      <FlatList
        data={filteredProjects}
        renderItem={renderProject}
        keyExtractor={item => item.id}
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
