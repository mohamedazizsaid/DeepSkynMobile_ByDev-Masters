import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Dimensions, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Badge, Button, EmptyState } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { postsService } from '../../services/posts.service';
import { useAuthStore } from '../../stores/auth.store';
import type { Post, Comment } from '../../lib/types';
import { getRelativeTime } from '../../lib/utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CommunityTab = 'feed' | 'profile' | 'suggestions' | 'stats';

// ─── Mock Data ─────────────────────────────────────────────────────
const STORIES = [
  { id: 's0', name: 'Votre story', initials: 'VS', gradient: Gradients.primary, isOwn: true },
  { id: 's1', name: 'Emma L.', initials: 'EL', gradient: ['#EC4899', '#F472B6'] as const, viewed: false },
  { id: 's2', name: 'Sophie M.', initials: 'SM', gradient: ['#06B6D4', '#22D3EE'] as const, viewed: false },
  { id: 's3', name: 'Marie C.', initials: 'MC', gradient: ['#8B5CF6', '#A78BFA'] as const, viewed: true },
  { id: 's4', name: 'Lena K.', initials: 'LK', gradient: ['#F97316', '#FB923C'] as const, viewed: false },
  { id: 's5', name: 'Nina B.', initials: 'NB', gradient: ['#10B981', '#34D399'] as const, viewed: true },
];

const POSTS = [
  {
    id: '1', author: 'Sarah K.', initials: 'SK',
    avatarGradient: ['#EC4899', '#F472B6'] as const,
    time: 'Il y a 2h',
    text: 'Ma routine du matin fait des miracles ! Après 3 mois avec DeepSkyn, ma peau est enfin nette et hydratée. 🌟',
    likes: 24, comments: 8, liked: true,
  },
  {
    id: '2', author: 'Michael R.', initials: 'MR',
    avatarGradient: ['#6366F1', '#8B5CF6'] as const,
    time: 'Il y a 5h',
    text: 'Quelqu\'un a essayé la suggestion de routine au rétinol ? Je cherche des avis avant de commencer.',
    likes: 12, comments: 15, liked: false,
  },
  {
    id: '3', author: 'Emma L.', initials: 'EL',
    avatarGradient: ['#10B981', '#34D399'] as const,
    time: 'Il y a 1j',
    text: 'Avant/après 3 mois avec DeepSkyn ! Le suivi d\'évolution est incroyable pour la motivation. 💪',
    likes: 56, comments: 22, liked: false,
  },
];

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

