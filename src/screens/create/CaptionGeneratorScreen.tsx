import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Animated,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Button, Chip } from '../../components/common';

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X (Twitter)', 'Facebook'];
const TONES = ['Professional', 'Playful', 'Bold', 'Minimal', 'Urgent', 'Luxury'];
const CAPTION_TYPES = ['Product Ad', 'Story Hook', 'CTA Focused', 'Testimonial', 'Launch Hype'];

// Simulated AI-generated captions
const GENERATED_CAPTIONS = [
  {
    caption:
      'Stop scrolling. This is the product you didn\'t know you needed — but now you can\'t live without. 🔥\n\nLimited stock available. Link in bio.',
    hashtags: '#ad #mustahave #trending #viral #newdrop',
  },
  {
    caption:
      'POV: You finally found the one thing that actually works.\n\nNo gimmicks. No filters. Just results.\n\nTap the link 👆',
    hashtags: '#reels #explore #foryou #honest #review',
  },
  {
    caption:
      'We spent 6 months perfecting this so you don\'t have to settle for less.\n\n✅ Premium quality\n✅ Fast delivery\n✅ 30-day guarantee\n\nOrder now — your future self will thank you.',
    hashtags: '#shopnow #quality #newproduct #guaranteed #musthave',
  },
];

export const CaptionGeneratorScreen = ({ navigation }: any) => {
  const [step, setStep] = useState<'form' | 'generating' | 'results'>('form');
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [generatedCaptions, setGeneratedCaptions] = useState<typeof GENERATED_CAPTIONS>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform],
    );
  };

  const canGenerate =
    productName.trim().length > 0 &&
    selectedPlatforms.length > 0 &&
    selectedTone.length > 0;

  const handleGenerate = () => {
    setStep('generating');
    progressAnim.setValue(0);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start(() => {
      setGeneratedCaptions(GENERATED_CAPTIONS);
      setStep('results');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleCopy = (text: string, index: number) => {
    Clipboard.setString(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleReset = () => {
    setStep('form');
    setGeneratedCaptions([]);
    fadeAnim.setValue(0);
    progressAnim.setValue(0);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ---------- GENERATING VIEW ----------
  if (step === 'generating') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.generatingContainer}>
          <View style={styles.generatingIcon}>
            <Feather name="edit-3" size={32} color={Colors.white} />
          </View>
          <Text style={styles.generatingTitle}>Crafting your captions...</Text>
          <Text style={styles.generatingSubtitle}>
            Optimizing for {selectedPlatforms.join(', ')}
          </Text>
          <View style={styles.progressBar}>
            <Animated.View
              style={[styles.progressFill, { width: progressWidth }]}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- RESULTS VIEW ----------
  if (step === 'results') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Feather name="arrow-left" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generated Captions</Text>
          <TouchableOpacity onPress={handleReset}>
            <Feather name="refresh-cw" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Platform tags */}
            <View style={styles.platformTags}>
              {selectedPlatforms.map(p => (
                <View key={p} style={styles.platformTag}>
                  <Text style={styles.platformTagText}>{p}</Text>
                </View>
              ))}
              <View style={styles.toneTag}>
                <Text style={styles.toneTagText}>{selectedTone}</Text>
              </View>
            </View>

            {generatedCaptions.map((item, index) => (
              <View key={index} style={styles.captionCard}>
                <View style={styles.captionHeader}>
                  <Text style={styles.captionLabel}>Option {index + 1}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() =>
                      handleCopy(`${item.caption}\n\n${item.hashtags}`, index)
                    }>
                    <Feather
                      name={copiedIndex === index ? 'check' : 'copy'}
                      size={16}
                      color={
                        copiedIndex === index
                          ? Colors.success
                          : Colors.textTertiary
                      }
                    />
                    <Text
                      style={[
                        styles.copyText,
                        copiedIndex === index && { color: Colors.success },
                      ]}>
                      {copiedIndex === index ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.captionText}>{item.caption}</Text>
                <View style={styles.hashtagRow}>
                  <Text style={styles.hashtagText}>{item.hashtags}</Text>
                </View>
              </View>
            ))}

            {/* Actions */}
            <View style={styles.resultActions}>
              <Button
                title="Regenerate"
                onPress={handleGenerate}
                variant="outline"
                size="md"
              />
              <Button
                title="New Caption"
                onPress={handleReset}
                variant="primary"
                size="md"
              />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- FORM VIEW ----------
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ad Caption Generator</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Product Info */}
          <Text style={styles.sectionLabel}>Product / Brand Name</Text>
          <View style={styles.inputWrapper}>
            <RNTextInput
              style={styles.input}
              placeholder="e.g. GlowSkin Serum"
              placeholderTextColor={Colors.textDisabled}
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          <Text style={styles.sectionLabel}>Description (optional)</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <RNTextInput
              style={[styles.input, styles.textArea]}
              placeholder="Briefly describe your product or what the ad is about..."
              placeholderTextColor={Colors.textDisabled}
              value={productDesc}
              onChangeText={setProductDesc}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Platform */}
          <Text style={styles.sectionLabel}>Target Platforms</Text>
          <View style={styles.chipRow}>
            {PLATFORMS.map(p => (
              <Chip
                key={p}
                label={p}
                selected={selectedPlatforms.includes(p)}
                onPress={() => togglePlatform(p)}
              />
            ))}
          </View>

          {/* Tone */}
          <Text style={styles.sectionLabel}>Tone</Text>
          <View style={styles.chipRow}>
            {TONES.map(t => (
              <Chip
                key={t}
                label={t}
                selected={selectedTone === t}
                onPress={() => setSelectedTone(t)}
              />
            ))}
          </View>

          {/* Caption Type */}
          <Text style={styles.sectionLabel}>Caption Style (optional)</Text>
          <View style={styles.chipRow}>
            {CAPTION_TYPES.map(ct => (
              <Chip
                key={ct}
                label={ct}
                selected={selectedType === ct}
                onPress={() =>
                  setSelectedType(prev => (prev === ct ? '' : ct))
                }
              />
            ))}
          </View>

          {/* Generate */}
          <Button
            title="Generate Captions"
            onPress={handleGenerate}
            variant="primary"
            size="lg"
            disabled={!canGenerate}
            style={styles.generateButton}
          />

          <Text style={styles.creditNote}>Uses 1 credit per generation</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  inputWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    color: Colors.white,
    fontSize: 15,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  textAreaWrapper: {
    minHeight: 90,
  },
  textArea: {
    minHeight: 80,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  generateButton: {
    marginTop: Spacing.xl,
  },
  creditNote: {
    fontSize: 12,
    color: Colors.textDisabled,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  // Generating
  generatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  generatingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  generatingSubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginBottom: Spacing.xl,
  },
  progressBar: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 2,
  },

  // Results
  platformTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  platformTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformTagText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  toneTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  toneTagText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  captionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  captionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  captionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
  },
  copyText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  captionText: {
    fontSize: 15,
    color: Colors.white,
    lineHeight: 22,
  },
  hashtagRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  hashtagText: {
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 20,
  },
  resultActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
