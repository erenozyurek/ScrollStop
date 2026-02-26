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
    title: '1. Toplanan Veriler',
    content:
      'ScrollStop, hizmetlerini sunmak için aşağıdaki bilgileri toplar:\n\n• Hesap bilgileri: E-posta adresi, kullanıcı adı, profil bilgileri\n• Ürün bilgileri: Ürün adı, açıklaması, URL ve görseller\n• Kullanım verileri: Uygulama kullanım istatistikleri, oluşturulan içerik sayısı\n• Cihaz bilgileri: İşletim sistemi, cihaz modeli, dil tercihi',
  },
  {
    title: '2. Verilerin Kullanımı',
    content:
      'Topladığımız veriler aşağıdaki amaçlarla kullanılır:\n\n• Ürünleriniz için AI destekli içerik oluşturmak\n• Hesap yönetimi ve güvenliğini sağlamak\n• Uygulama performansını iyileştirmek\n• Abonelik ve ödeme işlemlerini yönetmek\n• Müşteri desteği sağlamak',
  },
  {
    title: '3. Veri Paylaşımı',
    content:
      'ScrollStop, kişisel verilerinizi üçüncü taraflarla satmaz. Verileriniz yalnızca aşağıdaki durumlarda paylaşılabilir:\n\n• Hizmet sağlayıcılar (Firebase, AI API sağlayıcıları) ile teknik operasyonlar için\n• Yasal zorunluluklar gereğince yetkili makamlarla\n• Açık rızanızla hareket eden iş ortaklarıyla',
  },
  {
    title: '4. Veri Güvenliği',
    content:
      'Verileriniz Firebase altyapısında şifrelenmiş olarak saklanır. SSL/TLS ile güvenli bağlantı kullanılır. Şifreler hash algoritmasıyla korunur ve hiçbir zaman düz metin olarak saklanmaz. Düzenli güvenlik denetimleri yapılmaktadır.',
  },
  {
    title: '5. Çerezler ve İzleme',
    content:
      'ScrollStop mobil uygulaması çerez kullanmaz. Ancak temel uygulama fonksiyonelliği için cihaz üzerinde yerel depolama (AsyncStorage) kullanılır. Bu veriler yalnızca oturum yönetimi ve kullanıcı tercihlerini saklamak amacıyla kullanılır.',
  },
  {
    title: '6. Kullanıcı Hakları',
    content:
      'KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:\n\n• Verilerinize erişim talep etme\n• Verilerinizin düzeltilmesini isteme\n• Verilerinizin silinmesini talep etme\n• Veri işlenmesine itiraz etme\n• Veri taşınabilirliği talep etme\n\nBu haklarınızı kullanmak için privacy@scrollstop.app adresine e-posta gönderebilirsiniz.',
  },
  {
    title: '7. Veri Saklama Süresi',
    content:
      'Hesap bilgileriniz, hesabınız aktif olduğu sürece saklanır. Hesabınızı sildiğinizde verileriniz 30 gün içinde kalıcı olarak silinir. Yasal zorunluluk gerektiren veriler ilgili süre boyunca saklanabilir.',
  },
  {
    title: '8. Değişiklikler',
    content:
      'Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler uygulama içi bildirimle duyurulacaktır. Güncel politikayı düzenli olarak kontrol etmenizi öneririz.',
  },
];

export const PrivacyScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Icon name="shield" size={24} color={Colors.success} />
          <Text style={styles.introText}>
            Gizliliğiniz bizim için önemlidir. Verilerinizi nasıl topladığımızı,
            kullandığımızı ve koruduğumuzu bu sayfada bulabilirsiniz.
          </Text>
        </View>

        <Text style={styles.lastUpdated}>Son güncelleme: 1 Ocak 2026</Text>

        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            İletişim: privacy@scrollstop.app
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
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  introText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
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
