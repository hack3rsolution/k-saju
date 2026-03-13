import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { userId, targetDate, eventType, notifyDaysBefore, nativeEventId, expoNotificationIds } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await supabase
      .from('calendar_notifications')
      .upsert({
        user_id:               userId,
        target_date:           targetDate,
        event_type:            eventType,
        notify_days_before:    notifyDaysBefore ?? [1, 3, 7],
        native_event_id:       nativeEventId ?? null,
        expo_notification_ids: expoNotificationIds ?? [],
        is_active:             true,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ data, cached: false }, { headers: corsHeaders })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: corsHeaders })
  }
})
