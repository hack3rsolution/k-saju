/**
 * LuckyItemCard — displays a single lucky item (color / number / direction / food).
 *
 * Overflow safety rules (do NOT remove):
 *  1. `textContainer` must keep `flex: 1` — without it, numberOfLines has no effect
 *     because React Native won't constrain the Text's measure width.
 *  2. `card` must keep `overflow: 'hidden'` — hard clip boundary.
 *
 * Tap behaviour: always opens a Modal with the full value text.
 * No truncation detection needed — simpler and more reliable cross-platform.
 *
 * Always use this component wherever luckyItems are rendered.
 * See CLAUDE.md §UI/디자인 수정 시 추가 규칙.
 */
import { ReactNode, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { T } from '../theme/tokens';

interface Props {
  icon: ReactNode;
  label: string;
  value: string | number;
}

export function LuckyItemCard({ icon, label, value }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const strValue = String(value);

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${strValue}`}
        accessibilityHint="탭하여 전체 내용 보기"
      >
        <View style={styles.iconWrap}>{icon}</View>
        <View style={styles.textContainer}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
            {strValue}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          {/* Inner card — stopPropagation so tapping content doesn't close */}
          <TouchableOpacity
            style={styles.sheet}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.sheetIconWrap}>{icon}</View>
            <Text style={styles.sheetLabel}>{label}</Text>
            <Text style={styles.sheetValue}>{strValue}</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>닫기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.bg.base,
    borderRadius: T.radius.md,
    paddingHorizontal: T.spacing[3],
    paddingVertical: T.spacing[2],
    gap: T.spacing[2],
    flex: 1,
    minWidth: '44%',
    borderWidth: 1,
    borderColor: T.border.default,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  label: {
    color: T.text.faint,
    fontSize: T.fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  value: {
    color: T.text.primary,
    fontSize: T.fontSize.sm,
    fontWeight: '700',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: T.spacing[6],
  },
  sheet: {
    backgroundColor: T.bg.elevated,
    borderRadius: T.radius.xl,
    paddingVertical: T.spacing[6],
    paddingHorizontal: T.spacing[6],
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: T.border.subtle,
  },
  sheetIconWrap: {
    marginBottom: T.spacing[3],
  },
  sheetLabel: {
    color: T.text.faint,
    fontSize: T.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: T.spacing[2],
  },
  sheetValue: {
    color: T.text.primary,
    fontSize: T.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: T.spacing[5],
  },
  closeBtn: {
    paddingVertical: T.spacing[2],
    paddingHorizontal: T.spacing[5],
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.border.default,
  },
  closeText: {
    color: T.text.faint,
    fontSize: T.fontSize.sm,
    fontWeight: '600',
  },
});
