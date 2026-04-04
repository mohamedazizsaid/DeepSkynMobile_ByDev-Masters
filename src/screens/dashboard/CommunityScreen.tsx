import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Dimensions, RefreshControl, ActivityIndicator, Alert,
  Modal, Image, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Card, Badge, Button, EmptyState } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { postsService } from '../../services/posts.service';
import { usersService, type CommunityStats } from '../../services/users.service';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';
import type { Post, Comment } from '../../lib/types';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { getRelativeTime } from '../../lib/utils/formatters';
import { StoryViewerModal } from './StoryViewerModal';
import { CommunityPostItem } from './community/CommunityPostItem';
import { CommunityStoryUploadModal } from './community/CommunityStoryUploadModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CommunityTab = 'feed' | 'profile' | 'suggestions' | 'stats' | 'archive';



const SUGGESTIONS = [
  { id: 'u1', name: 'Amira B.', initials: 'AB', gradient: ['#EC4899', '#F472B6'] as const, bio: 'Passionnée skincare 🧴', skin: 'Mixte', mutual: 5 },
  { id: 'u2', name: 'Yasmine T.', initials: 'YT', gradient: ['#0EA5E9', '#38BDF8'] as const, bio: 'Dermatologue en formation', skin: 'Sensible', mutual: 3 },
  { id: 'u3', name: 'Nour E.', initials: 'NE', gradient: ['#10B981', '#34D399'] as const, bio: 'Avant/après DeepSkyn ✨', skin: 'Sèche', mutual: 8 },
  { id: 'u4', name: 'Salma K.', initials: 'SK', gradient: ['#8B5CF6', '#A78BFA'] as const, bio: 'Clean beauty 🌿', skin: 'Grasse', mutual: 2 },
  { id: 'u5', name: 'Ines M.', initials: 'IM', gradient: ['#F97316', '#FB923C'] as const, bio: 'K-beauty addict 🇰🇷', skin: 'Normale', mutual: 4 },
  { id: 'u6', name: 'Rania B.', initials: 'RB', gradient: ['#EF4444', '#F87171'] as const, bio: 'Skincare minimaliste 💧', skin: 'Mixte', mutual: 6 },
];

const STORY_STATS = [
  { name: 'Ma routine matin ☀️', views: 234, time: 'Il y a 2h' },
  { name: 'Avant/Après 3 mois', views: 189, time: 'Il y a 5h' },
  { name: 'Nouveau sérum ✨', views: 156, time: 'Il y a 8h' },
  { name: 'Tips hydratation 💧', views: 142, time: 'Il y a 12h' },
  { name: 'Mon masque DIY 🍯', views: 98, time: 'Hier' },
];

const WEEKLY_DATA = [45, 62, 38, 75, 55, 89, 67];
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ─── Sub Components ───────────────────────────────────────────────

