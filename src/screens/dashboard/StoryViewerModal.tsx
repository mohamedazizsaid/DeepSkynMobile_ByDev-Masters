import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal, View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, FlatList, Image, ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows, Gradients } from '../../theme';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { postsService } from '../../services/posts.service';
import { useAuthStore } from '../../stores/auth.store';

const { width: SCREEN_WIDTH,  height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryItem {
  id: string;
  mediaUrl: string;
  createdAt?: string;
  musicUrl?: string;
  musicTitle?: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
}

interface StoryUser {
  id: string;
  name: string;
  avatar?: string;
  items: StoryItem[];
}

interface StoryCommentData {
  id: string;
  message: string;
  createdAt: string;
  userId: string;
  user?: { id: string; name: string; avatar?: string | null };
  isLiked?: boolean;
  _count?: { likes: number };
}

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryUser[];
  initialUserIndex?: number;
  onUserFinished?: (userId: string) => void;
}

export function StoryViewerModal({
  isOpen,
  onClose,
  stories,
  initialUserIndex = 0,
  onUserFinished,
}: StoryViewerModalProps) {
  const { t } = useTranslation();
  const { user: authUser } = useAuthStore();
  
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Likes & Comments
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<StoryCommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [musicPlayable, setMusicPlayable] = useState(true);

  const audioRef = useRef<any>(null);
  const failedMusicUrlsRef = useRef<Set<string>>(new Set());

  const currentStoryUser = stories[currentUserIndex];
  const currentItem = currentStoryUser?.items[currentItemIndex];

  // Initialize story data
  useEffect(() => {
    if (!currentItem || !isOpen) return;
    setIsLiked(currentItem.isLiked || false);
    setLikesCount(currentItem.likesCount || 0);
    setComments([]);
    setShowComments(false);
    setNewComment('');
    setProgress(0);
    setMusicPlayable(true);
  }, [currentItem?.id, isOpen]);

  const handleNext = useCallback(() => {
    if (!currentStoryUser) return;

    if (currentItemIndex < currentStoryUser.items.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      if (onUserFinished) onUserFinished(currentStoryUser.id);
      if (currentUserIndex < stories.length - 1) {
        setCurrentUserIndex((prev) => prev + 1);
        setCurrentItemIndex(0);
        setProgress(0);
      } else {
        onClose();
      }
    }
  }, [currentStoryUser, currentItemIndex, currentUserIndex, stories.length, onUserFinished, onClose]);

  const handlePrev = useCallback(() => {
    if (!currentStoryUser) return;

    if (currentItemIndex > 0) {
      setCurrentItemIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      if (currentUserIndex > 0) {
        setCurrentUserIndex((prev) => prev - 1);
        setCurrentItemIndex(stories[currentUserIndex - 1].items.length - 1);
        setProgress(0);
      }
    }
  }, [currentStoryUser, currentItemIndex, currentUserIndex, stories]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentUserIndex(initialUserIndex);
      setCurrentItemIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialUserIndex]);

  useEffect(() => {
    let isCancelled = false;

    const playMusic = async () => {
      if (!isOpen || !currentItem?.musicUrl) {
        if (audioRef.current) {
          try {
            await audioRef.current.unloadAsync();
          } catch {}
          audioRef.current = null;
        }
        return;
      }

      try {
        const candidate = String(currentItem.musicUrl || '').trim();
        const looksPlayable = /^https?:\/\//i.test(candidate) || /^file:\/\//i.test(candidate) || /^data:audio\//i.test(candidate);
        if (!looksPlayable || failedMusicUrlsRef.current.has(candidate)) {
          setMusicPlayable(false);
          return;
        }

        if (audioRef.current) {
          await audioRef.current.unloadAsync();
          audioRef.current = null;
        }

        await Audio.setAudioModeAsync({
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playsInSilentModeIOS: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: candidate },
          { shouldPlay: false, isLooping: true, volume: 1 }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded && status.error) {
            failedMusicUrlsRef.current.add(candidate);
            setMusicPlayable(false);
            sound.unloadAsync().catch(() => {});
            if (audioRef.current === sound) {
              audioRef.current = null;
            }
          }
        });

        if (isCancelled) {
          await sound.unloadAsync();
          return;
        }

        await sound.playAsync();
        setMusicPlayable(true);
        audioRef.current = sound;
      } catch (error) {
        // Keep viewer stable even if track URL is invalid/unreachable.
        const candidate = String(currentItem.musicUrl || '').trim();
        if (candidate) {
          failedMusicUrlsRef.current.add(candidate);
        }
        setMusicPlayable(false);
      }
    };

    playMusic();

    return () => {
      isCancelled = true;
      const cleanup = async () => {
        if (audioRef.current) {
          try {
            await audioRef.current.unloadAsync();
          } catch {}
          audioRef.current = null;
        }
      };
      cleanup();
    };
  }, [isOpen, currentItem?.id, currentItem?.musicUrl]);

  // Progress timer
  useEffect(() => {
    if (!isOpen || !currentItem || isPaused || showComments) return;

    const DURATION = 5000;
    const INTERVAL = 50;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (INTERVAL / DURATION) * 100;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [isOpen, currentItem, currentItemIndex, currentUserIndex, isPaused, showComments, handleNext]);

  const handleLikeStory = async () => {
    if (!currentItem) return;
    setLikeAnimating(true);
    try {
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount((prev) => prev + (newIsLiked ? 1 : -1));
      const res = await postsService.toggleStoryLike(currentItem.id);
      setIsLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch (error) {
      console.error('Error toggling like:', error);
      setIsLiked(!isLiked);
    } finally {
      setLikeAnimating(false);
    }
  };

  const handleLoadComments = async () => {
    if (!currentItem) return;
    setLoadingComments(true);
    try {
      const result = await postsService.getStoryComments(currentItem.id);
      setComments(result.map((c: any) => ({
        ...c,
        message: c.comment || c.message,
      })));
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentItem) return;
    setSendingComment(true);
    try {
      const result: any = await postsService.addStoryComment(currentItem.id, newComment);
      setComments((prev) => [...prev, {
        ...result,
        message: result.comment || result.message,
      }]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSendingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
              ...c,
              isLiked: !c.isLiked,
              _count: { likes: (c._count?.likes || 0) + (c.isLiked ? -1 : 1) }
            }
            : c
        )
      );
      // Backend endpoint for story comment like is not exposed in controller.
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert('Confirmer', 'Supprimer ce commentaire ?', [
      { text: t.common.cancel || 'Annuler', onPress: () => {} },
      {
        text: t.common.delete || 'Supprimer',
        onPress: async () => {
          try {
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            await postsService.deleteStoryComment(commentId);
          } catch (error) {
            console.error('Error deleting comment:', error);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (!isOpen || !currentStoryUser || !currentItem) return null;

  return (
    <Modal visible={isOpen} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
      <SafeAreaView style={s.container}>
        {/* Header with progress bars */}
        <View style={s.header}>
          <View style={s.progressBarsContainer}>
            {currentStoryUser.items.map((_: StoryItem, idx: number) => (
              <View key={idx} style={s.progressBarBg}>
                <View
                  style={[
                    s.progressBar,
                    {
                      width:
                        idx < currentItemIndex
                          ? '100%'
                          : idx === currentItemIndex
                            ? `${progress}%`
                            : '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={s.storyHeaderInfo}>
            <Image source={{ uri: currentStoryUser.avatar }} style={s.storyAvatar} defaultSource={{ uri: 'https://via.placeholder.com/40' }} />
            <View style={{ flex: 1 }}>
              <Text style={s.storyAuthor}>{currentStoryUser.name}</Text>
              <Text style={s.storyTime}>Il y a {Math.floor(Math.random() * 24)}h</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Story Content */}
        <View
          style={s.storyContent}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <Image source={{ uri: currentItem.mediaUrl }} style={s.storyImage} />

          {/* Music indicator */}
          {(currentItem.musicUrl || currentItem.musicTitle) && musicPlayable && (
            <View style={s.musicIndicator}>
              <Ionicons name="musical-note" size={14} color={Colors.white} />
              <Text style={s.musicText}>{currentItem.musicTitle || 'Musique'}</Text>
            </View>
          )}

          {/* Like animation */}
          {likeAnimating && (
            <View style={s.likeAnimation}>
              <Ionicons name="heart" size={64} color={Colors.white} />
            </View>
          )}
        </View>

        {/* Navigation */}
        <View style={s.navigationContainer} pointerEvents="box-none">
          <TouchableOpacity style={s.navButton} onPress={handlePrev}>
            <Ionicons name="chevron-back" size={32} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={s.navButton} onPress={handleNext}>
            <Ionicons name="chevron-forward" size={32} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View style={s.bottomActions}>
          <TouchableOpacity style={s.actionButton} onPress={handleLikeStory}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={26} color={isLiked ? Colors.error : Colors.white} />
            <Text style={s.actionText}>{likesCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionButton} onPress={() => { setShowComments(!showComments); if (!showComments) handleLoadComments(); }}>
            <Ionicons name="chatbubble-outline" size={26} color={Colors.white} />
            <Text style={s.actionText}>{comments.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionButton}>
            <Ionicons name="share-outline" size={26} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Comments Panel */}
        {showComments && (
          <View style={s.commentsPanel}>
            {loadingComments ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <FlatList
                  data={comments}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <View style={s.commentItem}>
                      <View style={s.commentHeader}>
                        <Text style={s.commentAuthor}>{item.user?.name || 'Utilisateur'}</Text>
                        <Text style={s.commentTime}>{Math.floor(Math.random() * 60)}m</Text>
                      </View>
                      <Text style={s.commentText}>{item.message}</Text>
                      <View style={s.commentActions}>
                        <TouchableOpacity onPress={() => handleLikeComment(item.id)}>
                          <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={14} color={item.isLiked ? Colors.error : Colors.gray400} />
                        </TouchableOpacity>
                        {item.userId === authUser?.id && (
                          <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                            <Ionicons name="trash-outline" size={14} color={Colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                  scrollEnabled={false}
                  ListEmptyComponent={
                    <Text style={s.emptyComments}>{t.community.noComments || 'Aucun commentaire'}</Text>
                  }
                />

                {/* Comment Input */}
                <View style={s.commentInputContainer}>
                  <TextInput
                    style={s.commentInput}
                    placeholder={t.community.addComment || 'Ajouter un commentaire'}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholderTextColor={Colors.gray400}
                  />
                  <TouchableOpacity
                    onPress={handleAddComment}
                    disabled={!newComment.trim() || sendingComment}
                  >
                    <Ionicons
                      name="send"
                      size={20}
                      color={newComment.trim() ? Colors.primary : Colors.gray300}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  progressBarsContainer: { flexDirection: 'row', gap: 3, marginBottom: Spacing.md },
  progressBarBg: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 },
  progressBar: { height: 2, backgroundColor: Colors.white, borderRadius: 1 },
  storyHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  storyAvatar: { width: 40, height: 40, borderRadius: 20 },
  storyAuthor: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.white },
  storyTime: { fontSize: 11, color: Colors.gray300, marginTop: 2 },

  storyContent: { flex: 1, position: 'relative', justifyContent: 'center', alignItems: 'center', paddingTop: 90, paddingBottom: 80 },
  storyImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  musicIndicator: { position: 'absolute', bottom: Spacing.xl, left: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.lg },
  musicText: { fontSize: 12, color: Colors.white, fontWeight: FontWeights.semibold },

  likeAnimation: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },

  navigationContainer: { position: 'absolute', width: '100%', height: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 },
  navButton: { width: 54, height: '60%', justifyContent: 'center', alignItems: 'center' },

  bottomActions: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg, zIndex: 20 },
  actionButton: { alignItems: 'center', gap: Spacing.xs },
  actionText: { fontSize: 12, color: Colors.white, fontWeight: FontWeights.semibold },

  commentsPanel: { backgroundColor: 'rgba(255,255,255,0.95)', maxHeight: '40%', borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.md },
  commentItem: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  commentAuthor: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.gray900 },
  commentTime: { fontSize: 10, color: Colors.gray400 },
  commentText: { fontSize: FontSizes.sm, color: Colors.gray700, lineHeight: 18 },
  commentActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  emptyComments: { textAlign: 'center', color: Colors.gray400, paddingVertical: Spacing.lg },

  commentInputContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  commentInput: { flex: 1, backgroundColor: Colors.gray50, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSizes.sm, maxHeight: 80 },
});
