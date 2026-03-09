#!/usr/bin/env python3
"""Add pillarDetail, pillarLabels, frameTitles to chart.json and resultPreview additions to onboarding.json."""
import json, os

LOCALES_DIR = "/Users/brucelee/Projects/k-saju/apps/mobile/src/i18n/locales"

def deep_merge(base, additions):
    result = dict(base)
    for key, val in additions.items():
        if key in result and isinstance(result[key], dict) and isinstance(val, dict):
            result[key] = deep_merge(result[key], val)
        else:
            result[key] = val
    return result

# ─────────────────────────────────────────────────────────────────────────────
# CHART.JSON additions per language
# ─────────────────────────────────────────────────────────────────────────────

# Base English content (reused for many languages)
EN_STEMS = {
    "甲": {
        "image": "Great tree · pillar · spring sprout",
        "personality": "Driven and strong-willed. Holds unwavering convictions and unstoppable initiative; never afraid to start something new.",
        "strength": "Pioneering spirit, creativity, strong willpower",
        "caution": "Can be stubborn and struggle to compromise."
    },
    "乙": {
        "image": "Grass · vine · flower",
        "personality": "Flexible and highly adaptable. Achieves goals through gentle persistence, valuing cooperation and harmony.",
        "strength": "Social grace, affinity, excellent adaptability",
        "caution": "May appear indecisive; prone to developing dependency."
    },
    "丙": {
        "image": "Sun · bonfire",
        "personality": "Bright, dynamic, and charismatic. Radiates warm energy and is naturally optimistic.",
        "strength": "Passion, expressiveness, leadership",
        "caution": "Needs to watch out for impulsiveness and mood swings."
    },
    "丁": {
        "image": "Candlelight · starlight · furnace",
        "personality": "Delicate, warm, and highly intuitive. Rich artistic sense and exceptional empathy.",
        "strength": "Sensitivity, insight, artistic sensibility",
        "caution": "May be easily hurt due to emotional sensitivity."
    },
    "戊": {
        "image": "High mountain · earth · fortress wall",
        "personality": "Stable and broadly inclusive. Radiates quiet trustworthiness and remains centred in any situation.",
        "strength": "Trustworthiness, perseverance, inclusiveness",
        "caution": "Can be conservative toward change and inflexible."
    },
    "己": {
        "image": "Rice field · sand · yellow earth",
        "personality": "Meticulous and deeply caring. Handles practical matters diligently and looks after those around them.",
        "strength": "Attention to detail, practical sense, thoughtfulness",
        "caution": "Excessive worry and timidity may cause missed opportunities."
    },
    "庚": {
        "image": "Rock · sword · axe",
        "personality": "Upright and principled. Strong sense of justice and resolves matters with decisiveness.",
        "strength": "Decisiveness, sense of justice, drive",
        "caution": "May appear rigid and sharp, causing friction in relationships."
    },
    "辛": {
        "image": "Gem · gold & silver · small blade",
        "personality": "Sharp and perfectionistic. Maintains a refined aesthetic sense and high standards.",
        "strength": "Precision, aesthetic sense, intellect",
        "caution": "Watch out for stress from perfectionism and a demanding nature."
    },
    "壬": {
        "image": "Great river · ocean · lake",
        "personality": "Wise, free-spirited, and ambitious. Reads situations fluidly and views the world with a broad perspective.",
        "strength": "Wisdom, inclusiveness, adaptability",
        "caution": "May drift without direction and lose sight of goals."
    },
    "癸": {
        "image": "Rainwater · clouds · mist",
        "personality": "Highly intuitive and emotionally sensitive. Has the ability to perceive the unseen and a rich imagination.",
        "strength": "Intuition, sensitivity, creativity",
        "caution": "May lack practical grounding; prone to secretiveness."
    }
}

EN_BRANCHES = {
    "子": { "month": "November", "personality": "Clever and highly adaptable. Quick-witted and able to seize opportunities." },
    "丑": { "month": "December", "personality": "Patient and hardworking. Walks their own path steadily and without complaint." },
    "寅": { "month": "January",  "personality": "Brave and decisive. Strong leadership and fierce independence." },
    "卯": { "month": "February", "personality": "Nimble and perceptive. Excellent artistic sensibility and a love of peace." },
    "辰": { "month": "March",    "personality": "Powerful and charismatic. Holds high ideals and a strong drive to achieve." },
    "巳": { "month": "April",    "personality": "Wise and intuitive. Observes situations carefully and thinks deeply." },
    "午": { "month": "May",      "personality": "Active and passionate. Loves freedom and is naturally sociable." },
    "未": { "month": "June",     "personality": "Gentle and artistic. Rich in emotion, caring and considerate of others." },
    "申": { "month": "July",     "personality": "Clever and witty. Versatile and adept at handling change." },
    "酉": { "month": "August",   "personality": "Precise and perfectionistic. Thorough and systematic in all tasks." },
    "戌": { "month": "September","personality": "Loyal and just. A trustworthy friend and reliable companion." },
    "亥": { "month": "October",  "personality": "Blessed and inclusive. Sincere, generous, and carries abundant nurturing energy." }
}

