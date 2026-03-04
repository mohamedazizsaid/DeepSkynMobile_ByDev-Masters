import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';

interface SkinTypeStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

const skinTypes = [
  { type: 'I', description: 'Always burns, never tans', color: '#FFF5F5' },
  { type: 'II', description: 'Usually burns, tans minimally', color: '#FFF5EB' },
  { type: 'III', description: 'Sometimes burns, tans gradually', color: '#FFFAF0' },
  { type: 'IV', description: 'Rarely burns, tans easily', color: '#FEF5E7' },
  { type: 'V', description: 'Very rarely burns, tans very easily', color: '#F5E6D3' },
  { type: 'VI', description: 'Never burns, deeply pigmented', color: '#E8D5C4' },
];

const questions = [
  {
    question: 'How does your skin react to sun exposure?',
    options: [
      { value: 'always-burn', label: 'Always burns, never tans' },
      { value: 'usually-burn', label: 'Usually burns, sometimes tans' },
      { value: 'sometimes-burn', label: 'Sometimes burns, usually tans' },
      { value: 'rarely-burn', label: 'Rarely burns, always tans' },
      { value: 'never-burn', label: 'Never burns' },
    ],
  },
  {
    question: 'What is your natural hair color?',
    options: [
      { value: 'red-blonde', label: 'Red or blonde' },
      { value: 'light-brown', label: 'Light brown' },
      { value: 'brown', label: 'Brown' },
      { value: 'dark-brown', label: 'Dark brown' },
      { value: 'black', label: 'Black' },
    ],
  },
  {
    question: 'What is your natural eye color?',
    options: [
      { value: 'blue-gray-green', label: 'Blue, gray, or green' },
      { value: 'hazel', label: 'Hazel' },
      { value: 'light-brown', label: 'Light brown' },
      { value: 'brown', label: 'Brown' },
      { value: 'dark-brown-black', label: 'Dark brown or black' },
    ],
  },
];

export function SkinTypeStep({ onNext, onBack }: SkinTypeStepProps) {
  const [selectedType, setSelectedType] = useState('');
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  const handleSubmit = () => {
    onNext({ skinType: selectedType, sunSensitivity: answers });
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <LinearGradient colors={Gradients.accent} style={styles.iconBox}>
          <Ionicons name="sunny" size={32} color={Colors.white} />
        </LinearGradient>

        <Text style={styles.title}>Fitzpatrick Skin Type</Text>
        <Text style={styles.subtitle}>Understanding your skin type helps us provide better recommendations</Text>

        {/* Quick Assessment */}
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Quick Assessment</Text>
          {questions.map((q, qIndex) => (
            <View key={qIndex} style={styles.questionBlock}>
              <Text style={styles.questionText}>{q.question}</Text>
              {q.options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioOption,
                    answers[qIndex] === option.value ? styles.radioOptionActive : undefined,
                  ]}
                  onPress={() => setAnswers({ ...answers, [qIndex]: option.value })}
                >
                  <View style={[styles.radio, answers[qIndex] === option.value ? styles.radioActive : undefined]}>
                    {answers[qIndex] === option.value && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </Card>

        {/* Skin Type Selection */}
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Select Your Skin Type</Text>
          <View style={styles.skinTypeGrid}>
            {skinTypes.map((skin) => (
              <TouchableOpacity
                key={skin.type}
                style={[
                  styles.skinTypeButton,
                  { backgroundColor: skin.color },
                  selectedType === skin.type ? styles.skinTypeActive : undefined,
                ]}
                onPress={() => setSelectedType(skin.type)}
              >
                {selectedType === skin.type && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={12} color={Colors.white} />
                  </View>
                )}
                <Text style={styles.skinTypeLabel}>{skin.type}</Text>
                <Text style={styles.skinTypeDesc}>{skin.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <View style={styles.buttons}>
          <Button variant="outline" onPress={onBack} style={{ flex: 1 }}>Back</Button>
          <Button onPress={handleSubmit} style={{ flex: 1 }} disabled={!selectedType}>Continue</Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: Spacing.xl, alignItems: 'center', paddingBottom: Spacing['2xl'] },
  iconBox: {
    width: 64, height: 64, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
  },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900, textAlign: 'center', marginBottom: Spacing.md },
  subtitle: { fontSize: FontSizes.base, color: Colors.gray500, textAlign: 'center', marginBottom: Spacing['2xl'] },
  card: { width: '100%', padding: Spacing['2xl'], marginBottom: Spacing.xl },
  cardTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.xl },
  questionBlock: { marginBottom: Spacing.xl },
  questionText: { fontSize: FontSizes.base, fontWeight: FontWeights.medium, color: Colors.gray900, marginBottom: Spacing.md },
  radioOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.base, borderRadius: BorderRadius.base,
    borderWidth: 2, borderColor: Colors.gray200, marginBottom: Spacing.sm,
  },
  radioOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryAlpha5 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.gray300,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  radioLabel: { fontSize: FontSizes.base, color: Colors.gray700, flex: 1 },
  skinTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skinTypeButton: {
    width: '30%', padding: Spacing.md, borderRadius: BorderRadius.base,
    borderWidth: 2, borderColor: Colors.gray200, alignItems: 'center',
  },
  skinTypeActive: { borderColor: Colors.primary },
  checkBadge: {
    position: 'absolute', top: -8, right: -8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  skinTypeLabel: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.xs },
  skinTypeDesc: { fontSize: FontSizes.xs, color: Colors.gray500, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
});
