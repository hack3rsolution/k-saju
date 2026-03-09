#!/usr/bin/env python3
"""Generate iOS App Store metadata files for K-Saju (15 locales)."""
import os, sys

BASE = os.path.join(os.path.dirname(__file__), "ios")

# ─────────────────────────────────────────────────────────────
# METADATA
# ─────────────────────────────────────────────────────────────
metadata = {
    # ── en-US ──────────────────────────────────────────────────
    "en-US": {
        "name": "K-Saju: Korean Fortune AI",
        "subtitle": "AI Astrology Meets K-Culture",
        "keywords": "saju,korean astrology,fortune,horoscope,k-culture,kdrama,four pillars,destiny,compatibility",
        "promotional_text": "Your Korean fortune awaits — powered by AI & K-Culture ✨",
        "release_notes": (
            "v2.3.0 — Now supporting 15 languages, K-Culture integration enhanced, "
            "weekly fortune patterns & saju engine improvements."
        ),
        "description": """\
K-Saju brings the ancient wisdom of Korean Four Pillars (사주팔자) into the modern world — powered by AI and infused with K-Culture.

Based on your exact birth date and time, K-Saju analyzes your unique combination of Heavenly Stems (천간) and Earthly Branches (지지) to reveal your destiny, personality strengths, and life path.

✨ Key Features:
• AI Fortune Readings — Personalized daily, weekly, monthly & annual forecasts
• K-Culture Integration — See your fate through K-Drama, K-Pop & K-Food
• Four Pillars Chart — Full 사주 visualization with five-element balance
• Compatibility Analysis — AI-powered relationship matching
• 大運 Luck Cycles — Explore your 10-year destiny cycles
• 15 Languages — Korean, English, Japanese, Chinese, Spanish & more

🆓 Free:
• 1 reading per week
• Full saju chart view
• Basic compatibility score

⭐ Premium ($8.99/mo or $59.99/yr):
• Unlimited daily, weekly, monthly & annual readings
• Fortune Chat with AI follow-up
• Timing Advisor for key life decisions
• Life Journal with AI pattern analysis

Lunar & solar calendar supported. Your cosmic journey starts now — discover what the stars have written for you.
""",
    },

    # ── ko ─────────────────────────────────────────────────────
    "ko": {
        "name": "K-사주: AI 사주팔자 운세",
        "subtitle": "AI가 풀어주는 나만의 사주 이야기",
        "keywords": "사주,사주팔자,운세,궁합,토정비결,AI운세,사주풀이,오늘의운세,무료운세,한국운세",
        "promotional_text": "AI가 풀어주는 나만의 사주 이야기 ✨",
        "release_notes": (
            "v2.3.0 — 15개 언어 전면 지원, K-Culture 통합 강화, "
            "주간 패턴 운세 및 사주 엔진 개선."
        ),
        "description": """\
K-사주는 한국 전통 사주팔자(四柱八字)를 AI와 K-Culture로 재해석한 운세 앱입니다.

생년월일시를 기반으로 천간(天干)과 지지(地支)의 고유한 조합을 분석하여 당신의 운명, 성격, 인생 경로를 풀어드립니다.

✨ 주요 기능:
• AI 운세 리딩 — 오늘·이번 주·이달·올해 맞춤 운세
• K-Culture 연동 — K-드라마·K-팝·K-푸드로 풀어보는 내 운세
• 사주팔자 차트 — 오행 밸런스 시각화 및 분석
• 궁합 분석 — AI 기반 관계 분석
• 대운(大運) — 10년 대운 사이클 탐색
• 15개 언어 — 한국어·영어·일본어·중국어·아랍어 등 지원

🆓 무료:
• 주 1회 운세 리딩
• 사주 차트 전체 보기
• 기본 궁합 점수

⭐ 프리미엄 (월 $8.99 / 연 $59.99):
• 무제한 일간·주간·월간·연간 운세
• AI 포춘 채팅
• 타이밍 어드바이저
• 인생 저널 & AI 패턴 분석

음력/양력 모두 지원. 지금 바로 나만의 사주 이야기를 시작하세요.
""",
    },

    # ── ja ─────────────────────────────────────────────────────
    "ja": {
        "name": "K-四柱: 韓国式AI占い",
        "subtitle": "AIが読み解く韓国伝統の四柱推命",
        "keywords": "四柱推命,韓国占い,運勢,相性,K-POP,Kドラマ,AI占い,サジュ,無料占い,韓国文化",
        "promotional_text": "韓国式四柱推命をAIで体験 ✨",
        "release_notes": (
            "v2.3.0 — 15言語対応、K-Culture統合強化、"
            "週間パターン運勢・四柱エンジン改善。"
        ),
        "description": """\
K-四柱は、韓国伝統の四柱推命（사주팔자）をAIとK-Cultureで現代に蘇らせた占いアプリです。

生年月日と出生時刻から、あなただけの天干・地支の組み合わせを分析し、運命・性格・人生の道筋を読み解きます。

✨ 主な機能:
• AI占いリーディング — 日・週・月・年の個別運勢
• K-Culture連動 — K-ドラマ・K-POP・K-FOODで読む運勢
• 四柱推命チャート — 五行バランスの可視化
• 相性分析 — AI搭載の縁結び分析
• 大運サイクル — 10年大運の探索
• 15言語対応 — 日本語・韓国語・英語・中国語など

🆓 無料:
• 週1回の運勢リーディング
• 四柱推命チャート全表示
• 基本相性スコア

⭐ プレミアム ($8.99/月 または $59.99/年):
• 日・週・月・年の無制限リーディング
• AIフォーチュンチャット
• タイミングアドバイザー
• ライフジャーナル＆AIパターン分析

旧暦・新暦両対応。今すぐあなたの運命の旅を始めましょう。
""",
    },

    # ── zh-Hans ────────────────────────────────────────────────
    "zh-Hans": {
        "name": "K-四柱: 韩国AI命理",
        "subtitle": "AI解读韩国传统四柱命理",
        "keywords": "四柱,韩国算命,运势,合盘,韩剧,KPOP,AI算命,命理,免费算命,韩国文化",
        "promotional_text": "AI解读韩国四柱命理 ✨",
        "release_notes": (
            "v2.3.0 — 支持15种语言，K-Culture整合增强，"
            "每周运势模式及四柱引擎改进。"
        ),
        "description": """\
K-四柱将韩国传统四柱命理（사주팔자）的千年智慧通过AI和K-Culture带入现代世界。

根据您的精确出生日期和时间，K-四柱分析您独特的天干（천간）和地支（지지）组合，揭示您的命运、性格优势和人生道路。

✨ 核心功能：
• AI命理解读 — 个性化每日、每周、每月和每年运势预测
• K-Culture融合 — 通过韩剧、K-Pop和韩食视角看命运
• 四柱命盘 — 完整사주可视化与五行平衡分析
• 合盘分析 — AI驱动的关系配对
• 大运周期 — 探索您的10年命运周期
• 15种语言 — 中文、韩文、英文、日文等全面支持

🆓 免费：
• 每周1次命理解读
• 完整四柱命盘
• 基础合盘分数

⭐ 高级版 ($8.99/月 或 $59.99/年)：
• 无限制每日和每周解读
• AI命理聊天
• 择时顾问
• 人生日记与AI模式分析

支持阴历和阳历。立即开启您的命运之旅！
""",
    },

    # ── zh-Hant ────────────────────────────────────────────────
    "zh-Hant": {
        "name": "K-四柱: 韓國AI命理",
        "subtitle": "AI解讀韓國傳統四柱命理",
        "keywords": "四柱,韓國算命,運勢,合盤,韓劇,KPOP,AI算命,命理,免費算命,韓國文化",
        "promotional_text": "AI解讀韓國四柱命理 ✨",
        "release_notes": (
            "v2.3.0 — 支援15種語言，K-Culture整合增強，"
            "每週運勢模式及四柱引擎改進。"
        ),
        "description": """\
K-四柱將韓國傳統四柱命理（사주팔자）的千年智慧透過AI和K-Culture帶入現代世界。

根據您的精確出生日期和時間，K-四柱分析您獨特的天干（천간）和地支（지지）組合，揭示您的命運、性格優勢和人生道路。

✨ 核心功能：
• AI命理解讀 — 個性化每日、每週、每月和每年運勢預測
• K-Culture融合 — 透過韓劇、K-Pop和韓食視角看命運
• 四柱命盤 — 完整사주視覺化與五行平衡分析
• 合盤分析 — AI驅動的關係配對
• 大運週期 — 探索您的10年命運週期
• 15種語言 — 繁中、韓文、英文、日文等全面支援

🆓 免費：
• 每週1次命理解讀
• 完整四柱命盤
• 基礎合盤分數

⭐ 高級版 ($8.99/月 或 $59.99/年)：
• 無限制每日和每週解讀
• AI命理聊天
• 擇時顧問
• 人生日記與AI模式分析

支援農曆和陽曆。立即開啟您的命運之旅！
""",
    },

    # ── es-ES ──────────────────────────────────────────────────
    "es-ES": {
        "name": "K-Saju: Horóscopo Coreano IA",
        "subtitle": "Astrología coreana con IA",
        "keywords": "saju,astrología coreana,horóscopo,compatibilidad,k-drama,k-pop,destino,IA,gratis,cultura coreana",
        "promotional_text": "Tu destino coreano te espera — potenciado por IA ✨",
        "release_notes": (
            "v2.3.0 — Soporte para 15 idiomas, integración K-Culture mejorada, "
            "patrones de fortuna semanal y mejoras en el motor saju."
        ),
        "description": """\
K-Saju trae la sabiduría milenaria de los Cuatro Pilares coreanos (사주팔자) al mundo moderno — impulsado por IA e impregnado de K-Culture.

Basándose en tu fecha y hora de nacimiento exactas, K-Saju analiza tu combinación única de Tallos Celestiales (천간) y Ramas Terrestres (지지) para revelar tu destino, fortalezas de personalidad y camino de vida.

✨ Características principales:
• Lecturas de IA — Pronósticos personalizados diarios, semanales, mensuales y anuales
• Integración K-Culture — Ve tu destino a través de K-Drama, K-Pop y K-Food
• Gráfico de Cuatro Pilares — Visualización completa con balance de cinco elementos
• Análisis de Compatibilidad — Emparejamiento de relaciones impulsado por IA
• Ciclos de Suerte 大運 — Explora tus ciclos de destino de 10 años
• 15 Idiomas — Coreano, inglés, japonés, chino, español y más

🆓 Gratis:
• 1 lectura por semana
• Vista completa del gráfico saju
• Puntuación básica de compatibilidad

⭐ Premium ($8.99/mes o $59.99/año):
• Lecturas diarias y semanales ilimitadas
• Fortune Chat con IA
• Asesor de Timing para decisiones clave
• Diario de Vida con análisis de patrones

Calendarios lunar y solar compatibles. ¡Comienza tu viaje cósmico ahora!
""",
    },

    # ── fr-FR ──────────────────────────────────────────────────
    "fr-FR": {
        "name": "K-Saju: Horoscope Coréen IA",
        "subtitle": "Astrologie coréenne par IA",
        "keywords": "saju,astrologie coréenne,horoscope,compatibilité,k-drama,k-pop,destin,IA,gratuit,culture coréenne",
        "promotional_text": "Votre destin coréen vous attend — propulsé par l'IA ✨",
        "release_notes": (
            "v2.3.0 — Prise en charge de 15 langues, intégration K-Culture améliorée, "
            "motifs de fortune hebdomadaires et améliorations du moteur saju."
        ),
        "description": """\
K-Saju réinterprète la sagesse millénaire des Quatre Piliers coréens (사주팔자) à travers l'IA et la K-Culture.

À partir de votre date et heure de naissance, K-Saju analyse votre combinaison unique de Tiges Célestes (천간) et Branches Terrestres (지지) pour révéler votre destin, votre personnalité et votre chemin de vie.

✨ Fonctionnalités clés :
• Lectures IA — Prévisions quotidiennes, hebdomadaires, mensuelles et annuelles personnalisées
• Intégration K-Culture — Votre destin à travers K-Drama, K-Pop et K-Food
• Carte des Quatre Piliers — Visualisation complète de votre saju avec équilibre des éléments
• Analyse de compatibilité — Matching relationnel propulsé par l'IA
• Cycles de chance 大運 — Explorez vos cycles de destin sur 10 ans
• 15 langues — Coréen, anglais, japonais, chinois, espagnol et plus

🆓 Gratuit :
• 1 lecture par semaine
• Vue complète du graphique saju
• Score de compatibilité de base

⭐ Premium (8,99 €/mois ou 59,99 €/an) :
• Lectures quotidiennes et hebdomadaires illimitées
• Chat Fortune avec l'IA
• Conseiller de timing pour les décisions clés
• Journal de vie avec analyse de patterns

Calendrier lunaire et solaire pris en charge. Commencez votre voyage cosmique dès maintenant !
""",
    },

    # ── de-DE ──────────────────────────────────────────────────
    "de-DE": {
        "name": "K-Saju: Korea KI-Horoskop",
        "subtitle": "KI-Astrologie trifft K-Culture",
        "keywords": "saju,koreanische astrologie,horoskop,kompatibilität,k-drama,k-pop,schicksal,KI,kostenlos",
        "promotional_text": "Dein koreanisches Schicksal erwartet dich — KI-gestützt ✨",
        "release_notes": (
            "v2.3.0 — Unterstützung für 15 Sprachen, verbesserte K-Culture-Integration, "
            "wöchentliche Glücksmuster & Saju-Engine-Verbesserungen."
        ),
        "description": """\
K-Saju bringt die jahrtausendealte Weisheit der koreanischen Vier Säulen (사주팔자) durch KI und K-Culture in die moderne Welt.

Basierend auf Ihrem genauen Geburtsdatum und Ihrer Geburtszeit analysiert K-Saju Ihre einzigartige Kombination aus Himmelsstämmen (천간) und Erdzweigen (지지), um Ihr Schicksal, Ihre Persönlichkeitsstärken und Ihren Lebensweg zu enthüllen.

✨ Hauptfunktionen:
• KI-Wahrsagung — Personalisierte tägliche, wöchentliche, monatliche & jährliche Vorhersagen
• K-Culture-Integration — Ihr Schicksal durch K-Drama, K-Pop & K-Food
• Vier-Säulen-Chart — Vollständige Saju-Visualisierung mit Fünf-Elemente-Balance
• Kompatibilitätsanalyse — KI-gestützte Beziehungsanalyse
• 大運 Glückszyklen — Erkunden Sie Ihre 10-Jahres-Schicksalszyklen
• 15 Sprachen — Koreanisch, Englisch, Japanisch, Chinesisch, Spanisch & mehr

🆓 Kostenlos:
• 1 Lesung pro Woche
• Vollständige Saju-Chart-Ansicht
• Grundlegender Kompatibilitäts-Score

⭐ Premium (8,99 €/Monat oder 59,99 €/Jahr):
• Unbegrenzte tägliche & wöchentliche Lesungen
• KI-Fortune-Chat
• Timing-Berater für wichtige Lebensentscheidungen
• Lebensjournal mit Musteranalyse

Mond- und Sonnenkalender unterstützt. Beginnen Sie jetzt Ihre kosmische Reise !
""",
    },

    # ── pt-BR ──────────────────────────────────────────────────
    "pt-BR": {
        "name": "K-Saju: Horóscopo Coreano IA",
        "subtitle": "Astrologia coreana com IA",
        "keywords": "saju,astrologia coreana,horóscopo,compatibilidade,k-drama,k-pop,destino,IA,grátis,cultura coreana",
        "promotional_text": "Seu destino coreano espera — movido por IA ✨",
        "release_notes": (
            "v2.3.0 — Suporte a 15 idiomas, integração K-Culture aprimorada, "
            "padrões de fortuna semanal e melhorias no motor saju."
        ),
        "description": """\
K-Saju traz a sabedoria milenar dos Quatro Pilares coreanos (사주팔자) para o mundo moderno — impulsionado por IA e infundido com K-Culture.

Com base na sua data e hora de nascimento exatas, o K-Saju analisa sua combinação única de Caules Celestes (천간) e Ramos Terrestres (지지) para revelar seu destino, pontos fortes de personalidade e caminho de vida.

✨ Principais Recursos:
• Leituras de IA — Previsões diárias, semanais, mensais e anuais personalizadas
• Integração K-Culture — Veja seu destino pela perspectiva de K-Drama, K-Pop e K-Food
• Gráfico dos Quatro Pilares — Visualização completa com equilíbrio dos cinco elementos
• Análise de Compatibilidade — Correspondência de relacionamentos por IA
• Ciclos de Sorte 大運 — Explore seus ciclos de destino de 10 anos
• 15 Idiomas — Coreano, inglês, japonês, chinês, espanhol e mais

🆓 Grátis:
• 1 leitura por semana
• Visualização completa do gráfico saju
• Pontuação básica de compatibilidade

⭐ Premium ($8.99/mês ou $59.99/ano):
• Leituras diárias e semanais ilimitadas
• Fortune Chat com IA
• Conselheiro de Timing para decisões importantes
• Diário de Vida com análise de padrões

Calendários lunar e solar suportados. Comece sua jornada cósmica agora!
""",
    },

    # ── th ─────────────────────────────────────────────────────
    "th": {
        "name": "K-Saju: ดวงชะตาเกาหลี AI",
        "subtitle": "โหราศาสตร์เกาหลีด้วย AI",
        "keywords": "saju,โหราศาสตร์เกาหลี,ดวง,ความเข้ากัน,k-drama,k-pop,โชคชะตา,AI,ฟรี,วัฒนธรรมเกาหลี",
        "promotional_text": "โชคชะตาเกาหลีของคุณรออยู่ — ขับเคลื่อนด้วย AI ✨",
        "release_notes": (
            "v2.3.0 — รองรับ 15 ภาษา, เพิ่มการผสานรวม K-Culture, "
            "รูปแบบดวงชะตารายสัปดาห์ และการปรับปรุงเครื่องยนต์ Saju"
        ),
        "description": """\
K-Saju นำปรัชญาโบราณของสี่เสาหลักเกาหลี (사주팔자) เข้าสู่โลกสมัยใหม่ด้วย AI และ K-Culture

จากวันเดือนปีเกิดและเวลาที่แน่นอน K-Saju วิเคราะห์การผสมผสานเฉพาะตัวของก้านสวรรค์ (천간) และกิ่งโลก (지지) เพื่อเผยโชคชะตา บุคลิกภาพ และเส้นทางชีวิตของคุณ

✨ ฟีเจอร์หลัก:
• AI ทำนายดวงชะตา — พยากรณ์รายวัน รายสัปดาห์ รายเดือน และรายปีส่วนตัว
• เชื่อมต่อ K-Culture — ดูโชคชะตาผ่านเลนส์ K-Drama, K-Pop และ K-Food
• แผนภูมิสี่เสาหลัก — แสดงผล사주 พร้อมสมดุลธาตุทั้งห้า
• วิเคราะห์ความเข้ากัน — การจับคู่ความสัมพันธ์ด้วย AI
• วงจรโชคชะตา 大運 — สำรวจวงจรโชคชะตา 10 ปี
• 15 ภาษา — เกาหลี อังกฤษ ญี่ปุ่น จีน สเปน และอื่นๆ

🆓 ฟรี:
• อ่านดวงได้ 1 ครั้ง/สัปดาห์
• ดูแผนภูมิ사주 ครบถ้วน
• คะแนนความเข้ากันพื้นฐาน

⭐ พรีเมียม ($8.99/เดือน หรือ $59.99/ปี):
• อ่านดวงรายวันและรายสัปดาห์ไม่จำกัด
• AI Fortune Chat
• ที่ปรึกษาเวลา
• บันทึกชีวิตพร้อมการวิเคราะห์รูปแบบ

รองรับปฏิทินจันทรคติและสุริยคติ เริ่มต้นการเดินทางจักรวาลของคุณวันนี้!
""",
    },

    # ── id ─────────────────────────────────────────────────────
    "id": {
        "name": "K-Saju: Ramalan Korea AI",
        "subtitle": "Astrologi Korea dengan AI",
        "keywords": "saju,astrologi korea,ramalan,kecocokan,k-drama,k-pop,takdir,AI,gratis,budaya korea",
        "promotional_text": "Takdir Koreamu menanti — didukung AI ✨",
        "release_notes": (
            "v2.3.0 — Mendukung 15 bahasa, integrasi K-Culture ditingkatkan, "
            "pola ramalan mingguan & peningkatan mesin saju."
        ),
        "description": """\
K-Saju membawa kebijaksanaan kuno Empat Pilar Korea (사주팔자) ke dunia modern — didukung AI dan K-Culture.

Berdasarkan tanggal dan waktu lahir Anda, K-Saju menganalisis kombinasi unik Batang Surgawi (천간) dan Cabang Bumi (지지) untuk mengungkap takdir, kekuatan kepribadian, dan jalur hidup Anda.

✨ Fitur Utama:
• Pembacaan Fortune AI — Ramalan harian, mingguan, bulanan & tahunan yang dipersonalisasi
• Integrasi K-Culture — Lihat takdir Anda melalui lensa K-Drama, K-Pop & K-Food
• Grafik Empat Pilar — Visualisasi사주 lengkap dengan keseimbangan lima elemen
• Analisis Kecocokan — Pencocokan hubungan berbasis AI
• Siklus Keberuntungan 大運 — Jelajahi siklus takdir 10 tahun Anda
• 15 Bahasa — Korea, Inggris, Jepang, Mandarin, Spanyol & lainnya

🆓 Gratis:
• 1 pembacaan per minggu
• Tampilan grafik saju lengkap
• Skor kecocokan dasar

⭐ Premium ($8.99/bulan atau $59.99/tahun):
• Pembacaan harian & mingguan tak terbatas
• Fortune Chat dengan AI
• Penasihat Timing untuk keputusan penting
• Jurnal Kehidupan dengan analisis pola

Kalender lunar & solar didukung. Mulailah perjalanan kosmik Anda sekarang!
""",
    },

    # ── ar-SA ──────────────────────────────────────────────────
    "ar-SA": {
        "name": "K-Saju: أبراج كورية بالـ AI",
        "subtitle": "فلك كوري بالذكاء الاصطناعي",
        "keywords": "ساجو,الفلك الكوري,أبراج,توافق,دراما كورية,كي بوب,قدر,ذكاء اصطناعي,مجاني,ثقافة كورية",
        "promotional_text": "قدرك الكوري ينتظرك — بقوة الذكاء الاصطناعي ✨",
        "release_notes": (
            "v2.3.0 — دعم 15 لغة، تحسين تكامل K-Culture، "
            "أنماط الحظ الأسبوعية وتحسينات محرك ساجو."
        ),
        "description": """\
K-Saju يُحيي الحكمة القديمة للأعمدة الأربعة الكورية (사주팔자) في العالم الحديث — مدعومًا بالذكاء الاصطناعي وثقافة K-Culture.

استنادًا إلى تاريخ ووقت ميلادك بالضبط، يحلل K-Saju مزيجك الفريد من الجذوع السماوية (천간) والأغصان الأرضية (지지) ليكشف قدرك وشخصيتك ومسار حياتك.

✨ المميزات الرئيسية:
• قراءات الحظ بالذكاء الاصطناعي — توقعات يومية وأسبوعية وشهرية وسنوية مخصصة
• تكامل K-Culture — اكتشف قدرك من خلال K-Drama وK-Pop وK-Food
• مخطط الأعمدة الأربعة — تصور كامل مع توازن العناصر الخمسة
• تحليل التوافق — مطابقة العلاقات بالذكاء الاصطناعي
• دورات الحظ 大運 — استكشف دورات قدرك لعشر سنوات
• 15 لغة — العربية والكورية والإنجليزية واليابانية والصينية والمزيد

🆓 مجاني:
• قراءة واحدة أسبوعيًا
• عرض مخطط سايو كامل
• نقاط التوافق الأساسية

⭐ بريميوم ($8.99/شهر أو $59.99/سنة):
• قراءات يومية وأسبوعية غير محدودة
• محادثة Fortune مع الذكاء الاصطناعي
• مستشار التوقيت للقرارات المهمة
• مجلة الحياة مع تحليل الأنماط

يدعم التقويمين القمري والشمسي. ابدأ رحلتك الكونية الآن!
""",
    },

    # ── hi ─────────────────────────────────────────────────────
    "hi": {
        "name": "K-Saju: कोरियाई AI ज्योतिष",
        "subtitle": "AI कोरियाई ज्योतिष",
        "keywords": "साजू,कोरियाई ज्योतिष,राशिफल,अनुकूलता,के-ड्रामा,के-पॉप,भाग्य,AI,मुफ्त,कोरियाई संस्कृति",
        "promotional_text": "आपका कोरियाई भाग्य इंतज़ार कर रहा है — AI द्वारा संचालित ✨",
        "release_notes": (
            "v2.3.0 — 15 भाषाओं का समर्थन, K-Culture एकीकरण बेहतर, "
            "साप्ताहिक भाग्य पैटर्न और सजू इंजन सुधार।"
        ),
        "description": """\
K-Saju कोरियाई चार स्तंभों (사주팔자) की प्राचीन ज्ञान को AI और K-Culture के साथ आधुनिक दुनिया में लाता है।

आपकी जन्म तिथि और समय के आधार पर, K-Saju स्वर्गीय तनों (천간) और पार्थिव शाखाओं (지지) के आपके अनूठे संयोजन का विश्लेषण करता है ताकि आपकी नियति, व्यक्तित्व और जीवन पथ का पता चले।

✨ मुख्य विशेषताएं:
• AI भाग्य रीडिंग — दैनिक, साप्ताहिक, मासिक और वार्षिक व्यक्तिगत पूर्वानुमान
• K-Culture एकीकरण — K-Drama, K-Pop और K-Food के माध्यम से अपनी नियति देखें
• चार स्तंभ चार्ट — पांच तत्व संतुलन के साथ पूर्ण सजू विज़ुअलाइज़ेशन
• अनुकूलता विश्लेषण — AI-संचालित रिश्ते मिलान
• 大運 भाग्य चक्र — अपने 10-वर्षीय नियति चक्रों का पता लगाएं
• 15 भाषाएं — हिंदी, कोरियाई, अंग्रेजी, जापानी, चीनी और अधिक

🆓 मुफ्त:
• प्रति सप्ताह 1 रीडिंग
• पूर्ण सजू चार्ट दृश्य
• बुनियादी अनुकूलता स्कोर

⭐ प्रीमियम ($8.99/माह या $59.99/वर्ष):
• असीमित दैनिक और साप्ताहिक रीडिंग
• AI Fortune Chat
• महत्वपूर्ण निर्णयों के लिए टाइमिंग सलाहकार
• पैटर्न विश्लेषण के साथ जीवन पत्रिका

चंद्र और सौर कैलेंडर समर्थित। अभी अपनी ब्रह्मांडीय यात्रा शुरू करें!
""",
    },

    # ── vi ─────────────────────────────────────────────────────
    "vi": {
        "name": "K-Saju: Tử Vi Hàn Quốc AI",
        "subtitle": "Chiêm tinh Hàn Quốc bằng AI",
        "keywords": "saju,chiêm tinh hàn quốc,tử vi,tương hợp,k-drama,k-pop,vận mệnh,AI,miễn phí,văn hóa hàn",
        "promotional_text": "Vận mệnh Hàn Quốc đang chờ bạn — bởi AI ✨",
        "release_notes": (
            "v2.3.0 — Hỗ trợ 15 ngôn ngữ, tích hợp K-Culture nâng cao, "
            "mẫu vận may hàng tuần & cải tiến động cơ saju."
        ),
        "description": """\
K-Saju mang trí tuệ cổ xưa của Tứ Trụ Hàn Quốc (사주팔자) vào thế giới hiện đại — được hỗ trợ bởi AI và K-Culture.

Dựa trên ngày giờ sinh chính xác của bạn, K-Saju phân tích sự kết hợp độc đáo của Thiên Can (천간) và Địa Chi (지지) để tiết lộ vận mệnh, tính cách và con đường cuộc đời của bạn.

✨ Tính năng chính:
• Đọc Vận Mệnh AI — Dự báo hàng ngày, hàng tuần, hàng tháng và hàng năm cá nhân hóa
• Tích hợp K-Culture — Xem vận mệnh qua lăng kính K-Drama, K-Pop và K-Food
• Biểu đồ Tứ Trụ — Trực quan hóa사주 đầy đủ với cân bằng ngũ hành
• Phân tích Tương hợp — Ghép đôi mối quan hệ bằng AI
• Chu kỳ May mắn 大運 — Khám phá chu kỳ vận mệnh 10 năm
• 15 Ngôn ngữ — Tiếng Hàn, Anh, Nhật, Trung, Tây Ban Nha và hơn thế nữa

🆓 Miễn phí:
• 1 lần đọc mỗi tuần
• Xem biểu đồ saju đầy đủ
• Điểm tương hợp cơ bản

⭐ Premium ($8.99/tháng hoặc $59.99/năm):
• Đọc hàng ngày & hàng tuần không giới hạn
• Fortune Chat với AI
• Cố vấn Thời điểm cho các quyết định quan trọng
• Nhật ký Cuộc sống với phân tích mẫu

Hỗ trợ lịch âm và dương. Bắt đầu hành trình vũ trụ của bạn ngay hôm nay!
""",
    },

    # ── it ─────────────────────────────────────────────────────
    "it": {
        "name": "K-Saju: Oroscopo Coreano IA",
        "subtitle": "Astrologia coreana con IA",
        "keywords": "saju,astrologia coreana,oroscopo,compatibilità,k-drama,k-pop,destino,IA,gratis,cultura coreana",
        "promotional_text": "Il tuo destino coreano ti aspetta — alimentato dall'IA ✨",
        "release_notes": (
            "v2.3.0 — Supporto per 15 lingue, integrazione K-Culture migliorata, "
            "schemi della fortuna settimanale e miglioramenti al motore saju."
        ),
        "description": """\
K-Saju porta la saggezza millenaria dei Quattro Pilastri coreani (사주팔자) nel mondo moderno — alimentato dall'IA e infuso di K-Culture.

Basandosi sulla tua data e ora di nascita esatte, K-Saju analizza la tua combinazione unica di Steli Celesti (천간) e Rami Terrestri (지지) per rivelare il tuo destino, i punti di forza della personalità e il percorso di vita.

✨ Funzionalità principali:
• Letture IA — Previsioni giornaliere, settimanali, mensili e annuali personalizzate
• Integrazione K-Culture — Vedi il tuo destino attraverso K-Drama, K-Pop e K-Food
• Grafico dei Quattro Pilastri — Visualizzazione completa con equilibrio dei cinque elementi
• Analisi di Compatibilità — Abbinamento relazionale basato sull'IA
• Cicli di Fortuna 大運 — Esplora i tuoi cicli di destino di 10 anni
• 15 Lingue — Coreano, inglese, giapponese, cinese, spagnolo e altro

🆓 Gratuito:
• 1 lettura a settimana
• Visualizzazione completa del grafico saju
• Punteggio di compatibilità di base

⭐ Premium ($8.99/mese o $59.99/anno):
• Letture giornaliere e settimanali illimitate
• Fortune Chat con IA
• Consigliere di Tempistica per decisioni importanti
• Diario di Vita con analisi dei pattern

Calendario lunare e solare supportati. Inizia ora il tuo viaggio cosmico!
""",
    },
}

