import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, FontSizes, FontWeights } from '../../theme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { box: 32, icon: 18, text: FontSizes.lg },
    md: { box: 40, icon: 22, text: FontSizes.xl },
    lg: { box: 48, icon: 28, text: FontSizes['2xl'] },
  };

  const s = sizes[size];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.iconBox, { width: s.box, height: s.box, borderRadius: s.box * 0.25 }]}
      >
        <Ionicons name="sparkles" size={s.icon} color={Colors.white} />
      </LinearGradient>
      {showText && (
        <Text style={[styles.text, { fontSize: s.text }]}>DeepSkyn</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
});
