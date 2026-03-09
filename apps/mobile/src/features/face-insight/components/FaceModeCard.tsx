import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { T } from '../../../theme/tokens';

export interface FaceModeCardProps {
  mode: 'traditional' | 'state';
  onPress: () => void;
  isPremiumLocked?: boolean;
}

const STYLE_CONFIG = {
  state: {
    accent: T.primary.DEFAULT,
    iconBg: T.primary.muted,
    emoji: '🧠',
  },
  traditional: {
    accent: T.obang.hwang,
    iconBg: T.obang.hwang + '22',
    emoji: '🔮',
  },
} as const;

export function FaceModeCard({ mode, onPress, isPremiumLocked = false }: FaceModeCardProps) {
  const { t } = useTranslation('common');
  const c = STYLE_CONFIG[mode];
  const titleKey = mode === 'state' ? 'face.stateCheck.title' : 'face.traditional.title';
  const descKey = mode === 'state' ? 'face.stateCheck.description' : 'face.traditional.description';
  const ctaKey = mode === 'state' ? 'face.stateCheck.cta' : 'face.traditional.cta';
  const disclaimerKey = mode === 'state' ? 'face.stateCheck.disclaimer' : 'face.traditional.disclaimer';

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: c.accent + '55' }, T.shadow.md]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={[styles.accentBar, { backgroundColor: c.accent }]} />

      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: c.iconBg }]}>
            <Text style={styles.emoji}>{c.emoji}</Text>
          </View>
          <Text style={styles.title}>{t(titleKey)}</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{t(descKey)}</Text>

        {/* CTA */}
        <View style={[styles.ctaBtn, { backgroundColor: c.accent }]}>
          {isPremiumLocked && <Text style={styles.lockIcon}>🔒  </Text>}
          <Text style={styles.ctaText}>{t(ctaKey)}</Text>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>{t(disclaimerKey)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.bg.card,
    borderRadius: T.radius.xl,
    borderWidth: 1,
    marginBottom: T.spacing[4],
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: T.radius.xl,
    borderBottomLeftRadius: T.radius.xl,
  },
  body: {
    flex: 1,
    padding: T.spacing[5],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing[3],
    marginBottom: T.spacing[3],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: T.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  title: {
    flex: 1,
    color: T.text.primary,
    fontSize: T.fontSize.lg,
    fontWeight: '700',
    lineHeight: 24,
  },
  description: {
    color: T.text.muted,
    fontSize: T.fontSize.base,
    lineHeight: 20,
    marginBottom: T.spacing[4],
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: T.radius.lg,
    paddingVertical: T.spacing[3],
    paddingHorizontal: T.spacing[5],
    alignSelf: 'flex-start',
    marginBottom: T.spacing[3],
  },
  lockIcon: {
    fontSize: T.fontSize.base,
  },
  ctaText: {
    color: T.text.primary,
    fontSize: T.fontSize.base,
    fontWeight: '700',
  },
  disclaimer: {
    color: T.text.caption,
    fontSize: T.fontSize.xs,
    lineHeight: 16,
  },
});
