import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { buildLangInstruction } from '../_shared/claude.ts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TraditionalResult {
  overallImpression: string;
  personalityTraits: string[];
  relationshipStyle: string;
  careerTendency: string;
  faceEnergySummary: string;
}

interface StateResult {
  moodSignal: string;
  stressIndicator: string;
  fatigueSignal: string;
  emotionalTone: string;
  selfCareTip: string;
  scores?: {
    mood: number;       // 1–10
    stress: number;     // 1–10
    fatigue: number;    // 1–10
    energy: number;     // 1–10
  };
}

// ── Image → base64 ────────────────────────────────────────────────────────────

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mediaType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);

  const contentType = res.headers.get('content-type') ?? 'image/jpeg';
  const mediaType = contentType.split(';')[0].trim();
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowed.includes(mediaType)) throw new Error(`Unsupported image type: ${mediaType}`);

  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);

  return { base64, mediaType };
}

// ── Prompts ───────────────────────────────────────────────────────────────────

function buildSystemPrompt(mode: string, userLanguage?: string): string {
  // Language instruction goes FIRST so it overrides any implicit language from context
  const langInstruction = buildLangInstruction(userLanguage);

  if (mode === 'traditional') {
    return `${langInstruction}You are a traditional physiognomy (관상, 面相) interpreter with deep knowledge of East Asian face-reading traditions.
Provide culturally-informed, entertainment-oriented interpretations only.
ALLOWED phrases: "may suggest", "often associated with", "can be interpreted as", "traditionally linked to", "tends toward".
FORBIDDEN words/phrases: "guaranteed", "proven", "exact prediction", "will definitely", "certainly".
Always remind that physiognomy is a cultural art form, not a predictive science.
Respond in JSON only.`;
  }

  return `${langInstruction}You are a wellness-oriented facial expression and appearance analyst.
Provide general wellness observations based on visible facial cues (skin tone, expression, tension, eye brightness).
This is NOT medical diagnosis. Use observational, supportive language only.
ALLOWED phrases: "possible signal", "may reflect", "wellness-oriented observation", "appears to suggest", "could indicate".
FORBIDDEN words/phrases: "depression", "anxiety disorder", "medical diagnosis", "clinically significant", "you have [condition]".
Respond in JSON only.`;
}

function buildAnalysisPrompt(mode: string): string {
  if (mode === 'traditional') {
    return `Examine this face using traditional East Asian physiognomy principles.

STEP 1 — Face detection: Determine if a clearly visible human face is present.
If NO face is detected, respond ONLY with: {"error":"NO_FACE_DETECTED"}

STEP 2 — If a face IS present, provide this JSON (no other text):
{
  "overallImpression": "<one sentence overall impression>",
  "personalityTraits": ["<trait1>", "<trait2>", "<trait3>"],
  "relationshipStyle": "<one sentence>",
  "careerTendency": "<one sentence>",
  "faceEnergySummary": "<one sentence about facial energy/qi>"
}`;
  }

  return `Analyze the facial cues in this image for a wellness check-in.

STEP 1 — Face detection: Determine if a clearly visible human face is present.
If NO face is detected, respond ONLY with: {"error":"NO_FACE_DETECTED"}

STEP 2 — If a face IS present, provide this JSON (no other text):
{
  "moodSignal": "<one sentence about apparent mood>",
  "stressIndicator": "<one sentence about visible stress signals>",
  "fatigueSignal": "<one sentence about apparent fatigue level>",
  "emotionalTone": "<one sentence about overall emotional tone>",
  "selfCareTip": "<one actionable wellness suggestion>",
  "scores": {
    "mood": <integer 1-10, 10=very positive>,
    "stress": <integer 1-10, 10=very stressed>,
    "fatigue": <integer 1-10, 10=very fatigued>,
    "energy": <integer 1-10, 10=very energetic>
  }
}`;
}

// ── Claude API call ───────────────────────────────────────────────────────────

