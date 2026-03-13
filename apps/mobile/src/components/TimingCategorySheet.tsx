/**
 * TimingCategorySheet — bottom sheet for selecting a timing-advisor category.
 * Issue #17: Timing Advisor
 */
import { type ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TimingCategory } from '../types/timing';
import { HourglassIcon, CareerIcon, FinanceIcon, LoveIcon, FamilyIcon } from './icons';

interface Category {
  key: TimingCategory;
  icon: ReactNode;
  label: string;
  desc: string;
}

const CATEGORIES: Category[] = [
  { key: 'business',   icon: <CareerIcon  color="#e9d5ff" size={26} />, label: '사업 / 창업',   desc: 'Start or expand a business' },
  { key: 'investment', icon: <FinanceIcon color="#e9d5ff" size={26} />, label: '투자 / 재테크', desc: 'Invest money or assets'       },
  { key: 'romance',    icon: <LoveIcon    color="#e9d5ff" size={26} />, label: '연애 / 결혼',   desc: 'Start a relationship or wed' },
  { key: 'relocation', icon: <FamilyIcon  color="#e9d5ff" size={26} />, label: '이사 / 여행',   desc: 'Move home or plan a trip'    },
];

interface Props {
  visible: boolean;
  onSelect: (category: TimingCategory) => void;
  onClose: () => void;
}

export function TimingCategorySheet({ visible, onSelect, onClose }: Props) {
  const { t } = useTranslation('common');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <HourglassIcon color="#C9A84C" size={20} />
            <Text style={styles.title}>{t('home.timingSheetTitle')}</Text>
          </View>
          <Text style={styles.subtitle}>{t('home.timingSheetSubtitle')}</Text>

          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={styles.categoryBtn}
              onPress={() => onSelect(c.key)}
            >
              <View style={styles.categoryEmoji}>{c.icon}</View>
              <View style={styles.categoryText}>
                <Text style={styles.categoryLabel}>{c.label}</Text>
                <Text style={styles.categoryDesc}>{c.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>취소</Text>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
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
  categoryEmoji: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
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
