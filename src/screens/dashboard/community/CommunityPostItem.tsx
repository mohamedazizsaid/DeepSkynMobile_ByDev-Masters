import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../../components';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../../theme';
import type { Post } from '../../../lib/types';
import { getRelativeTime } from '../../../lib/utils/formatters';

const REACTION_EMOJI_MAP: Record<string, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  angry: '😡',
};

const REACTION_LABEL_MAP: Record<string, string> = {
  like: 'like',
  love: 'love',
  haha: 'haha',
  angry: 'angry',
};

interface CommunityPostItemProps {
  post: Post;
  onLike: (id: string) => void;
  onReact: (id: string, reaction: string) => void;
  onComment?: (postId: string) => void;
  onArchive?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  isOwner: boolean;
  t: any;
}

export function CommunityPostItem({
  post,
  onLike,
  onReact,
  onComment,
  onArchive,
  onDelete,
  isOwner,
  t,
}: CommunityPostItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const userName = post.user?.name || 'Utilisateur';
  const initials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const gradients: readonly [string, string] = ['#6366F1', '#8B5CF6'];
  const liked = post.isLiked || false;
  const reaction = String(post.reaction || 'like').toLowerCase();
  const likeCount = post._count?.likes || 0;
  const commentCount = post._count?.comments || 0;

  const activeReactionLabel = liked
    ? (REACTION_LABEL_MAP[reaction] || 'like')
    : (t?.community?.like || 'like');

  const reactions = [
    { type: 'like', emoji: '👍' },
    { type: 'love', emoji: '❤️' },
    { type: 'haha', emoji: '😂' },
    { type: 'angry', emoji: '😡' },
  ];

  const topReactionEmojis = useMemo(() => {
    const summary = post.reactionSummary || {};
    const sorted = Object.entries(summary)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type)
      .filter((type) => !!REACTION_EMOJI_MAP[type]);

    if (sorted.length >= 3) {
      return sorted.slice(0, 3).map((type) => REACTION_EMOJI_MAP[type]);
    }

    const fallback = [reaction, 'love', 'haha', 'like', 'angry']
      .filter((type, index, arr) => !!REACTION_EMOJI_MAP[type] && arr.indexOf(type) === index)
      .slice(0, 3)
      .map((type) => REACTION_EMOJI_MAP[type]);

    while (fallback.length < 3) {
      fallback.push('👍');
    }

    return fallback;
  }, [post.reactionSummary, reaction]);

  const renderPostMessage = useMemo(() => {
    const parts = (post.message || '').split(/(@[a-zA-Z0-9._-]+)/g);
    return (
      <Text style={s.postText}>
        {parts.map((part, index) => {
          if (/^@[a-zA-Z0-9._-]+$/.test(part)) {
            return <Text key={`${part}-${index}`} style={s.mentionText}>{part}</Text>;
          }
          return <Text key={`${part}-${index}`}>{part}</Text>;
        })}
      </Text>
    );
  }, [post.message]);

  return (
    <Card style={s.postCard}>
      <View style={s.postHeader}>
        {post.user?.avatar ? (
          <Image source={{ uri: post.user.avatar }} style={s.postAvatarImage} />
        ) : (
          <LinearGradient colors={gradients} style={s.postAvatar}>
            <Text style={s.postAvatarText}>{initials}</Text>
          </LinearGradient>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.postAuthor}>{userName}</Text>
          <Text style={s.postTime}>{getRelativeTime(post.createdAt)}</Text>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={() => setShowMenu((prev) => !prev)} accessibilityLabel="Options">
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {isOwner && showMenu && (
        <View style={s.postMenu}>
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => {
              setShowMenu(false);
              onArchive?.(post.id);
            }}
          >
            <Ionicons name="archive-outline" size={16} color={Colors.gray600} />
            <Text style={s.menuText}>{t.community.archivesTab || 'Archiver'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => {
              setShowMenu(false);
              onDelete?.(post.id);
            }}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
            <Text style={[s.menuText, { color: Colors.error }]}>{t.common.delete || 'Supprimer'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderPostMessage}

      {post.media && (
        <Image source={{ uri: post.media }} style={s.postMedia} />
      )}

      <View style={s.reactionSummaryRow}>
        <View style={s.reactionStack}>
          {topReactionEmojis.map((emoji, idx) => (
            <View key={`${emoji}-${idx}`} style={[s.reactionBubble, { marginLeft: idx === 0 ? 0 : -6 }]}> 
              <Text style={s.reactionBubbleText}>{emoji}</Text>
            </View>
          ))}
        </View>
        <Text style={s.reactionSummaryText}>{likeCount}</Text>
      </View>

      <View style={s.postActions}>
        <TouchableOpacity
          style={s.postAction}
          onPress={() => {
            setShowReactions(false);
            onLike(post.id);
          }}
          onLongPress={() => setShowReactions((prev) => !prev)}
          accessibilityLabel={liked ? 'Contraimer' : 'Aimer'}
        >
          {liked && reaction !== 'like' ? (
            <Text style={s.inlineReactionEmoji}>{REACTION_EMOJI_MAP[reaction] || '👍'}</Text>
          ) : (
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? Colors.error : Colors.gray400} />
          )}
          <Text style={[s.postActionText, liked && { color: Colors.error }]}>{activeReactionLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.postAction} onPress={() => onComment?.(post.id)} accessibilityLabel="Commenter">
          <Ionicons name="chatbubble-outline" size={20} color={Colors.gray400} />
          <Text style={s.postActionText}>{commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.postAction} accessibilityLabel="Partager">
          <Ionicons name="share-outline" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </View>

      {showReactions && (
        <View style={s.reactionPicker}>
          {reactions.map((r) => (
            <TouchableOpacity
              key={r.type}
              style={s.reactionBtn}
              onPress={() => {
                setShowReactions(false);
                onReact(post.id, r.type);
              }}
            >
              <Text style={s.reactionEmoji}>{r.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  postCard: { marginHorizontal: Spacing.base, marginTop: Spacing.md, padding: Spacing.base },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  postAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  postAvatarImage: { width: 40, height: 40, borderRadius: 20 },
  postAvatarText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.white },
  postAuthor: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.gray900 },
  postTime: { fontSize: FontSizes.xs, color: Colors.gray400 },
  postText: { fontSize: FontSizes.base, color: Colors.gray700, lineHeight: 22, marginBottom: Spacing.md },
  mentionText: { color: Colors.primary, fontWeight: FontWeights.semibold },
  postMedia: { width: '100%', height: 200, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },

  reactionSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  reactionStack: { flexDirection: 'row', alignItems: 'center' },
  reactionBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionBubbleText: { fontSize: 11 },
  reactionSummaryText: { fontSize: FontSizes.xs, color: Colors.gray500, fontWeight: FontWeights.medium },

  postActions: { flexDirection: 'row', gap: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  inlineReactionEmoji: { fontSize: 18 },
  postActionText: { fontSize: FontSizes.sm, color: Colors.gray400, fontWeight: FontWeights.medium },

  reactionPicker: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  reactionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray50,
  },
  reactionEmoji: { fontSize: 16 },

  postMenu: { backgroundColor: Colors.gray50, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  menuText: { fontSize: FontSizes.sm, color: Colors.gray600, fontWeight: FontWeights.medium },
});
