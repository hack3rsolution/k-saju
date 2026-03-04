/**
 * useFreemiumLimits — client-side freemium usage tracking.
 *
 * Freemium gates (client-enforced, no server round-trip required):
 *   Fortune Chat:    FREE_CHAT_PER_DAY per calendar day (key: freemium_chat_YYYY-MM-DD)
 *   Timing Advisor:  FREE_TIMING_PER_MONTH per calendar month (key: freemium_timing_YYYY-MM)
 *
 * DEV_BYPASS: set EXPO_PUBLIC_ENABLE_DEV_BYPASS=true in .env.local to skip all limits in dev.
 *
 * Usage:
 *   const { chatRemaining, canChat, consumeChat } = useFreemiumLimits();
 *   if (!isPremium && !canChat) { router.push('/paywall'); return; }
 *   await consumeChat();
 *   // ... send chat
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Constants ─────────────────────────────────────────────────────────────────

const DEV_BYPASS = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_BYPASS === 'true';

const FREE_CHAT_PER_DAY = 1;
const FREE_TIMING_PER_MONTH = 1;

// ── Storage key helpers ───────────────────────────────────────────────────────

function chatKey(): string {
  return `freemium_chat_${new Date().toISOString().split('T')[0]}`;
}

function timingKey(): string {
  const d = new Date();
  return `freemium_timing_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Calendar days remaining in the current month (inclusive of today). */
function daysLeftInMonth(): number {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return daysInMonth - now.getDate();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FreemiumLimits {
  /** Remaining free chats today — 0 means limit reached. */
  chatRemaining: number;
  /** Days until Timing Advisor resets — 0 means can use now. */
  timingDaysUntilFree: number;
  /** True when the user still has a free chat available today. */
  canChat: boolean;
  /** True when the user still has a free timing analysis this month. */
  canUseTiming: boolean;
  /**
   * Decrement the daily chat counter. Call BEFORE sending the chat request.
   * No-op under DEV_BYPASS or for premium users (caller should skip).
   */
  consumeChat: () => Promise<void>;
  /**
   * Decrement the monthly timing counter. Call BEFORE sending the request.
   * No-op under DEV_BYPASS or for premium users.
   */
  consumeTiming: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFreemiumLimits(): FreemiumLimits {
  const [chatCount, setChatCount] = useState(0);
  const [timingCount, setTimingCount] = useState(0);

  // Load persisted counts once on mount
  useEffect(() => {
    if (DEV_BYPASS) return;
    async function load() {
      const [chat, timing] = await Promise.all([
        AsyncStorage.getItem(chatKey()),
        AsyncStorage.getItem(timingKey()),
      ]);
      setChatCount(parseInt(chat ?? '0', 10));
      setTimingCount(parseInt(timing ?? '0', 10));
    }
    load();
  }, []);

  const consumeChat = useCallback(async () => {
    if (DEV_BYPASS) return;
    const next = chatCount + 1;
    setChatCount(next);
    await AsyncStorage.setItem(chatKey(), String(next));
  }, [chatCount]);

  const consumeTiming = useCallback(async () => {
    if (DEV_BYPASS) return;
    const next = timingCount + 1;
    setTimingCount(next);
    await AsyncStorage.setItem(timingKey(), String(next));
  }, [timingCount]);

  // DEV_BYPASS: no limits applied
  if (DEV_BYPASS) {
    return {
      chatRemaining: FREE_CHAT_PER_DAY,
      timingDaysUntilFree: 0,
      canChat: true,
      canUseTiming: true,
      consumeChat: async () => {},
      consumeTiming: async () => {},
    };
  }

  const chatRemaining = Math.max(0, FREE_CHAT_PER_DAY - chatCount);
  const timingDaysUntilFree = timingCount >= FREE_TIMING_PER_MONTH ? daysLeftInMonth() : 0;

  return {
    chatRemaining,
    timingDaysUntilFree,
    canChat: chatRemaining > 0,
    canUseTiming: timingCount < FREE_TIMING_PER_MONTH,
    consumeChat,
    consumeTiming,
  };
}
