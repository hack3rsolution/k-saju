import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '../hooks/useFortunChat';

const KEY = 'ask_more_session';

interface ChatSession {
  date: string;        // 'YYYY-MM-DD'
  messages: ChatMessage[];
  turns: number;
}

const today = () => new Date().toISOString().slice(0, 10);

export const loadSession = async (): Promise<ChatSession | null> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ChatSession;
    if (session.date !== today()) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

export const saveSession = async (
  messages: ChatMessage[],
  turns: number,
): Promise<void> => {
  try {
    const session: ChatSession = { date: today(), messages, turns };
    await AsyncStorage.setItem(KEY, JSON.stringify(session));
  } catch {}
};

export const clearSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
};
