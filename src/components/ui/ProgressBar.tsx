import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../../theme';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  backgroundColor?: string;
}

export function ProgressBar({
  progress,
  color = Colors.primary,
  height = 8,
  backgroundColor = Colors.gray200,
}: ProgressBarProps) {
  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: color,
            height,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {},
});