function StoryBar() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.storyBar} contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.md }}>
      {STORIES.map((story) => (
        <TouchableOpacity key={story.id} style={s.storyItem}>
          <View style={[s.storyRing, story.isOwn ? s.storyRingOwn : (story as any).viewed ? s.storyRingViewed : s.storyRingActive]}>
            <LinearGradient colors={[...story.gradient]} style={s.storyAvatar}>
              {story.isOwn ? (
                <Ionicons name="add" size={20} color={Colors.white} />
              ) : (
                <Text style={s.storyInitials}>{story.initials}</Text>
              )}
            </LinearGradient>
          </View>
          <Text style={s.storyName} numberOfLines={1}>{story.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function PostComposer({ text, setText, onPublish, publishing }: { 
  text: string; 
  setText: (t: string) => void; 
  onPublish: () => void;
  publishing: boolean;
}) {
  return (
    <Card variant="elevated" style={s.newPostCard}>
      <View style={s.newPostHeader}>
        <LinearGradient colors={Gradients.primary} style={s.composerAvatar}>
          <Ionicons name="person" size={18} color={Colors.white} />
        </LinearGradient>
        <TextInput
          style={s.newPostInput}
          placeholder="Quoi de neuf ?"
          placeholderTextColor={Colors.gray400}
          value={text}
          onChangeText={setText}
          multiline
        />
      </View>
      <View style={s.newPostActions}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <TouchableOpacity style={s.attachButton}>
            <Ionicons name="image-outline" size={20} color={Colors.gray400} />
          </TouchableOpacity>
          <TouchableOpacity style={s.attachButton}>
            <Ionicons name="happy-outline" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>
        <Button onPress={onPublish} size="sm" disabled={!text.trim() || publishing}>
          {publishing ? 'Publication...' : 'Publier'}
        </Button>
      </View>
    </Card>
  );
}

function PostItem({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const userName = post.user?.name || 'Utilisateur';
  const initials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const gradients: readonly [string, string] = ['#6366F1', '#8B5CF6'];
  const liked = post.isLiked || false;
  const likeCount = post._count?.likes || 0;
  const commentCount = post._count?.comments || 0;

  return (
    <Card style={s.postCard}>
      <View style={s.postHeader}>
        <LinearGradient colors={gradients} style={s.postAvatar}>
          <Text style={s.postAvatarText}>{initials}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={s.postAuthor}>{userName}</Text>
          <Text style={s.postTime}>{getRelativeTime(post.createdAt)}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </View>
      <Text style={s.postText}>{post.message}</Text>
      <View style={s.postActions}>
        <TouchableOpacity style={s.postAction} onPress={() => onLike(post.id)}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? Colors.error : Colors.gray400} />
          <Text style={[s.postActionText, liked && { color: Colors.error }]}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.postAction}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.gray400} />
          <Text style={s.postActionText}>{commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.postAction}>
          <Ionicons name="share-outline" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function SuggestionCard({ user, onFollow }: { user: typeof SUGGESTIONS[0]; onFollow: () => void }) {
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
          <Badge variant="info" size="sm">{`Peau ${user.skin}`}</Badge>
          <Text style={s.suggestionMutual}>{user.mutual} en commun</Text>
        </View>
        <TouchableOpacity
          style={[s.followBtn, following && s.followBtnActive]}
          onPress={() => setFollowing(!following)}
        >
          <Ionicons name={following ? 'checkmark' : 'person-add-outline'} size={14} color={following ? Colors.gray500 : Colors.white} />
          <Text style={[s.followBtnText, following && s.followBtnTextActive]}>
            {following ? 'Suivi' : "S'abonner"}
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

// ─── Main Component ───────────────────────────────────────────────

export function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postText, setPostText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const { user } = useAuthStore();

  const loadPosts = useCallback(async () => {
    try {
      const feedResponse = await postsService.getFeed(1, 20);
      setPosts(feedResponse.data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadPosts(), loadMyPosts()]);
    setLoading(false);
  }, [loadPosts, loadMyPosts]);

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
      const newPost = await postsService.create({ message: postText.trim() });
      setPosts((prev) => [newPost, ...prev]);
      setMyPosts((prev) => [newPost, ...prev]);
      setPostText('');
      Alert.alert('Succès', 'Votre publication a été créée !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de publier pour le moment');
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await postsService.toggleLike(postId);
      const updateLike = (postList: Post[]) => 
        postList.map((p) => {
          if (p.id === postId) {
            const wasLiked = p.isLiked;
            return {
              ...p,
              isLiked: !wasLiked,
              _count: { 
                ...p._count, 
                likes: (p._count?.likes || 0) + (wasLiked ? -1 : 1),
                comments: p._count?.comments || 0,
              },
            };
          }
          return p;
        });
      setPosts(updateLike);
      setMyPosts(updateLike);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const TABS: { key: CommunityTab; label: string; icon: string }[] = [
    { key: 'feed', label: 'Fil', icon: 'newspaper-outline' },
    { key: 'profile', label: 'Profil', icon: 'person-outline' },
    { key: 'suggestions', label: 'Suggestions', icon: 'people-outline' },
    { key: 'stats', label: 'Stats', icon: 'bar-chart-outline' },
  ];

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Communauté</Text>
        <Text style={s.subtitle}>Partagez votre parcours skincare</Text>
      </View>

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tabItem, activeTab === tab.key && s.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={activeTab === tab.key ? (tab.icon.replace('-outline', '') as any) : (tab.icon as any)}
              size={18}
              color={activeTab === tab.key ? Colors.white : Colors.gray400}
            />
            <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ═══ FEED TAB ═══ */}
      {activeTab === 'feed' && (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          <StoryBar />
          <PostComposer text={postText} setText={setPostText} onPublish={handlePublish} publishing={publishing} />
          {loading ? (
            <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : posts.length === 0 ? (
            <EmptyState
              icon="chatbubbles-outline"
              title="Aucune publication"
              message="Soyez le premier à partager votre parcours skincare !"
            />
          ) : (
            posts.map((post) => <PostItem key={post.id} post={post} onLike={handleLike} />)
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
            <LinearGradient colors={Gradients.secondary} style={s.profileCover} />
            <View style={s.profileBody}>
              <View style={s.profileAvatarWrap}>
                <LinearGradient colors={Gradients.primary} style={s.profileAvatar}>
                  <Ionicons name="person" size={32} color={Colors.white} />
                </LinearGradient>
              </View>
              <Text style={s.profileName}>{user?.name || 'Mon Profil'}</Text>
              <Text style={s.profileHandle}>@{user?.name?.toLowerCase().replace(/\s+/g, '') || 'utilisateur'}</Text>
              <Text style={s.profileBio}>Bienvenue dans la communauté DeepSkyn ! 💙</Text>
              <View style={s.profileStats}>
                <View style={s.profileStat}>
                  <Text style={s.profileStatNum}>{myPosts.length}</Text>
                  <Text style={s.profileStatLabel}>Posts</Text>
                </View>
                <View style={s.profileStatDivider} />
                <View style={s.profileStat}>
                  <Text style={s.profileStatNum}>--</Text>
                  <Text style={s.profileStatLabel}>Abonnés</Text>
                </View>
                <View style={s.profileStatDivider} />
                <View style={s.profileStat}>
                  <Text style={s.profileStatNum}>--</Text>
                  <Text style={s.profileStatLabel}>Abonnements</Text>
                </View>
              </View>
            </View>
          </Card>
          <PostComposer text={postText} setText={setPostText} onPublish={handlePublish} publishing={publishing} />
          {myPosts.map((post) => <PostItem key={post.id} post={post} onLike={handleLike} />)}
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
              <Text style={s.sectionTitle}>Suggestions pour vous</Text>
              <Text style={s.sectionSubtitle}>Passionnés skincare à découvrir</Text>
            </View>
          </View>
          <View style={s.suggestionsGrid}>
            {SUGGESTIONS.map((user) => (
              <SuggestionCard key={user.id} user={user} onFollow={() => {}} />
            ))}
          </View>
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
              <Text style={s.sectionTitle}>Statistiques</Text>
              <Text style={s.sectionSubtitle}>Vos performances cette semaine</Text>
            </View>
          </View>

          {/* KPI Grid */}
          <View style={s.kpiGrid}>
            <StatKPI icon="eye-outline" label="Vues stories" value="819" change="+18%" color={Colors.primary} isUp={true} />
            <StatKPI icon="heart-outline" label="Likes" value="1.4K" change="+24%" color={Colors.error} isUp={true} />
            <StatKPI icon="chatbubble-outline" label="Commentaires" value="328" change="+12%" color="#8B5CF6" isUp={true} />
            <StatKPI icon="share-outline" label="Partages" value="89" change="-3%" color="#F97316" isUp={false} />
          </View>

          {/* Weekly Activity */}
          <Card style={s.chartCard}>
            <View style={s.chartHeader}>
              <Text style={s.chartTitle}>Activité hebdomadaire</Text>
              <Text style={s.chartTotal}>{WEEKLY_DATA.reduce((a, b) => a + b, 0)} total</Text>
            </View>
            <View style={s.barChart}>
              {WEEKLY_DATA.map((val, i) => {
                const max = Math.max(...WEEKLY_DATA);
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
            <Text style={s.chartTitle}>Taux d'engagement</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: Spacing.sm }}>
              <Text style={{ fontSize: 32, fontWeight: '700' as any, color: Colors.gray900 }}>8.4%</Text>
              <View style={[s.statBadge, { backgroundColor: '#DCFCE7', marginBottom: 6 }]}>
                <Text style={{ fontSize: 10, fontWeight: '600' as any, color: '#16A34A' }}>↑ +2.1%</Text>
              </View>
            </View>
            {[
              { label: 'Portée organique', pct: 72, color: Colors.primary },
              { label: 'Taux de clic', pct: 45, color: '#8B5CF6' },
              { label: 'Rétention stories', pct: 61, color: '#EC4899' },
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
              <Text style={s.chartTitle}>Vues par story</Text>
              <Badge variant="info" size="sm">819 vues</Badge>
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
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900 },
  subtitle: { fontSize: FontSizes.sm, color: Colors.gray500, marginTop: Spacing.xs },

  // Tab Bar
  tabBar: {
    flexDirection: 'row', marginHorizontal: Spacing.base, marginTop: Spacing.base,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 4,
    ...Shadows.sm,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
  },
  tabItemActive: { backgroundColor: Colors.primary },
  tabLabel: { fontSize: 11, fontWeight: FontWeights.semibold, color: Colors.gray400 },
  tabLabelActive: { color: Colors.white },

  // Stories
  storyBar: { marginTop: Spacing.base },
  storyItem: { alignItems: 'center', width: 68 },
  storyRing: { width: 60, height: 60, borderRadius: 30, padding: 2.5, marginBottom: 4 },
  storyRingOwn: { borderWidth: 2, borderColor: Colors.gray200, borderStyle: 'dashed' },
  storyRingActive: { backgroundColor: 'transparent', borderWidth: 2.5, borderColor: Colors.primary },
  storyRingViewed: { borderWidth: 2, borderColor: Colors.gray300 },
  storyAvatar: { flex: 1, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  storyInitials: { fontSize: 14, fontWeight: FontWeights.bold, color: Colors.white },
  storyName: { fontSize: 10, color: Colors.gray500, fontWeight: FontWeights.medium, textAlign: 'center', width: 60 },

  // Post Composer
  newPostCard: { marginHorizontal: Spacing.base, marginTop: Spacing.md, padding: Spacing.base },
  newPostHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  composerAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  newPostInput: { flex: 1, fontSize: FontSizes.base, color: Colors.gray700, minHeight: 50, textAlignVertical: 'top' },
  newPostActions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  attachButton: { padding: Spacing.xs },

  // Post Card
  postCard: { marginHorizontal: Spacing.base, marginTop: Spacing.md, padding: Spacing.base },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  postAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.white },
  postAuthor: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.gray900 },
  postTime: { fontSize: FontSizes.xs, color: Colors.gray400 },
  postText: { fontSize: FontSizes.base, color: Colors.gray700, lineHeight: 22, marginBottom: Spacing.md },
  postActions: { flexDirection: 'row', gap: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  postActionText: { fontSize: FontSizes.sm, color: Colors.gray400 },

  // Profile
  profileCard: { marginHorizontal: Spacing.base, marginTop: Spacing.md, overflow: 'hidden' },
  profileCover: { height: 100 },
  profileBody: { alignItems: 'center', paddingBottom: Spacing.xl },
  profileAvatarWrap: { marginTop: -35, borderRadius: 40, borderWidth: 4, borderColor: Colors.white, overflow: 'hidden' },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900, marginTop: Spacing.sm },
  profileHandle: { fontSize: FontSizes.sm, color: Colors.gray400 },
  profileBio: { fontSize: FontSizes.sm, color: Colors.gray600, marginTop: Spacing.sm, textAlign: 'center', paddingHorizontal: Spacing.xl },
  profileStats: { flexDirection: 'row', marginTop: Spacing.base, gap: Spacing.xl },
  profileStat: { alignItems: 'center' },
  profileStatNum: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900 },
  profileStatLabel: { fontSize: 11, color: Colors.gray400 },
  profileStatDivider: { width: 1, height: 30, backgroundColor: Colors.gray200 },

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
