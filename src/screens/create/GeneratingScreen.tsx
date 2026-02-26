import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../theme';

const STEPS = [
  { label: 'Analyzing product...', icon: '🔍' },
  { label: 'Writing script...', icon: '📝' },
  { label: 'Generating voiceover...', icon: '🎙️' },
  { label: 'Adding subtitles...', icon: '💬' },
  { label: 'Rendering video...', icon: '🎬' },
  { label: 'Almost done...', icon: '✨' },
];

export const GeneratingScreen = ({ navigation, route }: any) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress] = useState(new Animated.Value(0));
  const [pulse] = useState(new Animated.Value(1));

  useEffect(() => {
    // Animate progress
    Animated.timing(progress, {
      toValue: 1,
      duration: 12000,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: false,
    }).start();

    // Pulse animation
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnim.start();

    // Step through stages
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    // Navigate to preview after generation
    const timeout = setTimeout(() => {
      navigation.replace('Preview', { projectId: 'new' });
    }, 13000);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(timeout);
      pulseAnim.stop();
    };
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Animated Icon */}
        <Animated.View
          style={[styles.iconContainer, { transform: [{ scale: pulse }] }]}>
          <Text style={styles.mainIcon}>{STEPS[currentStep].icon}</Text>
        </Animated.View>

        {/* Status */}
        <Text style={styles.title}>Generating your ad</Text>
        <Text style={styles.currentAction}>{STEPS[currentStep].label}</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[styles.progressBar, { width: progressWidth }]}
          />
        </View>

        {/* Steps List */}
        <View style={styles.stepsList}>
          {STEPS.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  index < currentStep && styles.stepDotCompleted,
                  index === currentStep && styles.stepDotActive,
                ]}>
                {index < currentStep && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  index < currentStep && styles.stepLabelCompleted,
                  index === currentStep && styles.stepLabelActive,
                  index > currentStep && styles.stepLabelPending,
                ]}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productLabel}>Product</Text>
          <Text style={styles.productName}>
            {route?.params?.productName || 'Your Product'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  mainIcon: {
    fontSize: 44,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  currentAction: {
    fontSize: 15,
    color: Colors.textTertiary,
    marginBottom: Spacing.xl,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: Spacing.xxl,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  stepsList: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  stepDotActive: {
    borderColor: Colors.white,
  },
  checkmark: {
    fontSize: 12,
    color: Colors.black,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  stepLabelCompleted: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  stepLabelActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  stepLabelPending: {
    color: Colors.textDisabled,
  },
  productInfo: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    alignItems: 'center',
  },
  productLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
  },
});