# ─────────────────────────────────────────────────────────────
# WRITE FILES
# ─────────────────────────────────────────────────────────────
FIELDS = ["name", "subtitle", "keywords", "promotional_text", "release_notes", "description"]
created = 0

for locale, data in metadata.items():
    locale_dir = os.path.join(BASE, locale)
    os.makedirs(locale_dir, exist_ok=True)
    for field in FIELDS:
        filepath = os.path.join(locale_dir, f"{field}.txt")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(data[field])
        created += 1

print(f"✓ Created {created} files across {len(metadata)} locales.\n")

# ─────────────────────────────────────────────────────────────
# VALIDATE CHARACTER LIMITS
# ─────────────────────────────────────────────────────────────
LIMITS = {
    "name":             30,
    "subtitle":         30,
    "keywords":         100,
    "promotional_text": 170,
    "description":      4000,
    # release_notes: no hard limit enforced by App Store (advisory ~4000)
}

failures = []
rows = []

for locale, data in metadata.items():
    for field, limit in LIMITS.items():
        content = data[field].rstrip("\n")
        length = len(content)
        ok = length <= limit
        status = "✓" if ok else "✗ OVER"
        rows.append((locale, field, length, limit, status))
        if not ok:
            failures.append((locale, field, length, limit))

# Print table
header = f"{'Locale':<10} {'Field':<20} {'Chars':>6} {'Limit':>6} {'Status'}"
print(header)
print("-" * len(header))
for locale, field, length, limit, status in rows:
    print(f"{locale:<10} {field:<20} {length:>6} {limit:>6}  {status}")

print()
if failures:
    print(f"⚠️  {len(failures)} VIOLATION(S):")
    for locale, field, length, limit in failures:
        print(f"   [{locale}] {field}: {length} chars (limit {limit}, over by {length - limit})")
    sys.exit(1)
else:
    print("✅ All character limits passed.")