KO_STEMS = {
    "甲": { "image": "큰 나무 · 대들보 · 봄의 새싹", "personality": "진취적이고 리더십이 강하다. 올곧은 신념과 추진력을 지니며, 새로운 것을 시작하는 데 두려움이 없다.", "strength": "개척정신, 창의력, 강한 의지력", "caution": "고집이 세고 타협을 어려워할 수 있다." },
    "乙": { "image": "풀 · 덩굴 · 꽃", "personality": "유연하고 적응력이 뛰어나다. 부드러운 방식으로 목표를 이루며, 협력과 조화를 중시한다.", "strength": "사교성, 친화력, 뛰어난 적응력", "caution": "우유부단해 보일 수 있고, 의존심이 생길 수 있다." },
    "丙": { "image": "태양 · 장작불", "personality": "밝고 활동적이며 카리스마가 넘친다. 주변에 따뜻한 에너지를 전파하며, 낙천적인 성격이다.", "strength": "열정, 표현력, 리더십", "caution": "성급함과 감정 기복에 주의가 필요하다." },
    "丁": { "image": "촛불 · 별빛 · 용광로", "personality": "섬세하고 따뜻하며 직관이 뛰어나다. 예술적 감각이 풍부하고 감정이입 능력이 탁월하다.", "strength": "세심함, 통찰력, 예술적 감수성", "caution": "예민해서 상처를 잘 받을 수 있다." },
    "戊": { "image": "높은 산 · 대지 · 성벽", "personality": "안정적이고 포용력이 넓다. 묵직한 신뢰감을 주며, 어떤 상황에서도 중심을 잡는다.", "strength": "신뢰성, 인내력, 포용력", "caution": "변화에 보수적이고 고집스러울 수 있다." },
    "己": { "image": "논밭 · 모래 · 황토", "personality": "세심하고 배려심이 깊다. 실질적인 문제를 꼼꼼히 처리하며, 주변 사람들을 보살핀다.", "strength": "세밀함, 현실 감각, 배려심", "caution": "지나친 걱정과 소심함으로 기회를 놓칠 수 있다." },
    "庚": { "image": "바위 · 검 · 도끼", "personality": "강직하고 원칙적이다. 정의감이 강하며, 결단력 있게 일을 처리한다.", "strength": "결단력, 정의감, 추진력", "caution": "딱딱하고 날카로워 보여 인간관계에서 마찰이 생길 수 있다." },
    "辛": { "image": "보석 · 금은 · 작은 칼", "personality": "예리하고 완벽주의 성향이 있다. 섬세한 미적 감각과 높은 기준을 유지한다.", "strength": "정밀함, 미적 감각, 지성", "caution": "완벽주의로 인한 스트레스와 까다로운 성격에 주의." },
    "壬": { "image": "큰 강 · 바다 · 호수", "personality": "지혜롭고 자유로우며 포부가 크다. 상황을 유연하게 읽으며, 넓은 시야로 세상을 바라본다.", "strength": "지혜, 포용력, 유연성", "caution": "방향 없이 흘러가 목표를 잃을 수 있다." },
    "癸": { "image": "빗물 · 구름 · 안개", "personality": "직관이 뛰어나고 감수성이 풍부하다. 보이지 않는 것을 느끼는 능력이 있으며, 상상력이 풍부하다.", "strength": "직관력, 감수성, 창의성", "caution": "현실감각이 부족해질 수 있고, 비밀주의적 성향이 있다." }
}

KO_BRANCHES = {
    "子": { "month": "11월", "personality": "영리하고 적응력이 강하다. 재치 있고 기회를 잘 포착한다." },
    "丑": { "month": "12월", "personality": "인내력이 강하고 성실하다. 묵묵히 자신의 길을 걷는다." },
    "寅": { "month": "1월",  "personality": "용감하고 결단력이 있다. 리더십과 독립심이 강하다." },
    "卯": { "month": "2월",  "personality": "민첩하고 영민하다. 예술적 감각이 뛰어나고 평화를 사랑한다." },
    "辰": { "month": "3월",  "personality": "강력하고 카리스마가 있다. 이상이 높고 성취욕이 강하다." },
    "巳": { "month": "4월",  "personality": "지혜롭고 직관적이다. 신중하게 상황을 관찰하며 깊이 생각한다." },
    "午": { "month": "5월",  "personality": "활동적이고 열정적이다. 자유를 사랑하며 사교적이다." },
    "未": { "month": "6월",  "personality": "온화하고 예술적이다. 감성이 풍부하고 사람들을 배려한다." },
    "申": { "month": "7월",  "personality": "영리하고 재치 있다. 다재다능하고 변화에 능숙하다." },
    "酉": { "month": "8월",  "personality": "정확하고 완벽주의적이다. 꼼꼼하고 체계적으로 일을 처리한다." },
    "戌": { "month": "9월",  "personality": "충직하고 정의감이 강하다. 믿을 수 있는 친구이자 동반자다." },
    "亥": { "month": "10월", "personality": "복덕하고 포용적이다. 성실하고 너그러우며 풍요로운 기운을 품는다." }
}

