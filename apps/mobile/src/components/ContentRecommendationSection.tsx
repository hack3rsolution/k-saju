/**
 * ContentRecommendationSection — issue #18
 *
 * Displays music / book / travel recommendations based on the user's
 * dominant 오행 (Five Element). Appears at the bottom of the My Saju chart screen.
 *
 * Features:
 *  - 3-tab picker: 음악 / 책 / 여행
 *  - 3 recommendation cards per tab
 *  - Share button: react-native-view-shot PNG → native share sheet
 */
import { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { CulturalFrame } from '@k-saju/saju-engine';
import { useContentRecommendation, type RecommendationItem } from '../hooks/useContentRecommendation';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabKey = 'music' | 'books' | 'travel';

// ── Element colours ───────────────────────────────────────────────────────────

const ELEM_COLOR: Record<string, string> = {
  Wood:  '#22c55e',
  Fire:  '#ef4444',
  Earth: '#eab308',
  Metal: '#94a3b8',
  Water: '#3b82f6',
};

// ── Tab labels per cultural frame ─────────────────────────────────────────────

interface TabLabels {
  sectionTitle: string;
  music: string;
  books: string;
  travel: string;
  share: string;
  loading: string;
  errorRetry: string;
  noChart: string;
}

const FRAME_TAB_LABELS: Record<CulturalFrame, TabLabels> = {
  kr: {
    sectionTitle: '당신의 오행에 맞는 추천',
    music: '🎵 음악', books: '📚 책', travel: '✈️ 여행',
    share: '공유하기', loading: '추천 생성 중…', errorRetry: '다시 시도',
    noChart: '온보딩을 완료하면 추천을 받을 수 있습니다.',
  },
  cn: {
    sectionTitle: '五行推荐',
    music: '🎵 音乐', books: '📚 书籍', travel: '✈️ 旅行',
    share: '分享', loading: '生成推荐中…', errorRetry: '重试',
    noChart: '完成引导后即可查看推荐。',
  },
  jp: {
    sectionTitle: '五行おすすめ',
    music: '🎵 音楽', books: '📚 本', travel: '✈️ 旅行',
    share: 'シェア', loading: 'おすすめを生成中…', errorRetry: '再試行',
    noChart: 'オンボーディングを完了するとおすすめが表示されます。',
  },
  en: {
    sectionTitle: 'Recommended for Your Element',
    music: '🎵 Music', books: '📚 Books', travel: '✈️ Travel',
    share: 'Share', loading: 'Generating recommendations…', errorRetry: 'Retry',
    noChart: 'Complete onboarding to get recommendations.',
  },
  es: {
    sectionTitle: 'Recomendaciones para Tu Elemento',
    music: '🎵 Música', books: '📚 Libros', travel: '✈️ Viajes',
    share: 'Compartir', loading: 'Generando recomendaciones…', errorRetry: 'Reintentar',
    noChart: 'Completa el onboarding para obtener recomendaciones.',
  },
  in: {
    sectionTitle: 'Recommended for Your Element',
    music: '🎵 Music', books: '📚 Books', travel: '✈️ Travel',
    share: 'Share', loading: 'Generating recommendations…', errorRetry: 'Retry',
    noChart: 'Complete onboarding to receive your recommendations.',
  },
};

// ── Card (share-capturable) ────────────────────────────────────────────────────

function RecommendCard({
  item,
  elemColor,
  index,
}: {
  item: RecommendationItem;
  elemColor: string;
  index: number;
}) {
  return (
    <View style={[styles.card, { borderColor: elemColor + '55' }]}>
      <View style={[styles.cardIndex, { backgroundColor: elemColor + '22' }]}>
        <Text style={[styles.cardIndexText, { color: elemColor }]}>{index + 1}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTag, { color: elemColor }]}>{item.tag}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc}>{item.description}</Text>
      </View>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  frame: CulturalFrame;
}

export function ContentRecommendationSection({ frame }: Props) {
  const { t } = useTranslation(['chart']);
  const labels = FRAME_TAB_LABELS[frame];
  const tabLabels = {
    music: t('chart:tabs.music'),
    books: t('chart:tabs.books'),
    travel: t('chart:tabs.travel'),
    share: t('chart:share'),
  };
  const [activeTab, setActiveTab] = useState<TabKey>('music');
  const [sharing, setSharing]     = useState(false);
  const shareRef = useRef<View>(null);

  const { loading, data, error, fetch } = useContentRecommendation();

  // Auto-fetch on mount
  useEffect(() => { fetch(); }, []);

  const elemColor = data ? (ELEM_COLOR[data.element] ?? '#a78bfa') : '#a78bfa';

  const items: RecommendationItem[] =
    data
      ? activeTab === 'music'
        ? data.music
        : activeTab === 'books'
        ? data.books
        : data.travel
      : [];

  // ── Share handler ─────────────────────────────────────────────────────────

  async function handleShare() {
    if (!shareRef.current || sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(shareRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: labels.sectionTitle,
          UTI: 'public.png',
        });
      }
    } catch (e) {
      console.warn('[ContentRecommendation] share error:', e);
    } finally {
      setSharing(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: elemColor }]}>
          {t('chart:recommendations')}
        </Text>
        {data && (
          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: elemColor + '66' }]}
            onPress={handleShare}
            disabled={sharing}
            activeOpacity={0.7}
          >
            <Text style={[styles.shareBtnText, { color: elemColor }]}>
              {sharing ? '…' : tabLabels.share}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={elemColor} />
          <Text style={styles.loadingText}>{labels.loading}</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetch}>
            <Text style={[styles.retryText, { color: elemColor }]}>{labels.errorRetry}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab picker */}
      {!loading && data && (
        <>
          <View style={styles.tabs}>
            {(['music', 'books', 'travel'] as TabKey[]).map((tab) => {
              const label =
                tab === 'music' ? tabLabels.music :
                tab === 'books' ? tabLabels.books :
                tabLabels.travel;
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    isActive && { backgroundColor: elemColor + '22', borderColor: elemColor },
                  ]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, isActive && { color: elemColor }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cards — also the share capture target */}
          <View ref={shareRef} collapsable={false} style={styles.shareCapture}>
            <View style={[styles.shareCaptureHeader, { backgroundColor: elemColor + '18' }]}>
              <Text style={[styles.shareCaptureTitle, { color: elemColor }]}>
                {activeTab === 'music' ? tabLabels.music :
                 activeTab === 'books' ? tabLabels.books :
                 tabLabels.travel}
              </Text>
              <Text style={styles.shareCaptureWatermark}>k-saju.app</Text>
            </View>
            {items.map((item, i) => (
              <RecommendCard key={i} item={item} elemColor={elemColor} index={i} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 32,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  shareBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Loading / error
  center: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#9d8fbe',
    fontSize: 13,
    marginTop: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e0a38',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Tabs
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2d1854',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b5b8f',
  },

  // ── Share capture wrapper
  shareCapture: {
    backgroundColor: '#0d0016',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e0a38',
  },
  shareCaptureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  shareCaptureTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  shareCaptureWatermark: {
    fontSize: 10,
    color: '#4a3a6a',
    fontWeight: '500',
  },

  // ── Recommendation card
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  cardIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  cardIndexText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardBody: {
    flex: 1,
  },
  cardTag: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2d9f3',
    marginBottom: 4,
    lineHeight: 20,
  },
  cardDesc: {
    fontSize: 12,
    color: '#9d8fbe',
    lineHeight: 18,
  },
});
