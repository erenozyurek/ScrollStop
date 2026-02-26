import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera, type Asset } from 'react-native-image-picker';
import Feather from 'react-native-vector-icons/Feather';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Button, TextInput, Chip } from '../../components/common';

const AUDIENCES = [
  'Women 18-24',
  'Women 25-34',
  'Men 18-24',
  'Men 25-34',
  'Parents',
  'Fitness Lovers',
  'Tech Enthusiasts',
  'Beauty & Skincare',
];

const TONES = [
  'Energetic',
  'Professional',
  'Casual',
  'Urgent',
  'Funny',
  'Emotional',
];

const DURATIONS = ['15s', '30s', '60s'];

export const CreateAdScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1);
  const [productUrl, setProductUrl] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productImage, setProductImage] = useState<Asset | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('15s');

  const toggleAudience = (audience: string) => {
    setSelectedAudience(prev =>
      prev.includes(audience)
        ? prev.filter(a => a !== audience)
        : [...prev, audience],
    );
  };

  const handlePickImage = () => {
    Alert.alert(
      'Ürün Resmi',
      'Resmi nereden eklemek istersiniz?',
      [
        {
          text: 'Kamera',
          onPress: () => {
            launchCamera(
              { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024, quality: 0.8 },
              response => {
                if (!response.didCancel && !response.errorCode && response.assets?.[0]) {
                  setProductImage(response.assets[0]);
                }
              },
            );
          },
        },
        {
          text: 'Galeri',
          onPress: () => {
            launchImageLibrary(
              { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024, quality: 0.8 },
              response => {
                if (!response.didCancel && !response.errorCode && response.assets?.[0]) {
                  setProductImage(response.assets[0]);
                }
              },
            );
          },
        },
        { text: 'İptal', style: 'cancel' },
      ],
    );
  };

  const handleRemoveImage = () => {
    setProductImage(null);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return productName.length > 0;
      case 2:
        return selectedAudience.length > 0;
      case 3:
        return selectedTone.length > 0 && selectedDuration.length > 0;
      default:
        return false;
    }
  };

  const handleGenerate = () => {
    navigation.navigate('Generating', {
      productName,
      productDescription,
      productUrl,
      productImageUri: productImage?.uri || null,
      audience: selectedAudience,
      tone: selectedTone,
      duration: selectedDuration,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        {/* Header */}
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
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Ad</Text>
          <Text style={styles.stepIndicator}>{step}/3</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Step 1: Product Info */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Product Details</Text>
              <Text style={styles.stepSubtitle}>
                Tell us about your product
              </Text>

              <TextInput
                label="Product URL (optional)"
                placeholder="https://yourstore.com/product"
                value={productUrl}
                onChangeText={setProductUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
              <TextInput
                label="Product Name"
                placeholder="e.g. Blue Light Blocking Glasses"
                value={productName}
                onChangeText={setProductName}
              />
              <TextInput
                label="Product Description"
                placeholder="Describe your product's key features and benefits..."
                value={productDescription}
                onChangeText={setProductDescription}
                multiline
                numberOfLines={4}
                style={styles.textarea}
              />

              {/* Product Image */}
              <Text style={styles.imageLabel}>Product Image (optional)</Text>
              {productImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: productImage.uri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={styles.imageActionBtn}
                      onPress={handlePickImage}>
                      <Feather name="refresh-cw" size={18} color={Colors.white} />
                      <Text style={styles.imageActionText}>Değiştir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.imageActionBtn, styles.imageRemoveBtn]}
                      onPress={handleRemoveImage}>
                      <Feather name="trash-2" size={18} color="#FF4444" />
                      <Text style={[styles.imageActionText, { color: '#FF4444' }]}>Kaldır</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={handlePickImage}
                  activeOpacity={0.7}>
                  <View style={styles.imagePickerIconContainer}>
                    <Feather name="image" size={32} color={Colors.textTertiary} />
                  </View>
                  <Text style={styles.imagePickerTitle}>Ürün resmi ekle</Text>
                  <Text style={styles.imagePickerSubtitle}>Kamera veya galeriden seçin</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Step 2: Target Audience */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Target Audience</Text>
              <Text style={styles.stepSubtitle}>
                Who should this ad target?
              </Text>

              <View style={styles.chipGrid}>
                {AUDIENCES.map(audience => (
                  <Chip
                    key={audience}
                    label={audience}
                    selected={selectedAudience.includes(audience)}
                    onPress={() => toggleAudience(audience)}
                    style={styles.chip}
                  />
                ))}
              </View>

              {selectedAudience.length > 0 && (
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedLabel}>Selected:</Text>
                  <Text style={styles.selectedText}>
                    {selectedAudience.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Step 3: Ad Settings */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ad Settings</Text>
              <Text style={styles.stepSubtitle}>
                Choose the tone and duration
              </Text>

              <Text style={styles.sectionLabel}>TONE</Text>
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

              <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>
                DURATION
              </Text>
              <View style={styles.durationRow}>
                {DURATIONS.map(duration => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationCard,
                      selectedDuration === duration &&
                        styles.durationCardSelected,
                    ]}
                    onPress={() => setSelectedDuration(duration)}>
                    <Text
                      style={[
                        styles.durationValue,
                        selectedDuration === duration &&
                          styles.durationValueSelected,
                      ]}>
                      {duration}
                    </Text>
                    <Text
                      style={[
                        styles.durationLabel,
                        selectedDuration === duration &&
                          styles.durationLabelSelected,
                      ]}>
                      {duration === '15s'
                        ? 'Quick'
                        : duration === '30s'
                        ? 'Standard'
                        : 'Extended'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <SummaryRow label="Product" value={productName} />
                <SummaryRow
                  label="Image"
                  value={productImage ? '✓ Eklendi' : 'Yok'}
                />
                <SummaryRow
                  label="Audience"
                  value={selectedAudience.join(', ')}
                />
                <SummaryRow label="Tone" value={selectedTone} />
                <SummaryRow label="Duration" value={selectedDuration} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomAction}>
          <Button
            title={step < 3 ? 'Continue' : 'Generate Ad  ⚡'}
            onPress={step < 3 ? () => setStep(step + 1) : handleGenerate}
            variant="primary"
            size="lg"
            disabled={!canProceed()}
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
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  imagePickerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  imagePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  imagePickerSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  imagePreviewContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  imageActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
  },
  imageRemoveBtn: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  imageActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    marginBottom: 0,
  },
  selectedInfo: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  selectedText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
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
});
