import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Button, Card } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';

const MENU_ITEMS = [
  { icon: 'user', label: 'Edit Profile', screen: 'EditProfile' },
  { icon: 'credit-card', label: 'Subscription', screen: 'Pricing' },
  { icon: 'bar-chart-2', label: 'Usage History', screen: 'Usage' },
  { icon: 'bell', label: 'Notifications', screen: 'Notifications' },
  { icon: 'help-circle', label: 'Help & Support', screen: 'Support' },
  { icon: 'file-text', label: 'Terms of Service', screen: 'Terms' },
  { icon: 'lock', label: 'Privacy Policy', screen: 'Privacy' },
];

export const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const initial = user?.displayName?.charAt(0).toUpperCase() || 'U';

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headerTitle}>Profile</Text>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Credits Card */}
        <Card style={styles.creditsCard}>
          <View style={styles.creditsHeader}>
            <Text style={styles.creditsTitle}>Credits</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planText}>PRO</Text>
            </View>
          </View>
          <View style={styles.creditsRow}>
            <View style={styles.creditBlock}>
              <Text style={styles.creditNumber}>8</Text>
              <Text style={styles.creditLabel}>Remaining</Text>
            </View>
            <View style={styles.creditDivider} />
            <View style={styles.creditBlock}>
              <Text style={styles.creditNumber}>22</Text>
              <Text style={styles.creditLabel}>Used</Text>
            </View>
            <View style={styles.creditDivider} />
            <View style={styles.creditBlock}>
              <Text style={styles.creditNumber}>30</Text>
              <Text style={styles.creditLabel}>Total</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '73%' }]} />
          </View>
          <Button
            title="Upgrade Plan"
            onPress={() => navigation.navigate('Pricing')}
            variant="primary"
            size="sm"
            style={styles.upgradeButton}
          />
        </Card>

        {/* Menu */}
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index === 0 && styles.menuItemFirst,
                index === MENU_ITEMS.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => {
                if (item.screen === 'Usage') return; // mock — no screen yet
                navigation.navigate(item.screen);
              }}>
              <Icon name={item.icon} size={18} color={Colors.textTertiary} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <Button
          title="Log Out"
          onPress={handleLogout}
          variant="ghost"
          size="md"
          textStyle={styles.logoutText}
          style={styles.logoutButton}
        />

        {/* Version */}
        <Text style={styles.version}>ScrollStop v1.0.0</Text>
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  profileCard: {
    marginBottom: Spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.black,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  creditsCard: {
    marginBottom: Spacing.lg,
  },
  creditsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  creditsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  planBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  planText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: 1,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  creditBlock: {
    alignItems: 'center',
    flex: 1,
  },
  creditNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  creditLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  creditDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  progressContainer: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  upgradeButton: {
    alignSelf: 'center',
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemFirst: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  menuItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  menuIcon: {
    marginRight: Spacing.md,
    width: 20,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.white,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 22,
    color: Colors.textDisabled,
  },
  logoutButton: {
    marginBottom: Spacing.md,
  },
  logoutText: {
    color: Colors.error,
  },
  version: {
    fontSize: 12,
    color: Colors.textDisabled,
    textAlign: 'center',
  },
});
