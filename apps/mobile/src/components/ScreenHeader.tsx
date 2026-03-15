import { View, Text, StyleSheet } from 'react-native';
import { T } from '../theme/tokens';

interface Props {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header:   { marginBottom: T.spacing[5] },
  title:    { color: T.text.primary, fontSize: T.fontSize['3xl'], fontWeight: '800', marginBottom: T.spacing[1] },
  subtitle: { color: T.text.muted, fontSize: T.fontSize.base, lineHeight: 22 },
});
