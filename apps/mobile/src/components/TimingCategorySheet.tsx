/**
 * TimingCategorySheet — bottom sheet for selecting a timing-advisor category.
 * Issue #17: Timing Advisor
 */
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TimingCategory } from '../types/timing';

interface CategoryDef {
  key: TimingCategory;
  emoji: string;
}

const CATEGORY_DEFS: CategoryDef[] = [
  { key: 'business',   emoji: '🚀' },
  { key: 'investment', emoji: '💰' },
  { key: 'romance',    emoji: '💞' },
  { key: 'relocation', emoji: '🏠' },
];

interface Props {
  visible: boolean;
  onSelect: (category: TimingCategory) => void;
  onClose: () => void;
}

export function TimingCategorySheet({ visible, onSelect, onClose }: Props) {
  const { t } = useTranslation('fortune');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>⏰ {t('timingAdvisor.title')}</Text>
          <Text style={styles.subtitle}>{t('timingAdvisor.subtitle')}</Text>

          {CATEGORY_DEFS.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={styles.categoryBtn}
              onPress={() => onSelect(c.key)}
            >
              <Text style={styles.categoryEmoji}>{c.emoji}</Text>
              <View style={styles.categoryText}>
                <Text style={styles.categoryLabel}>{t(`timingAdvisor.categories.${c.key}.label`)}</Text>
                <Text style={styles.categoryDesc}>{t(`timingAdvisor.categories.${c.key}.desc`)}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>{t('common:cancel', 'Cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: '#1a0a2e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 44,
    alignItems: 'center',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#3d2471',
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9d8fbe',
    fontSize: 14,
    marginBottom: 24,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    backgroundColor: '#2d1854',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  categoryEmoji: { fontSize: 26 },
  categoryText: { flex: 1 },
  categoryLabel: {
    color: '#e9d5ff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryDesc: {
    color: '#9d8fbe',
    fontSize: 12,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3d2471',
  },
  cancelText: { color: '#9d8fbe', fontWeight: '600', fontSize: 15 },
});
