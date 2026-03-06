import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Button, TextInput, Chip } from '../../components/common';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import { createVideoJob } from '../../services/videoApi';
import { useVideoJobs } from '../../context/VideoJobsContext';

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube'] as const;
const TONES = [
  'Energetic',
  'Professional',
  'Casual',
  'Urgent',
  'Funny',
  'Emotional',
] as const;
const DURATIONS = ['10s', '15s', '20s'] as const;
const LANGUAGES = ['Turkish', 'English'] as const;
const VOICE_GENDERS = ['female', 'male'] as const;
const VOICE_STYLES = ['friendly', 'energetic', 'serious'] as const;

type PlatformOption = (typeof PLATFORMS)[number];
type LanguageOption = (typeof LANGUAGES)[number];
type VoiceGenderOption = (typeof VOICE_GENDERS)[number];
type VoiceStyleOption = (typeof VOICE_STYLES)[number];

export const CreateAdScreen = ({ navigation }: any) => {
  const { trackJob } = useVideoJobs();
  const [step, setStep] = useState(1);

  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [brandName, setBrandName] = useState('');

  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformOption>('TikTok');
  const [selectedTone, setSelectedTone] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<(typeof DURATIONS)[number]>(
    '15s',
  );
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageOption>('Turkish');

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceGender, setVoiceGender] = useState<VoiceGenderOption>('female');
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyleOption>('friendly');

  const [includePrice, setIncludePrice] = useState(false);
  const [priceText, setPriceText] = useState('');
  const [cta, setCta] = useState('');
  const [productImages, setProductImages] = useState<
    Array<{ uri: string; type?: string; name?: string }>
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handlePickProductImages = async () => {
    const remaining = 3 - productImages.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', 'En fazla 3 urun gorseli ekleyebilirsin.');
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: remaining,
      quality: 1,
      includeBase64: false,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      Alert.alert('Image Error', result.errorMessage || 'Gorsel secilemedi.');
      return;
    }

    const nextImages = (result.assets || [])
      .filter((asset: Asset) => typeof asset.uri === 'string' && asset.uri.length > 0)
      .map((asset: Asset) => ({
        uri: String(asset.uri),
        type: asset.type || 'image/jpeg',
        name: asset.fileName || undefined,
      }));

    if (nextImages.length === 0) {
      return;
    }

    setProductImages(prev => {
      const merged = [...prev];
      nextImages.forEach(image => {
        if (!merged.some(existing => existing.uri === image.uri)) {
          merged.push(image);
        }
      });
      return merged.slice(0, 3);
    });
  };

  const handleRemoveProductImage = (uri: string) => {
    setProductImages(prev => prev.filter(image => image.uri !== uri));
  };

  const canProceed = () => {
    if (step === 1) {
      return productName.trim().length > 0;
    }

    if (step === 2) {
      return (
        selectedPlatform.length > 0 &&
        selectedTone.trim().length > 0 &&
        selectedDuration.length > 0 &&
        selectedLanguage.length > 0
      );
    }

    if (step === 3) {
      if (includePrice && priceText.trim().length === 0) {
        return false;
      }
      if (voiceEnabled && (!voiceGender || !voiceStyle)) {
        return false;
      }
      return true;
    }

    return false;
  };

  const handleGenerate = async () => {
    if (isSubmitting || !canProceed()) {
      return;
    }

    const normalizedProductName = productName.trim();
    const normalizedDescription = productDescription.trim();
    const normalizedBrandName = brandName.trim();
    const normalizedTone = selectedTone.trim();
    const normalizedCta = cta.trim();
    const normalizedPriceText = priceText.trim();

    const parsedDuration = Number.parseInt(selectedDuration, 10);
    const durationSeconds = Number.isNaN(parsedDuration)
      ? 15
      : Math.min(20, Math.max(10, parsedDuration));

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const job = await createVideoJob({
        productName: normalizedProductName,
        productDescription: normalizedDescription || undefined,
        brandName: normalizedBrandName || undefined,
        platform: selectedPlatform,
        durationSeconds,
        tone: normalizedTone,
        language: selectedLanguage,
        voice: voiceEnabled
          ? {
              enabled: true,
              gender: voiceGender,
              style: voiceStyle,
            }
          : {
              enabled: false,
            },
        aspectRatio: '9:16',
        includePrice,
        priceText: includePrice ? normalizedPriceText : undefined,
        cta: normalizedCta || undefined,
        productImages: productImages.length > 0 ? productImages : undefined,
      });

      trackJob({
        jobId: job.jobId,
        productName: normalizedProductName,
        initialStatus: job.status,
      });

      navigation.navigate('Generating', {
        jobId: job.jobId,
        productName: normalizedProductName,
        productDescription: normalizedDescription,
        tone: normalizedTone,
        durationSeconds,
        platform: selectedPlatform,
        language: selectedLanguage,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Video generation baslatilamadi.';
      setSubmitError(message);
      Alert.alert('Generate Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                navigation.goBack();
              }
            }}
            style={styles.backButton}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Ad</Text>
          <Text style={styles.stepIndicator}>{step}/3</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Product Basics</Text>
              <Text style={styles.stepSubtitle}>
                Required: product name. Brand and description are optional.
              </Text>

              <TextInput
                label="Product Name"
                placeholder="e.g. Blue Light Blocking Glasses"
                value={productName}
                onChangeText={setProductName}
              />

              <TextInput
                label="Brand Name (optional)"
                placeholder="e.g. ScrollStop"
                value={brandName}
                onChangeText={setBrandName}
              />

              <TextInput
                label="Product Description (optional)"
                placeholder="Key features, benefits, use-cases..."
                value={productDescription}
                onChangeText={setProductDescription}
                multiline
                numberOfLines={4}
                style={styles.textarea}
              />

              <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
                PRODUCT IMAGES (OPTIONAL)
              </Text>

              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={handlePickProductImages}>
                <Text style={styles.imagePickerButtonText}>
                  {productImages.length > 0
                    ? `Add More (${productImages.length}/3)`
                    : 'Add Product Image'}
                </Text>
              </TouchableOpacity>

              {productImages.length > 0 ? (
                <View style={styles.imageGrid}>
                  {productImages.map(image => (
                    <View key={image.uri} style={styles.imageCard}>
                      <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveProductImage(image.uri)}>
                        <Text style={styles.removeImageButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Core Settings</Text>
              <Text style={styles.stepSubtitle}>
                These fields are required by backend validation.
              </Text>

              <Text style={styles.sectionLabel}>PLATFORM</Text>
              <View style={styles.chipGrid}>
                {PLATFORMS.map(platform => (
                  <Chip
                    key={platform}
                    label={platform}
                    selected={selectedPlatform === platform}
                    onPress={() => setSelectedPlatform(platform)}
                    style={styles.chip}
                  />
                ))}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>TONE</Text>
              <View style={styles.chipGrid}>
                {TONES.map(tone => (
                  <Chip
                    key={tone}
                    label={tone}
                    selected={selectedTone === tone}
                    onPress={() => setSelectedTone(tone)}
                    style={styles.chip}
                  />
                ))}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>DURATION</Text>
              <View style={styles.durationRow}>
                {DURATIONS.map(duration => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationCard,
                      selectedDuration === duration && styles.durationCardSelected,
                    ]}
                    onPress={() => setSelectedDuration(duration)}>
                    <Text
                      style={[
                        styles.durationValue,
                        selectedDuration === duration && styles.durationValueSelected,
                      ]}>
                      {duration}
                    </Text>
                    <Text
                      style={[
                        styles.durationLabel,
                        selectedDuration === duration && styles.durationLabelSelected,
                      ]}>
                      {duration === '10s'
                        ? 'Quick'
                        : duration === '15s'
                          ? 'Standard'
                          : 'Detailed'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>LANGUAGE</Text>
              <View style={styles.chipGrid}>
                {LANGUAGES.map(language => (
                  <Chip
                    key={language}
                    label={language}
                    selected={selectedLanguage === language}
                    onPress={() => setSelectedLanguage(language)}
                    style={styles.chip}
                  />
                ))}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Optional Settings</Text>
              <Text style={styles.stepSubtitle}>
                Voiceover, price highlight and CTA options.
              </Text>

              <Text style={styles.sectionLabel}>VOICEOVER</Text>
              <View style={styles.chipGrid}>
                <Chip
                  label="Disabled"
                  selected={!voiceEnabled}
                  onPress={() => setVoiceEnabled(false)}
                  style={styles.chip}
                />
                <Chip
                  label="Enabled"
                  selected={voiceEnabled}
                  onPress={() => setVoiceEnabled(true)}
                  style={styles.chip}
                />
              </View>

              {voiceEnabled ? (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>VOICE GENDER</Text>
                  <View style={styles.chipGrid}>
                    {VOICE_GENDERS.map(gender => (
                      <Chip
                        key={gender}
                        label={gender}
                        selected={voiceGender === gender}
                        onPress={() => setVoiceGender(gender)}
                        style={styles.chip}
                      />
                    ))}
                  </View>

                  <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>VOICE STYLE</Text>
                  <View style={styles.chipGrid}>
                    {VOICE_STYLES.map(style => (
                      <Chip
                        key={style}
                        label={style}
                        selected={voiceStyle === style}
                        onPress={() => setVoiceStyle(style)}
                        style={styles.chip}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>INCLUDE PRICE</Text>
              <View style={styles.chipGrid}>
                <Chip
                  label="No"
                  selected={!includePrice}
                  onPress={() => setIncludePrice(false)}
                  style={styles.chip}
                />
                <Chip
                  label="Yes"
                  selected={includePrice}
                  onPress={() => setIncludePrice(true)}
                  style={styles.chip}
                />
              </View>

              {includePrice ? (
                <TextInput
                  label="Price Text"
                  placeholder="e.g. 40% OFF Today"
                  value={priceText}
                  onChangeText={setPriceText}
                />
              ) : null}

              <TextInput
                label="CTA (optional)"
                placeholder="e.g. Shop now"
                value={cta}
                onChangeText={setCta}
              />

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Request Summary</Text>
                <SummaryRow label="Product" value={productName || '-'} />
                <SummaryRow label="Brand" value={brandName || '-'} />
                <SummaryRow label="Platform" value={selectedPlatform} />
                <SummaryRow label="Tone" value={selectedTone || '-'} />
                <SummaryRow label="Duration" value={selectedDuration} />
                <SummaryRow label="Language" value={selectedLanguage} />
                <SummaryRow label="Voice" value={voiceEnabled ? 'Enabled' : 'Disabled'} />
                <SummaryRow label="Include Price" value={includePrice ? 'Yes' : 'No'} />
                <SummaryRow
                  label="Product Images"
                  value={productImages.length > 0 ? `${productImages.length} selected` : 'None'}
                />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomAction}>
          {submitError ? <Text style={styles.submitErrorText}>{submitError}</Text> : null}
          <Button
            title={step < 3 ? 'Continue' : 'Generate Ad'}
            onPress={step < 3 ? () => setStep(step + 1) : handleGenerate}
            variant="primary"
            size="lg"
            disabled={!canProceed() || isSubmitting}
            loading={isSubmitting}
            style={styles.actionButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

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
  backText: {
    fontSize: 20,
    color: Colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  progressContainer: {
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  progressBar: {
    height: 2,
    backgroundColor: Colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textTertiary,
    marginBottom: Spacing.xl,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  imageGrid: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  imageCard: {
    width: 95,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  imagePreview: {
    width: '100%',
    height: 95,
    resizeMode: 'cover',
  },
  removeImageButton: {
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  removeImageButtonText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    marginBottom: 0,
  },
  durationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  durationCard: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  durationCardSelected: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  durationValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
  },
  durationValueSelected: {
    color: Colors.black,
  },
  durationLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  durationLabelSelected: {
    color: Colors.gray600,
  },
  summaryCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  summaryValue: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '500',
    maxWidth: '60%',
  },
  bottomAction: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    width: '100%',
  },
  submitErrorText: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
});
