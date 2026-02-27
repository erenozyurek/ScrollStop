import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Button, Card, StatCard } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { getRecentCaptions, RecentCaption } from '../../services/captionApi';

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

  const [captions, setCaptions] = useState<RecentCaption[]>([]);
  const [captionsLoading, setCaptionsLoading] = useState(false);
  const [isAllCaptionsModalVisible, setAllCaptionsModalVisible] = useState(false);
  const [selectedCaption, setSelectedCaption] = useState<RecentCaption | null>(null);
  const [copiedOptionKey, setCopiedOptionKey] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCaptions = useCallback(async () => {
    if (!user?.uid) {
      setCaptionsLoading(false);
      setCaptions([]);
      return;
    }
    try {
      setCaptionsLoading(true);
      const data = await getRecentCaptions(10);
      setCaptions(data);
    } catch (err) {
      console.error('Failed to fetch captions:', err);
      setCaptions([]);
    } finally {
      setCaptionsLoading(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      fetchCaptions();
    }, [fetchCaptions]),
  );

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  // Caption tarihini formatla
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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

  const recentCaptionPreview = captions.slice(0, 3);

  const openCaptionDetail = (caption: RecentCaption) => {
    setSelectedCaption(caption);
  };

  const closeCaptionDetail = () => {
    setSelectedCaption(null);
    setCopiedOptionKey(null);
  };

  const openCaptionFromSeeAll = (caption: RecentCaption) => {
    setAllCaptionsModalVisible(false);
    setTimeout(() => {
      setSelectedCaption(caption);
    }, 0);
  };

  const copyToClipboard = async (text: string) => {
    if (Platform.OS === 'web') {
      const nav = (globalThis as any).navigator;
      await nav?.clipboard?.writeText?.(text);
      return;
    }

    try {
      const nativeClipboard = require('@react-native-clipboard/clipboard');
      const clipboard = nativeClipboard?.default || nativeClipboard;
      clipboard?.setString?.(text);
      return;
    } catch {
      await Share.share({ message: text });
    }
  };

  const handleCopyOption = async (text: string, optionKey: string) => {
    await copyToClipboard(text);
    setCopiedOptionKey(optionKey);
    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current);
    }
    copiedTimeoutRef.current = setTimeout(() => setCopiedOptionKey(null), 2000);
  };

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
          <StatCard label="Plan" value={user?.plan ?? 'free'} />
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

        {/* Recent Captions */}
        <View style={[styles.section, styles.recentCaptionsSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Captions</Text>
            <View style={styles.recentCaptionActions}>
              {captions.length > 3 ? (
                <TouchableOpacity onPress={() => setAllCaptionsModalVisible(true)}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => navigation.navigate('CaptionGenerator')}>
                <Text style={styles.seeAll}>+ New</Text>
              </TouchableOpacity>
            </View>
          </View>

          {captionsLoading ? (
            <View style={styles.captionsLoading}>
              <ActivityIndicator size="small" color={Colors.textTertiary} />
            </View>
          ) : captions.length === 0 ? (
            <Card style={styles.emptyCaptionCard}>
              <View style={styles.emptyCaptionContent}>
                <Feather name="edit-3" size={24} color={Colors.textTertiary} />
                <Text style={styles.emptyCaptionText}>
                  No captions yet
                </Text>
                <Text style={styles.emptyCaptionSubtext}>
                  Generate your first ad caption with AI
                </Text>
                <Button
                  title="Generate Caption"
                  onPress={() => navigation.navigate('CaptionGenerator')}
                  variant="outline"
                  size="sm"
                  style={styles.emptyCaptionButton}
                />
              </View>
            </Card>
          ) : (
            recentCaptionPreview.map(caption => (
              <Card
                key={caption.id}
                style={styles.captionHistoryCard}
                onPress={() => openCaptionDetail(caption)}>
                <View style={styles.captionHistoryRow}>
                  <View style={styles.captionHistoryIcon}>
                    <Feather name="file-text" size={16} color={Colors.white} />
                  </View>
                  <View style={styles.captionHistoryInfo}>
                    <Text
                      style={styles.captionHistoryText}
                      numberOfLines={2}
                      ellipsizeMode="tail">
                      {caption.text}
                    </Text>
                    <Text style={styles.captionHistoryDate}>
                      {formatDate(caption.createdAt)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isAllCaptionsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAllCaptionsModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Recent Captions</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setAllCaptionsModalVisible(false)}>
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {captions.length === 0 ? (
                <Text style={styles.modalEmptyText}>No captions found.</Text>
              ) : (
                captions.map(caption => (
                  <TouchableOpacity
                    key={caption.id}
                    style={styles.modalListItem}
                    onPress={() => openCaptionFromSeeAll(caption)}
                    activeOpacity={0.8}>
                    <Text style={styles.modalListText} numberOfLines={2}>
                      {caption.text}
                    </Text>
                    <Text style={styles.modalListDate}>{formatDate(caption.createdAt)}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedCaption}
        transparent
        animationType="fade"
        onRequestClose={closeCaptionDetail}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTextWrap}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedCaption?.productName || 'Caption Detail'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {formatDate(selectedCaption?.createdAt || '')}
                </Text>
              </View>
              <TouchableOpacity style={styles.modalCloseButton} onPress={closeCaptionDetail}>
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedCaption?.captions?.length ? (
                selectedCaption.captions.map((item, index) => (
                  <View key={`${selectedCaption.id}-${index}`} style={styles.modalCaptionOption}>
                    <View style={styles.modalOptionHeader}>
                      <Text style={styles.modalOptionLabel}>Option {index + 1}</Text>
                      <TouchableOpacity
                        style={styles.modalCopyButton}
                        onPress={() =>
                          handleCopyOption(
                            `${item.caption}${item.hashtags ? `\n\n${item.hashtags}` : ''}`,
                            `${selectedCaption.id}-${index}`,
                          )
                        }>
                        <Feather
                          name={copiedOptionKey === `${selectedCaption.id}-${index}` ? 'check' : 'copy'}
                          size={14}
                          color={
                            copiedOptionKey === `${selectedCaption.id}-${index}`
                              ? Colors.success
                              : Colors.textTertiary
                          }
                        />
                        <Text
                          style={[
                            styles.modalCopyText,
                            copiedOptionKey === `${selectedCaption.id}-${index}`
                              ? { color: Colors.success }
                              : null,
                          ]}>
                          {copiedOptionKey === `${selectedCaption.id}-${index}` ? 'Copied' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalCaptionText}>{item.caption}</Text>
                    {item.hashtags ? (
                      <Text style={styles.modalHashtagText}>{item.hashtags}</Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <View style={styles.modalCaptionOption}>
                  <View style={styles.modalOptionHeader}>
                    <Text style={styles.modalOptionLabel}>Caption</Text>
                    <TouchableOpacity
                      style={styles.modalCopyButton}
                      onPress={() =>
                        handleCopyOption(
                          `${selectedCaption?.text || ''}${selectedCaption?.hashtags ? `\n\n${selectedCaption.hashtags}` : ''}`,
                          `${selectedCaption?.id || 'fallback'}-0`,
                        )
                      }>
                      <Feather
                        name={copiedOptionKey === `${selectedCaption?.id || 'fallback'}-0` ? 'check' : 'copy'}
                        size={14}
                        color={
                          copiedOptionKey === `${selectedCaption?.id || 'fallback'}-0`
                            ? Colors.success
                            : Colors.textTertiary
                        }
                      />
                      <Text
                        style={[
                          styles.modalCopyText,
                          copiedOptionKey === `${selectedCaption?.id || 'fallback'}-0`
                            ? { color: Colors.success }
                            : null,
                        ]}>
                        {copiedOptionKey === `${selectedCaption?.id || 'fallback'}-0` ? 'Copied' : 'Copy'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modalCaptionText}>{selectedCaption?.text || ''}</Text>
                  {selectedCaption?.hashtags ? (
                    <Text style={styles.modalHashtagText}>{selectedCaption.hashtags}</Text>
                  ) : null}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  recentCaptionsSection: {
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  recentCaptionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
  captionsLoading: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyCaptionCard: {
    padding: Spacing.lg,
  },
  emptyCaptionContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyCaptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    marginTop: Spacing.xs,
  },
  emptyCaptionSubtext: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  emptyCaptionButton: {
    marginTop: Spacing.sm,
  },
  captionHistoryCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  captionHistoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  captionHistoryIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  captionHistoryInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  captionHistoryText: {
    fontSize: 14,
    color: Colors.white,
    lineHeight: 20,
  },
  captionHistoryDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '78%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderTextWrap: {
    flex: 1,
    marginRight: Spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textTertiary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  modalEmptyText: {
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  modalListItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalListText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  modalListDate: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textTertiary,
  },
  modalCaptionOption: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalOptionLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
  },
  modalCopyText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  modalCaptionText: {
    fontSize: 15,
    color: Colors.white,
    lineHeight: 22,
  },
  modalHashtagText: {
    marginTop: Spacing.sm,
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 20,
  },
});
