import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Button, TextInput } from '../../components/common';
import { useAuth } from '../../context/AuthContext';

export const SignupScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async () => {
    setLoading(true);
    try {
      const success = await signup(name, email, password);
      if (success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Start generating AI-powered ads
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextInput
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label="Password"
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              title="Create Account"
              onPress={handleSignup}
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!name || !email || !password}
              style={styles.createButton}
            />
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Signup */}
          <View style={styles.socialArea}>
            <Button
              title="Continue with Google"
              onPress={() => {}}
              variant="outline"
              size="md"
              style={styles.socialButton}
            />
            <Button
              title="Continue with Apple"
              onPress={() => {}}
              variant="outline"
              size="md"
              style={styles.socialButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  backButton: {
    marginBottom: Spacing.lg,
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
  form: {
    gap: 4,
  },
  createButton: {
    width: '100%',
    marginTop: Spacing.md,
  },
  terms: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.white,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: Spacing.md,
    letterSpacing: 1,
  },
  socialArea: {
    gap: Spacing.sm,
  },
  socialButton: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  footerText: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
  footerLink: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
