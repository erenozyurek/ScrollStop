import React from 'react';
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
import { Button, Card, StatCard } from '../../components/common';
import { useAuth } from '../../context/AuthContext';

const RECENT_PROJECTS = [
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
];

export const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || 'Creator';
  const initial = firstName.charAt(0).toUpperCase();

  const renderProject = ({ item }: any) => (
    <Card
      style={styles.projectCard}
      onPress={() => navigation.navigate('Preview', { projectId: item.id })}>
      <View style={styles.projectHeader}>
        <View style={styles.projectThumbnail}>
          <Text style={styles.thumbnailIcon}>🎬</Text>
        </View>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{item.name}</Text>
          <Text style={styles.projectMeta}>
            {item.duration} • {item.date}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.status === 'completed'
              ? styles.statusCompleted
              : styles.statusProcessing,
          ]}>
          <Text
            style={[
              styles.statusText,
              item.status === 'completed'
                ? styles.statusTextCompleted
                : styles.statusTextProcessing,
            ]}>
            {item.status === 'completed' ? '✓' : '◌'}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('ProfileTab')}>
            <Text style={styles.avatarText}>{initial}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Videos" value="12" />
          <StatCard label="Plan" value={user?.subscriptionType ?? 'free'} />
          <StatCard label="This Month" value="5" />
        </View>

        {/* Quick Create */}
        <Card style={styles.createCard}>
          <View style={styles.createContent}>
            <Text style={styles.createTitle}>Create New Ad</Text>
            <Text style={styles.createSubtitle}>
              Generate a scroll-stopping video ad with AI in seconds
            </Text>
            <Button
              title="+ New Ad"
              onPress={() => navigation.navigate('CreateAd')}
              variant="primary"
              size="md"
              style={styles.createButton}
            />
          </View>
        </Card>

        {/* Caption Generator */}
        <Card style={styles.captionCard}>
          <View style={styles.captionContent}>
            <View style={styles.captionIconWrap}>
              <Feather name="edit-3" size={20} color={Colors.white} />
            </View>
            <View style={styles.captionTextWrap}>
              <Text style={styles.captionTitle}>Ad Caption Generator</Text>
              <Text style={styles.captionSubtitle}>
                SEO-optimized captions for Instagram, TikTok & more
              </Text>
            </View>
            <TouchableOpacity
              style={styles.captionArrow}
              onPress={() => navigation.navigate('CaptionGenerator')}>
              <Text style={styles.captionArrowText}>→</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recent Projects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Projects</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {RECENT_PROJECTS.map(item => (
            <View key={item.id}>{renderProject({ item })}</View>
          ))}
        </View>

        {/* Credit Banner */}
        <Card style={styles.creditBanner}>
          <Text style={styles.creditTitle}>Running low on credits?</Text>
          <Text style={styles.creditSubtitle}>
            Upgrade your plan to generate more ads
          </Text>
          <Button
            title="View Plans"
            onPress={() => navigation.navigate('Pricing')}
            variant="outline"
            size="sm"
            style={styles.creditButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.black,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  createCard: {
    marginBottom: Spacing.lg,
    borderColor: Colors.borderLight,
  },
  createContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  createTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  createSubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  createButton: {
    marginTop: Spacing.sm,
    minWidth: 160,
  },
  captionCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderColor: Colors.borderLight,
  },
  captionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  captionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionIcon: {
    fontSize: 20,
  },
  captionTextWrap: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  captionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  captionSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  captionArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionArrowText: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  projectCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectThumbnail: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailIcon: {
    fontSize: 22,
  },
  projectInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  projectMeta: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusProcessing: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextCompleted: {
    color: Colors.success,
  },
  statusTextProcessing: {
    color: Colors.textTertiary,
  },
  creditBanner: {
    alignItems: 'center',
    gap: Spacing.sm,
    borderStyle: 'dashed',
  },
  creditTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  creditSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  creditButton: {
    marginTop: Spacing.xs,
  },
});
