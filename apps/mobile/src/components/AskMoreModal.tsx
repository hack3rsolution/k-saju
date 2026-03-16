/**
 * AskMoreModal — floating bottom-sheet chat for AI fortune follow-up.
 *
 * Free users: MAX_FREE_TURNS (3) per day, persisted via AsyncStorage.
 * Premium users: unlimited.
 * Session auto-restores on same day; clears on date change.
 * SSE streaming via useFortunChat hook.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFortunChat, type ChatMessage } from '../hooks/useFortunChat';
import { loadSession, saveSession, clearSession } from '../utils/chatStorage';
import { ChatIcon, CloseIcon, RefreshIcon } from './icons';

// ── Constants ─────────────────────────────────────────────────────────────────

const SCREEN_H = Dimensions.get('window').height;
const MAX_FREE_TURNS    = 3;
const MAX_PREMIUM_TURNS = 10;

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  isPremium: boolean;
  fortuneId: string;
  todayReading: { summary: string; details: string[] } | null;
}

// ── Markdown bold renderer ────────────────────────────────────────────────────

function BoldText({ text, baseStyle }: { text: string; baseStyle: object }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={baseStyle}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <Text key={i} style={msgStyles.bold}>{p.slice(2, -2)}</Text>
          : <Text key={i}>{p}</Text>,
      )}
    </Text>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === 'user') {
    return (
      <View style={[msgStyles.bubble, msgStyles.userBubble]}>
        <Text style={msgStyles.userText}>{msg.content}</Text>
      </View>
    );
  }
  if (msg.content === '') {
    return (
      <View style={[msgStyles.bubble, msgStyles.aiBubble]}>
        <ActivityIndicator size="small" color="rgba(201,168,76,0.6)" />
      </View>
    );
  }
  return (
    <View style={[msgStyles.bubble, msgStyles.aiBubble]}>
      <BoldText text={msg.content} baseStyle={msgStyles.aiText} />
    </View>
  );
}

const msgStyles = StyleSheet.create({
  bubble:    {
    maxWidth: '86%', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10,
  },
  userBubble:{ alignSelf: 'flex-end', backgroundColor: 'rgba(139,124,200,0.35)' },
  aiBubble:  {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)',
  },
  userText:  { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  aiText:    { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  bold:      { fontWeight: '700', color: '#C9A84C' },
});

// ── Suggested chips ───────────────────────────────────────────────────────────

function SuggestedChips({
  visible,
  onSelect,
}: {
  visible: boolean;
  onSelect: (q: string) => void;
}) {
  const { t } = useTranslation('common');
  if (!visible) return null;
  const chips = [t('fortuneChat.chip1'), t('fortuneChat.chip2'), t('fortuneChat.chip3')];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={chipStyles.scroll}
      contentContainerStyle={chipStyles.content}
    >
      {chips.map((q) => (
        <TouchableOpacity key={q} style={chipStyles.chip} onPress={() => onSelect(q)}>
          <Text style={chipStyles.text}>{q}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const chipStyles = StyleSheet.create({
  scroll:  { maxHeight: 44, marginBottom: 6 },
  content: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip:    {
    backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
  },
  text:    { color: '#C9A84C', fontSize: 12 },
});

// ── Main component ────────────────────────────────────────────────────────────

export function AskMoreModal({ visible, onClose, isPremium, fortuneId, todayReading }: Props) {
  const { t } = useTranslation('common');
  const { messages, streaming, error, rateLimited, premiumRequired, sendMessage, reset } =
    useFortunChat(fortuneId, todayReading);

  const [input, setInput]           = useState('');
  const [turns, setTurns]           = useState(0);
  // Saved messages from AsyncStorage (shown when hook messages are empty)
  const [savedMessages, setSavedMessages] = useState<ChatMessage[]>([]);
  const [isRestored, setIsRestored] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // ── Derived ──────────────────────────────────────────────────────────────

  const effectiveMax   = isPremium ? MAX_PREMIUM_TURNS : MAX_FREE_TURNS;
  const remaining      = effectiveMax - turns;
  const isLimitReached = turns >= effectiveMax;
  const isServerLocked = premiumRequired;
  const isLocked       = isLimitReached || isServerLocked;
  const isDisabled     = isLocked || streaming || rateLimited;

  // Merge: show hook messages once a conversation is active, else show saved
  const displayMessages: ChatMessage[] =
    messages.length > 0 ? messages : savedMessages;

  // ── Session load on open ──────────────────────────────────────────────────

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const session = await loadSession();
      if (session && session.messages.length > 0) {
        setSavedMessages(session.messages);
        setTurns(session.turns);
        setIsRestored(true);
        setTimeout(() => setIsRestored(false), 5000);
      } else {
        setSavedMessages([]);
        setTurns(0);
      }
    })();
  }, [visible]);

  // ── Auto-save when messages or turns change ───────────────────────────────

  useEffect(() => {
    const toSave = messages.length > 0 ? messages : savedMessages;
    if (toSave.length === 0 && turns === 0) return;
    saveSession(toSave, turns);
  }, [messages, savedMessages, turns]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleSend() {
    const text = input.trim();
    if (!text || isDisabled) return;
    setInput('');
    setTurns((n) => n + 1);     // always increment (badge shows for everyone)
    sendMessage(text);
    scrollToEnd();
  }

  function handleRefresh() {
    Alert.alert(
      t('fortuneChat.resetTitle'),
      t('fortuneChat.resetMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('fortuneChat.resetConfirm'),
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            reset();
            setSavedMessages([]);
            setTurns(0);
            setInput('');
            setIsRestored(false);
          },
        },
      ],
    );
  }

  function handleClose() {
    // Save happens via useEffect — just close, no state reset
    onClose();
  }

  const showChips       = displayMessages.length === 0 && !streaming;
  const showLimitBanner = isLimitReached || isServerLocked;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      {/* Tap-outside → close (session preserved) */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kvContainer}
        keyboardVerticalOffset={0}
      >
        <View style={styles.card}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ChatIcon color="#C9A84C" size={15} />
              <Text style={styles.title}>{t('fortuneChat.title')}</Text>
            </View>
            <View style={styles.headerRight}>
              {/* Badge — always visible, uniform "N회 남음" format */}
              <View style={[
                styles.badge,
                remaining <= 1 && styles.badgeWarn,
              ]}>
                <Text style={[
                  styles.badgeText,
                  remaining <= 1 && styles.badgeTextWarn,
                ]}>
                  {t('fortuneChat.remaining', { count: remaining })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={handleRefresh}
                disabled={streaming || displayMessages.length === 0}
              >
                <RefreshIcon color="rgba(201,168,76,0.45)" size={16} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={handleClose}>
                <CloseIcon color="rgba(201,168,76,0.55)" size={17} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Restored session banner */}
          {isRestored && (
            <View style={styles.restoredBanner}>
              <Text style={styles.restoredText}>{t('fortuneChat.sessionRestored')}</Text>
            </View>
          )}

          {/* Message list */}
          <FlatList
            ref={listRef}
            data={displayMessages}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => <Bubble msg={item} />}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToEnd}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t('fortuneChat.emptyDesc')}</Text>
              </View>
            }
          />

          {/* Error banner */}
          {(error || rateLimited) && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>
                {rateLimited ? t('fortuneChat.rateLimit') : error}
              </Text>
            </View>
          )}

          {/* Limit / server-locked banner */}
          {showLimitBanner && (
            <View style={styles.limitBanner}>
              <Text style={styles.limitText}>
                {isServerLocked
                  ? t('fortuneChat.lockDesc')
                  : isPremium
                  ? t('fortuneChat.premiumLimitReached')
                  : t('fortuneChat.freeLimitReached')}
              </Text>
              {!isPremium && !isServerLocked && (
                <TouchableOpacity onPress={() => { handleClose(); router.push('/paywall'); }}>
                  <Text style={styles.upgradeText}>{t('fortuneChat.upgradePremium')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Suggested chips */}
          <SuggestedChips visible={showChips} onSelect={(q) => setInput(q)} />

          {/* Input bar */}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, isLocked && styles.inputDisabled]}
              value={input}
              onChangeText={setInput}
              placeholder={
                isLocked ? t('fortuneChat.lockedPlaceholder') : t('fortuneChat.placeholder')
              }
              placeholderTextColor={isLocked ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.3)'}
              editable={!isDisabled}
              multiline
              maxLength={300}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isDisabled) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isDisabled}
            >
              {streaming
                ? <ActivityIndicator size="small" color="#1a1035" />
                : <Text style={styles.sendArrow}>↑</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  kvContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },
  card: {
    height: SCREEN_H * 0.58,
    backgroundColor: '#12092a',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(201,168,76,0.3)',
    alignSelf: 'center', marginTop: 10, marginBottom: 2,
  },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.12)',
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title:       { fontSize: 14, color: '#C9A84C', fontWeight: '500' },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  badgeWarn:     { backgroundColor: 'rgba(232,93,36,0.1)', borderColor: 'rgba(232,93,36,0.45)' },
  badgeText:     { fontSize: 11, color: '#C9A84C', fontWeight: '600' },
  badgeTextWarn: { color: '#E85D24' },
  controlBtn:    { padding: 6 },

  // Restored banner
  restoredBanner: {
    paddingHorizontal: 16, paddingVertical: 5,
    backgroundColor: 'rgba(201,168,76,0.07)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.08)',
  },
  restoredText: { fontSize: 11, color: 'rgba(201,168,76,0.6)', textAlign: 'center' },

  // Messages
  list:        { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  emptyState:  { alignItems: 'center', paddingTop: 24 },
  emptyText:   { color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center' },

  // Error / limit banners
  errorBanner: {
    backgroundColor: 'rgba(127,29,29,0.8)', marginHorizontal: 12, marginBottom: 6,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  errorText:   { color: '#fca5a5', fontSize: 12 },
  limitBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 12, marginBottom: 6, padding: 10,
    borderRadius: 10, backgroundColor: 'rgba(201,168,76,0.07)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
  },
  limitText:   { fontSize: 12, color: 'rgba(201,168,76,0.75)', flex: 1, marginRight: 8 },
  upgradeText: { fontSize: 12, color: '#C9A84C', fontWeight: '700' },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingBottom: Platform.OS === 'ios' ? 26 : 16,
    paddingTop: 8, gap: 8,
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: '#fff', fontSize: 14,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
  },
  inputDisabled: { opacity: 0.4 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#C9A84C', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: 'rgba(201,168,76,0.22)' },
  sendArrow: { color: '#1a1035', fontSize: 18, fontWeight: '800' },
});
