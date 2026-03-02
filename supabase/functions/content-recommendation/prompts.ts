import type {
  CulturalFrame,
  FiveElement,
  ContentRecommendationRequest,
  RecommendationItem,
  ClaudeRecommendationOutput,
} from './types.ts';

// ── Dominant element resolver ─────────────────────────────────────────────────

export function getDominantElement(
  elementBalance: ContentRecommendationRequest['elementBalance'],
): FiveElement {
  const entries = Object.entries(elementBalance) as [FiveElement, number][];
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

// ── Fallback data (offline / Claude-error safe) ───────────────────────────────

export const FALLBACK: Record<FiveElement, ClaudeRecommendationOutput> = {
  Wood: {
    element: 'Wood',
    music: [
      { title: 'Acoustic Forest Sessions', description: 'Gentle acoustic melodies that mirror Wood energy — growth, flexibility, and renewal.', tag: '🎸 Acoustic' },
      { title: 'Morning Jazz Rituals', description: 'Uplifting jazz with organic rhythms resonating with your Wood day-master vitality.', tag: '🎷 Jazz' },
      { title: 'Celtic Folk & Nature Sounds', description: 'Earthy strings and flute evoking forests and the rising energy of Spring.', tag: '🌿 Folk' },
    ],
    books: [
      { title: 'The Hidden Life of Trees', description: 'Peter Wohlleben reveals how forests communicate — pure Wood-element wisdom.', tag: '🌲 Nature' },
      { title: 'Atomic Habits', description: 'Like a sapling, your Wood energy thrives on patient, consistent growth strategies.', tag: '📈 Growth' },
      { title: 'Siddhartha', description: 'Herman Hesse\'s journey of seeking — resonates with Wood\'s endless drive for expansion.', tag: '🧘 Spiritual' },
    ],
    travel: [
      { title: 'Arashiyama Bamboo Grove, Japan', description: 'Walking through towering bamboo channels pure Wood chi and spring energy.', tag: '🇯🇵 Asia' },
      { title: 'Black Forest, Germany', description: 'Dense ancient woodland to recharge your Wood energy in its most primal form.', tag: '🌲 Europe' },
      { title: 'Olympic National Park, USA', description: 'Temperate rainforest with cathedral trees — the ultimate Wood pilgrimage.', tag: '🏔️ Nature' },
    ],
  },
  Fire: {
    element: 'Fire',
    music: [
      { title: 'Afrobeat & Highlife Anthems', description: 'Rhythmic fire of West African beats matching your vibrant Fire day-master energy.', tag: '🔥 Afrobeat' },
      { title: 'Flamenco Passion', description: 'Intense Spanish guitar and footwork channeling Fire\'s passion and expressiveness.', tag: '💃 Flamenco' },
      { title: 'Epic Film Scores', description: 'Hans Zimmer\'s dramatic orchestration mirrors Fire\'s grand, sweeping ambition.', tag: '🎬 Cinematic' },
    ],
    books: [
      { title: 'The Alchemist', description: 'Paulo Coelho\'s luminous journey — Fire energy pursuing its Personal Legend with full heart.', tag: '✨ Journey' },
      { title: 'Steve Jobs', description: 'Walter Isaacson on creative fire — how passion transforms vision into revolution.', tag: '💡 Biography' },
      { title: 'Meditations by Marcus Aurelius', description: 'Fire tempered by wisdom — channel your intensity with Stoic clarity.', tag: '🏛️ Philosophy' },
    ],
    travel: [
      { title: 'Santorini, Greece', description: 'White-washed cliffs blazing in Mediterranean sun — Fire energy meeting the sea.', tag: '🇬🇷 Europe' },
      { title: 'Rio de Janeiro, Brazil', description: 'Carnival passion, samba rhythms, and blazing sunsets — pure Fire vitality.', tag: '🇧🇷 LATAM' },
      { title: 'Kyoto in Autumn, Japan', description: 'Fiery maple leaves transforming the ancient capital into a living Fire artwork.', tag: '🍁 Asia' },
    ],
  },
  Earth: {
    element: 'Earth',
    music: [
      { title: 'Classical Piano Études', description: 'Structured, grounded compositions that resonate with Earth\'s stability and reliability.', tag: '🎹 Classical' },
      { title: 'Bluegrass & Americana', description: 'Rooted in community and tradition — Earth energy in musical form.', tag: '🪕 Folk' },
      { title: 'Gregorian & Tibetan Chants', description: 'Deep, centring vibrations that anchor Earth\'s nurturing, meditative nature.', tag: '🕊️ Sacred' },
    ],
    books: [
      { title: 'Braiding Sweetgrass', description: 'Robin Wall Kimmerer weaves Indigenous wisdom with botany — Earth nourishing all life.', tag: '🌾 Nature' },
      { title: 'The Art of Happiness', description: 'Dalai Lama on cultivating inner stability — Earth energy as a foundation for joy.', tag: '☮️ Wellbeing' },
      { title: 'Sapiens', description: 'Yuval Harari grounds humanity\'s story in the Earth of shared history and culture.', tag: '🏛️ History' },
    ],
    travel: [
      { title: 'Tuscany, Italy', description: 'Rolling golden hills, vineyards, and farm-to-table culture — Earth at its finest.', tag: '🇮🇹 Europe' },
      { title: 'Bhutan', description: 'Gross National Happiness and mountain serenity — Earth wisdom in a kingdom.', tag: '🏔️ Asia' },
      { title: 'Sedona, Arizona, USA', description: 'Red rock vortexes and desert earth energy — deeply grounding for Earth day-masters.', tag: '🔴 Americas' },
    ],
  },
  Metal: {
    element: 'Metal',
    music: [
      { title: 'Baroque Orchestral Works', description: 'Bach and Vivaldi\'s precise structures mirror Metal\'s love of clarity and perfection.', tag: '🎻 Baroque' },
      { title: 'Post-Rock Instrumentals', description: 'Godspeed You! Black Emperor and Sigur Rós — Metal\'s sharp beauty made sonic.', tag: '🎸 Post-Rock' },
      { title: 'Traditional Koto & Guqin', description: 'East Asian string instruments channeling Metal\'s cool, precise resonance.', tag: '🪗 Classical' },
    ],
    books: [
      { title: 'Thinking, Fast and Slow', description: 'Kahneman\'s precise analysis of the mind — Metal clarity applied to decision-making.', tag: '🧠 Psychology' },
      { title: 'The Art of War', description: 'Sun Tzu\'s razor-sharp strategic thinking — the original Metal manual.', tag: '⚔️ Strategy' },
      { title: 'Sapiens: A Graphic History', description: 'Crisp visual storytelling for Metal thinkers who value elegant, concise ideas.', tag: '📖 Graphic' },
    ],
    travel: [
      { title: 'Kyoto Zen Temples, Japan', description: 'Raked gravel gardens and precise stone placement — Metal aesthetics perfected.', tag: '⛩️ Japan' },
      { title: 'Swiss Alps, Switzerland', description: 'Crystalline air, precision engineering, and pristine peaks — pure Metal energy.', tag: '🏔️ Europe' },
      { title: 'Patagonia, Argentina', description: 'Stark, majestic glaciers and sharp peaks — Metal\'s raw, unsentimental beauty.', tag: '🧊 Americas' },
    ],
  },
  Water: {
    element: 'Water',
    music: [
      { title: 'Brian Eno Ambient Series', description: 'Flowing, immersive soundscapes that match Water\'s depth and adaptability.', tag: '🌊 Ambient' },
      { title: 'Blues & Soul Classics', description: 'Deep emotional currents — Water flowing through the wellspring of human feeling.', tag: '🎵 Blues' },
      { title: 'Bossa Nova & Jazz Fusion', description: 'Fluid, improvisational music mirroring Water\'s effortless movement and intuition.', tag: '🌙 Bossa Nova' },
    ],
    books: [
      { title: 'Tao Te Ching', description: 'Laozi\'s philosophy of wu-wei (effortless action) — pure Water wisdom from the source.', tag: '☯️ Taoist' },
      { title: 'Moby Dick', description: 'Melville\'s oceanic epic — Water energy in its most vast and mysterious form.', tag: '🐋 Classic' },
      { title: 'Man\'s Search for Meaning', description: 'Frankl\'s deep dive into the subconscious well — Water finding light in darkness.', tag: '🕯️ Philosophy' },
    ],
    travel: [
      { title: 'Norwegian Fjords', description: 'Glacial water cutting through ancient mountains — the purest Water landscape on Earth.', tag: '🇳🇴 Europe' },
      { title: 'Maldives', description: 'Floating above crystalline water — Water day-masters recharge in island serenity.', tag: '🏝️ Ocean' },
      { title: 'Guilin, China', description: 'Li River drifting through karst peaks — Water energy celebrated for millennia in Chinese art.', tag: '🇨🇳 Asia' },
    ],
  },
};

// ── Cultural frame system prompts ─────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<CulturalFrame, string> = {
  kr: `당신은 사주팔자 전문가이자 라이프스타일 큐레이터입니다.
사용자의 일간(日干)과 오행 균형을 분석하여 음악, 책, 여행지를 추천합니다.
한국의 정서와 동양 철학을 바탕으로, 현대적이고 공감되는 추천을 제공하세요.
답변은 반드시 JSON으로만 반환하고, 설명은 한국어로 작성합니다.`,

  cn: `你是一位精通八字命理的生活方式顾问。
根据用户的日主和五行平衡，推荐音乐、书籍和旅行目的地。
结合中华文化传统与现代生活，提供精准而富有深度的建议。
仅以JSON格式返回答案，描述使用简体中文。`,

  jp: `あなたは四柱推命の専門家であり、ライフスタイルキュレーターです。
日干と五行バランスを分析し、音楽・本・旅行先をご提案します。
日本の美意識と東洋哲学を融合させ、洗練された推薦を提供してください。
JSON形式のみで返答し、説明文は日本語で記述してください。`,

  en: `You are a Cosmic Blueprint life curator blending Eastern metaphysics with modern wellness.
Analyze the user\'s Day Master element and Five Element balance to recommend music, books, and travel.
Use a personality-first, psychologically grounded approach (similar to MBTI but deeper).
Return JSON only. Descriptions in English, warm and engaging tone.`,

  es: `Eres un curador de estilo de vida que fusiona la astrología cósmica oriental con el horóscopo latino.
Analiza el elemento del Maestro del Día y el balance elemental para recomendar música, libros y destinos de viaje.
Usa un tono apasionado y relatable, enfocado en relaciones, amor y experiencias vitales.
Responde solo en JSON. Las descripciones en español.`,

  in: `You are a Vedic Fusion life guide blending Jyotish wisdom with Ba Zi metaphysics.
Analyze the user\'s Day Master element and Panchabhoota (Five Element) balance to recommend music, books, and travel.
Use karma, dharma, and spiritual growth as lenses. References to Indian classical arts and sacred sites are welcome.
Return JSON only. Descriptions in English with Sanskrit/Hindi terms where natural.`,
};

