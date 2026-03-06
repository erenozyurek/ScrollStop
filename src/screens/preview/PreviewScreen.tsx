import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Button, Card } from '../../components/common';
import { getVideoJobStatus, type VideoJobStatus } from '../../services/videoApi';

const NativeVideoPlayer: React.ComponentType<any> | null =
  Platform.OS === 'web'
    ? null
    : (() => {
        try {
          return require('react-native-video').default;
        } catch {
          return null;
        }
      })();

export const PreviewScreen = ({ navigation, route }: any) => {
  const canRenderNativeVideo = !!NativeVideoPlayer;
  const projectId = String(route?.params?.projectId || '').trim();
  const canPollBackendStatus = /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(projectId);
  const initialVideoUrl = route?.params?.videoUrl
    ? String(route.params.videoUrl)
    : null;
  const initialStatus =
    (route?.params?.status as VideoJobStatus | undefined) ||
    (initialVideoUrl ? 'success' : 'processing');

  const [activeTab, setActiveTab] = useState<'preview' | 'script' | 'settings'>(
    'preview',
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl);
  const [jobStatus, setJobStatus] = useState<VideoJobStatus>(initialStatus);
  const [statusError, setStatusError] = useState<string | null>(
    route?.params?.error ? String(route.params.error) : null,
  );
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const mockScript = `[HOOK]
"Are you still struggling with blue light headaches?"

[PROBLEM]
"Spending 8+ hours on screens is destroying your eyes and sleep quality."

[AGITATION]
"Without protection, it only gets worse - migraines, insomnia, eye strain..."

[SOLUTION]
"These blue light blocking glasses filter 95% of harmful blue light instantly."

[CTA]
"Tap the link below and save 40% today. Your eyes will thank you."`;

  const refreshJobStatus = useCallback(async () => {
    if (!projectId || !canPollBackendStatus) {
      return;
    }

    setIsRefreshingStatus(true);
    try {
      const statusResponse = await getVideoJobStatus(projectId);
      setJobStatus(statusResponse.status);
      setVideoUrl(statusResponse.videoUrl);
      setStatusError(statusResponse.error);
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : 'Video status alinamadi.',
      );
    } finally {
      setIsRefreshingStatus(false);
    }
  }, [canPollBackendStatus, projectId]);

  useEffect(() => {
    if (!videoUrl && canPollBackendStatus) {
      refreshJobStatus();
    }
  }, [canPollBackendStatus, refreshJobStatus, videoUrl]);

  const handleOpenVideo = async () => {
    if (!videoUrl) {
      Alert.alert('Video Not Ready', 'Video URL henuz hazir degil.');
      return;
    }

    const canOpen = await Linking.canOpenURL(videoUrl);
    if (!canOpen) {
      Alert.alert('Open Error', 'Video URL acilamadi.');
      return;
    }

    await Linking.openURL(videoUrl);
  };

  const handleShareVideo = async () => {
    if (!videoUrl) {
      Alert.alert('Video Not Ready', 'Video hazir oldugunda paylasabilirsiniz.');
      return;
    }

    await Share.share({
      message: videoUrl,
      url: videoUrl,
    });
  };

  const getReadableStatus = (status: VideoJobStatus): string => {
    switch (status) {
      case 'success':
        return 'Ready';
      case 'error':
        return 'Failed';
      case 'processing':
        return 'Processing';
      default:
        return 'Pending';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['preview', 'script', 'settings'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <>
            <View style={styles.videoContainer}>
              <View style={styles.videoPlaceholder}>
                {videoUrl && canRenderNativeVideo ? (
                  <>
                    <NativeVideoPlayer
                      source={{ uri: videoUrl }}
                      style={styles.videoPlayer}
                      controls
                      paused={false}
                      resizeMode="cover"
                      onLoadStart={() => {
                        setVideoLoading(true);
                        setVideoLoadError(null);
                      }}
                      onLoad={() => {
                        setVideoLoading(false);
                      }}
                      onError={(event: any) => {
                        setVideoLoading(false);
                        const errorText =
                          event?.error?.localizedDescription ||
                          event?.error?.errorString ||
                          event?.error?.message ||
                          'Video player could not load this URL.';
                        setVideoLoadError(String(errorText));
                      }}
                    />
                    {videoLoading ? (
                      <View style={styles.videoOverlay}>
                        <ActivityIndicator size="large" color={Colors.white} />
                        <Text style={styles.videoOverlayText}>Loading video...</Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text style={styles.videoIcon}>▶</Text>
                    <Text style={styles.videoLabel}>
                      {jobStatus === 'success'
                        ? 'Video Ready'
                        : videoUrl
                          ? 'Video Ready'
                          : 'Video Preparing'}
                    </Text>
                    <Text style={styles.videoDuration}>
                      Status: {getReadableStatus(jobStatus)}
                    </Text>
                    {videoUrl && !canRenderNativeVideo ? (
                      <Text style={styles.playerFallbackText}>
                        Native player bu buildde yok. Open Video ile izleyebilirsin.
                      </Text>
                    ) : null}
                  </>
                )}
              </View>
            </View>

            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Text style={styles.statusLabel}>Generation Status</Text>
                {isRefreshingStatus ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : null}
              </View>
              <Text style={styles.statusValue}>{getReadableStatus(jobStatus)}</Text>
              {statusError ? (
                <Text style={styles.statusError}>{statusError}</Text>
              ) : null}
              {videoLoadError ? (
                <Text style={styles.statusError}>{videoLoadError}</Text>
              ) : null}
              {videoUrl ? (
                <Text style={styles.videoUrlText} numberOfLines={3}>
                  {videoUrl}
                </Text>
              ) : null}
              <View style={styles.statusActions}>
                <Button
                  title="Refresh Status"
                  onPress={() => {
                    refreshJobStatus();
                  }}
                  variant="outline"
                  size="sm"
                  style={styles.statusActionButton}
                  loading={isRefreshingStatus}
                  disabled={!canPollBackendStatus}
                />
                <Button
                  title="Open Video"
                  onPress={() => {
                    handleOpenVideo();
                  }}
                  variant="secondary"
                  size="sm"
                  style={styles.statusActionButton}
                  disabled={!videoUrl}
                />
              </View>
            </View>

            {/* Video Info */}
            <View style={styles.videoInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Format</Text>
                <Text style={styles.infoValue}>9:16 Vertical</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>15 seconds</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Resolution</Text>
                <Text style={styles.infoValue}>1080 x 1920</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Project ID</Text>
                <Text style={styles.infoValue}>{projectId || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Backend Status API</Text>
                <Text style={styles.infoValue}>
                  {canPollBackendStatus ? 'Available' : 'Unavailable'}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Script Tab */}
        {activeTab === 'script' && (
          <View style={styles.scriptContainer}>
            <Card style={styles.scriptCard}>
              <Text style={styles.scriptText}>{mockScript}</Text>
            </Card>

            <View style={styles.scriptActions}>
              <Button
                title="Regenerate Script"
                onPress={() => {}}
                variant="outline"
                size="sm"
              />
              <Button
                title="Edit Script"
                onPress={() => {}}
                variant="secondary"
                size="sm"
              />
            </View>
          </View>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <View style={styles.settingsContainer}>
            <SettingItem
              label="Voice"
              value="Sarah (Female)"
              onPress={() => {}}
            />
            <SettingItem
              label="Subtitle Style"
              value="TikTok Bold"
              onPress={() => {}}
            />
            <SettingItem
              label="Background Music"
              value="Energetic Beat"
              onPress={() => {}}
            />
            <SettingItem
              label="Subtitle Color"
              value="White"
              onPress={() => {}}
            />
            <SettingItem
              label="Font Size"
              value="Large"
              onPress={() => {}}
            />

            <Button
              title="Regenerate Video"
              onPress={() => {}}
              variant="outline"
              size="md"
              style={styles.regenButton}
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title="Share"
          onPress={() => {
            handleShareVideo();
          }}
          variant="outline"
          size="md"
          style={styles.shareButton}
          disabled={!videoUrl}
        />
        <Button
          title="Open Video"
          onPress={() => {
            handleOpenVideo();
          }}
          variant="primary"
          size="md"
          style={styles.downloadButton}
          disabled={!videoUrl}
        />
      </View>
    </SafeAreaView>
  );
};

const SettingItem = ({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <Text style={styles.settingLabel}>{label}</Text>
    <View style={styles.settingRight}>
      <Text style={styles.settingValue}>{value}</Text>
      <Text style={styles.settingArrow}>›</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backText: {
    fontSize: 20,
    color: Colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moreText: {
    fontSize: 20,
    color: Colors.white,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: {
    backgroundColor: Colors.white,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.black,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  videoContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  videoPlaceholder: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 420,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.black,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: Spacing.sm,
  },
  videoOverlayText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '500',
  },
  videoIcon: {
    fontSize: 48,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  videoLabel: {
    fontSize: 16,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  videoDuration: {
    fontSize: 13,
    color: Colors.textDisabled,
    marginTop: 4,
  },
  playerFallbackText: {
    marginTop: Spacing.sm,
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: '700',
  },
  statusError: {
    fontSize: 13,
    color: Colors.error,
  },
  videoUrlText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusActionButton: {
    flex: 1,
  },
  videoInfo: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
    maxWidth: '65%',
    textAlign: 'right',
  },
  scriptContainer: {
    gap: Spacing.lg,
  },
  scriptCard: {
    padding: Spacing.lg,
  },
  scriptText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scriptActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  settingsContainer: {
    gap: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.white,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  settingArrow: {
    fontSize: 20,
    color: Colors.textDisabled,
  },
  regenButton: {
    marginTop: Spacing.lg,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  shareButton: {
    flex: 1,
  },
  downloadButton: {
    flex: 2,
  },
});
