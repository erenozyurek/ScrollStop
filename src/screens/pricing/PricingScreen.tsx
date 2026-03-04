import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Button, Card } from '../../components/common';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$19',
    period: '/month',
    credits: '10 videos',
    features: [
      'AI script generation',
      'AI voiceover',
      'Auto subtitles',
      '1080p export',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$39',
    period: '/month',
    credits: '30 videos',
    features: [
      'Everything in Starter',
      'Premium voices',
      'Priority rendering',
      'Custom branding',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: '$79',
    period: '/month',
    credits: '80 videos',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'API access',
      'Bulk generation',
      'Dedicated support',
    ],
    popular: false,
  },
];

export const PricingScreen = ({ navigation }: any) => {
  const [selectedPlan, setSelectedPlan] = useState('pro');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pricing</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Choose your plan</Text>
        <Text style={styles.subtitle}>
          Scale your ad production with AI
        </Text>

        {/* Plans */}
        {PLANS.map(plan => (
          <TouchableOpacity
            key={plan.id}
            activeOpacity={0.7}
            onPress={() => setSelectedPlan(plan.id)}>
            <Card
              style={{
                ...styles.planCard,
                ...(selectedPlan === plan.id ? styles.planCardSelected : {}),
              }}>
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planCredits}>{plan.credits}</Text>
                </View>
                <View style={styles.priceBlock}>
                  <Text
                    style={[
                      styles.planPrice,
                      selectedPlan === plan.id && styles.planPriceSelected,
                    ]}>
                    {plan.price}
                  </Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>

              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {selectedPlan === plan.id && (
                <View style={styles.selectedIndicator}>
                  <View style={styles.radioOuter}>
                    <View style={styles.radioInner} />
                  </View>
                  <Text style={styles.selectedText}>Selected</Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Button
          title={`Subscribe to ${PLANS.find(p => p.id === selectedPlan)?.name}`}
          onPress={() => {}}
          variant="primary"
          size="lg"
          style={styles.subscribeButton}
        />
        <Text style={styles.cancelText}>Cancel anytime</Text>
      </View>
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
  placeholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  planCard: {
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: Colors.white,
    borderWidth: 2,
  },
  popularBadge: {
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  planCredits: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textSecondary,
  },
  planPriceSelected: {
    color: Colors.white,
  },
  planPeriod: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  featuresList: {
    gap: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureCheck: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
  },
  selectedText: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '600',
  },
  bottomAction: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  subscribeButton: {
    width: '100%',
  },
  cancelText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
});
