/**
 * Supabase Edge Function: daily-fortune-push
 * Deno runtime
 *
 * Triggered by a pg_cron job (or Supabase Edge Function schedule) daily at 08:00 UTC.
 * Fetches all active push tokens and sends a daily fortune reminder via Expo's
 * push notification API.
 *
 * ── Supabase cron setup (run in SQL editor) ───────────────────────────────────
 * select cron.schedule(
 *   'daily-fortune-push',
 *   '0 8 * * *',        -- 08:00 UTC every day
 *   $$
 *   select net.http_post(
 *     url     := current_setting('app.supabase_url') || '/functions/v1/daily-fortune-push',
 *     headers := jsonb_build_object(
 *       'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
 *       'Content-Type', 'application/json',
 *       'x-cron-secret', current_setting('app.cron_secret')
 *     ),
 *     body    := '{}'::jsonb
 *   ) as request_id;
 *   $$
 * );
 *
 * ── Required env vars ─────────────────────────────────────────────────────────
 *   SUPABASE_URL            — project URL
 *   SUPABASE_SERVICE_ROLE_KEY — bypasses RLS to read all push tokens
 *   CRON_SECRET             — shared secret to authenticate cron caller
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';

// ── Expo push API ─────────────────────────────────────────────────────────────

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
}

async function sendPushBatch(messages: ExpoPushMessage[]): Promise<void> {
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Expo push failed ${res.status}: ${text}`);
  }

  const result = await res.json() as { data: ExpoPushTicket[] };
  const errors = result.data.filter((t) => t.status === 'error');
  if (errors.length > 0) {
    console.warn('[daily-fortune-push] push errors:', JSON.stringify(errors));
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  // ── Authenticate cron caller ───────────────────────────────────────────────
  const CRON_SECRET            = Deno.env.get('CRON_SECRET') ?? '';
  const SUPABASE_URL           = Deno.env.get('SUPABASE_URL') ?? '';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (CRON_SECRET) {
    const callerSecret = req.headers.get('x-cron-secret') ?? '';
    if (callerSecret !== CRON_SECRET) {
      return errorResponse('Forbidden', 403);
    }
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse('Server configuration error', 500);
  }

  // ── Fetch all enabled push tokens ──────────────────────────────────────────
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: tokens, error: dbError } = await adminClient
    .from('push_tokens')
    .select('token, platform')
    .eq('notifications_enabled', true);

  if (dbError) {
    console.error('[daily-fortune-push] DB error:', dbError);
    return errorResponse('Database error', 500);
  }

  if (!tokens || tokens.length === 0) {
    return jsonResponse({ ok: true, sent: 0, message: 'No tokens to notify' });
  }

  // ── Build notification messages ────────────────────────────────────────────
  const messages: ExpoPushMessage[] = tokens.map((row: { token: string; platform: string }) => ({
    to: row.token,
    title: '🌙 오늘의 운세',
    body: 'Your daily fortune reading is ready — tap to explore your cosmic energy today.',
    data: { screen: '/(tabs)/home' },
    sound: 'default',
    ...(row.platform === 'android' ? { channelId: 'daily-fortune' } : {}),
  }));

  // ── Send in batches of 100 (Expo limit) ───────────────────────────────────
  let sent = 0;
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    try {
      await sendPushBatch(batch);
      sent += batch.length;
    } catch (e) {
      console.error(`[daily-fortune-push] batch ${i / BATCH_SIZE} failed:`, e);
    }
  }

  console.log(`[daily-fortune-push] sent ${sent}/${tokens.length} notifications`);
  return jsonResponse({ ok: true, sent, total: tokens.length });
});
