import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, LoadingSpinner } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { chatService } from '../../services/chat.service';
import type { ChatHistory, ChatMessage } from '../../lib/types';

interface DisplayMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

export function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const suggestions = [
    'Conseils routine',
    'Aide produits',
    'Problème de peau',
    'Conseils nutrition',
  ];

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
          text: 'Bonjour ! Je suis votre coach skincare IA. Comment puis-je vous aider aujourd\'hui ?',
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

      const aiResponse = response.assistantResponse || 'Je n\'ai pas pu traiter votre demande.';
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
        text: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
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
      'Nouvelle conversation',
      'Voulez-vous commencer une nouvelle conversation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui',
          onPress: () => {
            setCurrentChatId(null);
            setMessages([{
              id: 'welcome',
              type: 'ai',
              text: 'Bonjour ! Comment puis-je vous aider avec votre peau aujourd\'hui ?',
            }]);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner message="Chargement de la conversation..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={Gradients.primary} style={styles.headerIcon}>
            <Ionicons name="sparkles" size={20} color={Colors.white} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Coach Skincare IA</Text>
            <Text style={styles.headerSubtitle}>
              {sending ? 'Réflexion...' : 'En ligne • Propulsé par l\'IA'}
            </Text>
          </View>
          <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
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
              <View style={[styles.messageBubble, msg.type === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.messageText, msg.type === 'user' ? styles.userMessageText : undefined]}>
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
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            </View>
          )}

          {/* Quick Suggestions */}
          {messages.length <= 2 && (
            <View style={styles.suggestionsRow}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.suggestionPill}
                  onPress={() => handleSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Posez-moi une question sur votre peau..."
            placeholderTextColor={Colors.gray400}
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!message.trim() || sending) ? styles.sendButtonDisabled : undefined]}
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
  safeArea: { flex: 1, backgroundColor: Colors.white },
  container: { flex: 1, backgroundColor: Colors.gray50 },
  loadingContainer: { flex: 1, backgroundColor: Colors.gray50, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray200,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.base,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.gray900 },
  headerSubtitle: { fontSize: FontSizes.xs, color: Colors.success },
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
  messageBubble: {
    padding: Spacing.md, borderRadius: BorderRadius.lg, maxWidth: '90%',
  },
  userBubble: {
    backgroundColor: Colors.primary, borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray200,
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: FontSizes.base, color: Colors.gray700, lineHeight: 22 },
  userMessageText: { color: Colors.white },
  suggestionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  suggestionPill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.primary,
    backgroundColor: Colors.primaryAlpha5,
  },
  suggestionText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.medium },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray200,
  },
  input: {
    flex: 1, backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.base, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, fontSize: FontSizes.base, color: Colors.gray900,
    maxHeight: 100, borderWidth: 1, borderColor: Colors.gray200,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
});