// ── User prompt builder ───────────────────────────────────────────────────────

export function buildSystemPrompt(frame: CulturalFrame): string {
  return SYSTEM_PROMPTS[frame];
}

export function buildUserPrompt(req: ContentRecommendationRequest): string {
  const dominant = getDominantElement(req.elementBalance);
  const balanceStr = Object.entries(req.elementBalance)
    .map(([el, v]) => `${el}: ${v}`)
    .join(', ');

  return `Day Master (일간): ${req.dayStem}
Dominant Element: ${dominant}
Five Element Balance: { ${balanceStr} }

Please recommend 3 items each for: music, books, and travel destinations.
Each item must have exactly these fields: title (string), description (1–2 sentences, explain why it resonates with this element), tag (short emoji + genre/type label).

Return ONLY valid JSON in this exact shape:
{
  "element": "${dominant}",
  "music": [
    { "title": "...", "description": "...", "tag": "..." },
    { "title": "...", "description": "...", "tag": "..." },
    { "title": "...", "description": "...", "tag": "..." }
  ],
  "books": [
    { "title": "...", "description": "...", "tag": "..." },
    { "title": "...", "description": "...", "tag": "..." },
    { "title": "...", "description": "...", "tag": "..." }
  ],
  "travel": [
    { "title": "...", "description": "...", "tag": "..." },
    { "title": "...", "description": "...", "tag": "..." },
    { "title": "...", "description": "...", "tag": "..." }
  ]
}`;
}