JA_STEMS = {
    "甲": { "image": "大木 · 梁 · 春の芽吹き", "personality": "進取的でリーダーシップが強い。信念を持ち、推進力があり、新しいことへの恐れがない。", "strength": "開拓精神、創造力、強い意志力", "caution": "頑固で妥協が難しい場合がある。" },
    "乙": { "image": "草 · 蔓 · 花", "personality": "柔軟で適応力が高い。穏やかな方法で目標を達成し、協力と調和を重んじる。", "strength": "社交性、親和力、優れた適応力", "caution": "優柔不断に見えることがあり、依存心が生まれることがある。" },
    "丙": { "image": "太陽 · 焚き火", "personality": "明るく活動的でカリスマ性がある。周囲に温かいエネルギーを伝え、楽天的。", "strength": "情熱、表現力、リーダーシップ", "caution": "焦りや感情の起伏に注意が必要。" },
    "丁": { "image": "ろうそく · 星明り · 溶鉱炉", "personality": "繊細で温かく、直感力が高い。芸術的センスが豊かで共感力が抜群。", "strength": "細やかさ、洞察力、芸術的感受性", "caution": "敏感で傷つきやすい場合がある。" },
    "戊": { "image": "高い山 · 大地 · 城壁", "personality": "安定感があり、包容力が広い。重厚な信頼感を与え、どんな状況でも中心を保つ。", "strength": "信頼性、忍耐力、包容力", "caution": "変化に保守的で頑固になることがある。" },
    "己": { "image": "田畑 · 砂 · 黄土", "personality": "細やかで思いやりが深い。実務的な問題を丁寧に処理し、周囲の人を気にかける。", "strength": "細密さ、現実感覚、思いやり", "caution": "過度な心配と臆病さで機会を逃すことがある。" },
    "庚": { "image": "岩 · 剣 · 斧", "personality": "剛直で原則的。正義感が強く、決断力を持って物事を処理する。", "strength": "決断力、正義感、推進力", "caution": "硬く鋭く見えて人間関係で摩擦が生じることがある。" },
    "辛": { "image": "宝石 · 金銀 · 小刀", "personality": "鋭く完璧主義的。繊細な美的センスと高い基準を維持する。", "strength": "精密さ、美的センス、知性", "caution": "完璧主義によるストレスと気難しさに注意。" },
    "壬": { "image": "大河 · 海 · 湖", "personality": "知恵があり自由で、志が大きい。状況を柔軟に読み、広い視野で世を眺める。", "strength": "知恵、包容力、柔軟性", "caution": "方向なく流れ、目標を失うことがある。" },
    "癸": { "image": "雨水 · 雲 · 霧", "personality": "直感力が高く感受性が豊か。見えないものを感じる能力があり、想像力が豊か。", "strength": "直感力、感受性、創造性", "caution": "現実感覚が薄れたり、秘密主義的になることがある。" }
}

JA_BRANCHES = {
    "子": { "month": "11月", "personality": "賢く適応力が強い。機知に富み、チャンスを素早くつかむ。" },
    "丑": { "month": "12月", "personality": "忍耐力が強く誠実。黙々と自分の道を歩む。" },
    "寅": { "month": "1月",  "personality": "勇敢で決断力がある。リーダーシップと独立心が強い。" },
    "卯": { "month": "2月",  "personality": "俊敏で聡明。芸術的センスが高く平和を愛する。" },
    "辰": { "month": "3月",  "personality": "力強くカリスマ性がある。理想が高く達成欲が強い。" },
    "巳": { "month": "4月",  "personality": "知恵があり直感的。慎重に状況を観察し深く考える。" },
    "午": { "month": "5月",  "personality": "活動的で情熱的。自由を愛し社交的。" },
    "未": { "month": "6月",  "personality": "穏やかで芸術的。感受性が豊かで人を気にかける。" },
    "申": { "month": "7月",  "personality": "賢く機知がある。多才で変化に対応するのが得意。" },
    "酉": { "month": "8月",  "personality": "正確で完璧主義的。丁寧で体系的に仕事をこなす。" },
    "戌": { "month": "9月",  "personality": "忠実で正義感が強い。信頼できる友であり仲間。" },
    "亥": { "month": "10月", "personality": "恵まれ包容力がある。誠実で寛大、豊かなエネルギーを持つ。" }
}

ZH_HANS_STEMS = {
    "甲": { "image": "大树 · 栋梁 · 春芽", "personality": "进取、领导力强。坚守信念，推进力十足，不惧开始新事物。", "strength": "开拓精神、创造力、强大意志力", "caution": "可能固执，难以妥协。" },
    "乙": { "image": "草 · 藤蔓 · 花", "personality": "灵活、适应力强。以温和方式实现目标，重视合作与和谐。", "strength": "社交能力、亲和力、出色适应力", "caution": "可能显得优柔寡断，容易产生依赖心。" },
    "丙": { "image": "太阳 · 篝火", "personality": "开朗、充满活力与魅力。向周围传递温暖能量，性格乐观。", "strength": "热情、表达力、领导力", "caution": "需注意急躁和情绪波动。" },
    "丁": { "image": "烛光 · 星光 · 熔炉", "personality": "细腻、温暖、直觉敏锐。富有艺术感，共情能力出众。", "strength": "细心、洞察力、艺术感受性", "caution": "敏感，容易受伤。" },
    "戊": { "image": "高山 · 大地 · 城墙", "personality": "稳定、包容力强。给人厚重信赖感，任何情况下都能保持中心。", "strength": "可靠性、耐力、包容力", "caution": "可能保守，对变化固执。" },
    "己": { "image": "田野 · 沙土 · 黄土", "personality": "细心、体贴入微。认真处理实务问题，关照身边的人。", "strength": "细密性、现实感、体贴心", "caution": "过度担忧和胆怯可能错失机会。" },
    "庚": { "image": "岩石 · 剑 · 斧头", "personality": "刚正、原则性强。正义感强，处事果断。", "strength": "决断力、正义感、推进力", "caution": "显得强硬锐利，可能在人际关系中产生摩擦。" },
    "辛": { "image": "宝石 · 金银 · 小刀", "personality": "敏锐、完美主义倾向。拥有精致的审美感和高标准。", "strength": "精密性、审美感、才智", "caution": "完美主义带来的压力和挑剔性格需注意。" },
    "壬": { "image": "大江 · 大海 · 湖泊", "personality": "智慧、自由、抱负远大。灵活解读局势，以宽广视野看待世界。", "strength": "智慧、包容力、灵活性", "caution": "可能随波逐流，失去目标。" },
    "癸": { "image": "雨水 · 云雾 · 薄雾", "personality": "直觉力强、感受性丰富。能感知无形之物，想象力丰富。", "strength": "直觉力、感受性、创造力", "caution": "可能缺乏现实感，有神秘主义倾向。" }
}

