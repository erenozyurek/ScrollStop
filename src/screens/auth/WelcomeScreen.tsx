import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../theme';
import { Button } from '../../components/common';

const { width } = Dimensions.get('window');

export const WelcomeScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>⚡</Text>
          </View>
          <Text style={styles.appName}>ScrollStop</Text>
          <Text style={styles.tagline}>AI-Powered UGC Ad Generator</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem icon="📝" text="AI generates ad scripts" />
          <FeatureItem icon="🎙️" text="Professional voiceover" />
          <FeatureItem icon="📱" text="9:16 video export" />
          <FeatureItem icon="⚡" text="Ready in seconds" />
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaArea}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('Signup')}
            variant="primary"
            size="lg"
            style={styles.ctaButton}
          />
          <Button
            title="I already have an account"
            onPress={() => navigation.navigate('Login')}
            variant="ghost"
            size="md"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
  },
  logoArea: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    letterSpacing: 0.5,
  },
  features: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  ctaArea: {
    gap: Spacing.sm,
  },
  ctaButton: {
    width: '100%',
  },
});
