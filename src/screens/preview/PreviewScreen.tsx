import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Button, Card } from '../../components/common';

const { width } = Dimensions.get('window');
const VIDEO_WIDTH = width - 48;
const VIDEO_HEIGHT = VIDEO_WIDTH * (16 / 9);

export const PreviewScreen = ({ navigation, route }: any) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'script' | 'settings'>(
    'preview',
  );

  const mockScript = `[HOOK]
"Are you still struggling with blue light headaches?"

[PROBLEM]
"Spending 8+ hours on screens is destroying your eyes and sleep quality."

[AGITATION]
"Without protection, it only gets worse — migraines, insomnia, eye strain..."

[SOLUTION]
"These blue light blocking glasses filter 95% of harmful blue light instantly."

[CTA]
"Tap the link below and save 40% today. Your eyes will thank you."`;

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
                <Text style={styles.videoIcon}>▶</Text>
                <Text style={styles.videoLabel}>Video Preview</Text>
                <Text style={styles.videoDuration}>0:15</Text>
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
                <Text style={styles.infoLabel}>Voice</Text>
                <Text style={styles.infoValue}>Sarah (Female)</Text>
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
          onPress={() => {}}
          variant="outline"
          size="md"
          style={styles.shareButton}
        />
        <Button
          title="Download"
          onPress={() => {}}
          variant="primary"
          size="md"
          style={styles.downloadButton}
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
