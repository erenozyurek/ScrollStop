import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Button, Chip } from '../../components/common';
import { generateCaptions } from '../../services/captionApi';
import type { GeneratedCaption } from '../../services/captionApi';

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X (Twitter)', 'Facebook'];
const TONES = ['Professional', 'Playful', 'Bold', 'Minimal', 'Urgent', 'Luxury'];
const CAPTION_TYPES = ['Product Ad', 'Story Hook', 'CTA Focused', 'Testimonial', 'Launch Hype'];

const LANGUAGES = ['English', 'Turkish'];

const pickDefaultsByPlatforms = (platforms: string[]) => {
  const isTikTok = platforms.includes('TikTok');
  const isInstagram = platforms.includes('Instagram');

  const maxCaptionChars = isTikTok ? 120 : isInstagram ? 160 : 150;
  const hashtagCount = isTikTok ? 7 : isInstagram ? 10 : 8;

  return { maxCaptionChars, hashtagCount };
};

const pickEmojiPolicyByTone = (tone: string) => tone === 'Playful' || tone === 'Bold';

const buildDefaultCta = (language: string) =>
  language === 'Turkish' ? 'Satın al (bio’daki link)' : 'Shop now (link in bio)';

export const CaptionGeneratorScreen = ({ navigation }: any) => {
  const [step, setStep] = useState<'form' | 'generating' | 'results'>('form');
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const [generatedCaptions, setGeneratedCaptions] = useState<GeneratedCaption[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform],
    );
  };

  const canGenerate =
    productName.trim().length > 0 && selectedPlatforms.length > 0 && selectedTone.length > 0;

  const startProgressLoop = () => {
    progressLoopRef.current?.stop();
    progressAnim.setValue(0);

    progressLoopRef.current = Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: false,
      }),
    );

    progressLoopRef.current.start();
  };

  const stopProgressLoop = () => {
    progressLoopRef.current?.stop();
    progressLoopRef.current = null;
    progressAnim.setValue(0);
  };

  useEffect(() => {
    return () => {
      progressLoopRef.current?.stop();
      progressLoopRef.current = null;
      progressAnim.setValue(0);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, [progressAnim]);

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setErrorMessage('');
    fadeAnim.setValue(0);
    setStep('generating');
    startProgressLoop();

    try {
      const { maxCaptionChars, hashtagCount } = pickDefaultsByPlatforms(selectedPlatforms);
      const includeEmojis = pickEmojiPolicyByTone(selectedTone);

      const captions = await generateCaptions({
        productName: productName.trim(),
        productDescription: productDesc.trim(),
        platforms: selectedPlatforms,
        tone: selectedTone,
        captionStyle: selectedType,

        // enrichers
        language: selectedLanguage,
        hashtagCount,
        maxCaptionChars,
        includeEmojis,
        cta: buildDefaultCta(selectedLanguage),
        avoidClaims: ['guaranteed', 'unbreakable', 'best'],
      });

      stopProgressLoop();
      progressAnim.setValue(1);
      setGeneratedCaptions(captions);
      setStep('results');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      stopProgressLoop();
      setGeneratedCaptions([]);
      setStep('form');
      setErrorMessage(
        error instanceof Error ? error.message : 'Caption generation failed. Please try again.',
      );
    }
  };

  const copyToClipboard = async (text: string) => {
    if (Platform.OS === 'web') {
      const nav = (globalThis as any).navigator;
      // HTTPS olmayan ortamda çalışmayabilir; TS hatası vermesin diye document fallback yok
      await nav?.clipboard?.writeText?.(text);
      return;
    }

    // Optional native dependency: fail gracefully if not installed.
    try {
      const nativeClipboard = require('@react-native-clipboard/clipboard');
      const clipboard = nativeClipboard?.default || nativeClipboard;
      clipboard?.setString?.(text);
      return;
    } catch {
      await Share.share({ message: text });
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await copyToClipboard(text);

    setCopiedIndex(index);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleReset = () => {
    setStep('form');
    setGeneratedCaptions([]);
    setErrorMessage('');
    setCopiedIndex(null);
    fadeAnim.setValue(0);
    stopProgressLoop();
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
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- RESULTS VIEW ----------
  if (step === 'results') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generated Captions</Text>
          <TouchableOpacity onPress={handleReset}>
            <Feather name="refresh-cw" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.platformTags}>
              {selectedPlatforms.map(p => (
                <View key={p} style={styles.platformTag}>
                  <Text style={styles.platformTagText}>{p}</Text>
                </View>
              ))}
              <View style={styles.toneTag}>
                <Text style={styles.toneTagText}>{selectedTone}</Text>
              </View>
              <View style={styles.langTag}>
                <Text style={styles.langTagText}>{selectedLanguage}</Text>
              </View>
            </View>

            {generatedCaptions.map((item, index) => (
              <View key={index} style={styles.captionCard}>
                <View style={styles.captionHeader}>
                  <Text style={styles.captionLabel}>Option {index + 1}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => handleCopy(`${item.caption}\n\n${item.hashtags}`, index)}>
                    <Feather
                      name={copiedIndex === index ? 'check' : 'copy'}
                      size={16}
                      color={copiedIndex === index ? Colors.success : Colors.textTertiary}
                    />
                    <Text
                      style={[styles.copyText, copiedIndex === index && { color: Colors.success }]}>
                      {copiedIndex === index ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.captionText}>{item.caption}</Text>
                {item.hashtags ? (
                  <View style={styles.hashtagRow}>
                    <Text style={styles.hashtagText}>{item.hashtags}</Text>
                  </View>
                ) : null}
              </View>
            ))}

            <View style={styles.resultActions}>
              <Button title="Regenerate" onPress={handleGenerate} variant="outline" size="md" />
              <Button title="New Caption" onPress={handleReset} variant="primary" size="md" />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- FORM VIEW ----------
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ad Caption Generator</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

          <Text style={styles.sectionLabel}>Caption Style (optional)</Text>
          <View style={styles.chipRow}>
            {CAPTION_TYPES.map(ct => (
              <Chip
                key={ct}
                label={ct}
                selected={selectedType === ct}
                onPress={() => setSelectedType(prev => (prev === ct ? '' : ct))}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Language</Text>
          <View style={styles.chipRow}>
            {LANGUAGES.map(l => (
              <Chip
                key={l}
                label={l}
                selected={selectedLanguage === l}
                onPress={() => setSelectedLanguage(l)}
              />
            ))}
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

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
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },

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
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.white },
  headerSpacer: { width: 22 },

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
  textAreaWrapper: { minHeight: 90 },
  textArea: { minHeight: 80 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },

  errorBox: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: 'rgba(239,68,68,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.error, lineHeight: 18 },

  generateButton: { marginTop: Spacing.xl },
  creditNote: {
    fontSize: 12,
    color: Colors.textDisabled,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

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
  generatingTitle: { fontSize: 20, fontWeight: '700', color: Colors.white, marginBottom: Spacing.sm },
  generatingSubtitle: { fontSize: 14, color: Colors.textTertiary, marginBottom: Spacing.xl },

  progressBar: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.white, borderRadius: 2 },

  platformTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.lg },
  platformTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformTagText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

  toneTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  toneTagText: { fontSize: 12, color: Colors.white, fontWeight: '600' },

  langTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  langTagText: { fontSize: 12, color: Colors.white, fontWeight: '600' },

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
  copyText: { fontSize: 13, fontWeight: '500', color: Colors.textTertiary },

  captionText: { fontSize: 15, color: Colors.white, lineHeight: 22 },

  hashtagRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  hashtagText: { fontSize: 13, color: Colors.textTertiary, lineHeight: 20 },

  resultActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
});