ZH_HANS_BRANCHES = {
    "子": { "month": "11月", "personality": "聪明、适应力强。机智灵敏，善于抓住机会。" },
    "丑": { "month": "12月", "personality": "耐力强、踏实勤奋。默默走着自己的路。" },
    "寅": { "month": "1月",  "personality": "勇敢果断。领导力和独立心强。" },
    "卯": { "month": "2月",  "personality": "敏捷聪慧。艺术感强，热爱和平。" },
    "辰": { "month": "3月",  "personality": "力量强大，富有魅力。理想高远，成就欲强。" },
    "巳": { "month": "4月",  "personality": "智慧直觉。谨慎观察局势，深思熟虑。" },
    "午": { "month": "5月",  "personality": "活跃热情。热爱自由，性格外向。" },
    "未": { "month": "6月",  "personality": "温和艺术。情感丰富，体贴关怀他人。" },
    "申": { "month": "7月",  "personality": "聪明机智。多才多艺，善于应对变化。" },
    "酉": { "month": "8月",  "personality": "精准完美主义。做事细致有条理。" },
    "戌": { "month": "9月",  "personality": "忠诚正义。值得信赖的朋友和伙伴。" },
    "亥": { "month": "10月", "personality": "福德包容。诚实宽厚，蕴含丰盛的能量。" }
}

ZH_HANT_STEMS = {
    "甲": { "image": "大樹 · 棟樑 · 春芽", "personality": "進取、領導力強。堅守信念，推進力十足，不懼開始新事物。", "strength": "開拓精神、創造力、強大意志力", "caution": "可能固執，難以妥協。" },
    "乙": { "image": "草 · 藤蔓 · 花", "personality": "靈活、適應力強。以溫和方式實現目標，重視合作與和諧。", "strength": "社交能力、親和力、出色適應力", "caution": "可能顯得優柔寡斷，容易產生依賴心。" },
    "丙": { "image": "太陽 · 篝火", "personality": "開朗、充滿活力與魅力。向周圍傳遞溫暖能量，性格樂觀。", "strength": "熱情、表達力、領導力", "caution": "需注意急躁和情緒波動。" },
    "丁": { "image": "燭光 · 星光 · 熔爐", "personality": "細膩、溫暖、直覺敏銳。富有藝術感，共情能力出眾。", "strength": "細心、洞察力、藝術感受性", "caution": "敏感，容易受傷。" },
    "戊": { "image": "高山 · 大地 · 城牆", "personality": "穩定、包容力強。給人厚重信賴感，任何情況下都能保持中心。", "strength": "可靠性、耐力、包容力", "caution": "可能保守，對變化固執。" },
    "己": { "image": "田野 · 沙土 · 黃土", "personality": "細心、體貼入微。認真處理實務問題，關照身邊的人。", "strength": "細密性、現實感、體貼心", "caution": "過度擔憂和膽怯可能錯失機會。" },
    "庚": { "image": "岩石 · 劍 · 斧頭", "personality": "剛正、原則性強。正義感強，處事果斷。", "strength": "決斷力、正義感、推進力", "caution": "顯得強硬銳利，可能在人際關係中產生摩擦。" },
    "辛": { "image": "寶石 · 金銀 · 小刀", "personality": "敏銳、完美主義傾向。擁有精緻的審美感和高標準。", "strength": "精密性、審美感、才智", "caution": "完美主義帶來的壓力和挑剔性格需注意。" },
    "壬": { "image": "大江 · 大海 · 湖泊", "personality": "智慧、自由、抱負遠大。靈活解讀局勢，以寬廣視野看待世界。", "strength": "智慧、包容力、靈活性", "caution": "可能隨波逐流，失去目標。" },
    "癸": { "image": "雨水 · 雲霧 · 薄霧", "personality": "直覺力強、感受性豐富。能感知無形之物，想像力豐富。", "strength": "直覺力、感受性、創造力", "caution": "可能缺乏現實感，有神秘主義傾向。" }
}

ZH_HANT_BRANCHES = {
    "子": { "month": "11月", "personality": "聰明、適應力強。機智靈敏，善於抓住機會。" },
    "丑": { "month": "12月", "personality": "耐力強、踏實勤奮。默默走著自己的路。" },
    "寅": { "month": "1月",  "personality": "勇敢果斷。領導力和獨立心強。" },
    "卯": { "month": "2月",  "personality": "敏捷聰慧。藝術感強，熱愛和平。" },
    "辰": { "month": "3月",  "personality": "力量強大，富有魅力。理想高遠，成就欲強。" },
    "巳": { "month": "4月",  "personality": "智慧直覺。謹慎觀察局勢，深思熟慮。" },
    "午": { "month": "5月",  "personality": "活躍熱情。熱愛自由，性格外向。" },
    "未": { "month": "6月",  "personality": "溫和藝術。情感豐富，體貼關懷他人。" },
    "申": { "month": "7月",  "personality": "聰明機智。多才多藝，善於應對變化。" },
    "酉": { "month": "8月",  "personality": "精準完美主義。做事細緻有條理。" },
    "戌": { "month": "9月",  "personality": "忠誠正義。值得信賴的朋友和夥伴。" },
    "亥": { "month": "10月", "personality": "福德包容。誠實寬厚，蘊含豐盛的能量。" }
}

