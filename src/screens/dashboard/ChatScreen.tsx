import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, LoadingSpinner } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { chatService } from '../../services/chat.service';
import type { ChatHistory, ChatMessage } from '../../lib/types';
import { useTranslation } from '../../lib/i18n';

interface DisplayMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

export function ChatScreen() {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.backgroundSecondary },
    loadingContainer: { flex: 1, backgroundColor: colors.backgroundSecondary, justifyContent: 'center' as const, alignItems: 'center' as const },
    headerTitle: { fontSize: fontSizes.base, fontWeight: FontWeights.bold, color: colors.text },
    headerSubtitle: { fontSize: fontSizes.xs, color: colors.success },
    messageBubble: {
      padding: Spacing.md, borderRadius: BorderRadius.lg, maxWidth: '90%',
    },
    userBubble: {
      backgroundColor: colors.primary, borderBottomRightRadius: 4,
    },
    aiBubble: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderBottomLeftRadius: 4,
    },
    messageText: { fontSize: fontSizes.base, color: colors.text, lineHeight: 22 },
    userMessageText: { color: Colors.white },
    suggestionText: { fontSize: fontSizes.sm, color: colors.primary, fontWeight: FontWeights.medium },
    input: {
      flex: 1, backgroundColor: colors.surface,
      borderRadius: BorderRadius.base, paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md, fontSize: fontSizes.base, color: colors.text,
      maxHeight: 100, borderWidth: 1, borderColor: colors.border,
    },
    sendButton: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.primary, alignItems: 'center' as const, justifyContent: 'center' as const,
    },
    inputBar: {
      flexDirection: 'row' as const, alignItems: 'flex-end' as const, gap: Spacing.sm,
      paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
      backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    },
  }), [colors, fontSizes]);

  const suggestions = t.chatPage.quickSuggestions;

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const history = await chatService.getHistory(1, 0);
      if (history.length > 0) {
        const latestChat = history[0];
        setCurrentChatId(latestChat.id);
        
        const displayMessages: DisplayMessage[] = [];
        if (latestChat.messages) {
          latestChat.messages.forEach((msg: ChatMessage, index: number) => {
            displayMessages.push({
              id: `${latestChat.id}-${index}`,
              type: msg.role === 'user' ? 'user' : 'ai',
              text: msg.content,
              timestamp: msg.timestamp,
            });
          });
        } else {
          if (latestChat.message) {
            displayMessages.push({
              id: `${latestChat.id}-user`,
              type: 'user',
              text: latestChat.message,
            });
          }
          if (latestChat.assistantResponse) {
            displayMessages.push({
              id: `${latestChat.id}-ai`,
              type: 'ai',
              text: latestChat.assistantResponse,
            });
          }
        }
        setMessages(displayMessages);
      } else {
        setMessages([{
          id: 'welcome',
          type: 'ai',
          text: t.chatPage.welcomeMessage,
        }]);
      }
    } catch (error) {
      console.error('Load history error:', error);
      setMessages([{
        id: 'welcome',
        type: 'ai',
        text: 'Bonjour ! Je suis votre coach skincare IA. Comment puis-je vous aider aujourd\'hui ?',
      }]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;

    const userMessage = message.trim();
    setMessage('');
    setSending(true);

    const userDisplayMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userDisplayMessage]);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await chatService.sendMessage({
        message: userMessage,
        chatId: currentChatId || undefined,
      });

      setCurrentChatId(response.id);

      const aiResponse = response.assistantResponse || t.chatPage.toasts.genericError;
      const aiDisplayMessage: DisplayMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        text: aiResponse,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiDisplayMessage]);
    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage: DisplayMessage = {
        id: `error-${Date.now()}`,
        type: 'ai',
        text: t.chatPage.toasts.genericError,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setMessage(suggestion);
  };

  const startNewChat = () => {
    Alert.alert(
      t.chatPage.history.title,
      t.chatPage.history.empty,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.next,
          onPress: () => {
            setCurrentChatId(null);
            setMessages([{
              id: 'welcome',
              type: 'ai',
              text: t.chatPage.welcomeMessage,
            }]);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.loadingContainer}>
        <LoadingSpinner message={t.common.loading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={dynamicStyles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <LinearGradient colors={Gradients.primary} style={styles.headerIcon}>
            <Ionicons name="sparkles" size={20} color={Colors.white} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={dynamicStyles.headerTitle}>{t.chatPage.header.title}</Text>
            <Text style={dynamicStyles.headerSubtitle}>
              {sending ? t.chatPage.message.aiTyping : t.chatPage.header.online}
            </Text>
          </View>
          <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesList} 
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.messageBubbleWrapper, msg.type === 'user' ? styles.userBubbleWrapper : undefined]}
            >
              {msg.type === 'ai' && (
                <LinearGradient colors={Gradients.primary} style={styles.aiBubbleAvatar}>
                  <Ionicons name="sparkles" size={14} color={Colors.white} />
                </LinearGradient>
              )}
              <View style={[dynamicStyles.messageBubble, msg.type === 'user' ? dynamicStyles.userBubble : dynamicStyles.aiBubble]}>
                <Text style={[dynamicStyles.messageText, msg.type === 'user' ? dynamicStyles.userMessageText : undefined]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}

          {sending && (
            <View style={styles.messageBubbleWrapper}>
              <LinearGradient colors={Gradients.primary} style={styles.aiBubbleAvatar}>
                <Ionicons name="sparkles" size={14} color={Colors.white} />
              </LinearGradient>
              <View style={[dynamicStyles.messageBubble, dynamicStyles.aiBubble]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            </View>
          )}

          {/* Quick Suggestions */}
          {messages.length <= 2 && (
            <View style={styles.suggestionsRow}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.suggestionPill, { borderColor: colors.primary, backgroundColor: colors.surface }]}
                  onPress={() => handleSuggestion(suggestion)}
                >
                  <Text style={dynamicStyles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={dynamicStyles.inputBar}>
          <TextInput
            style={dynamicStyles.input}
            placeholder={t.chatPage.inputPlaceholder}
            placeholderTextColor={colors.textTertiary}
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!sending}
          />
          <TouchableOpacity
            style={[dynamicStyles.sendButton, (!message.trim() || sending) ? styles.sendButtonDisabled : undefined]}
            disabled={!message.trim() || sending}
            onPress={sendMessage}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="send" size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.base,
    alignItems: 'center', justifyContent: 'center',
  },
  newChatButton: { padding: Spacing.xs },
  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base },
  messageBubbleWrapper: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    marginBottom: Spacing.md, maxWidth: '85%',
  },
  userBubbleWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiBubbleAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  suggestionPill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  sendButtonDisabled: { opacity: 0.5 },
});
