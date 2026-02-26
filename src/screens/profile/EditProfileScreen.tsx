import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { TextInput, Button, Toast } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/firestore';
import { changePassword, changeDisplayName } from '../../services/authService';

export const EditProfileScreen = ({ navigation }: any) => {
  const { user, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  }>({ visible: false, type: 'info', title: '' });

  const showToast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
      setToast({ visible: true, type, title, message });
    },
    [],
  );

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      showToast('error', 'Hata', 'İsim boş olamaz.');
      return;
    }
    if (!user) return;

    setSavingProfile(true);
    try {
      // Firebase Auth displayName güncelle
      await changeDisplayName(displayName.trim());

      // Firestore profil güncelle
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        username: username.trim() || displayName.trim().toLowerCase().replace(/\s+/g, ''),
      });

      await refreshUser();
      showToast('success', 'Başarılı', 'Profil bilgileriniz güncellendi.');
    } catch (err: any) {
      showToast('error', 'Hata', err.message || 'Profil güncellenemedi.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showToast('warning', 'Uyarı', 'Mevcut şifrenizi girin.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('warning', 'Uyarı', 'Yeni şifre en az 6 karakter olmalı.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }
    if (currentPassword === newPassword) {
      showToast('warning', 'Uyarı', 'Yeni şifre mevcut şifreden farklı olmalı.');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(user?.email || '', currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('success', 'Başarılı', 'Şifreniz başarıyla değiştirildi.');
    } catch (err: any) {
      const message =
        err.code === 'auth/invalid-login-credentials' || err.code === 'auth/invalid-credential'
          ? 'Mevcut şifreniz yanlış.'
          : err.code === 'auth/weak-password'
          ? 'Yeni şifre çok zayıf. En az 6 karakter kullanın.'
          : err.message || 'Şifre değiştirilemedi.';
      showToast('error', 'Hata', message);
    } finally {
      setSavingPassword(false);
    }
  };

  const profileChanged =
    displayName.trim() !== (user?.displayName || '') ||
    username.trim() !== (user?.username || '');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon name="arrow-left" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profili Düzenle</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>

          {/* Profil Bilgileri */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profil Bilgileri</Text>

            <TextInput
              label="İsim"
              placeholder="Adınızı girin"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />

            <TextInput
              label="Kullanıcı Adı"
              placeholder="kullanici_adi"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <Button
              title={savingProfile ? 'Kaydediliyor...' : 'Profili Kaydet'}
              onPress={handleSaveProfile}
              variant="primary"
              size="md"
              disabled={!profileChanged || savingProfile}
              style={styles.saveButton}
            />
            {savingProfile && (
              <ActivityIndicator
                color={Colors.white}
                style={styles.spinner}
              />
            )}
          </View>

          {/* Şifre Değiştir */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Şifre Değiştir</Text>

            <View style={styles.passwordField}>
              <TextInput
                label="Mevcut Şifre"
                placeholder="••••••••"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Icon
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordField}>
              <TextInput
                label="Yeni Şifre"
                placeholder="En az 6 karakter"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}>
                <Icon
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordField}>
              <TextInput
                label="Yeni Şifre (Tekrar)"
                placeholder="Şifreyi tekrar girin"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            </View>

            <Button
              title={savingPassword ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
              onPress={handleChangePassword}
              variant="primary"
              size="md"
              disabled={!currentPassword || !newPassword || !confirmPassword || savingPassword}
              style={styles.saveButton}
            />
            {savingPassword && (
              <ActivityIndicator
                color={Colors.white}
                style={styles.spinner}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Toast */}
      <Toast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onDismiss={hideToast}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
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
  avatarContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.black,
  },
  emailText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.md,
    width: '100%',
  },
  spinner: {
    marginTop: Spacing.sm,
  },
  passwordField: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 36,
    padding: 6,
  },
});
