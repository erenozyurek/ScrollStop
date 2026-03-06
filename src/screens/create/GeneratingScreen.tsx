import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../theme';
import { Button } from '../../components/common';
import { type VideoJobStatus } from '../../services/videoApi';
import { useVideoJobs } from '../../context/VideoJobsContext';

const STEPS = [
  { label: 'Analyzing product...', icon: '🔍' },
  { label: 'Writing script...', icon: '📝' },
  { label: 'Generating voiceover...', icon: '🎙️' },
  { label: 'Adding subtitles...', icon: '💬' },
  { label: 'Rendering video...', icon: '🎬' },
  { label: 'Almost done...', icon: '✨' },
];

const UI_TICK_MS = 1200;

const isTerminalStatus = (
  status: VideoJobStatus,
): status is 'success' | 'error' => status === 'success' || status === 'error';

export const GeneratingScreen = ({ navigation, route }: any) => {
  const jobId = String(route?.params?.jobId || '').trim();
  const productName = route?.params?.productName || 'Your Product';
  const { trackJob, jobs } = useVideoJobs();

  const trackedJob = jobs.find(job => job.jobId === jobId) || null;
  const currentStatus: VideoJobStatus = trackedJob?.status || 'pending';

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progress] = useState(new Animated.Value(0.05));
  const [pulse] = useState(new Animated.Value(1));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uiTick, setUiTick] = useState(0);

  useEffect(() => {
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

    return () => {
      pulseAnim.stop();
    };
  }, [pulse]);

  useEffect(() => {
    if (!jobId) {
      setErrorMessage('Job ID bulunamadi. Lutfen tekrar deneyin.');
      return;
    }

    trackJob({
      jobId,
      productName,
      initialStatus: 'pending',
    });
  }, [jobId, productName, trackJob]);

  useEffect(() => {
    if (currentStatus === 'error') {
      setErrorMessage(trackedJob?.error || 'Video generation failed.');
      return;
    }

    setErrorMessage(null);
  }, [currentStatus, trackedJob?.error]);

  useEffect(() => {
    if (!jobId || isTerminalStatus(currentStatus)) {
      return;
    }

    const intervalId = setInterval(() => {
      setUiTick(prev => prev + 1);
    }, UI_TICK_MS);

    return () => clearInterval(intervalId);
  }, [currentStatus, jobId]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    const animateProgressTo = (target: number) => {
      Animated.timing(progress, {
        toValue: target,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    };

    const calculateStepIndex = (status: VideoJobStatus, tick: number): number => {
      if (status === 'pending') {
        return Math.min(1, Math.floor(tick / 3));
      }

      if (status === 'success') {
        return STEPS.length - 1;
      }

      if (status === 'error') {
        return STEPS.length - 2;
      }

      return Math.min(STEPS.length - 2, 2 + Math.floor(tick / 2));
    };

    const step = calculateStepIndex(currentStatus, uiTick);
    setCurrentStep(step);

    if (currentStatus === 'success') {
      animateProgressTo(1);
      timeout = setTimeout(() => {
        if (!active) {
          return;
        }

        navigation.replace('Preview', {
          projectId: jobId,
          videoUrl: trackedJob?.videoUrl || null,
          status: currentStatus,
          error: null,
        });
      }, 300);

      return () => {
        active = false;
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }

    if (currentStatus === 'error') {
      animateProgressTo(1);
      return () => {
        active = false;
      };
    }

    const targetProgress =
      currentStatus === 'pending'
        ? Math.min(0.25, 0.08 + uiTick * 0.02)
        : Math.min(0.92, 0.28 + uiTick * 0.03);

    animateProgressTo(targetProgress);

    return () => {
      active = false;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [currentStatus, jobId, navigation, progress, trackedJob?.videoUrl, uiTick]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const hasError = !!errorMessage;
  const title = hasError ? 'Generation Failed' : 'Generating your ad';
  const subtitle = hasError ? errorMessage : STEPS[currentStep].label;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[styles.iconContainer, { transform: [{ scale: pulse }] }]}>
          <Text style={styles.mainIcon}>{STEPS[currentStep].icon}</Text>
        </Animated.View>

        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.currentAction, hasError && styles.errorText]}>
          {subtitle}
        </Text>

        <View style={styles.progressContainer}>
          <Animated.View
            style={[styles.progressBar, { width: progressWidth }]}
          />
        </View>

        <View style={styles.stepsList}>
          {STEPS.map((stepItem, index) => (
            <View key={index} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  index < currentStep && !hasError && styles.stepDotCompleted,
                  index === currentStep && !hasError && styles.stepDotActive,
                  index === currentStep && hasError && styles.stepDotError,
                ]}>
                {index < currentStep && !hasError && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
                {index === currentStep && hasError && (
                  <Text style={styles.checkmarkError}>!</Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  index < currentStep && !hasError && styles.stepLabelCompleted,
                  index === currentStep && !hasError && styles.stepLabelActive,
                  index === currentStep && hasError && styles.stepLabelError,
                  index > currentStep && styles.stepLabelPending,
                ]}>
                {stepItem.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productLabel}>Product</Text>
          <Text style={styles.productName}>{productName}</Text>
        </View>

        {!hasError && !isTerminalStatus(currentStatus) ? (
          <Button
            title="Continue in background"
            onPress={() => navigation.navigate('Main')}
            variant="outline"
            size="md"
            style={styles.backgroundButton}
          />
        ) : null}

        {hasError ? (
          <View style={styles.errorActions}>
            <Button
              title="Try Again"
              onPress={() => navigation.replace('CreateAd')}
              variant="primary"
              size="md"
              style={styles.errorButton}
            />
            <Button
              title="Go Back"
              onPress={() => navigation.goBack()}
              variant="outline"
              size="md"
              style={styles.errorButton}
            />
          </View>
        ) : null}
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
  stepDotError: {
    borderColor: Colors.error,
    backgroundColor: 'rgba(255, 77, 77, 0.12)',
  },
  checkmark: {
    fontSize: 12,
    color: Colors.black,
    fontWeight: '800',
  },
  checkmarkError: {
    fontSize: 13,
    color: Colors.error,
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
  stepLabelError: {
    color: Colors.error,
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
  backgroundButton: {
    width: '100%',
    marginTop: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
  },
  errorActions: {
    width: '100%',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  errorButton: {
    width: '100%',
  },
});