async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  base64Image: string,
  mediaType: string,
): Promise<Record<string, unknown>> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image },
            },
            { type: 'text', text: userPrompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? '';

  // Extract JSON from response (handle possible markdown code fences)
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
  const jsonStr = match ? match[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${jsonStr}`);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const ANTHROPIC_API_KEY       = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
  const SUPABASE_URL            = Deno.env.get('SUPABASE_URL') ?? '';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

  if (!ANTHROPIC_API_KEY)        return errorResponse('ANTHROPIC_API_KEY not set', 500);
  if (!SUPABASE_URL)             return errorResponse('SUPABASE_URL not set', 500);
  if (!SUPABASE_SERVICE_ROLE_KEY) return errorResponse('SERVICE_ROLE_KEY not set', 500);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const anonClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) return errorResponse('Unauthorized', 401);

  const userId = user.id;

  // ── Parse body ────────────────────────────────────────────────────────────
  let mode: string, imageUrl: string, imageSource: string, locale: string, culturalFrame: string, userLanguage: string;
  try {
    ({ mode, imageUrl, imageSource, locale, culturalFrame, userLanguage } = await req.json());
  } catch {
    return errorResponse('Invalid JSON body');
  }

  if (!['traditional', 'state'].includes(mode)) return errorResponse('Invalid mode');
  if (!imageUrl) return errorResponse('imageUrl is required');

  // ── Service-role client for DB writes ─────────────────────────────────────
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // ── 1. Fetch image and convert to base64 ────────────────────────────────
    let base64: string, mediaType: string;
    try {
      ({ base64, mediaType } = await fetchImageAsBase64(imageUrl));
    } catch (e) {
      return errorResponse(`Image fetch failed: ${(e as Error).message}`, 422);
    }

    // ── 2. Call Claude (face detection + analysis in one call) ───────────────
    const systemPrompt  = buildSystemPrompt(mode, userLanguage ?? locale ?? 'en');
    const analysisPrompt = buildAnalysisPrompt(mode);

    let parsed: Record<string, unknown>;
    try {
      parsed = await callClaude(ANTHROPIC_API_KEY, systemPrompt, analysisPrompt, base64, mediaType);
    } catch (e) {
      console.error('[face-insight] Claude error:', e);
      return errorResponse('AI analysis failed. Please try again.', 502);
    }

    // ── 3. Handle NO_FACE_DETECTED ──────────────────────────────────────────
    if (parsed.error === 'NO_FACE_DETECTED') {
      return jsonResponse({ error: 'NO_FACE_DETECTED' }, 422);
    }

    // ── 4. Create session record ─────────────────────────────────────────────
    const { data: session, error: sessionError } = await db
      .from('face_insight_sessions')
      .insert({
        user_id:       userId,
        mode,
        image_source:  imageSource ?? null,
        image_url:     imageUrl,
        locale:        locale ?? 'en',
        cultural_frame: culturalFrame ?? 'en',
        status:        'completed',
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      console.error('[face-insight] session insert error:', sessionError);
      return errorResponse('Failed to create session', 500);
    }

    // ── 5. Build result fields ───────────────────────────────────────────────
    let summaryText: string;
    let moodScore: number | null    = null;
    let stressScore: number | null  = null;
    let fatigueScore: number | null = null;
    let energyScore: number | null  = null;

    if (mode === 'state') {
      const r = parsed as unknown as StateResult;
      summaryText = r.emotionalTone ?? '';
      if (r.scores) {
        moodScore    = r.scores.mood;
        stressScore  = r.scores.stress;
        fatigueScore = r.scores.fatigue;
        energyScore  = r.scores.energy;
      }
    } else {
      const r = parsed as unknown as TraditionalResult;
      summaryText = r.overallImpression ?? '';
    }

    // ── 6. Save result record ────────────────────────────────────────────────
    const { error: resultError } = await db
      .from('face_insight_results')
      .insert({
        session_id:   session.id,
        result_json:  parsed,
        summary_text: summaryText,
        mood_score:   moodScore,
        stress_score: stressScore,
        fatigue_score: fatigueScore,
        energy_score: energyScore,
      });

    if (resultError) {
      console.error('[face-insight] result insert error:', resultError);
      // Non-fatal: session was created; still return result
    }

    // ── 7. Return response ───────────────────────────────────────────────────
    return jsonResponse({
      sessionId: session.id,
      status:    'completed',
      result:    parsed,
    });

  } catch (error) {
    console.error('[face-insight] unexpected error:', error);
    return errorResponse(error instanceof Error ? error.message : String(error), 500);
  }
});
