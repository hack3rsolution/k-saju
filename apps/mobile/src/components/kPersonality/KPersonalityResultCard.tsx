/**
 * KPersonalityResultCard — K-Personality 결과 카드
 *
 * screen 모드: 스크롤 가능한 결과 화면용 카드 (공유/잠금 해제 버튼 포함)
 * share-image 모드: ViewShot 캡처 대상 (fixed 360×640, 버튼 없음)
 *
 * 공유 흐름: captureRef → expo-sharing.shareAsync (PNG)
 */
import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { KPersonalityFree } from '../../types/kPersonality';
import { KTypeBadge } from './KTypeBadge';
import { ElementBarChart } from './ElementBarChart';
import { T } from '../../theme/tokens';

// ── Props ─────────────────────────────────────────────────────────────────────

interface KPersonalityResultCardProps {
  result:     KPersonalityFree;
  mode:       'screen' | 'share-image';
  onShare?:   () => void;
  onUnlock?:  () => void;
}

// ── KPersonalityResultCard ────────────────────────────────────────────────────

export function KPersonalityResultCard({
  result,
  mode,
  onShare,
  onUnlock,
}: KPersonalityResultCardProps) {
  const shareRef   = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const isShareImage = mode === 'share-image';

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      if (shareRef.current) {
        const uri = await captureRef(shareRef, {
          format:  'png',
          quality: 1,
          result:  'tmpfile',
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType:    'image/png',
            dialogTitle: `My K-Type: ${result.typeName}`,
            UTI:         'public.png',
          });
        }
      } else {
        onShare?.();
      }
    } catch {
      onShare?.();
    } finally {
      setSharing(false);
    }
  }

  // ── Share Image (캡처 대상) ─────────────────────────────────────────────────

  const shareImageContent = (
    <View ref={shareRef} style={styles.shareImage}>
      <Text style={styles.shareHeader}>✦ K-Type</Text>

      <KTypeBadge
        sasangType={result.sasangType}
        typeName={result.typeName}
        typeNameKo={result.typeNameKo}
        size="large"
      />

      <View style={styles.shareSection}>
        <ElementBarChart
          ratio={result.elementRatio}
          size="medium"
          animated={false}
        />
      </View>

      <View style={styles.keywordsRow}>
        {result.keywords.map(kw => (
          <View key={kw} style={styles.keywordTag}>
            <Text style={styles.keywordText}>#{kw}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.summaryText}>{result.summaryShort}</Text>

      <Text style={styles.watermark}>by K-Saju</Text>
    </View>
  );

  if (isShareImage) return shareImageContent;

  // ── Screen 모드 ───────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* 숨겨진 캡처 타깃 */}
      <View style={styles.hidden}>
        {shareImageContent}
      </View>

      <KTypeBadge
        sasangType={result.sasangType}
        typeName={result.typeName}
        typeNameKo={result.typeNameKo}
        size="large"
      />

      <View style={styles.section}>
        <ElementBarChart
          ratio={result.elementRatio}
          size="medium"
          animated
        />
      </View>

      <View style={styles.keywordsRow}>
        {result.keywords.map(kw => (
          <View key={kw} style={styles.keywordTag}>
            <Text style={styles.keywordText}>#{kw}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.summaryText}>{result.summaryShort}</Text>

      <TouchableOpacity
        style={[styles.btn, styles.btnSecondary]}
        onPress={handleShare}
        disabled={sharing}
      >
        {sharing
          ? <ActivityIndicator size="small" color={T.text.primary} />
          : <Text style={styles.btnText}>공유하기</Text>}
      </TouchableOpacity>

      {onUnlock && (
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onUnlock}>
          <Text style={styles.btnText}>전체 리포트 보기 ✦</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Screen 모드
  screen: {
    gap: T.spacing[4],
  },
  section: {
    backgroundColor: T.bg.card,
    borderRadius:    T.radius.lg,
    padding:         T.spacing[4],
  },
  hidden: {
    position: 'absolute',
    opacity:  0,
    zIndex:   -1,
  },

  // 공통 키워드
  keywordsRow: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            T.spacing[2],
  },
  keywordTag: {
    backgroundColor: T.primary.muted,
    borderRadius:    T.radius.full,
    paddingHorizontal: T.spacing[3],
    paddingVertical:   T.spacing[1],
  },
  keywordText: {
    color:      T.primary.light,
    fontSize:   T.fontSize.sm,
    fontWeight: '600',
  },

  // 요약
  summaryText: {
    color:      T.text.secondary,
    fontSize:   T.fontSize.base,
    lineHeight: 22,
  },

  // 버튼
  btn: {
    borderRadius:      T.radius.lg,
    paddingVertical:   T.spacing[4],
    alignItems:        'center',
  },
  btnPrimary: {
    backgroundColor: T.primary.DEFAULT,
  },
  btnSecondary: {
    backgroundColor: T.bg.elevated,
    borderWidth:     1,
    borderColor:     T.border.default,
  },
  btnText: {
    color:      T.text.primary,
    fontSize:   T.fontSize.md,
    fontWeight: '700',
  },

  // Share Image 모드 (fixed 360×640)
  shareImage: {
    width:           360,
    height:          640,
    backgroundColor: T.bg.surface,
    padding:         T.spacing[6],
    gap:             T.spacing[4],
    alignItems:      'center',
    justifyContent:  'center',
  },
  shareHeader: {
    color:      T.text.muted,
    fontSize:   T.fontSize.sm,
    letterSpacing: 3,
    fontWeight: '600',
  },
  shareSection: {
    width: '100%',
    backgroundColor: T.bg.card,
    borderRadius:    T.radius.lg,
    padding:         T.spacing[4],
  },
  watermark: {
    position:   'absolute',
    bottom:     T.spacing[4],
    color:      T.text.caption,
    fontSize:   T.fontSize.xs,
    letterSpacing: 2,
  },
});
