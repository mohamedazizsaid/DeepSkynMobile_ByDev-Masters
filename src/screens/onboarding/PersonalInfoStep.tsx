import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card } from '../../components';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';

interface PersonalInfoStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export function PersonalInfoStep({ onNext, onBack }: PersonalInfoStepProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = () => {
    onNext({ name, age, gender, location });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tell Us About Yourself</Text>
      <Text style={styles.subtitle}>This helps us personalize your skincare experience</Text>

      <Card variant="elevated" style={styles.card}>
        <Input
          label="Full Name"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          icon={<Ionicons name="person-outline" size={20} color={Colors.gray400} />}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="Age"
              placeholder="25"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              icon={<Ionicons name="calendar-outline" size={20} color={Colors.gray400} />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectLabel}>Gender</Text>
            <View style={styles.selectWrapper}>
              <TouchableWrapper gender={gender} setGender={setGender} />
            </View>
          </View>
        </View>

        <Input
          label="Location (Optional)"
          placeholder="City, Country"
          value={location}
          onChangeText={setLocation}
          icon={<Ionicons name="location-outline" size={20} color={Colors.gray400} />}
        />

        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 <Text style={{ fontWeight: FontWeights.bold }}>Why we ask:</Text> Age and location help us provide climate-specific skincare recommendations.
          </Text>
        </View>
      </Card>

      <View style={styles.buttons}>
        <Button variant="outline" onPress={onBack} style={{ flex: 1 }}>
          Back
        </Button>
        <Button onPress={handleSubmit} style={{ flex: 1 }}>
          Continue
        </Button>
      </View>
    </View>
  );
}

// Simple gender selector using TouchableOpacity

function TouchableWrapper({ gender, setGender }: { gender: string; setGender: (v: string) => void }) {
  const options = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
  const [showOptions, setShowOptions] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowOptions(!showOptions)}
      >
        <Text style={[styles.selectButtonText, !gender ? { color: Colors.gray400 } : undefined]}>
          {gender || 'Select gender'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.gray400} />
      </TouchableOpacity>
      {showOptions && (
        <View style={styles.optionsList}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionItem, gender === opt ? styles.optionItemActive : undefined]}
              onPress={() => { setGender(opt); setShowOptions(false); }}
            >
              <Text style={[styles.optionText, gender === opt ? { color: Colors.primary } : undefined]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.xl },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900, textAlign: 'center', marginBottom: Spacing.md },
  subtitle: { fontSize: FontSizes.base, color: Colors.gray500, textAlign: 'center', marginBottom: Spacing['2xl'] },
  card: { padding: Spacing['2xl'], marginBottom: Spacing.xl },
  row: { flexDirection: 'row', gap: Spacing.md },
  selectLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.gray700, marginBottom: Spacing.sm },
  selectWrapper: { marginBottom: Spacing.base },
  selectButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.gray50, borderWidth: 2, borderColor: Colors.gray200,
    borderRadius: BorderRadius.base, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  selectButtonText: { fontSize: FontSizes.base, color: Colors.gray900 },
  optionsList: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray200,
    borderRadius: BorderRadius.base, marginTop: Spacing.xs,
  },
  optionItem: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  optionItemActive: { backgroundColor: Colors.primaryAlpha5 },
  optionText: { fontSize: FontSizes.base, color: Colors.gray700 },
  tipBox: {
    backgroundColor: Colors.primaryAlpha10, borderRadius: BorderRadius.base,
    padding: Spacing.base,
  },
  tipText: { fontSize: FontSizes.sm, color: Colors.primary, lineHeight: 20 },
  buttons: { flexDirection: 'row', gap: Spacing.md },
});
