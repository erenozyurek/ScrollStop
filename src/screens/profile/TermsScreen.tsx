import React from 'react';
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

const SECTIONS = [
  {
    title: '1. Kabul Edilen Koşullar',
    content:
      'ScrollStop uygulamasını kullanarak bu Kullanım Koşullarını kabul etmiş olursunuz. Uygulamayı kullanmaya devam etmeniz, bu koşulları onayladığınız anlamına gelir. Koşulları kabul etmiyorsanız, uygulamayı kullanmayı bırakmanız gerekmektedir.',
  },
  {
    title: '2. Hizmet Tanımı',
    content:
      'ScrollStop, kullanıcıların ürünleri için yapay zeka destekli reklam metinleri ve video içerikleri oluşturmasına olanak tanıyan bir mobil uygulamadır. Uygulama, ürün bilgilerini analiz ederek hedef kitleye uygun içerikler üretir.',
  },
  {
    title: '3. Kullanıcı Hesabı',
    content:
      'Uygulamayı kullanmak için bir hesap oluşturmanız gerekmektedir. Hesap bilgilerinizin güvenliğinden siz sorumlusunuz. Hesabınızda gerçekleşen tüm aktivitelerden sorumlu olduğunuzu kabul edersiniz. Şüpheli bir aktivite fark ettiğinizde derhal bize bildirmeniz gerekmektedir.',
  },
  {
    title: '4. İçerik Sahipliği',
    content:
      'ScrollStop ile oluşturduğunuz tüm içerikler (metinler, görseller, videolar) size aittir. Ancak ScrollStop, hizmet kalitesini artırmak amacıyla anonim kullanım verilerini kullanma hakkını saklı tutar. Oluşturulan içeriklerin yasal uygunluğundan kullanıcı sorumludur.',
  },
  {
    title: '5. Ödeme ve Abonelikler',
    content:
      'ScrollStop ücretsiz ve ücretli planlar sunar. Ücretli planlara abone olduğunuzda, seçtiğiniz ödeme dönemine göre otomatik olarak ücretlendirilirsiniz. İptal işlemi, mevcut dönem sona erene kadar geçerli olmaz. İade politikası uygulama mağazası kurallarına tabidir.',
  },
  {
    title: '6. Kullanım Sınırlamaları',
    content:
      'Uygulamayı yasa dışı, yanıltıcı veya zararlı içerik oluşturmak için kullanamazsınız. Kötüye kullanım tespit edildiğinde hesabınız önceden bildirim yapılmaksızın askıya alınabilir veya silinebilir. API limitlerini aşan kullanımlar kısıtlanabilir.',
  },
  {
    title: '7. Sorumluluk Reddi',
    content:
      'ScrollStop, oluşturulan içeriklerin doğruluğu, eksiksizliği veya uygunluğu konusunda herhangi bir garanti vermez. Yapay zeka tarafından üretilen içerikler tavsiye niteliğindedir. İçeriklerin kullanımından doğan sonuçlardan ScrollStop sorumlu tutulamaz.',
  },
  {
    title: '8. Değişiklikler',
    content:
      'ScrollStop, bu kullanım koşullarını önceden bildirmeksizin değiştirme hakkını saklı tutar. Güncellenmiş koşullar uygulama içinde yayınlandığı anda geçerli olur. Önemli değişikliklerde kullanıcılar bilgilendirilecektir.',
  },
];

export const TermsScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kullanım Koşulları</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Son güncelleme: 1 Ocak 2026</Text>

        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sorularınız için: legal@scrollstop.app
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
  lastUpdated: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
});
