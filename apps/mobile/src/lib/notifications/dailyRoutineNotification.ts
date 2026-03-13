/**
 * dailyRoutineNotification.ts — 오행 에너지 데일리 루틴 알림
 *
 * 사용자의 지배 오행(사주에서 고정)에 맞는 텍스트로
 * 매일 특정 시간에 반복 알림을 스케줄링한다.
 *
 * 스케줄링: expo-notifications CalendarTriggerInput (repeats: true)
 * 기본 시간: 07:30 로컬 시간
 * DB 저장: notification_preferences.daily_routine_enabled / daily_routine_time
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../supabase';
import type { RoutineElement } from '../../hooks/useDailyRoutine';

// ── 오행별 알림 텍스트 ────────────────────────────────────────────────────────

const ROUTINE_NOTIF_TEXT: Record<RoutineElement, { title: string; body: string }> = {
  Wood:  {
    title: '🌱 Wood Energy Grows Today',
    body:  'Your Wood day is here. Stretch before noon and let ideas reach for light.',
  },
  Fire:  {
    title: '🔥 Fire Energy Rises Today',
    body:  'Speak up and connect. Your heart energy is at its peak — use it.',
  },
  Earth: {
    title: '🌾 Earth Grounds You Today',
    body:  'Slow down and nourish. Stability is your superpower today.',
  },
  Metal: {
    title: '⚡ Metal Sharpens Focus Today',
    body:  'Clear space, clear mind. Precision flows through you — release what\'s unnecessary.',
  },
  Water: {
    title: '💧 Water Flows Deeply Today',
    body:  'Journal your thoughts. Wisdom surfaces when you move inward.',
  },
};

const GENERIC_NOTIF = {
  title: '✨ Today\'s Energy Routine',
  body:  'Your five elements daily routine is ready — check today\'s energy.',
};

// ── Notification identifier ───────────────────────────────────────────────────

const ROUTINE_NOTIF_ID = 'daily-routine-notif';

// ── Android 채널 ─────────────────────────────────────────────────────────────

export async function ensureRoutineChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('daily-routine', {
    name: 'Daily Energy Routine',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#22c55e', // Wood green — generic channel accent
  });
}

// ── 스케줄 / 취소 ─────────────────────────────────────────────────────────────

/** 오행 루틴 알림 스케줄 등록.
 * @param hour    로컬 시간 기준 시 (0~23), 기본 7
 * @param minute  로컬 시간 기준 분 (0~59), 기본 30
 * @param element 사용자 지배 오행 (사주 기반, 고정값)
 */
export async function scheduleRoutineNotification(
  hour    = 7,
  minute  = 30,
  element?: RoutineElement,
): Promise<void> {
  await cancelRoutineNotification();
  await ensureRoutineChannel();

  const content = element ? ROUTINE_NOTIF_TEXT[element] : GENERIC_NOTIF;

  await Notifications.scheduleNotificationAsync({
    identifier: ROUTINE_NOTIF_ID,
    content: {
      title: content.title,
      body:  content.body,
      data:  { screen: '/(tabs)/home' },
      ...(Platform.OS === 'android' ? { channelId: 'daily-routine' } : {}),
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    } as Notifications.CalendarTriggerInput,
  });
}

/** 오행 루틴 알림 취소. */
export async function cancelRoutineNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ROUTINE_NOTIF_ID).catch(() => {});
}

/** 현재 알림이 스케줄됐는지 확인. */
export async function isRoutineNotificationScheduled(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some(n => n.identifier === ROUTINE_NOTIF_ID);
}

// ── DB 헬퍼 ───────────────────────────────────────────────────────────────────

/** notification_preferences 테이블에 데일리 루틴 설정 저장. */
export async function saveRoutinePreference(
  userId:  string,
  enabled: boolean,
  hour:    number,
  minute:  number,
): Promise<void> {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id:               userId,
        daily_routine_enabled: enabled,
        daily_routine_time:    `${hh}:${mm}:00`,
        updated_at:            new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
}

/** notification_preferences 테이블에서 설정 로드. */
export async function loadRoutinePreference(
  userId: string,
): Promise<{ enabled: boolean; hour: number; minute: number }> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('daily_routine_enabled, daily_routine_time')
      .eq('user_id', userId)
      .single();

    if (error || !data) return { enabled: false, hour: 7, minute: 30 };

    const row = data as Record<string, unknown>;
    const enabled = Boolean(row.daily_routine_enabled ?? false);
    const timeStr = (row.daily_routine_time as string | null) ?? '07:30:00';
    const [h, m]  = timeStr.split(':').map(Number);

    return { enabled, hour: h ?? 7, minute: m ?? 30 };
  } catch {
    return { enabled: false, hour: 7, minute: 30 };
  }
}