# Pillar detail labels per language
PILLAR_DETAIL_LABELS = {
    "ko": { "heavenlyStem": "천간 (天干)", "earthlyBranch": "지지 (地支)", "fiveElement": "오행", "polarity": "음양", "animal": "동물", "solarTerm": "절기", "symbolLabel": "🌿 상징", "personalityLabel": "✨ 성격", "strengthLabel": "💪 강점", "cautionLabel": "⚠️ 주의", "tendencyLabel": "✨ 성향" },
    "en": { "heavenlyStem": "Heavenly Stem (天干)", "earthlyBranch": "Earthly Branch (地支)", "fiveElement": "Element", "polarity": "Polarity", "animal": "Animal", "solarTerm": "Solar Term", "symbolLabel": "🌿 Symbol", "personalityLabel": "✨ Personality", "strengthLabel": "💪 Strengths", "cautionLabel": "⚠️ Caution", "tendencyLabel": "✨ Tendency" },
    "zh-Hans": { "heavenlyStem": "天干", "earthlyBranch": "地支", "fiveElement": "五行", "polarity": "阴阳", "animal": "生肖", "solarTerm": "节气", "symbolLabel": "🌿 象征", "personalityLabel": "✨ 性格", "strengthLabel": "💪 优势", "cautionLabel": "⚠️ 注意", "tendencyLabel": "✨ 性向" },
    "zh-Hant": { "heavenlyStem": "天干", "earthlyBranch": "地支", "fiveElement": "五行", "polarity": "陰陽", "animal": "生肖", "solarTerm": "節氣", "symbolLabel": "🌿 象徵", "personalityLabel": "✨ 性格", "strengthLabel": "💪 優勢", "cautionLabel": "⚠️ 注意", "tendencyLabel": "✨ 性向" },
    "ja": { "heavenlyStem": "天干", "earthlyBranch": "地支", "fiveElement": "五行", "polarity": "陰陽", "animal": "干支", "solarTerm": "節気", "symbolLabel": "🌿 象徴", "personalityLabel": "✨ 性格", "strengthLabel": "💪 強み", "cautionLabel": "⚠️ 注意", "tendencyLabel": "✨ 傾向" },
    "es": { "heavenlyStem": "Tronco Celestial (天干)", "earthlyBranch": "Rama Terrestre (地支)", "fiveElement": "Elemento", "polarity": "Polaridad", "animal": "Animal", "solarTerm": "Término Solar", "symbolLabel": "🌿 Símbolo", "personalityLabel": "✨ Personalidad", "strengthLabel": "💪 Fortalezas", "cautionLabel": "⚠️ Precaución", "tendencyLabel": "✨ Tendencia" },
    "fr": { "heavenlyStem": "Tige Céleste (天干)", "earthlyBranch": "Branche Terrestre (地支)", "fiveElement": "Élément", "polarity": "Polarité", "animal": "Animal", "solarTerm": "Terme Solaire", "symbolLabel": "🌿 Symbole", "personalityLabel": "✨ Personnalité", "strengthLabel": "💪 Forces", "cautionLabel": "⚠️ Attention", "tendencyLabel": "✨ Tendance" },
    "de": { "heavenlyStem": "Himmelsstamm (天干)", "earthlyBranch": "Erdzweig (地支)", "fiveElement": "Element", "polarity": "Polarität", "animal": "Tier", "solarTerm": "Solarterm", "symbolLabel": "🌿 Symbol", "personalityLabel": "✨ Persönlichkeit", "strengthLabel": "💪 Stärken", "cautionLabel": "⚠️ Vorsicht", "tendencyLabel": "✨ Tendenz" },
    "pt-BR": { "heavenlyStem": "Caule Celestial (天干)", "earthlyBranch": "Ramo Terrestre (地支)", "fiveElement": "Elemento", "polarity": "Polaridade", "animal": "Animal", "solarTerm": "Termo Solar", "symbolLabel": "🌿 Símbolo", "personalityLabel": "✨ Personalidade", "strengthLabel": "💪 Pontos Fortes", "cautionLabel": "⚠️ Atenção", "tendencyLabel": "✨ Tendência" },
    "hi": { "heavenlyStem": "स्वर्गीय तना (天干)", "earthlyBranch": "पार्थिव शाखा (地支)", "fiveElement": "तत्व", "polarity": "ध्रुवता", "animal": "पशु", "solarTerm": "सौर पद", "symbolLabel": "🌿 प्रतीक", "personalityLabel": "✨ व्यक्तित्व", "strengthLabel": "💪 ताकत", "cautionLabel": "⚠️ सावधानी", "tendencyLabel": "✨ प्रवृत्ति" },
    "vi": { "heavenlyStem": "Thiên Can (天干)", "earthlyBranch": "Địa Chi (地支)", "fiveElement": "Ngũ Hành", "polarity": "Âm Dương", "animal": "Con Giáp", "solarTerm": "Tiết Khí", "symbolLabel": "🌿 Biểu tượng", "personalityLabel": "✨ Tính cách", "strengthLabel": "💪 Điểm mạnh", "cautionLabel": "⚠️ Lưu ý", "tendencyLabel": "✨ Xu hướng" },
    "id": { "heavenlyStem": "Batang Surgawi (天干)", "earthlyBranch": "Cabang Bumi (地支)", "fiveElement": "Elemen", "polarity": "Polaritas", "animal": "Hewan", "solarTerm": "Istilah Surya", "symbolLabel": "🌿 Simbol", "personalityLabel": "✨ Kepribadian", "strengthLabel": "💪 Kekuatan", "cautionLabel": "⚠️ Perhatian", "tendencyLabel": "✨ Kecenderungan" },
    "th": { "heavenlyStem": "ก้านสวรรค์ (天干)", "earthlyBranch": "กิ่งโลก (地支)", "fiveElement": "ธาตุ", "polarity": "ขั้ว", "animal": "สัตว์", "solarTerm": "ตำแหน่งสุริยะ", "symbolLabel": "🌿 สัญลักษณ์", "personalityLabel": "✨ บุคลิกภาพ", "strengthLabel": "💪 จุดแข็ง", "cautionLabel": "⚠️ ข้อควรระวัง", "tendencyLabel": "✨ แนวโน้ม" },
    "ar": { "heavenlyStem": "الجذع السماوي (天干)", "earthlyBranch": "الفرع الأرضي (地支)", "fiveElement": "العنصر", "polarity": "القطبية", "animal": "الحيوان", "solarTerm": "المصطلح الشمسي", "symbolLabel": "🌿 الرمز", "personalityLabel": "✨ الشخصية", "strengthLabel": "💪 نقاط القوة", "cautionLabel": "⚠️ تنبيه", "tendencyLabel": "✨ النزعة" },
}

