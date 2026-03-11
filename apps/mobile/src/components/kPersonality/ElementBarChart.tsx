/**
 * ElementBarChart — 오행 비율 수평 바 차트
 *
 * K-Personality 결과 화면에서 FiveElementRatio를 시각화한다.
 * 마운트 시 애니메이션(animated=true)으로 바가 채워지며,
 * dominant 오행은 테두리 + 밝기 강조 표시.
 */
import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import type { FiveElementRatio, KElement } from '../../types/kPersonality';
import { T } from '../../theme/tokens';

// ── 오행 메타 ─────────────────────────────────────────────────────────────────

const ELEMENT_ORDER: KElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];

const ELEMENT_META: Record<KElement, { label: string; labelEn: string; color: string; glow: string }> = {
  wood:  { label: '木 목', labelEn: 'Wood',  color: T.element['木'], glow: T.element['木'] + '44' },
  fire:  { label: '火 화', labelEn: 'Fire',  color: T.element['火'], glow: T.element['火'] + '44' },
  earth: { label: '土 토', labelEn: 'Earth', color: T.element['土'], glow: T.element['土'] + '44' },
  metal: { label: '金 금', labelEn: 'Metal', color: T.element['金'], glow: T.element['金'] + '44' },
  water: { label: '水 수', labelEn: 'Water', color: T.element['水'], glow: T.element['水'] + '44' },
};

const BAR_HEIGHT: Record<'small' | 'medium' | 'large', number> = {
  small:  4,
  medium: 8,
  large:  12,
};

// ── findDominantElement (로컬) ─────────────────────────────────────────────────

function findDominant(ratio: FiveElementRatio): KElement {
  return ELEMENT_ORDER.reduce(
    (best, el) => (ratio[el] > ratio[best] ? el : best),
    ELEMENT_ORDER[0],
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ElementBarChartProps {
  ratio:       FiveElementRatio;
  size?:       'small' | 'medium' | 'large';
  showLabels?: boolean;
  animated?:   boolean;
}

// ── SingleBar ─────────────────────────────────────────────────────────────────

interface SingleBarProps {
  element:    KElement;
  percent:    number;
  barHeight:  number;
  isDominant: boolean;
  showLabels: boolean;
  animated:   boolean;
}

function SingleBar({ element, percent, barHeight, isDominant, showLabels, animated }: SingleBarProps) {
  const meta    = ELEMENT_META[element];
  const widthAV = useRef(new Animated.Value(animated ? 0 : percent)).current;

  useEffect(() => {
    if (!animated) return;
    Animated.timing(widthAV, {
      toValue:         percent,
      duration:        600,
      delay:           ELEMENT_ORDER.indexOf(element) * 80,
      useNativeDriver: false,
    }).start();
  }, [animated, element, percent, widthAV]);

  const fillWidth = widthAV.interpolate({
    inputRange:  [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.row}>
      {showLabels && (
        <Text style={[styles.label, isDominant && { color: meta.color }]}>
          {meta.label}
        </Text>
      )}

      <View style={styles.trackWrap}>
        <View
          style={[
            styles.track,
            { height: barHeight },
            isDominant && { borderColor: meta.color, borderWidth: 1 },
          ]}
        >
          <Animated.View
            style={[
              styles.fill,
              { height: barHeight, width: fillWidth, backgroundColor: meta.color },
              isDominant && { shadowColor: meta.color, shadowOpacity: 0.6, shadowRadius: 4, elevation: 3 },
            ]}
          />
        </View>
      </View>

      {showLabels && (
        <Text style={[styles.percent, isDominant && { color: meta.color, fontWeight: '700' }]}>
          {percent}%
        </Text>
      )}
    </View>
  );
}

// ── ElementBarChart ───────────────────────────────────────────────────────────

export function ElementBarChart({
  ratio,
  size       = 'medium',
  showLabels = true,
  animated   = true,
}: ElementBarChartProps) {
  const barHeight = BAR_HEIGHT[size];
  const dominant  = findDominant(ratio);

  return (
    <View style={styles.container}>
      {ELEMENT_ORDER.map(el => (
        <SingleBar
          key={el}
          element={el}
          percent={ratio[el]}
          barHeight={barHeight}
          isDominant={el === dominant}
          showLabels={showLabels}
          animated={animated}
        />
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: T.spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           T.spacing[2],
  },
  label: {
    width:      52,
    fontSize:   12,
    color:      T.text.muted,
    fontWeight: '500',
  },
  trackWrap: {
    flex: 1,
  },
  track: {
    backgroundColor: T.bg.elevated,
    borderRadius:    T.radius.full,
    overflow:        'hidden',
  },
  fill: {
    borderRadius: T.radius.full,
  },
  percent: {
    width:    36,
    fontSize: 12,
    color:    T.text.muted,
    textAlign: 'right',
  },
});
