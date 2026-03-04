import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';

export function ChatScreen() {
  const [message, setMessage] = useState('');

  const messages = [
    { id: '1', type: 'ai', text: 'Hello! I\'m your AI skincare coach. How can I help you today?' },
    { id: '2', type: 'user', text: 'My skin feels dry lately, what should I do?' },
    { id: '3', type: 'ai', text: 'I see from your profile that you have combination skin. For dryness, I recommend:\n\n1. Use a gentle hydrating cleanser\n2. Apply hyaluronic acid serum\n3. Use a rich moisturizer\n4. Drink more water throughout the day' },
    { id: '4', type: 'user', text: 'Thanks! Any product recommendations?' },
    { id: '5', type: 'ai', text: 'Based on your skin profile, I\'d suggest trying CeraVe Hydrating Cleanser and The Ordinary Hyaluronic Acid 2% + B5. Both are gentle and effective for your skin type.' },
  ];

  const suggestions = [
    'Routine advice',
    'Product help',
    'Skin concern',
    'Diet tips',
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={Gradients.primary} style={styles.headerIcon}>
            <Ionicons name="sparkles" size={20} color={Colors.white} />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>AI Skin Coach</Text>
            <Text style={styles.headerSubtitle}>Online • Powered by AI</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView style={styles.messagesList} contentContainerStyle={styles.messagesContent}>
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

          {/* Quick Suggestions */}
          <View style={styles.suggestionsRow}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity key={index} style={styles.suggestionPill}>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything about skincare..."
            placeholderTextColor={Colors.gray400}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() ? styles.sendButtonDisabled : undefined]}
            disabled={!message.trim()}
          >
            <Ionicons name="send" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
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
