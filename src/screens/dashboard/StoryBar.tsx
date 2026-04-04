import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Gradients } from '../../theme';

interface StoryBarProps {
  stories?: any[];
  onStoryPress?: (index: number) => void;
  onMyStoryPress?: () => void;
  t?: any;
}

const STORIES = [
  { id: 's1', name: 'Emma L.', initials: 'EL', gradient: ['#EC4899', '#F472B6'] as const, viewed: false },
  { id: 's2', name: 'Sophie M.', initials: 'SM', gradient: ['#06B6D4', '#22D3EE'] as const, viewed: false },
  { id: 's3', name: 'Marie C.', initials: 'MC', gradient: ['#8B5CF6', '#A78BFA'] as const, viewed: true },
  { id: 's4', name: 'Lena K.', initials: 'LK', gradient: ['#F97316', '#FB923C'] as const, viewed: false },
  { id: 's5', name: 'Nina B.', initials: 'NB', gradient: ['#10B981', '#34D399'] as const, viewed: true },
];

export function StoryBar({ stories = STORIES, onStoryPress, onMyStoryPress, t }: StoryBarProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.container} contentContainerStyle={s.contentContainer}>
      {stories.map((story, index) => (
        <TouchableOpacity
          key={story.id}
          style={s.storyItem}
          onPress={() => onStoryPress?.(index)}
          activeOpacity={0.7}
          accessibilityLabel={`Story de ${story.name}`}
        >
          <View style={[s.storyRing, story.viewed ? s.storyRingViewed : s.storyRingActive]}>
            <LinearGradient colors={story.gradient as readonly [string, string, ...string[]]} style={s.storyAvatar}>
              <Text style={s.storyInitials}>{story.initials}</Text>
            </LinearGradient>
          </View>
          <Text style={s.storyName} numberOfLines={1}>
            {story.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { marginTop: Spacing.base, marginBottom: Spacing.md },
  contentContainer: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  storyItem: { alignItems: 'center', width: 68 },
  storyRing: { width: 60, height: 60, borderRadius: 30, padding: 2.5, marginBottom: 4 },
  storyRingActive: { backgroundColor: 'transparent', borderWidth: 2.5, borderColor: Colors.primary },
  storyRingViewed: { borderWidth: 2, borderColor: Colors.gray300 },
  storyAvatar: { flex: 1, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  storyInitials: { fontSize: 14, fontWeight: FontWeights.bold, color: Colors.white },
  storyName: { fontSize: 10, color: Colors.gray500, fontWeight: FontWeights.medium, textAlign: 'center', width: 60 },
});
