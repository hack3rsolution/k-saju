/**
 * KTypeBadge — K-Personality 사상체질 유형 배지
 *
 * 체질(taeyang/soyang/taeeum/soeum)별 색상 + 이모지 + 유형명 표시.
 * LinearGradient 미설치로 단색 배경 사용.
 */
import { View, Text, StyleSheet } from 'react-native';
import type { SasangType } from '../../types/kPersonality';
import { T } from '../../theme/tokens';

// ── 체질 메타 ─────────────────────────────────────────────────────────────────

const SASANG_META: Record<SasangType, { emoji: string; nameKo: string; color: string; bg: string }> = {
  taeyang: { emoji: '🌳', nameKo: '태양인', color: '#52B788', bg: '#2D6A4F' },
  soyang:  { emoji: '🔥', nameKo: '소양인', color: '#EF5350', bg: '#C62828' },
  taeeum:  { emoji: '🌍', nameKo: '태음인', color: '#A1887F', bg: '#795548' },
  soeum:   { emoji: '💧', nameKo: '소음인', color: '#42A5F5', bg: '#1565C0' },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface KTypeBadgeProps {
  sasangType: SasangType;
  typeName:   string;
  typeNameKo: string;
  size?:      'small' | 'large';
}

// ── KTypeBadge ────────────────────────────────────────────────────────────────

export function KTypeBadge({ sasangType, typeName, typeNameKo, size = 'large' }: KTypeBadgeProps) {
  const meta    = SASANG_META[sasangType];
  const isLarge = size === 'large';

  return (
    <View style={[styles.container, { backgroundColor: meta.bg + 'cc' }, isLarge ? styles.containerLarge : styles.containerSmall]}>
      <Text style={[styles.emoji, isLarge ? styles.emojiLarge : styles.emojiSmall]}>
        {meta.emoji}
      </Text>

      <Text style={[styles.typeName, isLarge ? styles.typeNameLarge : styles.typeNameSmall, { color: meta.color }]}>
        {typeName}
      </Text>

      <Text style={[styles.typeNameKo, isLarge ? styles.typeNameKoLarge : styles.typeNameKoSmall]}>
        {typeNameKo}
      </Text>

      <View style={[styles.sasangBadge, { backgroundColor: meta.color + '33' }]}>
        <Text style={[styles.sasangLabel, { color: meta.color }]}>
          {meta.nameKo}
        </Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems:    'center',
    borderRadius:  T.radius.xl,
    borderWidth:   1,
    borderColor:   T.border.default,
  },
  containerLarge: {
    paddingVertical:   T.spacing[6],
    paddingHorizontal: T.spacing[8],
    gap:               T.spacing[2],
  },
  containerSmall: {
    paddingVertical:   T.spacing[3],
    paddingHorizontal: T.spacing[4],
    gap:               T.spacing[1],
  },

  emoji: {},
  emojiLarge: { fontSize: 48 },
  emojiSmall: { fontSize: 28 },

  typeName: {
    fontWeight: '800',
  },
  typeNameLarge: { fontSize: T.fontSize.xl },
  typeNameSmall: { fontSize: T.fontSize.md },

  typeNameKo: {
    color:      T.text.secondary,
    fontWeight: '500',
  },
  typeNameKoLarge: { fontSize: T.fontSize.sm },
  typeNameKoSmall: { fontSize: T.fontSize.xs },

  sasangBadge: {
    paddingHorizontal: T.spacing[3],
    paddingVertical:   T.spacing[1],
    borderRadius:      T.radius.full,
    marginTop:         T.spacing[1],
  },
  sasangLabel: {
    fontSize:   11,
    fontWeight: '600',
  },
});