PILLAR_LABELS = {
    "ko": { "year": "연주(年柱)", "month": "월주(月柱)", "day": "일주(日柱)", "hour": "시주(時柱)", "default": "기둥" },
    "en": { "year": "Year Pillar", "month": "Month Pillar", "day": "Day Pillar", "hour": "Hour Pillar", "default": "Pillar" },
    "zh-Hans": { "year": "年柱", "month": "月柱", "day": "日柱", "hour": "时柱", "default": "柱" },
    "zh-Hant": { "year": "年柱", "month": "月柱", "day": "日柱", "hour": "時柱", "default": "柱" },
    "ja": { "year": "年柱", "month": "月柱", "day": "日柱", "hour": "時柱", "default": "柱" },
    "es": { "year": "Pilar del Año", "month": "Pilar del Mes", "day": "Pilar del Día", "hour": "Pilar de la Hora", "default": "Pilar" },
    "fr": { "year": "Pilier de l'Année", "month": "Pilier du Mois", "day": "Pilier du Jour", "hour": "Pilier de l'Heure", "default": "Pilier" },
    "de": { "year": "Jahrespfeiler", "month": "Monatspfeiler", "day": "Tagespfeiler", "hour": "Stundenpfeiler", "default": "Pfeiler" },
    "pt-BR": { "year": "Pilar do Ano", "month": "Pilar do Mês", "day": "Pilar do Dia", "hour": "Pilar da Hora", "default": "Pilar" },
    "hi": { "year": "वर्ष स्तंभ", "month": "माह स्तंभ", "day": "दिन स्तंभ", "hour": "घंटे का स्तंभ", "default": "स्तंभ" },
    "vi": { "year": "Trụ Năm", "month": "Trụ Tháng", "day": "Trụ Ngày", "hour": "Trụ Giờ", "default": "Trụ" },
    "id": { "year": "Pilar Tahun", "month": "Pilar Bulan", "day": "Pilar Hari", "hour": "Pilar Jam", "default": "Pilar" },
    "th": { "year": "เสาปี", "month": "เสาเดือน", "day": "เสาวัน", "hour": "เสาชั่วโมง", "default": "เสา" },
    "ar": { "year": "ركيزة السنة", "month": "ركيزة الشهر", "day": "ركيزة اليوم", "hour": "ركيزة الساعة", "default": "ركيزة" },
}

FRAME_TITLES = {
    "ko": { "kr": "나의 사주팔자", "cn": "나의 사주추명 (四柱推命)", "jp": "나의 사주추명", "en": "나의 코스믹 블루프린트", "es": "나의 데스티노 코스미코", "in": "나의 베딕 퓨전" },
    "en": { "kr": "My Four Pillars", "cn": "My BaZi Chart", "jp": "My Four Pillars", "en": "My Cosmic Blueprint", "es": "My Destino Cósmico", "in": "My Vedic Fusion" },
    "zh-Hans": { "kr": "我的四柱八字", "cn": "我的四柱推命", "jp": "我的四柱推命", "en": "我的宇宙蓝图", "es": "我的命运蓝图", "in": "我的吠陀融合" },
    "zh-Hant": { "kr": "我的四柱八字", "cn": "我的四柱推命", "jp": "我的四柱推命", "en": "我的宇宙藍圖", "es": "我的命運藍圖", "in": "我的吠陀融合" },
    "ja": { "kr": "私の四柱八字", "cn": "私の四柱推命", "jp": "私の四柱推命", "en": "私のコズミックブループリント", "es": "私のデスティノ・コスミコ", "in": "私のヴェーディックフュージョン" },
    "es": { "kr": "Mi Saju", "cn": "Mi BaZi", "jp": "Mi Cuatro Pilares", "en": "Mi Plano Cósmico", "es": "Mi Destino Cósmico", "in": "Mi Fusión Védica" },
    "fr": { "kr": "Mon Saju", "cn": "Mon BaZi", "jp": "Mes Quatre Piliers", "en": "Mon Plan Cosmique", "es": "Mon Destino Cósmico", "in": "Ma Fusion Védique" },
    "de": { "kr": "Mein Saju", "cn": "Mein BaZi", "jp": "Meine Vier Pfeiler", "en": "Mein Kosmischer Plan", "es": "Mein Destino Cósmico", "in": "Meine Vedische Fusion" },
    "pt-BR": { "kr": "Meu Saju", "cn": "Meu BaZi", "jp": "Meus Quatro Pilares", "en": "Meu Plano Cósmico", "es": "Meu Destino Cósmico", "in": "Minha Fusão Védica" },
    "hi": { "kr": "मेरा साजू", "cn": "मेरा BaZi", "jp": "मेरे चार स्तंभ", "en": "मेरा कॉस्मिक ब्लूप्रिंट", "es": "मेरा देस्तीनो कॉस्मिको", "in": "मेरा वैदिक फ्यूजन" },
    "vi": { "kr": "Saju của tôi", "cn": "BaZi của tôi", "jp": "Bốn Trụ của tôi", "en": "Bản đồ Vũ trụ của tôi", "es": "Destino Cósmico của tôi", "in": "Vedic Fusion của tôi" },
    "id": { "kr": "Saju Saya", "cn": "BaZi Saya", "jp": "Empat Pilar Saya", "en": "Blueprint Kosmik Saya", "es": "Destino Cósmico Saya", "in": "Vedic Fusion Saya" },
    "th": { "kr": "ซาจูของฉัน", "cn": "BaZi ของฉัน", "jp": "สี่เสาของฉัน", "en": "แผนภูมิจักรวาลของฉัน", "es": "เดสตีโนคอสมิโกของฉัน", "in": "เวทิกฟิวชันของฉัน" },
    "ar": { "kr": "ساجو الخاص بي", "cn": "باتزي الخاص بي", "jp": "أعمدتي الأربعة", "en": "مخططي الكوني", "es": "مصيري الكوني", "in": "اندماجي الفيدي" },
}

