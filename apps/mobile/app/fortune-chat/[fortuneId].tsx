/**
 * Fortune Chat screen — AI follow-up Q&A for today's saju reading.
 *
 * Route: /fortune-chat/[fortuneId]
 * Params: fortuneId (YYYY-MM-DD), summary, details (JSON-encoded string array)
 *
 * Premium: full chat
 * Free: locked overlay + paywall CTA
 */
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFortunChat, loadChatHistory, type ChatMessage } from '../../src/hooks/useFortunChat';
import { useEntitlementStore } from '../../src/store/entitlementStore';

// ── Suggested question chips ──────────────────────────────────────────────────

const CHIP_QUESTIONS = [
  'Should I make an important decision today?',
  'How can I make the most of my lucky elements?',
  'What should I focus on this week?',
];

function SuggestedChips({ onSelect, visible }: { onSelect: (q: string) => void; visible: boolean }) {
  if (!visible) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={chips.container}
      contentContainerStyle={chips.content}
    >
      {CHIP_QUESTIONS.map((q) => (
        <TouchableOpacity key={q} style={chips.chip} onPress={() => onSelect(q)}>
          <Text style={chips.chipText}>{q}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const chips = StyleSheet.create({
  container: { maxHeight: 52, marginBottom: 8 },
  content:   { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    backgroundColor: '#3d2471', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#7c3aed33',
  },
  chipText: { color: '#d8b4fe', fontSize: 13 },
});

// ── Chat bubble ───────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[bubble.row, isUser ? bubble.rowUser : bubble.rowAssistant]}>
      {!isUser && (
        <View style={bubble.avatar}>
          <Text style={bubble.avatarText}>✦</Text>
        </View>
      )}
      <View style={[bubble.bubble, isUser ? bubble.userBubble : bubble.aiBubble]}>
        {msg.content === '' ? (
          <ActivityIndicator size="small" color="#a78bfa" />
        ) : (
          <Text style={[bubble.text, isUser ? bubble.userText : bubble.aiText]}>
            {msg.content}
          </Text>
        )}
      </View>
    </View>
  );
}

const bubble = StyleSheet.create({
  row:           { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' },
  rowUser:       { justifyContent: 'flex-end' },
  rowAssistant:  { justifyContent: 'flex-start' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  avatarText:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  bubble:        { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble:    { backgroundColor: '#7c3aed', borderBottomRightRadius: 4 },
  aiBubble:      { backgroundColor: '#2d1854', borderBottomLeftRadius: 4 },
  text:          { fontSize: 14, lineHeight: 21 },
  userText:      { color: '#fff' },
  aiText:        { color: '#e9d5ff' },
});

// ── Fortune summary header ────────────────────────────────────────────────────

function FortuneSummaryCard({ summary }: { summary: string }) {
  return (
    <View style={summaryCard.card}>
      <Text style={summaryCard.label}>Today's Fortune</Text>
      <Text style={summaryCard.text} numberOfLines={3}>{summary}</Text>
    </View>
  );
}

const summaryCard = StyleSheet.create({
  card: {
    backgroundColor: '#2d1854', borderRadius: 16,
    padding: 16, marginHorizontal: 16, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: '#7c3aed',
  },
  label: { color: '#a78bfa', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  text:  { color: '#e9d5ff', fontSize: 14, lineHeight: 20 },
});

// ── Premium locked overlay ────────────────────────────────────────────────────

function LockedOverlay() {
  return (
    <View style={lock.overlay}>
      <View style={lock.card}>
        <Text style={lock.icon}>💬</Text>
        <Text style={lock.title}>Ask Your Fortune AI</Text>
        <Text style={lock.desc}>
          Upgrade to Premium to have unlimited follow-up conversations with your cosmic advisor.
        </Text>
        <TouchableOpacity style={lock.btn} onPress={() => router.push('/paywall')}>
          <Text style={lock.btnText}>Upgrade to Premium →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={lock.cancel}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const lock = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,4,24,0.92)',
    alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 24,
  },
  card: {
    backgroundColor: '#1a0a2e', borderRadius: 24,
    padding: 28, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#7c3aed44',
  },
  icon:   { fontSize: 40, marginBottom: 14 },
  title:  { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  desc:   { color: '#b8a9d9', fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  btn: {
    backgroundColor: '#7c3aed', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 28, width: '100%', alignItems: 'center', marginBottom: 12,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancel:  { color: '#9d8fbe', fontSize: 14 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function FortuneChatScreen() {
  const params = useLocalSearchParams<{
    fortuneId: string;
    summary:   string;
    details:   string; // JSON-encoded string[]
  }>();

  const fortuneId = params.fortuneId ?? '';
  const summary   = params.summary   ?? '';

  const todayReading = {
    summary,
    details: (() => {
      try { return JSON.parse(params.details ?? '[]') as string[]; }
      catch { return [] as string[]; }
    })(),
  };

  const { isPremium } = useEntitlementStore();
  const { messages, streaming, error, rateLimited, premiumRequired, sendMessage } =
    useFortunChat(fortuneId, todayReading);

  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Load history on mount
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!historyLoaded && fortuneId) {
      loadChatHistory(fortuneId)
        .then((history) => { setLocalMessages(history); setHistoryLoaded(true); })
        .catch(() => setHistoryLoaded(true));
    }
  }, [fortuneId, historyLoaded]);

  // Merge persisted history with live messages (avoid duplicates)
  const allMessages: ChatMessage[] = historyLoaded && messages.length === 0
    ? localMessages
    : messages;

  // Auto-scroll on new messages
  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [allMessages.length]);

  function handleSend() {
    const text = inputText.trim();
    if (!text || streaming) return;
    setInputText('');
    sendMessage(text);
  }

  function handleChipSelect(q: string) {
    setInputText(q);
  }

  const showChips = allMessages.length === 0 && !streaming;
  const showLocked = !isPremium || premiumRequired;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Fortune Chat',
          headerStyle: { backgroundColor: '#1a0a2e' },
          headerTintColor: '#a78bfa',
          headerTitleStyle: { color: '#fff', fontWeight: '700' },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Fortune summary */}
        {summary !== '' && <FortuneSummaryCard summary={summary} />}

        {/* Message list */}
        <FlatList
          ref={listRef}
          data={allMessages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <ChatBubble msg={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !historyLoaded ? (
              <ActivityIndicator color="#7c3aed" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✦</Text>
                <Text style={styles.emptyTitle}>Ask your cosmic advisor</Text>
                <Text style={styles.emptyDesc}>
                  Dive deeper into your fortune — ask anything about your chart,
                  today's energy, or upcoming decisions.
                </Text>
              </View>
            )
          }
        />

        {/* Errors */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {rateLimited && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Daily limit reached (20 messages). Try again tomorrow.</Text>
          </View>
        )}

        {/* Suggested chips */}
        <SuggestedChips onSelect={handleChipSelect} visible={showChips} />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your fortune…"
            placeholderTextColor="#5a4d7a"
            multiline
            maxLength={400}
            editable={!streaming && !rateLimited}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || streaming) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || streaming}
          >
            {streaming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Locked overlay for free users */}
        {showLocked && <LockedOverlay />}
      </KeyboardAvoidingView>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#1a0a2e', paddingTop: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 8, flexGrow: 1 },
  emptyState:  { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyIcon:   { fontSize: 36, color: '#7c3aed', marginBottom: 16 },
  emptyTitle:  { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  emptyDesc:   { color: '#9d8fbe', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  errorBanner: {
    backgroundColor: '#7f1d1d', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  errorText:   { color: '#fca5a5', fontSize: 13 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: '#2d1854', gap: 10,
  },
  input: {
    flex: 1, backgroundColor: '#2d1854', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    color: '#fff', fontSize: 15, maxHeight: 120,
    borderWidth: 1, borderColor: '#3d2471',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#3d2471' },
});
