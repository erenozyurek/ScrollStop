import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface FAQItem {
  question: string;
  answer: string;
  icon: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'ScrollStop nedir?',
    answer:
      'ScrollStop, ürünleriniz için yapay zeka destekli sosyal medya reklamları, açıklamalar ve video içerikleri oluşturmanızı sağlayan bir platformdur. Ürün bilgilerinizi girin, AI sizin için profesyonel içerikler üretsin!',
    icon: 'info',
  },
  {
    question: 'Nasıl ürün reklamı oluşturabilirim?',
    answer:
      '1. Ana sayfadan "Reklam Oluştur" butonuna tıklayın\n2. Ürün bilgilerinizi girin (ad, açıklama, URL)\n3. İsterseniz ürün görseli ekleyin\n4. AI içerik türünü seçin (görsel reklam, metin vb.)\n5. Oluştur butonuna tıklayın ve birkaç saniye bekleyin\n6. Sonucu önizleyin, kaydedin veya paylaşın',
    icon: 'zap',
  },
  {
    question: 'Ücretsiz planda neler var?',
    answer:
      'Ücretsiz planda ayda 3 adet AI içerik oluşturabilirsiniz. Bu içerikler reklam görselleri, ürün açıklamaları veya sosyal medya postları olabilir. Daha fazla içerik için Pro veya Business planlarına yükseltebilirsiniz.',
    icon: 'gift',
  },
  {
    question: 'Oluşturduğum içeriklere nasıl ulaşırım?',
    answer:
      'Tüm oluşturduğunuz içerikler "Projelerim" sayfasında saklanır. Buradan istediğiniz zaman içeriklerinizi görüntüleyebilir, düzenleyebilir, indirebilir veya paylaşabilirsiniz.',
    icon: 'folder',
  },
  {
    question: 'AI içeriklerin kalitesini nasıl artırabilirim?',
    answer:
      'Daha iyi sonuçlar almak için:\n\n• Ürün açıklamasını detaylı yazın\n• Hedef kitleyi belirtin\n• Reklamın tonunu seçin (profesyonel, eğlenceli vb.)\n• Ürün görseli ekleyin\n• Ürün URL\'si varsa mutlaka ekleyin',
    icon: 'trending-up',
  },
  {
    question: 'Aboneliğimi nasıl değiştiririm?',
    answer:
      'Profil sayfasından "Abonelik Planı" seçeneğine tıklayarak mevcut planınızı görüntüleyebilir ve yükseltme yapabilirsiniz. Plan değişiklikleri anında geçerli olur.',
    icon: 'credit-card',
  },
  {
    question: 'Hesabımı nasıl silebilirim?',
    answer:
      'Hesap silme işlemi için support@scrollstop.app adresine kayıtlı e-posta adresinizden "Hesap Silme Talebi" konulu bir e-posta gönderin. Talebiniz 48 saat içinde işleme alınacaktır.',
    icon: 'trash-2',
  },
];

const CONTACT_OPTIONS = [
  {
    icon: 'mail',
    title: 'E-posta',
    subtitle: 'support@scrollstop.app',
    color: '#3B82F6',
  },
  {
    icon: 'message-circle',
    title: 'Canlı Destek',
    subtitle: 'Hafta içi 09:00 – 18:00',
    color: '#22C55E',
  },
  {
    icon: 'twitter',
    title: 'Sosyal Medya',
    subtitle: '@scrollstopapp',
    color: '#1DA1F2',
  },
];

export const HelpSupportScreen = ({ navigation }: any) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yardım & Destek</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Contact Cards */}
        <Text style={styles.sectionLabel}>İletişim</Text>
        <View style={styles.contactRow}>
          {CONTACT_OPTIONS.map((opt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.contactIconWrap,
                  { backgroundColor: opt.color + '18' },
                ]}>
                <Icon name={opt.icon} size={20} color={opt.color} />
              </View>
              <Text style={styles.contactTitle}>{opt.title}</Text>
              <Text style={styles.contactSubtitle}>{opt.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <Text style={styles.sectionLabel}>Sıkça Sorulan Sorular</Text>
        {FAQ_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqItem}
            activeOpacity={0.7}
            onPress={() => toggleExpand(index)}>
            <View style={styles.faqHeader}>
              <View style={styles.faqLeft}>
                <Icon
                  name={item.icon}
                  size={18}
                  color={Colors.white}
                  style={styles.faqIcon}
                />
                <Text style={styles.faqQuestion}>{item.question}</Text>
              </View>
              <Icon
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textTertiary}
              />
            </View>
            {expandedIndex === index && (
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* App Version */}
        <View style={styles.versionCard}>
          <Icon name="smartphone" size={18} color={Colors.textTertiary} />
          <Text style={styles.versionText}>ScrollStop v1.0.0</Text>
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
  },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  faqItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  faqIcon: {
    marginRight: Spacing.sm,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  versionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  versionText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
});