# Maps language to (stems_data, branches_data)
LANG_STEM_BRANCH = {
    "ko": (KO_STEMS, KO_BRANCHES),
    "ja": (JA_STEMS, JA_BRANCHES),
    "zh-Hans": (ZH_HANS_STEMS, ZH_HANS_BRANCHES),
    "zh-Hant": (ZH_HANT_STEMS, ZH_HANT_BRANCHES),
}
# All other languages use English
for lang in ["en","es","fr","de","pt-BR","hi","vi","id","th","ar"]:
    LANG_STEM_BRANCH[lang] = (EN_STEMS, EN_BRANCHES)

ALL_LANGS = ["ko","en","zh-Hans","zh-Hant","ja","es","fr","de","pt-BR","hi","vi","id","th","ar"]

def build_stemDesc_additions(stems):
    """Build stemDesc additions (image/personality/strength/caution per stem)."""
    return {stem: {"image": v["image"], "personality": v["personality"], "strength": v["strength"], "caution": v["caution"]} for stem, v in stems.items()}

def build_branchDesc_additions(branches):
    """Build branchDesc additions (month/personality per branch)."""
    return {branch: {"month": v["month"], "personality": v["personality"]} for branch, v in branches.items()}

for lang in ALL_LANGS:
    path = os.path.join(LOCALES_DIR, lang, "chart.json")
    if not os.path.exists(path):
        print(f"MISSING: {path}")
        continue
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    stems, branches = LANG_STEM_BRANCH[lang]

    # Add pillarDetail section
    data["pillarDetail"] = {
        **PILLAR_DETAIL_LABELS[lang],
    }

    # Add pillarLabels section
    data["pillarLabels"] = PILLAR_LABELS[lang]

    # Add frameTitles section
    data["frameTitles"] = FRAME_TITLES[lang]

    # Merge stemDesc additions
    if "stemDesc" not in data:
        data["stemDesc"] = {}
    for stem, additions in build_stemDesc_additions(stems).items():
        if stem not in data["stemDesc"]:
            data["stemDesc"][stem] = {}
        data["stemDesc"][stem] = deep_merge(data["stemDesc"][stem], additions)

    # Merge branchDesc additions
    if "branchDesc" not in data:
        data["branchDesc"] = {}
    for branch, additions in build_branchDesc_additions(branches).items():
        if branch not in data["branchDesc"]:
            data["branchDesc"][branch] = {}
        data["branchDesc"][branch] = deep_merge(data["branchDesc"][branch], additions)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Updated chart.json: {lang}")

print("Done with chart.json updates")

# ─────────────────────────────────────────────────────────────────────────────
# ONBOARDING.JSON additions
# ─────────────────────────────────────────────────────────────────────────────

