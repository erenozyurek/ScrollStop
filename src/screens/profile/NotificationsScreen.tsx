import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface NotificationSetting {
  key: string;
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
}

const INITIAL_SETTINGS: NotificationSetting[] = [
  {
    key: 'content_ready',
    icon: 'check-circle',
    title: 'İçerik Hazır',
    description: 'AI içeriğiniz oluşturulduğunda bildirim alın',
    enabled: true,
  },
  {
    key: 'weekly_summary',
    icon: 'bar-chart-2',
    title: 'Haftalık Özet',
    description: 'Haftalık kullanım ve performans özeti',
    enabled: true,
  },
  {
    key: 'new_features',
    icon: 'star',
    title: 'Yeni Özellikler',
    description: 'Yeni özellik ve güncellemelerden haberdar olun',
    enabled: false,
  },
  {
    key: 'tips',
    icon: 'book-open',
    title: 'İpuçları & Öneriler',
    description: 'İçeriklerinizi geliştirmek için öneriler',
    enabled: false,
  },
  {
    key: 'subscription',
    icon: 'credit-card',
    title: 'Abonelik Bildirimleri',
    description: 'Plan değişiklikleri ve ödeme hatırlatmaları',
    enabled: true,
  },
  {
    key: 'marketing',
    icon: 'gift',
    title: 'Kampanya & Fırsatlar',
    description: 'Özel indirimler ve kampanyalardan haberdar olun',
    enabled: false,
  },
];

export const NotificationsScreen = ({ navigation }: any) => {
  const [settings, setSettings] = useState<NotificationSetting[]>(INITIAL_SETTINGS);
  const [pushEnabled, setPushEnabled] = useState(true);

  const toggleSetting = (key: string) => {
    setSettings(prev =>
      prev.map(s => (s.key === key ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  const enabledCount = settings.filter(s => s.enabled).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <View style={styles.masterCard}>
          <View style={styles.masterLeft}>
            <View style={styles.masterIconWrap}>
              <Icon
                name="bell"
                size={22}
                color={pushEnabled ? Colors.white : Colors.textTertiary}
              />
            </View>
            <View>
              <Text style={styles.masterTitle}>Push Bildirimleri</Text>
              <Text style={styles.masterSubtitle}>
                {pushEnabled
                  ? `${enabledCount} kategori aktif`
                  : 'Tüm bildirimler kapalı'}
              </Text>
            </View>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: Colors.border, true: Colors.white + '60' }}
            thumbColor={pushEnabled ? Colors.white : Colors.textTertiary}
          />
        </View>

        {/* Individual Settings */}
        <Text style={styles.sectionLabel}>Bildirim Kategorileri</Text>
        {settings.map(item => (
          <View
            key={item.key}
            style={[
              styles.settingCard,
              !pushEnabled && styles.settingDisabled,
            ]}>
            <View style={styles.settingLeft}>
              <Icon
                name={item.icon}
                size={18}
                color={
                  pushEnabled && item.enabled
                    ? Colors.white
                    : Colors.textTertiary
                }
                style={styles.settingIcon}
              />
              <View style={styles.settingText}>
                <Text
                  style={[
                    styles.settingTitle,
                    !pushEnabled && styles.textDisabled,
                  ]}>
                  {item.title}
                </Text>
                <Text style={styles.settingDesc}>{item.description}</Text>
              </View>
            </View>
            <Switch
              value={item.enabled && pushEnabled}
              onValueChange={() => toggleSetting(item.key)}
              disabled={!pushEnabled}
              trackColor={{ false: Colors.border, true: Colors.white + '60' }}
              thumbColor={
                item.enabled && pushEnabled
                  ? Colors.white
                  : Colors.textTertiary
              }
            />
          </View>
        ))}

        {/* Info Note */}
        <View style={styles.infoCard}>
          <Icon name="info" size={16} color={Colors.textTertiary} />
          <Text style={styles.infoText}>
            Bildirim tercihleri cihazınızda yerel olarak saklanır. Cihaz
            ayarlarından uygulama bildirimlerinin açık olduğundan emin olun.
          </Text>
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  masterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  masterIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  masterSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  settingDisabled: {
    opacity: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  settingIcon: {
    marginRight: Spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  textDisabled: {
    color: Colors.textTertiary,
  },
  settingDesc: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
});