function StoryBar({ t, stories, onStoryPress }: { t: any; stories: any[]; onStoryPress: (index: number) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.storyBar} contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.md }}>
      {stories.map((story, idx) => (
        <TouchableOpacity key={story.id} style={s.storyItem} onPress={() => onStoryPress(idx)}>
          <View style={[s.storyRing, (story as any).viewed ? s.storyRingViewed : s.storyRingActive]}>
            {story.avatar ? (
              <Image source={{ uri: story.avatar }} style={s.storyAvatar} />
            ) : (
              <LinearGradient colors={((story.gradient && story.gradient.length >= 2)
                ? story.gradient
                : ['#06B6D4', '#22D3EE']) as readonly [string, string, ...string[]]} style={s.storyAvatar}>
                <Text style={s.storyInitials}>{story.initials}</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={s.storyName} numberOfLines={1}>{story.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function PostComposer({ text, setText, onPublish, publishing, t, onMediaSelect, sentiment, onSentimentChange, location, onLocationChange, userAvatar }: { 
  text: string; 
  setText: (t: string) => void; 
  onPublish: () => void;
  publishing: boolean;
  t: any;
  onMediaSelect?: (media: string) => void;
  sentiment?: string;
  onSentimentChange?: (sentiment: string) => void;
  location?: string;
  onLocationChange?: (location: string) => void;
  userAvatar?: string | null;
}) {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [showSentiments, setShowSentiments] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const sentiments = [
    { emoji: '😍', label: 'Ravie' },
    { emoji: '😊', label: 'Contente' },
    { emoji: '😌', label: 'Detendue' },
    { emoji: '🤔', label: 'Curieuse' },
    { emoji: '😴', label: 'Fatiguee' },
  ];

  const fillCurrentLocation = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(t.common.error || 'Erreur', t.settings?.personal?.locationDesc || 'Permission localisation refusee');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const first = geo[0];
      const label = [first?.city, first?.region, first?.country].filter(Boolean).join(', ');
      onLocationChange?.(label || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
    } catch {
      Alert.alert(t.common.error || 'Erreur', 'Impossible de recuperer la localisation actuelle');
    }
  };

  const handlePickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.common.error || 'Erreur', t.community.mediaPermission || 'Permission media refusée');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      base64: true,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Media = asset.base64
        ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
        : asset.uri;
      setSelectedMedia(asset.uri);
      onMediaSelect?.(base64Media);
    }
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    if (onMediaSelect) onMediaSelect('');
  };

  return (
    <Card variant="elevated" style={s.newPostCard}>
      <View style={s.newPostHeader}>
        {userAvatar ? (
          <Image source={{ uri: userAvatar }} style={s.composerAvatarImage} />
        ) : (
          <LinearGradient colors={Gradients.primary as any} style={s.composerAvatar}>
            <Ionicons name="person" size={18} color={Colors.white} />
          </LinearGradient>
        )}
        <TextInput
          style={s.newPostInput}
          placeholder={t.community.postPlaceholder || "Quoi de neuf aujourd'hui ?"}
          placeholderTextColor={Colors.gray400}
          value={text}
          onChangeText={setText}
          multiline
          accessibilityHint="Composez votre publication"
        />
      </View>

      {selectedMedia && (
        <View style={s.mediaPreview}>
          <Image source={{ uri: selectedMedia }} style={s.mediaImage} />
          <TouchableOpacity style={s.removeMediaBtn} onPress={handleRemoveMedia} accessibilityLabel="Supprimer la photo">
            <Ionicons name="close-circle" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {showSentiments && (
        <View style={s.sentimentRow}>
          {sentiments.map((item) => {
            const isActive = sentiment === item.label;
            return (
              <TouchableOpacity
                key={item.label}
                style={[s.sentimentChip, isActive && s.sentimentChipActive]}
                onPress={() => onSentimentChange?.(isActive ? '' : item.label)}
              >
                <Text style={s.sentimentEmoji}>{item.emoji}</Text>
                <Text style={[s.sentimentLabel, isActive && s.sentimentLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {showLocation && (
        <View style={s.locationRow}>
          <Ionicons name="location" size={16} color={Colors.primary} />
          <TextInput
            style={s.locationInput}
            placeholder={t.community.locationPlaceholder || 'Ajouter une localisation'}
            placeholderTextColor={Colors.gray400}
            value={location || ''}
            onChangeText={(value) => onLocationChange?.(value)}
          />
          <TouchableOpacity onPress={fillCurrentLocation} style={s.currentLocationBtn}>
            <Ionicons name="locate" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={s.newPostActions}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <TouchableOpacity style={s.attachButton} onPress={handlePickMedia}>
            <Ionicons name="image-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.attachButton} onPress={() => setShowSentiments((prev) => !prev)}>
            <Ionicons name="happy-outline" size={20} color={showSentiments ? Colors.primary : Colors.gray400} />
          </TouchableOpacity>
          <TouchableOpacity style={s.attachButton} onPress={() => setShowLocation((prev) => !prev)}>
            <Ionicons name="location-outline" size={20} color={showLocation ? Colors.primary : Colors.gray400} />
          </TouchableOpacity>
        </View>
        <Button onPress={onPublish} size="sm" disabled={!text.trim() || publishing}>
          {publishing ? '...' : (t.community.publications || 'Publier')}
        </Button>
      </View>
    </Card>
  );
}

function PostItem({
  post,
  onLike,
  onReact,
  onComment,
  onArchive,
  onDelete,
  isOwner,
  t,
}: {
  post: Post;
  onLike: (id: string) => void;
  onReact: (id: string, reaction: string) => void;
  onComment?: (postId: string) => void;
  onArchive?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  isOwner: boolean;
  t: any;
}) {
  return (
    <CommunityPostItem
      post={post}
      onLike={onLike}
      onReact={onReact}
      onComment={onComment}
      onArchive={onArchive}
      onDelete={onDelete}
      isOwner={isOwner}
      t={t}
    />
  );
}

function SuggestionCard({ user, onFollow, t }: { user: typeof SUGGESTIONS[0]; onFollow: () => void, t: any }) {
  const [following, setFollowing] = useState(false);
  return (
    <Card style={s.suggestionCard}>
      <LinearGradient colors={['rgba(14,165,233,0.15)', 'rgba(139,92,246,0.15)']} style={s.suggestionBanner} />
      <View style={s.suggestionContent}>
        <LinearGradient colors={[...user.gradient]} style={s.suggestionAvatar}>
          <Text style={s.suggestionInitials}>{user.initials}</Text>
        </LinearGradient>
        <Text style={s.suggestionName} numberOfLines={1}>{user.name}</Text>
        <Text style={s.suggestionBio} numberOfLines={1}>{user.bio}</Text>
        <View style={s.suggestionMeta}>
          <Badge variant="primary" size="sm" text={t.community.skinType.replace('{type}', user.skin)} />
          <Text style={s.suggestionMutual}>{user.mutual} {t.community.inCommon}</Text>
        </View>
        <TouchableOpacity
          style={[s.followBtn, following && s.followBtnActive]}
          onPress={() => {
            setFollowing(!following);
            onFollow();
          }}
        >
          <Ionicons name={following ? 'checkmark' : 'person-add-outline'} size={14} color={following ? Colors.gray500 : Colors.white} />
          <Text style={[s.followBtnText, following && s.followBtnTextActive]}>
            {following ? 'Suivi' : t.community.subscriptions || 'Suivre'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function StatKPI({ icon, label, value, change, color, isUp }: { icon: string; label: string; value: string; change: string; color: string; isUp: boolean }) {
  return (
    <Card style={s.statKpi}>
      <View style={[s.statIconWrap, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      <View style={[s.statBadge, { backgroundColor: isUp ? '#DCFCE7' : '#FEE2E2' }]}>
        <Text style={{ fontSize: 10, fontWeight: '600' as any, color: isUp ? '#16A34A' : '#DC2626' }}>
          {isUp ? '↑' : '↓'} {change}
        </Text>
      </View>
    </Card>
  );
}

// Composant: Modal Commentaires Posts
function CommentsModal({ 
  isOpen, 
  onClose, 
  postId, 
  t, 
  comments = [], 
  onAddComment, 
  onDeleteComment,
  onLikeComment 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  postId: string; 
  t: any;
  comments?: Comment[];
  onAddComment: (comment: string) => void;
  onDeleteComment: (commentId: string) => void;
  onLikeComment: (commentId: string) => void;
}) {
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <SafeAreaView style={s.modalContainer} edges={['top', 'left', 'right', 'bottom']}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="chevron-down" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Text style={s.modalTitle}>{t.community.comments || 'Commentaires'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={s.commentItem}>
              <LinearGradient colors={Gradients.primary} style={s.commentAvatar}>
                <Text style={s.commentAvatarText}>{item.user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.commentAuthor}>{item.user?.name || t.common.user}</Text>
                <Text style={s.commentText}>{item.comment || item.message}</Text>
                <Text style={s.commentTime}>{getRelativeTime(item.createdAt)}</Text>
              </View>
              <View style={s.commentActions}>
                <TouchableOpacity onPress={() => onLikeComment(item.id)}>
                  <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={16} color={item.isLiked ? Colors.error : Colors.gray400} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDeleteComment(item.id)}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.emptyComments}>
              <Ionicons name="chatbubble-outline" size={32} color={Colors.gray300} />
              <Text style={s.emptyText}>{t.community.noComments || 'Pas de commentaires'}</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        <View style={s.commentInputContainer}>
          <TextInput
            style={s.commentInput}
            placeholder={t.community.addComment || 'Ajouter un commentaire...'}
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity onPress={handleSendComment} disabled={!newComment.trim() || sendingComment}>
            <Ionicons name="send" size={20} color={newComment.trim() ? Colors.primary : Colors.gray300} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// Composant: Modal Upload Story
function StoryUploadModal({ 
  isOpen, 
  onClose, 
  onUpload, 
  t 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onUpload: (media: string, musicUrl?: string, musicTitle?: string) => void;
  t: any;
}) {
  return <CommunityStoryUploadModal isOpen={isOpen} onClose={onClose} onUpload={onUpload} t={t} />;
}

// ─── Main Component ───────────────────────────────────────────────

export function CommunityScreen() {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [archivedPosts, setArchivedPosts] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postText, setPostText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [selectedPostMedia, setSelectedPostMedia] = useState<string | null>(null);
  const [selectedSentiment, setSelectedSentiment] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<CommunityStats>({
    posts: 0,
    followers: 0,
    following: 0,
    totalLikes: 0,
    totalComments: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    storyViews: 0,
    impressions: 0,
    shares: 0,
    recentFollowersAvatars: [],
    followersDetail: [],
  });
  
  // Commentaires et modales
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Story upload
  const [storyUploadOpen, setStoryUploadOpen] = useState(false);

  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [profileCover, setProfileCover] = useState<string | null>(null);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [updatingCover, setUpdatingCover] = useState(false);

  const { user, loadUser } = useAuthStore();

  useEffect(() => {
    setProfileAvatar(user?.avatar || null);
    setProfileCover(user?.coverPhoto || null);
  }, [user?.avatar, user?.coverPhoto]);

  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.backgroundSecondary },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text },
    subtitle: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: Spacing.xs },
  }), [colors, fontSizes]);

  const loadPosts = useCallback(async () => {
    try {
      const feedResponse = await postsService.getFeed(1, 20);
      setPosts(feedResponse.data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }, []);

  const loadArchivedPosts = useCallback(async () => {
    try {
      const archivedResponse = await postsService.getArchivedPosts(1, 20);
      setArchivedPosts(archivedResponse.data || []);
    } catch (error) {
      console.error('Error loading archived posts:', error);
    }
  }, []);

  const loadMyPosts = useCallback(async () => {
    try {
      const myPostsResponse = await postsService.getMyPosts(1, 20);
      setMyPosts(myPostsResponse.data || []);
    } catch (error) {
      console.error('Error loading my posts:', error);
    }
  }, []);

  const loadComments = useCallback(async (postId: string) => {
    setLoadingComments(true);
    try {
      const result = await postsService.getComments(postId);
      setPostComments(result.data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const loadStories = useCallback(async () => {
    try {
      const storyItems = await postsService.getActiveStories();
      const grouped = new Map<string, any>();

      storyItems.forEach((story: any) => {
        if (!grouped.has(story.userId)) {
          const name = story.name || t.common.user || 'User';
          const initials = name
            .split(' ')
            .map((n: string) => n.charAt(0))
            .join('')
            .slice(0, 2)
            .toUpperCase();

          grouped.set(story.userId, {
            id: story.userId,
            name,
            avatar: story.avatar,
            initials,
            viewed: false,
            gradient: ['#06B6D4', '#22D3EE'] as const,
            items: [],
          });
        }

        grouped.get(story.userId).items.push({
          id: story.id,
          mediaUrl: story.mediaUrl,
          musicUrl: story.musicUrl || story.music?.url || story.songUrl || undefined,
          musicTitle: story.musicTitle || story.music?.title || story.songTitle || undefined,
          createdAt: story.createdAt,
          likesCount: story.likesCount || 0,
          commentsCount: story.commentsCount || 0,
          isLiked: story.isLiked || false,
        });
      });

      setStories(Array.from(grouped.values()));
    } catch (error) {
      console.error('Error loading stories:', error);
      setStories([]);
    }
  }, [t.common.user]);

  const loadSuggestions = useCallback(async () => {
    try {
      const data = await usersService.getSuggestions();
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions([]);
    }
  }, []);

  const loadUserStats = useCallback(async () => {
    const userId = user?.id || user?.sub;
    if (!userId) return;
    try {
      const stats = await usersService.getUserStats(userId);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }, [user?.id, user?.sub]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadPosts(),
      loadMyPosts(),
      loadArchivedPosts(),
      loadStories(),
      loadSuggestions(),
      loadUserStats(),
    ]);
    setLoading(false);
  }, [loadPosts, loadMyPosts, loadArchivedPosts, loadStories, loadSuggestions, loadUserStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handlePublish = async () => {
    if (!postText.trim()) return;
    setPublishing(true);
    try {
      const sentimentPart = selectedSentiment ? `\n\nSentiment: ${selectedSentiment}` : '';
      const locationPart = postLocation.trim() ? `\n📍 ${postLocation.trim()}` : '';
      const message = `${postText.trim()}${sentimentPart}${locationPart}`;
      const newPost = await postsService.create({ message, media: selectedPostMedia || undefined });
      setPosts((prev) => [newPost, ...prev]);
      setMyPosts((prev) => [newPost, ...prev]);
      setPostText('');
      setSelectedPostMedia(null);
      setSelectedSentiment('');
      setPostLocation('');
      await loadData();
      Alert.alert(t.common.success || 'Succès', t.community.postPublished || 'Votre publication a été créée !');
    } catch (error) {
      Alert.alert(t.common.error || 'Erreur', t.community.uploadError || 'Impossible de publier pour le moment');
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const result = await postsService.toggleLike(postId, 'like');
      const updateLike = (postList: Post[]) => 
        postList.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: result?.liked ?? !p.isLiked,
              reaction: result?.type || 'like',
              _count: { 
                ...p._count, 
                likes: result?.likesCount ?? (p._count?.likes || 0),
                comments: p._count?.comments || 0,
              },
            };
          }
          return p;
        });
      setPosts(updateLike);
      setMyPosts(updateLike);
      setArchivedPosts(updateLike);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleReaction = async (postId: string, reaction: string) => {
    try {
      const result = await postsService.toggleLike(postId, reaction);
      const applyReaction = (postList: Post[]) =>
        postList.map((p) => p.id === postId
          ? {
              ...p,
              isLiked: result?.liked ?? true,
              reaction: result?.type || reaction,
              _count: {
                ...p._count,
                likes: result?.likesCount ?? (p._count?.likes || 0),
                comments: p._count?.comments || 0,
              },
            }
          : p);
      setPosts(applyReaction);
      setMyPosts(applyReaction);
      setArchivedPosts(applyReaction);
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  };

  const handleCommentPress = (postId: string) => {
    setSelectedPostId(postId);
    loadComments(postId);
    setCommentsModalOpen(true);
  };

  const handleAddComment = async (comment: string) => {
    if (!selectedPostId) return;
    try {
      const result = await postsService.addComment({ postId: selectedPostId, comment });
      setPostComments((prev) => [...prev, result]);
      setPosts((prev) => prev.map((p) => p.id === selectedPostId
        ? {
            ...p,
            _count: {
              ...p._count,
              likes: p._count?.likes || 0,
              comments: (p._count?.comments || 0) + 1,
            },
          }
        : p
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await postsService.deleteComment(commentId);
      setPostComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await postsService.toggleCommentLike(commentId);
      setPostComments((prev) => prev.map((c) => c.id === commentId
        ? { ...c, isLiked: !c.isLiked, _count: { ...c._count, likes: (c._count?.likes || 0) + (c.isLiked ? -1 : 1) } }
        : c
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleStoryUpload = async (media: string, musicUrl?: string, musicTitle?: string) => {
    try {
      await postsService.createStory(media, user?.id || user?.sub || '', musicUrl, musicTitle);
      await loadStories();
      Alert.alert(t.common.success || 'Succès', t.community.storySuccess || 'Story publiée !');
    } catch (error) {
      Alert.alert(t.common.error || 'Erreur', t.community.storyError || 'Erreur lors de la publication');
    }
  };

  const handleArchivePost = async (postId: string) => {
    try {
      await postsService.toggleArchive(postId);
      await Promise.all([loadPosts(), loadMyPosts(), loadArchivedPosts(), loadUserStats()]);
      Alert.alert(t.common.success || 'Succes', t.community.archivesTab || 'Post archive');
    } catch {
      Alert.alert(t.common.error || 'Erreur', t.community.uploadError || 'Impossible d\'archiver cette publication');
    }
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(t.common.delete || 'Supprimer', ((t.community as any)?.deletePostConfirm) || 'Supprimer cette publication ?', [
      { text: t.common.cancel || 'Annuler', style: 'cancel' },
      {
        text: t.common.delete || 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await postsService.delete(postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            setMyPosts((prev) => prev.filter((p) => p.id !== postId));
            setArchivedPosts((prev) => prev.filter((p) => p.id !== postId));
            await loadUserStats();
          } catch {
            Alert.alert(t.common.error || 'Erreur', t.community.uploadError || 'Impossible de supprimer cette publication');
          }
        },
      },
    ]);
  };

  const pickAndUploadAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.common.error || 'Erreur', 'Permission media refusee');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || result.assets.length === 0 || !result.assets[0].base64) return;

    setUpdatingAvatar(true);
    try {
      const asset = result.assets[0];
      const base64 = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
      await authService.updateAvatar(base64);
      await loadUser();
      Alert.alert(t.common.success || 'Succes', t.community.avatarUpdated || 'Photo de profil mise a jour');
    } catch {
      Alert.alert(t.common.error || 'Erreur', t.community.uploadError || 'Impossible de mettre a jour la photo');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const pickAndUploadCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.common.error || 'Erreur', 'Permission media refusee');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      base64: true,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (result.canceled || result.assets.length === 0 || !result.assets[0].base64) return;

    setUpdatingCover(true);
    try {
      const asset = result.assets[0];
      const base64 = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
      await authService.updateCoverPhoto(base64);
      await loadUser();
      Alert.alert(t.common.success || 'Succes', t.community.coverUpdated || 'Photo de couverture mise a jour');
    } catch {
      Alert.alert(t.common.error || 'Erreur', t.community.uploadError || 'Impossible de mettre a jour la couverture');
    } finally {
      setUpdatingCover(false);
    }
  };

  const currentUserId = user?.id || user?.sub;
  const ownStory = stories.find((st: any) => st.id === currentUserId);
  const otherStories = stories.filter((st: any) => st.id !== currentUserId);

  const TABS: { key: CommunityTab; label: string; icon: string }[] = [
    { key: 'feed', label: t.community.feed, icon: 'newspaper-outline' },
    { key: 'profile', label: t.community.profile, icon: 'person-outline' },
    { key: 'suggestions', label: t.community.suggestions, icon: 'people-outline' },
  ];

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={dynamicStyles.container}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.title}>{t.nav.community || 'Communauté'}</Text>
              <Text style={dynamicStyles.subtitle}>{t.dashboard.shareDiscover || 'Partagez votre parcours skincare'}</Text>
            </View>
            <View style={s.headerActions}>
              <TouchableOpacity
                style={[s.headerActionBtn, activeTab === 'archive' && s.headerActionBtnActive]}
                onPress={() => setActiveTab('archive')}
                accessibilityLabel={t.community.archivesTab || 'Archives'}
              >
                <Ionicons name="archive-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.headerActionBtn, activeTab === 'stats' && s.headerActionBtnActive]}
                onPress={() => setActiveTab('stats')}
                accessibilityLabel={t.community.stats || 'Statistiques'}
              >
                <Ionicons name="bar-chart-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

      {/* Tab Bar */}
      <View style={s.tabBarWrap}>
        <View style={s.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tabItem, activeTab === tab.key && s.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
              accessibilityLabel={`Tab ${tab.label}`}
            >
              <Ionicons
                name={activeTab === tab.key ? (tab.icon.replace('-outline', '') as any) : (tab.icon as any)}
                size={17}
                color={activeTab === tab.key ? Colors.white : Colors.gray400}
              />
              <Text numberOfLines={1} style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ═══ FEED TAB ═══ */}
      {activeTab === 'feed' && (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          <View style={s.storyBarContainer}>
            <View style={s.storyOwnWrap}>
              <TouchableOpacity
                style={s.storyItemOwn}
                onPress={() => {
                  if (ownStory) {
                    const idx = stories.findIndex((st: any) => st.id === currentUserId);
                    setSelectedStoryIndex(idx >= 0 ? idx : 0);
                  } else {
                    setStoryUploadOpen(true);
                  }
                }}
              >
                <View style={s.storyRingOwn}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={s.storyAvatar} />
                  ) : (
                    <LinearGradient colors={Gradients.primary as any} style={s.storyAvatar}>
                      <Ionicons name="person" size={20} color={Colors.white} />
                    </LinearGradient>
                  )}
                </View>
                <Text style={s.storyName} numberOfLines={1}>{t.community.yourStory || 'Votre story'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.addStoryMiniBtnAttached} onPress={() => setStoryUploadOpen(true)}>
                <Ionicons name="add" size={11} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <StoryBar t={t} stories={otherStories} onStoryPress={(idx) => {
              const target = otherStories[idx];
              const globalIdx = stories.findIndex((sItem: any) => sItem.id === target?.id);
              setSelectedStoryIndex(globalIdx >= 0 ? globalIdx : 0);
            }} />
          </View>

          <PostComposer 
            text={postText} 
            setText={setPostText} 
            onPublish={handlePublish} 
            publishing={publishing} 
            t={t}
            onMediaSelect={setSelectedPostMedia}
            sentiment={selectedSentiment}
            onSentimentChange={setSelectedSentiment}
            location={postLocation}
            onLocationChange={setPostLocation}
            userAvatar={user?.avatar}
          />
          {loading ? (
            <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : posts.length === 0 ? (
            <EmptyState
              icon="chatbubbles-outline"
              title={t.community.noPosts || 'Aucune publication'}
              description={t.community.beFirst || 'Soyez le premier à publier !'}
            />
          ) : (
            posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                onLike={handleLike}
                onReact={handleReaction}
                onComment={handleCommentPress}
                onArchive={handleArchivePost}
                onDelete={handleDeletePost}
                isOwner={post.userId === currentUserId}
                t={t}
              />
            ))
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* ═══ PROFILE TAB ═══ */}
      {activeTab === 'profile' && (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* Profile Hero */}
          <Card style={s.profileCard}>
            <TouchableOpacity onPress={pickAndUploadCover} activeOpacity={0.85}>
              {profileCover ? (
                <Image source={{ uri: profileCover }} style={s.profileCoverImage} />
              ) : (
                <LinearGradient colors={Gradients.secondary} style={s.profileCover} />
              )}
              <View style={s.profileCoverAction}>
                {updatingCover ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name="camera" size={16} color={Colors.white} />}
              </View>
            </TouchableOpacity>
            <View style={s.profileBody}>
              <TouchableOpacity style={s.profileAvatarWrap} onPress={pickAndUploadAvatar} activeOpacity={0.85}>
                {profileAvatar ? (
                  <Image source={{ uri: profileAvatar }} style={s.profileAvatarImage} />
                ) : (
                  <LinearGradient colors={Gradients.primary} style={s.profileAvatar}>
                    <Ionicons name="person" size={32} color={Colors.white} />
                  </LinearGradient>
                )}
                <View style={s.profileAvatarAction}>
                  {updatingAvatar ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name="camera" size={12} color={Colors.white} />}
                </View>
              </TouchableOpacity>
              <Text style={s.profileName}>{user?.name || t.nav.profile}</Text>
              <Text style={s.profileHandle}>@{user?.name?.toLowerCase().replace(/\s+/g, '') || 'utilisateur'}</Text>
              <Text style={s.profileBio}>{t.community.welcomeBio || 'Bienvenue dans la communauté DeepSkyn ! 💙'}</Text>
              <View style={s.profileStats}>
                <View style={s.profileStat}>
                  <Text style={s.profileStatNum}>{myPosts.length}</Text>
                  <Text style={s.profileStatLabel}>{t.community.posts || 'Posts'}</Text>
                </View>
                <View style={s.profileStatDivider} />
                <View style={s.profileStat}>
                  <Text style={s.profileStatNum}>{userStats.followers}</Text>
                  <Text style={s.profileStatLabel}>{t.community.followers || 'Abonnés'}</Text>
                </View>
                <View style={s.profileStatDivider} />
                <View style={s.profileStat}>
                  <Text style={s.profileStatNum}>{userStats.following}</Text>
                  <Text style={s.profileStatLabel}>{t.community.subscriptions || 'Abonnements'}</Text>
                </View>
              </View>
            </View>
          </Card>
          <PostComposer
            text={postText}
            setText={setPostText}
            onPublish={handlePublish}
            publishing={publishing}
            t={t}
            onMediaSelect={setSelectedPostMedia}
            sentiment={selectedSentiment}
            onSentimentChange={setSelectedSentiment}
            location={postLocation}
            onLocationChange={setPostLocation}
            userAvatar={user?.avatar}
          />
          {myPosts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              onLike={handleLike}
              onReact={handleReaction}
              onComment={handleCommentPress}
              onArchive={handleArchivePost}
              onDelete={handleDeletePost}
              isOwner={true}
              t={t}
            />
          ))}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* ═══ ARCHIVE TAB ═══ */}
      {activeTab === 'archive' && (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconWrap, { backgroundColor: Colors.primaryAlpha10 }]}>
              <Ionicons name="archive" size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={s.sectionTitle}>{t.community.archivesTab || 'Archives'}</Text>
              <Text style={s.sectionSubtitle}>Vos publications archivees</Text>
            </View>
          </View>
          {archivedPosts.length === 0 ? (
            <EmptyState
              icon="archive-outline"
              title={t.community.noPosts || 'Aucune archive'}
              description="Vos publications archivees apparaitront ici"
            />
          ) : (
            archivedPosts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                onLike={handleLike}
                onReact={handleReaction}
                onComment={handleCommentPress}
                onArchive={handleArchivePost}
                onDelete={handleDeletePost}
                isOwner={true}
                t={t}
              />
            ))
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* ═══ SUGGESTIONS TAB ═══ */}
      {activeTab === 'suggestions' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconWrap, { backgroundColor: Colors.primaryAlpha10 }]}>
              <Ionicons name="sparkles" size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={s.sectionTitle}>{t.community.suggestionsForYou || 'Suggestions pour vous'}</Text>
              <Text style={s.sectionSubtitle}>{t.community.skinEnthusiasts || 'Passionnés de skincare'}</Text>
            </View>
          </View>
          <View style={s.suggestionsGrid}>
            {suggestions.map((sUser: any, idx: number) => {
              const displayUser = {
                id: sUser.id,
                name: sUser.name || 'User',
                initials: (sUser.name || 'User').split(' ').map((n: string) => n.charAt(0)).join('').slice(0, 2).toUpperCase(),
                gradient: ['#0EA5E9', '#38BDF8'] as const,
                bio: sUser.email || t.community.skinEnthusiasts || 'Skincare enthusiast',
                skin: sUser?.skinProfile?.skinType || 'Mixte',
                mutual: 0,
              };
              return (
              <SuggestionCard
                key={displayUser.id || idx}
                user={displayUser}
                onFollow={async () => {
                  try {
                    await usersService.toggleFollow(displayUser.id);
                    await Promise.all([loadSuggestions(), loadUserStats()]);
                  } catch (error) {
                    console.error('Error toggling follow:', error);
                  }
                }}
                t={t}
              />
              );
            })}
          </View>
          {suggestions.length === 0 && (
            <EmptyState
              icon="people-outline"
              title={t.community.suggestions || 'Aucune suggestion'}
              description="Revenez plus tard pour decouvrir de nouveaux profils"
            />
          )}
        </ScrollView>
      )}

      {/* ═══ STATS TAB ═══ */}
      {activeTab === 'stats' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconWrap, { backgroundColor: Colors.primaryAlpha10 }]}>
              <Ionicons name="analytics" size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={s.sectionTitle}>{t.stats.title || 'Statistiques'}</Text>
              <Text style={s.sectionSubtitle}>{t.stats.weekPerformance || 'Performance hebdomadaire'}</Text>
            </View>
          </View>

          {/* KPI Grid */}
          <View style={s.kpiGrid}>
            <StatKPI icon="eye-outline" label={t.stats.storyViews || 'Vues stories'} value={`${userStats.storyViews || 0}`} change="--" color={Colors.primary} isUp={true} />
            <StatKPI icon="heart-outline" label={t.stats.likesReceived || 'J\'aimes reçus'} value={`${userStats.totalLikes || 0}`} change="--" color={Colors.error} isUp={true} />
            <StatKPI icon="chatbubble-outline" label={t.stats.commentsCount || 'Commentaires'} value={`${userStats.totalComments || 0}`} change="--" color="#8B5CF6" isUp={true} />
            <StatKPI icon="share-outline" label={t.stats.shares || 'Partages'} value={`${userStats.shares || 0}`} change="--" color="#F97316" isUp={false} />
          </View>

          {/* Weekly Activity */}
          <Card style={s.chartCard}>
            <View style={s.chartHeader}>
              <Text style={s.chartTitle}>{t.stats.weeklyActivity || 'Activité hebdomadaire'}</Text>
              <Text style={s.chartTotal}>{(userStats.weeklyActivity || WEEKLY_DATA).reduce((a, b) => a + b, 0)} {t.stats.total || 'total'}</Text>
            </View>
            <View style={s.barChart}>
              {(userStats.weeklyActivity && userStats.weeklyActivity.length ? userStats.weeklyActivity : WEEKLY_DATA).map((val, i) => {
                const data = (userStats.weeklyActivity && userStats.weeklyActivity.length ? userStats.weeklyActivity : WEEKLY_DATA);
                const max = Math.max(...data, 1);
                return (
                  <View key={i} style={s.barCol}>
                    <View style={[s.bar, { height: (val / max) * 80, backgroundColor: Colors.primary, opacity: 0.3 + (val / max) * 0.7 }]} />
                    <Text style={s.barLabel}>{DAYS[i]}</Text>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Engagement */}
          <Card style={s.chartCard}>
            <Text style={s.chartTitle}>{t.stats.engagementRate || 'Taux d\'engagement'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: Spacing.sm }}>
              <Text style={{ fontSize: 32, fontWeight: '700' as any, color: Colors.gray900 }}>8.4%</Text>
              <View style={[s.statBadge, { backgroundColor: '#DCFCE7', marginBottom: 6 }]}>
                <Text style={{ fontSize: 10, fontWeight: '600' as any, color: '#16A34A' }}>↑ +2.1%</Text>
              </View>
            </View>
            {[
              { label: t.stats.organicReach || 'Portée organique', pct: 72, color: Colors.primary },
              { label: t.stats.clickRate || 'Taux de clic', pct: 45, color: '#8B5CF6' },
              { label: t.stats.storyRetention || 'Rétention stories', pct: 61, color: '#EC4899' },
            ].map((m, i) => (
              <View key={i} style={{ marginTop: Spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: Colors.gray500 }}>{m.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700' as any, color: Colors.gray900 }}>{m.pct}%</Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: Colors.gray100 }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: m.color, width: `${m.pct}%` }} />
                </View>
              </View>
            ))}
          </Card>

          {/* Story Views */}
          <Card style={s.chartCard}>
            <View style={s.chartHeader}>
              <Text style={s.chartTitle}>{t.stats.viewsPerStory || 'Vues par story'}</Text>
              <Badge variant="primary" size="sm" text={`819 ${t.stats.totalViews?.replace(' totales', '') || ''}`} />
            </View>
            {STORY_STATS.map((story, i) => (
              <View key={i} style={[s.storyStatRow, i < STORY_STATS.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.gray100 }]}>
                <View style={s.storyStatDot}>
                  <LinearGradient colors={Gradients.primary} style={s.storyStatGrad}>
                    <Ionicons name="eye-outline" size={14} color={Colors.white} />
                  </LinearGradient>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600' as any, color: Colors.gray900 }}>{story.name}</Text>
                  <Text style={{ fontSize: 11, color: Colors.gray400 }}>{story.time}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="eye-outline" size={14} color={Colors.gray400} />
                  <Text style={{ fontSize: 14, fontWeight: '700' as any, color: Colors.gray900 }}>{story.views}</Text>
                </View>
              </View>
            ))}
          </Card>
        </ScrollView>
      )}

      {/* ═══ MODALS ═══ */}
      <CommentsModal
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        postId={selectedPostId || ''}
        t={t}
        comments={postComments}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onLikeComment={handleLikeComment}
      />

      <StoryUploadModal
        isOpen={storyUploadOpen}
        onClose={() => setStoryUploadOpen(false)}
        onUpload={handleStoryUpload}
        t={t}
      />

      <StoryViewerModal
        isOpen={selectedStoryIndex !== null}
        onClose={() => setSelectedStoryIndex(null)}
        stories={stories}
        initialUserIndex={selectedStoryIndex || 0}
      />
    </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: { paddingHorizontal: Spacing.xl, paddingTop: 0, paddingBottom: Spacing.xs },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryAlpha10,
  },
  headerActionBtnActive: {
    backgroundColor: 'rgba(14,165,233,0.22)',
  },

  // Tab Bar
  tabBarWrap: { marginTop: Spacing.xs, marginHorizontal: Spacing.base },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 4,
    ...Shadows.sm,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs, borderRadius: BorderRadius.lg,
  },
  tabItemActive: { backgroundColor: Colors.primary },
  tabLabel: { fontSize: 11, fontWeight: FontWeights.semibold, color: Colors.gray400 },
  tabLabelActive: { color: Colors.white },

  // Stories
  storyBarContainer: { flexDirection: 'row', marginTop: Spacing.base, alignItems: 'center', paddingHorizontal: Spacing.base, gap: Spacing.xs },
  storyOwnWrap: { alignItems: 'center', width: 68, marginRight: Spacing.xs, position: 'relative' },
  storyItemOwn: { alignItems: 'center', width: 68, marginRight: 0 },
  storyRingOwn: { width: 60, height: 60, borderRadius: 30, padding: 2.5, marginBottom: 4, borderWidth: 2, borderColor: Colors.gray200, borderStyle: 'dashed' },
  addStoryMiniBtnAttached: {
    position: 'absolute',
    right: 4,
    bottom: 18,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.white,
    zIndex: 5,
  },
  storyBar: { flex: 1, marginTop: 0, paddingHorizontal: 0 },
  storyItem: { alignItems: 'center', width: 68 },
  storyRing: { width: 60, height: 60, borderRadius: 30, padding: 2.5, marginBottom: 4 },
  storyRingActive: { backgroundColor: 'transparent', borderWidth: 2.5, borderColor: Colors.primary },
  storyRingViewed: { borderWidth: 2, borderColor: Colors.gray300 },
  storyAvatar: { flex: 1, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  storyInitials: { fontSize: 14, fontWeight: FontWeights.bold, color: Colors.white },
  storyName: { fontSize: 10, color: Colors.gray500, fontWeight: FontWeights.medium, textAlign: 'center', width: 60 },

  // Post Composer
  newPostCard: { marginHorizontal: Spacing.base, marginTop: Spacing.md, padding: Spacing.base },
  newPostHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  composerAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  composerAvatarImage: { width: 38, height: 38, borderRadius: 19 },
  newPostInput: { flex: 1, fontSize: FontSizes.base, color: Colors.gray700, minHeight: 50, textAlignVertical: 'top' },
  newPostActions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  attachButton: { padding: Spacing.xs },
  sentimentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.md },
  sentimentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
  },
  sentimentChipActive: { backgroundColor: Colors.primaryAlpha10 },
  sentimentEmoji: { fontSize: 12 },
  sentimentLabel: { fontSize: 11, color: Colors.gray600, fontWeight: FontWeights.medium },
  sentimentLabelActive: { color: Colors.primary },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  locationInput: { flex: 1, fontSize: 12, color: Colors.gray700, paddingVertical: 4 },
  currentLocationBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryAlpha10,
  },
  mediaPreview: { position: 'relative', marginTop: Spacing.md, borderRadius: BorderRadius.lg, overflow: 'hidden', height: 150 },
  mediaImage: { width: '100%', height: '100%', borderRadius: BorderRadius.lg },
  removeMediaBtn: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: Spacing.xs },

  // Post Card
  postCard: { marginHorizontal: Spacing.base, marginTop: Spacing.md, padding: Spacing.base },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  postAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  postAvatarImage: { width: 40, height: 40, borderRadius: 20 },
  postAvatarText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.white },
  postAuthor: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.gray900 },
  postTime: { fontSize: FontSizes.xs, color: Colors.gray400 },
  postText: { fontSize: FontSizes.base, color: Colors.gray700, lineHeight: 22, marginBottom: Spacing.md },
  postMedia: { width: '100%', height: 200, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  postActions: { flexDirection: 'row', gap: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  inlineReactionEmoji: { fontSize: 18 },
  postActionText: { fontSize: FontSizes.sm, color: Colors.gray400 },
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
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  menuText: { fontSize: FontSizes.sm, color: Colors.gray600, fontWeight: FontWeights.medium },

  // Profile
  profileCard: { marginHorizontal: Spacing.base, marginTop: Spacing.md, overflow: 'hidden' },
  profileCover: { height: 100 },
  profileCoverImage: { width: '100%', height: 100 },
  profileCoverAction: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBody: { alignItems: 'center', paddingBottom: Spacing.xl },
  profileAvatarWrap: { marginTop: -35, borderRadius: 40, borderWidth: 4, borderColor: Colors.white, overflow: 'hidden' },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  profileAvatarImage: { width: 72, height: 72, borderRadius: 36 },
  profileAvatarAction: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900, marginTop: Spacing.sm },
  profileHandle: { fontSize: FontSizes.sm, color: Colors.gray400 },
  profileBio: { fontSize: FontSizes.sm, color: Colors.gray600, marginTop: Spacing.sm, textAlign: 'center', paddingHorizontal: Spacing.xl },
  profileStats: { flexDirection: 'row', marginTop: Spacing.base, gap: Spacing.xl },
  profileStat: { alignItems: 'center' },
  profileStatNum: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900 },
  profileStatLabel: { fontSize: 11, color: Colors.gray400 },
  profileStatDivider: { width: 1, height: 30, backgroundColor: Colors.gray200 },

  // Comments Modal
  modalContainer: { flex: 1, backgroundColor: Colors.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900 },
  commentItem: { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray100, gap: Spacing.md },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.white },
  commentAuthor: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.gray900 },
  commentText: { fontSize: FontSizes.sm, color: Colors.gray700, marginTop: Spacing.xs, lineHeight: 18 },
  commentTime: { fontSize: 10, color: Colors.gray400, marginTop: Spacing.xs },
  commentActions: { flexDirection: 'row', gap: Spacing.md },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  commentInput: { flex: 1, backgroundColor: Colors.gray50, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.base, fontSize: FontSizes.sm, maxHeight: 100 },
  emptyComments: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl },
  emptyText: { fontSize: FontSizes.sm, color: Colors.gray400, marginTop: Spacing.md },

  // Story Upload Modal
  storyUploadContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  storyUploadClose: { position: 'absolute', top: Spacing.xl, right: Spacing.lg, zIndex: 10 },
  storyUploadContent: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, width: '88%', maxHeight: '86%' },
  storyUploadContentContainer: { padding: Spacing.xl, paddingBottom: Spacing.xl + Spacing.md },
  storyUploadTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.lg, textAlign: 'center' },
  uploadMediaBtn: { borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: BorderRadius.lg, paddingVertical: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  uploadMusicBtn: { borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: BorderRadius.lg, paddingVertical: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  uploadMediaText: { fontSize: FontSizes.sm, color: Colors.primary, marginTop: Spacing.md, fontWeight: FontWeights.semibold },
  storyPreviewContainer: { position: 'relative', width: '100%', height: 200, borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.lg },
  storyPreview: { width: '100%', height: '100%' },
  musicTag: { position: 'absolute', bottom: Spacing.md, left: Spacing.md, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.lg },
  musicTagText: { fontSize: 10, color: Colors.white, fontWeight: FontWeights.semibold },

  // Suggestions
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.xl, marginBottom: Spacing.base },
  sectionIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900 },
  sectionSubtitle: { fontSize: 11, color: Colors.gray400 },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  suggestionCard: { width: (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm) / 2, overflow: 'hidden' },
  suggestionBanner: { height: 50 },
  suggestionContent: { alignItems: 'center', paddingHorizontal: Spacing.sm, paddingBottom: Spacing.base, marginTop: -25 },
  suggestionAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.white },
  suggestionInitials: { fontSize: 16, fontWeight: FontWeights.bold, color: Colors.white },
  suggestionName: { fontSize: 13, fontWeight: FontWeights.semibold, color: Colors.gray900, marginTop: Spacing.xs },
  suggestionBio: { fontSize: 11, color: Colors.gray400, marginTop: 2 },
  suggestionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.xs },
  suggestionMutual: { fontSize: 10, color: Colors.gray400 },
  followBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    marginTop: Spacing.sm, width: '100%', paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
  },
  followBtnActive: { backgroundColor: Colors.gray100 },
  followBtnText: { fontSize: 12, fontWeight: FontWeights.semibold, color: Colors.white },
  followBtnTextActive: { color: Colors.gray500 },

  // Stats
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  statKpi: { width: (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm) / 2, padding: Spacing.base },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: 22, fontWeight: FontWeights.bold, color: Colors.gray900 },
  statLabel: { fontSize: 11, color: Colors.gray400, marginTop: 2 },
  statBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: Spacing.xs },

  chartCard: { marginHorizontal: Spacing.base, marginTop: Spacing.md, padding: Spacing.base },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  chartTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.gray900 },
  chartTotal: { fontSize: 12, fontWeight: FontWeights.semibold, color: Colors.primary },

  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100 },
  barCol: { flex: 1, alignItems: 'center' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 9, color: Colors.gray400, marginTop: 4, fontWeight: FontWeights.medium },

  storyStatRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  storyStatDot: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  storyStatGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
