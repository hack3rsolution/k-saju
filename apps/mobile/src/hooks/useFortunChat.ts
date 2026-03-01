/**
 * useFortunChat — manages the AI follow-up chat session for a given fortune.
 *
 * Streams Claude's response from the fortune-chat Edge Function.
 * Free users receive a 403 → redirect to paywall.
 * Premium users limited to 20 messages/day (enforced server-side).
 */
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSajuStore } from '../store/sajuStore';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FortuneChatState {
  messages: ChatMessage[];
  streaming: boolean;
  error: string | null;
  rateLimited: boolean;
  premiumRequired: boolean;
  sendMessage: (content: string) => Promise<void>;
  reset: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFortunChat(
  fortuneId: string,
  todayReading: { summary: string; details: string[] } | null,
): FortuneChatState {
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [streaming, setStreaming]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [rateLimited, setRateLimited]   = useState(false);
  const [premiumRequired, setPremiumRequired] = useState(false);

  const { session } = useAuthStore();
  const { chart, frame } = useSajuStore();

  const sendMessage = useCallback(async (content: string) => {
    if (!session || !chart || !todayReading || streaming) return;

    const userMsg: ChatMessage = { role: 'user', content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setStreaming(true);
    setError(null);
    setRateLimited(false);

    // Placeholder assistant message for streaming UI
    const placeholder: ChatMessage = { role: 'assistant', content: '' };
    setMessages([...nextMessages, placeholder]);

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

      const resp = await globalThis.fetch(
        `${supabaseUrl}/functions/v1/fortune-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            fortuneId,
            messages: nextMessages,
            frame: frame ?? 'en',
            chart: {
              yearPillar:     chart.pillars.year,
              monthPillar:    chart.pillars.month,
              dayPillar:      chart.pillars.day,
              hourPillar:     chart.pillars.hour,
              elementBalance: chart.elements,
              dayStem:        chart.dayStem,
            },
            todayReading,
          }),
        },
      );

      // Premium gate
      if (resp.status === 403) {
        setPremiumRequired(true);
        setMessages(nextMessages); // remove placeholder
        return;
      }

      // Rate limit
      if (resp.status === 429) {
        setRateLimited(true);
        setMessages(nextMessages);
        return;
      }

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }

      // ── Stream reading ─────────────────────────────────────────────────────
      const reader = resp.body?.getReader();
      if (!reader) {
        // Fallback: read as text if streaming not available
        const text = await resp.text();
        setMessages([...nextMessages, { role: 'assistant', content: text }]);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = '';
      let lineBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data) as { token?: string };
            if (parsed.token) {
              accumulated += parsed.token;
              setMessages([
                ...nextMessages,
                { role: 'assistant', content: accumulated },
              ]);
            }
          } catch { /* skip malformed SSE event */ }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to get response');
      // Remove placeholder on error
      setMessages(nextMessages);
    } finally {
      setStreaming(false);
    }
  }, [session, chart, frame, messages, todayReading, fortuneId, streaming]);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setRateLimited(false);
    setPremiumRequired(false);
  }, []);

  return { messages, streaming, error, rateLimited, premiumRequired, sendMessage, reset };
}

// ── Persist chat history to Supabase ─────────────────────────────────────────

export async function loadChatHistory(
  fortuneId: string,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('fortune_chat_history')
    .select('role, content, created_at')
    .eq('fortune_cache_id', fortuneId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data.map((row: { role: string; content: string }) => ({
    role:    row.role as 'user' | 'assistant',
    content: row.content,
  }));
}
