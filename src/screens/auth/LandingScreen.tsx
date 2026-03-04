import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Logo, Card } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';

export function LandingScreen({ navigation }: any) {
  const features = [
    { icon: 'sparkles' as const, title: 'AI-Powered Analysis', description: 'Advanced AI technology analyzes your skin with medical-grade precision' },
    { icon: 'calendar-outline' as const, title: 'Personalized Routines', description: 'Custom skincare routines tailored to your unique skin profile' },
    { icon: 'trending-up-outline' as const, title: 'Track Your Progress', description: 'Monitor your skin evolution with detailed analytics and insights' },
    { icon: 'sparkles-outline' as const, title: 'Smart Recommendations', description: 'Get product recommendations based on your skin concerns' },
  ];

  const benefits = [
    'Fitzpatrick skin type analysis',
    'Real age vs skin age comparison',
    'Personalized AI dermatology coach',
    'Daily routine reminders',
    'Progress tracking & reporting',
    'Expert skincare insights',
  ];

  const testimonials = [
    { name: 'Sarah Johnson', role: 'Premium User', text: 'DeepSkyn transformed my skincare routine! The AI analysis was incredibly accurate.', rating: 5 },
    { name: 'Michael Chen', role: 'Free User', text: "Finally, I understand my skin type and what products actually work for me.", rating: 5 },
    { name: 'Emma Williams', role: 'Premium User', text: 'The progress tracking keeps me motivated. I can see real improvements over time!', rating: 5 },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={14} color={Colors.primary} />
            <Text style={styles.heroBadgeText}>AI-Powered Dermatology</Text>
          </View>

          <Text style={styles.heroTitle}>
            Your Personal{'\n'}
            <Text style={styles.heroTitleGradient}>Skin Health</Text>
            {'\n'}Companion
          </Text>

          <Text style={styles.heroSubtitle}>
            Discover your skin's true potential with AI-powered analysis, personalized routines, and expert guidance tailored just for you.
          </Text>

          <View style={styles.heroButtons}>
            <Button onPress={() => navigation.navigate('Signup')} size="lg">
              Start Your Journey
            </Button>
            <Button variant="outline" onPress={() => { }} size="lg">
              Watch Demo
            </Button>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50K+</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.9★</Text>
              <Text style={styles.statLabel}>User Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>95%</Text>
              <Text style={styles.statLabel}>Satisfaction</Text>
            </View>
          </View>
        </View>

        {/* Skin Health Score Preview Card */}
        <Card style={styles.scoreCard} variant="elevated">
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>Skin Health Score</Text>
              <Text style={styles.scoreValue}>87/100</Text>
            </View>
            <LinearGradient
              colors={Gradients.primary}
              style={styles.scoreIcon}
            >
              <Ionicons name="trending-up" size={28} color={Colors.white} />
            </LinearGradient>
          </View>
        </Card>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Powerful Features</Text>
          <Text style={styles.sectionSubtitle}>Everything you need for perfect skin health</Text>

          {features.map((feature, index) => (
            <Card key={index} style={styles.featureCard}>
              <View style={styles.featureIconBox}>
                <Ionicons name={feature.icon as any} size={28} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.description}</Text>
            </Card>
          ))}
        </View>

        {/* Benefits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Why Choose{'\n'}
            <Text style={{ color: Colors.primary }}>DeepSkyn?</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>
            Our comprehensive platform combines cutting-edge AI technology with dermatological expertise.
          </Text>

          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <View style={styles.benefitCheck}>
                <Ionicons name="checkmark" size={14} color={Colors.white} />
              </View>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Testimonials Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loved by Thousands</Text>
          <Text style={styles.sectionSubtitle}>See what our users are saying</Text>

          {testimonials.map((testimonial, index) => (
            <Card key={index} style={styles.testimonialCard}>
              <View style={styles.starsRow}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Ionicons key={i} name="star" size={18} color={Colors.gold} />
                ))}
              </View>
              <Text style={styles.testimonialText}>"{testimonial.text}"</Text>
              <Text style={styles.testimonialName}>{testimonial.name}</Text>
              <Text style={styles.testimonialRole}>{testimonial.role}</Text>
            </Card>
          ))}
        </View>

        {/* Pricing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simple, Transparent Pricing</Text>
          <Text style={styles.sectionSubtitle}>Choose the plan that's right for you</Text>

          <Card style={styles.pricingCard}>
            <Text style={styles.planName}>Free</Text>
            <Text style={styles.planPrice}>
              <Text style={styles.planPriceAmount}>$0</Text>/month
            </Text>
            {['Basic skin analysis', 'Personalized routine', 'Monthly reports'].map((item, i) => (
              <View key={i} style={styles.planFeatureRow}>
                <Ionicons name="checkmark" size={18} color={Colors.primary} />
                <Text style={styles.planFeatureText}>{item}</Text>
              </View>
            ))}
            <Button variant="outline" onPress={() => navigation.navigate('Signup')} fullWidth style={{ marginTop: Spacing.base }}>
              Get Started
            </Button>
          </Card>

          <Card style={{ ...styles.pricingCard, ...styles.premiumCard }}>
            <View style={styles.popularBadge}>
              <LinearGradient colors={Gradients.primary} style={styles.popularBadgeGradient}>
                <Text style={styles.popularBadgeText}>Most Popular</Text>
              </LinearGradient>
            </View>
            <Text style={styles.planName}>Premium</Text>
            <Text style={[styles.planPrice, { color: Colors.primary }]}>
              <Text style={[styles.planPriceAmount, { color: Colors.primary }]}>$19</Text>/month
            </Text>
            {['Advanced AI analysis', 'AI dermatology coach', 'Unlimited tracking', 'Priority support'].map((item, i) => (
              <View key={i} style={styles.planFeatureRow}>
                <Ionicons name="checkmark" size={18} color={Colors.primary} />
                <Text style={styles.planFeatureText}>{item}</Text>
              </View>
            ))}
            <Button onPress={() => navigation.navigate('Signup')} fullWidth style={{ marginTop: Spacing.base }}>
              Start Premium Trial
            </Button>
          </Card>
        </View>

        {/* CTA Section */}
        <LinearGradient colors={Gradients.primary} style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Transform Your Skin?</Text>
          <Text style={styles.ctaSubtitle}>Join thousands of users achieving their best skin ever</Text>
          <Button
            variant="outline"
            onPress={() => navigation.navigate('Signup')}
            style={{ backgroundColor: Colors.white, borderColor: Colors.white }}
            textStyle={{ color: Colors.primary }}
            size="lg"
          >
            Start Your Free Analysis
          </Button>
        </LinearGradient>

        {/* Footer */}
        <View style={styles.footer}>
          <Logo size="sm" />
          <Text style={styles.footerText}>AI-powered skincare companion for your best skin ever.</Text>
          <Text style={styles.footerCopy}>© 2026 DeepSkyn. All rights reserved.</Text>
        </View>

        {/* Bottom Auth Buttons */}
        <View style={styles.bottomAuth}>
          <Button onPress={() => navigation.navigate('Signup')} fullWidth size="lg">
            Get Started
          </Button>
          <Button variant="ghost" onPress={() => navigation.navigate('Login')} fullWidth>
            Already have an account? Sign In
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  hero: { paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing['2xl'] },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryAlpha10, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginBottom: Spacing.xl,
  },
  heroBadgeText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.medium },
  heroTitle: { fontSize: FontSizes['4xl'], fontWeight: FontWeights.bold, color: Colors.gray900, lineHeight: 44, marginBottom: Spacing.base },
  heroTitleGradient: { color: Colors.primary },
  heroSubtitle: { fontSize: FontSizes.lg, color: Colors.gray500, lineHeight: 28, marginBottom: Spacing['2xl'] },
  heroButtons: { gap: Spacing.md },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing['2xl'] },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.primary },
  statLabel: { fontSize: FontSizes.sm, color: Colors.gray500 },
  scoreCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreLabel: { fontSize: FontSizes.sm, color: Colors.gray500, marginBottom: 4 },
  scoreValue: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.primary },
  scoreIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing['2xl'] },
  sectionTitle: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.sm, textAlign: 'center' },
  sectionSubtitle: { fontSize: FontSizes.base, color: Colors.gray500, textAlign: 'center', marginBottom: Spacing.xl },
  featureCard: { marginBottom: Spacing.md },
  featureIconBox: {
    width: 56, height: 56, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryAlpha10, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  featureTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.xs },
  featureDesc: { fontSize: FontSizes.sm, color: Colors.gray500, lineHeight: 22 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  benefitCheck: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { fontSize: FontSizes.base, color: Colors.gray700, flex: 1 },
  testimonialCard: { marginBottom: Spacing.md },
  starsRow: { flexDirection: 'row', gap: 2, marginBottom: Spacing.md },
  testimonialText: { fontSize: FontSizes.base, color: Colors.gray700, fontStyle: 'italic', marginBottom: Spacing.md, lineHeight: 24 },
  testimonialName: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.gray900 },
  testimonialRole: { fontSize: FontSizes.sm, color: Colors.gray500 },
  pricingCard: { marginBottom: Spacing.base },
  premiumCard: { borderWidth: 2, borderColor: Colors.primary },
  popularBadge: { position: 'absolute', top: -14, alignSelf: 'center' },
  popularBadgeGradient: { paddingHorizontal: Spacing.base, paddingVertical: 4, borderRadius: BorderRadius.full },
  popularBadgeText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  planName: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.sm },
  planPrice: { fontSize: FontSizes.base, color: Colors.gray500, marginBottom: Spacing.base },
  planPriceAmount: { fontSize: FontSizes['3xl'], fontWeight: FontWeights.bold, color: Colors.primary },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  planFeatureText: { fontSize: FontSizes.base, color: Colors.gray700 },
  ctaSection: {
    padding: Spacing['2xl'], marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl, alignItems: 'center', marginBottom: Spacing['2xl'],
  },
  ctaTitle: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.white, textAlign: 'center', marginBottom: Spacing.sm },
  ctaSubtitle: { fontSize: FontSizes.base, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: Spacing.xl },
  footer: { alignItems: 'center', paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.xl },
  footerText: { fontSize: FontSizes.sm, color: Colors.gray400, textAlign: 'center', marginTop: Spacing.sm },
  footerCopy: { fontSize: FontSizes.xs, color: Colors.gray400, marginTop: Spacing.base },
  bottomAuth: { paddingHorizontal: Spacing.xl, paddingBottom: 40, gap: Spacing.sm },
});
