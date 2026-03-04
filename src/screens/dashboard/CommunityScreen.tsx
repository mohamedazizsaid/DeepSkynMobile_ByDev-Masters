import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Badge, Button } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';

export function CommunityScreen() {
  const [newPostText, setNewPostText] = useState('');

  const posts = [
    {
      id: '1',
      author: 'Sarah K.',
      initials: 'SK',
      avatarGradient: ['#EC4899', '#F472B6'] as const,
      time: '2h ago',
      text: 'Just completed my 30-day skincare challenge! My skin has never looked better. The AI coach recommendations really made a difference. 🌟',
      likes: 24,
      comments: 8,
      liked: true,
    },
    {
      id: '2',
      author: 'Michael R.',
      initials: 'MR',
      avatarGradient: ['#6366F1', '#8B5CF6'] as const,
      time: '5h ago',
      text: 'Has anyone tried the new retinol routine suggestion? Looking for reviews before I start.',
      likes: 12,
      comments: 15,
      liked: false,
    },
    {
      id: '3',
      author: 'Emma L.',
      initials: 'EL',
      avatarGradient: ['#10B981', '#34D399'] as const,
      time: '1d ago',
      text: 'Sharing my before & after results from 3 months of using DeepSkyn! The evolution tracking feature is incredible for motivation.',
      likes: 56,
      comments: 22,
      liked: false,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Share & connect with others</Text>
      </View>

      {/* New Post */}
      <Card variant="elevated" style={styles.newPostCard}>
        <View style={styles.newPostHeader}>
          <LinearGradient colors={Gradients.primary} style={styles.myAvatar}>
            <Text style={styles.myAvatarText}>JD</Text>
          </LinearGradient>
          <TextInput
            style={styles.newPostInput}
            placeholder="Share your skincare journey..."
            placeholderTextColor={Colors.gray400}
            value={newPostText}
            onChangeText={setNewPostText}
            multiline
          />
        </View>
        <View style={styles.newPostActions}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="image-outline" size={20} color={Colors.gray400} />
          </TouchableOpacity>
          <Button onPress={() => {}} size="sm" disabled={!newPostText.trim()}>
            Post
          </Button>
        </View>
      </Card>

      {/* Posts Feed */}
      {posts.map((post) => (
        <Card key={post.id} style={styles.postCard}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <LinearGradient colors={[...post.avatarGradient]} style={styles.postAvatar}>
              <Text style={styles.postAvatarText}>{post.initials}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.postAuthor}>{post.author}</Text>
              <Text style={styles.postTime}>{post.time}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          </View>

          {/* Post Content */}
          <Text style={styles.postText}>{post.text}</Text>

          {/* Post Actions */}
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.postAction}>
              <Ionicons
                name={post.liked ? 'heart' : 'heart-outline'}
                size={20}
                color={post.liked ? Colors.error : Colors.gray400}
              />
              <Text style={[styles.postActionText, post.liked ? { color: Colors.error } : undefined]}>
                {post.likes}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postAction}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.gray400} />
              <Text style={styles.postActionText}>{post.comments}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postAction}>
              <Ionicons name="share-outline" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900 },
  subtitle: { fontSize: FontSizes.sm, color: Colors.gray500, marginTop: Spacing.xs },
  newPostCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl, padding: Spacing.base },
  newPostHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  myAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  myAvatarText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.white },
  newPostInput: {
    flex: 1, fontSize: FontSizes.base, color: Colors.gray700,
    minHeight: 60, textAlignVertical: 'top',
  },
  newPostActions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.sm, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  attachButton: { padding: Spacing.sm },
  postCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.md, padding: Spacing.base },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  postAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  postAvatarText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.white },
  postAuthor: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.gray900 },
  postTime: { fontSize: FontSizes.xs, color: Colors.gray400 },
  postText: { fontSize: FontSizes.base, color: Colors.gray700, lineHeight: 22, marginBottom: Spacing.md },
  postActions: {
    flexDirection: 'row', gap: Spacing.xl,
    paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  postActionText: { fontSize: FontSizes.sm, color: Colors.gray400 },
});
