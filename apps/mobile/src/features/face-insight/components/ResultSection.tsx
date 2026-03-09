import { StyleSheet, Text, View } from 'react-native';
import { T } from '../../../theme/tokens';

interface ResultSectionProps {
  label: string;
  value: string | string[];
}

export function ResultSection({ label, value }: ResultSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {Array.isArray(value) ? (
        <View style={styles.tagRow}>
          {value.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: T.spacing[4],
  },
  label: {
    color: T.text.muted,
    fontSize: T.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: T.spacing[2],
  },
  value: {
    color: T.text.primary,
    fontSize: T.fontSize.base,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing[2],
  },
  tag: {
    backgroundColor: T.primary.muted,
    borderRadius: T.radius.md,
    paddingVertical: T.spacing[2],
    paddingHorizontal: T.spacing[3],
  },
  tagText: {
    color: T.primary.light,
    fontSize: T.fontSize.xs,
    fontWeight: '600',
  },
});