ONBOARDING_ADDITIONS = {
    "ko": {
        "resultPreview": {
            "frameTitles": FRAME_TITLES["ko"],
            "unknown": "미상",
            "hourUnknown": "(시간 미상)",
            "pillarsSection": "사주 (四柱)",
            "dayStemHint": "일간 (self) · {{stem}} · {{element}}",
            "elementSection": "오행 균형 (五行)"
        }
    },
    "en": {
        "resultPreview": {
            "frameTitles": FRAME_TITLES["en"],
            "unknown": "Unknown",
            "hourUnknown": "(Hour unknown)",
            "pillarsSection": "Four Pillars (四柱)",
            "dayStemHint": "Day Master · {{stem}} · {{element}}",
            "elementSection": "Five Elements Balance (五行)"
        }
    },
    "zh-Hans": {
        "culturalFrame": { "screenTitle": "选择我的文化框架", "screenSubtitle": "相同的四柱数据 — 以您的文化背景呈现" },
        "resultPreview": {
            "frameTitles": FRAME_TITLES["zh-Hans"],
            "unknown": "未知",
            "hourUnknown": "（时辰未知）",
            "pillarsSection": "四柱",
            "dayStemHint": "日干 · {{stem}} · {{element}}",
            "elementSection": "五行平衡"
        }
    },
    "zh-Hant": {
        "culturalFrame": { "screenTitle": "選擇我的文化框架", "screenSubtitle": "相同的四柱數據 — 以您的文化背景呈現" },
        "resultPreview": {
            "frameTitles": FRAME_TITLES["zh-Hant"],
            "unknown": "未知",
            "hourUnknown": "（時辰未知）",
            "pillarsSection": "四柱",
            "dayStemHint": "日干 · {{stem}} · {{element}}",
            "elementSection": "五行平衡"
        }
    },
    "ja": {
        "culturalFrame": { "screenTitle": "文化フレームを選択", "screenSubtitle": "同じ四柱データ — あなたの文化的背景に合わせて" },
        "resultPreview": {
            "frameTitles": FRAME_TITLES["ja"],
            "unknown": "不明",
            "hourUnknown": "（時刻不明）",
            "pillarsSection": "四柱",
            "dayStemHint": "日干 · {{stem}} · {{element}}",
            "elementSection": "五行バランス"
        }
    },
    "es": {
        "culturalFrame": { "screenTitle": "Elige tu Marco Cultural", "screenSubtitle": "Los mismos datos cósmicos — personalizados a tu contexto cultural" },
        "resultPreview": {
            "frameTitles": FRAME_TITLES["es"],
            "unknown": "Desconocido",
            "hourUnknown": "(Hora desconocida)",
            "pillarsSection": "Cuatro Pilares (四柱)",
            "dayStemHint": "Maestro del Día · {{stem}} · {{element}}",
            "elementSection": "Balance de los Cinco Elementos (五行)"
        }
    },
    "fr": {
        "culturalFrame": { "screenTitle": "Choisissez votre cadre culturel", "screenSubtitle": "Les mêmes données cosmiques — personnalisées selon votre contexte culturel" },
        "resultPreview": {
            "frameTitles": FRAME_TITLES["fr"],
            "unknown": "Inconnu",
            "hourUnknown": "(Heure inconnue)",
            "pillarsSection": "Quatre Piliers (四柱)",
            "dayStemHint": "Maître du Jour · {{stem}} · {{element}}",
            "elementSection": "Équilibre des Cinq Éléments (五行)"
        }
    },
    "de": {
        "culturalFrame": { "screenTitle": "Kulturellen Rahmen wählen", "screenSubtitle": "Dieselben kosmischen Daten — angepasst an deinen kulturellen Kontext" },
        "resultPreview": {
            "frameTitles": FRAME_TITLES["de"],
            "unknown": "Unbekannt",
            "hourUnknown": "(Stunde unbekannt)",
            "pillarsSection": "Vier Pfeiler (四柱)",
            "dayStemHint": "Tagesmeister · {{stem}} · {{element}}",
            "elementSection": "Gleichgewicht der Fünf Elemente (五行)"
        }
    },
    "pt-BR": {
        "culturalFrame": { "screenTitle": "Escolha seu Quadro Cultural", "screenSubtitle": "Os mesmos dados cósmicos — personalizados ao seu contexto cultural" },
        "resultPreview": {
            "frameTitles": FRAME_TITLES["pt-BR"],
            "unknown": "Desconhecido",
            "hourUnknown": "(Hora desconhecida)",
            "pillarsSection": "Quatro Pilares (四柱)",
            "dayStemHint": "Mestre do Dia · {{stem}} · {{element}}",
            "elementSection": "Equilíbrio dos Cinco Elementos (五行)"
        }
    },
    "hi": {
        "culturalFrame": { "screenTitle": "अपना सांस्कृतिक ढांचा चुनें", "screenSubtitle": "एक ही ब्रह्मांडीय डेटा — आपके सांस्कृतिक संदर्भ के अनुसार" },
        "resultPreview": {
            "frameTitles": FRAME_TITLES["hi"],
            "unknown": "अज्ञात",
            "hourUnknown": "(समय अज्ञात)",
            "pillarsSection": "चार स्तंभ (四柱)",
            "dayStemHint": "दिन मास्टर · {{stem}} · {{element}}",
            "elementSection": "पंच तत्व संतुलन (五行)"
        }
    },
    "vi": {
        "culturalFrame": { "screenTitle": "Chọn Khung Văn Hóa", "screenSubtitle": "Cùng dữ liệu vũ trụ — được cá nhân hóa theo bối cảnh văn hóa của bạn" },
        "resultPreview": {
            "frameTitles": FRAME_TITLES["vi"],
            "unknown": "Không rõ",
            "hourUnknown": "(Giờ không rõ)",
            "pillarsSection": "Tứ Trụ (四柱)",
            "dayStemHint": "Nhật Chủ · {{stem}} · {{element}}",
            "elementSection": "Cân Bằng Ngũ Hành (五行)"
        }
    },
    "id": {
        "culturalFrame": { "screenTitle": "Pilih Kerangka Budaya", "screenSubtitle": "Data kosmik yang sama — dipersonalisasi sesuai konteks budaya Anda" },
        "resultPreview": {
            "frameTitles": FRAME_TITLES["id"],
            "unknown": "Tidak diketahui",
            "hourUnknown": "(Jam tidak diketahui)",
            "pillarsSection": "Empat Pilar (四柱)",
            "dayStemHint": "Tuan Hari · {{stem}} · {{element}}",
            "elementSection": "Keseimbangan Lima Elemen (五行)"
        }
    },
    "th": {
        "culturalFrame": { "screenTitle": "เลือกกรอบวัฒนธรรม", "screenSubtitle": "ข้อมูลจักรวาลเดียวกัน — ปรับแต่งตามบริบทวัฒนธรรมของคุณ" },
        "resultPreview": {
            "frameTitles": FRAME_TITLES["th"],
            "unknown": "ไม่ทราบ",
            "hourUnknown": "(ไม่ทราบเวลา)",
            "pillarsSection": "สี่เสา (四柱)",
            "dayStemHint": "เจ้าวัน · {{stem}} · {{element}}",
            "elementSection": "ความสมดุลธาตุทั้งห้า (五行)"
        }
    },
    "ar": {
        "culturalFrame": { "screenTitle": "اختر إطارك الثقافي", "screenSubtitle": "نفس البيانات الكونية — مخصصة وفق سياقك الثقافي" },
        "resultPreview": {
            "frameTitles": FRAME_TITLES["ar"],
            "unknown": "غير معروف",
            "hourUnknown": "(الساعة غير معروفة)",
            "pillarsSection": "الأعمدة الأربعة (四柱)",
            "dayStemHint": "سيد اليوم · {{stem}} · {{element}}",
            "elementSection": "توازن العناصر الخمسة (五行)"
        }
    },
}

for lang in ALL_LANGS:
    path = os.path.join(LOCALES_DIR, lang, "onboarding.json")
    if not os.path.exists(path):
        print(f"MISSING: {path}")
        continue
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    additions = ONBOARDING_ADDITIONS.get(lang, {})
    data = deep_merge(data, additions)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Updated onboarding.json: {lang}")

print("Done with onboarding.json updates")
